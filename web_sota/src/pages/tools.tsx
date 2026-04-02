import { Play, Sparkles } from 'lucide-react';

const TOOLS = [
    { name: 'generate_world_from_text', description: 'Create rich 3D environments from simple natural language prompts.' },
    { name: 'generate_world_from_image', description: 'Transform static images or panoramas into high-fidelity spatial worlds.' },
    { name: 'generate_world_from_video', description: 'Reconstruct 3D spaces from cinematic video sequences.' },
    { name: 'export_to_blender', description: 'Seamlessly port generated worlds into Blender with full SPZ/GLB support.' },
    { name: 'export_to_unity3d', description: 'Sync spatial assets directly into your Unity project assets folder.' },
];

export function Tools() {
    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight text-white">Spatial Capability</h2>
                <p className="text-slate-400">Direct access to the Marble AI spatial intelligence pipeline.</p>
            </header>

            <div className="grid gap-6">
                {TOOLS.map((tool) => (
                    <div key={tool.name} className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur-sm group hover:border-cyan-500/50 transition-all">
                        <div className="flex items-center justify-between bg-slate-800/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-cyan-400" />
                                <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">{tool.name}</span>
                            </div>
                            <button className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20">
                                <Play className="h-3 w-3" />
                                INVOKE
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-400">{tool.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
