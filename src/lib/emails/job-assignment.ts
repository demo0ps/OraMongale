import type { JobWithAssignments } from "../admin/types";

export function renderJobAssignmentEmail({
  companyName,
  contactName,
  job,
  truck,
  acceptUrl,
}: {
  companyName: string;
  contactName: string;
  job: JobWithAssignments;
  truck: { reg: string; type: string } | null;
  acceptUrl: string;
}) {
  const route = [job.pickupSite, job.dropoffSite].filter(Boolean).join(" → ");
  const subject = `New haulage request: ${job.material ?? "Load"}${route ? " · " + route : ""}`;
  const greeting = contactName ? `Hi ${contactName},` : `Hi ${companyName},`;

  const lines: string[] = [
    greeting,
    "",
    "OraMongale is reaching out with a new haulage opportunity that matches your fleet.",
    "",
    `Job #${job.id}`,
    `  Material:       ${job.material ?? "—"}`,
    `  Route:          ${route || "—"}`,
    `  Tonnage:        ${job.tonnage ? job.tonnage + " t" : "—"}`,
    `  Truck type:     ${job.requiredTruckType ?? "—"}`,
    `  Trucks needed:  ${job.requiredTruckCount ?? "—"}`,
    `  Start date:     ${job.startDate ?? "TBC"}`,
  ];
  if (truck) {
    lines.push(`  Assigned unit:  ${truck.type}${truck.reg ? " (" + truck.reg + ")" : ""}`);
  }
  lines.push(
    "",
    "Please confirm or decline this offer by clicking one of the links below:",
    `  ✓ Accept:   ${acceptUrl}?action=accept`,
    `  ✗ Decline:  ${acceptUrl}?action=decline`,
    "",
    "The link is unique to your company — no login needed. If you'd rather chat, reply to this email or WhatsApp us on 072 820 4661.",
    "",
    "Thanks,",
    "OraMongale Tradings",
    "Oramongaletradings@gmail.com · 072 820 4661",
  );
  const text = lines.join("\n");

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#0a1a33">
<p>${greeting}</p>
<p>OraMongale is reaching out with a new haulage opportunity that matches your fleet.</p>
<table cellpadding="6" style="border-collapse:collapse;margin:12px 0">
  <tr><td style="color:#6b7a8f"><b>Job #${job.id}</b></td></tr>
  <tr><td><b>Material</b></td><td>${esc(job.material ?? "—")}</td></tr>
  <tr><td><b>Route</b></td><td>${esc(route || "—")}</td></tr>
  <tr><td><b>Tonnage</b></td><td>${job.tonnage ? job.tonnage + " t" : "—"}</td></tr>
  <tr><td><b>Truck type</b></td><td>${esc(job.requiredTruckType ?? "—")}</td></tr>
  <tr><td><b>Trucks needed</b></td><td>${job.requiredTruckCount ?? "—"}</td></tr>
  <tr><td><b>Start date</b></td><td>${esc(job.startDate ?? "TBC")}</td></tr>
  ${truck ? `<tr><td><b>Assigned unit</b></td><td>${esc(truck.type)}${truck.reg ? " (" + esc(truck.reg) + ")" : ""}</td></tr>` : ""}
</table>
<p>Please confirm or decline this offer:</p>
<p>
  <a href="${acceptUrl}?action=accept" style="display:inline-block;background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px;font-weight:bold">✓ Accept load</a>
  <a href="${acceptUrl}?action=decline" style="display:inline-block;background:#eee;color:#333;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">✗ Decline</a>
</p>
<p style="font-size:12px;color:#6b7a8f">The link is unique to your company — no login required. Questions? Reply to this email or <a href="https://wa.me/27728204661">WhatsApp us on 072 820 4661</a>.</p>
<p>Thanks,<br>OraMongale Tradings<br><a href="mailto:Oramongaletradings@gmail.com">Oramongaletradings@gmail.com</a></p>
</body></html>`;

  return { subject, text, html };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
