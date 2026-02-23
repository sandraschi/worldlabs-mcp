import { useState } from 'react';
import { Settings2, Key, Server, Globe2, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Settings() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // In production this would POST to the backend
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6 page-enter max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
                <div>
                    <h2 className="text-lg font-bold gradient-text">Settings</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Configure World Labs MCP</p>
                </div>
            </div>

            {/* API Configuration */}
            <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Key className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-slate-200">API Configuration</h3>
                </div>

                <div className="space-y-2">
                    <label htmlFor="api-key" className="section-label block">
                        Marble API Key
                    </label>
                    <div className="relative">
                        <input
                            id="api-key"
                            type={showKey ? 'text' : 'password'}
                            className={cn('input-glass pr-10', 'font-mono')}
                            placeholder="wlt_••••••••••••••••"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <button
                            onClick={() => setShowKey(p => !p)}
                            title={showKey ? 'Hide API key' : 'Show API key'}
                            aria-label={showKey ? 'Hide API key' : 'Show API key'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {showKey
                                ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                                : <Eye className="w-4 h-4" aria-hidden="true" />
                            }
                        </button>
                    </div>
                    <p className="text-xs text-slate-600">
                        Or set <code className="font-mono text-slate-500">WORLDLABS_API_KEY</code> in your environment (recommended).
                        Get your key at{' '}
                        <a
                            href="https://platform.worldlabs.ai/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cosmos-400 hover:text-cosmos-300 transition-colors"
                        >
                            platform.worldlabs.ai
                        </a>.
                    </p>
                </div>
            </div>

            {/* Server Settings */}
            <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Server className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-slate-200">Server Settings</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="backend-port" className="section-label block">Backend Port</label>
                        <input
                            id="backend-port"
                            type="number"
                            defaultValue={10865}
                            className="input-glass font-mono w-40"
                            min={1024}
                            max={65535}
                            aria-label="Backend server port"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="base-url" className="section-label block">Marble Base URL</label>
                        <input
                            id="base-url"
                            type="url"
                            defaultValue="https://api.worldlabs.ai/marble/v1"
                            className="input-glass font-mono"
                            aria-label="Marble API base URL"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="poll-interval" className="section-label block">Poll Interval (seconds)</label>
                        <input
                            id="poll-interval"
                            type="number"
                            defaultValue={15}
                            className="input-glass font-mono w-32"
                            min={5}
                            max={120}
                            aria-label="Operation polling interval in seconds"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="timeout" className="section-label block">Generation Timeout (seconds)</label>
                        <input
                            id="timeout"
                            type="number"
                            defaultValue={600}
                            className="input-glass font-mono w-40"
                            min={60}
                            aria-label="Generation timeout in seconds"
                        />
                    </div>
                </div>
            </div>

            {/* Display */}
            <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Globe2 className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-slate-200">UI Preferences</h3>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-200">Dark Mode</div>
                        <div className="text-xs text-slate-500">Always enabled for optimal viewing</div>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-cosmos-600 flex items-center justify-end px-0.5 cursor-not-allowed opacity-70">
                        <div className="w-4 h-4 rounded-full bg-white shadow" />
                    </div>
                </div>
            </div>

            {/* Save button */}
            <button
                onClick={handleSave}
                className={cn(
                    'btn-glow flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all',
                    saved && 'from-aurora-600 to-aurora-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                )}
            >
                {saved
                    ? <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Saved!</>
                    : <><Save className="w-4 h-4" aria-hidden="true" /> Save Settings</>
                }
            </button>

            <p className="text-xs text-slate-600">
                Note: Settings that overlap with environment variables (like API key) require a server restart to take effect.
            </p>
        </div>
    );
}
