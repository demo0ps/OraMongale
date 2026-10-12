# Brief: Mining Trucking Brokerage Platform (working title)

> Status: DRAFT v0.1 — 11 Oct 2026
> Owner sign-off: PENDING
> Not a single line of code has been written; all decisions below are proposals.

---

## 1. Problem

Mines and mine contractors need haulage capacity on short notice. Truck owners (small
fleets and owner-operators) have trucks sitting idle but struggle to find legitimate
contracts without spending weeks cold-calling procurement offices. Between them sits a
mess of WhatsApp groups, emailed CV packs, and paper compliance folders that nobody
actually trusts.

The result: mines book the company that got through on the phone, not the one that is
compliant and available; truck owners burn fuel chasing tenders they won't win.

## 2. What v1 is (and what it is not)

**Is:** A web-based brokerage tool. Trucking companies register and list their trucks
with compliance paperwork. Admin (you) captures jobs from mines and matches verified
trucks to jobs manually. Owners get notified of assignments and accept/decline.

**Is not:**
- A payments platform — money, contracts, and invoicing happen offline.
- A self-serve portal for mines — jobs are entered by admin.
- An open bidding marketplace — matching is curated by admin, not auction-style.
- A route tracker / telematics system — no GPS tracking, no ELD integration.
- Cross-border haulage — South Africa only for v1.

Stated differently: v1 replaces the spreadsheet + WhatsApp workflow with one dashboard
where you can see every compliant, available truck and slot it onto a job.

## 3. Actors

| Actor | What they do | Account type |
|---|---|---|
| **Admin (you)** | Capture jobs from mines, review compliance docs, approve/reject trucks, assign trucks to jobs, track job status | Full web dashboard |
| **Truck owner (company)** | Register company, add trucks, upload compliance docs, view their trucks' status, accept/decline job assignments | Self-serve web login |
| **Mine / contractor** | Phones/emails admin with a haulage need. Does NOT log in. Represented in the system as a contact record on each job | No account |
| **Driver** | Drives the truck. Not a user in v1; name/contact captured on a truck record as data only | No account |

## 4. Core user flows

### 4.1 Company onboarding
1. Truck owner registers with company name, contact person, email, phone, province.
2. Verifies email.
3. Uploads company-level compliance docs (see §6).
4. Account status: `pending_review` until admin approves.

### 4.2 Truck listing
1. Approved company adds a truck: type, make/model, year, tonnage/capacity, base
   location, current availability.
2. Uploads per-truck compliance docs and enters expiry dates.
3. Truck status: `docs_pending` → admin reviews → `available` / `rejected`.
4. Rejected trucks show the reason; owner can re-submit docs.

### 4.3 Job capture (admin)
1. Admin creates a job: mine name, contact person, pick-up site, drop-off site,
   material (coal, ore, platinum concentrate, overburden, etc.), tonnage, required
   truck type(s), target start date, rate (optional, admin-eyes-only note).
2. Job status: `open` → `matching` → `assigned` → `in_progress` → `completed` →
   `cancelled`.

### 4.4 Matching (admin)
1. Admin opens a job, sees a filtered list of `available` trucks matching type +
   location, grouped by company.
2. Admin selects trucks/companies and creates an **Assignment**.
3. Email sent to the company contact: "You have been proposed for Job #123 — view and
   respond."
4. Company clicks a signed link (no login required to respond, or login required —
   decision point §8) and Accepts or Declines with an optional note.
5. Accepted assignments move the job to `assigned`; the truck is locked as `on_job`
   until the job is completed.

### 4.5 Job completion
1. Admin marks job `completed`; trucks return to `available`.
2. (Future) rating for the company — not in v1.

## 5. Core data model (outline)

```
companies            – id, name, reg_number, contact_name, contact_email,
                       contact_phone, province, status, created_at
company_docs         – id, company_id, doc_type, file_url, expiry_date, verified
trucks               – id, company_id, truck_type (side_tipper|interlink|
                       flat_deck|lowbed|superlink|tipper|water_tanker|fuel_tanker|...),
                       make, model, year, capacity_tons, base_location, status,
                       created_at
truck_docs           – id, truck_id, doc_type, file_url, expiry_date, verified
mines                – id, name, contact_name, contact_phone, site_address, province
jobs                 – id, mine_id, description, pickup_site, dropoff_site,
                       material, tonnage, required_truck_type, required_truck_count,
                       start_date, status, admin_notes, created_by_admin_id
assignments          – id, job_id, truck_id, status (proposed|accepted|declined|
                       completed), company_response_note, created_at
admin_users          – id, email, name, password_hash
```

Status fields are explicit enums — no free-text status. All state changes append an
event (per AGENT-PROFILE §4 engineering rule).

## 6. Compliance documents (South Africa)

**Per company:**
- CIPC registration certificate (CoR14.3 / CK1/CK2)
- COIDA Letter of Good Standing
- Public Liability insurance certificate + Goods in Transit
- SARS Tax Clearance (optional for v1 — mark UNCONFIRMED)
- VAT registration (if applicable)

**Per truck:**
- Vehicle license disc (scan + expiry date)
- Certificate of Roadworthiness (CoR) + expiry
- Operator Card (Department of Transport) + expiry
- Road Transport Permit / Operating License (NLTA)

Each document has an expiry date; the system warns admin 30 days before expiry and
flags the truck `docs_expiring` / `docs_expired`. An expired mandatory doc pulls the
truck off the available list automatically.

> All doc types above are what I believe standard for SA road freight. Owner must
> confirm which are mandatory before launch — flagged as BLOCKING in §8.

## 7. Non-functional requirements

- **Location:** South African users. Latency to the server matters (mines and
  operators are largely on mobile in Mpumalanga, Limpopo, Northern Cape, North West,
  Free State).
- **Devices:** Phone-first. Truck owners will use this on a smartphone on-site.
  Admin will use a laptop.
- **Languages:** English only for v1. (Sepedi/Zulu/Afrikaans? — non-blocking question.)
- **Photos:** Truck owners will upload photos of trucks. Thumbnail generation needed.
  Storage must be private (docs are sensitive).
- **Email:** Transactional only (verification, assignment alerts, doc expiry
  reminders). No marketing mail in v1.
- **Backups:** Daily, retained 30 days. This is a live product with real compliance
  documents — we cannot lose uploads.
- **Audit trail:** Every status change is timestamped with which actor did it.

## 8. Open items (BLOCKING before build)

| # | Question | Why it blocks |
|---|---|---|
| B1 | **Product name / domain.** What is this called? Do you own a domain yet? | Brand profile, email sending, login screen, legal footer |
| B2 | **Compliance doc list.** Is the list in §6 correct, and are all of them mandatory to go "available", or is some subset optional? | Upload forms, validation, approval logic |
| B3 | **Assignment response.** When you propose a truck for a job, does the owner click a one-time link (no login needed to accept/decline) or must they log in? One-time links are faster for non-technical owners; login is more secure. | Auth surface, notification design |
| B4 | **How many trucks / companies realistically in year 1?** Order of magnitude: dozens, hundreds, thousands? | Choices between a generous free tier vs a small paid host |
| B5 | **Are you the only admin at launch, or do your colleagues also need admin logins?** | Admin account bootstrapping |

## 9. Open items (NON-BLOCKING — defaults proposed below)

| # | Question | Proposed default | Replace when |
|---|---|---|---|
| N1 | Local languages beyond English | English only | First non-English user complains or we market in a vernacular paper |
| N2 | Cross-border (BW, ZW, MZ, NA, ZM) | Out of scope v1 | First mine asks about cross-border haul |
| N3 | Telematics/GPS tracking of trucks | No integration v1 | Required by a mine contract |
| N4 | Invoicing / contract generation | Offline; admin emails their own PDF | Admin gets tired of manual contracts |
| N5 | Rating system for companies | None v1 | First bad actor needs to be flagged to future mines |
| N6 | WhatsApp notifications in addition to email | Email only | Open rates on email prove too low; add WhatsApp Business API (small cost) |
| N7 | Truck photos required for listing? | Optional for v1, strongly encouraged in copy | Operators upload fake/missing photos as a trust problem |

## 10. Proposed tech stack & cost posture

**Recommendation:** Supabase (Postgres + Auth + Storage + Row Level Security) + a
server-rendered or lightweight JS frontend on a static host. Email via Resend or
Supabase's built-in SMTP.

- **Why Supabase:** Gives us auth, file storage for docs/photos, and a real Postgres
  database in one managed surface. Row Level Security means truck owners only ever
  see their own company's data even if we miswire a query. Free tier is generous
  enough for v1 (~50k MAUs, 1GB DB, 1GB storage); upgrade to Pro ~$10/month when we
  hit pause-on-inactivity or need daily backups beyond 7 days.
- **Hosting:** Vercel (free) or Netlify (free) for the frontend, or Cloudflare Pages
  (free). Scale to zero; pay only for bandwidth beyond limits, which we won't hit.
- **Email:** Resend free tier (100 emails/day) or Supabase SMTP.
- **Running cost at launch:** $0–$15/month. No paid dependency introduced without
  an ADR per AGENT-PROFILE §4.
- **Risk to flag:** Supabase does not host in South Africa; closest region is likely
  AWS eu-west-1 (Ireland) or eu-central-1 (Frankfurt) at ~250–350ms latency for SA
  users. An alternative is a Hetzner VPS in Johannesburg (~€5/month, sub-30ms
  latency) with self-hosted Postgres + app. Trade-off is: we manage the server
  ourselves (backups, TLS, OS updates) vs the near-zero ops of Supabase. **Decision
  needed** — my recommendation is to start on Supabase EU for v1 (ops-free, fast to
  ship, free tier) and migrate to a SA host only if measured latency is a real
  problem or when user volume justifies it. Most admin dashboards tolerate 300ms;
  truck owners on mobile on poor MTN/Vodacom connections will notice less than you
  think because the app is not chatty.

## 11. What is NOT in v1 (explicitly)

To keep scope tight and the first deploy real:
- No payments, escrow, or automated invoicing
- No mine-side accounts
- No real-time GPS tracking
- No in-app chat (use phone/email/WhatsApp)
- No bid/auction system
- No driver-facing app
- No mobile app (responsive web only)
- No reporting beyond basic admin lists (future: compliance expiry report, jobs
  per company, etc.)

## 12. Definition of Done for v1 launch

A version we can put real users on:
- Company can register, verify email, upload company + truck docs, add trucks.
- Admin can log in, approve/reject companies and trucks with reasons.
- Admin can create a job, filter available trucks by type/location, assign trucks
  to the job.
- Company receives an email with a clear accept/decline action.
- Truck status changes correctly across the whole lifecycle (docs_pending →
  available → on_job → available), including doc-expiry auto-lock.
- Works at 390px phone width and 1280px desktop.
- All state changes logged with actor + timestamp (audit trail).
- Daily backups configured.
- STATUS.md and DECISIONS.md maintained throughout.
- Brand profile completed (name, palette, logo, contact).

---

## 13. Questions for the owner

Please correct, add, or strike anything above. Specifically I need answers to the
five BLOCKING items in §8 (name, doc list, accept-flow, expected scale, admin count)
before I touch code, plus your call on the hosting-region trade-off in §10.
