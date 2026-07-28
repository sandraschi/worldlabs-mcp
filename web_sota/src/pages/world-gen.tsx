import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  ExternalLink,
  Globe2,
  Heart,
  MessageSquare,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  API_BASE,
  type AssetType,
  api,
  type FlatAssets,
  type HandoffRequest,
  type Operation,
  type OperationStreamEvent,
  streamOperation,
  triggerDownload,
} from "@/lib/api";
import { logger } from "@/lib/logger";
import {
  PRESET_CATEGORIES,
  WORLD_PRESETS,
  type WorldPreset,
} from "@/lib/presets";
import { cn } from "@/lib/utils";

const MODELS = ["marble-1.1-plus", "marble-1.1"] as const;
type GenMode = "text" | "image" | "video" | "file";

// ── Generation Modal ──────────────────────────────────────────────────────────

interface GenerationModalProps {
  operationId: string;
  onComplete: (op: Operation) => void;
  onDismiss: () => void;
}

function GenerationModal({
  operationId,
  onComplete,
  onDismiss,
}: GenerationModalProps) {
  const [events, setEvents] = useState<OperationStreamEvent[]>([]);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wall-clock timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // SSE stream
  useEffect(() => {
    const close = streamOperation(
      operationId,
      (event) => {
        logger.info("SSE Event", {
          op_id: event.operation_id,
          status: event.status,
          done: event.done,
          desc: event.description,
        });
        setEvents((prev) => [...prev.slice(-10), event]); // keep last 10
        setElapsed(
          event.elapsed_seconds ??
            Math.floor((Date.now() - startRef.current) / 1000),
        );

        if (event.done) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (event.status === "SUCCEEDED" && event.response) {
            setDone(true);
            // Build a minimal Operation to pass back
            const op: Operation = {
              operation_id: operationId,
              done: true,
              error: null,
              response: event.response,
              metadata: { progress: { status: "SUCCEEDED" } },
            };
            // Small delay so user sees the success state
            setTimeout(() => onComplete(op), 1200);
          } else {
            setFailed(true);
          }
        }
      },
      () => {
        logger.warn("SSE Disconnected - Falling back to polling", {
          operationId,
        });
        // SSE error — fall back to polling via getOperation
        const pollId = setInterval(async () => {
          try {
            const op = await api.getOperation(operationId);
            logger.info("Poll Update", {
              id: operationId,
              done: op.done,
              status: op.metadata?.progress?.status,
            });
            const prog = op.metadata?.progress;
            const ev: OperationStreamEvent = {
              operation_id: operationId,
              done: op.done,
              status: prog?.status ?? "IN_PROGRESS",
              description: prog?.description,
            };
            setEvents((prev) => [...prev.slice(-10), ev]);
            if (op.done) {
              clearInterval(pollId);
              if (timerRef.current) clearInterval(timerRef.current);
              if (!op.error) {
                setDone(true);
                setTimeout(() => onComplete(op), 1200);
              } else {
                setFailed(true);
              }
            }
          } catch {
            // keep trying
          }
        }, 8000);
      },
    );
    return close;
  }, [operationId, onComplete]);

  const lastEvent = events[events.length - 1];
  const description =
    lastEvent?.description ?? "Initialising generation pipeline…";
  const status = lastEvent?.status ?? "IN_PROGRESS";

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${s}s`;
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all duration-300",
          done
            ? "border-aurora-500/50 bg-aurora-950/80 shadow-aurora-500/20"
            : failed
              ? "border-red-500/50 bg-red-950/60"
              : "border-cosmos-500/30 bg-slate-950/90",
        )}
      >
        {/* Close button — only when done or failed */}
        {(done || failed) && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-5">
          {done ? (
            <CheckCircle className="w-12 h-12 text-aurora-400" />
          ) : failed ? (
            <AlertCircle className="w-12 h-12 text-red-400" />
          ) : (
            <div className="relative">
              <Globe2 className="w-12 h-12 text-cosmos-400" />
              <RefreshCw className="absolute -bottom-1 -right-1 w-5 h-5 text-cosmos-300 animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-center text-lg font-bold text-white mb-1">
          {done
            ? "World Ready!"
            : failed
              ? "Generation Failed"
              : "Generating World…"}
        </h3>

        {/* Status message */}
        <p className="text-center text-sm text-slate-400 mb-5 min-h-[2.5rem] leading-relaxed px-2">
          {done
            ? "Your 3D world has been created. Opening now…"
            : failed
              ? (lastEvent?.description ??
                "An error occurred during generation.")
              : description}
        </p>

        {/* Animated progress bar (indeterminate while running) */}
        {!done && !failed && (
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-5">
            <div className="h-full w-1/3 rounded-full bg-cosmos-500 animate-[progress-slide_1.8s_ease-in-out_infinite]" />
          </div>
        )}
        {done && (
          <div className="w-full h-1.5 rounded-full bg-aurora-500/60 mb-5" />
        )}

        {/* Elapsed / op id */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {fmtElapsed(elapsed)} elapsed
          </span>
          <span
            className="font-mono truncate max-w-[160px]"
            title={operationId}
          >
            {operationId.slice(0, 16)}…
          </span>
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
              done
                ? "bg-aurora-500/20 text-aurora-300"
                : failed
                  ? "bg-red-500/20 text-red-300"
                  : "bg-cosmos-500/20 text-cosmos-300",
            )}
          >
            {done ? "SUCCEEDED" : failed ? "FAILED" : status.replace("_", " ")}
          </span>
        </div>

        {/* Dismiss button when failed */}
        {failed && (
          <button
            onClick={onDismiss}
            className="mt-5 w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.09] text-sm text-slate-300 hover:text-white transition-all"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

// ── Prompt Memory Card ────────────────────────────────────────────────────────

function PromptCard({
  prompt,
  onApply,
  onUpdate,
  onDelete,
}: {
  prompt: any;
  onApply: (text: string) => void;
  onUpdate: (id: string, update: any) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [comment, setComment] = useState(prompt.comment);

  return (
    <div className="glass-card p-4 space-y-3 group border-white/[0.05] hover:border-cosmos-500/30 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cosmos-400 bg-cosmos-500/10 px-1.5 py-0.5 rounded">
            {prompt.style}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(prompt.timestamp).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onUpdate(prompt.id, { fave: !prompt.fave })}
            className={cn(
              "p-1 rounded hover:bg-white/10 transition-colors",
              prompt.fave ? "text-pink-500" : "text-slate-400",
            )}
            aria-label="Favorite"
            title="Favorite"
          >
            <Heart
              className={cn("w-3.5 h-3.5", prompt.fave && "fill-current")}
            />
          </button>
          <button
            onClick={() => onUpdate(prompt.id, { star: !prompt.star })}
            className={cn(
              "p-1 rounded hover:bg-white/10 transition-colors",
              prompt.star ? "text-amber-400" : "text-slate-400",
            )}
            aria-label="Star"
            title="Star"
          >
            <Star
              className={cn("w-3.5 h-3.5", prompt.star && "fill-current")}
            />
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-300 line-clamp-3 italic leading-relaxed">
        "{prompt.text}"
      </p>

      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex-1">
          {isEditingComment ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={() => {
                  onUpdate(prompt.id, { comment });
                  setIsEditingComment(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdate(prompt.id, { comment });
                    setIsEditingComment(false);
                  }
                }}
                className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[10px] text-slate-300 w-full outline-none focus:border-cosmos-500/50"
                placeholder="Add a comment..."
              />
            </div>
          ) : (
            <button
              onClick={() => setIsEditingComment(true)}
              className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-400 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              {prompt.comment || "Add a comment"}
            </button>
          )}
        </div>
        <button
          onClick={() => onApply(prompt.text)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-medium text-slate-300 hover:text-white transition-all border border-white/[0.08]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ── Style Gallery Modal ───────────────────────────────────────────────────────

function StyleGallery({
  onSelect,
  onDismiss,
}: {
  onSelect: (preset: WorldPreset) => void;
  onDismiss: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const filtered = categoryFilter
    ? WORLD_PRESETS.filter((p) => p.categories.includes(categoryFilter))
    : WORLD_PRESETS;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmos-400" />
              Style Gallery
            </h3>
            <p className="text-sm text-slate-400">
              Select a creative preset to instantly build your new world.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Category filter chips */}
        <div className="flex gap-1.5 px-6 pt-4 pb-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter(null)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border",
              categoryFilter === null
                ? "bg-cosmos-600/30 border-cosmos-500/40 text-cosmos-300"
                : "bg-white/[0.04] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.1]",
            )}
          >
            All
          </button>
          {PRESET_CATEGORIES.map((cat) => {
            const count = WORLD_PRESETS.filter((p) =>
              p.categories.includes(cat),
            ).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? null : cat)
                }
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border",
                  categoryFilter === cat
                    ? "bg-cosmos-600/30 border-cosmos-500/40 text-cosmos-300"
                    : "bg-white/[0.04] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.1]",
                )}
              >
                {cat} {count}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">
              No presets match this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="glass-card p-5 text-left group hover:border-cosmos-500/50 hover:shadow-cosmos-500/10 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cosmos-400 bg-cosmos-500/10 px-2 py-0.5 rounded-full">
                      {p.style}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cosmos-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cosmos-300 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {p.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[9px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="text-[10px] text-slate-600 font-mono italic truncate bg-black/30 rounded p-1.5 min-h-[3rem]">
                      "{p.prompt}"
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <footer className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 italic">
            Styles leverage Marble 1.1 PRO auto-expansion for maximum fidelity.
          </p>
        </footer>
      </div>
    </div>
  );
}

// ── Asset Panel ───────────────────────────────────────────────────────────────

function AssetPanel({ op, assets }: { op: Operation; assets: FlatAssets }) {
  const worldId = op.response?.id ?? op.metadata?.world_id ?? "";
  const worldName = op.response?.display_name ?? `World_${worldId.slice(0, 8)}`;
  const [exportState, setExportState] = useState<
    Record<string, "idle" | "loading" | "ok" | "error">
  >({});

  const setEs = (key: string, s: "idle" | "loading" | "ok" | "error") =>
    setExportState((p) => ({ ...p, [key]: s }));

  async function handleHandoff(
    target: "resonite" | "unity3d" | "blender",
    type: "splat" | "mesh",
  ) {
    const key = `${target}-${type}`;
    setEs(key, "loading");
    try {
      const assetUrl =
        type === "splat" ? assets.splat_500k || assets.splat_full : assets.mesh;
      if (!assetUrl) throw new Error(`${type} asset not found`);

      const req: HandoffRequest = {
        world_id: worldId,
        target,
        asset_type: type,
        asset_url: assetUrl,
      };
      const res = await api.handoffAsset(req);
      setEs(key, res.status === "ok" ? "ok" : "error");
    } catch {
      setEs(key, "error");
    }
    setTimeout(() => setEs(key, "idle"), 3500);
  }

  const downloads: Array<{ key: AssetType; label: string; hint: string }> = [
    { key: "rad", label: "RAD (Spark 2.0)", hint: "Progressive High-Res" },
    { key: "ksplat", label: "KSPLAT", hint: "Optimized VR/Mobile" },
    { key: "splat_100k", label: "SPZ 100k", hint: "Fast preview" },
    { key: "splat_500k", label: "SPZ 500k", hint: "Balanced" },
    { key: "splat_full", label: "SPZ Full", hint: "Max quality" },
    { key: "mesh", label: "GLB Mesh", hint: "Collider" },
    { key: "panorama", label: "Panorama", hint: "360° image" },
  ];

  const handoffs: Array<{
    target: "resonite" | "unity3d" | "blender";
    label: string;
    icon: string;
  }> = [
    { target: "resonite", label: "Resonite", icon: "🌐" },
    { target: "unity3d", label: "Unity3D", icon: "🎮" },
    { target: "blender", label: "Blender", icon: "🎨" },
  ];

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4 space-y-4">
      {/* Downloads */}
      <div>
        <p className="section-label mb-2">Download assets</p>
        <div className="flex flex-wrap gap-2">
          {downloads.map(({ key, label, hint }) => {
            const url = assets[key];
            if (!url) return null;
            return (
              <button
                key={key}
                onClick={() => triggerDownload(worldId, key, url)}
                title={hint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.07] hover:border-cosmos-500/40 text-xs text-slate-300 hover:text-white transition-all"
              >
                <Download className="w-3 h-3" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Handoff */}
      <div>
        <p className="section-label mb-2">Smart Handoff (Cross-MCP)</p>
        <div className="flex flex-wrap gap-2">
          {handoffs.map(({ target, label, icon }) => {
            const splatKey = `${target}-splat`;
            const meshKey = `${target}-mesh`;
            const splatState = exportState[splatKey] ?? "idle";
            const meshState = exportState[meshKey] ?? "idle";

            return (
              <div
                key={target}
                className="flex gap-1 p-0.5 bg-white/[0.03] rounded-lg border border-white/[0.06]"
              >
                <div className="px-2 py-1.5 flex items-center gap-1.5 border-r border-white/[0.06]">
                  <span className="text-xs">{icon}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <div className="flex gap-1 p-0.5">
                  <button
                    onClick={() => handleHandoff(target, "splat")}
                    disabled={
                      splatState === "loading" ||
                      !(assets.splat_500k || assets.splat_full)
                    }
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-all",
                      splatState === "loading" &&
                        "opacity-60 cursor-not-allowed",
                      splatState === "ok" && "bg-aurora-500/20 text-aurora-300",
                      splatState === "error" && "bg-red-500/20 text-red-300",
                      splatState === "idle" &&
                        "hover:bg-white/[0.08] text-slate-350 hover:text-white",
                      !(assets.splat_500k || assets.splat_full) && "opacity-30",
                    )}
                  >
                    Splat
                  </button>
                  <button
                    onClick={() => handleHandoff(target, "mesh")}
                    disabled={meshState === "loading" || !assets.mesh}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-all",
                      meshState === "loading" &&
                        "opacity-60 cursor-not-allowed",
                      meshState === "ok" && "bg-aurora-500/20 text-aurora-300",
                      meshState === "error" && "bg-red-500/20 text-red-300",
                      meshState === "idle" &&
                        "hover:bg-white/[0.08] text-slate-350 hover:text-white",
                      !assets.mesh && "opacity-30",
                    )}
                  >
                    Mesh
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Viewers */}
      <div className="flex flex-wrap gap-2 pt-2">
        {assets.mesh && (
          <a
            href={op.response?.world_marble_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cosmos-600/20 hover:bg-cosmos-600/30 border border-cosmos-500/30 text-xs text-cosmos-300 hover:text-cosmos-200 transition-all"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            View in Marble
          </a>
        )}
        {(assets.splat_500k || assets.splat_full) && (
          <a
            href={`/library?url=${encodeURIComponent(assets.splat_500k ?? assets.splat_full ?? "")}&name=${encodeURIComponent(worldName)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-void-600/20 hover:bg-void-600/30 border border-void-500/30 text-xs text-void-300 hover:text-void-200 transition-all"
          >
            <Globe2 className="w-3 h-3" aria-hidden="true" />
            Legacy Viewer
          </a>
        )}
        {(assets.rad ||
          assets.ksplat ||
          assets.splat_500k ||
          assets.splat_full) && (
          <a
            href={`/spark-viewer?url=${encodeURIComponent(assets.rad ?? assets.ksplat ?? assets.splat_500k ?? assets.splat_full ?? "")}&name=${encodeURIComponent(worldName)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aurora-600/20 hover:bg-aurora-600/30 border border-aurora-500/30 text-xs text-aurora-300 hover:text-aurora-200 transition-all shadow-[0_0_10px_-2px_rgba(74,222,128,0.2)]"
          >
            <Zap className="w-3 h-3" aria-hidden="true" />
            Spark 2.0 (High-Fidelity)
          </a>
        )}
      </div>
    </div>
  );
}

// ── Operation card ────────────────────────────────────────────────────────────

function OperationCard({
  op,
  onRemove,
}: {
  op: Operation;
  onRemove: () => void;
}) {
  const isDone = op.done;
  const assets = op.response?._assets;
  const progress = op.metadata?.progress;
  const status = isDone
    ? op.error
      ? "FAILED"
      : "SUCCEEDED"
    : progress?.status || "IN_PROGRESS";

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all duration-500",
        isDone && !op.error
          ? "border-aurora-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]"
          : "",
        op.error ? "border-red-500/30" : "",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div className="mt-1">
            {status === "SUCCEEDED" ? (
              <Zap className="w-4 h-4 text-aurora-400" aria-hidden="true" />
            ) : status === "FAILED" ? (
              <AlertCircle
                className="w-4 h-4 text-red-400"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw
                className="w-4 h-4 text-cosmos-400 animate-spin"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-white truncate">
              {op.response?.display_name ||
                `World ${op.operation_id.slice(0, 8)}`}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                  status === "SUCCEEDED"
                    ? "bg-aurora-500/20 text-aurora-300"
                    : status === "FAILED"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-cosmos-500/20 text-cosmos-300",
                )}
              >
                {status.replace("_", " ")}
              </span>
              {progress?.description && (
                <span className="text-xs text-slate-400 truncate">
                  {progress.description}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="Remove operation"
        >
          <ChevronDown className="w-4 h-4 rotate-45" />
        </button>
      </div>

      {isDone && !op.error && assets && <AssetPanel op={op} assets={assets} />}

      {op.error && (
        <div className="mt-4 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed">
          <strong>Error:</strong> {op.error}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorldGenPage() {
  const [mode, setMode] = useState<GenMode>("text");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] =
    useState<(typeof MODELS)[number]>("marble-1.1-plus");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPanorama, setIsPanorama] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [showGallery, setShowGallery] = useState(false);

  const [operations, setOperations] = useState<Operation[]>([]);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  // Active generation modal
  const [activeOpId, setActiveOpId] = useState<string | null>(null);

  // Load history on mount
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["operation-history"],
    queryFn: () => api.getHistory(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (historyData) {
      setOperations(historyData);
      // Resume polling for unfinished operations (no modal — background only)
      const unfinished = historyData
        .filter((op) => !op.done)
        .map((op) => op.operation_id);
      if (unfinished.length > 0) {
        setPollingIds((prev) => new Set([...prev, ...unfinished]));
      }
    }
  }, [historyData]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt, mode]);

  const addOp = useCallback((op: Operation) => {
    setOperations((prev) => [op, ...prev]);
  }, []);

  const updateOp = useCallback((updated: Operation) => {
    setOperations((prev) =>
      prev.map((o) => (o.operation_id === updated.operation_id ? updated : o)),
    );
  }, []);

  const removeOp = (id: string) => {
    setOperations((prev) => prev.filter((o) => o.operation_id !== id));
    setPollingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Background polling for operations loaded from history (no active modal)
  useEffect(() => {
    if (pollingIds.size === 0) return;

    const interval = setInterval(async () => {
      for (const id of pollingIds) {
        // Skip if modal is handling it live
        if (id === activeOpId) continue;
        try {
          const op = await api.getOperation(id);
          updateOp(op);
          if (op.done) {
            setPollingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        } catch (err) {
          logger.error("Background poll failed", { error: err });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pollingIds, activeOpId, updateOp]);

  // LLM refinement
  const { data: llmInfo } = useQuery({
    queryKey: ["llm-discovery"],
    queryFn: () => api.discoverLlms(),
    staleTime: 60000,
  });

  const [selectedLlm, setSelectedLlm] = useState<{
    provider: string;
    id: string;
  } | null>(null);

  const availableModels = useMemo(() => {
    if (!llmInfo) return [];
    const ollama = (llmInfo.ollama?.models || []).map((m) => ({
      ...m,
      name: `Ollama: ${m.name}`,
    }));
    const lms = (llmInfo.lmstudio?.models || []).map((m) => ({
      ...m,
      name: `LM Studio: ${m.name}`,
    }));
    return [...ollama, ...lms];
  }, [llmInfo]);

  useEffect(() => {
    if (availableModels.length > 0 && !selectedLlm) {
      setSelectedLlm({
        provider: availableModels[0].provider,
        id: availableModels[0].id,
      });
    }
  }, [availableModels, selectedLlm]);

  const refineMutation = useMutation({
    mutationFn: () =>
      api.refinePrompt({
        prompt,
        style: selectedStyle,
        provider: selectedLlm?.provider || "",
        model: selectedLlm?.id || "",
      }),
    onSuccess: (data) => {
      setPrompt(data.refined);
    },
  });

  // Generation: fire-and-forget — immediately open modal with the operation_id
  const genMutation = useMutation({
    mutationFn: async () => {
      if (mode === "text") return api.generateText(prompt, displayName, model);
      if (mode === "image")
        return api.generateImage(
          imageUrl,
          prompt,
          displayName,
          model,
          isPanorama,
        );
      if (mode === "video")
        return api.generateVideo(videoUrl, prompt, displayName, model);
      if (mode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (prompt) formData.append("prompt", prompt);
        if (displayName) formData.append("name", displayName);
        formData.append("model", model);
        formData.append("is_panorama", String(isPanorama));
        const res = await fetch(API_BASE + "/api/generate/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok)
          throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
        return res.json();
      }
      throw new Error("No input provided");
    },
    onSuccess: (op) => {
      addOp({ ...op, done: false });
      setActiveOpId(op.operation_id);
      setPrompt("");
      setImageUrl("");
      setVideoUrl("");
      setSelectedFile(null);
      setDisplayName("");
    },
  });

  // Called when modal reports completion
  const handleModalComplete = useCallback(
    (completedOp: Operation) => {
      updateOp(completedOp);
      setActiveOpId(null);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateOp],
  );

  const handleModalDismiss = useCallback(() => {
    setActiveOpId(null);
  }, []);

  // Prompt Library
  const { data: savedPrompts, refetch: refetchPrompts } = useQuery({
    queryKey: ["saved-prompts"],
    queryFn: () => api.getPrompts(),
  });

  const savePromptMutation = useMutation({
    mutationFn: (text: string) =>
      api.createPrompt({ text, style: selectedStyle }),
    onSuccess: () => refetchPrompts(),
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: any }) =>
      api.updatePrompt(id, update),
    onSuccess: () => refetchPrompts(),
  });

  const deletePromptMutation = useMutation({
    mutationFn: (id: string) => api.deletePrompt(id),
    onSuccess: () => refetchPrompts(),
  });

  const [showLibrary, setShowLibrary] = useState(false);

  const canGenerate =
    !genMutation.isPending &&
    ((mode === "text" && !!prompt.trim()) ||
      (mode === "image" && !!imageUrl.trim()) ||
      (mode === "video" && !!videoUrl.trim()) ||
      (mode === "file" && !!selectedFile));

  return (
    <>
      {/* Generation Modal — rendered outside scroll container */}
      {activeOpId && (
        <GenerationModal
          operationId={activeOpId}
          onComplete={handleModalComplete}
          onDismiss={handleModalDismiss}
        />
      )}

      {/* Style Gallery Modal */}
      {showGallery && (
        <StyleGallery
          onDismiss={() => setShowGallery(false)}
          onSelect={(p) => {
            setPrompt(p.prompt);
            setSelectedStyle(p.style);
            setModel(p.model);
            setShowGallery(false);
            logger.info("Applied world preset", { preset: p.name });
          }}
        />
      )}

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto custom-scrollbar p-6"
      >
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmos-500 to-void-600 flex items-center justify-center shadow-lg shadow-cosmos-500/20">
              <Globe2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">
                World Generation
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Generate 3D worlds with the Marble API
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card p-5 space-y-4">
            {/* Mode tabs */}
            <div
              className="flex gap-1 p-1 bg-black/20 rounded-lg w-fit"
              role="tablist"
              aria-label="Generation mode"
            >
              {(["text", "image", "video", "file"] as GenMode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m ? "true" : "false"}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                    mode === m
                      ? "bg-cosmos-600 text-white shadow"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Model selector */}
            <div className="flex gap-2 flex-wrap">
              {MODELS.map((m) => (
                <button
                  key={m}
                  aria-pressed={model === m ? "true" : "false"}
                  onClick={() => setModel(m)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                    model === m
                      ? "border-cosmos-500/60 bg-cosmos-600/20 text-cosmos-300"
                      : "border-white/[0.08] text-slate-500 hover:text-slate-300",
                  )}
                >
                  {m.includes("plus") ? (
                    <Zap className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <Cpu className="w-3 h-3" aria-hidden="true" />
                  )}
                  {m}
                </button>
              ))}
            </div>

            {/* Text prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="section-label">Prompt</label>
                {availableModels.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Select style"
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="bg-black/40 border border-white/[0.08] rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-cosmos-500/50"
                    >
                      {[
                        "Cinematic",
                        "Cyberpunk",
                        "Photorealistic",
                        "Surreal",
                        "Vibrant",
                        "Dark",
                        "Ethereal",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Select local LLM for prompt refinement"
                      value={
                        selectedLlm
                          ? `${selectedLlm.provider}:${selectedLlm.id}`
                          : ""
                      }
                      onChange={(e) => {
                        const [provider, ...idParts] =
                          e.target.value.split(":");
                        setSelectedLlm({ provider, id: idParts.join(":") });
                      }}
                      className="bg-black/40 border border-white/[0.08] rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-cosmos-500/50"
                    >
                      {availableModels.map((m) => (
                        <option
                          key={`${m.provider}:${m.id}`}
                          value={`${m.provider}:${m.id}`}
                        >
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => savePromptMutation.mutate(prompt)}
                      disabled={!prompt.trim() || savePromptMutation.isPending}
                      title="Save to Library"
                      className={cn(
                        "p-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white transition-all",
                        (!prompt.trim() || savePromptMutation.isPending) &&
                          "opacity-50 cursor-not-allowed",
                      )}
                      aria-label="Save current prompt to library"
                    >
                      <Save className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setShowGallery(true)}
                      title="Browse Styles"
                      className="p-1.5 rounded bg-void-600/20 hover:bg-void-600/30 border border-void-500/30 text-void-400 hover:text-void-200 transition-all flex items-center gap-1.5 px-2.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Styles
                      </span>
                    </button>
                    <button
                      onClick={() => refineMutation.mutate()}
                      disabled={!prompt.trim() || refineMutation.isPending}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded bg-cosmos-600/20 hover:bg-cosmos-600/30 border border-cosmos-500/30 text-xs text-cosmos-300 transition-all",
                        (refineMutation.isPending || !prompt.trim()) &&
                          "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {refineMutation.isPending ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Refine
                    </button>
                  </div>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === "text"
                    ? "Describe the world to generate…"
                    : "Optional: describe adjustments…"
                }
                rows={3}
                className="input-glass resize-none overflow-hidden min-h-[80px]"
                aria-label="World description prompt"
              />
              {refineMutation.error instanceof Error && (
                <p className="text-[10px] text-red-400 mt-1">
                  {refineMutation.error.message}
                </p>
              )}
            </div>

            {/* Media URL (image / video) / File upload */}
            {mode !== "text" && (
              <div className="space-y-2">
                {mode === "file" ? (
                  <>
                    <label className="section-label">Photo / Video File</label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files[0];
                        if (f) setSelectedFile(f);
                      }}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                        selectedFile
                          ? "border-cosmos-500/40 bg-cosmos-500/5"
                          : "border-white/[0.08] hover:border-cosmos-500/30 hover:bg-white/[0.03]",
                      )}
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*,video/*,.jpg,.jpeg,.png,.webp,.mp4,.mov,.mkv,.avi,.webm"
                        className="hidden"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] ?? null)
                        }
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-cosmos-300 truncate max-w-xs mx-auto">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload
                            className="w-8 h-8 text-slate-500 mx-auto"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-slate-400">
                            Drop a file here or click to browse
                          </p>
                          <p className="text-xs text-slate-600">
                            Supports JPG, PNG, WebP, MP4, MOV, MKV
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="section-label">
                      {mode === "image" ? "Image URL" : "Video URL"}
                    </label>
                    <input
                      type="url"
                      value={mode === "image" ? imageUrl : videoUrl}
                      onChange={(e) =>
                        mode === "image"
                          ? setImageUrl(e.target.value)
                          : setVideoUrl(e.target.value)
                      }
                      placeholder={`Paste ${mode} URL here…`}
                      className="input-glass"
                      aria-label={`${mode} source URL`}
                    />
                  </>
                )}
                {mode !== "text" && (
                  <label className="flex items-center gap-2 cursor-pointer group mt-1">
                    <div
                      onClick={() => setIsPanorama(!isPanorama)}
                      className={cn(
                        "w-3.5 h-3.5 rounded border border-white/20 transition-all flex items-center justify-center",
                        isPanorama
                          ? "bg-cosmos-500 border-cosmos-500"
                          : "bg-black/40 group-hover:border-white/40",
                      )}
                    >
                      {isPanorama && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                      Source is a 360° panorama
                    </span>
                  </label>
                )}
              </div>
            )}

            {/* Display name */}
            <div className="space-y-2">
              <label className="section-label">Display Name (Optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Amazing World"
                className="input-glass"
                aria-label="World display name"
              />
            </div>

            {/* Submit */}
            <button
              onClick={() => genMutation.mutate()}
              disabled={!canGenerate}
              className={cn(
                "btn-primary w-full py-2.5 shadow-cosmos-500/10",
                !canGenerate && "opacity-50 cursor-not-allowed",
              )}
            >
              {genMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate World
                </>
              )}
            </button>
            {genMutation.error instanceof Error && (
              <p className="text-xs text-red-400 mt-2 text-center">
                {genMutation.error.message}
              </p>
            )}
          </div>

          {/* Operations & Library Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLibrary(false)}
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest pb-1 transition-all",
                    !showLibrary
                      ? "text-white border-b-2 border-cosmos-500"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  Operations
                  {operations.some((o) => !o.done) && (
                    <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-cosmos-400 animate-pulse align-middle" />
                  )}
                </button>
                <button
                  onClick={() => setShowLibrary(true)}
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest pb-1 transition-all",
                    showLibrary
                      ? "text-white border-b-2 border-cosmos-500"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  Prompt Library
                  {savedPrompts && savedPrompts.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-cosmos-500/20 text-cosmos-400 text-[10px]">
                      {savedPrompts.length}
                    </span>
                  )}
                </button>
              </div>
              {isHistoryLoading && !showLibrary && (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              )}
            </div>

            {!showLibrary ? (
              <div className="space-y-4">
                {operations.length === 0 ? (
                  <div className="glass-card py-12 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                      <Globe2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500">
                      No active or past operations.
                    </p>
                    <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
                      Your generated worlds will appear here once you start.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {operations.map((op) => (
                      <OperationCard
                        key={op.operation_id}
                        op={op}
                        onRemove={() => removeOp(op.operation_id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!savedPrompts || savedPrompts.length === 0 ? (
                  <div className="glass-card py-12 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                      <Save className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500">
                      Your library is empty.
                    </p>
                    <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
                      Click the <Save className="w-2.5 h-2.5 inline" /> icon
                      after refining a prompt to save it here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedPrompts.map((p) => (
                      <PromptCard
                        key={p.id}
                        prompt={p}
                        onApply={(text) => {
                          setPrompt(text);
                          setShowLibrary(false);
                          scrollRef.current?.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        onUpdate={(id, update) =>
                          updatePromptMutation.mutate({ id, update })
                        }
                        onDelete={(id) => deletePromptMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
