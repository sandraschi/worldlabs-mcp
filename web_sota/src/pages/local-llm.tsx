import { useQuery } from '@tanstack/react-query';
import {
    Cpu, RefreshCw, CheckCircle2, XCircle, Download,
    Layers, Zap, HardDrive,
} from 'lucide-react';
import { api, type LlmModel } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-slate-400 hover:text-white"
            title={label || `Copy: ${text}`}
            aria-label={label || `Copy: ${text}`}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-aurora-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

function ModelCard({ model, provider }: { model: LlmModel; provider: string }) {
    return (
        <div className="glass-card-hover p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nebula-600/30 to-cosmos-600/30 border border-nebula-500/20 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-nebula-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200 truncate">{model.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{provider}</div>
            </div>
            {model.size && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <HardDrive className="w-3 h-3" aria-hidden="true" />
                    {model.size}
                </div>
            )}
            {model.parameters && (
                <span className="badge-info">{model.parameters}</span>
            )}
            <CopyButton text={`ollama run ${model.id}`} label="Copy run command" />
        </div>
    );
}

function ProviderSection({
    name, available, models, url,
}: {
    name: string; available: boolean; models: LlmModel[]; url?: string;
}) {
    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        available ? 'bg-aurora-500/20' : 'bg-slate-700/40',
                    )}>
                        <Cpu className={cn('w-4 h-4', available ? 'text-aurora-400' : 'text-slate-500')} aria-hidden="true" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">{name}</div>
                        {url && <div className="text-xs text-slate-500 font-mono">{url}</div>}
                    </div>
                </div>
                {available
                    ? <span className="badge-success"><CheckCircle2 className="w-3 h-3" aria-hidden="true" />Running</span>
                    : <span className="badge-error"><XCircle className="w-3 h-3" aria-hidden="true" />Not found</span>
                }
            </div>

            {available && models.length > 0 && (
                <div className="space-y-2">
                    <div className="section-label">Loaded Models ({models.length})</div>
                    {models.map(m => (
                        <ModelCard key={m.id} model={m} provider={name} />
                    ))}
                </div>
            )}

            {available && models.length === 0 && (
                <div className="text-sm text-slate-500 py-2 text-center">
                    No models found — pull a model first.
                </div>
            )}

            {!available && (
                <div className="text-sm text-slate-500 space-y-2">
                    <p>Install {name} to enable local LLM inference.</p>
                    <a
                        href={name === 'Ollama' ? 'https://ollama.ai' : 'https://lmstudio.ai'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cosmos-400 hover:text-cosmos-300 transition-colors"
                    >
                        <Download className="w-3 h-3" aria-hidden="true" />
                        Download {name}
                    </a>
                </div>
            )}
        </div>
    );
}

const GPU_RECS = [
    { model: 'Llama 3.3 70B (Q4)', vram: '24 GB', fit: true },
    { model: 'Qwen 2.5 32B', vram: '18 GB', fit: true },
    { model: 'Gemma 3 27B', vram: '16 GB', fit: true },
    { model: 'Mistral Small 3 24B', vram: '14 GB', fit: true },
    { model: 'Phi-4 14B', vram: '8 GB', fit: true },
];

export function LocalLlm() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['llm-discover'],
        queryFn: api.discoverLlms,
        retry: 0,
    });

    return (
        <div className="space-y-6 page-enter max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold gradient-text">Local LLM Tooling</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Detect Ollama & LM Studio — run models locally on your RTX 4090</p>
                </div>
                <button
                    onClick={() => void refetch()}
                    title="Rescan for local LLM providers"
                    aria-label="Rescan for local LLM providers"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Rescan
                </button>
            </div>

            {/* GPU Opportunity */}
            <div className="glass-card p-5 border-void-500/20 bg-gradient-to-br from-void-900/20 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-4 h-4 text-void-400" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-slate-200">RTX 4090 Model Recommendations</h3>
                </div>
                <div className="space-y-2">
                    {GPU_RECS.map(r => (
                        <div key={r.model} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-aurora-400 flex-shrink-0" aria-hidden="true" />
                                <span className="text-sm text-slate-300 font-mono">{r.model}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-12">{r.vram}</span>
                                <CopyButton text={`ollama pull ${r.model.split(' ')[0].toLowerCase()}`} label={`Copy pull command for ${r.model}`} />
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-600 mt-3">All models run at 4-bit quantization on 24 GB GDDR6X.</p>
            </div>

            {isLoading && (
                <div className="glass-card p-8 text-center text-sm text-slate-500">
                    <RefreshCw className="w-6 h-6 text-slate-700 mx-auto mb-2 animate-spin" aria-label="Scanning" />
                    Scanning for local LLM providers…
                </div>
            )}

            {isError && (
                <div className="glass-card p-4 border-amber-500/20 text-sm text-amber-400">
                    Backend not reachable — start the bridge server to enable LLM discovery.
                </div>
            )}

            {data && (
                <div className="space-y-4">
                    <ProviderSection
                        name="Ollama"
                        available={data?.ollama?.available ?? false}
                        models={data?.ollama?.models ?? []}
                        url={data?.ollama?.url}
                    />
                    <ProviderSection
                        name="LM Studio"
                        available={data?.lmstudio?.available ?? false}
                        models={data?.lmstudio?.models ?? []}
                        url={data?.lmstudio?.url}
                    />
                </div>
            )}
        </div>
    );
}
