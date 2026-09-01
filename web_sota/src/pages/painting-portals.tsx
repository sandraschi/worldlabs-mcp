import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Eye, Loader2, Palette, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  type Operation,
  type OperationStreamEvent,
  streamOperation,
} from "@/lib/api";
import { PAINTINGS, type Painting } from "@/lib/paintings";
import { cn } from "@/lib/utils";

export function PaintingPortals() {
  const [activePainting, setActivePainting] = useState<Painting | null>(null);
  const [opId, setOpId] = useState<string | null>(null);
  const [status, setStatus] = useState<OperationStreamEvent | null>(null);
  const [completedWorld, setCompletedWorld] = useState<Operation | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!startTime || completedWorld) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 500);
    return () => clearInterval(interval);
  }, [startTime, completedWorld]);

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  const generateMutation = useMutation({
    mutationFn: async (painting: Painting) => {
      setActivePainting(painting);
      setStatus(null);
      setCompletedWorld(null);
      setOpId(null);
      return api.generateImage(
        painting.imageUrl,
        `${painting.title} by ${painting.artist} (${painting.year}). ${painting.caption}`,
        painting.title,
        "marble-1.1",
        false,
      );
    },
    onSuccess: (data) => {
      setStartTime(Date.now());
      setElapsed(0);
      const operationId = data.operation_id;
      setOpId(operationId);

      streamOperation(
        operationId,
        (event) => {
          setStatus(event);
          if (event.done && event.response) {
            setCompletedWorld({
              ...data,
              done: true,
              response: event.response,
            });
          }
        },
        () => {
          // SSE error — start fallback polling
          const poll = setInterval(async () => {
            try {
              const op = await api.getOperation(operationId);
              setStatus({
                operation_id: operationId,
                done: op.done,
                status:
                  (op.metadata?.progress
                    ?.status as OperationStreamEvent["status"]) ??
                  "IN_PROGRESS",
                description: op.metadata?.progress?.description,
              });
              if (op.done) {
                clearInterval(poll);
                setCompletedWorld(op);
              }
            } catch {
              clearInterval(poll);
            }
          }, 8000);
        },
      );
    },
  });

  const splatUrl =
    completedWorld?.response?._assets?.splat_full ??
    completedWorld?.response?._assets?.splat_500k ??
    completedWorld?.response?.assets?.splats?.spz_urls?.full_res;

  const cancelGeneration = () => {
    setActivePainting(null);
    setOpId(null);
    setStatus(null);
    setCompletedWorld(null);
    setStartTime(null);
    setElapsed(0);
  };

  return (
    <div
      data-testid="painting_portals-page"
      className="space-y-6 page-enter max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Palette className="w-5 h-5 text-white" aria-hidden="true" />
          <span data-testid="painting_portals-extra-2" className="hidden" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Painting Portals</h1>
          <p className="text-sm text-slate-400">
            Step inside famous works of art. Each painting generates a 3D world
            you can walk through.
          </p>
        </div>
      </div>

      {/* Generation progress overlay */}
      {activePainting && (
        <div className="glass-card p-6 border-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-amber-900/60 to-orange-900/60">
              <img
                src={activePainting.imageUrl}
                alt={activePainting.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">
                {activePainting.title}
              </h3>
              <p className="text-xs text-slate-400">
                {activePainting.artist} · {activePainting.year}
              </p>

              {!opId && (
                <div className="flex items-center gap-2 mt-3 text-amber-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Starting generation...
                </div>
              )}

              {opId && !completedWorld && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cosmos-400" />
                    <span className="text-slate-300">
                      {status?.description ||
                        "Generating 3D world from painting..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">
                      {fmtTime(elapsed)}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>Status: {status?.status || "starting"}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cosmos-500 to-amber-500 animate-progress-slide"
                      style={{ width: "35%" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Marble is extrapolating the painted scene into navigable 3D
                    space. Typical generation takes 1–5 minutes depending on
                    scene complexity.
                  </p>
                </div>
              )}

              {completedWorld && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-aurora-400 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    World generated
                  </div>
                  {splatUrl && (
                    <Link
                      to={`/spark-viewer?url=${encodeURIComponent(splatUrl)}&name=${encodeURIComponent(activePainting.title)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Enter the Painting
                    </Link>
                  )}
                </div>
              )}
            </div>
            <button
              data-testid="painting_portals-action"
              onClick={cancelGeneration}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all shrink-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Painting grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {PAINTINGS.map((painting) => {
          const isActive = activePainting?.id === painting.id;
          const isDone = isActive && completedWorld;
          return (
            <button
              key={painting.id}
              onClick={() => !isActive && generateMutation.mutate(painting)}
              disabled={!!isActive && !isDone}
              className={cn(
                "glass-card overflow-hidden text-left group transition-all duration-200",
                "hover:border-amber-500/40 hover:bg-white/[0.06]",
                isActive && !completedWorld && "border-amber-500/30",
                isDone && "border-aurora-500/30",
              )}
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-gradient-to-br from-amber-900/40 to-orange-900/40 relative overflow-hidden">
                <img
                  src={painting.imageUrl}
                  alt={painting.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive && !isDone && "opacity-100 bg-black/50",
                  )}
                >
                  {isActive && !isDone ? (
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span className="text-[10px] text-white font-medium">
                        Generate
                      </span>
                    </div>
                  )}
                </div>
                {isDone && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-aurora-500 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-2.5 space-y-1">
                <h3 className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                  {painting.title}
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  {painting.artist} · {painting.year}
                </p>
                <span className="inline-block text-[9px] text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {painting.style}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-300">How it works:</strong> Each
          painting is fed as an image to the Marble API, which extrapolates the
          2D scene into a navigable 3D Gaussian splat world. Paintings with
          strong perspective, depth cues, and landscape elements produce the
          most immersive results. Uses <strong>marble-1.1</strong> (1500 credits
          per generation — separate from your web subscription).
        </p>
      </div>
    </div>
  );
}
