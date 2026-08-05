import { Box, PenTool, Ruler, Scale, Shapes } from "lucide-react";

export function ChiselDetail() {
  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[2rem] bg-black/40 border border-slate-800 p-12 backdrop-blur-xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-void-600/10 via-transparent to-aurora-600/10 opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-void-500/10 blur-[120px] rounded-full animate-pulse" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-void-500/10 px-4 py-1.5 text-xs font-bold text-void-400 border border-void-500/20 mb-6 uppercase tracking-widest">
            <Shapes className="h-3.5 w-3.5" />
            Geometry Engine Spec
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-none">
            Chisel <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-void-300 via-aurora-400 to-indigo-500">
              Geometric Distillation
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            The geometric backbone of the World Labs ecosystem. Chisel
            "distills" watertight topology from volumetric radiance fields,
            bridging the gap between Gaussian probability and physical
            simulation.
          </p>
        </div>
      </section>

      {/* Core Pillars */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-card p-8 space-y-4 hover:border-void-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-void-500/10 flex items-center justify-center text-void-400 group-hover:scale-110 transition-transform">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Surface Extraction</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Converts radiance volumes into optimized triangle meshes using
            gradient-aware surface marching.
          </p>
        </div>
        <div className="glass-card p-8 space-y-4 hover:border-indigo-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Ruler className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Collision Proxies</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Generates watertight collision solids for real-time physics,
            character navigation (NavMesh), and robotics training.
          </p>
        </div>
        <div className="glass-card p-8 space-y-4 hover:border-aurora-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-aurora-500/10 flex items-center justify-center text-aurora-400 group-hover:scale-110 transition-transform">
            <Box className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Topology Refinement</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Multi-pass decimation ensures that generated meshes maintain visual
            silhouettes while adhering to standard polygon budgets.
          </p>
        </div>
      </div>

      {/* Technical Specification Table */}
      <section className="glass-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/[0.06] bg-white/[0.02]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-void-400" />
            Chisel Geometric Pipeline
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-8 py-4 font-black">Process Phase</th>
                <th className="px-8 py-4 font-black">Algorithm</th>
                <th className="px-8 py-4 font-black">Output Targeted</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-400">
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Latent Sampling
                </td>
                <td className="px-8 py-4 font-mono">Radial Volumetric Probe</td>
                <td className="px-8 py-4">SDF (Signed Distance Field)</td>
              </tr>
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Surface Distillation
                </td>
                <td className="px-8 py-4 font-mono">MarbleMesh-V4</td>
                <td className="px-8 py-4 text-void-400 font-bold">
                  Watertight Mesh
                </td>
              </tr>
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  UV Parameterization
                </td>
                <td className="px-8 py-4 font-mono">Conformal Least Squares</td>
                <td className="px-8 py-4">Albedo / Normal Maps</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-8 py-4 font-bold text-slate-300">
                  Physics Baking
                </td>
                <td className="px-8 py-4 font-mono">Convex Decomposition</td>
                <td className="px-8 py-4">V-HACD Collision Primitives</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Geometry Context */}
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white">Why Chisel?</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Gaussian Splatting is inherently volumetric and "fuzzy." While
            visually superior, it lacks the discrete boundary required for a
            physics engine to calculate where a character stands or how a car
            collides.
            <strong>Chisel</strong> provides that boundary.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white">Production Handoff</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Every world generated via the Hub includes a Chisel-prepared `.glb`
            file. This allows for instant handoff to Blender, Unity, or robot
            simulators like NVIDIA Isaac Sim.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white">Material Aware</h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Chisel uses semantic hints from the Marble model to vary mesh
            density—higher for intricate architecture, lower for organic
            background features.
          </p>
        </div>
      </div>
    </div>
  );
}
