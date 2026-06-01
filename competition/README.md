# Marble Adventure — competition package

Godot 4.4 hub game + ship scripts for the World Labs Marble challenge.

**Canonical fleet documentation:** [mcp-central-docs/docs/games/MARBLE_ADVENTURE.md](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md)

**itch (draft):** [sandraschi.itch.io/marble-adventure](https://sandraschi.itch.io/marble-adventure)

---

## Quick start

```powershell
cd D:\Dev\repos\worldlabs-mcp
just marble-adventure-play
```

---

## Docs in this folder

| File | Purpose |
|------|---------|
| [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) | Phased roadmap + status |
| [PRD](../docs/PRD_MARBLE_ADVENTURE.md) | Product requirements |
| [WORLD_ACCESS.md](./WORLD_ACCESS.md) | Public vs local Spark; no player account |
| [WORLD_PROMPTS.md](./WORLD_PROMPTS.md) | Multiline Marble regen prompts (A–H) |
| [SHIP_ITCH.md](./SHIP_ITCH.md) | Butler, draft, hidden channel |
| [PORTALS.md](./PORTALS.md) | UUID + slug reference |
| [ITCH_PAGE_COPY.md](./ITCH_PAGE_COPY.md) | Store description snippets |
| [marketing/README.md](./marketing/README.md) | GIF + screenshots checklist |

---

## Godot project

`marble-adventure/` — run `godot .` or use `play.ps1`.

---

## Just recipes

```powershell
just marble-adventure-check
just marble-adventure-play
just marble-adventure-export-win
just marble-adventure-ship-push      # needs competition/.env BUTLER_API_KEY
just marble-adventure-regen-worlds   # author; Marble credits
just marble-adventure-thumbs
```
