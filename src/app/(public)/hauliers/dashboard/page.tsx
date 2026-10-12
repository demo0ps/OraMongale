import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { getCompanySession, getCompanyForSession } from "@/company-auth";
import { db } from "@/db";
import { trucks, provinces, companyOperatingProvinces, complianceDocs, companies } from "@/db/schema";
import { getOnboardingState } from "@/lib/onboarding";
import { TRUCK_TYPE_LABEL, PROVINCE_BY_CODE } from "@/lib/constants";
import AddTruckAndDocsForm from "./AddTruckAndDocsForm";
import UploadCompanyDocForm from "./UploadCompanyDocForm";

export const metadata = { title: "My fleet" };

export default async function HaulierDashboard() {
  let session = await getCompanySession();
  let company: { id: number; name: string; contactName: string; contactEmail: string | null; contactPhone: string | null; status: string } | null = null;

  if (session) {
    const ctx = await getCompanyForSession(session);
    if (ctx) company = ctx.company as unknown as typeof company;
  }

  // No password wall: if no valid session (first visit, cleared cookies),
  // fall back to the first company in the DB so the page still renders.
  if (!company) {
    const first = await db
      .select()
      .from(companies)
      .orderBy(asc(companies.id))
      .limit(1);
    company = first[0] ?? null;
  }

  if (!company) {
    return (
      <div className="card p-10 text-center">
        <h1 className="text-2xl font-semibold text-ink">No haulier account yet</h1>
        <p className="mt-2 text-coal max-w-md mx-auto">
          Add your company in one step &mdash; no password, no verification email
          &mdash; and you&rsquo;ll go straight through to your fleet dashboard.
        </p>
        <div className="mt-6">
          <Link href="/hauliers/join" className="btn-primary">List my fleet</Link>
        </div>
      </div>
    );
  }

  const myTrucks = await db
    .select()
    .from(trucks)
    .where(eq(trucks.companyId, company.id));

  const ops = await db
    .select({ code: provinces.code })
    .from(companyOperatingProvinces)
    .innerJoin(provinces, eq(companyOperatingProvinces.provinceId, provinces.id))
    .where(eq(companyOperatingProvinces.companyId, company.id));

  const state = await getOnboardingState(company.id);

  const statusPill = (s: string) => {
    const map: Record<string, string> = {
      docs_pending: "bg-amber-50 text-amber-800 border-amber-200",
      available: "bg-emerald-50 text-emerald-800 border-emerald-200",
      on_job: "bg-blue-50 text-blue-800 border-blue-200",
      rejected: "bg-red-50 text-red-800 border-red-200",
      docs_expired: "bg-red-50 text-red-800 border-red-200",
    };
    const label: Record<string, string> = {
      docs_pending: "Docs pending",
      available: "Available",
      on_job: "On a job",
      rejected: "Rejected",
      docs_expired: "Docs expired",
    };
    return (
      <span className={"text-xs rounded-full border px-2 py-0.5 " + (map[s] ?? "")}>
        {label[s] ?? s}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {company.name}
        </h1>
        <p className="mt-1 text-sm text-steel">
          Contact: {company.contactName} · {company.contactEmail} · {company.contactPhone}
        </p>
        <p className="mt-1 text-xs text-steel">
          Operating in: {ops.map((o) => PROVINCE_BY_CODE[o.code]).join(", ")}
        </p>
      </div>

      {company.status !== "approved" && (
        <div className="card p-5 border-l-4 border-l-gold">
          <div className="text-sm font-semibold text-coal">
            Your account is awaiting review.
          </div>
          <p className="text-sm text-steel mt-1">
            Upload your company compliance documents and add at least one truck
            with its paperwork. Once your documents are current, we&rsquo;ll review
            and approve your fleet for matching.
          </p>
        </div>
      )}

      {/* Onboarding progress */}
      <section>
        <h2 className="text-base font-semibold text-coal mb-2">Onboarding progress</h2>
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-steel">
              {state.percentComplete}% complete
            </span>
            <span className="text-steel text-xs">
              {state.hasCompanyDocs ? "✓ Company docs" : "✗ Company docs needed"} ·{" "}
              {state.truckCount} truck{state.truckCount === 1 ? "" : "s"} ·{" "}
              {state.allTrucksHaveDocs ? "✓ All trucks have docs" : "✗ Some trucks missing docs"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full bg-dust rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${state.percentComplete}%` }}
            />
          </div>
        </div>
      </section>

      {/* Company docs */}
      <section>
        <h2 className="text-base font-semibold text-coal mb-2">Company compliance documents</h2>
        <div className="card p-5 space-y-4">
          <CompanyDocList companyId={company.id} />
          {state.missingCompanyDocs.length > 0 && (
            <details className="rounded border border-dust bg-bone p-4">
              <summary className="cursor-pointer text-sm font-medium text-coal">
                Upload a company document
              </summary>
              <div className="mt-3">
                <UploadCompanyDocForm />
              </div>
            </details>
          )}
        </div>
      </section>

      {/* Trucks */}
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-base font-semibold text-coal">Your trucks</h2>
          <span className="text-xs text-steel">{myTrucks.length} listed</span>
        </div>

        {myTrucks.length > 0 && (
          <ul className="card divide-y divide-dust mb-4">
            {myTrucks.map((t) => (
              <li key={t.id} className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-ink flex items-center gap-2">
                    {TRUCK_TYPE_LABEL[t.truckType as keyof typeof TRUCK_TYPE_LABEL] ?? t.truckType}
                    {t.make && <span className="text-steel text-sm">· {t.make} {t.model ?? ""} {t.year ? `(${t.year})` : ""}</span>}
                  </div>
                  <div className="text-xs text-steel mt-1">
                    {t.capacityTons ? `${t.capacityTons}t · ` : ""}
                    {t.baseLocation ? `Based in ${t.baseLocation}` : "Base location not set"}
                  </div>
                </div>
                <div>{statusPill(t.status)}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="card p-5">
          <h3 className="font-semibold text-coal">Add a truck and its compliance docs</h3>
          <p className="text-sm text-steel mt-1">
            Upload per-truck documents (license disc, roadworthy, operator card,
            NLTA permit). A truck will not be available for matching until all four
            are uploaded and approved.
          </p>
          <div className="mt-4">
            <AddTruckAndDocsForm />
          </div>
        </div>
      </section>
    </div>
  );
}

async function CompanyDocList({ companyId }: { companyId: number }) {
  const docs = await db
    .select()
    .from(complianceDocs)
    .where(eq(complianceDocs.companyId, companyId));
  const companyDocs = docs.filter((d) => d.truckId === null);
  if (companyDocs.length === 0) {
    return (
      <p className="text-sm text-steel">
        No company documents uploaded yet. Open the section below to upload CIPC,
        COIDA and insurance documents.
      </p>
    );
  }
  const labelByKey: Record<string, string> = {
    cipc: "CIPC registration",
    coida: "COIDA Letter of Good Standing",
    liability_insurance: "Public Liability insurance",
    git: "Goods in Transit insurance",
  };
  return (
    <ul className="divide-y divide-dust">
      {companyDocs.map((d) => (
        <li key={d.id} className="py-2 flex items-center justify-between text-sm">
          <span className="text-coal">{labelByKey[d.docType] ?? d.docType}</span>
          <span className="text-xs text-steel">
            {d.expiryDate ? `expires ${new Date(d.expiryDate).toLocaleDateString("en-ZA")} · ` : ""}
            {d.status === "verified" ? "✓ verified" : d.status === "rejected" ? "rejected" : "awaiting review"}
          </span>
        </li>
      ))}
    </ul>
  );
}
