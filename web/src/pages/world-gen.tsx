import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Globe2, Image as ImageIcon, Video, Send, Loader2,
    CheckCircle2, XCircle, Clock, Copy, ExternalLink,
} from 'lucide-react';
import { api, type Operation } from '@/lib/api';
import { cn } from '@/lib/utils';

type Mode = 'text' | 'image' | 'video';
type ModelId = 'Marble 0.1-plus' | 'Marble 0.1-mini';

const models: { id: ModelId; label: string; eta: string }[] = [
    { id: 'Marble 0.1-plus', label: 'Plus', eta: '~5 min' },
    { id: 'Marble 0.1-mini', label: 'Mini', eta: '~45 sec' },
];

function OperationCard({ op }: { op: Operation }) {
    const status = op.metadata?.progress?.status ?? (op.done ? 'SUCCEEDED' : 'IN_PROGRESS');
    const world = op.response?.world;

    const copy = (text: string) => void navigator.clipboard.writeText(text);

    return (
        <div className={cn(
            'glass-card p-5 space-y-3',
            status === 'SUCCEEDED' && 'border-aurora-500/20',
            status === 'FAILED' && 'border-red-500/20',
        )}>
            <div className="flex items-center gap-3">
                {status === 'SUCCEEDED' && <CheckCircle2 className="w-5 h-5 text-aurora-400 flex-shrink-0" aria-hidden="true" />}
                {status === 'FAILED' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />}
                {status === 'IN_PROGRESS' && <Loader2 className="w-5 h-5 text-cosmos-400 animate-spin flex-shrink-0" aria-label="Loading" />}
                <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-200">
                        {world?.display_name || 'World Generation'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{op.name}</div>
                </div>
                <span className={cn(
                    status === 'SUCCEEDED' && 'badge-success',
                    status === 'FAILED' && 'badge-error',
                    status === 'IN_PROGRESS' && 'badge-pending',
                )}>
                    {status === 'IN_PROGRESS' ? 'In Progress' : status === 'SUCCEEDED' ? 'Done' : 'Failed'}
                </span>
            </div>

            {/* Progress bar */}
            {status === 'IN_PROGRESS' && (
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-cosmos-500 to-void-500 rounded-full animate-pulse" />
                </div>
            )}

            {/* Thumbnail */}
            {world?.assets?.thumbnail_url && (
                <img
                    src={world.assets.thumbnail_url}
                    alt={world.display_name ?? 'Generated world thumbnail'}
                    className="w-full h-40 object-cover rounded-lg border border-white/[0.06]"
                />
            )}

            {/* Caption */}
            {world?.assets?.caption && (
                <p className="text-xs text-slate-400 italic">{world.assets.caption}</p>
            )}

            {/* Links */}
            {world?.assets && (
                <div className="flex flex-wrap gap-2">
                    {world.assets.splat_url && (
                        <a href={world.assets.splat_url} target="_blank" rel="noopener noreferrer"
                            className="badge-info gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                            <ExternalLink className="w-3 h-3" aria-hidden="true" /> Splat
                        </a>
                    )}
                    {world.assets.mesh_url && (
                        <a href={world.assets.mesh_url} target="_blank" rel="noopener noreferrer"
                            className="badge-info gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                            <ExternalLink className="w-3 h-3" aria-hidden="true" /> Mesh
                        </a>
                    )}
                    {world.assets.panorama_url && (
                        <a href={world.assets.panorama_url} target="_blank" rel="noopener noreferrer"
                            className="badge-info gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                            <ExternalLink className="w-3 h-3" aria-hidden="true" /> Panorama
                        </a>
                    )}
                </div>
            )}

            {/* Copy operation ID */}
            <button
                onClick={() => copy(op.name)}
                title="Copy operation ID"
                aria-label="Copy operation ID"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
                <Copy className="w-3 h-3" aria-hidden="true" /> Copy operation ID
            </button>

            {op.error && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    Error {op.error.code}: {op.error.message}
                </div>
            )}
        </div>
    );
}

export function WorldGen() {
    const [mode, setMode] = useState<Mode>('text');
    const [model, setModel] = useState<ModelId>('Marble 0.1-plus');
    const [textPrompt, setTextPrompt] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [isPano, setIsPano] = useState(false);
    const [results, setResults] = useState<Operation[]>([]);

    const generateMutation = useMutation({
        mutationFn: async () => {
            if (mode === 'text') return api.generateFromText(textPrompt, displayName, model);
            if (mode === 'image') return api.generateFromImage(mediaUrl, textPrompt, displayName, model, isPano);
            return api.generateFromVideo(mediaUrl, textPrompt, displayName, model);
        },
        onSuccess: (data) => {
            setResults(prev => [data, ...prev]);
        },
    });

    const canSubmit = mode === 'text' ? textPrompt.trim().length > 0 : mediaUrl.trim().length > 0;

    const modeButtons: { id: Mode; label: string; icon: React.ElementType }[] = [
        { id: 'text', label: 'Text', icon: Globe2 },
        { id: 'image', label: 'Image', icon: ImageIcon },
        { id: 'video', label: 'Video', icon: Video },
    ];

    return (
        <div className="space-y-6 page-enter max-w-4xl mx-auto">
            <div>
                <h2 className="text-lg font-bold gradient-text">World Generation</h2>
                <p className="text-sm text-slate-500 mt-0.5">Generate 3D spatial worlds via the Marble API</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                    {/* Mode tabs */}
                    <div className="glass-card p-1 flex gap-1" role="tablist" aria-label="Generation mode">
                        {modeButtons.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={mode === id}
                                onClick={() => setMode(id)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                                    mode === id
                                        ? 'bg-cosmos-600/40 text-cosmos-300 border border-cosmos-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                                )}
                            >
                                <Icon className="w-4 h-4" aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Model select */}
                    <div className="glass-card p-4 space-y-3">
                        <label className="section-label">Model</label>
                        <div className="flex gap-2">
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setModel(m.id)}
                                    className={cn(
                                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all',
                                        model === m.id
                                            ? 'bg-void-600/30 text-void-300 border-void-500/40'
                                            : 'text-slate-400 border-white/[0.06] hover:bg-white/[0.04]',
                                    )}
                                    aria-pressed={model === m.id}
                                >
                                    {m.label}
                                    <span className="ml-1.5 text-[10px] text-slate-500">({m.eta})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input fields */}
                    <div className="glass-card p-4 space-y-3">
                        {(mode === 'image' || mode === 'video') && (
                            <div className="space-y-1.5">
                                <label htmlFor="media-url" className="section-label block">
                                    {mode === 'image' ? 'Image URL' : 'Video URL'}
                                </label>
                                <input
                                    id="media-url"
                                    type="url"
                                    className="input-glass"
                                    placeholder={mode === 'image' ? 'https://example.com/photo.jpg' : 'https://example.com/video.mp4'}
                                    value={mediaUrl}
                                    onChange={e => setMediaUrl(e.target.value)}
                                />
                                {mode === 'image' && (
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            checked={isPano}
                                            onChange={e => setIsPano(e.target.checked)}
                                            className="accent-cosmos-500"
                                            aria-label="Is panorama image"
                                        />
                                        360° Panorama image
                                    </label>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="text-prompt" className="section-label block">
                                {mode === 'text' ? 'World Description *' : 'Text Hint (optional)'}
                            </label>
                            <textarea
                                id="text-prompt"
                                className="input-glass min-h-[100px] resize-none"
                                placeholder={mode === 'text'
                                    ? 'A tranquil Japanese garden with a koi pond, mossy stones and maple trees in autumn…'
                                    : 'Optional text hint to guide the generation…'
                                }
                                value={textPrompt}
                                onChange={e => setTextPrompt(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="display-name" className="section-label block">World Name (optional)</label>
                            <input
                                id="display-name"
                                type="text"
                                className="input-glass"
                                placeholder="My Autumn Garden"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={() => generateMutation.mutate()}
                        disabled={!canSubmit || generateMutation.isPending}
                        className={cn(
                            'w-full btn-glow flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all',
                            (!canSubmit || generateMutation.isPending) && 'opacity-50 cursor-not-allowed',
                        )}
                    >
                        {generateMutation.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Generating…</>
                            : <><Send className="w-4 h-4" aria-hidden="true" /> Generate World</>
                        }
                    </button>

                    {generateMutation.isError && (
                        <div className="glass-card p-3 border-red-500/20 text-sm text-red-400">
                            {String(generateMutation.error)}
                        </div>
                    )}
                </div>

                {/* Results */}
                <div className="space-y-3">
                    <h3 className="section-label flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        Results ({results.length})
                    </h3>
                    {results.length === 0 && (
                        <div className="glass-card p-8 text-center text-sm text-slate-500">
                            <Globe2 className="w-8 h-8 text-slate-700 mx-auto mb-3" aria-hidden="true" />
                            Operations will appear here after generation starts.
                        </div>
                    )}
                    {results.map((op, i) => (
                        <OperationCard key={op.name ?? i} op={op} />
                    ))}
                </div>
            </div>
        </div>
    );
}
