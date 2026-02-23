import { useState, useRef, useCallback, useEffect } from 'react';
import { Globe2, Download, ExternalLink, Cpu, Zap, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
    api,
    type Operation,
    type FlatAssets,
    type AssetType,
    type ExportRequest,
    triggerDownload,
} from '@/lib/api';

const MODELS = ['Marble 0.1-plus', 'Marble 0.1-mini'] as const;
type GenMode = 'text' | 'image' | 'video';

// ── Asset Panel ───────────────────────────────────────────────────────────────

function AssetPanel({ op, assets }: { op: Operation; assets: FlatAssets }) {
    const worldId = op.response?.id ?? op.metadata?.world_id ?? '';
    const worldName = op.response?.display_name ?? `World_${worldId.slice(0, 8)}`;
    const [exportState, setExportState] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'error'>>({});

    const setEs = (key: string, s: 'idle' | 'loading' | 'ok' | 'error') =>
        setExportState(p => ({ ...p, [key]: s }));

    const exportReq: ExportRequest = {
        world_id: worldId,
        world_name: worldName,
        spz_url: assets.splat_500k ?? assets.splat_full ?? '',
        mesh_url: assets.mesh ?? '',
        splat_lod: '500k',
    };

    async function handleExport(target: 'blender' | 'unity3d' | 'resonite') {
        setEs(target, 'loading');
        try {
            const fn = target === 'blender' ? api.exportToBlender
                : target === 'unity3d' ? api.exportToUnity3D
                    : api.exportToResonite;
            const res = await fn(exportReq);
            setEs(target, res.status === 'ok' ? 'ok' : 'error');
        } catch {
            setEs(target, 'error');
        }
        setTimeout(() => setEs(target, 'idle'), 3500);
    }

    const downloads: Array<{ key: AssetType; label: string; hint: string }> = [
        { key: 'splat_100k', label: 'SPZ 100k', hint: 'Fast preview' },
        { key: 'splat_500k', label: 'SPZ 500k', hint: 'Balanced' },
        { key: 'splat_full', label: 'SPZ Full', hint: 'Max quality' },
        { key: 'mesh', label: 'GLB Mesh', hint: 'Collider' },
        { key: 'panorama', label: 'Panorama', hint: '360° image' },
    ];

    const exports: Array<{ key: 'blender' | 'unity3d' | 'resonite'; label: string; icon: string }> = [
        { key: 'blender', label: 'Blender', icon: '🎨' },
        { key: 'unity3d', label: 'Unity3D', icon: '🎮' },
        { key: 'resonite', label: 'Resonite', icon: '🌐' },
    ];

    return (
        <div className="mt-4 border-t border-white/[0.06] pt-4 space-y-4">
            {/* Downloads */}
            <div>
                <p className="section-label mb-2">Download assets</p>
                <div className="flex flex-wrap gap-2">
                    {downloads.map(({ key, label, hint }) => {
                        const url = assets[key];
                        if (!url) return null;
                        return (
                            <button
                                key={key}
                                onClick={() => triggerDownload(worldId, key, url)}
                                title={hint}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.07] hover:border-cosmos-500/40 text-xs text-slate-300 hover:text-white transition-all"
                            >
                                <Download className="w-3 h-3" aria-hidden="true" />
                                {label}
                            </button>
                        );
                    })}
                    {assets.mesh && (
                        <a
                            href={op.response?.world_marble_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cosmos-600/20 hover:bg-cosmos-600/30 border border-cosmos-500/30 text-xs text-cosmos-300 hover:text-cosmos-200 transition-all"
                        >
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            View in Marble
                        </a>
                    )}
                </div>
            </div>

            {/* DCC Exports */}
            <div>
                <p className="section-label mb-2">Export to DCC</p>
                <div className="flex flex-wrap gap-2">
                    {exports.map(({ key, label, icon }) => {
                        const state = exportState[key] ?? 'idle';
                        return (
                            <button
                                key={key}
                                onClick={() => handleExport(key)}
                                disabled={state === 'loading'}
                                aria-label={`Export to ${label}`}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                                    state === 'loading' && 'opacity-60 cursor-not-allowed',
                                    state === 'ok' && 'bg-aurora-500/20 border-aurora-500/40 text-aurora-300',
                                    state === 'error' && 'bg-red-500/20 border-red-500/40 text-red-300',
                                    state === 'idle' && 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white',
                                )}
                            >
                                <span>{icon}</span>
                                {state === 'loading' ? 'Sending…' : state === 'ok' ? `${label} ✓` : state === 'error' ? `${label} ✗` : label}
                            </button>
                        );
                    })}
                    {/* Link to in-app viewer */}
                    {(assets.splat_500k || assets.splat_full) && (
                        <a
                            href={`/viewer?url=${encodeURIComponent(assets.splat_500k ?? assets.splat_full ?? '')}&name=${encodeURIComponent(worldName)}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-600/20 hover:bg-void-600/30 border border-void-500/30 text-xs text-void-300 hover:text-void-200 transition-all"
                        >
                            <Globe2 className="w-3 h-3" aria-hidden="true" />
                            View in Splat Viewer
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Operation card ────────────────────────────────────────────────────────────

function OperationCard({ op }: { op: Operation }) {
    const [expanded, setExpanded] = useState(false);
    const done = op.done;
    const failed = !!op.error || op.metadata?.progress?.status === 'FAILED';
    const progress = op.metadata?.progress;
    const world = op.response;
    const assets: FlatAssets = (world as Record<string, unknown>)?._assets as FlatAssets ?? {};

    return (
        <div className={cn('glass-card p-4 space-y-2 transition-all', done && !failed && 'border-aurora-500/20')}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {failed ? (
                        <span className="badge-error">Failed</span>
                    ) : done ? (
                        <span className="badge-success">Done</span>
                    ) : (
                        <span className="badge-pending animate-pulse">Generating…</span>
                    )}
                    <code className="text-xs font-mono text-slate-500">{op.operation_id.slice(0, 16)}…</code>
                </div>
                <button
                    onClick={() => setExpanded(p => !p)}
                    aria-expanded={expanded}
                    aria-label="Toggle operation details"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    {expanded ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                </button>
            </div>

            {/* Progress description */}
            {progress?.description && (
                <p className="text-xs text-slate-500">{progress.description}</p>
            )}

            {/* Thumbnail */}
            {done && !failed && assets.thumbnail && (
                <img
                    src={assets.thumbnail}
                    alt="World thumbnail"
                    className="w-full rounded-lg object-cover max-h-48"
                />
            )}

            {/* Caption */}
            {done && !failed && assets.caption && (
                <p className="text-xs text-slate-400 leading-relaxed">{assets.caption}</p>
            )}

            {/* Error */}
            {failed && (
                <p className="text-xs text-red-400">{op.error ?? 'Generation failed'}</p>
            )}

            {/* Asset panel */}
            {done && !failed && (
                <AssetPanel op={op} assets={assets} />
            )}

            {/* Raw JSON */}
            {expanded && (
                <pre className="text-[10px] font-mono text-slate-600 overflow-auto max-h-48 bg-black/20 rounded p-2">
                    {JSON.stringify(op, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function WorldGen() {
    const [mode, setMode] = useState<GenMode>('text');
    const [model, setModel] = useState<string>(MODELS[0]);
    const [prompt, setPrompt] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [name, setName] = useState('');
    const [isPanorama, setIsPanorama] = useState(false);
    const [operations, setOperations] = useState<Operation[]>([]);
    const pollMap = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

    const startPolling = useCallback((opId: string) => {
        if (pollMap.current.has(opId)) return;
        const iv = setInterval(async () => {
            try {
                const op = await api.getOperation(opId);
                setOperations(prev => prev.map(o => o.operation_id === opId ? op : o));
                if (op.done || op.error) {
                    clearInterval(iv);
                    pollMap.current.delete(opId);
                }
            } catch { /* network blip — keep polling */ }
        }, 8000);
        pollMap.current.set(opId, iv);
    }, []);

    useEffect(() => () => { pollMap.current.forEach(iv => clearInterval(iv)); }, []);

    const addOp = (op: Operation) => {
        setOperations(prev => [op, ...prev]);
        if (!op.done) startPolling(op.operation_id);
    };

    const generateMutation = useMutation({
        mutationFn: async () => {
            switch (mode) {
                case 'text': return api.generateText(prompt, name, model);
                case 'image': return api.generateImage(mediaUrl, prompt, name, model, isPanorama);
                case 'video': return api.generateVideo(mediaUrl, prompt, name, model);
            }
        },
        onSuccess: addOp,
    });

    const canSubmit = mode === 'text' ? prompt.trim().length > 0 : mediaUrl.trim().length > 0;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center gap-3">
                <Globe2 className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
                <div>
                    <h2 className="text-lg font-bold gradient-text">World Generation</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Generate 3D worlds with the Marble API</p>
                </div>
            </div>

            {/* Controls */}
            <div className="glass-card p-5 space-y-4">
                {/* Mode tabs */}
                <div className="flex gap-1 p-1 bg-black/20 rounded-lg w-fit" role="tablist" aria-label="Generation mode">
                    {(['text', 'image', 'video'] as GenMode[]).map(m => (
                        <button
                            key={m}
                            role="tab"
                            aria-selected={mode === m}
                            onClick={() => setMode(m)}
                            className={cn(
                                'px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all',
                                mode === m
                                    ? 'bg-cosmos-600 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-300',
                            )}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Model selector */}
                <div className="flex gap-2 flex-wrap">
                    {MODELS.map(m => (
                        <button
                            key={m}
                            aria-pressed={model === m}
                            onClick={() => setModel(m)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all',
                                model === m
                                    ? 'border-cosmos-500/60 bg-cosmos-600/20 text-cosmos-300'
                                    : 'border-white/[0.08] text-slate-500 hover:text-slate-300',
                            )}
                        >
                            {m.includes('plus') ? <Zap className="w-3 h-3" aria-hidden="true" /> : <Cpu className="w-3 h-3" aria-hidden="true" />}
                            {m}
                        </button>
                    ))}
                </div>

                {/* Text prompt */}
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={mode === 'text' ? 'Describe the world to generate…' : 'Optional: describe adjustments…'}
                    rows={3}
                    className="input-glass resize-none"
                    aria-label="World description prompt"
                />

                {/* Media URL (image / video) */}
                {mode !== 'text' && (
                    <input
                        type="url"
                        value={mediaUrl}
                        onChange={e => setMediaUrl(e.target.value)}
                        placeholder={mode === 'image' ? 'https://…/image.jpg' : 'https://…/video.mp4'}
                        className="input-glass"
                        aria-label={mode === 'image' ? 'Image URL' : 'Video URL'}
                    />
                )}

                {/* Panorama toggle (image only) */}
                {mode === 'image' && (
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none w-fit">
                        <input
                            type="checkbox"
                            checked={isPanorama}
                            onChange={e => setIsPanorama(e.target.checked)}
                            className="rounded border-white/20 bg-white/[0.05]"
                            aria-label="Input image is a 360° panorama"
                        />
                        Input is a 360° panorama
                    </label>
                )}

                {/* Optional name */}
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Display name (optional)"
                    className="input-glass"
                    aria-label="World display name"
                />

                {/* Generate button */}
                <button
                    onClick={() => generateMutation.mutate()}
                    disabled={!canSubmit || generateMutation.isPending}
                    aria-label="Generate world"
                    className={cn(
                        'btn-glow px-6 py-2.5 rounded-xl text-sm font-bold text-white w-full transition-all',
                        (!canSubmit || generateMutation.isPending) && 'opacity-50 cursor-not-allowed',
                    )}
                >
                    {generateMutation.isPending ? 'Submitting…' : 'Generate World'}
                </button>

                {generateMutation.error instanceof Error && (
                    <p className="text-xs text-red-400">{generateMutation.error.message}</p>
                )}
            </div>

            {/* Operations */}
            {operations.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400">Generations</h3>
                    {operations.map(op => (
                        <OperationCard key={op.operation_id} op={op} />
                    ))}
                </div>
            )}
        </div>
    );
}
