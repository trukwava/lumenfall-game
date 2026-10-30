# Lumenfall — The Last Lamplighter

A dark-fantasy, turn-based tactical game about using **light as both a weapon and a liability**, playable in a desktop web browser.

**Current release: Three-Chamber Descent (Milestone 2).** This is a short, playable campaign with a beginning, relic interludes, and a definitive victory/defeat ending. It is not yet the planned six-chamber roguelite with an Eclipse Heart boss.

## Play

**[Play on GitHub Pages](https://trukwava.github.io/lumenfall-game/)** (requires Pages to be enabled on the `main` branch, root folder).

You can also download the repository and open `index.html`. All code, visuals, and synthesized sound are self-contained; no package installation or backend is required.

## How to play

Each turn gives you 3 AP. Use the lantern to expose enemies and Radiant Strike to damage them. While the lantern is lit, Watchers can find you in open firing lanes. Extinguishing it can save you—but adjacent enemies still attack. Enemy moves and predicted damage are shown before you end your turn.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move one orthogonal tile |
| Shift + arrow keys | Aim lantern |
| L | Toggle lantern |
| F | Strike a lit enemy |
| Enter | Resolve the predicted enemy turn |
| Z | Undo the last player action |
| Mouse | Select lit enemies, move to adjacent tiles, and use command buttons |

Clear **The Shattered Passage**, **The Veiled Gallery**, and **The Starless Altar** in a single run, carrying remaining health from chamber to chamber.

After the first two chambers, choose one relic (each unique):

- **Longwick:** Extend your lantern beam by one tile.
- **Ash Ward:** Absorb the first enemy hit in each subsequent chamber.
- **Emberwell:** Heal two points immediately (up to max health).

Each chamber has an authored wall layout and enemy formation. Your current chamber and acquired relics appear in the HUD.

## Architecture

- `core.js`: deterministic, pure simulation; game-state transitions, enemy logic, line-of-sight, attack preview, chamber progression, and relics.
- `game.js`: Canvas rendering, UI input, animations, and synthesized WebAudio.
- `index.html` + `style.css`: responsive interface, menus, and overlays.
- `tests/core.test.cjs`: combat rules and deterministic preview regressions.
- `tests/campaign.test.cjs`: relic, room-transition, and victory regressions.
- `.github/workflows/tests.yml`: GitHub Actions unit-test workflow.

All gameplay logic is separated from presentation. No runtime or build dependencies are needed.

### Test locally

Requires Node.js 20 or later:

```bash
node --test tests/*.test.cjs
```

The suite currently has **28 tests**. Local tests passed before this update was pushed. Browser QA and hosted Pages deployment should still be checked independently.

## Deploy

In **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/(root)**, and save. The expected deployment address is:

https://trukwava.github.io/lumenfall-game/

GitHub Pages may take time to complete its first deployment. A working Pages URL should be verified in a normal browser.

## Roadmap

1. Finish manual browser QA of the three-chamber run and balance its difficulty.
2. Add a fourth and fifth chamber with new tactical patterns and more relic interactions.
3. Develop the Eclipse Heart boss and a six-chamber campaign.
4. Add saving/resuming runs, accessibility refinements, and richer audiovisual effects.
5. Cut a fully tested first public release.

The game art is drawn procedurally by its renderer; no external visual assets are bundled. No license for reuse is granted by default.
