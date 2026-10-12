import bcrypt from "bcryptjs";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  mines, companies, trucks, jobs, assignments, provinces,
  companyOperatingProvinces, companyUsers,
} from "@/db/schema";
import {
  assignmentInvites, mineUsers, drivers, tripUpdates, podUploads, emailOutbox,
} from "@/db/mail-schema";
import { invoices, invoiceLines, settings } from "@/db/ops-schema";
import { nextInvoiceNumber, getInvoiceSettings, saveInvoiceSettings } from "./invoice-settings";

export async function isDemoSeeded(): Promise<boolean> {
  const r = (db.get(sql`SELECT count(*) as c FROM mines WHERE name LIKE 'Demo - %'`) as any) as { c: number } | undefined;
  return (r?.c ?? 0) > 0;
}

export async function seedDemoData() {
  if (await isDemoSeeded()) return { skipped: true };

  // Ensure provinces are present (bootstrap runs already) so we have IDs.
  const provRows = (db.all(sql`SELECT id, code FROM provinces`) as any[]) as { id: number; code: string }[];
  const provByCode = new Map(provRows.map((p) => [p.code, p.id]));
  const gp = provByCode.get("GP")!;
  const mp = provByCode.get("MP")!;
  const lp = provByCode.get("LP")!;
  const nw = provByCode.get("NW")!;

  const now = new Date().toISOString();
  const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString().slice(0, 10); };

  // ---- 2 mines ----
  const anglo = dbInsert(mines, {
    name: "Demo - Anglo Coal Witbank",
    contactName: "Thabo Mokoena",
    contactEmail: "thabo.mokoena@example-mine.co.za",
    contactPhone: "+27 13 000 1001",
    siteAddress: "Witbank, Mpumalanga",
    provinceId: mp,
  });
  const lonmin = dbInsert(mines, {
    name: "Demo - Lonmin Platinum Marikana",
    contactName: "Pieter van der Merwe",
    contactEmail: "pieter@example-plat.co.za",
    contactPhone: "+27 14 000 2002",
    siteAddress: "Marikana, North West",
    provinceId: nw,
  });

  // ---- 3 haulier companies ----
  function mkCompany(name: string, contactName: string, email: string, phone: string, baseProv: number, ops: number[]) {
    const c = dbInsert(companies, {
      name, contactName, contactEmail: email, contactPhone: phone,
      baseProvinceId: baseProv, status: "approved", createdAt: now,
    });
    for (const pid of new Set([baseProv, ...ops])) {
      db.run(sql`INSERT OR IGNORE INTO company_operating_provinces (company_id, province_id) VALUES (${c.id}, ${pid})`);
    }
    // Create a company_user (no password) so haulier dashboard logs straight in.
    db.run(sql`INSERT INTO company_users (company_id, email, password_hash, name, email_verified, created_at)
               VALUES (${c.id}, ${email}, '', ${contactName}, 1, ${now})`);
    return c;
  }
  const co1 = mkCompany("Demo - Red Star Hauliers", "Sipho Dlamini", "sipho@redstar-haul.example", "+27 82 111 2222", gp, [mp, gp]);
  const co2 = mkCompany("Demo - Highveld Transports", "Annemarie du Plessis", "annemarie@highvelt-t.example", "+27 83 333 4444", mp, [mp, lp, gp]);
  const co3 = mkCompany("Demo - Platinum Trucking", "Johan Botha", "johan@ptrucking.example", "+27 84 555 6666", nw, [nw, lp]);

  // ---- 8 trucks ----
  const trucks_data = [
    { co: co1.id, reg: "DR12GP", type: "side-tipper" },
    { co: co1.id, reg: "DR34GP", type: "side-tipper" },
    { co: co1.id, reg: "DR56MP", type: "side-tipper" },
    { co: co2.id, reg: "HV01MP", type: "side-tipper" },
    { co: co2.id, reg: "HV02MP", type: "flat-deck" },
    { co: co2.id, reg: "HV03LP", type: "side-tipper" },
    { co: co3.id, reg: "PT88NW", type: "superlink" },
    { co: co3.id, reg: "PT99NW", type: "superlink" },
  ];
  const truckIds: number[] = [];
  for (const t of trucks_data) {
    const r = dbInsert(trucks, { companyId: t.co, regNumber: t.reg, truckType: t.type, status: "available", createdAt: now });
    truckIds.push(r.id);
  }

  // ---- 6 drivers ----
  const drivers_data = [
    { co: co1.id, name: "Mandla Nkosi", phone: "0821001001" },
    { co: co1.id, name: "David Molefe", phone: "0821001002" },
    { co: co2.id, name: "Frans Sithole", phone: "0821001003" },
    { co: co2.id, name: "Tumi Mabaso", phone: "0821001004" },
    { co: co3.id, name: "Kobus Pretorius", phone: "0821001005" },
    { co: co3.id, name: "Vusi Khumalo", phone: "0821001006" },
  ];
  const driverIds: number[] = [];
  for (const d of drivers_data) {
    const r = dbInsert(drivers, { companyId: d.co, name: d.name, phone: d.phone, pinHash: bcrypt.hashSync("1234", 10), createdAt: now });
    driverIds.push(r.id);
  }

  // ---- 2 mine portal users ----
  dbInsert(mineUsers, { mineId: anglo.id, email: "thabo.mokoena@example-mine.co.za", name: "Thabo Mokoena", passwordHash: bcrypt.hashSync("mine123", 10), createdAt: now });
  dbInsert(mineUsers, { mineId: lonmin.id, email: "pieter@example-plat.co.za", name: "Pieter van der Merwe", passwordHash: bcrypt.hashSync("mine123", 10), createdAt: now });

  // ---- 4 jobs (mix of statuses) ----
  const jobData = [
    { mine: anglo.id, material: "coal", pickup: "Witbank Colliery", dropoff: "Kendal Power Station", tons: 800, truckType: "side-tipper", count: 3, status: "completed", daysAgo: 25 },
    { mine: anglo.id, material: "coal", pickup: "Witbank Colliery", dropoff: "Matla Power Station", tons: 500, truckType: "side-tipper", count: 2, status: "in_progress", daysAgo: 5 },
    { mine: anglo.id, material: "coal", pickup: "Kriel Colliery", dropoff: "Duvha Power Station", tons: 350, truckType: "side-tipper", count: 1, status: "assigned", daysAgo: 2 },
    { mine: lonmin.id, material: "PGM concentrate", pickup: "Marikana Smelter", dropoff: "Rustenburg Refinery", tons: 120, truckType: "superlink", count: 2, status: "open", daysAgo: 0 },
  ];
  const jobIds: number[] = [];
  const assignmentsInfo: { jobId: number; truckId: number; driverId: number; rate: number; status: string }[] = [];
  let tIdx = 0, dIdx = 0;
  for (const j of jobData) {
    const startDate = daysAgo(j.daysAgo);
    const r = dbInsert(jobs, {
      mineId: j.mine,
      material: j.material,
      tonnage: j.tons,
      pickupSite: j.pickup,
      dropoffSite: j.dropoff,
      requiredTruckType: j.truckType,
      requiredTruckCount: j.count,
      startDate,
      status: j.status,
      createdAt: new Date(startDate).toISOString(),
    });
    jobIds.push(r.id);
    // Assign trucks
    for (let i = 0; i < j.count; i++) {
      const tid = truckIds[tIdx % truckIds.length];
      const did = driverIds[dIdx % driverIds.length];
      tIdx++; dIdx++;
      const a = dbInsert(assignments, {
        jobId: r.id,
        truckId: tid,
        status: j.status === "completed" ? "accepted" : j.status === "open" ? "proposed" : "accepted",
        companyResponseNote: null,
        createdAt: new Date(startDate).toISOString(),
      });
      // trip updates
      if (j.status === "in_progress" || j.status === "completed") {
        const tu = dbInsert(tripUpdates, {
          jobId: r.id, assignmentId: a.id, driverId: did,
          status: j.status === "completed" ? "delivered" : "en_route_pickup",
          lat: null, lng: null, notes: null,
          createdAt: new Date(startDate).toISOString(),
        });
        if (j.status === "completed") {
          dbInsert(podUploads, { tripUpdateId: tu.id, jobId: r.id, driverId: did, kind: "weighbridge", filePath: "", fileName: null, fileSize: null, tons: Math.round(j.tons / j.count), createdAt: now });
        }
      }
    }
  }

  // ---- Invoices across statuses ----
  const invSettings = await getInvoiceSettings();
  const mkInvoice = async (opts: {
    direction: "incoming" | "outgoing"; jobId: number | null; mineId: number | null; companyId: number | null;
    status: "draft" | "sent" | "paid" | "overdue"; subtotal: number; issueDate: string; dueDays: number;
    lineDescription: string; qty: number; unit: number;
  }) => {
    const number = await nextInvoiceNumber(opts.direction);
    const issue = opts.issueDate;
    const due = (() => { const d = new Date(issue); d.setDate(d.getDate() + opts.dueDays); return d.toISOString().slice(0, 10); })();
    const vat = Math.round(opts.subtotal * (invSettings.vatRate / 100) * 100) / 100;
    const total = Math.round((opts.subtotal + vat) * 100) / 100;
    const ins = dbInsert(invoices, {
      number, direction: opts.direction, jobId: opts.jobId, mineId: opts.mineId, companyId: opts.companyId,
      status: opts.status, issueDate: issue, dueDate: due,
      subtotal: opts.subtotal, vatAmount: vat, total,
      currency: "ZAR", notes: opts.lineDescription,
      paidAt: opts.status === "paid" ? new Date().toISOString() : null,
      createdAt: new Date(issue).toISOString(),
    });
    dbInsert(invoiceLines, { invoiceId: ins.id, description: opts.lineDescription, quantity: opts.qty, unitPrice: opts.unit, amount: opts.subtotal });
    return ins.id;
  };

  // Completed coal job #1 — invoice to mine (paid), remittance to haulier (paid)
  await mkInvoice({ direction: "incoming", jobId: jobIds[0], mineId: anglo.id, companyId: null, status: "paid", subtotal: 92400, issueDate: daysAgo(22), dueDays: 30, lineDescription: "Coal haulage · Witbank Colliery → Kendal Power Station · 180km avg · 800t · R2.58/t-km (incl. 15% margin)", qty: 800, unit: 115.50 });
  await mkInvoice({ direction: "outgoing", jobId: jobIds[0], mineId: null, companyId: co1.id, status: "paid", subtotal: 79200, issueDate: daysAgo(20), dueDays: 25, lineDescription: "Coal haulage sub-contract · Witbank Colliery → Kendal Power Station · 800t · R2.20/t-km", qty: 800, unit: 99.00 });

  // In-progress job #2 — mine invoice sent (overdue), haulier remittance still draft
  await mkInvoice({ direction: "incoming", jobId: jobIds[1], mineId: anglo.id, companyId: null, status: "overdue", subtotal: 49500, issueDate: daysAgo(40), dueDays: 30, lineDescription: "Coal haulage · Witbank Colliery → Matla Power Station · 180km · 500t · R2.75/t-km", qty: 500, unit: 99.00 });
  await mkInvoice({ direction: "outgoing", jobId: jobIds[1], mineId: null, companyId: co2.id, status: "draft", subtotal: 42900, issueDate: daysAgo(3), dueDays: 25, lineDescription: "Coal haulage sub-contract · Witbank → Matla · 500t", qty: 500, unit: 85.80 });

  // Assigned job #3 — invoices in draft
  await mkInvoice({ direction: "incoming", jobId: jobIds[2], mineId: anglo.id, companyId: null, status: "draft", subtotal: 34650, issueDate: daysAgo(1), dueDays: 30, lineDescription: "Coal haulage · Kriel → Duvha · 350t", qty: 350, unit: 99.00 });

  // Platinum job — open (no invoice yet) — just a sent quote-style outbox email
  dbInsert(emailOutbox, {
    toEmail: "pieter@example-plat.co.za", toName: "Pieter van der Merwe",
    subject: "Quote — PGM concentrate Marikana → Rustenburg",
    bodyText: "Hi Pieter, please find our rates attached for the upcoming concentrate loads.",
    bodyHtml: "<p>Hi Pieter, please find our rates attached for the upcoming concentrate loads.</p>",
    status: "queued", sentAt: null, createdAt: now,
  });

  return { ok: true };
}

function dbInsert<T extends Record<string, any>>(table: any, values: T): any {
  const rows = db.insert(table).values(values as any).returning().all() as any[];
  return rows[0];
}
