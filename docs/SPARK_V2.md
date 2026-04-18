# Spark 2.0: Streaming 3DGS Worlds on the Web

[Spark](https://sparkjs.dev) is World Labs' open-source (MIT) 3D Gaussian Splatting renderer for the web, built on THREE.js + WebGL2. **Spark 2.0** was released 2026-04-15 and introduces streaming, Level-of-Detail, and GPU virtual memory. It's the renderer used by this project's `web_sota/src/pages/spark-viewer.tsx` page.

## What's new in 2.0

### 1. LoD Splat Tree — render N splats per frame regardless of scene size
Splats are organised into a hierarchical tree (leaves = original splats, interior nodes = merged downsampled approximations up to a single root splat). Each frame Spark picks a "slice" through the tree sized to a tunable budget N (platform default 500K–2.5M), giving steady frame rates on scenes with hundreds of millions of splats.

Two tree-construction algorithms ship:
- **tiny-lod** — quick, compact, designed for on-demand in-browser construction.
- **bhatt-lod** — higher-quality offline (CLI) algorithm using Bhattacharyya distance between splats for merge pairs.

Both are training-free — no reference images needed.

### 2. `.RAD` streaming format
Spark 2.0 defines a new file format (`.RAD`, "radiance field") that stores a precomputed LoD splat tree and supports HTTP Range requests. The viewer can show a coarse ~64K-splat proxy almost instantly and refine progressively as bytes arrive. Use `spark build-lod` (CLI) to convert `.ply` / `.spz` / `.splat` / `.ksplat` / `.sog` to `.RAD`.

### 3. Virtual splat paging
A fixed GPU memory pool (default ~16M splats) acts as a page table; 64K-splat pages are swapped in/out via LRU based on what's visible. This lets scenes far larger than GPU memory render smoothly even on phones and Quest 3.

### 4. Composite LoD worlds
Multiple splat objects can be traversed jointly so Spark picks a globally optimal set of N splats across all of them — useful for stitching independently captured or generated scenes.

### Other 2.0 additions
- **ExtSplats** — higher-precision 32-byte encoding with `float32` centre coordinates (fixes quantisation in large coord systems).
- **ReadableStream loading** — multi-GB files no longer need to fit in a single Uint8Array.
- **SparkXr** wrapper for WebXR.
- Experimental covariance-based splats and linear-blend skinning for animated splat characters.
- Rust core compiled to Wasm, runs in Web Workers so it doesn't block the render loop.

## Format matrix

| Format | Purpose | Spark 2.0 support |
|--------|---------|-------------------|
| `.RAD` | Streaming LoD (native 2.0 format) | **Best** — progressive + paging |
| `.SPZ` | Compact Gaussian splat | Full |
| `.PLY` | Standard splat format (also compressed) | Full |
| `.SPLAT` / `.KSPLAT` | Alternative compact encodings | Full |
| `.SOG` | Newer splat format | Full |
| `.GLB` | Collision mesh from Marble | Loaded as a THREE.js mesh alongside splats |

## Local asset serving in this project

The bridge exposes `GET /api/local-assets/{filename}` which serves files from `WORLDLABS_LOCAL_PATH` (defaults to `~/Downloads`). Allowed extensions: `.spz`, `.rad`, `.ply`, `.ksplat`, `.splat`.

```
GET http://localhost:10865/api/local-assets/my-world.rad
```

## Performance knobs (spark-viewer.tsx)

- `maxSplats` — the N budget. Raise on desktop, lower on mobile.
- `sortResolution` — how often the global depth sort runs.
- Foveation parameters — bias detail toward the centre of the viewport.

Defaults in this project target desktop "Ultra" (~2.5M splats per frame). If you're testing on a Quest or phone, drop the budget in the viewer config.

## Not in Spark 2.0 (contrary to earlier drafts of this doc)

- **No "programmable physics"** — Spark renders splats. Colliders are supplied separately by Marble as GLB meshes and driven by whatever physics engine your host scene uses (THREE.js + cannon / rapier / PhysX, or Unity / Blender on export).
- **No automatic material properties on splats** — splats encode position/size/orientation/colour/opacity (+ optional SH for view-dependent colour). Any footstep-sound-per-surface logic must be implemented by the host application.

## References

- Blog post: https://www.worldlabs.ai/blog/spark-2.0
- Docs: https://sparkjs.dev
- Repo: https://github.com/sparkjsdev/spark (MIT)

