# MayOS: claims, finance and device showcase

## Scope and source review

- Replace static 67% direct-booking claim and module count with descriptive proof points. Keep three connected platforms (Ops, Stay, Direct), treating Lammy as a cross-channel assistant.
- Add live Expense Ledger / P&L. Source review: Ops PnlPage/usePnl and SoChiPage support period allocation, key costs, operating profit, occupancy, ADR and RevPAR. Data completeness is not guaranteed. Investor-specific sharing remains roadmap, separate from live operating reports.
- Fix the check-in moment. Add a 23:47 example of continued 24/7 Lammy assistance, not a scheduled bot activation.
- Default to Vietnamese for new visitors regardless of browser language. Preserve explicit EN query parameter and a visitor's saved language choice.

## Images and interaction

Four selectable scenes; no autoplay, native buttons, native dialog with Escape and focus restoration, lazy WebP images. Lightweight MacBook/iPhone-style CSS frames, no device images requiring external licensing or AI-generated interface text.

Timeline, P&L and QC screenshots render actual components from local Ops commit 1127666f (UI lineage of approved PR104). See scripts/screens. All names, rooms, money and session data are synthetic and backend writes are blocked. The Lammy scene is a clearly labelled illustrative conversation, not the Zalo/Messenger UI or a customer transcript. No hotel/guest production data, credentials, or document photos are included.

Assets are captured with the browser and encoded with cwebp; raw JPGs stay local/ignored. Only final WebP files ship. The screen-generation harness uses the sibling Ops workspace, not the public runtime. The public landing remains static HTML/CSS/JS and uses no new external service.

## Release gate

Test claims, Vietnamese default, EN/VI coverage, unique anchors and image assets. Browser dogfood: desktop and 390px mobile screen selection, enlarge/close/Escape, image loading, day-scroll and contact anchors without submitting the form. Verify Pages build and live assets after merge.

## Verification performed

- Four DOM smoke tests passed: default VI with an English browser, explicit EN/saved preferences, no unverified proof-point numbers, live P&L, seven day moments, unique anchors, all four local WebP files and bilingual gallery selection.
- Real browser at 390px and desktop: all four images loaded; no document horizontal overflow; modal enlarged the actual image (1440px source displayed at 856px on desktop and 318px mobile), Escape/close restored focus. EN captions had no missing translations. Contact submission was not performed.
- Fixed intrinsic image height affecting device aspect ratio during visual QA. The revised image frame preserves the source ratio rather than cropping it. Both raw source images and local evidence screenshots are excluded from Git; final WebP assets total about 144 KiB.
- React source-render harness review: real components imported rather than duplicated; stable fixture references, fixed non-PII data, no real backend URL/client, writes explicitly rejected. The public page does not bundle React or the harness.
- To run tests in a fresh clone: npm install, then npm test. To regenerate source screenshots, use the named sibling Ops workspace and its Vite toolchain; scripts/screens/vite.config.ts explicitly aliases the safe fixtures.
