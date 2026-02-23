import { ExternalLink, Globe2, Server, Cpu, Code2, BookOpen, Wrench, Grid3x3 } from 'lucide-react';

interface AppLink {
    title: string;
    desc: string;
    url: string;
    port?: string;
    icon: React.ElementType;
    badge?: string;
}

const apps: AppLink[] = [
    {
        title: 'World Labs Platform',
        desc: 'Manage worlds, API keys, and usage on the World Labs platform.',
        url: 'https://platform.worldlabs.ai',
        icon: Globe2,
        badge: 'External',
    },
    {
        title: 'API Documentation',
        desc: 'Full Marble API reference — endpoints, parameters, and examples.',
        url: 'https://docs.worldlabs.ai/api',
        icon: BookOpen,
        badge: 'External',
    },
    {
        title: 'Marble API Explorer',
        desc: 'Interactive REST API explorer for all Marble v1 endpoints.',
        url: 'https://docs.worldlabs.ai/api',
        icon: Code2,
        badge: 'External',
    },
    {
        title: 'MCP Bridge Backend',
        desc: 'FastAPI bridge server powering this dashboard.',
        url: 'http://localhost:10865/docs',
        port: ':10865',
        icon: Server,
        badge: 'Local',
    },
    {
        title: 'World Gen Dashboard',
        desc: 'Jump directly to world generation.',
        url: '/tools',
        icon: Wrench,
        badge: 'Internal',
    },
    {
        title: 'Local LLM Hub',
        desc: 'Discover and manage local Ollama and LM Studio models.',
        url: '/local-llm',
        icon: Cpu,
        badge: 'Internal',
    },
];

function AppCard({ app }: { app: AppLink }) {
    const isExternal = app.badge === 'External' || app.badge === 'Local';
    const Tag = isExternal ? 'a' : 'a';

    return (
        <Tag
            href={app.url}
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="glass-card-hover p-5 flex gap-4 group"
        >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmos-600/30 to-void-600/30 border border-cosmos-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <app.icon className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {app.title}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {app.badge && (
                            <span className={
                                app.badge === 'External' ? 'badge-info'
                                    : app.badge === 'Local' ? 'badge-pending'
                                        : 'badge-success'
                            }>
                                {app.badge}
                            </span>
                        )}
                        {isExternal && <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" aria-hidden="true" />}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{app.desc}</p>
                {app.port && (
                    <div className="text-[10px] font-mono text-slate-600 mt-1">localhost{app.port}</div>
                )}
            </div>
        </Tag>
    );
}

export function Apps() {
    return (
        <div className="space-y-6 page-enter max-w-3xl mx-auto">
            <div>
                <h2 className="text-lg font-bold gradient-text">Apps Hub</h2>
                <p className="text-sm text-slate-500 mt-0.5">Fleet navigation — World Labs ecosystem and local services</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apps.map(app => (
                    <AppCard key={app.title} app={app} />
                ))}
            </div>

            <div className="glass-card p-4 flex items-center gap-3">
                <Grid3x3 className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-slate-500">
                    This hub links to all services in the World Labs MCP ecosystem.
                    Add more apps by editing <span className="font-mono text-slate-400">src/pages/apps.tsx</span>.
                </p>
            </div>
        </div>
    );
}
