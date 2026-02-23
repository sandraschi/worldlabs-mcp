import {
    HelpCircle, Globe2, Clock, Wrench, BookOpen,
    Code2, MessageSquare, Key, ArrowRight,
} from 'lucide-react';

interface Section {
    title: string;
    icon: React.ElementType;
    content: React.ReactNode;
}

export function Help() {
    const sections: Section[] = [
        {
            title: 'Getting Started',
            icon: Globe2,
            content: (
                <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                    <p>
                        World Labs MCP wraps the Marble API to generate explorable 3D spatial worlds from
                        text descriptions, images, and video — directly from your AI assistant.
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                        <li>Get an API key at <a href="https://platform.worldlabs.ai/api-keys" target="_blank" rel="noopener noreferrer" className="text-cosmos-400 hover:text-cosmos-300 transition-colors">platform.worldlabs.ai/api-keys</a></li>
                        <li>Set <code className="bg-white/[0.06] px-1.5 py-0.5 rounded font-mono text-xs">WORLDLABS_API_KEY</code> in your environment</li>
                        <li>Run <code className="bg-white/[0.06] px-1.5 py-0.5 rounded font-mono text-xs">uv run python src/server.py</code> to start the MCP server</li>
                        <li>Add the server to your IDE MCP config</li>
                    </ol>
                </div>
            ),
        },
        {
            title: 'Available Tools',
            icon: Wrench,
            content: (
                <div className="space-y-3">
                    {[
                        { name: 'generate_world_from_text', desc: 'Generate from a text prompt' },
                        { name: 'generate_world_from_image', desc: 'Generate from image URL (jpg, png, webp)' },
                        { name: 'generate_world_from_video', desc: 'Generate from video URL (mp4, mov, mkv)' },
                        { name: 'get_operation', desc: 'Poll an operation for status / result' },
                        { name: 'wait_for_world', desc: 'Block until operation completes (with timeout)' },
                        { name: 'get_world', desc: 'Fetch details for a generated world' },
                        { name: 'prepare_media_upload', desc: 'Get signed URL for local file upload' },
                        { name: 'generate_world_from_media_asset', desc: 'Generate from pre-uploaded media asset' },
                    ].map(t => (
                        <div key={t.name} className="flex items-start gap-2">
                            <Code2 className="w-3.5 h-3.5 text-cosmos-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                                <code className="text-xs font-mono text-cosmos-300">{t.name}</code>
                                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Generation Models',
            icon: Clock,
            content: (
                <div className="space-y-2 text-sm">
                    {[
                        { name: 'Marble 0.1-plus', time: '~5 minutes', quality: 'High quality, detailed geometry' },
                        { name: 'Marble 0.1-mini', time: '~30–45 seconds', quality: 'Fast preview, lower fidelity' },
                    ].map(m => (
                        <div key={m.name} className="glass-card p-3">
                            <div className="flex items-center justify-between">
                                <code className="text-xs font-mono text-void-300">{m.name}</code>
                                <span className="badge-pending">{m.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{m.quality}</p>
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Agentic Workflow',
            icon: MessageSquare,
            content: (
                <div className="space-y-2 text-sm text-slate-400 leading-relaxed">
                    <p>Typical AI assistant workflow:</p>
                    <div className="space-y-1.5">
                        {[
                            'generate_world_from_text() → get operation_id',
                            'Optionally wait_for_world(operation_id) to block until done',
                            'Or poll manually with get_operation(operation_id)',
                            'On success: get_world(world_id) for full asset URLs',
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-cosmos-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <code className="text-xs font-mono text-slate-300">{step}</code>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            title: 'API Key Setup',
            icon: Key,
            content: (
                <div className="space-y-2 text-sm text-slate-400">
                    <p>The server reads <code className="bg-white/[0.06] px-1.5 py-0.5 rounded font-mono text-xs">WORLDLABS_API_KEY</code> from your environment.</p>
                    <div className="bg-black/30 rounded-lg border border-white/[0.06] p-3 font-mono text-xs text-slate-300 space-y-1">
                        <div><span className="text-slate-600"># .env</span></div>
                        <div>WORLDLABS_API_KEY=wlt_...</div>
                    </div>
                    <a
                        href="https://platform.worldlabs.ai/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cosmos-400 hover:text-cosmos-300 transition-colors"
                    >
                        <BookOpen className="w-3 h-3" aria-hidden="true" />
                        Get your API key →
                    </a>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 page-enter max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
                <div>
                    <h2 className="text-lg font-bold gradient-text">Help & Documentation</h2>
                    <p className="text-sm text-slate-500 mt-0.5">World Labs MCP — Marble API reference</p>
                </div>
            </div>

            <div className="space-y-4">
                {sections.map(({ title, icon: Icon, content }) => (
                    <div key={title} className="glass-card p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
                            <h3 className="text-sm font-bold text-slate-200">{title}</h3>
                        </div>
                        {content}
                    </div>
                ))}
            </div>
        </div>
    );
}
