import {
  BookOpen,
  Box,
  Globe,
  Layers,
  Mic,
  Palette,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface ToolInfo {
  name: string;
  description?: string;
  annotations?: string;
}

const FALLBACK_SKILLS: ToolInfo[] = [
  {
    name: "generate_world_from_text",
    description: "Text prompt to 3D world (Marble 1.1)",
  },
  { name: "generate_world_from_image", description: "Single image to world" },
  {
    name: "generate_world_from_multi_image",
    description: "2-8 images + azimuths to world",
  },
  { name: "generate_world_from_video", description: "Video to world" },
  {
    name: "upload_and_generate",
    description: "Local file end-to-end generation",
  },
  { name: "prepare_media_upload", description: "Get signed GCS upload URL" },
  { name: "get_operation", description: "Poll generation status" },
  { name: "wait_for_world", description: "Blocking poll until completed" },
  { name: "list_worlds", description: "Paginated world library" },
  { name: "get_world", description: "Full world detail with SPZ/GLB assets" },
  { name: "delete_world", description: "Remove a world" },
  {
    name: "broadcast_spatial_notification",
    description: "TTS at 3D coordinate (edge-tts)",
  },
  {
    name: "broadcast_spatial_audio",
    description: "Ambient audio at coordinate",
  },
  { name: "place_world_tv", description: "Virtual 16:9 screen in scene" },
  { name: "spawn_agent_avatar", description: "Humanoid GLB avatar placement" },
  {
    name: "refine_with_local_llm",
    description: "Expand prompt via Ollama/LM Studio",
  },
  { name: "gallery_explore", description: "Browse Marble Community Gallery" },
  { name: "worldlabs_help", description: "Structured API reference" },
  { name: "show_worlds_card", description: "Prefab: rich world library card" },
];

const iconFor = (name: string) => {
  if (name.includes("generate") || name.includes("upload")) return Wrench;
  if (name.includes("world") || name.includes("operation")) return Globe;
  if (name.includes("spatial") || name.includes("broadcast")) return Mic;
  if (name.includes("gallery") || name.includes("palette")) return Palette;
  if (name.includes("spark") || name.includes("splat")) return Sparkles;
  if (name.includes("avatar") || name.includes("tv")) return Box;
  if (name.includes("help") || name.includes("card")) return BookOpen;
  return Layers;
};

export function SkillsPage() {
  const [tools, setTools] = useState<ToolInfo[]>(FALLBACK_SKILLS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/capabilities`)
      .then((r) => r.json())
      .then((d: { tools?: ToolInfo[]; tool_count?: number }) => {
        if (Array.isArray(d.tools) && d.tools.length > 0) setTools(d.tools);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Also try /api/skills
    fetch(`${API_BASE}/api/skills`)
      .then((r) => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d) && d.length > 0) {
          setTools(
            (d as ToolInfo[]).map((t) =>
              typeof t === "string" ? { name: t } : t,
            ),
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6" data-testid="skills-page">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cosmos-400" /> Skills & Tools
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          19 MCP tools + REST bridge. Skills are used as the system preprompt
          for Chat (skill-first architecture).
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
          Loading...
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-xl">
          <p className="text-sm text-slate-400">
            No skills found. Is the backend running on :10865?
          </p>
          <p className="text-xs text-slate-500 mt-1">
            GET /api/capabilities should return the tool list.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          data-testid="skills-list"
        >
          {tools.map((t) => {
            const Icon = iconFor(t.name);
            return (
              <div
                key={t.name}
                data-testid={`skill-${t.name}`}
                className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-cosmos-500/20 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cosmos-500/20 border border-cosmos-500/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-cosmos-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-mono font-medium text-white truncate">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {t.description || "MCP tool"}
                    </div>
                    {t.annotations && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        {t.annotations}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> How skills are used
        </h3>
        <p className="text-xs text-amber-200/70 mt-1">
          The Chat page fetches{" "}
          <code className="bg-white/10 px-1 rounded">
            GET /api/capabilities
          </code>{" "}
          and <code className="bg-white/10 px-1 rounded">GET /api/skills</code>{" "}
          on mount and composes the skill list into the system prompt together
          with the selected personality. This is the fleet skill-first pattern
          per{" "}
          <code className="bg-white/10 px-1 rounded">
            chat_skills_prefab_standard.md
          </code>{" "}
          §1.2.
        </p>
      </div>
    </div>
  );
}

export default SkillsPage;
