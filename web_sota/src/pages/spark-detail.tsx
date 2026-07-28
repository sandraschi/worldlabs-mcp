import {
  Activity,
  ChevronRight,
  Cpu,
  Database,
  Globe2,
  Info,
  Layers,
  LineChart,
  Rocket,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SparkDetail() {
  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[2rem] bg-black/40 border border-slate-800 p-12 backdrop-blur-xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-cosmos-600/10 via-transparent to-aurora-600/10 opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cosmos-500/10 blur-[120px] rounded-full animate-pulse" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-cosmos-500/10 px-4 py-1.5 text-xs font-bold text-cosmos-400 border border-cosmos-500/20 mb-6 uppercase tracking-widest">
            <Rocket className="h-3.5 w-3.5" />
            Industrial Engine Spec
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-none">
            Spark 2.0 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cosmos-300 via-aurora-400 to-cyan-500">
              The LoD Splat Engine
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            A high-performance Radiance Field renderer built for infinite-scale
            3D Gaussian Splatting. Spark 2.0 introduces streaming
            Level-of-Detail (LoD) trees and GPU virtual memory paging.
          </p>
        </div>
      </section>

      {/* Core Pillars */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-card p-8 space-y-4 hover:border-cosmos-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-cosmos-500/10 flex items-center justify-center text-cosmos-400 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">LoD Splat Trees</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Organizes radiance fields into hierarchical structures. Render 100M+
            splats with a fixed frame-budget of 500K-2.5M primitives.
          </p>
        </div>
        <div className="glass-card p-8 space-y-4 hover:border-aurora-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-aurora-500/10 flex items-center justify-center text-aurora-400 group-hover:scale-110 transition-transform">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">.RAD Streaming</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            A bitstream-optimized format for progressive delivery. Supports HTTP
            Range requests for instant coarse previews followed by progressive
            refinement.
          </p>
        </div>
        <div className="glass-card p-8 space-y-4 hover:border-cyan-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Virtual Paging</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Swaps splat pages in/out of GPU memory based on frustum visibility.
            Enables massive world navigation on mobile and standalone XR
            hardware.
          </p>
        </div>
      </div>

      {/* Technical Specification Table */}
      <section className="glass-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/[0.06] bg-white/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cosmos-400" />
            Engine Performance Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-8 py-4 font-black">Capability</th>
                <th className="px-8 py-4 font-black">Implementation</th>
                <th className="px-8 py-4 font-black">Standard</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-400">
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Coordinate Precision
                </td>
                <td className="px-8 py-4 font-mono">ExtSplats f32</td>
                <td className="px-8 py-4">High-Precision Radiance</td>
              </tr>
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Tree Construction
                </td>
                <td className="px-8 py-4 font-mono">bhatt-lod</td>
                <td className="px-8 py-4 text-cosmos-400 font-bold">
                  Industrial SOTA
                </td>
              </tr>
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Compute Backend
                </td>
                <td className="px-8 py-4 font-mono">Rust / Wasm Workers</td>
                <td className="px-8 py-4">Concurrent Throughput</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Immersive Integration
                </td>
                <td className="px-8 py-4 font-mono">SparkXR (WebXR)</td>
                <td className="px-8 py-4">Sovereign VR/AR</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Integration Details */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Industrial Interoperability
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Spark 2.0 is designed for the modern sovereign workstation. It
            bypasses the bottlenecks of traditional heavy-poly rasterization by
            utilizing volumetric rendering primitives that better represent the
            "hallucinated" geometry of Marble foundation models.
          </p>
          <ul className="space-y-3">
            {[
              "Native Progressive Audio Narration (HRTF)",
              "Dynamic Gaussian Shadow-mapping",
              "Linear-Blend Skinning for Animated Splats",
              "OIT (Order Independent Transparency) native",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-slate-300"
              >
                <ShieldCheck className="w-4 h-4 text-aurora-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-8 bg-cosmos-600/5 border-cosmos-500/20 relative isolate overflow-hidden">
          <LineChart className="w-12 h-12 text-cosmos-400/20 absolute -right-4 -bottom-4 rotate-12" />
          <h4 className="text-lg font-bold text-cosmos-300 mb-4">
            Industrial Context
          </h4>
          <p className="text-sm text-slate-500 italic leading-relaxed">
            "The move to LoD Splat Trees in Spark 2.0 allows us to finally
            decouple scene complexity from GPU memory constraints. We are no
            longer rendering points; we are traversing a probability volume."
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-tighter">
                Engineering Lead
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Spark Core Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
