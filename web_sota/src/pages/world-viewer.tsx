import { useEffect, useRef, useState } from 'react';
import { Globe2, Upload, FolderOpen, AlertCircle, Info, Maximize2, Minimize2, Link, Check } from 'lucide-react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { cn } from '@/lib/utils';

export function WorldViewer() {
    const mountRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [error, setError] = useState('');
    const [loadedName, setLoadedName] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Pull ?url=... & ?name=... from the query string
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const url = params.get('url');
        const name = params.get('name') ?? '';
        if (url) {
            setUrlInput(url);
            setLoadedName(name);
            void loadFromUrl(url);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function destroyViewer() {
        if (viewerRef.current) {
            try { viewerRef.current.dispose(); } catch { /* ignore */ }
            viewerRef.current = null;
        }
    }

    async function loadFromUrl(url: string) {
        if (!mountRef.current) return;
        setStatus('loading');
        setError('');

        // Cleanup previous object URLs if they were transient
        if (urlInput.startsWith('blob:') && urlInput !== url) {
            URL.revokeObjectURL(urlInput);
        }

        destroyViewer();

        try {
            const viewer = new GaussianSplats3D.Viewer({
                cameraUp: [0, -1, 0],
                initialCameraPosition: [-1, -4, 6],
                initialCameraLookAt: [0, 4, 0],
                rootElement: mountRef.current,
                sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
                selfDrivenMode: true,
                antialiased: true,
                transparentBackground: true,
                integerCascadedLOD: false,
            });

            await viewer.addSplatScene(url, {
                splatAlphaRemovalThreshold: 5,
                showLoadingUI: false,
                streamView: true,
            });

            viewer.start();
            viewerRef.current = viewer;
            setStatus('ready');
        } catch (e) {
            console.error('Splat load error:', e);
            setError(String(e));
            setStatus('error');
        }
    }

    function handleFileOpen(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoadedName(file.name);
        // Append format hint for blob URLs so the viewer knows it's an SPZ file
        const objectUrl = URL.createObjectURL(file) + (file.name.endsWith('.spz') ? '#.spz' : '');
        setUrlInput(objectUrl);
        void loadFromUrl(objectUrl);
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        setLoadedName(file.name);
        const objectUrl = URL.createObjectURL(file);
        setUrlInput(objectUrl);
        void loadFromUrl(objectUrl);
    }

    function handleLoadUrl() {
        if (urlInput.trim()) {
            const segments = new URL(urlInput).pathname.split('/');
            setLoadedName(segments[segments.length - 1] || 'World');
            void loadFromUrl(urlInput.trim());
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

    useEffect(() => () => destroyViewer(), []);

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] gap-4 page-enter">
            <div className="flex items-center gap-3 flex-shrink-0">
                <Globe2 className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
                <div>
                    <h2 className="text-lg font-bold gradient-text">Splat Viewer</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {loadedName ? `Viewing: ${loadedName}` : 'Load a .spz or .ply file to view'}
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-card p-3 flex flex-wrap items-center gap-2 flex-shrink-0">
                {/* File open */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".spz,.ply,.splat"
                    onChange={handleFileOpen}
                    className="hidden"
                    aria-label="Open splat file"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-all"
                >
                    <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    Open File…
                </button>

                {/* URL load */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLoadUrl()}
                        placeholder="Paste .spz / .ply URL and press Enter…"
                        className="input-glass text-xs py-1.5 flex-1 min-w-0"
                        aria-label="Splat file URL"
                    />
                    <button
                        onClick={handleLoadUrl}
                        disabled={!urlInput.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cosmos-600/40 hover:bg-cosmos-600/60 border border-cosmos-500/30 text-xs text-cosmos-300 disabled:opacity-40 transition-all"
                        aria-label="Load world from URL"
                    >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        Load
                    </button>
                </div>

                <button
                    onClick={handleCopyLink}
                    disabled={!urlInput}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white transition-all shadow-lg"
                    title="Copy viewer link"
                    aria-label="Copy viewer link"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-aurora-400" /> : <Link className="w-3.5 h-3.5" />}
                </button>

                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white transition-all shadow-lg"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Status badge */}
                {status === 'loading' && <span className="badge-pending animate-pulse">Loading…</span>}
                {status === 'ready' && <span className="badge-success">Live</span>}
                {status === 'error' && <span className="badge-error">Error</span>}
            </div>

            {/* Formats note */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-shrink-0">
                <Info className="w-3 h-3" aria-hidden="true" />
                Supported: .ply (Gaussian Splat), .splat, .spz (World Labs format)
            </div>

            {/* Canvas area */}
            <div
                className={cn(
                    "relative flex-1 min-h-0 rounded-xl overflow-hidden border border-white/[0.06] bg-black/40 transition-all duration-300",
                    isFullscreen && "fixed inset-0 z-50 m-0 rounded-none border-0"
                )}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
            >
                {/* Drop zone overlay */}
                {status === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
                        <Globe2 className="w-16 h-16 opacity-20" aria-hidden="true" />
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-slate-500">Drop a splat file here</p>
                            <p className="text-xs">or use Open File / URL above</p>
                            <p className="text-xs mt-2 text-slate-700">
                                Navigate: Left-drag to orbit • Right-drag to pan • Scroll to zoom
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading overlay */}
                {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-cosmos-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-slate-400">Loading splat…</p>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                        <div className={cn('glass-card p-6 max-w-md text-center space-y-2')}>
                            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" aria-hidden="true" />
                            <p className="text-sm text-red-300 font-medium">Failed to load splat</p>
                            <p className="text-xs text-slate-500 font-mono break-all">{error}</p>
                            <p className="text-xs text-slate-600">
                                SPZ files are compressed PLY. If the file fails, convert to .ply first using{' '}
                                <a href="https://spz.world" target="_blank" rel="noopener noreferrer" className="text-cosmos-400 hover:underline">spz.world</a>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Three.js mount — always rendered so viewer can attach */}
                <div ref={mountRef} className="w-full h-full" />
            </div>
        </div>
    );
}
