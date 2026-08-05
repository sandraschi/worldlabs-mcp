import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Operation } from "@/lib/api";

interface PaintingFile {
  name: string;
  filename: string;
  path: string;
  url: string;
}

function PaintingGrid({
  files,
  onPick,
}: {
  files: PaintingFile[];
  onPick: (f: PaintingFile) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      data-testid="paintings-grid"
    >
      {files.map((f) => (
        <button
          key={f.path}
          onClick={() => onPick(f)}
          className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-aurora-500/40 transition-all aspect-[4/5]"
          title={`${f.name} - generate a 3D world from this painting`}
        >
          <img
            src={f.url}
            alt={f.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
            <span className="text-[10px] text-slate-200 line-clamp-1 font-medium">
              {f.name}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function LocalPaintings() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PaintingFile | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [opId, setOpId] = useState<string | null>(null);
  const [opStatus, setOpStatus] = useState<string | null>(null);
  const [worldUrl, setWorldUrl] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["paintings"],
    queryFn: api.paintingsList,
    staleTime: 60_000,
  });

  const artists = useMemo(() => {
    if (!data?.artists) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.artists;
    return data.artists
      .map((a) => ({
        ...a,
        files: a.files.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            a.artist.toLowerCase().includes(q),
        ),
      }))
      .filter((a) => a.files.length > 0);
  }, [data, search]);

  // Poll a running generation
  useEffect(() => {
    if (!opId) return;
    const iv = setInterval(async () => {
      try {
        const op: Operation = await api.getOperation(opId);
        setOpStatus(
          op.metadata?.progress?.description ??
            op.metadata?.progress?.status ??
            "generating",
        );
        if (op.done) {
          clearInterval(iv);
          setGenerating(false);
          setOpStatus("done");
          const wurl = op.response?.world_marble_url;
          if (wurl) setWorldUrl(wurl);
        }
      } catch {
        // keep polling
      }
    }, 4000);
    return () => clearInterval(iv);
  }, [opId]);

  const pick = useCallback((f: PaintingFile) => {
    setSelected(f);
    setPrompt(`Painting: ${f.name} by ${f.path.split("/")[0]}.`);
    setOpId(null);
    setOpStatus(null);
    setWorldUrl(null);
  }, []);

  const generate = async () => {
    if (!selected) return;
    setGenerating(true);
    setWorldUrl(null);
    try {
      const op = await api.paintingGenerate({
        path: selected.path,
        prompt,
        name: selected.name,
      });
      setOpId(op.operation_id);
      setOpStatus(op.metadata?.progress?.description ?? "queued");
    } catch {
      setOpStatus("Generation request failed");
      setGenerating(false);
    }
  };

  return (
    <div
      className="space-y-4 page-enter max-w-6xl mx-auto pb-20"
      data-testid="paintings-page"
    >
      {/* Hero */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cosmos-600/10 via-transparent to-aurora-600/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmos-500 to-aurora-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Local Paintings</h1>
            <p className="text-sm text-slate-400">
              Your painting collection ({data?.artist_count ?? "?"} artists) —
              pick any work and generate a 3D world from it.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search paintings or artists..."
          data-testid="paintings-search"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cosmos-500/50"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-16 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Scanning painting collection...
        </div>
      ) : isError || !data || data.status !== "ok" ? (
        <div className="glass-card p-6 text-xs text-red-400">
          Could not load the painting collection. Check PAINTINGS_DIR on the
          backend.
        </div>
      ) : (
        <div className="space-y-8">
          {artists.length === 0 && (
            <div className="glass-card p-8 text-center text-xs text-slate-500">
              No paintings match "{search}".
            </div>
          )}
          {artists.map((a) => (
            <section key={a.artist}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cosmos-400" />
                {a.artist}
                <span className="text-slate-600 font-mono">({a.count})</span>
              </h2>
              <PaintingGrid files={a.files} onPick={pick} />
            </section>
          ))}
        </div>
      )}

      {/* Detail / generation modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          data-testid="painting-detail"
        >
          <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {selected.name}
                </h2>
                <p className="text-[10px] text-slate-500 font-mono">
                  {selected.path}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img
              src={selected.url}
              alt={selected.name}
              className="w-full max-h-[50vh] object-contain rounded-xl border border-white/[0.06]"
            />

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Painting name and artist are always included. Add style, atmosphere, scene focus..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurora-500/50"
            />
            <p className="text-[10px] text-slate-600">
              The painting title and artist are always sent. Marble recaptions
              prompts server-side and may filter some names (e.g. artists with
              active estates like H.R. Giger) — rejections surface the API's
              message.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={generate}
                disabled={generating || !!opId}
                data-testid="painting-generate"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-aurora-600 to-cosmos-600 text-white hover:from-aurora-500 hover:to-cosmos-500 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {opId ? "Generating..." : "Generate 3D world from painting"}
              </button>
              {opStatus && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {opStatus}
                </span>
              )}
              {worldUrl && (
                <a
                  href={worldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold text-aurora-400 hover:text-aurora-300"
                >
                  <ExternalLink className="w-3 h-3" /> World ready — open in
                  Spark
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
