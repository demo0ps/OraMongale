# STATUS — ORAMONGALE

> Updated at every meaningful step. Newest entries at top.

## 2026-10-11 — Branding pass + contacts + demo login

**Changes in this pass:**
- **Real logo** installed at `/public/brand/logo.jpg` (owner-supplied) and used
  via the `<Wordmark>` component in the public header, admin header, haulier
  header and admin login page.
- **Brand name:** OraMongale (short form); "TRADINGS" is the subtitle on the
  logo and used in the copyright footer only.
- **Palette switched from industrial-slate + safety-orange to navy + gold**
  (derived from the logo):
  - Navy `#0A2A5C` (primary text, section headers, primary buttons alternative)
  - Gold `#D4A017` (CTA buttons, accents, links on dark backgrounds)
  - Gold bright `#E8B923` (hover)
  - WhatsApp green `#25D366` (WhatsApp CTA)
  - Supporting neutrals adjusted to pair with navy.
- **Contact details added** site-wide:
  - Phone **072 820 4661** (tap-to-call `tel:` link) in header strip + footer.
  - Email **Oramongaletradings@gmail.com** (`mailto:`) in header strip + footer.
  - **WhatsApp CTA** in header strip, footer, and a floating bottom-right
    button on every public page. Link goes to `wa.me/27728204661` with a
    pre-filled enquiry message.
- **Demo login** on admin `/admin/login` — a small "Fill demo credentials"
  link under the password field autofills the admin email and password.
  (Per owner request: no fake/sample data, just an autofill helper.)
- **Scope reaffirmed:** mining-truck haulage stays the focus; the ship/airplane
  motifs in the logo are not being expanded into multi-modal logistics in v1.
- **Brand profile** at `docs/profiles/oramongale.md` updated with name,
  palette, contacts, logo path.

**Verified facts:**
- Logo image loads on `/` and `/admin/login` (200, confirmed via curl).
- Phone number and wa.me link render on homepage.
- "Fill demo credentials" link renders on the admin login page.
- Type-check passes; dev server serving 200 on homepage, 200 on admin login.

**Running:** dev server up on port 3000. Admin login:
- Go to `/admin/login`
- Click **Fill demo credentials** then **Sign in**
- (Or type manually: `admin@oramongale.co.za` / `change-me-on-first-login`.)
