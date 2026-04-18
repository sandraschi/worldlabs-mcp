# Industrial Integrations Guide (v0.4.0)

This document details the cross-server "Handshakes" that power the World Labs Hub ecosystem.

## 🎬 Plex Cinema Bridge
The Hub integrates with **plex-mcp** to enable authenticated media streaming.

### Configuration
Ensure your `plex-mcp` `.env` contains:
- `PLEX_BASE_URL`: Usually `http://localhost:32400`
- `PLEX_TOKEN`: Your X-Plex-Token

### Usage
1. Open the **Plex** tab in the Spatial Toolbox.
2. Search for any movie or show.
3. Select **"Stream to Cinema"**.
4. The Hub will manifest a 5.5m cinematic surface with an authenticated transcode URL.

---

## 🏗️ Blender DCC Handshake
Professional modeling workflows are supported through the **Local Import** system.

### Export Settings
- **Format**: GLB (.glb)
- **Transform**: +Y Up (Radiance Field Standard)
- **Geometry**: Apply Modifiers, Include Normals/Tangents.
- **Save Path**: Export directly to your `~/Downloads` folder (or your configured `WORLDLABS_LOCAL_PATH`).

### Implementation
Use the **Import** tab in the toolbox to browse and manifest your Blender constructs with one click.

---

## 🌀 Inter-World Portals
Portals enable seamless transitions between different Gaussian Splat (.spz/.rad) environments.

### Mechanics
- **Toroid Frame**: A 3D toroid mesh acts as the doorway.
- **Ripple Shader**: Animates sin-waves to indicate latent world boundaries.
- **Geofencing**: Triggered when the camera distance is < 1.0m.
- **Transition**: The viewer performs a fade-to-black re-initialization of the Spark engine with the target world URL.

---

## 🖥️ Sovereign Command Console
The Master Terminal provides in-world observability.

### Features
- **CPU/MEM**: Standard system telemetry.
- **VRAM**: Real-time RTX hardware monitoring via `nvidia-smi`.
- **Haptics**: Visual pulsing and glowing alerts on button interaction.
- **Operations**: Trigger **Bake**, **Restore**, or **Void** actions without leaving 3D space.
