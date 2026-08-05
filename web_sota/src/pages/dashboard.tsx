import { Activity, Box, Globe, Wand2, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";

function useHealthPoll() {
  const checkHealth = useAppStore((s) => s.checkHealth);
  const backend = useAppStore((s) => s.backend);
  const attemptRef = useRef(0);

  useEffect(() => {
    const intervals = [1, 2, 4, 8, 16];
    attemptRef.current = 0;
    const poll = async () => {
      await checkHealth();
      if (!backend.ok) {
        const idx = Math.min(attemptRef.current, intervals.length - 1);
        attemptRef.current += 1;
        setTimeout(poll, intervals[idx] * 1000);
      }
    };
    poll();
  }, [checkHealth]);
}

export function Dashboard() {
  useHealthPoll();
  const backend = useAppStore((s) => s.backend);

  return (
    <div data-testid="dashboard" className="space-y-8 pb-10 relative isolate">
      {/* SOTA Background Aesthetics - Refined for content area only */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/[0.04] blur-[150px] rounded-full" />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-blue-600/10" />
        <div className="relative py-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-400 border border-cyan-500/20 uppercase tracking-wide">
              <Zap className="h-3 w-3 fill-cyan-400" />
              Marble · Spark 2.0 · Chisel
            </span>
            <span
              data-testid="backend-dot"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${
                backend.ok === null
                  ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                  : backend.ok
                    ? "bg-aurora-500/10 text-aurora-400 border-aurora-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              <span
                data-testid="backend-dot"
                className={`w-1.5 h-1.5 rounded-full ${
                  backend.ok === null
                    ? "bg-gray-400"
                    : backend.ok
                      ? "bg-aurora-400 animate-pulse"
                      : "bg-red-400 animate-pulse"
                }`}
              />
              {backend.ok === null
                ? "Connecting..."
                : backend.ok
                  ? "Connected"
                  : "Offline"}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight max-w-3xl">
            Generate{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500">
              Infinite Worlds
            </span>
          </h1>
          <div className="space-y-3 mb-6 max-w-2xl text-sm md:text-base leading-relaxed">
            <p className="text-slate-300">
              Your fleet control plane for{" "}
              <a
                href="https://worldlabs.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                worldlabs.ai
              </a>
              . <span className="text-slate-400">Use </span>
              <span className="font-semibold text-white">Marble</span>
              <span className="text-slate-400">
                {" "}
                to reconstruct radiance-field worlds from prompts, reference
                images, and video — then stream them in Spark 2.0 or open them
                on{" "}
              </span>
              <a
                href="https://marble.worldlabs.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline"
              >
                marble.worldlabs.ai
              </a>
              <span className="text-slate-400">.</span>
            </p>
            <p className="text-slate-400">
              <span className="font-semibold text-white">Chisel</span> distills
              watertight collision geometry from those splats for engines and VR
              — export GLB/OBJ to Blender, Unity, and Resonite, or run the same
              jobs from MCP tools and this dashboard (
              <Link
                to="/chisel"
                className="text-void-400 hover:text-void-300 underline-offset-2 hover:underline"
              >
                Chisel pipeline
              </Link>
              , Architect, Library).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/architect"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-cyan-50 transition-colors shadow-md shadow-cyan-500/10 no-underline"
            >
              <Wand2 className="h-4 w-4" />
              Launch Architect
            </Link>
            <Link
              to="/library"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors backdrop-blur-md no-underline"
            >
              <Globe className="h-4 w-4" />
              Browse Library
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div
          data-testid="kpi-server"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 backdrop-blur-sm"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Backend
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backend.ok === null
                  ? "bg-gray-500"
                  : backend.ok
                    ? "bg-aurora-400 animate-pulse"
                    : "bg-red-400 animate-pulse"
              }`}
            />
            <span className="text-sm font-medium text-white">
              {backend.ok === null
                ? "Connecting..."
                : backend.ok
                  ? "Connected"
                  : "Offline"}
            </span>
          </div>
        </div>
        <div
          data-testid="kpi-tools"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 backdrop-blur-sm"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tools
          </div>
          <div className="text-sm font-medium text-white">
            {backend.ok ? "12+ MCP tools" : backend.ok === null ? "..." : "--"}
          </div>
        </div>
        <div
          data-testid="kpi-marble"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 backdrop-blur-sm"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Marble API
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${backend.ok ? "bg-aurora-400" : "bg-gray-500"}`}
            />
            <span className="text-sm font-medium text-white">
              {backend.ok ? "Ready" : "Unknown"}
            </span>
          </div>
        </div>
        <div
          data-testid="kpi-spark"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 backdrop-blur-sm"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Spark Engine
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${backend.ok ? "bg-aurora-400" : "bg-gray-500"}`}
            />
            <span className="text-sm font-medium text-white">
              {backend.ok ? "Available" : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Link
          to="/chisel"
          className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-void-500/50 transition-all group no-underline text-left"
        >
          <Box className="h-12 w-12 text-void-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            Geometry Proxy
          </h3>
          <p className="text-slate-400 leading-snug">
            Auto-generate optimized collision meshes for game engines via{" "}
            <strong>Chisel</strong>.
          </p>
        </Link>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-blue-500/50 transition-all group">
          <Sparkles className="h-12 w-12 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            Multimodal Orchestration
          </h3>
          <p className="text-slate-400 leading-snug">
            Trigger spatial audio, video textures, and avatars via SSE.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-indigo-500/50 transition-all group">
          <Activity className="h-12 w-12 text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            Sovereign Intelligence
          </h3>
          <p className="text-slate-400 leading-snug">
            Optimize world prompts with local LLMs (Ollama/LM Studio).
          </p>
        </div>
        <Link
          to="/spark-v2"
          className="rounded-3xl border border-slate-800 bg-slate-900/30 p-8 backdrop-blur-sm hover:border-cosmos-500/50 transition-all group no-underline text-left"
        >
          <Zap className="h-12 w-12 text-cosmos-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            Spark 2.0 Engine
          </h3>
          <p className="text-slate-400 leading-snug">
            LoD Gaussian Splatting with 100M+ point budget and `.RAD` streaming.
          </p>
        </Link>
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
