import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  trucks,
  complianceDocs,
  companyOperatingProvinces,
} from "@/db/schema";
import { COMPANY_DOC_TYPES, TRUCK_DOC_TYPES } from "./constants";

export interface OnboardingState {
  hasCompanyDocs: boolean;
  truckCount: number;
  allTrucksHaveDocs: boolean;
  percentComplete: number;
  missingCompanyDocs: string[];
  trucksMissingDocs: { truckId: number; missing: string[] }[];
}

export async function getOnboardingState(
  companyId: number
): Promise<OnboardingState> {
  const docRows = await db
    .select({ docType: complianceDocs.docType, status: complianceDocs.status, truckId: complianceDocs.truckId })
    .from(complianceDocs)
    .where(eq(complianceDocs.companyId, companyId));

  const companyDocTypes = new Set(
    docRows.filter((d) => d.truckId === null && d.status !== "rejected").map((d) => d.docType)
  );
  const missingCompanyDocs = COMPANY_DOC_TYPES
    .map((d) => d.key)
    .filter((k) => !companyDocTypes.has(k));

  const truckRows = await db
    .select({ id: trucks.id })
    .from(trucks)
    .where(eq(trucks.companyId, companyId));

  const trucksMissingDocs: { truckId: number; missing: string[] }[] = [];
  for (const t of truckRows) {
    const tDocs = new Set(
      docRows
        .filter((d) => d.truckId === t.id && d.status !== "rejected")
        .map((d) => d.docType)
    );
    const missing = TRUCK_DOC_TYPES.map((d) => d.key).filter((k) => !tDocs.has(k));
    if (missing.length > 0) {
      trucksMissingDocs.push({ truckId: t.id, missing });
    }
  }

  const hasCompanyDocs = missingCompanyDocs.length === 0;
  const truckCount = truckRows.length;
  const allTrucksHaveDocs = truckCount > 0 && trucksMissingDocs.length === 0;

  // Simple %: company docs 50%, trucks with docs 50%.
  const companyPart = hasCompanyDocs ? 50 : (companyDocTypes.size / COMPANY_DOC_TYPES.length) * 50;
  const truckPart =
    truckCount === 0
      ? 0
      : allTrucksHaveDocs
      ? 50
      : Math.max(0, 50 - (trucksMissingDocs.length / Math.max(1, truckCount)) * 50);
  const percentComplete = Math.round(companyPart + truckPart);

  return {
    hasCompanyDocs,
    truckCount,
    allTrucksHaveDocs,
    percentComplete,
    missingCompanyDocs,
    trucksMissingDocs,
  };
}
