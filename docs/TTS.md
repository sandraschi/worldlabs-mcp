# TTS Integration & Spatial Voice Agent

> **Status: speculative.** The Marble wrapper and bridge are production-ready; the voice agent end-to-end is scaffolded. It needs `speech-mcp` running separately to produce audio. The viewer side plays whatever the bridge streams via SSE.

This project features a **Spatial Voice Agent** that grounds Gemini TTS output in the physical coordinates of your 3D worlds.

## Powered by Speech-MCP

The system relies on [Speech-MCP](https://github.com/sandraschi/speech-mcp) for TTS generation.

- **Provider**: Gemini 3.1 Flash TTS (`gemini-3.1-flash-tts-preview`) — released 2026-04-15, available via Gemini API / Google AI Studio / Vertex AI.
  - 70+ languages, 200+ audio tags for style/pacing/emotion, SynthID watermarking.
  - Output: WAV only (not multimodal in preview).
- **Fallback**: Windows SAPI5 for offline usage.

## How it Works

1. **The Viewer**: `SparkViewer` initialises a WebAudio `AudioContext` and `PannerNode`.
2. **The Listener**: The "ears" are attached to the Three.js camera. As you move, volume and direction update accordingly.
3. **The Voice**: When `broadcast_spatial_notification` is called, a JSON payload is pushed onto the narration SSE stream served by the bridge.
4. **The Rendering**: The viewer fetches the generated WAV from Speech-MCP and plays it through the `PannerNode` at the specified `[x, y, z]`.

The `PannerNode` uses **HRTF** (Head-Related Transfer Function) panning so you can hear *where* the narration is coming from in headphones.

## Using the Spatial Voice Agent

### Via MCP Tool

```json
{
  "name": "broadcast_spatial_notification",
  "arguments": {
    "text": "Welcome to the Victorian Garden. To your left, the abandoned fountain.",
    "x": -5.2,
    "y": 1.5,
    "z": 12.0
  }
}
```

### Prompting the Agent

> "Describe the architecture of this room using the spatial voice agent. Stand near the fireplace."

Claude calculates fireplace coordinates from the scene caption and calls the tool.

## Technical Configuration

```env
# The narration SSE bridge (same process as the MCP server by default)
WORLDLABS_BRIDGE_URL=http://localhost:10718

# Speech-MCP endpoint for the actual TTS synthesis
SPEECH_MCP_URL=http://localhost:10918
```

## Known gaps

- The Lyria 3 music generation path mentioned in earlier drafts is not wired up; `broadcast_spatial_audio` currently only plays remote audio URLs.
- There is no voice-activity detection on the listener side; the agent speaks unprompted when geofence triggers fire.
- Gemini TTS tags are not yet parsed out of the `text` field — pass them inline as Google documents (`[whispers]`, `[slow]`, etc.).

