import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, XCircle, RefreshCw, Globe2, Server, Key, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function StatusRow({ label, value, ok, detail }: {
    label: string; value: string; ok: boolean; detail?: string;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
            <div className="flex items-center gap-3">
                {ok
                    ? <CheckCircle2 className="w-4 h-4 text-aurora-400" aria-hidden="true" />
                    : <XCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
                }
                <div>
                    <div className="text-sm font-medium text-slate-200">{label}</div>
                    {detail && <div className="text-xs text-slate-500 mt-0.5">{detail}</div>}
                </div>
            </div>
            <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full border',
                ok
                    ? 'text-aurora-400 bg-aurora-500/10 border-aurora-500/20'
                    : 'text-red-400 bg-red-500/10 border-red-500/20',
            )}>
                {value}
            </span>
        </div>
    );
}

export function Status() {
    const { data: health, isLoading: hLoading, refetch: refetchHealth, dataUpdatedAt } = useQuery({
        queryKey: ['health'],
        queryFn: api.health,
        refetchInterval: 15_000,
    });

    const { data: system, isLoading: sLoading, isError: sError } = useQuery({
        queryKey: ['system'],
        queryFn: api.systemInfo,
    });

    const isOnline = health?.status === 'ok';
    const lastChecked = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

    return (
        <div className="space-y-6 page-enter max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold gradient-text">System Status</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Last checked: {lastChecked}</p>
                </div>
                <button
                    onClick={() => void refetchHealth()}
                    title="Refresh status"
                    aria-label="Refresh status"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Refresh
                </button>
            </div>

            {/* Overall banner */}
            <div className={cn(
                'glass-card p-5 flex items-center gap-4',
                isOnline ? 'border-aurora-500/20' : 'border-red-500/20',
            )}>
                <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isOnline ? 'bg-aurora-500/20' : 'bg-red-500/20',
                )}>
                    <Activity
                        className={cn('w-6 h-6', isOnline ? 'text-aurora-400' : 'text-red-400')}
                        aria-hidden="true"
                    />
                </div>
                <div>
                    <div className="text-base font-bold text-white">
                        {hLoading ? 'Checking…' : isOnline ? 'All Systems Operational' : 'Backend Unreachable'}
                    </div>
                    <div className="text-sm text-slate-400 mt-0.5">
                        {isOnline ? 'Bridge server and MCP tools are running.' : 'Start the backend with start.ps1.'}
                    </div>
                </div>
                {isOnline && (
                    <span className="ml-auto badge-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-aurora-400 animate-pulse-slow" aria-hidden="true" />
                        Healthy
                    </span>
                )}
            </div>

            {/* Service checks */}
            <div className="glass-card p-5">
                <h3 className="section-label mb-3">Service Checks</h3>
                {hLoading || sLoading ? (
                    <div className="text-sm text-slate-500 py-4 text-center">Loading…</div>
                ) : (
                    <>
                        <StatusRow
                            label="Bridge Server"
                            value={isOnline ? 'Online' : 'Offline'}
                            ok={isOnline}
                            detail={`localhost:10865 — FastAPI`}
                        />
                        <StatusRow
                            label="MCP Tools"
                            value={sError ? 'Unreachable' : `${system?.tools.length ?? 0} loaded`}
                            ok={!sError}
                            detail={system?.name ? `${system.name} v${system.version}` : undefined}
                        />
                        <StatusRow
                            label="Marble API Key"
                            value={system?.api_key_set ? 'Configured' : 'Missing'}
                            ok={!!system?.api_key_set}
                            detail="WORLDLABS_API_KEY env var"
                        />
                        <StatusRow
                            label="Base URL"
                            value="Configured"
                            ok={true}
                            detail={system?.base_url ?? 'https://api.worldlabs.ai/marble/v1'}
                        />
                    </>
                )}
            </div>

            {/* Info links */}
            <div className="glass-card p-5">
                <h3 className="section-label mb-3">Resources</h3>
                <div className="space-y-2">
                    {[
                        { href: 'https://docs.worldlabs.ai/api', icon: Globe2, label: 'Marble API Docs' },
                        { href: 'https://platform.worldlabs.ai/api-keys', icon: Key, label: 'API Key Management' },
                        { href: 'https://platform.worldlabs.ai', icon: Server, label: 'World Labs Platform' },
                    ].map(({ href, icon: Icon, label }) => (
                        <a
                            key={href}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors group"
                        >
                            <Icon className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                            <ExternalLink className="w-3 h-3 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
