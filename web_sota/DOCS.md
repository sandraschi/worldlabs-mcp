# World Labs MCP Webapp - Technical Documentation

## Overview
This webapp provides a premium interface for interacting with the World Labs Marble API. It supports 3D world generation from text, images, and video, with advanced features for local prompt refinement and automated asset handoff to DCC tools.

## Key Features

### 1. Local LLM Prompt Refinement
Enhance your generation prompts using local LLM power.
- **Provider Support**: Ollama and LM Studio.
- **Auto-Discovery**: Automatically detects running local LLM instances and available models.
- **Design Focus**: Uses a specialized system prompt to transform simple descriptions into highly detailed environmental prompts optimized for the Marble API.

### 2. Smart Asset Handoff (Cross-MCP)
Automate the journey from World Labs to your favorite development environment.
- **Targets**: Resonite, Unity3D, and Blender.
- **Asset Types**: Gaussian Splats (SPZ) and Geometry (GLB).
- **Workflow**:
  - **Resonite**: Sends assets directly to a running Resonite client via OSC.
  - **Unity3D**: Downloads assets into your pre-configured Unity project assets folder and notifies the `unity3d-mcp`.
  - **Blender**: Routes assets through the `blender-mcp` for instant import.

## Network & Topology
- **Frontend**: Port 10864 (React/Vite)
- **Backend Bridge**: Port 10865 (FastAPI)
- **Local LLMs**:
  - Ollama: Port 11434
  - LM Studio: Port 1234
- **DCC Connections**:
  - Resonite OSC: Port 9000 (default)
  - Minecraft (Future): Port 25565

## Configuration
Use the `.env` file in the repository root to configure:
```bash
WORLDLABS_API_KEY=your_key_here
UNITY_PROJECT_PATH=D:/Dev/repos/my-unity-project
RESONITE_OSC_HOST=127.0.0.1
RESONITE_OSC_PORT=9000
```

---
*Last Updated: February 2026*
*Status: Production Ready*
