# Portal wiring reference (Marble Adventure)

**Project:** `competition/marble-adventure/`  
**Config:** `data/portals.json` (sorted **A–Z by label** within each tier)

## Featured (inner ring A–E)

| Letter | Slug | Display name | Marble UUID | Suffix |
|--------|------|--------------|-------------|--------|
| A | `gothic_cathedral` | Gothic Cathedral | `a7936174-dfa9-4714-9e8e-d2db4389f0a3` | `7` |
| B | `cyberpunk_alley` | Neon Alley | `5e10e810-aaee-4240-9260-b74ea9cbfc9f` | `6` |
| C | `sea_of_fog` | Sea of Fog | `5c56883a-6167-4634-84de-3f00d4ff492f` | `0` |
| D | `wonderland` | Wonderland | `043f6225-a612-43e5-bd27-0eb0eb4fd085` | `2` |
| E | `japanese_temple` | Zen Temple | `52620a3a-d5df-4793-be72-9fce88188f8e` | `4` |

## Bonus (outer ring F–H)

| Letter | Slug | Display name | Marble UUID | Suffix |
|--------|------|--------------|-------------|--------|
| F | `deep_forest` | Deep Forest | `0569591d-6e5e-469a-a285-5214bea5a3ef` | `a` |
| G | `midcentury_villa` | Midcentury Villa | `b9b0bab8-9bea-408b-9159-2c6e5370cd5a` | `b` |
| H | `underwater_ruins` | Sunken Ruins | `6c1f938c-1972-49d9-bf97-4ccd08aedbd9` | `d` |

## URLs

| Mode | Pattern |
|------|---------|
| **Public (default)** | `https://marble.worldlabs.ai/world/{uuid}` |
| **Local Spark** | `http://127.0.0.1:10864/spark?splat_500k={cdn_url}` |

## Shape tour order (optional puzzle)

1. C `sea_of_fog` ●  
2. A `gothic_cathedral` ■  
3. D `wonderland` ▲  
4. E `japanese_temple` ◆  
5. B `cyberpunk_alley` ★  

## Thumbnails

`worlds/{slug}_thumb.webp` — `just marble-adventure-thumbs` (API) or bundled in repo.

**Meta / prompts:** `data/portal_meta.json` · [WORLD_PROMPTS.md](./WORLD_PROMPTS.md)

**Docs:** [WORLD_ACCESS.md](./WORLD_ACCESS.md) · [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) · [MCD Marble Adventure](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md)
