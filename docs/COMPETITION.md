# 🏆 Marble Adventure — Competition Entry

**World Labs "Marble 1.1 Challenge"** — A Godot 4.4 desktop experience that connects to Marble 1.1's real Gaussian splat renderer (Spark 2.0).

## Concept

A circular hub platform with 8 glowing Stargate-style ring portals, each showing a live preview thumbnail of a Marble 1.1 world. Walk through any ring → your browser opens the **Spark 2.0 viewer** with the actual Gaussian splat world — navigate, orbit, explore. Close the browser → back in the hub.

**No fake geometry.** This is the real Marble 1.1 renderer, not a collider proxy or panorama.

## 8 Themed Worlds

| Portal | World Prompt |
|--------|-------------|
| **Gothic Cathedral** | Grand medieval cathedral with rose windows, vaulted ceilings, incense haze |
| **Sea of Fog** | Caspar David Friedrich-inspired Romantic landscape above the mist |
| **Midcentury Villa** | Modernist villa at golden hour, infinity pool, tropical gardens |
| **Wonderland** | Surreal Escher+Gaudi dreamscape, bioluminescent flora, floating islands |
| **Deep Forest** | Ancient redwood forest with dappled light, moss, stone ruins |
| **Neon Alley** | Rain-slicked cyberpunk backstreet, holograms, steam vents, ramen stall |
| **Zen Temple** | Japanese temple garden in autumn, koi pond, maple trees |
| **Sunken Ruins** | Greco-Roman ruins with bioluminescent coral, sea turtles, god rays |

All generated with `marble-1.1` (1,500 credits each, ~5 min generation).

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look |
| Scroll | Zoom (FOV 30–110°) |
| Space | Teleport to hub center |
| ESC | Release mouse cursor |
| Click in window | Capture mouse / start |

## How to Run

```powershell
# Terminal 1: Start worldlabs-mcp backend (required for Spark viewer)
cd worldlabs-mcp
just serve

# Terminal 2: Start the Godot hub
cd worldlabs-mcp/competition/marble-adventure
godot .
```

Requires `WORLDLABS_API_KEY` in `.env` and the worldlabs-mcp webapp on port 10864.

## Project Structure

```
competition/marble-adventure/
├── project.godot          # Godot 4.4 config
├── mcp_bridge.gd          # TCP bridge (optional, for live MCP control)
├── worlds/                # Thumbnail previews
├── scenes/hub.tscn        # Main scene
└── scripts/
    ├── player.gd          # FPS controller
    ├── hub_manager.gd     # Procedural hub with 8 ring portals
    ├── portal.gd          # Portal trigger → opens Spark viewer
    ├── world_manager.gd   # Hub scene reference
    └── hud.gd             # Crosshair + hints
```
