# Lumenfall — The Last Lamplighter

A dark-fantasy, turn-based tactical browser game: **light is both your weapon and your liability**.

**Milestone 4: Six-Chamber Descent (v0.4).** The full planned six-chamber structure, persistent relic selections, a boss encounter, win/lose loop, and local save/resume are implemented. This is a gameplay-complete first campaign **candidate**, not yet a fully browser-QA-verified release.

## Play

**[Play Lumenfall on GitHub Pages](https://trukwava.github.io/lumenfall-game/)**. Hosting requires GitHub Pages to be enabled for the `main` branch at `/(root)`. The deployment has not yet been independently confirmed in this session.

You can also clone/download the repository and open `index.html` in a modern browser. The game has no runtime dependencies, backend, accounts, or external art assets.

## Gameplay and controls

Each player turn provides 3 action points. Illuminate enemies to make Radiant Strike available. The light also makes you vulnerable to ranged Watchers and the Eclipse Heart. Turning off the lantern conceals you from distant threats, but adjacent enemies still attack. A visible enemy-intent panel previews the exact committed enemy phase.

| Input | Action |
|---|---|
| WASD / arrow keys | Move one tile (1 AP) |
| Shift + arrow keys | Aim lantern (1 AP) |
| L | Toggle lantern (1 AP) |
| F | Strike the nearest illuminated enemy (1 AP) |
| Enter | End turn, resolve enemy intents |
| Z | Undo an action within the current turn |
| Mouse | Select enemies, move to adjacent tiles, use HUD controls |
| H / ? | Help |

Clear all six authored rooms in sequence:

1. The Shattered Passage
2. The Veiled Gallery
3. The Starless Altar
4. The Cinder Labyrinth
5. The Mirror Vault
6. The Eclipse Sanctum — **Eclipse Heart boss**

Health and relics carry between rooms. There are five relic selections, after rooms 1–5. The six unique relics are:

| Relic | Effect |
|---|---|
| Longwick | +1 lantern range |
| Ash Ward | Negates the first enemy hit in each subsequent chamber |
| Emberwell | Heal 2 immediately, capped by maximum health |
| Starheart | +1 maximum health and heal 1 immediately |
| Brightsteel | Deal 2 damage to Watchers and the Eclipse Heart with Radiant Strike |
| Pilgrim Flame | Heal 1 when entering each later chamber |

The Eclipse Heart has five health, pursues the player's last-known position, attacks along clear lanes, and pulses at close range on alternating turns if the player is illuminated. As with other enemies, its intent is deterministic and previewable.

## Save and resume

Your browser automatically saves after successful actions. On reload, **Continue Saved Run** appears if a valid save exists, and restores your position, health, AP, chamber, relics, and enemy states. The current turn's undo history does **not** survive reload. Starting a new game replaces the saved run; victory or defeat clears the active save. Data stays in your browser's local storage.

Save validation rejects corrupted or incompatible game states. Browser privacy settings may disable local storage, in which case gameplay continues but progress cannot be saved.

## Architecture

- `core.js`: renderer-independent, deterministic game rules, combat, line-of-sight, enemy phases, relics, progression and state validation
- `game.js`: Canvas renderer, player input, animations, synthesized audio, auto-saving, and UI integration
- `index.html`, `style.css`: menus, responsive interface, and relic selection
- `tests/core.test.cjs`: core mechanics and intent-preview consistency
- `tests/campaign.test.cjs`: chamber transitions, boss mechanics, relic effects, and save-state validation
- `tests/interface.test.cjs`: static entrypoint and DOM integration checks
- `.github/workflows/tests.yml`: automated testing on commits and PRs

## Test

Node.js 20+:

```bash
node --test tests/*.test.cjs
```

**37/37 tests passed** against the current GitHub source in an independent JavaScript test harness. Syntax was also checked for all JavaScript source and test files. The GitHub Actions result and end-to-end browser playthrough have not been independently verified in this conversation; they should be checked before declaring release readiness.

## Publish with GitHub Pages

Open [Settings → Pages](https://github.com/trukwava/lumenfall-game/settings/pages), set **Deploy from a branch → main → /(root)**, and save. The expected published address is:

https://trukwava.github.io/lumenfall-game/

## Remaining priorities

- Run an end-to-end browser playthrough covering all six rooms, relic screens, boss, reload/resume, and failure states.
- Balance accumulated damage and relic availability to keep the entire campaign consistently winnable.
- Improve the boss's warning animations and arena identity.
- Add seeded encounter variation and richer post-run statistics.
- Validate Chrome, Firefox, Safari and narrower mobile viewports, including reduced-motion preferences.

This repository contains original procedural art and self-contained synthesized audio. No explicit license for reuse has been granted.
