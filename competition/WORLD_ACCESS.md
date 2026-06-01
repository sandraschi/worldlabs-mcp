# How Marble worlds reach the player (no account vs dev setup)

## Short answer

**Players do not need a World Labs account** if you ship with **`public_marble`** access (default).

They open **pre-generated worlds** that already live on World Labs infrastructure via public URLs:

```
https://marble.worldlabs.ai/world/{marble_uuid}
```

The Godot hub is only a **3D menu**. The actual splat world loads in the **browser** at that URL.

---

## Who needs a World Labs account?

| Role | Account? | Why |
|------|----------|-----|
| **You (author)** | Yes | Generate worlds, pay Marble credits, obtain UUIDs |
| **Player** | **No** | Consumes public viewer links baked into the game |
| **Dev with local Spark** | Optional | Runs worldlabs-mcp for minimal Spark UI on localhost |

World generation is **author-time**. Distribution is **static URLs + CDN assets** shipped in `data/portals.json`.

---

## Access modes (`MARBLE_ACCESS_MODE`)

Configured in `data/portals.json` → `access_mode_default`, overridable by env:

| Mode | URL opened | Player needs |
|------|------------|--------------|
| **`public_marble`** (default) | `https://marble.worldlabs.ai/world/{uuid}` | Browser only |
| **`local_spark`** | `http://127.0.0.1:10864/spark?splat_500k=…cdn…` | worldlabs-mcp running locally; falls back to public Marble if offline |
| **`public_cdn_spark`** | Spark URL with CDN splat param | Self-hosted Spark webapp (advanced) |

```powershell
# Default — any player
.\competition\play.ps1

# Developer — local Spark chrome-free viewer
$env:MARBLE_ACCESS_MODE = "local_spark"
.\competition\play.ps1 -AccessMode local_spark
```

---

## Where files live

| Asset | Location | Account to download? |
|-------|----------|------------------------|
| Splat data | `cdn.marble.worldlabs.ai/{uuid}/{suffix}` | No — public CDN URL if world stays public |
| Thumbnail previews | `worlds/{slug}_thumb.webp` in repo OR CDN at runtime | No for players (bundled or fetched) |
| Portal config | `data/portals.json` | N/A |
| Tour save | `user://marble_tour.json` | Local only |

Author downloads thumbs once:

```powershell
cd D:\Dev\repos\worldlabs-mcp\competition
.\download_world_thumbs.ps1   # needs YOUR API key + worldlabs on :10865
.\download_cdn_thumbs.ps1       # no API — tries CDN paths (often 404; runtime CDN still attempted)
```

---

## Risks for “any user” distribution

1. **World must stay public** on Marble — if World Labs unpublishes or deletes a world, that portal breaks.
2. **CDN URLs are not secret** — they’re capability URLs; fine for a demo, not DRM.
3. **itch/Steam build** should default to `public_marble`; document that worlds open in browser.
4. **Credits are not consumed per player view** — only when *you* regenerate worlds.

---

## Recommended ship config (itch)

```json
"access_mode_default": "public_marble"
```

README line for players:

> No account required. Walk through a portal — your browser opens a Marble world. Close the tab and return to the hub.

---

## See also

- [PORTALS.md](./PORTALS.md) — UUID table
- [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) — phases
- [COMPETITION.md](../docs/COMPETITION.md) — original concept
