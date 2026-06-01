# 🏆 Marble Adventure — Competition Entry

**World Labs Marble challenge** — Godot 4.4 hub + real Marble 1.1 splats in the browser.

| | |
|--|--|
| **itch (draft)** | [sandraschi.itch.io/marble-adventure](https://sandraschi.itch.io/marble-adventure) |
| **Fleet doc (MCD)** | [docs/games/MARBLE_ADVENTURE.md](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md) |
| **PRD** | [PRD_MARBLE_ADVENTURE.md](./PRD_MARBLE_ADVENTURE.md) |
| **Package README** | [competition/README.md](../competition/README.md) |

---

## Concept

An **agent-built gallery**: FPS hub with ring portals (A–H, alphabetical) into **Marble Gaussian splat worlds** in the browser. Fleet terminals explain how worlds were made; optional shape tour and architect tokens add replay value.

**No fake geometry** — Spark / public Marble only for world rendering.

---

## Worlds

**Featured (A–E, inner ring):** Gothic Cathedral · Neon Alley · Sea of Fog · Wonderland · Zen Temple

**Bonus (F–H, outer ring):** Deep Forest · Midcentury Villa · Sunken Ruins

**Shape tour (optional):** ● Sea → ■ Gothic → ▲ Wonderland → ◆ Zen → ★ Neon

---

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse / Scroll | Look / FOV |
| Space | Jump |
| H | Hub center |
| E | Agent notes (near portal) |
| R | Reset progress |
| Esc | Release mouse |

Title screen: **Play · Settings · Controls · Fleet Museum**

---

## Run

```powershell
cd D:\Dev\repos\worldlabs-mcp
just marble-adventure-play
```

Local Spark + spatial welcome: `.\competition\play.ps1 -AccessMode local_spark`

---

## Ship (author)

```powershell
# competition/.env — BUTLER_API_KEY, ITCH_TARGET=sandraschi/marble-adventure
just marble-adventure-ship-push
```

See [SHIP_ITCH.md](../competition/SHIP_ITCH.md) · [WORLD_ACCESS.md](../competition/WORLD_ACCESS.md)

---

## Regenerate worlds

Multiline prompts: [WORLD_PROMPTS.md](../competition/WORLD_PROMPTS.md)

```powershell
just marble-adventure-regen-worlds portal=sea_of_fog
# update marble_id in data/portals.json → just marble-adventure-thumbs
```

---

## Project layout

```
competition/
├── README.md
├── marble-adventure/
│   ├── data/portals.json
│   ├── data/portal_meta.json
│   ├── scenes/title.tscn          # main scene
│   ├── scenes/hub.tscn
│   └── scripts/
├── WORLD_PROMPTS.md
├── SHIP_ITCH.md
├── ship-itch.ps1
└── IMPROVEMENT_PLAN.md
```

---

## Related docs

| Doc | Topic |
|-----|-------|
| [MCD MARBLE_ADVENTURE.md](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md) | Canonical fleet game page |
| [PORTALS.md](../competition/PORTALS.md) | UUID table |
| [IMPROVEMENT_PLAN.md](../competition/IMPROVEMENT_PLAN.md) | Roadmap |
| [marketing/README.md](../competition/marketing/README.md) | itch GIF + screenshots |
