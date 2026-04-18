import { 
    Smartphone, Glasses, Wifi, Terminal, 
    ShieldCheck, Activity, Globe2, 
    Cpu, Zap, ChevronRight, HelpCircle,
    MonitorSmartphone, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ImmersiveDetail() {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        void navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Hero Header */}
            <section className="relative overflow-hidden rounded-[2rem] bg-black/40 border border-slate-800 p-12 backdrop-blur-xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-aurora-600/10 via-transparent to-cosmos-600/10 opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-aurora-500/10 blur-[120px] rounded-full animate-pulse" />
                
                <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full bg-aurora-500/10 px-4 py-1.5 text-xs font-bold text-aurora-400 border border-aurora-500/20 mb-6 uppercase tracking-widest">
                        <Glasses className="h-3.5 w-3.5" />
                        Immersive Stack v0.4.0
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-none">
                        Cross-Reality <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-300 via-cosmos-400 to-amber-500">
                            WebRTX & Android XR
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                        The World Labs gateway to immersive traversal. 
                        Experience generative worlds from the inside with low-latency 
                        radiance field streaming and spatialized intelligence.
                    </p>
                </div>
            </section>

            {/* Core Protocols */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="glass-card p-8 space-y-4 hover:border-aurora-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-aurora-500/10 flex items-center justify-center text-aurora-400 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">WebRTX Protocol</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        The <strong>Web Real-Time Cross-Reality</strong> protocol. Optimizes LoD splat tree streaming 
                        for 6DOF headsets with bitrate-aware progressive refinement.
                    </p>
                </div>
                <div className="glass-card p-8 space-y-4 hover:border-cosmos-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-cosmos-500/10 flex items-center justify-center text-cosmos-400 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Android XR Native</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Full optimization for the <strong>Android XR</strong> ecosystem. Native hand-tracking, 
                        shared spatial anchors, and multithreaded splat sorting for Quest 3.
                    </p>
                </div>
                <div className="glass-card p-8 space-y-4 hover:border-amber-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Wifi className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Sovereign Handoff</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Bypass the cloud. Stream directly from your workstation (Port 10865) to 
                        your HMD with zero-latency handshakes and local TTS narration.
                    </p>
                </div>
                <div className="glass-card p-8 space-y-4 hover:border-cyan-500/50 transition-all group lg:col-span-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Zap className="w-6 h-6 text-cyan-400" />
                                Pico 4 / Ultra Specialized Optimization
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                Dedicated support for the **Pico 4 Ultra** Passthrough API (MR). 
                                Spark 2.0 now optimizes depth-sensing for the Pico 4 range, allowing 
                                generatively persistent assets to "ground" accurately to your physical floor 
                                using the PicoOS spatial mapping layer.
                            </p>
                            <ul className="flex flex-wrap gap-4">
                                <li className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 uppercase">Stereo Passthrough v2</li>
                                <li className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 uppercase">PicoOS Hand-Tracking</li>
                                <li className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 uppercase">WiFi-7 Optimized streaming</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hardware Compatibility */}
            <section className="glass-card p-8">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-aurora-400" />
                    Certified Hardware & Runtimes (2026)
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { name: 'Meta Quest 3 / Ultra', os: 'Android XR', status: 'Optimal', color: 'text-aurora-400' },
                        { name: 'Apple Vision Pro', os: 'visionOS 3.0', status: 'WebGL2 High', color: 'text-cosmos-400' },
                        { name: 'Vive XR Elite', os: 'Android XR', status: 'Compatible', color: 'text-slate-400' },
                        { name: 'Pico 4 Ultra', os: 'PicoOS', status: 'Optimized', color: 'text-aurora-400' }
                    ].map(hmd => (
                        <div key={hmd.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                            <p className="text-xs font-bold text-white">{hmd.name}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 uppercase font-mono">{hmd.os}</span>
                                <span className={cn("text-[10px] font-bold uppercase", hmd.color)}>{hmd.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ADB & Debugging Utility for "Joe User" */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <MonitorSmartphone className="w-6 h-6 text-cosmos-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Android XR / Quest Debugging</h2>
                        <p className="text-sm text-slate-500 mt-1">Struggling with the HMD handshake? Let's fix that.</p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                <div className="glass-card p-8 bg-cosmos-600/5 border-cosmos-500/20 relative">
                    <Terminal className="w-12 h-12 text-cosmos-400/20 absolute -right-4 -bottom-4 rotate-12" />
                    <h4 className="text-lg font-bold text-cosmos-300 mb-4 flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        ADB Connection Script
                    </h4>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                            Run these commands in your PowerShell/Terminal to verify the headset 
                            is visible to your workstation. Ensure **Developer Mode** is ON in the Quest app.
                        </p>
                        
                        <div className="space-y-4">
                            {[
                                { id: 'adb-devices', cmd: 'adb devices', label: '1. List connected devices' },
                                { id: 'adb-tcp', cmd: 'adb tcpip 5555', label: '2. Enable Wireless ADB (Requires USB first)' },
                                { id: 'adb-connect', cmd: 'adb connect 192.168.1.XX', label: '3. Connect over WiFi' },
                            ].map(item => (
                                <div key={item.id} className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider font-mono">{item.label}</p>
                                    <div className="flex items-center gap-2 group">
                                        <code className="text-xs font-mono text-cosmos-200 bg-black/40 rounded px-3 py-2 flex-1 border border-white/5 truncate">
                                            {item.cmd}
                                        </code>
                                        <button 
                                            onClick={() => copyToClipboard(item.cmd, item.id)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-cosmos-500/20 text-slate-500 hover:text-cosmos-400 transition-all"
                                        >
                                            <ShieldCheck className={cn("w-4 h-4", copied === item.id && "text-aurora-500")} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-500 uppercase tracking-widest">
                                <AlertTriangle className="w-4 h-4" />
                                Pro-Tip: Port Forwarding
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                If you cannot access the dashboard on `http://192.168.1.XX:10864`, 
                                use ADB to forward the web port directly to the headset:
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="text-xs font-mono text-amber-200 bg-black/40 rounded px-3 py-2 flex-1 border border-amber-500/10">
                                    adb reverse tcp:10864 tcp:10865
                                </code>
                                <button 
                                    onClick={() => copyToClipboard('adb reverse tcp:10864 tcp:10865', 'adb-reverse')}
                                    className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all"
                                >
                                    <ShieldCheck className={cn("w-4 h-4", copied === 'adb-reverse' && "text-white")} />
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-500/60 mt-2">
                                *This allows browsing to <strong>http://localhost:10864</strong> inside the headset's Quest Browser.*
                            </p>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-cosmos-500/10 flex-shrink-0 flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 text-cosmos-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Can't see the "Enter VR" button?</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    WebXR requires a secure context. If using a local IP, ensure the browser's 
                                    <strong> #unsafely-treat-insecure-origin-as-secure</strong> flag is set for your 
                                    workstation IP in `headset-browser://flags`.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Context */}
            <div className="flex items-center justify-center pt-10 border-t border-white/[0.06]">
                <div className="flex flex-col items-center gap-4 text-center max-w-lg">
                    <Globe2 className="w-10 h-10 text-slate-700" />
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                        "WebRTX isn't just a transport—it's an orchestration layer for the 2026 
                        spatial ecosystem. To truly inhabit a generatively persistent world, 
                        Joe User shouldn't have to be an Android developer. We bridge that gap."
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-slate-800" />
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">SOTA XR ARCHITECTURE</span>
                        <span className="w-8 h-[1px] bg-slate-800" />
                    </div>
                </div>
            </div>
        </div>
    );
}
