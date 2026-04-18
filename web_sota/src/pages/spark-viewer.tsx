import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import {
    AlertCircle,
    Check,
    ChevronRight,
    FolderOpen,
    Globe2,
    Info,
    Link,
    Maximize2,
    Minimize2,
    Monitor,
    Music,
    Settings2,
    UserPlus,
    Volume2,
    Wand2,
    Zap, 
    ArrowLeft, 
    Trash2, 
    Play, 
    Video, 
    User, 
    Save, 
    RotateCcw,
    FileCode,
    ImageIcon,
    FolderPlus,
    LayoutGrid,
    Search
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface ProximityTrigger {
    id: string;
    position: THREE.Vector3;
    radius: number;
    text: string;
    cooldown: number;
    lastTriggered: number;
    isExit?: boolean; // If true, triggers when MOVING AWAY from origin beyond radius
}

export function SparkViewer() {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sparkRef = useRef<SparkRenderer | null>(null);
    const splatRef = useRef<SplatMesh | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Spatial Audio Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const pannerRef = useRef<PannerNode | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const clockRef = useRef<THREE.Clock>(new THREE.Clock());

    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [error, setError] = useState('');
    const [loadedName, setLoadedName] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [spatialVoiceEnabled, setSpatialVoiceEnabled] = useState(false);
    const [showToolbox, setShowToolbox] = useState(false);
    const [toolboxPrompt, setToolboxPrompt] = useState('');
    const [toolboxAssetUrl, setToolboxAssetUrl] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [worldId, setWorldId] = useState<string>('default-world');
    const [worldName, setWorldName] = useState<string>('');
    const [toolboxTab, setToolboxTab] = useState<'studio' | 'gallery' | 'import'>('studio');
    const [localAssets, setLocalAssets] = useState<string[]>([]);

    // Geofencing Refs
    const triggersRef = useRef<ProximityTrigger[]>([]);
    const isNarratingRef = useRef(false);

    // Multimodal Refs
    const bgAudioRef = useRef<{ [id: string]: { source: AudioBufferSourceNode, gain: GainNode, metadata?: any } }>({});
    const videoSurfacesRef = useRef<{ [id: string]: THREE.Mesh }>({});
    const avatarsRef = useRef<{ [id: string]: THREE.Group }>({});
    const mixersRef = useRef<{ [id: string]: THREE.AnimationMixer }>({});

    // Pull ?url=... & ?name=... from the query string
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const url = params.get('url');
        const name = params.get('name') ?? '';
        if (url) {
            setUrlInput(url);
            setLoadedName(name);
            setWorldName(name);
            void loadWorld(url);
        } else {
            // Check for default local asset for development
            const defaultAsset = "Modern Tropical Luxury Residence.spz";
            const localUrl = `/api/local-assets/${defaultAsset}`;
            setUrlInput(localUrl);
            setLoadedName(defaultAsset);
            setWorldName(defaultAsset);
            void loadWorld(localUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function cleanup() {
        if (rendererRef.current) {
            rendererRef.current.dispose();
            rendererRef.current.setAnimationLoop(null);
        }
        if (sparkRef.current) {
            sparkRef.current.dispose();
        }
        if (splatRef.current) {
            splatRef.current.dispose();
        }
        Object.values(mixersRef.current).forEach(m => m.stopAllAction());
        mixersRef.current = {};
        if (mountRef.current) {
            mountRef.current.innerHTML = '';
        }
        if (audioCtxRef.current) {
            void audioCtxRef.current.close();
        }
    }

    function initSpatialAudio() {
        if (!audioCtxRef.current) {
            const ctx = new AudioContext();
            const panner = ctx.createPanner();
            
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 10000;
            panner.rolloffFactor = 1;
            panner.coneInnerAngle = 360;
            panner.coneOuterAngle = 0;
            panner.coneOuterGain = 0;
            
            panner.connect(ctx.destination);
            
            audioCtxRef.current = ctx;
            pannerRef.current = panner;
            
            console.log('Spatial Audio Engine Initialized');
        }
    }

    async function broadcastEvent(type: 'speech' | 'audio' | 'video' | 'avatar') {
        if (!cameraRef.current) return;
        setIsBroadcasting(true);
        try {
            const pos = cameraRef.current.position;
            const res = await api.broadcastNarration({
                type,
                text: type === 'speech' ? toolboxPrompt : undefined,
                url: type !== 'speech' ? (toolboxAssetUrl || toolboxPrompt) : undefined,
                x: pos.x,
                y: pos.y,
                z: pos.z,
                is_loop: true
            });
            console.log('Broadcast Success:', res);
        } catch (e) {
            console.error('Broadcast Error:', e);
        } finally {
            setIsBroadcasting(false);
            setToolboxPrompt('');
            setToolboxAssetUrl('');
        }
    }

    async function loadWorld(url: string) {
        if (!mountRef.current) return;
        setStatus('loading');
        setError('');

        cleanup();

        try {
            // 1. Setup Three.js
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
            camera.position.set(-1, -4, 6);
            camera.lookAt(0, 4, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            mountRef.current.appendChild(renderer.domElement);

            // 2. Setup Spark 2.0
            const spark = new SparkRenderer({ renderer });
            scene.add(spark);

            // 3. Load Splat (.spz or .rad)
            // Use the proxy for remote assets or direct for local
            const finalUrl = url.startsWith('http') ? `/api/handoff?url=${encodeURIComponent(url)}` : url;
            
            const splat = new SplatMesh({ 
                url: finalUrl,
                progressive: url.endsWith('.rad'),
                onProgress: (p) => console.log('Spark Loading:', (p * 100).toFixed(0) + '%')
            });
            scene.add(splat);

            // 4. Render Loop
            renderer.setAnimationLoop(() => {
                const delta = clockRef.current.getDelta();
                spark.update(camera); // Update Spark LoD tree based on camera
                
                // Update Avatar Animations
                Object.values(mixersRef.current).forEach(m => m.update(delta));
                
                // Update Audio Listener to match Camera
                if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
                    const listener = audioCtxRef.current.listener;
                    const pos = camera.position;
                    const up = camera.up;
                    const target = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                    
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
                        listener.setOrientation(target.x, target.y, target.z, up.x, up.y, up.z);
                    }
                }
                
                // Update Geofencing Triggers
                if (spatialVoiceEnabled && !isNarratingRef.current) {
                    const now = Date.now();
                    const camPos = camera.position;
                    
                    for (const t of triggersRef.current) {
                        const dist = camPos.distanceTo(t.position);
                        const isTriggered = t.isExit ? (dist > t.radius) : (dist < t.radius);
                        
                        if (isTriggered && (now - t.lastTriggered > t.cooldown)) {
                            t.lastTriggered = now;
                            void playFormattedNarration(t.text, t.position.x, t.position.y, t.position.z);
                            break; // Only one trigger at a time
                        }
                    }
                }
                
                renderer.render(scene, camera);
            });

            // References
            sceneRef.current = scene;
            cameraRef.current = camera;
            rendererRef.current = renderer;
            sparkRef.current = spark;
            splatRef.current = splat;

            setStatus('ready');

            // 5. Initialize Geofencing for the demo asset
            if (loadedName.includes('Tropical Luxury Residence')) {
                triggersRef.current = [
                    {
                        id: 'border-warning',
                        position: new THREE.Vector3(0, 0, 0),
                        radius: 25, // Meters from center
                        text: "STOP! Walk no further! Beyond this border be dragons... or at least the edge of the world's latent space.",
                        cooldown: 30000,
                        lastTriggered: 0,
                        isExit: true
                    },
                    {
                        id: 'pool-description',
                        position: new THREE.Vector3(5, -2, -4),
                        radius: 3,
                        text: "This infinity pool was generated with high-fidelity surface reflections using the marble-1.1-plus engine.",
                        cooldown: 60000,
                        lastTriggered: 0
                    }
                ];
            } else {
                triggersRef.current = [];
            }
        } catch (e) {
            console.error('Spark load error:', e);
            setError(String(e));
            setStatus('error');
        }
    }

    function handleFileOpen(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoadedName(file.name);
        // Direct file loading via blob URL (supported by Spark 2.0)
        const objectUrl = URL.createObjectURL(file);
        setUrlInput(objectUrl);
        void loadWorld(objectUrl);
    }

    function handleLoadUrl() {
        if (urlInput.trim()) {
            const segments = urlInput.split('/');
            setLoadedName(segments[segments.length - 1] || 'World');
            void loadWorld(urlInput.trim());
        }
    }

    function handleCopyLink() {
        const url = new URL(window.location.href);
        if (urlInput) url.searchParams.set('url', urlInput);
        if (loadedName) url.searchParams.set('name', loadedName);
        void navigator.clipboard.writeText(url.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function playNarration(text: string, x: number, y: number, z: number) {
        if (!spatialVoiceEnabled || !audioCtxRef.current || !pannerRef.current) return;
        
        try {
            // 1. Fetch audio from speech-mcp
            const speechUrl = `http://localhost:10918/api/v1/tts/wav?text=${encodeURIComponent(text)}&provider=gemini`;
            const response = await fetch(speechUrl);
            if (!response.ok) throw new Error('Speech fetching failed');
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            
            // 2. Position the panner
            pannerRef.current.positionX.value = x;
            pannerRef.current.positionY.value = y;
            pannerRef.current.positionZ.value = z;
            
            // 3. Play
            const source = audioCtxRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(pannerRef.current);
            source.start(0);
            
            console.log(`Playing spatial narration at [${x}, ${y}, ${z}]: "${text}"`);

            // Handle Duration for Lock (approx 100 words/min = 600ms per word)
            const durationMs = (text.split(' ').length * 600) + 1000;
            setTimeout(() => { isNarratingRef.current = false; }, durationMs);

        } catch (e) {
            console.error('Narration playback error:', e);
            isNarratingRef.current = false;
        }
    }

    async function playFormattedNarration(text: string, x: number, y: number, z: number) {
        if (isNarratingRef.current) return;
        isNarratingRef.current = true;
        await playNarration(text, x, y, z);
    }

    // Narration & Multimodal Event Listener
    useEffect(() => {
        const es = new EventSource('/api/narration/stream');
        es.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                
                if (data.type === 'speech') {
                    void playNarration(data.text, data.x, data.y, data.z);
                } else if (data.type === 'audio') {
                    void handlePlayAudio(data);
                } else if (data.type === 'video') {
                    void handleSpatialVideo(data);
                } else if (data.type === 'avatar') {
                    void handleSpawnAvatar(data);
                } else if (data.type === 'image') {
                    void handlePlacePicture(data);
                }
            } catch (err) {
                console.error('SSE data parse error:', err);
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
            const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            
            const source = audioCtxRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = data.is_loop;
            
            const panner = audioCtxRef.current.createPanner();
            panner.panningModel = 'HRTF';
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
                type: 'audio',
                x: data.x,
                y: data.y,
                z: data.z,
                is_loop: data.is_loop
            } as any;

        } catch (err) {
            console.error('Failed to play spatial audio:', err);
        }
    }

    async function handleBakeScene() {
        if (!sceneRef.current || !worldId) return;
        
        const entities: any[] = [];
        
        // 1. Collect Avatars
        Object.entries(avatarsRef.current).forEach(([id, model]) => {
            if (model.userData && model.userData.type === 'avatar') {
                entities.push({
                    id,
                    type: 'avatar',
                    url: model.userData.url,
                    x: model.position.x,
                    y: model.position.y,
                    z: model.position.z,
                    rotation: model.rotation.y,
                    scale: model.scale.x
                });
            }
        });

        // 2. Collect Videos
        Object.entries(videoSurfacesRef.current).forEach(([id, mesh]) => {
            if (mesh.userData && mesh.userData.type === 'video') {
                entities.push({
                    id,
                    type: 'video',
                    url: mesh.userData.url,
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z,
                    rotation: mesh.rotation.y,
                    scale: mesh.scale.x
                });
            }
        });

        // 3. Collect Audio
        Object.entries(bgAudioRef.current).forEach(([id, entry]: any) => {
            if (entry.metadata) {
                entities.push(entry.metadata);
            }
        });

        const manifest = {
            id: worldId, // Group by world for simplicity
            name: `${worldName || 'World'} - Bake ${new Date().toLocaleTimeString()}`,
            world_id: worldId,
            world_name: worldName || 'Unknown World',
            timestamp: new Date().toISOString(),
            entities
        };

        try {
            await fetch('http://localhost:10865/api/scenes/bake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manifest)
            });
            alert('Scene baked successfully to Hub!');
        } catch (err) {
            console.error('Baking failed:', err);
        }
    }

    async function handleRestoreScene() {
        if (!worldId) return;
        try {
            const resp = await fetch(`http://localhost:10865/api/scenes?world_id=${worldId}`);
            const scenes = await resp.json();
            if (scenes.length === 0) {
                alert('No baked scenes found for this world.');
                return;
            }
            // Restore the most recent one
            const scene = scenes[0];
            scene.entities.forEach((entity: any) => {
                if (entity.type === 'avatar') handleSpawnAvatar(entity);
                if (entity.type === 'video') handleSpatialVideo(entity);
                if (entity.type === 'audio') handlePlayAudio(entity);
            });
            alert(`Restored scene: ${scene.name}`);
        } catch (err) {
            console.error('Restoration failed:', err);
        }
    }

    async function handlePlacePicture(data: any) {
        if (!sceneRef.current) return;
        const loader = new THREE.TextureLoader();
        loader.load(data.url, (texture) => {
            const aspect = texture.image.width / texture.image.height;
            const geometry = new THREE.PlaneGeometry(aspect * data.scale, data.scale);
            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(data.x, data.y, data.z);
            mesh.rotation.y = data.rotation;
            mesh.userData = { 
                id: data.id, 
                url: data.url, 
                type: 'image',
                rotation: data.rotation,
                scale: data.scale
            };
            
            sceneRef.current?.add(mesh);
            videoSurfacesRef.current[data.id] = mesh; // reuse group for collection
        });
    }

    async function fetchLocalAssets() {
        try {
            const resp = await fetch('http://localhost:10865/api/local-assets');
            const files = await resp.json();
            setLocalAssets(files);
        } catch (err) {
            console.error('Failed to fetch local assets:', err);
        }
    }

    async function handleSpatialVideo(data: any) {
        if (!sceneRef.current) return;
        try {
            const video = document.createElement('video');
            video.src = data.url;
            video.crossOrigin = 'anonymous';
            video.loop = true;
            video.muted = true; // Auto-play requirement
            void video.play();

            const texture = new THREE.VideoTexture(video);
            const geometry = new THREE.PlaneGeometry(16 * data.scale, 9 * data.scale);
            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(data.x, data.y, data.z);
            mesh.rotation.y = data.rotation;
            mesh.scale.set(data.scale, data.scale, 1);
            mesh.userData = { 
                id: data.id, 
                url: data.url, 
                type: 'video',
                rotation: data.rotation,
                scale: data.scale
            };

            sceneRef.current?.add(mesh);
            videoSurfacesRef.current[data.id] = mesh;
        } catch (e) { console.error('Video load fail:', e); }
    }

    async function handleSpawnAvatar(data: any) {
        if (!sceneRef.current) return;
        const loader = new GLTFLoader();
        // Placeholder avatar or dynamic URL
        const url = data.url === 'default_agent' ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF/RiggedFigure.gltf' : data.url;
        
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.scale.set(data.scale || 1, data.scale || 1, data.scale || 1);
            model.position.set(data.x, data.y, data.z);
            model.rotation.y = data.rotation;
            
            // Basic Grounding
            if (splatRef.current) {
                const raycaster = new THREE.Raycaster(
                    new THREE.Vector3(data.x, data.y + 5, data.z),
                    new THREE.Vector3(0, -1, 0)
                );
                const intersects = raycaster.intersectObject(sceneRef.current, true);
                if (intersects.length > 0) {
                    model.position.y = intersects[0].point.y;
                }
            }
            
            model.userData = { 
                id: data.id, 
                url: data.url, 
                type: 'avatar',
                rotation: data.rotation,
                scale: data.scale
            };
            
            sceneRef.current?.add(model);
            avatarsRef.current[data.id] = model;

            // ---- New: Animation Mixer Integration ----
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                // Play the first animation clip (usually 'Walk' or 'Idle')
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                mixersRef.current[data.id] = mixer;
                console.log(`Initialized animation mixer for agent ${data.id} (${gltf.animations.length} clips)`);
            }
        });
    }

    useEffect(() => {
        const handleResize = () => {
            if (mountRef.current && cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        // Fetch local assets for the import tab
        void fetchLocalAssets();
        
        return () => {
            window.removeEventListener('resize', handleResize);
            cleanup();
        };
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] gap-4 page-enter">
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Globe2 className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
                    <div>
                        <h2 className="text-lg font-bold gradient-text">Spark 2.0 High-Fidelity Viewer</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {loadedName ? `Sovereign View: ${loadedName}` : 'Load a .rad or .spz world'}
                        </p>
                    </div>
                </div>
                
                {/* Spatial Voice Toggle */}
                <button
                    onClick={() => {
                        const next = !spatialVoiceEnabled;
                        setSpatialVoiceEnabled(next);
                        if (next) void initSpatialAudio();
                        if (next && audioCtxRef.current?.state === 'suspended') {
                            void audioCtxRef.current.resume();
                        }
                    }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium",
                        spatialVoiceEnabled 
                            ? "bg-aurora-500/20 border-aurora-500/50 text-aurora-400 shadow-[0_0_15px_-3px_rgba(74,222,128,0.3)]"
                            : "bg-white/[0.04] border-white/[0.08] text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Volume2 className={cn("w-3.5 h-3.5", spatialVoiceEnabled && "animate-pulse")} />
                    Spatial Voice Agent {spatialVoiceEnabled ? 'Active' : 'Disabled'}
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
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLoadUrl()}
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
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 transition-all shadow-lg"
                    title="Copy viewer link"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-aurora-400" /> : <Link className="w-3.5 h-3.5" />}
                </button>

                <button
                    onClick={() => setShowToolbox(!showToolbox)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                        showToolbox 
                            ? "bg-cosmos-500/20 border-cosmos-500/50 text-cosmos-300" 
                            : "bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-slate-300"
                    )}
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    Spatial Toolbox
                </button>

                {status === 'loading' && <span className="badge-pending animate-pulse">Streaming LoD…</span>}
                {status === 'ready' && <span className="badge-success">Spark 2.0 Engine Live</span>}
                {status === 'error' && <span className="badge-error">Engine Fault</span>}
            </div>

            {/* Formats note */}
            <div className="flex items-center justify-between text-[10px] text-slate-600 flex-shrink-0 px-1">
                <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    Spark 2.0 (Rust/WASM) Renderer • 100M+ Splat Budget
                </div>
                <div className="flex gap-3">
                    <span>Performance: Ultra</span>
                    <span>Format: {urlInput.endsWith('.rad') ? 'Progressive (.RAD)' : 'Splat (.SPZ)'}</span>
                </div>
            </div>

            {/* Render Canvas */}
            <div
                className={cn(
                    "relative flex-1 min-h-0 rounded-xl overflow-hidden border border-white/[0.06] bg-black/40 transition-all duration-300 shadow-2xl",
                    isFullscreen && "fixed inset-0 z-50 m-0 rounded-none border-0"
                )}
                onDragOver={e => e.preventDefault()}
            >
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-cosmos-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-300">Spark 2.0 LoD Engine</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Initializing Rust Workers...</p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="glass-card p-6 max-w-md text-center space-y-3">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                            <p className="text-lg font-bold text-red-300">Renderer Initialization Failed</p>
                            <p className="text-xs text-slate-500 font-mono italic">{error}</p>
                            <button 
                                onClick={() => void loadWorld(urlInput)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-all"
                            >
                                Retry Engine
                            </button>
                        </div>
                    </div>
                )}

                {/* The Canvas */}
                <div ref={mountRef} className="w-full h-full cursor-move" />

                {/* Spatial Toolbox Panel */}
                {showToolbox && (
                    <div className="absolute top-4 right-4 w-72 glass-card p-4 z-20 shadow-2xl animate-in slide-in-from-right-4 duration-300 border-cosmos-500/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-cosmos-300 flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                Spatial Command
                            </h3>
                            <button onClick={() => setShowToolbox(false)} className="text-slate-500 hover:text-white">
                                <Minimize2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mb-4">
                                {(['studio', 'gallery', 'import'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setToolboxTab(t)}
                                        className={cn(
                                            "flex-1 text-[9px] font-black uppercase tracking-tighter py-1.5 rounded-lg transition-all",
                                            toolboxTab === t ? "bg-cosmos-500/20 text-cosmos-300 border border-cosmos-500/20" : "text-slate-500 font-bold"
                                        )}
                                    >
                                        {t === 'studio' && <Settings2 className="w-3 h-3 mx-auto mb-0.5" />}
                                        {t === 'gallery' && <LayoutGrid className="w-3 h-3 mx-auto mb-0.5" />}
                                        {t === 'import' && <Search className="w-3 h-3 mx-auto mb-0.5" />}
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {toolboxTab === 'studio' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Direct Narration / Asset URL</label>
                                        <textarea
                                            value={toolboxPrompt}
                                            onChange={e => setToolboxPrompt(e.target.value)}
                                            placeholder="Enter prompt or URL..."
                                            className="input-glass text-xs py-2 w-full min-h-[60px] resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => broadcastEvent('speech')}
                                            disabled={!toolboxPrompt || isBroadcasting}
                                            className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-aurora-500/10 hover:border-aurora-500/30 hover:text-aurora-300 transition-all"
                                        >
                                            <Volume2 className="w-3.5 h-3.5" />
                                            Narrate
                                        </button>
                                        <button
                                            onClick={() => broadcastEvent('audio')}
                                            disabled={!toolboxPrompt || isBroadcasting}
                                            className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-magenta-500/10 hover:border-magenta-500/30 hover:text-magenta-300 transition-all"
                                        >
                                            <Music className="w-3.5 h-3.5" />
                                            Audio
                                        </button>
                                        <button
                                            onClick={() => {
                                                const url = toolboxPrompt.toLowerCase();
                                                const type = (url.endsWith('.glb') || url.endsWith('.gltf')) ? 'avatar' : 
                                                           (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.webp')) ? 'image' : 'video';
                                                broadcastEvent(type);
                                            }}
                                            disabled={!toolboxPrompt || isBroadcasting}
                                            className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            Materialize
                                        </button>
                                        <button
                                            onClick={() => broadcastEvent('avatar')}
                                            disabled={!toolboxPrompt || isBroadcasting}
                                            className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-cosmos-500/10 hover:border-cosmos-500/30 hover:text-cosmos-300 transition-all"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Spawn Agent
                                        </button>
                                    </div>
                                </div>
                            )}

                            {toolboxTab === 'gallery' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'nb1', name: 'NB Masterpiece 1', url: '/assets/gallery/nb_1.png' },
                                            { id: 'nb2', name: 'NB Abstract', url: '/assets/gallery/nb_2.png' },
                                            { id: 'nb3', name: 'NB Moonrise', url: '/assets/gallery/nb_3.png' },
                                            { id: 'gsd1', name: 'GSD Portrait', url: '/assets/gallery/gsd_1.png' },
                                            { id: 'gsd2', name: 'GSD Puppy', url: '/assets/gallery/gsd_puppy.png' },
                                        ].map(art => (
                                            <button
                                                key={art.id}
                                                onClick={() => {
                                                    setToolboxPrompt(art.url);
                                                    broadcastEvent('image');
                                                }}
                                                className="group relative h-20 rounded-lg overflow-hidden border border-white/10 hover:border-cosmos-500/50 transition-all"
                                            >
                                                <img src={art.url} alt={art.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                                                    <span className="text-[8px] font-black uppercase text-white truncate w-full">{art.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {toolboxTab === 'import' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                                        {localAssets.length === 0 ? (
                                            <p className="text-[9px] text-slate-600 italic">No assets found in ~/Downloads...</p>
                                        ) : (
                                            localAssets.map(file => (
                                                <button
                                                    key={file}
                                                    onClick={() => {
                                                        const url = `http://localhost:10865/api/local-assets/${file}`;
                                                        setToolboxPrompt(url);
                                                        const type = (file.toLowerCase().endsWith('.glb') || file.toLowerCase().endsWith('.gltf')) ? 'avatar' : 
                                                                   (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.webp')) ? 'image' : 'video';
                                                        broadcastEvent(type);
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 flex items-center gap-2 group transition-all"
                                                >
                                                    {(file.endsWith('.glb') || file.endsWith('.gltf')) ? <FileCode className="w-3 h-3 text-cosmos-400" /> : <ImageIcon className="w-3 h-3 text-cyan-400" />}
                                                    <span className="text-[10px] text-slate-400 group-hover:text-white truncate">{file}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <button 
                                        onClick={fetchLocalAssets}
                                        className="w-full py-1 text-[9px] font-bold uppercase text-slate-500 hover:text-white transition-colors border-t border-white/5 mt-2"
                                    >
                                        Refresh Downloads
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-aurora-500 animate-pulse" />
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                    Sovereign State
                                </h4>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleBakeScene}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-void-600/30 text-void-300 border border-void-500/30 hover:bg-void-600/50 transition-all group"
                                >
                                    <Save className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase">Bake Scene</span>
                                </button>
                                <button 
                                    onClick={handleRestoreScene}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cosmos-600/30 text-cosmos-300 border border-cosmos-500/30 hover:bg-cosmos-600/50 transition-all group"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-45deg] transition-transform" />
                                    <span className="text-[10px] font-bold uppercase">Restore</span>
                                </button>
                            </div>

                            <div className="pt-2 border-t border-white/5 text-[9px] text-slate-500 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <Wand2 className="w-3 h-3" />
                                    Grounding: Camera Pos
                                </span>
                                <span>v0.4.0 Engine</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local Intelligence Overlay */}
                <div className="absolute bottom-4 left-4 pointer-events-none">
                    <div className="glass-card px-3 py-1.5 text-[10px] text-cosmos-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-aurora-500 animate-pulse" />
                        Sovereign Environment Active • Local Intelligence Model
                    </div>
                </div>
            </div>
        </div>
    );
}
