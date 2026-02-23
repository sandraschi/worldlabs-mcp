import { useQuery } from '@tanstack/react-query';
import {
    Globe2, Activity, Wrench, Cpu, ArrowRight,
    Layers, Clock, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function StatCard({ label, value, icon: Icon, color, sublabel }: {
    label: string; value: string | number; icon: React.ElementType;
    color: string; sublabel?: string;
}) {
    return (
        <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
                <span className="section-label">{label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                    <Icon className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            {sublabel && <div className="text-xs text-slate-500">{sublabel}</div>}
        </div>
    );
}

function QuickAction({ title, desc, to, icon: Icon }: {
    title: string; desc: string; to: string; icon: React.ElementType;
}) {
    return (
        <Link to={to} className="glass-card-hover p-4 flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmos-600/30 to-void-600/30 border border-cosmos-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cosmos-400 group-hover:translate-x-1 transition-all" aria-hidden="true" />
        </Link>
    );
}

export function Dashboard() {
    const { data: system, isLoading, isError } = useQuery({
        queryKey: ['system'],
        queryFn: api.systemInfo,
        retry: 1,
    });
    const { data: health } = useQuery({
        queryKey: ['health'],
        queryFn: api.health,
        refetchInterval: 15_000,
    });

    return (
        <div className="space-y-8 page-enter max-w-5xl mx-auto">
            {/* Hero */}
            <div className="relative overflow-hidden glass-card p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-cosmos-900/40 via-transparent to-void-900/20 pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-cosmos-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmos-500 to-void-600 flex items-center justify-center shadow-[0_0_24px_rgba(92,84,255,0.4)] animate-float">
                            <Globe2 className="w-6 h-6 text-white" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold gradient-text">World Labs MCP</h2>
                            <p className="text-sm text-slate-400">Marble API — 3D World Generation</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                        Generate explorable 3D spatial worlds from text prompts, images, and video using the World Labs Marble API.
                        Create spatial intelligence experiences at scale.
                    </p>
                    <div className="flex items-center gap-3 mt-5">
                        <Link
                            to="/tools"
                            className="btn-glow inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        >
                            <Globe2 className="w-4 h-4" aria-hidden="true" />
                            Generate World
                        </Link>
                        <Link
                            to="/status"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-all"
                        >
                            <Activity className="w-4 h-4" aria-hidden="true" />
                            View Status
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Tools"
                    value={isLoading ? '…' : isError ? '—' : (system?.tools.length ?? 0)}
                    icon={Wrench}
                    color="bg-cosmos-600/40"
                    sublabel="MCP tools available"
                />
                <StatCard
                    label="API"
                    value={isLoading ? '…' : (system?.api_key_set ? 'Ready' : 'No Key')}
                    icon={CheckCircle2}
                    color={system?.api_key_set ? 'bg-aurora-600/40' : 'bg-red-600/40'}
                    sublabel="Marble API status"
                />
                <StatCard
                    label="Backend"
                    value={health?.status === 'ok' ? 'Online' : '…'}
                    icon={Activity}
                    color="bg-aurora-600/40"
                    sublabel="Bridge server"
                />
                <StatCard
                    label="Models"
                    value="2"
                    icon={Layers}
                    color="bg-nebula-600/40"
                    sublabel="plus / mini"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="section-label mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <QuickAction
                        to="/tools"
                        icon={Globe2}
                        title="Generate from Text"
                        desc="Describe a world in natural language"
                    />
                    <QuickAction
                        to="/tools"
                        icon={Layers}
                        title="Generate from Image"
                        desc="Upload or link an image as the world seed"
                    />
                    <QuickAction
                        to="/tools-explorer"
                        icon={Wrench}
                        title="Browse All Tools"
                        desc="Explore all 8 MCP tools with docs"
                    />
                    <QuickAction
                        to="/local-llm"
                        icon={Cpu}
                        title="Local LLM Tooling"
                        desc="Discover Ollama & LM Studio models"
                    />
                </div>
            </div>

            {/* About */}
            <div className="glass-card p-5">
                <h3 className="section-label mb-3">About Marble API</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: Globe2, title: 'Text → World', desc: 'Generate immersive 3D environments from any text description' },
                        { icon: Clock, title: 'Async Operations', desc: 'Track generation progress with operation polling (5min for plus, 45s for mini)' },
                        { icon: AlertCircle, title: 'Multiple Formats', desc: 'Outputs include splat, mesh, panorama, thumbnail and caption' },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex gap-3">
                            <Icon className="w-4 h-4 text-cosmos-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <div className="text-sm font-medium text-slate-200">{title}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Version */}
            {system && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    <span>Server: {system.name} v{system.version}</span>
                </div>
            )}
        </div>
    );
}
