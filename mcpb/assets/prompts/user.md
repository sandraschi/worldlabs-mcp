# WorldLabs-MCP User Guide

## Getting Started

WorldLabs-MCP generates explorable 3D worlds from text descriptions, images, and video using the World Labs Marble API. You can create immersive environments, broadcast spatial audio and notifications into the live Spark viewer, manage your generated world library, and export assets to external tools like Blender, Unity, and Resonite.

### Setting Up

Before generating any world, ensure your WORLDLABS_API_KEY environment variable is set. Get your key at platform.worldlabs.ai. There are two credit pools: web credits (used on marble.worldlabs.ai) and API credits (used here). They are separate -- check your API balance at platform.worldlabs.ai, not the web app.

### Generating Your First World

The simplest way to create a 3D world is with a text description:

```
generate_world_from_text(text_prompt="A serene Japanese garden with a koi pond, cherry blossoms, and a wooden bridge at golden hour")
```

This returns immediately with an operation_id. World generation takes 1-3 minutes for marble-1.1, longer for marble-1.1-plus. Poll for completion:

```
get_operation(operation_id="op_abc123")
```

When done=True, the response contains the world data with asset URLs. You can then view it through the Marble viewer URL included in the response.

### Quick Wait

For simple scripts, you can block until complete:

```
wait_for_world(operation_id="op_abc123")
```

This polls every 15 seconds and returns when done or when the 90-second timeout expires. For longer-running jobs, use get_operation manually.

## World Generation Methods

### Text-to-World

Best for conceptual scenes, environments, and artistic direction:

```
generate_world_from_text(
    text_prompt="A gothic cathedral interior with stained glass windows, stone pillars, and candlelight",
    display_name="Cathedral Interior",
    model="marble-1.1",
    seed=42,
    tags=["gothic", "architecture", "indoor"]
)
```

Text prompts should describe the scene in detail: lighting, atmosphere, objects, architecture style, and time of day. More specific prompts produce better results. The seed parameter enables reproducible generations -- same seed + same prompt = same world.

### Image-to-World

Lift a single photograph into a navigable 3D space:

```
generate_world_from_image(
    image_url="https://example.com/my-photo.jpg",
    text_prompt="Extend the scene with a garden path",
    display_name="My Photo World",
    is_panorama=False
)
```

For 360-degree panoramas, set is_panorama=True. Panoramas produce fuller worlds with 360-degree coverage. Regular photos are extrapolated -- the AI infers what is around the visible area.

The image must be publicly accessible via URL (not a local file path). For local files, use upload_and_generate instead.

### Multi-Image Reconstruction

Reconstruct a 3D space from multiple photographs taken at known angles:

```
generate_world_from_multi_image(
    image_urls=[
        "https://example.com/north.jpg",
        "https://example.com/east.jpg",
        "https://example.com/south.jpg",
        "https://example.com/west.jpg"
    ],
    azimuths_deg=[0, 90, 180, 270],
    text_prompt="A modern living room with large windows",
    display_name="Living Room"
)
```

Use 2-8 images at known azimuth angles. Cardinal directions (0/90/180/270) work well. The images must overlap in content for the best reconstruction.

### Video-to-World

Generate from a short video:

```
generate_world_from_video(
    video_url="https://example.com/walkthrough.mp4",
    text_prompt="Explore this space and reconstruct the full environment",
    display_name="Walkthrough World"
)
```

The video is analyzed to reconstruct spatial geometry. Works best with slow, steady camera movement through the space.

### Uploading Local Files

For local images or videos, use the three-step flow:

```
result = prepare_media_upload(file_name="photo.jpg", kind="image", extension="jpg")
# result.media_asset.id, result.upload_info.upload_url, result.upload_info.headers
# Then PUT your file bytes to upload_url with those headers
# Then:
generate_world_from_media_asset(
    media_asset_id=result["media_asset"]["id"],
    kind="image",
    text_prompt="Extend this room into a full interior"
)
```

Or use the all-in-one convenience wrapper:

```
upload_and_generate(
    local_file_path="C:/photos/my-room.jpg",
    kind="image",
    text_prompt="A cozy living room",
    display_name="My Room"
)
```

The all-in-one flow handles the upload and generates in one call. Files are limited to 100MB. Supported formats: images (jpg, jpeg, png, webp) and videos (mp4, mov, mkv).

## Managing Worlds

### Listing Your Worlds

```
list_worlds(page_size=20)
```

Returns all previously generated worlds with thumbnails, captions, creation dates, and model info. Use page_token for pagination through large collections.

### Getting World Details

```
get_world(world_id="wl_abc123")
```

Returns full details including:
- Splat asset URLs at multiple resolutions (100k/500k/full SPZ files)
- Collision mesh GLB (for physics and collision detection)
- Panorama image
- Thumbnail image
- AI-generated caption describing the world
- Creation date
- Model used
- Direct link to the Marble viewer

### Deleting Worlds

```
delete_world(world_id="wl_abc123")
```

Permanently removes the world and all associated assets. This is irreversible. There is no trash or undo.

## Adding Spatial Content to Worlds

### Broadcasting Spatial Audio

Once a world is loaded in the Spark viewer, add spatial audio:

```
broadcast_spatial_audio(
    prompt_or_url="https://example.com/ambient.mp3",
    x=0, y=2, z=0,
    is_loop=True
)
```

Audio plays at the specified 3D coordinate in the scene. The viewer's WebAudio PannerNode spatializes the sound -- it gets louder as you approach, quieter as you move away. You can also pass a text prompt for AI-generated audio.

### Spatial Notifications

Broadcast a voice notification at a specific location:

```
broadcast_spatial_notification(
    text="Welcome to the cathedral. The main altar is ahead.",
    x=5, y=1.5, z=0
)
```

The system uses Gemini TTS to generate natural speech and spatializes it at the given coordinates. Useful for guided tours, narration, or announcements.

### Placing Virtual Screens

Embed a Veo AI-generated video in the 3D world:

```
place_world_tv(
    video_url="https://example.com/generated-video.mp4",
    x=0, y=1.6, z=3,
    rotation_y=0,
    scale=1
)
```

The video plays on a virtual screen at the specified location. Great for mixed reality experiences combining 3D worlds with generative video.

### Spawning Agent Avatars

Place an animated AI agent in the world:

```
spawn_agent_avatar(
    avatar_url="default_agent",
    x=2, y=0, z=1,
    rotation=0
)
```

The avatar is grounded on the world's collision mesh. Currently supports a default agent model.

## Prompt Refinement Workflow

For better world generation results, refine your prompts before submission. Start with a short idea:

```
refine_with_local_llm(
    prompt="garden with pond",
    style="Cinematic",
    model="llama3.2:3b"
)
```

The local LLM expands this into a detailed, Marble-optimised prompt like: "A serene Japanese garden at golden hour, featuring a still koi pond with water lilies and a gently arched wooden bridge. Cherry blossom trees in full bloom line a winding gravel path, their petals scattered on the water surface. Soft warm light filters through the canopy, casting dappled shadows on moss-covered stone lanterns. The scene is framed by a traditional wooden pavilion with a curved tiled roof in the background."

Use this expanded prompt with `generate_world_from_text` for much better results.

## Prompt Management

Save your best prompts for reuse:

```
create_prompt(name="Gothic Cathedral", content="A vast gothic cathedral interior...", tags=["architecture", "indoor", "gothic"])
list_prompts()
update_prompt(prompt_id="prompt_1", content="Revised prompt...")
delete_prompt(prompt_id="prompt_1")
```

Build a library of curated prompts organized by tags for quick access in future sessions.

## Exporting Assets to Other Tools

### Blender Export

```
export_to_blender(world_id="wl_abc123", asset_type="mesh")
```

Stages the collision mesh GLB in the fleet exchange directory for blender-mcp to import. The mesh can be used as reference geometry for 3D modeling, texturing, or scene composition.

### Unity Export

```
export_to_unity3d(world_id="wl_abc123", asset_type="splat")
```

Stages the splat file for Unity3D import. 3D Gaussian splats render in real-time in Unity, enabling interactive VR/AR experiences based on generated worlds.

### Resonite Export

```
export_to_resonite(world_id="wl_abc123", asset_type="panorama")
```

Stages the 360-degree panorama for Resonite VR social platform import. Use as immersive environment backgrounds for social gatherings, presentations, or virtual events.

### Direct Handoff

```
handoff_asset(target_repo="blender-mcp", world_id="wl_abc123", asset_type="mesh")
```

Sends the asset directly to the target fleet MCP repo for processing without intermediate steps.

## Plex Media in Worlds

Use the built-in Plex integration to embed movies and shows as virtual TV screens in generated worlds:

```
results = search_plex(query="nature documentary")
stream_url = get_plex_stream_url(item_id=results["items"][0]["id"])
place_world_tv(video_url=stream_url, x=0, y=1.6, z=3, rotation_y=0, scale=1.5)
```

This creates a virtual TV in the world playing your Plex media, for immersive viewing experiences.

## Multi-World Scene Management

Build complex scenes by combining multiple generated worlds:

1. Generate each room/environment separately via different world generation calls
2. Export each as GLB collision meshes: `export_to_blender(world_id="...", asset_type="mesh")`
3. In blender-mcp, compose the meshes into a single scene layout
4. Export the composite scene back for viewer display
5. Alternatively, use `bake_scene(scene_id="...")` to save a combined scene configuration locally

## Scene Baking

The scene system saves re-combinable scene configurations:

```
bake_scene(scene_id="scene_1")
```

Baking packages all assets (splats, meshes, audio, TV placements, avatar positions) into a standalone scene format that can be loaded later without re-generating worlds. Useful for creating permanent exhibition spaces or saved environments.

## Performance Optimization

For faster generation: use marble-1.1 (not plus) for simpler scenes, reduce prompt complexity (fewer objects and details), use smaller images for image-to-world generation, and avoid panorama mode for single-photo inputs. For higher quality: use marble-1.1-plus with detailed prompts, use 4+ image views for multi-image reconstruction, provide guiding text_prompt for image inputs, and use seed for deterministic reproducibility between iterations.

## Credit Management

Monitor your credit usage to avoid unexpected 402 errors:

- marble-1.1: 1500 credits per generation
- marble-1.1-plus: 1500 base + 300 per dynamic expansion
- get_world/list_worlds: no credit cost
- delete_world: no credit cost
- export/handoff: no credit cost
- broadcast tools: no credit cost

Monitor your balance at platform.worldlabs.ai. Consider using marble-1.1 for prototyping iterations and marble-1.1-plus for final production worlds.

## Web Dashboard

The worldlabs-mcp web dashboard provides visual access to: generated world gallery with thumbnails and viewer links, real-time operation status monitoring, asset download interface, API key management, and credit usage tracking. Access via the configured web port when the server is running in HTTP mode.

## Fleet Integration

worldlabs-mcp integrates with other fleet MCP servers via MCP_BRIDGE_URLS:

- blender-mcp: receives collision meshes for 3D modeling
- unity3d-mcp: receives splat files for game engine rendering
- resonite-mcp: receives panoramas for VR platform
- vla-mcp: generates rooms for robot simulation environments
- avatar-mcp: provides avatars for world population

Set MCP_BRIDGE_URLS environment variable with comma-separated peer URLs for automatic proxying.

## Local Asset Serving and Caching

World assets downloaded to the local server are cached for fast access. Use `serve_local_asset` to expose locally cached assets over HTTP for external tools. Use `list_local_assets` to see what is cached. Cached assets persist across server restarts in the configured cache directory. The download_world_asset tool fetches specific asset types (splat, mesh, panorama, thumbnail) to the local cache. This enables offline usage and faster subsequent access.

## Scene Composition Workflow

Build interactive experiences by composing multiple elements:

1. Generate several complementary worlds (interior, exterior, details)
2. Download their collision meshes: `download_world_asset(world_id="...", asset_type="mesh")`
3. Export to Blender: `export_to_blender(world_id="...", asset_type="mesh")`
4. In Blender, compose the meshes into a unified scene layout
5. Add spatial audio: `broadcast_spatial_audio(prompt_or_url="bgm.mp3", x=0, y=0, z=0, is_loop=True)`
6. Place virtual TVs: `place_world_tv(video_url="...", x=0, y=1.6, z=5)`
7. Spawn avatars: `spawn_agent_avatar(x=-2, y=0, z=0)`
8. Save the scene: `bake_scene(scene_id="my_exhibition")`

The baked scene preserves all asset references and spatial placements for later reloading.

## Best Practices for World Generation

For best results with text prompts: be specific about architectural style, lighting conditions, time of day, materials, and spatial layout. Include atmospheric details (fog, particles, ambient lighting). Mention what the viewer should feel or notice. Use marble-1.1-plus for scenes with complex geometry or large open spaces. Use marble-1.1 for focused, smaller scenes where detail density is more important than coverage.

For best results with image inputs: use high-resolution photos with good lighting and minimal motion blur. Panoramas should be equirectangular projections (2:1 aspect ratio). For multi-image, ensure consistent lighting between shots and at least 30% overlap between adjacent angles. Remove people or moving objects from photos if possible.

For best results with video: use slow, steady camera movement. Avoid quick pans or zooms. The video should thoroughly cover the space from multiple angles. Duration of 30-60 seconds at 30fps is recommended.

## World Asset Download Sizes

Understanding asset sizes helps with bandwidth planning: SPZ 100k (2-5 MB, quick preview quality), SPZ 500k (10-20 MB, good quality), SPZ full (30-100 MB, best quality), collision mesh GLB (1-3 MB, lightweight), panorama JPG (5-15 MB, high resolution), thumbnail JPG (100-500 KB, preview). Splat download times depend on your internet connection speed. For VR/AR real-time rendering, use 500k splats. For highest quality offline rendering, use full splats. The collision mesh is always suitable for physics and navigation regardless of world detail level.

## URL and Asset Expiry

World asset download URLs are temporary and expire approximately 1 hour after generation. If you need assets later, use get_world to get fresh URLs. The collision mesh URL is persistent and does not expire. Splat URLs at all resolutions (100k, 500k, full) expire. Panorama and thumbnail URLs may also expire. For long-term storage, download assets using download_world_asset or export_to_* tools, which save files to the local server's cache. The cache persists across restarts.

## Using the Marble Web Viewer

Each generated world includes a view_url that opens in the Marble web viewer at view.worldlabs.ai. The viewer requires WebGL 2.0 support (Chrome, Firefox, Edge, Safari 16+). Features: WASD keyboard navigation, mouse/touch orbit control for desktop and mobile sizing, fullscreen mode, teleport navigation, screenshot capture, and share link generation. The viewer is the primary way to inspect generated worlds before exporting assets or broadcasting spatial content. Open the viewer URL in a separate browser window alongside the MCP client for real-time feedback.

## Asset Licensing and Usage

Generated worlds and their assets are owned by the API key holder. Assets can be used commercially, redistributed, and modified per the World Labs terms of service. Splat files (SPZ format) are viewable in the Marble viewer and compatible Unity3D plugins. Collision meshes (GLB) are standard glTF 2.0 format compatible with any 3D engine. Panoramas (JPEG) are standard equirectangular format. There is no watermark or attribution requirement for generated content.

## Integration with External DCC Tools

To use generated worlds in Blender: download the collision mesh as GLB, import into Blender using File/Import/glTF 2.0, use as reference geometry for modeling or as collision proxy for physics. For Unity3D: download the splat file, import using the World Labs Unity package (available from Marble API), render 3D Gaussian splats in real-time in the game view. For Resonite: download the panorama, import as a skybox texture for immersive VR environments.

## Workflow: Complete Scene Creation

End-to-end workflow for creating a rich interactive scene: ideation and prompt crafting (use refine_with_local_llm), world generation (marble-1.1 for simple scenes, plus for complex), inspection (open viewer URL, verify quality), iteration (adjust prompt and regenerate if needed), spatial audio addition (broadcast ambient sound at key positions), virtual TV placement (embed Plex media or videos at walls), agent avatar spawning (populate with characters), scene baking (save complete configuration), and export (download assets for external tool use if needed). This workflow produces a complete spatial experience from a single text prompt in minutes.

## Advanced World Generation Prompting

For architectural interiors: specify room type, dimensions, wall colors, flooring material, ceiling height, lighting fixtures, window placement, furniture style, and clutter level. Example: "A modern open-plan living room with floor-to-ceiling windows, polished concrete floors, a gray sectional sofa, a glass coffee table, abstract art on white walls, and warm recessed lighting at sunset."

For natural environments: specify biome, terrain type, vegetation density, weather conditions, time of day, water features, and wildlife presence. Example: "A misty temperate rainforest at dawn with tall redwood trees, ferns covering the ground, a narrow dirt path winding through, shafts of golden light breaking through the canopy, and a small stream with moss-covered rocks."

For fantasy environments: specify architectural style, magical elements, light sources, material properties (glowing, ethereal), scale, and atmosphere. Example: "An ancient elven ruin at twilight with crumbling marble pillars covered in glowing blue ivy, floating magical orbs providing soft illumination, a cracked stone altar at the center, and a view of a starry sky through a collapsed dome ceiling."

For urban environments: specify city style, building materials, street width, signage, lighting, vehicle presence, and pedestrian density. Example: "A narrow alleyway in Tokyo at night with neon signs in Japanese characters reflecting off wet pavement, steam rising from a street vendor cart, paper lanterns strung between buildings, and a stray cat sitting on an electrical box."

## Asset Management Strategy

Manage your world assets efficiently: generate with tags for easy filtering, delete unwanted worlds promptly to avoid clutter, download important assets locally before URLs expire, use descriptive display_names for easy identification, leverage the prompt system for repeatable generation, batch download from multiple worlds when building a scene collection, and periodically review and clean up old worlds with list_worlds and selective deletion.

## Integration with Godot Game Engine

World assets can be imported into Godot for interactive experiences. The export flow: generate world with desired scene, download collision mesh GLB, import GLB into Godot with the godot_import_glb tool from godot-mcp, set up character controller and interactions, add spatial audio and TV screens via the Spark viewer integration or Godot's native audio. The godot-mcp integration handles GLB import with mesh, material, and skeleton preservation. Use this workflow for interactive 3D experiences, games, and training simulations built on generated world geometry.

## Prompt Library Curation

Build a personal prompt library organized by tags for rapid world generation. Example categories: architecture (modern, gothic, classical, industrial), nature (forests, beaches, mountains, deserts, underwater), fantasy (medieval, magical, alien, steam-punk), interiors (rooms, halls, corridors, caves), urban (city streets, plazas, markets, rooftops), and moods (peaceful, dramatic, mysterious, festive). Each curated prompt should include: specific architectural features, lighting conditions, color palette, atmospheric effects, and spatial layout details. Save prompts in categories for consistent theme generation across multiple worlds.

## Multi-View Capture Best Practices

When capturing images for multi-view reconstruction, follow these best practices: use a camera with consistent focal length and exposure across all shots, capture in raw format if possible for maximum quality, maintain at least 30% overlap between adjacent views, cover 360 degrees around the subject, include both low and high elevation angles for thorough coverage, avoid reflective surfaces (glass, mirrors, water) which confuse the reconstruction algorithm, remove moving objects (people, vehicles, animals) from frame, capture in even lighting (avoid harsh shadows and direct sun), and include close-up detail shots alongside wide angle context shots. The ideal setup uses 4-8 evenly spaced views at consistent elevation.

## Generation Quality Factors

World quality depends on multiple factors: prompt specificity (detailed prompts produce better results than vague ones), model choice (marble-1.1-plus produces more detailed worlds but costs more), input quality (high-resolution images with good lighting work best), seed consistency (same seed + same prompt = identical world, enabling iterative refinement), and random variation (without seed, each generation is unique). For optimal quality: use the most detailed prompt you can write, choose model based on complexity needs, provide high-quality reference images, use seeds for reproducible results, and generate multiple variants to select the best.

## Asset Download Cache

The worldlabs-mcp server maintains a local cache of downloaded world assets. When you download an asset, it is stored in the cache directory and reused on subsequent requests. Cache behavior: splat files are cached by world_id and resolution, collision meshes are cached by world_id, panoramas and thumbnails are cached by world_id. Cache entries are valid indefinitely but should be refreshed if the world is regenerated. List cached assets with list_local_assets. The cache directory is configurable via WORLDLABS_ASSET_CACHE. Clear the cache manually by deleting the cache directory contents.

## Web Dashboard Features

The web dashboard provides a visual interface for world generation and management when running in HTTP mode. Features: text prompt input with model selection, image URL input for image-to-world, file upload interface for local media, operation status monitoring with auto-polling, world gallery with thumbnails and viewer links, asset download buttons for each resolution, prompt management CRUD interface, and fleet integration status panel. The dashboard auto-refreshes during world generation. Access at http://localhost:DASHBOARD_PORT when the server is running.

## Multi-World Scene Assembly

Build complex environments by combining multiple generated worlds. Workflow: generate each room or area as a separate world, download collision meshes for each, export to Blender for assembly into a unified scene, arrange meshes in 3D space to create connected spaces, and save the composite scene. Each sub-world can be independently regenerated if needed. For connected spaces (rooms, corridors), ensure doorways and passageways align between adjacent worlds. Scale matching is important -- all worlds use the same coordinate system by default.

## Fleet Export Protocol

When exporting to fleet MCP servers, the protocol handles: asset file transfer to exchange directory, creation of metadata JSON with origin information, optional callback URL for completion notification, and cross-server coordination. The export_to_* tools (Blender, Unity3D, Resonite) each handle the specific asset format and metadata conventions of the target platform. The generic handoff_asset tool provides the same functionality for any fleet target. Target servers must be running MCP_BRIDGE_URLS must be configured for automatic proxying.

## Scene Composition with Spatial Audio

Spatial audio enhances immersion by placing sounds at specific 3D coordinates. Best practices: position ambient sounds (wind, water, background music) at the center of the area, place localized sounds (footsteps, machinery) near their source objects, use looping audio for continuous environmental effects, use one-shot audio for events (door opening, notification), adjust volume based on proximity to listener, and layer multiple audio sources for rich soundscapes. The Spark viewer spatializes audio using WebAudio PannerNode, creating realistic 3D sound that changes as the viewer moves through the world.

## Batch World Generation

For large projects, generate multiple worlds in parallel. Each generate call returns an operation_id immediately. Collect all operation_ids and poll them in batches. This parallel approach completes the set of worlds faster than sequential generation. Considerations: each generation consumes credits regardless of success, verify credit balance before batch generation, use tags to organize batch-generated worlds, and set descriptive display_names to identify worlds from the batch. Batch generation is ideal for creating scene libraries, A/B testing prompts, and building multi-world environments.

## World Generation Prompts Repository

Build a reusable repository of effective prompts organized by use case. Interior design concepts: living rooms, kitchens, bedrooms, bathrooms, offices, libraries, galleries, lobbies, corridors, atriums. Architectural exteriors: modern buildings, historical architecture, ruins, bridges, towers, monuments, stadiums. Natural landscapes: forests, beaches, mountains, deserts, caves, canyons, waterfalls, gardens, parks, farms. Urban environments: city streets, plazas, markets, rooftops, train stations, airports, parking garages, tunnels. Fantasy and surreal: floating islands, crystal caves, alien landscapes, dreamscapes, abstract spaces, impossible geometry. Each entry includes the exact prompt text, model used, seed (if applicable), and quality notes.

## World Credit Budget Planning

Plan your credit usage across projects. Each marble-1.1 generation costs 1500 credits. Each marble-1.1-plus generation costs 1500 + 300 per expansion. A typical project budget: 10,000 credits for prototyping (6-7 generations at marble-1.1), 30,000 credits for production (10 generations at marble-1.1-plus), 5,000 credits for prompt refinement iterations, and 5,000 credits buffer for retakes. Total: ~50,000 credits per project. Check your credit balance at platform.worldlabs.ai before starting a large project. Monitor usage with the web dashboard or platform API.

## World Quality Assessment

Evaluate generated world quality by checking: geometry coherence (walls connect properly, floors are flat, no floating geometry), texture detail (surfaces have appropriate texture resolution), lighting quality (shadows and highlights match the prompt), scale accuracy (proportions feel natural), and absence of artifacts (no distorted geometry, color bleeding, or floating fragments). Low-quality results can be improved by: adding more detail to the text prompt, using a higher-quality source image, switching to marble-1.1-plus for complex scenes, and refining the prompt with the local LLM before submission. Multiple generations with the same prompt can yield different quality levels due to the stochastic nature of the generation process.

## Marble API Platform Account Management

Manage your World Labs API account at platform.worldlabs.ai. From the dashboard you can: view your API key (WORLDLABS_API_KEY), check credit balance and usage history, view generation history and status, manage billing and payment methods, and access API documentation. The web credits (used at marble.worldlabs.ai) are completely separate from API platform credits. Credit top-ups apply only to the platform where they were purchased. Monitor credit usage through the platform dashboard to avoid unexpected 402 errors during generation.

## Export File Movement

After exporting assets to fleet MCP servers, the files are staged in the shared exchange directory. From there: Blender can import GLB files directly, Unity3D requires the World Labs Unity package for SPZ import, Resonite imports panoramas as skybox textures, and other tools may need format conversion. The exchange directory location is configurable and shared across fleet repos. Files in the exchange are organized by source world_id and asset type. Clean up the exchange directory periodically to remove stale exports.

## Prompt Optimization Examples

Before: "A castle" -- too short, produces generic low-quality result. After: "A medieval stone castle on a rocky cliff overlooking a stormy sea at dusk, with tall towers, crenellated battlements, a raised drawbridge, torchlight flickering from arrow slits, moss-covered walls, seagulls circling above, and dark storm clouds with occasional lightning illuminating the scene. The camera is positioned halfway up the cliff looking up at the castle silhouetted against the dramatic sky." The detailed version produces significantly better results by specifying architecture, setting, lighting, atmosphere, and viewpoint.

## Spatial Audio Troubleshooting

If spatial audio does not play: verify the audio URL is accessible and returns a supported format (MP3, WAV, AAC), check that the Spark viewer is connected and has audio enabled, verify the 3D coordinates are within the world bounds, ensure the viewer is not muted in the browser, and check browser autoplay policies (some browsers block audio until user interaction). For generated audio (text prompt), check that the TTS service is available. If audio plays but is not spatialized, the viewer may not have WebAudio PannerNode support.

## Asset Serving for Web Applications

To embed world assets in web applications: use serve_local_asset to get an HTTP URL for cached assets, use proxy_splat_asset for CORS-compatible splat access, embed the Marble viewer iframe using the view_url from get_world, and use TTS endpoints for voice narration. Web applications must handle signed URL expiry by periodically refreshing asset URLs. Cross-origin requests are handled by the server's CORS configuration.

## Operation Cancellation

Generation operations cannot be explicitly cancelled through the Marble API. If you no longer need a running operation, you can stop polling it. The operation will complete on the server side and consume credits regardless of whether you poll for the result. You can ignore the operation_id and use delete_world to remove the result if it completes. To avoid wasting credits on unwanted generations, carefully verify prompts and models before submission.

## Troubleshooting

**Generation returns HTTP 401:** WORLDLABS_API_KEY is invalid or missing. Check the environment variable and regenerate the key at platform.worldlabs.ai if needed.

**Generation returns HTTP 402:** Insufficient API credits. Top up at platform.worldlabs.ai. Note that web credits (marble.worldlabs.ai) are separate from API credits.

**Generation returns HTTP 429:** Rate limited. Wait and retry with exponential backoff. Avoid rapid successive generation calls.

**get_operation never shows done=True:** marble-1.1-plus jobs can take 5-10 minutes. Use a longer timeout_seconds (e.g., 600) or poll manually with get_operation.

**Image-to-world fails:** The image URL must be publicly accessible. Check that the URL returns a valid image (no authentication, no blocked domains). For local images, use upload_and_generate instead.

**Upload fails with FileNotFoundError:** The local file path is incorrect. Use absolute paths and verify the file exists. Files over 100MB must use the REST API endpoint for large files.

**Spatial broadcast fails:** The Spark viewer must be actively connected to receive broadcasts. Ensure the viewer is open and connected before sending spatial content.

**Export handoff not working:** The target fleet MCP server may not be running. Start the target server first, then retry the handoff.

**World viewer link not working:** The Marble viewer may not be compatible with your browser. Try Chrome or Firefox. The viewer requires WebGL 2.0 support.
