# Headless Headset Setup Guide

Connect your VR headset to worldlabs-mcp for wireless 3D world streaming.

## Prerequisites

### What is ADB?

**ADB (Android Debug Bridge)** is a command-line tool that lets your PC communicate
with Android devices (phones, tablets, VR headsets) over USB or WiFi. It's part of
Google's Android Platform Tools.

You need ADB because VR headsets like Quest and Pico run a modified version of
Android. ADB lets us forward the worldlabs-mcp dashboard URL into the headset's
browser, and enables debugging features needed for WebXR.

**Installing ADB:**
1. Download [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools)
2. Extract the zip to a folder (e.g. `C:\platform-tools`)
3. Add that folder to your system PATH, or run `adb` from that folder
4. Verify: open a terminal and type `adb --version` — you should see version info

### Enable Developer Mode

Your headset must have Developer Mode enabled for ADB to work.

## Meta Quest 2 / 3 / Pro / Ultra

### 1. Enable Developer Mode

1. Install the **Meta Quest** app on your phone
2. Go to **Menu → Devices → Headset Settings → Developer Mode**
3. Toggle **Developer Mode ON**
4. Restart the headset

### 2. First-time USB connection

1. Connect headset to PC via USB-C cable
2. Put on the headset — you'll see a **"Allow USB debugging"** prompt
3. Check **"Always allow from this computer"** and tap **Allow**
4. On your PC, verify connection:

   ```powershell
   adb devices
   ```

   You should see: `XXXXXXXXXXXX    device`

### 3. Enable wireless ADB

```powershell
adb tcpip 5555
```

Disconnect the USB cable.

### 4. Connect over WiFi

Find your headset's IP address:
- Quest: **Settings → Wi-Fi → Network → IP Address**

```powershell
adb connect 192.168.1.XXX:5555
```

You should see: `connected to 192.168.1.XXX:5555`

### 5. Forward the dashboard port

```powershell
adb reverse tcp:10864 tcp:10865
```

### 6. Open in headset browser

Open **http://localhost:10864** in the Quest browser. You should see the worldlabs-mcp dashboard.

### 7. Enter VR

Navigate to the **Spark 2.0 viewer** and load a world, then click **Enter VR**.

> **Secure context issue**: If the "Enter VR" button doesn't appear, go to `chrome://flags` in the headset browser and enable **#unsafely-treat-insecure-origin-as-secure**, adding `http://localhost:10864`.

---

## Pico 4 / Pico 4 Ultra

### 1. Enable Developer Mode

1. Go to **Settings → General → About** → tap **Software Version** 7 times to unlock Developer Options
2. Go back to **Settings → General → Developer Options**
3. Toggle **USB Debugging ON**

### 2. First-time USB connection

Same as Quest: connect via USB-C, accept the debugging prompt on the headset, verify with `adb devices`.

### 3. Enable wireless ADB

```powershell
adb tcpip 5555
```

Disconnect USB.

### 4. Connect over WiFi

Find IP: **Settings → Wi-Fi → current network → IP Address**

```powershell
adb connect 192.168.1.XXX:5555
```

### 5. Forward the dashboard port

```powershell
adb reverse tcp:10864 tcp:10865
```

### 6. Open in headset browser

Navigate to **http://localhost:10864** in the Pico browser.

> **Note**: Pico's browser supports WebXR natively. The "Enter VR" button should work without flags.

---

## Apple Vision Pro

Vision Pro does not support ADB. To access the dashboard:

1. Ensure your Mac and Vision Pro are on the same network
2. Find your PC's local IP address (`ipconfig` on Windows)
3. Open **http://192.168.1.XXX:10864** in the Vision Pro Safari browser
4. WebXR requires HTTPS — use a local tunnel or serve via HTTPS

---

## Resonite Import

If you use Resonite, generated worlds can be imported into Resonite directly
from the dashboard.

### How it works

The bridge tries two methods, in order:

**1. resonite-mcp (port 10715)** — If the [resonite-mcp](https://github.com/sandraschi/resonite-mcp)
server is running, the bridge calls its `/api/v1/import/worldlabs` endpoint,
which can import via ResoniteLink, inventory upload, or OSC.

**2. Direct OSC (port 9000)** — If resonite-mcp is not available, the bridge
sends an OSC packet directly to Resonite with the proxied asset URLs.

### Dashboard flow

```
1. Generate a world → it appears in the Asset Panel after generation
2. Under "Smart Handoff" → click "Resonite"
3. Bridge downloads SPZ + GLB from Marble CDN to temp folder
4. Bridge serves them via local proxy at localhost:10865/api/handoff
5. If resonite-mcp is running: calls its import API
6. Otherwise: sends OSC packet with the local URLs
7. Resonite fetches the splat from your PC (not from the internet)
```

### Splat file location

The splat is downloaded from the Marble CDN to your temp folder
(`%TEMP%\worldlabs\`) and served through the bridge's `/api/handoff` proxy.
Resonite fetches it from `http://localhost:10865/api/handoff?url=...` —
no direct CDN access, no expiring URLs.

### resonite-mcp

The [resonite-mcp](https://github.com/sandraschi/resonite-mcp) server runs on
**port 10715** and provides ResoniteLink integration, inventory management,
avatar control, and OSC tools. When both servers are running:

```
worldlabs-mcp (10865)  ──►  resonite-mcp (10715)  ──►  Resonite (OSC/RL)
     │
     └──► Direct OSC (9000) fallback
```

**Start the automated import listener:**

```powershell
curl -X POST http://127.0.0.1:10715/api/resonite/worldlabs/listen
```

This starts an OSC receiver that automatically downloads and imports splats
via ResoniteLink when worldlabs-mcp sends an export request.

**resonite-mcp also detects your Resonite installation:**

```powershell
curl http://127.0.0.1:10715/api/resonite/platform
```

Returns whether Resonite is installed (Steam or standalone) and currently running.

### Direct OSC without resonite-mcp

If you don't use resonite-mcp, Resonite needs an OSC receiver at
`/worldlabs/import` that accepts 3 string arguments:

| Arg | Value |
|-----|-------|
| 1 | `splat_url` — proxy URL for the SPZ file |
| 2 | `mesh_url` — proxy URL for the GLB mesh |
| 3 | `world_name` — display name of the world |

This can be:
- A **ProtoFlux graph** with an OSC Data Input node
- A **Resonite mod** that listens for the import address
- A **custom Resonite item** with an HTTP GET component

### Manual import

If neither path works, download the SPZ file directly from the Asset Panel
and drag it into Resonite manually.

---

## Vive XR Elite

Follow the same ADB procedure as Quest. Developer Mode is enabled via the Vive app.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `adb: command not found` | Install Android Platform Tools and add to PATH. Restart terminal. |
| `unauthorized` in `adb devices` | Check headset for the "Allow USB debugging" prompt. Reconnect USB. |
| `connection refused` | Ensure `adb tcpip 5555` was run (requires USB). Reconnect USB and retry. |
| Dashboard loads but is slow | WiFi bandwidth. Use 5GHz or WiFi-6. Lower the streaming quality. |
| Spark viewer black | Hit **Reset View** (circular arrow icon). Adjust camera with OrbitControls. |
| "Enter VR" missing | Enable `#unsafely-treat-insecure-origin-as-secure` flag in headset browser. |
| Port 10865 not reachable | Ensure worldlabs-mcp backend is running. Run `.\start.ps1`. |
