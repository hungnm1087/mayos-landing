# Authentic product gallery — 2026-11-12

## Scope

Use existing Ops and Stay components in offline screenshot harnesses, rather than redesigning their screens. The Website capture is the public La May Boutique homepage. Lammy remains explicitly labeled illustrative conversation content.

No production guest records, real Wi-Fi passwords, or production writes are used. Harness database reads return empty demo responses; mutations are blocked or inert. The local component harnesses depend on sibling Ops/Stay checkouts and are not runtime dependencies of the static landing page.

## Seed verification

- 20 fictional rooms; 37 days from seven days before today through 30 days ahead.
- Exactly 16 occupied rooms per day: 592 / 740 room-nights = **80%**.
- 45 checked-out reservations cover the historical part of the timeline.
- Future 30-day range: 480 / 600 room-nights = **80%**.
- Historical, checked-in, confirmed and pending states use the existing reservation-bar implementation.

Verified by transforming the TypeScript fixture with the workspace esbuild runtime and counting occupied nights. The seed does not represent La May business results.

## Review / QA / dogfood

- `npm test`: five tests pass (VI default, claims, six gallery assets, selection/i18n, mobile sequential display).
- `git diff --check`: clean.
- Browser: desktop 1440×960, mobile 430×932.
- Desktop: exercised all six selectors; correct image shown for each; no browser console errors.
- Mobile: six cards visible without selecting chips, no horizontal page overflow; uses actual mobile screenshots for Timeline, PnL and Website.
- Enlarged Timeline uses the current responsive image; Escape closes dialog.
- Screenshot review confirms past checked-out bars on the left of today, real housekeeping queue states, public Website and demo Stay UI.

Screenshots are stored locally under ignored `docs/evidence/`; only optimized WebP gallery images are published.
