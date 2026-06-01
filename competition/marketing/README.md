# itch marketing assets — Marble Adventure

Assets for Phase 4 itch page. Capture on a 1920×1080 window.

## Trailer GIF (30s target)

**Shot list:**

1. Title screen → click Play (3s)
2. Hub orbit — pan across 5 inner rings + 3 bonus (8s)
3. Walk through one featured portal — browser flash (4s)
4. Alt+Tab back — tour counter increments (3s)
5. Center orb brightening as tour progresses (4s)
6. Completion panel at 5/5 (3s)
7. End card: "Marble Adventure — browser worlds, no account" (5s)

**Capture (Windows):**

```powershell
cd D:\Dev\repos\worldlabs-mcp\competition
.\capture_trailer.ps1
```

Or manually:

1. Run `just marble-adventure-play`
2. Record with OBS (Game Capture) or ShareX screen recorder
3. Export MP4, then convert:

```powershell
ffmpeg -i trailer_raw.mp4 -vf "fps=15,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 marketing/trailer.gif
```

Target: **960px wide GIF**, under 8 MB for itch.

## Screenshots (3 minimum)

| # | Scene | Notes |
|---|-------|-------|
| 1 | Hub wide shot | All rings visible, starfield |
| 2 | Close on one portal | Preview thumb + title readable |
| 3 | Tour HUD | `World tour: 3 / 5` visible |
| 4 | Title screen | Menu with subtitle |
| 5 | Completion panel | Optional |

Save as `marketing/screenshot_01.png` … `screenshot_05.png`.

Godot screenshot: **F12** in editor, or capture at runtime with OBS.

## Copy snippets (itch)

**Tagline:** Walk through portals into real Marble Gaussian splat worlds.

**Disclosure:** Worlds generated with Marble 1.1 (World Labs). Hub built with Godot 4.4. Prototype — worlds open in your browser; no World Labs account required.

**Controls:** WASD, mouse look, Space jump, H center, R reset tour.

## Files in this folder

| File | Purpose |
|------|---------|
| `README.md` | This guide |
| `trailer.gif` | Add after capture |
| `screenshot_*.png` | Add after capture |

Run CDN thumb download before screenshots so portal previews look good:

```powershell
just marble-adventure-cdn-thumbs
```
