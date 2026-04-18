# Immersive Reality — WebXR & WebRTX Integration

**Version**: 0.4.0 · April 2026  
**Protocol**: WebRTX (Web Real-Time Cross-Reality)  
**Target OS**: Android XR / visionOS

---

## 1. The Immersive Stack

World Labs worlds are generatively persistent environments designed to be inhabited. The v0.4.0 stack utilizes **WebRTX** to stream LoD splat trees directly to standalone HMDs.

### Core Technologies
| Tech | Description |
|---|---|
| **WebXR** | The standard browser API for 6DOF VR/AR traversal. |
| **WebRTX** | Proprietary streaming wrapper for Spark 2.0. Handles network-aware LoD prioritization. |
| **Android XR** | Primary optimization target for Quest 3 and standalone headsets. |

---

## 2. Supported Hardware (2026 Certified)

- **Meta Quest 3 / Ultra**: Optimal experience. Uses Android XR native splat sorting.
- **Quest Pro**: Full support with dynamic foveated rendering via eye-tracking.
- **Apple Vision Pro**: High-fidelity WebGL2 mode. visionOS 3.0+ recommended.
- **Vive XR Elite / Pico 4 Ultra**: Supported via standard WebXR path.

---

## 3. How to Enter Immersion

1. **Host Workstation**: Ensure `worldlabs-mcp` is running (Port 10864).
2. **Headset Browser**: Navigate to your workstation's IP (e.g., `http://192.168.1.XX:10864/spark-viewer`).
3. **Secure Context**: If using a local IP, you must enable `#unsafely-treat-insecure-origin-as-secure` in your headset's flags (`chrome://flags` or `quest://flags`).
4. **Initialize**: Tap the **"Enter VR"** button in the bottom-right of the Spark Viewer.

---

## 4. Joe User's Guide to ADB (Handshake Fix)

If the headset cannot see your workstation, use **ADB (Android Debug Bridge)** to bridge the connection.

### The "Reverse Proxy" Fix
Run this on your PC with the headset connected via USB:
```bash
adb reverse tcp:10864 tcp:10864
adb reverse tcp:10865 tcp:10865
```
*Now you can navigate to `http://localhost:10864` inside the headset.*

---

## 5. Interaction Model

- **Locomotion**: Left Thumbstick (Continuous/Snap).
- **Spatial Triggers**: Walk into proximity zones to trigger **Marble-aligned** narrations.
- **Multimodal Events**: Broadcast speech/audio/video from the Hub dashboard; it will manifest in the headset's 3D space in real-time.

---

## 6. Performance Matrix

| Setting | HMD Target | Primitive Budget |
|---|---|---|
| **Ultra** | Quest 3 Upper | 10M - 50M Splats (via LoD) |
| **Balanced** | Quest 2 / Pico 4 | 2M - 10M Splats |
| **Low-Latency** | Mobile XR | < 1M Splats (Coarse only) |

---

## Troubleshooting
- **Black Screen**: Check if your GPU supports WebGL2. Spark 2.0 requires it for splat sorting.
- **No Audio**: Spatial audio requires a user gesture (Click anywhere in the page before entering VR).
