# Lumenfall changelog

Changes listed here describe what is **implemented in repository source**, not a guarantee of deployed-site verification.

## v0.5.1 — Release-readiness pass (2026-10-30)

- Added a reproducible legal-action full-campaign winning route for challenge seed `183604`, alongside the canonical seed-zero victory route.
- Added deterministic seeded enemy placement variations across all six authored rooms; validated 1,000 seeds for valid spawns and room transitions.
- Added numeric challenge seed input, shareable `?seed=...` links, a copy control, and invalid-seed feedback.
- Added personal-best records (fewest turns, then remaining health).
- Added restart confirmation to protect active saves and made Continue restore valid run state.
- Added environment-specific atmospheric artwork for six rooms, a three-act HUD, a clearer Eclipse Heart pulse warning, high-contrast styling, and screen-reader battlefield descriptions.
- Avoided enemy simulation on every animation frame by caching its forecast after state changes.
- Hardened persisted-state validation against malformed coordinates, impossible phases, bogus relics, and incomplete records.
- Added cache-versioned frontend asset references and build identifier `0.5.1`.
- Added static interface, full-campaign, seed-fuzz, UI/Canvas rendering, save/resume, and restart tests; **60/60 checks passed in the isolated JavaScript harness**.
- Added a browser QA protocol and [release gate issue #1](https://github.com/trukwava/lumenfall-game/issues/1).

**Outstanding:** confirm deployed Pages URL, GitHub Actions success, actual Chrome/Firefox/Safari playthroughs, accessibility and performance. No published production release has been verified.

## v0.4 — Complete campaign structure

- Expanded from four to six chambers, with the Cinder Labyrinth and Mirror Vault.
- Added Starheart, Brightsteel and Pilgrim Flame to the three original relics.
- Added local save/resume and save-state validation.
- Added deterministic gameplay, campaign and UI integration tests.

## v0.3 — Eclipse Heart

- Introduced the Eclipse Sanctum, the Eclipse Heart enemy, pursuit behavior, and periodic pulsing attacks.
- Extended the campaign from three to four chambers.

## v0.2 — Three-Chamber Descent

- Introduced the Veiled Gallery and Starless Altar.
- Added inter-chamber relic selection, persistence of player health, and a campaign-ending victory.

## v0.1 — The Shattered Passage

- Established the original 8×8 battle, 3 AP, directional lantern, Radiant Strike, Skitters and Watchers, deterministic enemy previews, undo, title screen, loss/victory loop, audio, and procedural Canvas artwork.
- Separated core simulation from rendering.
