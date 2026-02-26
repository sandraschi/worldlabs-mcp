import { Link } from 'react-router-dom';
import { Globe, Box, Zap, Wand2, Activity } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="space-y-12 pb-10 relative isolate">
            {/* SOTA Background Aesthetics - Refined for content area only */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[0%] right-[-10%] w-[45%] h-[45%] bg-blue-900/10 blur-[180px] rounded-full" />
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[2rem] bg-black/40 border border-slate-800 shadow-2xl group backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-blue-600/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />

                <div className="relative px-8 py-16 md:px-14 md:py-24 max-w-4xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-400 border border-cyan-500/20 mb-8 backdrop-blur-md">
                        <Zap className="h-3.5 w-3.5 fill-cyan-400" />
                        POWERED BY MARBLE AI
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
                        Generate <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500">Infinite Worlds</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl font-medium">
                        Spatial Intelligence at your fingertips. Reconstruct 3D environments from text, images,
                        and videos. Seamless export to Blender, Unity, and Resonite.
                    </p>
                    <div className="flex flex-wrap gap-5">
                        <Link to="/architect" className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 font-black text-black hover:bg-cyan-50 transition-all transform hover:scale-105 shadow-xl shadow-cyan-500/10 no-underline">
                            <Wand2 className="h-6 w-6" />
                            Launch Architect
                        </Link>
                        <Link to="/library" className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 px-8 py-4 font-bold text-white transition-all backdrop-blur-md no-underline">
                            <Globe className="h-6 w-6" />
                            Browse Library
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-cyan-500/50 transition-all group">
                    <Box className="h-12 w-12 text-cyan-400 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Geometry Proxy</h3>
                    <p className="text-slate-400 leading-snug">Auto-generate optimized collision meshes for game engines.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-blue-500/50 transition-all group">
                    <Sparkles className="h-12 w-12 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Splat Pipeline</h3>
                    <p className="text-slate-400 leading-snug">Full support for SPZ Gaussian Splatting with Luma/VRS interoperability.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-indigo-500/50 transition-all group">
                    <Activity className="h-12 w-12 text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">DCC Bridge</h3>
                    <p className="text-slate-400 leading-snug">Synchronize spatial assets across Blender and Unity in real-time.</p>
                </div>
            </div>
        </div>
    );
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    );
}
