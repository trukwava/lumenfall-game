# Lumenfall — The Shattered Passage

A browser-playable tactical game of **light and shadow**. You are the last Lamplighter: aim an ancient lantern to expose enemies, but its glow can also betray your position.

**Status:** Milestone 1, a complete single-room encounter. The six-chamber roguelite, relics, and final boss are planned, not yet implemented.

## Play

Open [index.html](index.html) in a modern browser, or use GitHub Pages once enabled for this repository. No build step, external assets, or package downloads are required.

## Controls

| Control | Action |
| --- | --- |
| WASD / Arrow keys | Move one tile (1 AP) |
| Shift + Arrow keys | Aim lantern (1 AP) |
| L | Toggle lantern (1 AP) |
| F | Strike illuminated enemy (1 AP) |
| Enter | End turn |
| Z | Undo within current turn |
| H / ? | Help |
| Mouse | Move to adjacent tiles, select lit enemies, and use HUD buttons |

Each turn grants 3 action points. The lantern illuminates up to four cardinal cells, stopped by walls. Defeat three enemies to win. Watchers attack visible targets in unobstructed firing lanes; Skitters pursue the player. The enemy intent preview is calculated using the same deterministic simulation as the actual enemy turn.

## Files

- `index.html`: web UI, playable entrypoint
- `style.css`: responsive dark-fantasy UI
- `core.js`: deterministic, rendering-independent game rules, state machine, pathfinding, threat preview, undo
- `game.js`: Canvas rendering, input, visual effects, WebAudio
- `tests/core.test.cjs`: automated rules tests (Node.js built-in test runner)

Run tests: `node --test tests/core.test.cjs`. The game is entirely client-side; it does not require an account or a backend.

## Publish with GitHub Pages

Open **Settings → Pages**, select **Deploy from a branch**, then choose **main** and **/(root)**. Save. When deployment completes, the expected address is:

https://trukwava.github.io/lumenfall-game/

The URL will only work once GitHub Pages is enabled and GitHub has completed the deployment.

## Roadmap

1. Verify the core light-versus-concealment mechanic through playtesting.
2. Add varied authored room templates and seeded encounter selection.
3. Add relics and multi-room progression.
4. Add an elite encounter, the Eclipse Heart boss, and a complete ending.
5. Refine visual effects, sound, accessibility and browser compatibility.

All included artwork is original and rendered by the game itself. No third-party visual assets are packaged. No explicit open-source license has been granted; contact the repository owner for reuse permissions.
