# Technical Specification: WorldLabs Marble API Bridge (v0.2.0)

This document specifies the internal bridge API for the WorldLabs MCP dashboard, facilitating communication between the SOTA 2026 frontend and the WorldLabs Marble API, including local LLM services and DCC handoff protocols.

## API Architecture

The bridge runs as a FastAPI server on port **10865**, providing a simplified, stateful wrapper around the stateless WorldLabs Marble API.

## Endpoints

### 1. Generation Endpoints

#### `POST /api/generate/text`
Generates a 3D world from a text description.
- **Payload**: `{ "prompt": string, "name": string, "model": string }`
- **Response**: Operation object with `operation_id`.

#### `POST /api/generate/image`
Generates a 3D world from an image URI.
- **Payload**: `{ "url": string, "prompt": string, "name": string, "model": string, "is_panorama": boolean }`

#### `POST /api/generate/video`
Generates a 3D world from a video URI.
- **Payload**: `{ "url": string, "prompt": string, "name": string, "model": string }`

### 2. LLM Operations

#### `GET /api/llm/discover`
Probes local ports for running LLM instances.
- **Probes**: Ollama (11434), LM Studio (1234).
- **Returns**: Available models and providers.

#### `POST /api/llm/refine`
Refines a short prompt into a detailed, 20-line WorldLabs-optimized prompt using local LLMs.
- **Payload**: `{ "prompt": string, "style": string, "provider": string, "model": string }`
- **Styles**: Cinematic, Cyberpunk, Photorealistic, Surreal, Vibrant, Dark, Ethereal.

### 3. Asset & Handoff Operations

#### `POST /api/handoff`
Unified router for cross-MCP asset transfers.
- **Targets**:
  - `resonite`: OSC notification for direct import.
  - `unity3d`: Direct file copy to project `Assets/WorldLabs`.
  - `blender`: Forwarding to `blender-mcp` bridge API.

#### `GET /api/history`
Returns the last 50 generation operations from `history.json`.

## Technical Integration

- **OSC Protocol**: Uses standard OSC over UDP for Resonite integration (`/worldlabs/import`).
- **File System**: Direct path manipulation for Unity3D project ingestion.
- **Cross-Bridge**: HTTP-to-HTTP tunneling for Blender-MCP communication.
