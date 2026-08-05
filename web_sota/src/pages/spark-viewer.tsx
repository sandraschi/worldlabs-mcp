import { SparkRenderer, SparkXr, SplatMesh } from "@sparkjsdev/spark";
import {
  Check,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Globe2,
  Home,
  Info,
  Link,
  Maximize2,
  Minimize2,
  Music,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  UserPlus,
  Video,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import {
  type CachedSplatMeta,
  cacheSplat,
  clearSplatCache,
  deleteCachedSplat,
  getCachedSplat,
  getSplatCacheSize,
  getStorageQuota,
  listCachedSplats,
} from "@/lib/splat-cache";
import { cn } from "@/lib/utils";

const PORTAL_PRESETS = [
  {
    name: "Modern Mansion",
    url: "/api/local-assets/Modern Tropical Luxury Residence.spz",
  },
  {
    name: "Schönbrunn Palace",
    url: "https://models.worldlabs.ai/dist/schonbrunn.spz",
  },
  {
    name: "Cyberpunk Alley",
    url: "https://models.worldlabs.ai/dist/cyberpunk.spz",
  },
];

interface ProximityTrigger {
  id: string;
  position: THREE.Vector3;
  radius: number;
  text: string;
  cooldown: number;
  lastTriggered: number;
  isExit?: boolean; // If true, triggers when MOVING AWAY from origin beyond radius
}

// ── Manifest Hub (Landing State) ──────────────────────────────────────────────

function ManifestHub({
  onLoad,
  onBrowse,
}: {
  onLoad: (url: string, name: string) => void;
  onBrowse: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-950/40 backdrop-blur-sm z-20">
      <div className="relative w-full max-w-5xl space-y-12 text-center animate-in fade-in zoom-in-95 duration-700">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmos-500/10 border border-cosmos-500/20 text-cosmos-400 text-xs font-black uppercase tracking-[0.2em]">
            <Zap className="w-3 h-3" />
            Core Infrastructure v2.0
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Manifest your <span className="gradient-text">Spatial Intent.</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Initialize high-fidelity 3D worlds directly into the Rust-powered
            Spark engine. Connect a remote manifest or manifest a local
            workspace below.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PORTAL_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onLoad(p.url, p.name)}
              className="group glass-card p-6 text-left hover:border-cosmos-500/50 hover:shadow-2xl hover:shadow-cosmos-500/10 transition-all duration-300 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cosmos-600/20 group-hover:border-cosmos-500/30 transition-all">
                <Globe2 className="w-5 h-5 text-slate-300 group-hover:text-cosmos-300" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Remote Manifest Portal
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-cosmos-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onBrowse}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-white transition-all shadow-xl active:scale-95"
            >
              <FolderOpen className="w-4 h-4" />
              Initialize Local Workspace
            </button>
            <div className="text-xs text-slate-300 uppercase font-black tracking-widest">
              or
            </div>
            <div className="text-xs text-slate-300 italic">
              Drag and drop an{" "}
              <span className="text-cosmos-400 font-bold">.SPZ</span> file here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Asset Viewers ─────────────────────────────────────────────────────────────

export function SparkViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sparkRef = useRef<SparkRenderer | null>(null);
  const splatRef = useRef<SplatMesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string[]>([]);

  // Spatial Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const worldSessionIdRef = useRef(0);
  const xrRef = useRef<SparkXr | null>(null);
  const homePoseRef = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const localFrameRef = useRef<THREE.Group | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [loadedName, setLoadedName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spatialVoiceEnabled, setSpatialVoiceEnabled] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [toolboxPrompt, setToolboxPrompt] = useState("");
  const [toolboxAssetUrl, setToolboxAssetUrl] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [_isDragging, setIsDragging] = useState(false);
  const [worldId, _setWorldId] = useState<string>("default-world");
  const [worldName, setWorldName] = useState<string>("");
  const [toolboxTab, setToolboxTab] = useState<
    "studio" | "gallery" | "import" | "plex" | "handoff"
  >("studio");
  const [localAssets, setLocalAssets] = useState<string[]>([]);
  const [plexResults, setPlexResults] = useState<any[]>([]);
  const [plexQuery, setPlexQuery] = useState("");
  const [_isSearchingPlex, setIsSearchingPlex] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastConsoleClick, setLastConsoleClick] = useState(0);
  const [consoleAlert, setConsoleAlert] = useState<string | null>(null);
  const [availableUrls, setAvailableUrls] = useState<Record<string, string>>(
    {},
  );
  const [selectedRes, setSelectedRes] = useState("full");
  const [cacheSize, setCacheSize] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [caption, setCaption] = useState("");
  const [showCachePanel, setShowCachePanel] = useState(false);
  const [cachedItems, setCachedItems] = useState<CachedSplatMeta[]>([]);
  const [quotaInfo, setQuotaInfo] = useState({ usage: 0, quota: 0 });
  const [exportState, setExportState] = useState<
    Record<string, "idle" | "loading" | "ok" | "error">
  >({});

  // Geofencing Refs
  const triggersRef = useRef<ProximityTrigger[]>([]);
  const isNarratingRef = useRef(false);

  // Multimodal Refs
  const bgAudioRef = useRef<{
    [id: string]: {
      source: AudioBufferSourceNode;
      gain: GainNode;
      metadata?: any;
    };
  }>({});
  const videoSurfacesRef = useRef<{ [id: string]: THREE.Mesh }>({});
  const avatarsRef = useRef<{ [id: string]: THREE.Group }>({});
  const mixersRef = useRef<{ [id: string]: THREE.AnimationMixer }>({});
  const consoleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const consoleTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const consolePlaneRef = useRef<THREE.Mesh | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const moveSpeedRef = useRef(2.5);

  // Pull ?url=... & ?name=... from the query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const name = params.get("name") ?? "";
    const cap = params.get("caption") ?? "";

    // Read available resolution URLs
    const urls: Record<string, string> = {};
    const full = params.get("splat_full");
    const medium = params.get("splat_500k");
    const low = params.get("splat_100k");
    if (full) urls.full = full;
    if (medium) urls["500k"] = medium;
    if (low) urls["100k"] = low;
    setAvailableUrls(urls);

    const cinemaVideo = params.get("cinema_video");

    if (url) {
      setUrlInput(url);
      setLoadedName(name);
      setWorldName(name);
      setCaption(cap);
      void loadWorld(url).then(() => {
        // Auto-place cinema TV if coming from Cinema Worlds
        if (cinemaVideo) {
          setTimeout(() => {
            void handleSpatialVideo({
              id: "cinema_tv_auto",
              type: "video",
              url: cinemaVideo,
              x: 0,
              y: 1.8,
              z: -4,
              rotation: 0,
              scale: 0.22,
            });
          }, 3000); // Give the world time to load before placing the TV
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    worldSessionIdRef.current++; // Invalidate any pending async operations

    if (rendererRef.current) {
      try {
        rendererRef.current.dispose();
        rendererRef.current.setAnimationLoop(null);
      } catch (e) {
        logger.warn("Renderer disposal warning", { error: e });
      }
      rendererRef.current = null;
    }

    if (controlsRef.current) {
      try {
        controlsRef.current.dispose();
      } catch {}
      controlsRef.current = null;
    }

    if (sparkRef.current) {
      try {
        sparkRef.current.dispose();
      } catch {}
      sparkRef.current = null;
    }

    if (splatRef.current) {
      try {
        splatRef.current.dispose();
      } catch {}
      splatRef.current = null;
    }

    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }

    cameraRef.current = null;

    Object.values(mixersRef.current).forEach((m) => {
      try {
        m.stopAllAction();
      } catch {}
    });
    mixersRef.current = {};

    if (mountRef.current) {
      mountRef.current.innerHTML = "";
    }

    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      void ctx.close();
    }

    pannerRef.current = null;
    videoSurfacesRef.current = {};
    avatarsRef.current = {};
  }

  function initSpatialAudio() {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const panner = ctx.createPanner();

      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;

      panner.connect(ctx.destination);

      audioCtxRef.current = ctx;
      pannerRef.current = panner;
    }
  }

  async function broadcastEvent(
    type: "speech" | "audio" | "video" | "avatar" | "event",
  ) {
    if (!cameraRef.current) return;
    setIsBroadcasting(true);
    try {
      const pos = cameraRef.current.position;
      await api.broadcastNarration({
        type,
        text: type === "speech" ? toolboxPrompt : undefined,
        url: type !== "speech" ? toolboxAssetUrl || toolboxPrompt : undefined,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        is_loop: true,
      });
    } catch (e) {
      logger.error("Broadcast Error", { error: e });
    } finally {
      setIsBroadcasting(false);
      setToolboxPrompt("");
      setToolboxAssetUrl("");
    }
  }

  async function loadWorld(url: string) {
    if (!mountRef.current) return;
    cleanup();
    setStatus("loading");
    setError("");
    const thisSessionId = ++worldSessionIdRef.current;

    try {
      // 1. Setup Three.js
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        1000,
      );
      camera.position.set(0, 1.6, 4);
      camera.lookAt(0, 1.6, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight,
      );
      mountRef.current.appendChild(renderer.domElement);

      // Local Frame for XR stability and comfort
      const localFrame = new THREE.Group();
      scene.add(localFrame);
      localFrameRef.current = localFrame;

      // 2. Setup Spark 2.0
      const spark = new SparkRenderer({ renderer, maxStdDev: Math.sqrt(5) });
      localFrame.add(spark);
      localFrame.add(camera);

      // WebXR Management (Pico 4 / Quest 3 Optimized)
      const xr = new SparkXr({
        renderer,
        mode: "vrar",
        enableHands: true,
        sessionInit: {
          optionalFeatures: ["hand-tracking"],
        },
        onEnterXr: () => {
          logger.info("Immersive Session Started");
          setIsFullscreen(true); // Sync UI state
        },
        onExitXr: () => {
          logger.info("Immersive Session Ended");
          setIsFullscreen(false);
          if (controlsRef.current) controlsRef.current.update();
        },
      });
      xrRef.current = xr;

      // 3. Load Splat — from cache or network (with proxy fallback)
      let splatSrc: string;
      const cached = await getCachedSplat(url);
      if (cached) {
        splatSrc = URL.createObjectURL(cached.blob);
      } else {
        setLoadingMsg("Downloading SPZ...");
        let blob: Blob;
        try {
          const directResp = await fetch(url);
          if (!directResp.ok)
            throw new Error(`Direct fetch: ${directResp.status}`);
          blob = await directResp.blob();
        } catch {
          setLoadingMsg("Direct failed, trying proxy...");
          const proxyUrl = url.startsWith("http")
            ? `/api/handoff?url=${encodeURIComponent(url)}`
            : url;
          const proxyResp = await fetch(proxyUrl);
          if (!proxyResp.ok)
            throw new Error(`Proxy fetch: ${proxyResp.status}`);
          blob = await proxyResp.blob();
        }
        await cacheSplat(url, blob);
        splatSrc = URL.createObjectURL(blob);
        void updateCacheSize();
      }

      setLoadingMsg("");
      for (const old of blobUrlRef.current) URL.revokeObjectURL(old);
      blobUrlRef.current = splatSrc.startsWith("blob:") ? [splatSrc] : [];
      const splat = new SplatMesh({ url: splatSrc });
      scene.add(splat);

      // 4. Render Loop
      renderer.setAnimationLoop((_time, _xrFrame) => {
        if (thisSessionId !== worldSessionIdRef.current) return;

        try {
          const delta = clockRef.current.getDelta();

          // OrbitControls damping
          if (controlsRef.current && !renderer.xr.isPresenting) {
            controlsRef.current.update();
          }

          // Keyboard movement (WASD + Q/E)
          const keys = keysRef.current;
          if (keys.size > 0) {
            const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(
              camera.quaternion,
            );
            fwd.y = 0;
            fwd.normalize();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
              camera.quaternion,
            );
            right.y = 0;
            right.normalize();
            const speed = moveSpeedRef.current * delta;
            const move = new THREE.Vector3();
            if (keys.has("KeyW") || keys.has("ArrowUp"))
              move.add(fwd.clone().multiplyScalar(speed));
            if (keys.has("KeyS") || keys.has("ArrowDown"))
              move.add(fwd.clone().multiplyScalar(-speed));
            if (keys.has("KeyA") || keys.has("ArrowLeft"))
              move.add(right.clone().multiplyScalar(-speed));
            if (keys.has("KeyD") || keys.has("ArrowRight"))
              move.add(right.clone().multiplyScalar(speed));
            if (keys.has("KeyE")) move.y += speed;
            if (keys.has("KeyQ")) move.y -= speed;
            if (move.length() > 0) {
              camera.position.add(move);
              controls.target.add(move);
            }
          }

          if (sparkRef.current && camera) {
            void sparkRef.current.update({ scene, camera }); // Spark 2.0 update signature
          }

          // Update Avatar Animations
          Object.values(mixersRef.current).forEach((m) => {
            if (m) m.update(delta);
          });

          // Update Audio Listener to match Camera
          if (audioCtxRef.current && audioCtxRef.current.state === "running") {
            const listener = audioCtxRef.current.listener;
            const pos = camera.position;
            const up = camera.up;
            const target = new THREE.Vector3(0, 0, -1).applyQuaternion(
              camera.quaternion,
            );

            if (listener.positionX) {
              listener.positionX.value = pos.x;
              listener.positionY.value = pos.y;
              listener.positionZ.value = pos.z;
              listener.forwardX.value = target.x;
              listener.forwardY.value = target.y;
              listener.forwardZ.value = target.z;
              listener.upX.value = up.x;
              listener.upY.value = up.y;
              listener.upZ.value = up.z;
            } else {
              // Legacy support
              listener.setPosition(pos.x, pos.y, pos.z);
              listener.setOrientation(
                target.x,
                target.y,
                target.z,
                up.x,
                up.y,
                up.z,
              );
            }
          }

          // Update Geofencing Triggers
          if (spatialVoiceEnabled && !isNarratingRef.current) {
            const now = Date.now();
            const camPos = camera.position;

            for (const t of triggersRef.current) {
              const dist = camPos.distanceTo(t.position);
              const isTriggered = t.isExit ? dist > t.radius : dist < t.radius;

              if (isTriggered && now - t.lastTriggered > t.cooldown) {
                t.lastTriggered = now;
                void playFormattedNarration(
                  t.text,
                  t.position.x,
                  t.position.y,
                  t.position.z,
                );
                break; // Only one trigger at a time
              }
            }

            // Portal Detection
            for (const obj of Object.values(videoSurfacesRef.current)) {
              if (obj && obj.userData?.type === "portal") {
                const dist = camPos.distanceTo(obj.position);
                if (dist < 1.0 && !isTransitioning) {
                  void handlePortalAction(obj.userData.target_world_url);
                }
              }
            }
          }

          // Update Console Texture if active
          if (consoleTextureRef.current) {
            updateConsoleCanvas();
            consoleTextureRef.current.needsUpdate = true;
          }

          renderer.render(scene, camera);
        } catch (e) {
          logger.error("Render Loop Component Failure", { error: String(e) });
        }
      });

      // References
      sceneRef.current = scene;
      cameraRef.current = camera;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.minDistance = 1;
      controls.maxDistance = 50;
      controls.target.set(0, 1.6, 0);
      controls.update();
      controlsRef.current = controls;

      rendererRef.current = renderer;
      sparkRef.current = spark;
      splatRef.current = splat;

      // Force initial resize to match container
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight,
      );

      // 5. Await splat initialization (not polling — use the promise)
      try {
        await splat.initialized;
      } catch (initErr) {
        logger.error("Splat initialization failed", { error: initErr });
        throw new Error(`Splat failed to load: ${initErr}`);
      }

      setStatus("ready");

      // Start INSIDE the world: eye height above the splat's floor, centered,
      // looking ahead. The splat itself is left untouched.
      try {
        const box = splat.getBoundingBox();
        if (!box.isEmpty()) {
          const size = box.getSize(new THREE.Vector3());
          const min = box.min;
          const center = box.getCenter(new THREE.Vector3());
          const eyeY = min.y + 1.6;
          camera.position.set(center.x, eyeY, center.z + 2);
          camera.lookAt(center.x, eyeY + 0.3, center.z + 6);
          controls.target.set(center.x, eyeY + 0.3, center.z + 6);
          controls.minDistance = 0.5;
          controls.maxDistance = Math.max(50, Math.max(size.x, size.z) * 2);
          controls.update();
          homePoseRef.current = {
            pos: camera.position.clone(),
            target: controls.target.clone(),
          };
          (window as unknown as Record<string, unknown>).__sparkDebug = {
            splat,
            camera,
            controls,
            spark,
          };
          console.log(
            "[SPARK-DIAG]",
            JSON.stringify({
              size: [size.x, size.y, size.z],
              min: [min.x, min.y, min.z],
              camPos: [camera.position.x, camera.position.y, camera.position.z],
              target: [controls.target.x, controls.target.y, controls.target.z],
            }),
          );
        } else {
          console.warn("[SPARK-DIAG] empty bounding box");
        }
      } catch (e) {
        logger.warn("Splat framing failed", { error: String(e) });
      }

      // 5. Initialize Geofencing for the demo asset
      if (loadedName.includes("Tropical Luxury Residence")) {
        triggersRef.current = [
          {
            id: "border-warning",
            position: new THREE.Vector3(0, 0, 0),
            radius: 25, // Meters from center
            text: "STOP! Walk no further! Beyond this border be dragons... or at least the edge of the world's latent space.",
            cooldown: 30000,
            lastTriggered: 0,
            isExit: true,
          },
          {
            id: "pool-description",
            position: new THREE.Vector3(5, -2, -4),
            radius: 3,
            text: "This infinity pool was generated with high-fidelity surface reflections using the marble-1.1-plus engine.",
            cooldown: 60000,
            lastTriggered: 0,
          },
        ];
      } else {
        triggersRef.current = [];
      }

      // Click listener for console/interaction
      const handleClick = (event: MouseEvent) => {
        if (!mountRef.current || !cameraRef.current || !sceneRef.current)
          return;

        const rect = mountRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          const intersected = intersects[0];
          if (intersected.object.userData?.type === "console") {
            handleConsoleButton(intersected.uv!);
          }
        }
      };
      renderer.domElement.addEventListener("click", handleClick);
    } catch (e) {
      logger.error("Spark load error", { error: e });
      setError(String(e));
      setStatus("error");
    }
  }

  // Moved to separate definitions for better scoping

  function handleLoadUrl() {
    if (urlInput.trim()) {
      const segments = urlInput.split("/");
      setLoadedName(segments[segments.length - 1] || "World");
      void loadWorld(urlInput.trim());
    }
  }

  function handleLoadUrlFromPreset(url: string, name: string) {
    setUrlInput(url);
    setLoadedName(name);
    setWorldName(name);
    void loadWorld(url);
  }

  function handleBrowseFile() {
    fileInputRef.current?.click();
  }

  function handleCopyLink() {
    const url = new URL(window.location.href);
    if (urlInput) url.searchParams.set("url", urlInput);
    if (loadedName) url.searchParams.set("name", loadedName);
    void navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function playNarration(text: string, x: number, y: number, z: number) {
    if (!spatialVoiceEnabled || !audioCtxRef.current || !pannerRef.current)
      return;

    try {
      // 1. Fetch audio from speech-mcp
      const speechUrl = `http://localhost:10918/api/v1/tts/wav?text=${encodeURIComponent(text)}&provider=gemini`;
      const response = await fetch(speechUrl);
      if (!response.ok) throw new Error("Speech fetching failed");

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await audioCtxRef.current.decodeAudioData(arrayBuffer);

      // 2. Position the panner
      pannerRef.current.positionX.value = x;
      pannerRef.current.positionY.value = y;
      pannerRef.current.positionZ.value = z;

      // 3. Play
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(pannerRef.current);
      source.start(0);

      // Handle Duration for Lock (approx 100 words/min = 600ms per word)
      const durationMs = text.split(" ").length * 600 + 1000;
      setTimeout(() => {
        isNarratingRef.current = false;
      }, durationMs);
    } catch (e) {
      logger.error("Narration playback error", { error: e });
      isNarratingRef.current = false;
    }
  }

  async function playFormattedNarration(
    text: string,
    x: number,
    y: number,
    z: number,
  ) {
    if (isNarratingRef.current) return;
    isNarratingRef.current = true;
    await playNarration(text, x, y, z);
  }

  // Narration & Multimodal Event Listener
  useEffect(() => {
    const es = new EventSource("/api/narration/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "speech") {
          void playNarration(data.text, data.x, data.y, data.z);
        } else if (data.type === "audio") {
          void handlePlayAudio(data);
        } else if (data.type === "video") {
          void handleSpatialVideo(data);
        } else if (data.type === "avatar") {
          void handleSpawnAvatar(data);
        } else if (data.type === "image") {
          void handlePlacePicture(data);
        } else if (data.type === "cinema") {
          void handlePlaceCinema(data);
        } else if (data.type === "console") {
          handleSpawnConsole(data);
        } else if (data.type === "portal") {
          handlePlacePortal(data);
        }
      } catch (err) {
        console.error("SSE data parse error:", err);
      }
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spatialVoiceEnabled]);

  async function handlePlayAudio(data: any) {
    if (!audioCtxRef.current) return;
    try {
      const resp = await fetch(data.url);
      const arrayBuffer = await resp.arrayBuffer();
      const audioBuffer =
        await audioCtxRef.current.decodeAudioData(arrayBuffer);

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = data.is_loop;

      const panner = audioCtxRef.current.createPanner();
      panner.panningModel = "HRTF";
      panner.positionX.value = data.x;
      panner.positionY.value = data.y;
      panner.positionZ.value = data.z;

      const gainNode = audioCtxRef.current.createGain();

      source.connect(panner);
      panner.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);

      source.start();
      bgAudioRef.current[data.id] = { source, gain: gainNode };

      // Store metadata for baking
      bgAudioRef.current[data.id].metadata = {
        id: data.id,
        url: data.url,
        type: "audio",
        x: data.x,
        y: data.y,
        z: data.z,
        is_loop: data.is_loop,
      } as any;
    } catch (err) {
      console.error("Failed to play spatial audio:", err);
    }
  }

  async function handleBakeScene() {
    if (!sceneRef.current || !worldId) return;

    const entities: any[] = [];

    // 1. Collect Avatars
    Object.entries(avatarsRef.current).forEach(([, model]) => {
      if (model.userData && model.userData.type === "avatar") {
        entities.push({
          type: "avatar",
          url: model.userData.url,
          x: model.position.x,
          y: model.position.y,
          z: model.position.z,
          rotation: model.rotation.y,
          scale: model.scale.x,
        });
      }
    });

    // 2. Collect Videos
    Object.entries(videoSurfacesRef.current).forEach(([, mesh]) => {
      if (mesh.userData && mesh.userData.type === "video") {
        entities.push({
          type: "video",
          url: mesh.userData.url,
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
          rotation: mesh.rotation.y,
          scale: mesh.scale.x,
        });
      }
    });

    // 3. Collect Audio
    Object.entries(bgAudioRef.current).forEach(([, entry]: any) => {
      if (entry.metadata) {
        entities.push(entry.metadata);
      }
    });

    const manifest = {
      id: worldId, // Group by world for simplicity
      name: `${worldName || "World"} - Bake ${new Date().toLocaleTimeString()}`,
      world_id: worldId,
      world_name: worldName || "Unknown World",
      timestamp: new Date().toISOString(),
      entities,
    };

    try {
      await fetch("http://localhost:10865/api/scenes/bake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });
      alert("Scene baked successfully to Hub!");
    } catch (err) {
      console.error("Baking failed:", err);
    }
  }

  async function handleRestoreScene() {
    if (!worldId) return;
    try {
      const resp = await fetch(
        `http://localhost:10865/api/scenes?world_id=${worldId}`,
      );
      const scenes = await resp.json();
      if (scenes.length === 0) {
        alert("No baked scenes found for this world.");
        return;
      }
      // Restore the most recent one
      const scene = scenes[0];
      scene.entities.forEach((entity: any) => {
        if (entity.type === "avatar") handleSpawnAvatar(entity);
        if (entity.type === "video") handleSpatialVideo(entity);
        if (entity.type === "audio") handlePlayAudio(entity);
      });
      alert(`Restored scene: ${scene.name}`);
    } catch (err) {
      console.error("Restoration failed:", err);
    }
  }

  async function handlePlacePicture(data: any) {
    if (!sceneRef.current) return;
    const loader = new THREE.TextureLoader();
    loader.load(data.url, (texture) => {
      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(aspect * data.scale, data.scale);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(data.x, data.y, data.z);
      mesh.rotation.y = data.rotation;
      mesh.userData = {
        id: data.id,
        url: data.url,
        type: "image",
        rotation: data.rotation,
        scale: data.scale,
      };

      sceneRef.current?.add(mesh);
      videoSurfacesRef.current[data.id] = mesh; // reuse group for collection
    });
  }

  async function fetchLocalAssets() {
    try {
      const resp = await fetch("http://localhost:10865/api/local-assets");
      const files = await resp.json();
      setLocalAssets(files);
    } catch (err) {
      console.error("Failed to fetch local assets:", err);
    }
  }

  async function handlePlaceCinema(data: any) {
    // Cinema scale is typically much larger (5.5m wide)
    await handleSpatialVideo({
      ...data,
      scale: 5.5,
      rotation: data.rotation || 0,
    });
  }

  async function handlePlexSearch() {
    if (!plexQuery) return;
    setIsSearchingPlex(true);
    try {
      const resp = await fetch(
        `http://localhost:10865/api/plex/search?q=${encodeURIComponent(plexQuery)}`,
      );
      const results = await resp.json();
      setPlexResults(results);
    } catch (err) {
      console.error("Plex search failed:", err);
    } finally {
      setIsSearchingPlex(false);
    }
  }

  async function handlePlexStream(movie: any) {
    try {
      const resp = await fetch(
        `http://localhost:10865/api/plex/stream_url?key=${encodeURIComponent(movie.key)}`,
      );
      const data = await resp.json();
      setToolboxPrompt(data.url);
      broadcastEvent("event");
    } catch (err) {
      console.error("Failed to get Plex stream URL:", err);
    }
  }

  async function fetchStats() {
    try {
      const resp = await fetch("http://localhost:10865/api/system/stats");
      const data = await resp.json();
      setSystemStats(data);
    } catch (_err) {
      /* silent */
    }
  }

  async function updateCacheSize() {
    const bytes = await getSplatCacheSize();
    setCacheSize(bytes);
    const items = await listCachedSplats();
    setCachedItems(items);
    const quota = await getStorageQuota();
    setQuotaInfo(quota);
  }

  async function handleClearCache() {
    await clearSplatCache();
    setCacheSize(0);
    setCachedItems([]);
  }

  async function handleHandoff(
    target: "blender" | "resonite" | "unity3d",
    type: "splat" | "mesh",
  ) {
    const key = `${target}-${type}`;
    setExportState((s) => ({ ...s, [key]: "loading" }));
    try {
      const assetUrl = urlInput;
      if (!assetUrl) throw new Error("No SPZ URL loaded");
      const res = await api.handoffAsset({
        world_id: worldId,
        target,
        asset_type: type,
        asset_url: assetUrl,
      });
      setExportState((s) => ({
        ...s,
        [key]: res.status === "ok" ? "ok" : "error",
      }));
    } catch {
      setExportState((s) => ({ ...s, [key]: "error" }));
    }
    setTimeout(() => setExportState((s) => ({ ...s, [key]: "idle" })), 3500);
  }

  async function handleDeleteCachedItem(key: string) {
    await deleteCachedSplat(key);
    await updateCacheSize();
  }

  async function handleOverteSpawn() {
    const key = "overte-spawn";
    setExportState((s) => ({ ...s, [key]: "loading" }));
    try {
      const res = await api.exportToOverte({
        world_id: worldId,
        world_name: worldName || "WorldLabs_World",
        spz_url: urlInput,
      });
      const ok = res.status === "ok" || res.status === "ok_simulated";
      setExportState((s) => ({ ...s, [key]: ok ? "ok" : "error" }));
    } catch {
      setExportState((s) => ({ ...s, [key]: "error" }));
    }
    setTimeout(() => setExportState((s) => ({ ...s, [key]: "idle" })), 3500);
  }

  function handleSpawnConsole(data: any) {
    if (!sceneRef.current || !consoleCanvasRef.current) return;

    // Remove existing if any
    if (consolePlaneRef.current)
      sceneRef.current.remove(consolePlaneRef.current);

    const tex = new THREE.CanvasTexture(consoleCanvasRef.current);
    consoleTextureRef.current = tex;

    const geometry = new THREE.PlaneGeometry(1.5, 1.5);
    const material = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(data.x, data.y + 0.5, data.z);
    mesh.rotation.y = data.rotation;
    mesh.userData = { type: "console", id: "scc_primary" };

    sceneRef.current.add(mesh);
    consolePlaneRef.current = mesh;
  }

  function updateConsoleCanvas() {
    const canvas = consoleCanvasRef.current;
    if (!canvas || !systemStats) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#060a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pulse effect on click
    const timeSinceClick = Date.now() - lastConsoleClick;
    if (timeSinceClick < 500) {
      const intensity = 1 - timeSinceClick / 500;
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.1})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Border & Grid
    ctx.strokeStyle = "#22d3ee50";
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, 944, 944);

    // Header
    ctx.fillStyle = "#22d3ee";
    ctx.font = "black 60px Inter, system-ui";
    ctx.fillText("SOVEREIGN COMMAND CONSOLE", 80, 140);

    // Stats
    ctx.font = "bold 36px monospace";
    ctx.fillStyle = "#4ade80";
    ctx.fillText(`CPU: ${systemStats.cpu_percent}%`, 80, 240);
    ctx.fillText(`MEM: ${systemStats.memory_percent}%`, 80, 290);
    ctx.fillText(`SSE: ${systemStats.active_sse_clients} Active`, 80, 340);

    // GPU Stats Refinement
    if (systemStats.gpu) {
      ctx.fillStyle = "#f472b6";
      ctx.fillText(`GPU (VRAM): ${systemStats.gpu.vram_percent}%`, 500, 240);
      ctx.fillText(
        `${systemStats.gpu.vram_used}/${systemStats.gpu.vram_total} MB`,
        500,
        290,
      );

      // Usage Bar
      ctx.strokeStyle = "#f472b640";
      ctx.strokeRect(500, 310, 400, 30);
      ctx.fillStyle = "#f472b690";
      ctx.fillRect(500, 310, (systemStats.gpu.vram_percent / 100) * 400, 30);
    }

    // Alert Overlay
    if (consoleAlert) {
      ctx.fillStyle = "#0a0f1e";
      ctx.fillRect(80, 400, 864, 80);
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 400, 864, 80);
      ctx.fillStyle = "#4ade80";
      ctx.font = "black 40px Inter";
      ctx.textAlign = "center";
      ctx.fillText(consoleAlert, 512, 455);
      ctx.textAlign = "left";
    }

    // Buttons
    const buttons = [
      { label: "BAKE SCENE", color: "#facc15", y: 520 },
      { label: "RESTORE", color: "#818cf8", y: 640 },
      { label: "VOID ENTITIES", color: "#f87171", y: 760 },
    ];

    buttons.forEach((btn) => {
      ctx.fillStyle = btn.color + "20";
      ctx.fillRect(80, btn.y, 864, 100);
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(80, btn.y, 864, 100);
      ctx.fillStyle = btn.color;
      ctx.font = "bold 36px monospace";
      ctx.fillText(btn.label, 420, btn.y + 65);
    });

    ctx.font = "italic 30px Inter";
    ctx.fillStyle = "#64748b";
    ctx.fillText("SPARK Engine", 80, 920);
  }

  function handleConsoleButton(uv: THREE.Vector2) {
    setLastConsoleClick(Date.now());
    // Simple mapping based on button Y positions
    const y = (1 - uv.y) * 1024; // Convert UV to canvas pixels
    if (y > 500 && y < 600) {
      void handleBakeScene();
      setConsoleAlert("SCENE BAKED TO HUB");
    } else if (y > 620 && y < 720) {
      void handleRestoreScene();
      setConsoleAlert("SCENE RESTORED");
    } else if (y > 740 && y < 840) {
      // Void entities
      Object.values(videoSurfacesRef.current).forEach((m) => {
        sceneRef.current?.remove(m);
      });
      Object.values(avatarsRef.current).forEach((m) => {
        sceneRef.current?.remove(m);
      });
      videoSurfacesRef.current = {};
      avatarsRef.current = {};
      setConsoleAlert("ENTITIES VOIDED");
    }
    setTimeout(() => setConsoleAlert(null), 3000);
  }

  function handlePlacePortal(data: any) {
    if (!sceneRef.current) return;

    // Refinement: Ripple Shader Material
    const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    const fragmentShader = `
            uniform float time;
            varying vec2 vUv;
            void main() {
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(vUv, center);
                float ripple = sin(dist * 20.0 - time * 5.0) * 0.5 + 0.5;
                gl_FragColor = vec4(0.5, 0.6, 1.0, ripple * 0.3);
            }
        `;

    const geometry = new THREE.CircleGeometry(1.2, 64);
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Frame
    const frameGeom = new THREE.TorusGeometry(1.2, 0.05, 16, 100);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
    const frame = new THREE.Mesh(frameGeom, frameMat);

    const ripple = new THREE.Mesh(geometry, shaderMaterial);
    const group = new THREE.Group();
    group.add(frame);
    group.add(ripple);

    group.position.set(data.x, data.y + 1.2, data.z);
    group.rotation.y = data.rotation;
    group.userData = {
      type: "portal",
      target_world_url: data.target_world_url,
    };

    // Add ripple animation to the scene loop would be ideal, but for now we rely on needsUpdate
    (ripple as any).onBeforeRender = () => {
      shaderMaterial.uniforms.time.value = performance.now() / 1000;
    };

    sceneRef.current.add(group);
    videoSurfacesRef.current[data.id] = group as any;
  }

  async function handlePortalAction(url: string) {
    setIsTransitioning(true);
    setTimeout(() => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("url", url);
      window.location.href = nextUrl.toString();
    }, 800);
  }

  async function handleSpatialVideo(data: any) {
    if (!sceneRef.current) return;
    try {
      const video = document.createElement("video");
      video.src = data.url;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true; // Auto-play requirement
      void video.play();

      const texture = new THREE.VideoTexture(video);
      const geometry = new THREE.PlaneGeometry(16 * data.scale, 9 * data.scale);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(data.x, data.y, data.z);
      mesh.rotation.y = data.rotation;
      mesh.scale.set(data.scale, data.scale, 1);
      mesh.userData = {
        id: data.id,
        url: data.url,
        type: "video",
        rotation: data.rotation,
        scale: data.scale,
      };

      sceneRef.current?.add(mesh);
      videoSurfacesRef.current[data.id] = mesh;
    } catch (e) {
      console.error("Video load fail:", e);
    }
  }

  async function handleSpawnAvatar(data: any) {
    if (!sceneRef.current) return;
    const loader = new GLTFLoader();
    // Placeholder avatar or dynamic URL
    const url =
      data.url === "default_agent"
        ? "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF/RiggedFigure.gltf"
        : data.url;

    loader.load(url, (gltf) => {
      // Use worldSessionIdRef for persistent session tracking across SSE/independent handlers
      const model = gltf.scene;
      model.scale.set(data.scale || 1, data.scale || 1, data.scale || 1);
      model.position.set(data.x, data.y, data.z);
      model.rotation.y = data.rotation;

      // Basic Grounding
      if (splatRef.current && sceneRef.current) {
        const raycaster = new THREE.Raycaster(
          new THREE.Vector3(data.x, data.y + 5, data.z),
          new THREE.Vector3(0, -1, 0),
        );
        const intersects = raycaster.intersectObject(sceneRef.current, true);
        if (intersects.length > 0) {
          model.position.y = intersects[0].point.y;
        }
      }

      model.userData = {
        id: data.id,
        url: data.url,
        type: "avatar",
        rotation: data.rotation,
        scale: data.scale,
      };

      if (sceneRef.current) {
        sceneRef.current.add(model);
        avatarsRef.current[data.id] = model;

        // ---- New: Animation Mixer Integration ----
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          // Play the first animation clip (usually 'Walk' or 'Idle')
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          logger.debug(
            `Initialized animation mixer for agent ${data.id} (${gltf.animations.length} clips)`,
          );
        }
      }
    });
  }

  useEffect(() => {
    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect =
          mountRef.current.clientWidth / mountRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(
          mountRef.current.clientWidth,
          mountRef.current.clientHeight,
        );
      }
    };
    window.addEventListener("resize", handleResize);

    // Global Unhandled Rejection Sniffer
    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.error("Unhandled Rejection Sniffed", {
        reason: String(event.reason),
        stack: event.reason?.stack,
      });
    };
    window.addEventListener("unhandledrejection", handleRejection);

    // Keyboard movement listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Fetch local assets for the import tab
    void fetchLocalAssets();

    // Setup Console Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    consoleCanvasRef.current = canvas;

    const statsInterval = setInterval(() => {
      void fetchStats();
    }, 2000);

    return () => {
      clearInterval(statsInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cleanup();
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        logger.error("Error attempting to enable fullscreen", {
          error: err,
        });
      });
    } else {
      document.exitFullscreen();
    }
  };

  const resetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (homePoseRef.current) {
      cameraRef.current.position.copy(homePoseRef.current.pos);
      controlsRef.current.target.copy(homePoseRef.current.target);
    } else {
      cameraRef.current.position.set(0, 1.6, 4);
      controlsRef.current.target.set(0, 1.6, 0);
    }
    controlsRef.current.update();
  }, []);

  // Track browser fullscreen state and resize renderer
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Force resize after a frame so layout has settled
      requestAnimationFrame(() => {
        if (mountRef.current && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect =
            mountRef.current.clientWidth / mountRef.current.clientHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight,
          );
        }
      });
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleFileOpen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLoadedName(file.name);
    void loadWorld(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLoadedName(file.name);
      void loadWorld(url);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4 page-enter">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Globe2
            className="w-5 h-5 text-cosmos-400 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {loadedName || "Spark 2.0 Viewer"}
            </h2>
            {caption && (
              <p className="text-xs text-slate-300 truncate leading-relaxed">
                {caption}
              </p>
            )}
          </div>
        </div>

        {/* Spatial Voice Toggle */}
        <button
          onClick={() => {
            const next = !spatialVoiceEnabled;
            setSpatialVoiceEnabled(next);
            if (next) void initSpatialAudio();
            if (next && audioCtxRef.current?.state === "suspended") {
              void audioCtxRef.current.resume();
            }
          }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium",
            spatialVoiceEnabled
              ? "bg-aurora-500/20 border-aurora-500/50 text-aurora-400 shadow-[0_0_15px_-3px_rgba(74,222,128,0.3)]"
              : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-slate-300",
          )}
        >
          <Volume2
            className={cn(
              "w-3.5 h-3.5",
              spatialVoiceEnabled && "animate-pulse",
            )}
          />
          Spatial Voice Agent {spatialVoiceEnabled ? "Active" : "Disabled"}
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-3 flex flex-wrap items-center gap-2 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept=".rad,.spz,.ply,.ksplat"
          onChange={handleFileOpen}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Browse Local…
        </button>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
            placeholder="Paste .rad / .spz URL or select from local history…"
            className="input-glass text-xs py-1.5 flex-1 min-w-0"
          />
          <button
            onClick={handleLoadUrl}
            disabled={!urlInput.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cosmos-600/40 hover:bg-cosmos-600/60 border border-cosmos-500/30 text-xs text-cosmos-300 disabled:opacity-40 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Initialize
          </button>
        </div>

        <button
          onClick={handleCopyLink}
          disabled={!urlInput}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 transition-all shadow-lg"
          title="Copy viewer link"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-aurora-400" />
          ) : (
            <Link className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Resolution selector */}
        {Object.keys(availableUrls).length > 0 && (
          <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
            {(["full", "500k", "100k"] as const).map((key) => {
              if (!availableUrls[key]) return null;
              const label = key === "full" ? "Full" : key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedRes(key);
                    const newUrl = availableUrls[key];
                    if (newUrl) loadWorld(newUrl);
                  }}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold transition-all",
                    selectedRes === key
                      ? "bg-cosmos-600/40 text-cosmos-300 shadow-sm"
                      : "text-slate-300 hover:text-slate-300",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Cache management */}
        {cacheSize > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowCachePanel(!showCachePanel);
                if (!showCachePanel) void updateCacheSize();
              }}
              title={`Cached splats: ${(cacheSize / 1_000_000).toFixed(1)}MB`}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              Cache {(cacheSize / 1_000_000).toFixed(1)}MB
            </button>
            {showCachePanel && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCachePanel(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 glass-card p-4 z-50 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-cosmos-300">
                      Cache
                    </h3>
                    <button
                      onClick={() => setShowCachePanel(false)}
                      className="text-slate-300 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300 mb-3">
                    <div className="flex justify-between">
                      <span>IndexedDB</span>
                      <span className="text-slate-300">
                        {(cacheSize / 1_000_000).toFixed(1)}MB
                      </span>
                    </div>
                    {quotaInfo.quota > 0 && (
                      <div className="flex justify-between">
                        <span title="Total browser IndexedDB storage used across all sites">
                          Storage
                        </span>
                        <span className="text-slate-300">
                          {(quotaInfo.usage / 1_000_000).toFixed(0)}MB /{" "}
                          {(quotaInfo.quota / 1_000_000_000).toFixed(1)}GB
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Items</span>
                      <span className="text-slate-300">
                        {cachedItems.length}
                      </span>
                    </div>
                    {quotaInfo.quota > 0 && (
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cosmos-500/60 rounded-full transition-all"
                          style={{
                            width: `${Math.min((quotaInfo.usage / quotaInfo.quota) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {cachedItems.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      <p className="text-xs uppercase font-black text-slate-300 tracking-wider mb-1">
                        Cached files
                      </p>
                      {cachedItems.map((item) => {
                        const label =
                          item.key.split("/").pop() || item.key.slice(0, 30);
                        const age = Math.round(
                          (Date.now() - item.timestamp) / 60000,
                        );
                        const ageStr =
                          age < 60
                            ? `${age}m ago`
                            : `${Math.round(age / 60)}h ago`;
                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all group"
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-xs text-slate-300 truncate"
                                title={item.key}
                              >
                                {label}
                              </p>
                              <p className="text-xs text-slate-300">
                                {(item.size / 1_000_000).toFixed(1)}MB ·{" "}
                                {ageStr}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteCachedItem(item.key)}
                              className="shrink-0 p-1 rounded text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from cache"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={handleClearCache}
                    className="w-full mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                  >
                    Clear All Cache
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Home / reset view */}
        <button
          onClick={resetView}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white transition-all"
          title="Reset view (home)"
          data-testid="spark-home"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white transition-all"
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          data-testid="spark-fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={() => setShowToolbox(!showToolbox)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
            showToolbox
              ? "bg-cosmos-500/20 border-cosmos-500/50 text-cosmos-300"
              : "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-slate-300",
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Spatial Toolbox
        </button>

        {status === "loading" && (
          <span className="badge-pending animate-pulse">Streaming LoD…</span>
        )}
        {status === "ready" && (
          <span className="badge-success">Spark 2.0 Engine Live</span>
        )}
        {status === "error" && (
          <span className="badge-error">Engine Fault</span>
        )}
      </div>

      {/* Formats note */}
      <div className="flex items-center justify-between text-xs text-slate-300 flex-shrink-0 px-1">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          Spark 2.0 (Rust/WASM) Renderer • 100M+ Splat Budget
        </div>
        <div className="flex gap-3">
          <span>Performance: Ultra</span>
          <span>
            Format:{" "}
            {urlInput.endsWith(".rad") ? "Progressive (.RAD)" : "Splat (.SPZ)"}
          </span>
        </div>
      </div>

      {/* Render Canvas */}
      <div
        className={cn(
          "relative flex-1 min-h-0 rounded-xl overflow-hidden border border-white/[0.06] bg-black transition-all duration-300 shadow-2xl group cursor-crosshair",
          isFullscreen && "fixed inset-0 z-50 m-0 rounded-none border-0",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div ref={mountRef} className="absolute inset-0" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

        {/* Idle / Landing State */}
        {status === "idle" && (
          <ManifestHub
            onLoad={handleLoadUrlFromPreset}
            onBrowse={handleBrowseFile}
          />
        )}

        {/* Loading Overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-cosmos-500/30 border-t-cosmos-400 rounded-full animate-spin" />
              <p className="text-sm text-slate-300 font-medium">
                {loadingMsg || "Loading..."}
              </p>
              <p className="text-xs text-slate-300">
                {caption || loadedName || ""}
              </p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {status === "error" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="glass-card p-6 max-w-md text-center space-y-4 animate-in zoom-in-95 duration-300">
              <XCircle className="w-10 h-10 text-red-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">Engine Fault</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {error || "Unknown error"}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setStatus("idle");
                    setError("");
                    cleanup();
                  }}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-slate-300 hover:bg-white/[0.1] transition-all"
                >
                  Back to Hub
                </button>
                <button
                  onClick={() => loadWorld(urlInput)}
                  className="px-4 py-2 rounded-lg bg-cosmos-600/40 border border-cosmos-500/30 text-xs text-cosmos-300 hover:bg-cosmos-600/60 transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spatial Toolbox Panel */}
        {showToolbox && (
          <div className="absolute top-4 right-4 w-72 glass-card p-4 z-40 shadow-2xl animate-in slide-in-from-right-4 duration-300 border-cosmos-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-cosmos-300 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Spatial Command
              </h3>
              <button
                onClick={() => setShowToolbox(false)}
                className="text-slate-300 hover:text-white"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mb-4">
              {(
                ["studio", "gallery", "import", "plex", "handoff"] as const
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setToolboxTab(t)}
                  className={cn(
                    "flex-1 text-xs font-black uppercase tracking-tighter py-1.5 rounded-lg transition-all",
                    toolboxTab === t
                      ? "bg-cosmos-500/20 text-cosmos-300 border border-cosmos-500/20"
                      : "text-slate-300 font-bold",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {toolboxTab === "studio" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                    Direct Narration / Asset URL
                  </label>
                  <textarea
                    value={toolboxPrompt}
                    onChange={(e) => setToolboxPrompt(e.target.value)}
                    placeholder="Enter prompt or URL..."
                    className="input-glass text-xs py-2 w-full min-h-[60px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => broadcastEvent("speech")}
                    disabled={!toolboxPrompt || isBroadcasting}
                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-aurora-500/10 hover:border-aurora-500/30 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Narrate
                  </button>
                  <button
                    onClick={() => broadcastEvent("audio")}
                    disabled={!toolboxPrompt || isBroadcasting}
                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-magenta-500/10 hover:border-magenta-500/30 transition-all"
                  >
                    <Music className="w-3.5 h-3.5" />
                    Audio
                  </button>
                  <button
                    onClick={() => broadcastEvent("avatar")}
                    disabled={!toolboxPrompt || isBroadcasting}
                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-cosmos-500/10 hover:border-cosmos-500/30 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Spawn Agent
                  </button>
                  <button
                    onClick={() => broadcastEvent("video")}
                    disabled={!toolboxPrompt || isBroadcasting}
                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Spawn Video
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBakeScene}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-void-600/30 text-void-300 border border-void-500/30 hover:bg-void-600/50 transition-all group"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Bake
                  </button>
                  <button
                    onClick={handleRestoreScene}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cosmos-600/30 text-cosmos-300 border border-cosmos-500/30 hover:bg-cosmos-600/50 transition-all group"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                </div>
              </div>
            )}

            {toolboxTab === "gallery" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[300px] overflow-y-auto pr-1">
                {PORTAL_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      const cam = cameraRef.current;
                      if (!cam) return;
                      const data = {
                        type: "portal",
                        url: p.url,
                        x: cam.position.x,
                        y: cam.position.y,
                        z: cam.position.z,
                      };
                      void api.broadcastNarration(data as any);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cosmos-500/50 text-xs font-bold text-slate-300 transition-all"
                  >
                    {p.name}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {toolboxTab === "import" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[300px] overflow-y-auto pr-1">
                {localAssets.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setToolboxPrompt(
                        `http://localhost:10865/api/local-assets/${f}`,
                      );
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/5 truncate text-xs text-slate-300 font-bold"
                  >
                    {f}
                  </button>
                ))}
                <button
                  onClick={fetchLocalAssets}
                  className="w-full text-xs font-black text-slate-300 uppercase mt-2"
                >
                  Refresh
                </button>
              </div>
            )}

            {toolboxTab === "plex" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  value={plexQuery}
                  onChange={(e) => setPlexQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePlexSearch()}
                  className="input-glass w-full text-xs"
                  placeholder="Search Plex..."
                />
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {plexResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handlePlexStream(m)}
                      className="w-full flex gap-2 p-1.5 rounded-lg hover:bg-orange-500/10 truncate font-bold text-slate-300 text-xs"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {toolboxTab === "handoff" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  DCC Export — sends the loaded SPZ to your DCC tool via the
                  bridge.
                </div>
                {[
                  {
                    target: "blender" as const,
                    label: "Blender",
                    port: "10700",
                  },
                  {
                    target: "resonite" as const,
                    label: "Resonite",
                    port: "10715",
                  },
                  { target: "unity3d" as const, label: "Unity", port: "10730" },
                ].map(({ target, label, port }) => (
                  <div key={target} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        {label}
                      </span>
                      <span className="text-xs text-slate-300">:{port}</span>
                    </div>
                    <div className="flex gap-2">
                      {(["splat", "mesh"] as const).map((type) => {
                        const key = `${target}-${type}`;
                        const state = exportState[key] ?? "idle";
                        return (
                          <button
                            key={key}
                            disabled={state === "loading"}
                            onClick={() => handleHandoff(target, type)}
                            className={cn(
                              "flex-1 px-2 py-1.5 rounded-lg text-xs font-bold border transition-all",
                              state === "loading" &&
                                "bg-amber-500/20 border-amber-500/30 text-amber-300",
                              state === "ok" &&
                                "bg-aurora-500/20 border-aurora-500/30 text-aurora-400",
                              state === "error" &&
                                "bg-red-500/20 border-red-500/30 text-red-400",
                              state === "idle" &&
                                "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-slate-200",
                            )}
                          >
                            {state === "loading"
                              ? "..."
                              : type === "splat"
                                ? "SPZ"
                                : "GLB"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Step into Overte - spawns mesh + viewer panel in a domain */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Overte (step in)
                    </span>
                    <span className="text-xs text-slate-300">:11110</span>
                  </div>
                  {(() => {
                    const state = exportState["overte-spawn"] ?? "idle";
                    return (
                      <button
                        disabled={state === "loading"}
                        onClick={handleOverteSpawn}
                        className={cn(
                          "w-full px-2 py-1.5 rounded-lg text-xs font-bold border transition-all",
                          state === "loading" &&
                            "bg-amber-500/20 border-amber-500/30 text-amber-300",
                          state === "ok" &&
                            "bg-aurora-500/20 border-aurora-500/30 text-aurora-400",
                          state === "error" &&
                            "bg-red-500/20 border-red-500/30 text-red-400",
                          state === "idle" &&
                            "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-slate-200",
                        )}
                      >
                        {state === "loading"
                          ? "Spawning..."
                          : "Spawn world in domain"}
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Local Intelligence Overlay */}
        <div className="absolute bottom-4 left-4 pointer-events-none p-4 z-30">
          <div className="glass-card px-3 py-1.5 text-xs text-cosmos-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-aurora-500 animate-pulse" />
            Sovereign Environment Active • Spark 2.0 Engine
          </div>
        </div>

        {/* Controls HUD */}
        <div className="absolute bottom-4 right-4 pointer-events-none z-30">
          <div className="glass-card px-2.5 py-1.5 text-[10px] text-slate-300 space-y-0.5 leading-relaxed">
            <div>L-Drag: Orbit</div>
            <div>R-Drag: Pan</div>
            <div>Scroll: Zoom</div>
            <div className="border-t border-white/[0.06] pt-0.5 mt-0.5">
              WASD: Move
            </div>
            <div>Q/E: Up/Down</div>
          </div>
        </div>

        {isTransitioning && (
          <div className="absolute inset-0 bg-void-950 z-50 animate-in fade-in duration-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-sm font-black uppercase tracking-wide text-indigo-300 animate-pulse">
                Re-Manifesting World Latent Space
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
