# DECISIONS — ORAMONGALE

> Record of anything a future developer (or future us) would ask "why?" about.
> Newest at top.

---

## D-006 — Initial admin is email/password, seeded via bootstrap

**Date:** 2026-10-11
**Context:** First deploy needs at least one admin user. Cannot hardcode credentials.
**Decision:** First run reads `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` from
`.env` and creates the admin record if no admin exists. Password must be changed on
first login (flag `must_change_password=true`).
**Consequences:** Deploys are reproducible; no credentials in source; .env is
git-ignored per AGENT-PROFILE credentials rule.

## D-005 — Cost posture: zero-ops over local latency for v1

**Date:** 2026-10-11
**Context:** Supabase hosts in EU (~300ms from SA); a JHB VPS is ~30ms but requires
manual ops (backups, TLS, OS patches).
**Decision:** Ship v1 on managed services (Supabase EU / Vercel). Measure real latency
with real SA users. Only migrate to a local host if measured round-trip times
meaningfully hurt core flows (login, list pages, form submissions — none of which are
latency-sensitive like chat).
**Reason:** "Cheap must not be fragile." Self-managed VPS on day one is a cheap
monthly bill but a fragile operational story for a solo engineer shipping a live
product. Managed free tiers absorb ops risk.
**Revisit trigger:** Owner or real users report that page loads / form submissions
feel too slow on SA mobile networks.

## D-004 — Hosting: Vercel (frontend/functions) + Supabase (DB/auth/storage) in production

**Date:** 2026-10-11
**Reason:** Vercel free tier is unlimited non-commercial/early-stage projects,
auto-SSL, preview per PR, zero config. Supabase gives Postgres + Auth + Storage +
Row Level Security — four things we would otherwise have to wire ourselves. Both
scale-to-zero for our v1 volumes.
**Cost at launch:** $0–$15/month (Supabase Pro $10/day-0 free may suffice for v1
volume, Vercel free).
**ADR note:** If monthly cost exceeds $25 at any point, revisit with explicit traffic
numbers before further spend.

## D-003 — Local dev uses SQLite (better-sqlite3); production uses Postgres (Supabase)

**Date:** 2026-10-11
**Reason:** No Docker requirement for the sandbox; developer (me) can work without
cloud credentials. All schema is written as portable SQL/DDL via Drizzle ORM so the
port from SQLite → Postgres is a migration, not a rewrite.
**Consequences:** I must avoid SQLite-specific features and Postgres-specific features
in schema design (no JSONB-only tricks, no `AUTOINCREMENT` assumptions). All queries
go through Drizzle.

## D-002 — Auth: Auth.js (NextAuth v5) with credentials provider

**Date:** 2026-10-11
**Reason:** Works locally without third-party OAuth keys; email+password is the only
required provider for v1; JWT sessions with httpOnly cookies, CSRF protection built
in; supports future providers (Google, magic link) without rewriting auth.
**Consequences:** No Supabase Auth — we own password hashing (bcrypt via Auth.js).
For the future, when we move to Supabase in production we can switch to Supabase Auth
via Auth.js Supabase adapter.

## D-001 — Framework: Next.js 15 (App Router) + TypeScript + Tailwind CSS

**Date:** 2026-10-11
**Reason:** Industry-standard React framework, free deploy to Vercel, first-class
support for server components and server actions (simpler than building a separate
API), good mobile performance, huge ecosystem. TypeScript per AGENT-PROFILE "typed
contracts end to end". Tailwind for fast, consistent UI without custom CSS overhead.
**Alternatives considered:**
- SvelteKit: faster runtime, smaller bundles, but smaller ecosystem and owner's
  future hires are more likely to know Next/React.
- Remix: similar strengths, more opinionated about data loading, less free-tier
  deploy friction? Vercel is still best, but Vercel-native is Next.js.
- Plain HTML/SPA: rejected — server-rendered authenticated dashboards are simpler in
  a meta-framework than rolling CSRF/session/auth by hand.
