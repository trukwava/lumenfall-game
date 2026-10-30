# ✦ Lumenfall — The Last Lamplighter

**Six chambers. Three actions per turn. One dying flame.**

Lumenfall is a complete, self-contained **turn-based tactical browser game** about light and concealment. You are the last Lamplighter: illuminate enemies to strike them, but the same lantern reveals your position to predators.

**Current development milestone: v0.5 — The Living Observatory.** The full six-chamber campaign, deterministic boss, multiple relic builds, replayable challenge seeds, and local save/resume are implemented. Browser compatibility and full visual QA are still in progress; this is not yet a final release certification.

## Play

**[Play in the browser (GitHub Pages)](https://trukwava.github.io/lumenfall-game/)**

GitHub Pages must be configured for the `main` branch and `/(root)`. A successful live deployment has **not been independently confirmed** in this conversation. Alternatively, clone or download this repository and open `index.html` in a modern desktop browser. No dependencies, backend, accounts, or asset downloads are required.

## The game

Traverse six authored rooms, each with a different atmospheric treatment and enemy formation:

| Act | Room | Challenge |
|---|---|---|
| I | The Shattered Passage | Your first encounter with Skitters and a Watcher |
| I | The Veiled Gallery | A new arrangement of cover and firing lanes |
| II | The Starless Altar | Four enemies; hide, reposition, and choose your attacks |
| II | The Cinder Labyrinth | Constricted routes through ember-lit stone |
| III | The Mirror Vault | Watchers guard competing firing lanes |
| III | The Eclipse Sanctum | Defeat the five-health **Eclipse Heart** boss |

There are **3 action points per player turn**. Movement, lantern aiming, toggling the lantern, and Radiant Strike each cost 1 AP. Ending your turn commits the enemy phase. The game previews each enemy's exact action and predicted damage before you commit.

Light enables your attack, but exposed players can be targeted by Watchers and the Eclipse Heart. Shadow hides you from distant ranged attacks, not adjacent enemies. The boss's periodic close-range pulse ignores walls when the player is illuminated.

### Controls

| Input | Action |
|---|---|
| WASD / arrow keys | Move one orthogonal tile |
| Shift + arrow keys | Rotate the lantern |
| L | Toggle lantern on/off |
| F | Strike nearest illuminated enemy |
| Mouse / tap | Select an illuminated enemy, move one tile, use buttons |
| Enter | Resolve the enemy turn |
| Z | Undo an action before ending the turn |
| H / ? | Open instructions |
| R | Request a new run (requires confirmation) |

### Relics

After the first five rooms, choose one relic that lasts for the current run. Relics cannot be selected twice.

- **Longwick** — +1 lantern range.
- **Ash Ward** — Negates the first enemy hit in each later chamber.
- **Emberwell** — Restore 2 health immediately, up to your maximum.
- **Starheart** — Increase maximum health by 1 and heal 1.
- **Brightsteel** — Deal 2 damage instead of 1 to Watchers and the Eclipse Heart.
- **Pilgrim Flame** — Heal 1 upon entering subsequent chambers.

## Replayable seeded encounters

Leave the **Challenge Seed** field blank to generate a new arrangement of enemy starting positions on the authored maps. Enter an unsigned 32-bit number, such as `123456`, to repeat the same arrangement. **Seed 0** is the original, fixed campaign used by the canonical full-run regression.

When playing on the HTTPS GitHub Pages site, select **COPY** above the board to share a link such as:

`https://trukwava.github.io/lumenfall-game/?seed=123456`

Opening a shared link pre-fills the numeric seed. Random enemy spawns are constrained to accessible, valid positions, with a seeded deterministic algorithm. Room geometry and enemy types stay authored.

A personal-best victory record (fewest turns, then most remaining health) is stored locally, including its seed.

## Saving, privacy, and accessibility

Your current run is saved automatically in **localStorage** after successful actions. On refresh, **Continue Saved Run** restores chamber, player and enemy state, AP, relics, and seed. The current turn's undo history is not retained across refresh. Starting a new descent or confirming restart replaces the saved run; victory or defeat clears it.

Settings and personal bests are saved locally. There is no user account, analytics service, backend, or data upload. If storage is disabled, gameplay still works but persistence may not.

Accessibility features include keyboard controls, explicit threat descriptions, an accessible tactical-state announcement, high-contrast and reduced-motion preferences, independently toggled sound/motion settings, and a confirmation before destructive restart. A full assistive-technology audit is still outstanding.

## Architecture

| File | Responsibility |
|---|---|
| `core.js` | Pure deterministic combat simulation, enemy AI, seeded spawns, progression, save validation |
| `game.js` | Canvas rendering, chamber atmosphere, input, animation, audio, UI, save/resume and records |
| `index.html` | Semantic UI, controls, dialogs, game entrypoint |
| `style.css` | Responsive dark-fantasy visual design and accessibility overrides |
| `tests/*.test.cjs` | Core rules, campaign, winning route, seed fuzzing, Canvas and UI smoke tests |
| `.github/workflows/tests.yml` | Node.js test workflow for pushes and pull requests |
| `docs/QA.md` | Manual browser QA plan and known limitations |

The simulation never reads frame rate or rendering state. The Canvas layer consumes deterministic game-state snapshots. Enemy intentions are computed once on state changes and reused during animation frames.

## Running tests

Requires Node.js 20+ and no npm dependencies:

```sh
node --test tests/*.test.cjs
```

**56/56 checks passed in the isolated JavaScript harness against GitHub source at this milestone**, covering the complete legal-action winning route, 1,000 encounter seeds, save/resume, destructive-action safeguards, Canvas frame rendering, and the six environments. This is **not** a substitute for verifying the real GitHub Actions run or running browser-based end-to-end tests; those remain unconfirmed here.

## Release readiness

The game is functionally playable as a six-chamber campaign. Before labeling it a polished public release, complete the manual and browser QA steps in [docs/QA.md](docs/QA.md), including GitHub Pages, full gameplay, keyboard/mouse, reduced motion, sound, and Safari/Firefox/Chrome compatibility.

All procedural artwork and synthesized audio are original to this repository. **No open-source license is granted by default.**
