# World Modeling & Market Overview (2026)

This document provides context on the **Spatial Intelligence** landscape and how World Labs' "Large World Models" (LWM) differ from traditional 3D workflows.

## The Paradigm Shift

Traditional 3D modeling relies on manual vertex/texture creation (Blender/Maya) or photogrammetry (RealityCapture). World Labs introduces **Generative Persistence**:

| Feature | Predictive LLM (Sora/Veo) | World Labs (Marble) |
|---------|---------------------------|---------------------|
| **Consistency** | Visual only (hallucinates) | Geometry persistent |
| **Exploration** | Fixed camera path | Free-roam 3D |
| **Output** | 2D Video Pixels | Gaussian Splats / Meshes |
| **Handoff** | Video Editing | Unity / Blender / Resonite |

## Market Positioning

### 1. Latent Spaces vs. Navigable Spaces
While models like Sora generate "latent" representations that look like video, they lack a coordinate-consistent world state. World Labs' **Marble** pipeline builds a 3D world that exists independent of the viewer's camera path, enabling true **Spatial Computing**.

### 2. High-Fidelity Gaussians
The move to **3D Gaussian Splatting** (3DGS) via Spark 2.0 solves the "uncanny valley" of 3D reconstructions. Unlike traditional meshes which struggle with transparency (foliage, smoke, glass), splats represent the scene as a cloud of volumetric primitives, capturing realistic lighting and micro-details.

## World Optimization Tips

To get the best results from the Marble API:

- **Technical Detail**: Use the "Prompt Refinement" feature in the dashboard. Descriptions should focus on materials, global illumination, and spatial configuration.
- **Azimuth Awareness**: When using `multi_image` lifting, ensure you provide images from distinct cardinal or ordinal directions (e.g., 0°, 90°, 180°, 270°).
- **Scale Control**: For architectural interiors, specify "human-scale" and "accessible layout" to ensure the generated Splat doesn't have "holes" in common walking paths.

## Looking Ahead: Industrial Simulation
World Labs is moving towards **Industrial Foundations**, where generated worlds aren't just for viewing, but serve as training grounds for robotics and autonomous systems.
