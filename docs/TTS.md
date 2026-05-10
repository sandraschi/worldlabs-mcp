# TTS Integration & Spatial Voice Agent

The Spatial Voice Agent uses a **built-in TTS engine** that auto-generates audio
when `broadcast_spatial_notification` is called. No external TTS service is
required — but for the highest quality, install `edge-tts`.

## How It Works

1. **MCP tool** calls `broadcast_spatial_notification(text="Hello", x=5, y=1, z=2)`
2. **Bridge** receives the narration event, calls the built-in TTS engine to generate an MP3 file
3. **SSE event** is pushed to connected viewers with the `audio_url` field set
4. **Spark 2.0 viewer** fetches the MP3 and plays it through WebAudio `PannerNode`
   at coordinate (5, 1, 2) — HRTF spatial audio, sounds like it comes from that location

## TTS Backend

| Backend | Quality | Dependency | API Key |
|---------|---------|------------|---------|
| edge-tts (recommended) | High — natural Microsoft Edge voices | `uv pip install edge-tts` | None |
| No TTS backend | Speech events still fire but without audio URL | None | — |

Install the recommended TTS backend:

```bash
uv pip install edge-tts
```

The engine auto-detects available backends. With `edge-tts`, the default voice is
`en-US-JennyNeural`. No configuration needed.

## Architecture

```
broadcast_spatial_notification("Welcome")
    │
    ▼
POST /api/narration {type: "speech", text: "Welcome", x: 0, y: 1.5, z: 0}
    │
    ├── (if edge-tts available) Generate MP3 → save to temp file
    │
    ▼
SSE event → {audio_url: "/api/tts/abc123.mp3", ...}
    │
    ▼
Spark 2.0 viewer → fetch MP3 → PannerNode at (0, 1.5, 0)
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/tts/{filename}` | GET | Serve generated TTS audio files |
| `/api/tts/status` | GET | Check if edge-tts is available |
| `/api/default-agent` | GET | Built-in humanoid avatar GLB |

## Using the Spatial Voice Agent

### Via MCP Tool

```
broadcast_spatial_notification(
    text="Welcome to the Victorian Garden. To your left, the abandoned fountain.",
    x=-5.2, y=1.5, z=12.0
)
```

The audio is generated automatically. No separate TTS step needed.

### Prompting the Agent

> "Describe the architecture of this room using the spatial voice agent.
> Stand near the fireplace."

Claude calculates fireplace coordinates from the scene caption and calls the tool.

## Known Gaps

- edge-tts requires internet (it uses Microsoft's online TTS service)
- There is no voice-activity detection on the listener side; the agent speaks
  unprompted when geofence triggers fire
- Gemini TTS tags are not parsed out of the text field — they only work
  with edge-tts which doesn't support them
- The default agent avatar is a simple box humanoid, not an animated character
