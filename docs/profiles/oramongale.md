# Brand profile: OraMongale

> Loaded with `docs/AGENT-PROFILE.md`.

## Identity
- Client name: OraMongale Tradings
- Trading name: OraMongale
- Tagline: "You deal with a person, not a portal."
- Legal entity / owner contact: UNCONFIRMED
- Client status: live product, pre-launch
- Phone: 072 820 4661 (WhatsApp same number)
- Email: Oramongaletradings@gmail.com

## Locations
- Sites: Admin operates from South Africa; haulage across SA mining provinces.
- Currency: ZAR (R)
- Tax rate: 15% VAT; rates negotiated offline.
- Trading hours: UNCONFIRMED — default SA business hours 08:00–17:00 CAT.

## Market context
- Country and region: South Africa, nationwide.
- Privacy: POPIA.
- Payment providers: none for v1 (no on-platform payments).
- Local risks: Mobile data costs; load-shedding; spotty cellular coverage — design for low bandwidth, small payloads.

## Brand
- Palette (from logo):
  - Navy `#0A2A5C` (primary — headers, buttons, footer)
  - Gold `#D4A017` (CTA, accents)
  - Gold bright `#E8B923` (CTA hover)
  - WhatsApp green `#25D366` (CTA for WhatsApp)
  - Neutral ink `#0a1a33`, steel `#6b7a8f`, dust `#d9dce2`, bone `#f6f7fa`
- Type direction: Inter/sans-serif for UI.
- Visual style: Industrial, trustworthy, plain; credible SA mining imagery.
- Photo policy: 4 AI-generated mining/trucking photos on the public site
  (hero haul-road, dispatcher-with-clipboard at yard, excavator loading,
  dawn truck yard). Real user uploads for trucks.
- Logo: supplied — `/public/brand/logo.jpg` (OraMongale TRADINGS mark with
  gold mountain, navy truck, navy gear, gold/navy sweep).

## Content
- Catalogue/menu: n/a
- Pricing status: No prices displayed; rates as admin notes on jobs.

## Boundaries
- Names/logos/links that must never appear: UNCONFIRMED
- Third-party material: Only user-uploaded compliance docs and truck photos.
- Content not to be named: UNCONFIRMED

## Claims
- Compliance requirements verified with DoT/RTMC before public claim.

## Open items
- [x] Product name confirmed: OraMongale (TRADINGS as subline on logo)
- [x] Contact details: phone, email, WhatsApp confirmed 11 Oct
- [x] Logo supplied 11 Oct
- [x] Palette derived from logo 11 Oct
- [ ] Domain (owner has none yet — BLOCKS launch, not build)
- [ ] Compliance doc list confirmed (CIPC, COIDA, license, roadworthy, operator, NLTA as defaults)
- [ ] Legal entity details for footer
- [ ] POPIA privacy policy text
- [ ] Additional admin accounts (names/emails)

## Assumed defaults
| Default | Value | Config switch | Replace when |
|---|---|---|---|
| Operating country | South Africa only | `FEATURE_CROSS_BORDER=false` | First cross-border job |
| Currency | ZAR | `CURRENCY=ZAR` | Multi-currency |
| Language | English | `LOCALE=en-ZA` | Vernacular demand |
| Notifications | Email only v1; WhatsApp CTA is public contact, not notification channel | `FEATURE_WHATSAPP_NOTIFS=false` | Email open rate insufficient |
| Hosting region | Supabase EU (Ireland) | `SUPABASE_REGION=eu-west-1` | Latency proven to hurt |
| Truck photos | Optional, encouraged | `TRUCK_PHOTOS_REQUIRED=false` | Photo trust problem |
| Auth | Email+password | `AUTH_PROVIDERS=credentials` | SSO request |
| Initial admin | admin@oramongale.co.za / change-me-on-first-login | env | Per env config |
| Mine self-serve | Disabled | `FEATURE_MINE_PORTAL=false` | Mines request login |
| Payments | Disabled | `FEATURE_PAYMENTS=false` | Owner decision |

## Channels
- Phone: 072 820 4661
- Email: Oramongaletradings@gmail.com
- WhatsApp: 072 820 4661 (https://wa.me/27728204661)
- Social handles: UNCONFIRMED

## Test widths
- Mobile: 390px
- Desktop: 1280px
