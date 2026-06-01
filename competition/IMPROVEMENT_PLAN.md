# Marble Adventure — Improvement Plan

**Project:** `competition/marble-adventure/`  
**Status:** Playable prototype — hub + browser Spark handoff  
**Goal:** A small game people want to visit twice, not just a fleet tech demo  
**Updated:** 2026-05-22

---

## Current state (baseline)

| Works | Rough / missing |
|-------|-----------------|
| FPS hub, 8 portals A–H (alphabetical), inner 5 + outer 3 bonus | Hero worlds not yet regenerated from `WORLD_PROMPTS.md` |
| Browser Spark / public Marble handoff (no player account) | itch page still **draft**; upload **hidden** on `win` channel |
| Tour 5/5 + bonus 3/3, shape puzzle, architect tokens, save | Return flow still Alt+Tab / close tab (no in-game return portal) |
| Title screen, settings, Fleet Museum, fleet terminals, E-notes | Bundled thumbs may 404 until `just marble-adventure-thumbs` |
| `play.ps1`, `ship-itch.ps1`, hidden Butler push | Public itch GIF + screenshots not uploaded |
| Godot 4.4 + Windows export (`0.1.0-prototype`) | Steam deferred (P5) |

**Architecture:** Hub in Godot; worlds in **browser Spark / public Marble** (correct for full splat quality). In-engine GLB remains a separate fleet track (`godot-mcp`).

**Docs:** [MCD Marble Adventure](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md) · [PRD](../docs/PRD_MARBLE_ADVENTURE.md) · [competition/README.md](./README.md)

---

## Success criteria (definition of “done enough”)

1. **5-minute session:** Player understands hub → portal → explore → return without instructions.
2. **3 worlds minimum** feel distinct (thumb + blurb + Spark load reliable).
3. **One clear goal** (collect, tour checklist, or timed gallery — not required to be deep).
4. **Windows export** runs on a second PC with documented deps (or hosted Spark URLs).
5. **itch page** (hidden → public) with honest “prototype” label + AI/Marble disclosure.

Steam remains **Phase 4+** ($100 Direct, store art, Windows-only packaging).

---

## Phase 0 — Polish pass (1–2 days)

*Make the existing hub feel intentional.*

| Task | Detail | Files |
|------|--------|-------|
| Commit preview assets | Run `download_world_thumbs.ps1`; add `worlds/*_thumb.webp` to repo or LFS | `competition/download_world_thumbs.ps1`, `worlds/` |
| Audio pass | Ambient hub loop + soft portal hum + UI click | `assets/audio/`, `hub_manager.gd` |
| Portal feedback | Ring pulse on approach; brief flash on trigger; cooldown visible | `portal.gd`, shader or `AnimationPlayer` |
| Config externalize | Move portal table to `portals.json` (slug, marble_id, url, label, description, color) | `data/portals.json`, load in `hub_manager.gd` |
| Fix Space-to-center | Space currently teleports player — rebind to jump or rename hint | `player.gd`, `COMPETITION.md` |
| Quality gate | `godot --headless --quit-after 1` in CI or `just marble-adventure-check` | `worldlabs-mcp/justfile` |

**Exit:** Hub looks and sounds finished; all 8 thumbs local; no magic strings in GDScript.

---

## Phase 1 — Game loop (3–5 days)

*Give the player a reason to use multiple portals.*

**Recommended loop: “World tour checklist”**

- HUD shows **0/8 worlds visited**.
- Entering a portal marks world visited (persist `user://visited.json`).
- Center monolith updates (orb color / particle intensity) as count rises.
- At 8/8: short on-screen message + optional “thanks for touring” card.

| Task | Detail |
|------|--------|
| Visit tracking | `WorldManager` + save file |
| Return flow | HUD: “Close Spark tab, press R to reset view” or auto-detect focus |
| Portal lock (optional) | Start with 3 worlds unlocked; unlock rest after 1 visit |
| Minimap / compass | Small hub map showing visited rings |

**Alternative loops** (pick one if checklist feels thin):

- **Relic hunt:** one hidden object per Spark world (2D overlay in Spark if supported, or hub-only tokens).
- **Timed tour:** beat 8 worlds in N minutes.

**Exit:** Playtester completes tour without asking “what do I do?”

---

## Phase 2 — Integration & reliability (3–5 days)

*Reduce “works on my machine” friction.*

| Task | Detail | Owner repo |
|------|--------|------------|
| Spark URL strategy | Env var `SPARK_BASE_URL` (default `http://127.0.0.1:10864`) + fallback to `marble.worldlabs.ai` | `marble-adventure` |
| One-click launch | `competition/play.ps1`: start worldlabs web + open Godot export | `worldlabs-mcp` |
| Health check screen | Hub startup: ping :10864; show red banner if Spark offline | `hub_manager.gd` |
| Embed Spark (stretch) | Evaluate CEF / external window positioned over “portal frame” — high effort | defer unless required |
| In-engine preview (stretch) | Import Chisel GLB in hub ring as low-res stand-in; Spark still on enter | `godot-mcp` fleet import |
| MCP live portals | Optional: generate new portal from worldlabs-mcp at runtime via bridge | `mcp_bridge.gd`, `worldlabs-mcp` |

**Exit:** Friend can run with `play.ps1` + documented `.env`; 3 worlds open without manual URL editing.

---

## Phase 3 — Content & presentation (2–4 days)

| Task | Detail |
|------|--------|
| Curate to 5 worlds | Drop weakest 3 or hide behind “bonus” ring |
| Rewrite blurbs | Shorter, readable at distance; one line title + one line hook |
| Trailer GIF | 30s hub walk + portal enter + Spark orbit |
| Title screen | Simple menu: Play / Controls / Credits (Marble, World Labs, Godot) |
| Accessibility | FOV slider, mouse sensitivity, color-blind portal icons |

**Exit:** itch page has GIF + 3 screenshots that sell the fantasy.

---

## Phase 4 — Ship to itch (1–2 days)

| Task | Detail |
|------|--------|
| Windows export | Godot export preset; bundle README with Spark dependency |
| itch page | Free, prototype tag, AI disclosure (Marble worlds + tooling) |
| Two distribution modes | **A)** Zip + local Spark setup **B)** Hosted Spark URLs only (no local worldlabs) |
| godot-mcp path | Optional: `ship_to_itch` windows build once project path is stable | `godot-mcp/docs/ship-to-itch.md` |

**Exit:** Public or unlisted itch URL shareable.

---

## Phase 5 — Steam (optional, later)

Only if Phase 3 loop is fun and visuals hold up.

| Requirement | Notes |
|-------------|-------|
| $100 Steam Direct | Per `mcp-central-docs/docs/gamedev/STEAM_PUBLISHING.md` |
| Windows build | No browser-only dependency ideally — or document Steam + browser as feature |
| Store capsules | 5+ screenshots, short/long description |
| Beta branch testing | `just steam-ship-beta dry_run=false` via godot-mcp + steam-mcp |

**Defer** until itch feedback says “I’d pay for this” or portfolio value is clear.

---

## Fleet cross-links (parallel, not blocking game)

| Track | Purpose |
|-------|---------|
| `godot-mcp` game_builder | Prompt → worlds → scene (different product surface) |
| `godot-mcp` fleet GLB import | In-engine collision mesh worlds (ugly but walkable) |
| `godot-mcp` `/ship-steam` | When Windows product exists |
| `worldlabs-mcp` `/portals` | Painting Portals — separate UX, reuse thumb download |

Do not merge game_builder auto-pipeline into Marble Adventure until hub loop is proven.

---

## Priority order (recommended)

```
P0 Polish → P1 Tour loop → P2 play.ps1 + URL env → P3 itch assets → P4 itch ship → P5 Steam
```

**This week:** P0 + start P1 (visit tracking).  
**Next week:** P2 + P3.  
**Ship itch:** when a non-dev completes a full tour on a clean machine.

---

## Out of scope (for now)

- Full in-engine Gaussian splat rendering in Godot
- Multiplayer / synced portal state
- Procedural infinite portals
- Mobile / Web HTML5 export (browser handoff breaks)
- Replacing Spark with fake panoramas inside rings

---

## Tracking

| Phase | Status | Target |
|-------|--------|--------|
| P0 Polish | ✅ Done (config JSON, audio, portal FX, controls, just check) | 2026-05-22 |
| P1 Game loop | ✅ Done (tour 5/5, bonus 3/3, save, completion) | 2026-05-22 |
| P2 Integration | ✅ Done (health banner, play.ps1 + .env, CDN thumbs, hosted Spark mode) | 2026-05-22 |
| P3 Presentation | ✅ Done (5+3 curation, blurbs, title screen, settings, marketing guide) | 2026-05-22 |
| P4 itch | 🟡 Shipped hidden build; page draft | |
| P5 Steam | ⬜ Deferred | |
| P6 Vision | ✅ Agent terminals, shape tour, tokens, layered audio, WORLD_PROMPTS, regen script | 2026-06-01 |
| Docs / MCD | ✅ `docs/games/` page, PRD, changelogs, cross-links | 2026-06-01 |

Update this table as phases complete.
