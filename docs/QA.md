# Lumenfall — Browser QA and release gates

**Status:** v0.5 candidate. The deterministic rule and mocked UI/Canvas suites pass. A real-browser, end-to-end visual verification and live GitHub Pages verification have not been completed from this environment.

This checklist is a **manual QA protocol**, not a claim that the checks below have been performed.

## 1. Publication and loading

- [ ] Confirm [GitHub Pages](https://trukwava.github.io/lumenfall-game/) returns HTTP 200 and displays the title screen; check the repository's **Settings → Pages** deployment status.
- [ ] Confirm `index.html`, `style.css`, `core.js`, and `game.js` are loaded with no 404s or JavaScript console exceptions.
- [ ] Open with a fresh/private browser profile; verify the seed input, new-run button, readable menus, and responsive board.
- [ ] Confirm no external fonts, scripts, trackers, or backend requests are required by the game.

## 2. Gameplay progression

- [ ] Start seed **0** for the authored baseline. The start chamber is *The Shattered Passage*.
- [ ] Move one tile; verify 1 AP is spent. Aim; verify 1 AP is spent. Toggle; verify 1 AP is spent. No fourth action should be accepted on a 0-AP turn.
- [ ] Verify the lantern ray stops at walls and that the exposed enemy target is highlighted.
- [ ] Verify F and clicking an illuminated enemy both perform Radiant Strike. An unilluminated or defeated enemy cannot be hit.
- [ ] Verify ending a turn resolves **exactly** the threats shown in the forecast. Check damage and enemy movement, including an Ash Ward absorption.
- [ ] Verify undo restores position, AP, lantern state, and enemy health until ending a turn; undo must not cross an enemy phase.
- [ ] Clear each chamber and select a relic. Check the full path through the Cinder Labyrinth and Mirror Vault to the Eclipse Sanctum.
- [ ] Defeat the Eclipse Heart and confirm the victory overlay appears, saved run disappears, and a personal-best record is kept.
- [ ] Die in a separate run and confirm defeat, no softlock, and that Descend Again starts a new run.
- [ ] Repeat with at least two nonzero seeds. The placements should vary but remain on reachable tiles.
- [ ] Confirm the boss pulse pierces walls when the player is illuminated and nearby, and its warning is visible before committing.

The repository includes a **complete six-chamber winning-route regression** in `tests/winning-run.test.cjs`. It is a repeatable sequence of legal actions, not artificial enemy elimination.

## 3. Persistence and safety

- [ ] Move once, refresh, choose **Continue Saved Run**, and check the exact position, AP, seed, and enemy state.
- [ ] Refresh on a relic-selection screen; confirm the pending reward can still be selected.
- [ ] Clear the browser's local storage and verify the game starts normally with no Continue button.
- [ ] Verify closing/canceling the restart dialog leaves the current saved run intact.
- [ ] Verify confirming restart replaces the saved run with a new one.
- [ ] Verify a completed run can restart, and that previous records persist.
- [ ] Verify storage-disabled/private-browsing conditions do not crash the game.

## 4. Shareable seeds

- [ ] Leave Challenge Seed blank and start two new descents; check that nonzero seeds are generated and displayed above the board.
- [ ] Enter a known seed such as `183604`. Verify the same enemy positions occur after restarting with the same seed.
- [ ] Click the board's **COPY** control while hosted over HTTPS. Paste the URL and verify it contains `?seed=183604`.
- [ ] Open the link in a fresh tab. Verify the seed field is pre-filled and the same layout loads after pressing Begin New Descent.
- [ ] Check that invalid/out-of-range URL values are ignored safely.

## 5. Controls and accessibility

- [ ] Play an encounter using only keyboard: WASD, Shift+arrows, L, F, Enter, Z, H, and R.
- [ ] Navigate title screen, relic cards, settings, restart dialog, and end screen with Tab/Shift+Tab and Enter/Space.
- [ ] Verify focus remains visible, modal dialogs trap focus as expected, Escape dismisses dialogs, and no keyboard shortcut acts behind an open modal.
- [ ] Check reduced motion and motion-off settings: no distracting flashing, screen shake or drifting effects.
- [ ] Check OS high-contrast preferences, visibility of danger markers, legible UI text, and non-color-only cues.
- [ ] Use a screen reader to verify battlefield coordinates, health, action points, enemy status and expected damage are announced meaningfully.
- [ ] Check sound-off preference persists after reload and that audio does not play before interaction.

## 6. Layout and performance

- [ ] Test Chrome, Firefox and Safari on desktop, with DevTools console open.
- [ ] Check window sizes of approximately 1440×900, 1024×768, 768×900 and 390×844 CSS pixels.
- [ ] Confirm no horizontal page overflow, clipped modal buttons, unreadable relic cards, or Canvas pointer offset errors.
- [ ] With 6 relic cards displayed, verify the reward panel scrolls without pushing choices outside the board.
- [ ] Record frame timing on ordinary laptop hardware. Aim for smooth animation; flag sustained frame drops, memory growth, and unnecessary enemy-simulation work.
- [ ] Confirm the Canvas stops recalculating forecasts every frame; it should reuse cached predictions until state changes.

## 7. Reporting issues

Include **browser/version**, **device/viewport**, **seed**, **chamber**, **relics**, **exact actions**, **expected vs actual outcome**, **screenshot or screen recording**, and **console stack trace** when available.

File bugs in [GitHub Issues](https://github.com/trukwava/lumenfall-game/issues). Prioritize blockers (cannot start, win, or resume), incorrect combat forecasts, crashes, and accessibility failures before adding more content.

## Release criteria

Do not advertise the game as fully polished or production-verified until: (1) GitHub Pages deployment is confirmed, (2) the automatic tests pass in GitHub Actions, (3) a real browser playthrough reaches victory and defeat, and (4) the accessibility and layout checks above have been completed. All four remain independent of the isolated JavaScript test harness.
