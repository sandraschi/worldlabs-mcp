# VR & WebXR Integration

World Labs worlds are designed to be experienced from the inside. This project is **WebXR Ready**, supporting high-fidelity traversal on Meta and Pico hardware.

## Support Hardware

- **Meta Quest 3 / Pro**: Optimal performance via Quest Browser.
- **Quest 2**: Supported (Balanced settings recommended).
- **Pico 4 / Ultra**: Supported via Pico Browser.
- **Apple Vision Pro**: Supported (Experimental, Spark 2.0 WebGL2 compatibility).

## How to enter VR

1. Open the [SOTA Dashboard](http://localhost:10864) or the [Spark Viewer](http://localhost:10864/spark-viewer) on your PC.
2. Ensure your headset is on the same local network.
3. Access the URL displayed in the dashboard (e.g., `http://192.168.1.50:10864/spark-viewer`).
4. Look for the **"Enter VR"** button in the bottom right of the renderer.
5. Grant permissions to the browser.

## Interaction Model

### Traversal
- **Thumbstick**: Continuous movement or Teleportation (Toggleable).
- **Smooth Turn**: Snap turning is currently the default for comfort.

### Spatial Audio in VR
When using the **Spatial Voice Agent** in VR, the audio positioning is even more critical. Ensure you are wearing headphones (or using the integrated headset speakers) to experience the 6DOF HRTF audio tracking.

## Performance Optimization

VR rendering requires stable 72/90/120 Hz. If you experience stutteing:
1. Use the **Marble 0.1-mini** model (fewer triangles in collider meshes).
2. Load the **100k or 500k SPZ** version instead of the Full-Res version.
3. Enable "Foveated Rendering" in the browser settings (if available).

## Troubleshooting WebXR

- **"VR Not Supported"**: Ensure you are accessing the dashboard over **HTTPS** or from a designated **trusted source** (localhost/intranet).
- **Controller Drift**: Ensure your headset tracking area is well-lit. Splats can sometimes be visually noisy in the periphery, which may affect optical tracking in some headsets.
