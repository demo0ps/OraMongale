"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMinerals, saveMinerals, slugify } from "@/lib/minerals";

function parseNum(v: FormDataEntryValue | null): number {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function bad(msg: string): never {
  // Server actions that hit validation: redirect back with ?error=
  redirect(`/admin/minerals?error=${encodeURIComponent(msg)}`);
}

export async function addMineral(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return bad("Name is required");
  const ratePerTon = parseNum(formData.get("ratePerTon"));
  const list = await getMinerals(true);
  const existingById = new Set(list.map((m) => m.id));
  let id = slugify(name);
  let n = 1;
  while (existingById.has(id)) id = `${slugify(name)}-${++n}`;
  list.push({ id, name, ratePerTon, archived: false });
  await saveMinerals(list);
  revalidatePath("/admin/minerals");
  revalidatePath("/admin/jobs");
  revalidatePath("/mines/post-job");
  redirect("/admin/minerals");
}

export async function updateMineral(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return bad("Missing id or name");
  const ratePerTon = parseNum(formData.get("ratePerTon"));
  const list = await getMinerals(true);
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return bad("Not found");
  list[idx] = { ...list[idx]!, name, ratePerTon };
  await saveMinerals(list);
  revalidatePath("/admin/minerals");
  revalidatePath("/admin/jobs");
  redirect("/admin/minerals");
}

export async function toggleMineral(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const archive = String(formData.get("archive") ?? "true") === "true";
  if (!id) return bad("Missing id");
  const list = await getMinerals(true);
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return bad("Not found");
  list[idx] = { ...list[idx]!, archived: archive };
  await saveMinerals(list);
  revalidatePath("/admin/minerals");
  revalidatePath("/admin/jobs");
  redirect("/admin/minerals");
}

export async function deleteMineral(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return bad("Missing id");
  const list = await getMinerals(true);
  const next = list.filter((m) => m.id !== id);
  await saveMinerals(next);
  revalidatePath("/admin/minerals");
  revalidatePath("/admin/jobs");
  redirect("/admin/minerals");
}
