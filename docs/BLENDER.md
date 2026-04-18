# The Blender ↔ World Labs Handshake

**Version**: 0.4.0 · April 2026  
**Protocol**: GLTF 2.0 / SPZ  
**Bridge**: Port 10865

---

## 1. Exporting from Blender

To bring your constructs into the World Labs Hub, follow these export settings:

### Geometry (GLB)
- **Format**: `glTF Binary (.glb)`
- **Transform**: Set `+Y Up`
- **Geometry**: Enable `Apply Modifiers`
- **Materials**: Use `Principled BSDF` (PBR)
- **Output**: Save to your **Local Assets Folder** (Default: `~/Downloads`).

### Splats (SPZ)
- If using the **Blender Add-on for Radiance Fields**, export directly as `.spz`.
- Ensure the SH degree is matched to the Hub's renderer (Standard: 3).

---

## 2. Importing into the Hub

In the **Spark Viewer**, open the **Spatial Toolbox** (Settings Icon).

1. **Local Assets Browser**: Navigate to the **"Local"** tab.
2. **Select Mesh**: Your Blender exports in `~/Downloads` will appear.
3. **Spawn**: Click the model name. It will manifest at your current camera position.
4. **Bake**: Click **"Bake Scene"** to persist the imported construct in your Hub manifest.

---

## 3. High-Fidelity Collision (Chisel)

If you need the world to interact with your Blender constructs:
1. Export your World Labs world as a **Chisel Mesh** (`.glb`).
2. Import it into Blender to use as a "Void Reference".
3. Sculpt your constructs around the Chisel mesh.
4. Export only your constructs—they will now "fit" perfectly within the generative volume.

---

## 4. Troubleshooting

- **Missing Textures**: Ensure "Embed Images" is checked in the Blender GLTF export settings.
- **Wrong Scale**: Check if Blender is set to `Meters`. Spark Engine expects 1 unit = 1 meter.
- **Flipped Faces**: The Spark viewer uses backface culling; ensure your normals are facing outward in Blender.
