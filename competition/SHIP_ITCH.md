# Ship Marble Adventure to itch.io (sandraschi)

**Target:** `sandraschi/marble-adventure` → https://sandraschi.itch.io/marble-adventure  
**Build:** Windows downloadable (not HTML — game opens browser for Marble worlds)

---

## Stay invisible until you’re ready

itch has **three separate layers**. Use all of them while iterating:

| Layer | What it hides | How |
|-------|----------------|-----|
| **1. Draft project** | Entire page from everyone | Create project at [itch.io/game/new](https://itch.io/game/new) → leave **“Draft” checked** |
| **2. Restricted visibility** | Store browse / search | Edit game → Visibility → **Restricted** (link-only) |
| **3. Hidden Butler channel** | The uploaded `.exe` build | `ship-itch.ps1 -Push` uses **`butler --hidden`** by default |

**Nobody sees a half-ready game if:**

1. Page stays **Draft** (most important — draft pages are not public).
2. First push uses **`--hidden`** (our script default).
3. You only **uncheck Draft** + **unhide upload** when you decide to release.

`butler push` does **not** auto-publish your page. Uploading a hidden build does not make the project public.

### When you’re ready to release

1. Edit game → **Uploads** → unhide the `win` channel build.
2. Add cover, screenshots, GIF (see `marketing/README.md`).
3. Uncheck **Draft** → save.
4. Set visibility **Public** or **Restricted** (link-only).

---

## One-time setup

### 1. Create draft project on itch

1. [itch.io/game/new](https://itch.io/game/new)
2. Title: **Marble Adventure**
3. URL slug: **marble-adventure** (matches `sandraschi/marble-adventure`)
4. Kind: **Downloadable** (Windows)
5. **Keep Draft checked**
6. Visibility: **Restricted** (optional extra safety)

### 2. API key (local only)

1. [itch.io/user/settings/api-keys](https://itch.io/user/settings/api-keys) → generate key
2. Copy `competition/.env.example` → `competition/.env`
3. Paste key:

```env
BUTLER_API_KEY=your-key-here
ITCH_TARGET=sandraschi/marble-adventure
ITCH_CHANNEL_WIN=win
MARBLE_ACCESS_MODE=public_marble
```

Never commit `.env`.

### 3. Godot export templates

```powershell
cd D:\Dev\repos\godot-mcp
just install-export-templates
```

### 4. Butler

Install [itch app](https://itch.io/app) or standalone [Butler](https://itchio.itch.io/butler).

---

## Commands

```powershell
cd D:\Dev\repos\worldlabs-mcp\competition

# Export only (no upload)
.\ship-itch.ps1 -ExportOnly

# Preview what Butler would upload (no upload)
.\ship-itch.ps1 -Preview

# Upload hidden build (needs BUTLER_API_KEY in .env)
.\ship-itch.ps1 -Push

# Upload visible channel (skip --hidden; page can still be Draft)
.\ship-itch.ps1 -Push -PublicChannel
```

Via **just** (from worldlabs-mcp root):

```powershell
just marble-adventure-export-win
just marble-adventure-ship-preview
just marble-adventure-ship-push    # hidden push
```

---

## Page copy (paste into itch description)

See `ITCH_PAGE_COPY.md`.

---

## Alternative: godot-mcp dashboard

If you prefer the fleet UI:

```powershell
cd D:\Dev\repos\godot-mcp
$env:BUTLER_API_KEY = "..."   # from .env, not chat
$env:ITCH_TARGET = "sandraschi/marble-adventure"
just serve
just web   # http://127.0.0.1:10992/ship
```

Note: godot-mcp `upload_dir` validation expects paths under **godot-mcp/build/** — use **worldlabs `ship-itch.ps1`** for Marble Adventure unless you copy the build there.

---

## See also

- [WORLD_ACCESS.md](./WORLD_ACCESS.md) — players need no World Labs account
- [marketing/README.md](./marketing/README.md) — GIF + screenshots
- [MCD ITCH_IO_GUIDE](../../mcp-central-docs/docs/gamedev/ITCH_IO_GUIDE.md)
