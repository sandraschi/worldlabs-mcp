# Marble Adventure — Product Requirements (PRD)

**Version:** 0.2.0 (prototype)  
**Repo:** `worldlabs-mcp/competition/marble-adventure/`  
**Canonical fleet doc:** [mcp-central-docs/docs/games/MARBLE_ADVENTURE.md](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md)  
**Last updated:** June 2026

---

## Problem

World Labs Marble produces stunning Gaussian splat worlds, but there is no **player-facing product** in the fleet that showcases:

1. Multi-world curation as a **coherent experience**
2. **Agentic development** (MCP-generated worlds + Godot hub + automated ship)
3. **Zero-friction play** for friends (no World Labs account)

---

## Solution

A small **Windows hub game** that:

- Presents **5 featured + 3 bonus** Marble worlds as ring portals (A–H, alphabetical)
- Opens each world in the **browser** (public Marble or local Spark)
- Teaches the **fleet story** via terminals, portal notes, and title-screen museum
- Ships to **itch.io** via Butler (hidden channel while draft)

---

## Goals

| ID | Goal | Metric |
|----|------|--------|
| G1 | Player understands hub → portal → browser without instructions | Playtest completes tour in &lt;5 min |
| G2 | Worlds feel distinct | 5 featured with unique thumbs + blurbs |
| G3 | Fleet / agent story visible | ≥3 terminal interactions or E-notes per session |
| G4 | itch playable on second PC | Windows zip + public Marble URLs |
| G5 | Author can refresh worlds | `WORLD_PROMPTS.md` + regen script + UUID swap |

---

## Non-goals

- In-engine Gaussian splats in Godot
- Multiplayer
- HTML5 itch export
- Steam (until itch validates fun)
- Merging `godot-mcp` `game_builder` auto-pipeline into hub

---

## Users

| Persona | Needs |
|---------|-------|
| **Player (friend / itch)** | Download, play, no API keys, browser for worlds |
| **Author (you)** | Regen worlds, push builds, keep draft hidden |
| **Fleet demo audience** | See MCP → Marble → Godot → itch pipeline |

---

## Core loop

1. Title screen → **Play**
2. Explore hub (ambient audio, A–E rings, F–H bonus)
3. Walk through portal → browser world
4. Return → tour counter / optional shape puzzle / tokens
5. Complete 5/5 → completion panel

---

## Features (shipped)

| Feature | Priority | Status |
|---------|----------|--------|
| Public Marble URLs (no player account) | P0 | ✅ |
| Title screen + settings | P0 | ✅ |
| Tour 5/5 + bonus 3/3 + save | P1 | ✅ |
| itch Windows export + hidden Butler push | P4 | ✅ upload |
| Alphabetic portal order A–H | P6 | ✅ |
| Multiline prompt playbook | P6 | ✅ |
| Fleet terminals + E portal notes | P6 | ✅ |
| Shape tour puzzle | P6 | ✅ |
| Architect tokens | P6 | ✅ |
| Layered hub ambient audio | P6 | ✅ |
| Spark TTS welcome (local mode) | P6 | ✅ |
| Hero world regen (new UUIDs) | G5 | ⬜ author |
| itch public + GIF/screenshots | P4 | ⬜ |
| Steam | P5 | ⬜ deferred |

---

## Technical constraints

| Constraint | Decision |
|------------|----------|
| Renderer | Browser Spark / public Marble only |
| Config | `data/portals.json` + `portal_meta.json` |
| Ship script | `competition/ship-itch.ps1` (not godot-mcp path validation) |
| Godot | 4.4, Windows Desktop export |
| MCP runtime in player build | Optional `mcp_bridge.gd` (dev); not required for itch |

---

## Success criteria (release)

- [ ] Draft unchecked on itch with cover + 3 screenshots
- [ ] Non-dev completes 5/5 tour on clean Windows PC
- [ ] At least 2 featured worlds regenerated from `WORLD_PROMPTS.md`
- [x] MCD page + repo docs current (this PRD included)

---

## References

| Doc | Path |
|-----|------|
| Improvement plan | `competition/IMPROVEMENT_PLAN.md` |
| World access | `competition/WORLD_ACCESS.md` |
| Ship itch | `competition/SHIP_ITCH.md` |
| Prompts | `competition/WORLD_PROMPTS.md` |
| Competition overview | `docs/COMPETITION.md` |
| MCD | `mcp-central-docs/docs/games/MARBLE_ADVENTURE.md` |
