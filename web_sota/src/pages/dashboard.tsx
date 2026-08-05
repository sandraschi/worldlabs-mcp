import { Activity, Box, Globe, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
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
  const [toolCount, setToolCount] = useState<number | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sys, cred] = await Promise.all([
          api.systemInfo().catch(() => null),
          api.credits().catch(() => null),
        ]);
        if (cancelled) return;
        if (sys && typeof sys.tools?.length === "number")
          setToolCount(sys.tools.length);
        if (cred && typeof cred.live_balance === "number")
          setCredits(cred.live_balance);
      } catch {
        // non-fatal - dashboard still renders
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div data-testid="dashboard" className="space-y-8 pb-10 relative isolate">
      {/* SOTA Background Aesthetics - Refined for content area only */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/[0.04] blur-[150px] rounded-full" />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-blue-600/10" />
        <div className="relative pt-1 pb-8">
          <div className="flex items-center gap-2 mb-3">
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
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            World Labs MCP
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Generate 3D worlds from text, images, or video — then view them in
            the Spark viewer, browse the community gallery, or launch the Marble
            Adventure hub.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/architect"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-cyan-50 transition-colors no-underline"
            >
              <Wand2 className="h-4 w-4" />
              Generate a world
            </Link>
            <Link
              to="/library"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors no-underline"
            >
              <Globe className="h-4 w-4" />
              Browse library
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
            {toolCount !== null
              ? `${toolCount} MCP tools`
              : backend.ok === null
                ? "..."
                : "--"}
          </div>
        </div>
        <div
          data-testid="kpi-marble"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-4"
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
          data-testid="kpi-credits"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-4"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Credits left
          </div>
          <div className="text-sm font-medium text-white">
            {credits !== null
              ? credits.toLocaleString()
              : backend.ok
                ? "loading..."
                : "—"}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/architect"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 hover:border-cyan-500/40 hover:bg-slate-900/50 transition-all group no-underline text-left"
        >
          <Wand2 className="h-6 w-6 text-cyan-400 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">
            Generate a world
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            From text, an image, or video.
          </p>
        </Link>
        <Link
          to="/library"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 hover:border-cyan-500/40 hover:bg-slate-900/50 transition-all group no-underline text-left"
        >
          <Box className="h-6 w-6 text-void-400 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">World library</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse and open your generated worlds.
          </p>
        </Link>
        <Link
          to="/gallery"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 hover:border-cyan-500/40 hover:bg-slate-900/50 transition-all group no-underline text-left"
        >
          <Globe className="h-6 w-6 text-aurora-400 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">
            Community gallery
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse and search public Marble worlds.
          </p>
        </Link>
        <Link
          to="/apps"
          className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 hover:border-cyan-500/40 hover:bg-slate-900/50 transition-all group no-underline text-left"
        >
          <Activity className="h-6 w-6 text-indigo-400 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">
            Marble Adventure
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Launch the game hub, or open the apps list.
          </p>
        </Link>
      </div>
    </div>
  );
}
