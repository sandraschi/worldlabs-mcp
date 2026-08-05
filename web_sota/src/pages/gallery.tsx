import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe2,
  Heart,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type GalleryEntry } from "@/lib/api";
import { cn } from "@/lib/utils";

const GALLERY_TAGS = [
  "curated",
  "stylized",
  "realism",
  "interior",
  "hq",
  "fantasy",
  "sci-fi",
] as const;

const PROMPT_SESSION_KEY = "wl-gallery-prompt";

function EntryCard({
  entry,
  onUsePrompt,
}: {
  entry: GalleryEntry;
  onUsePrompt: (entry: GalleryEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(entry.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable - ignore
    }
  }, [entry.prompt]);

  return (
    <div
      className="glass-card overflow-hidden group"
      data-testid={`gallery-entry-${entry.id}`}
    >
      <a href={entry.marble_url} target="_blank" rel="noopener noreferrer">
        {entry.minimap_url ? (
          <img
            src={entry.minimap_url}
            alt={entry.display_name}
            loading="lazy"
            className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-aurora-600/20 via-transparent to-cosmos-600/20 flex items-center justify-center">
            <Globe2 className="w-8 h-8 text-slate-600" />
          </div>
        )}
      </a>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <a
            href={entry.marble_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white hover:text-aurora-400 transition-colors line-clamp-1"
          >
            {entry.display_name}
          </a>
          <span className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
            <Heart className="w-3 h-3" /> {entry.like_count}
          </span>
        </div>

        <p className="text-[10px] text-slate-500 flex items-center gap-2">
          <span className="text-cosmos-400">@{entry.owner}</span>
          <span className="uppercase font-mono">{entry.model}</span>
          {entry.seed != null && (
            <span className="font-mono">seed {entry.seed}</span>
          )}
        </p>

        <p
          className={cn(
            "text-[11px] text-slate-400 leading-relaxed whitespace-pre-line",
            !expanded && "line-clamp-3",
          )}
        >
          {entry.prompt}
        </p>
        {entry.prompt.length > 200 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-bold text-aurora-400 hover:text-aurora-300 transition-colors"
          >
            {expanded ? "Show less" : "Show full prompt"}
          </button>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={copyPrompt}
            data-testid="gallery-copy-prompt"
            title="Copy prompt"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all"
          >
            {copied ? (
              <Check className="w-3 h-3 text-aurora-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Prompt"}
          </button>
          <button
            onClick={() => onUsePrompt(entry)}
            data-testid="gallery-use-prompt"
            title="Seed the Architect with this prompt"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-aurora-500/10 hover:bg-aurora-500/20 text-aurora-400 hover:text-aurora-300 transition-all"
          >
            <Wand2 className="w-3 h-3" />
            Use prompt
          </button>
          <a
            href={entry.marble_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-500 hover:text-cosmos-400 transition-colors"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function MarbleGallery() {
  const navigate = useNavigate();
  const [tag, setTag] = useState<(typeof GALLERY_TAGS)[number]>("curated");
  const [pageToken, setPageToken] = useState("");
  const [tokenStack, setTokenStack] = useState<string[]>([]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["gallery", tag, pageToken],
    queryFn: () => api.galleryBrowse(tag, pageToken, 24),
    staleTime: 60_000,
  });

  const usePrompt = useCallback(
    (entry: GalleryEntry) => {
      try {
        sessionStorage.setItem(PROMPT_SESSION_KEY, entry.prompt);
      } catch {
        // storage unavailable - still navigate
      }
      navigate("/architect");
    },
    [navigate],
  );

  const switchTag = useCallback((next: (typeof GALLERY_TAGS)[number]) => {
    setTag(next);
    setPageToken("");
    setTokenStack([]);
  }, []);

  const nextPage = useCallback(() => {
    if (!data?.next_page_token) return;
    setTokenStack((s) => [...s, pageToken]);
    setPageToken(data.next_page_token);
  }, [data?.next_page_token, pageToken]);

  const prevPage = useCallback(() => {
    setTokenStack((s) => {
      const prev = s[s.length - 1] ?? "";
      setPageToken(prev);
      return s.slice(0, -1);
    });
  }, []);

  return (
    <div
      className="space-y-4 page-enter max-w-6xl mx-auto pb-20"
      data-testid="gallery-page"
    >
      {/* Hero */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-aurora-600/10 via-transparent to-cosmos-600/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-500 to-cosmos-600 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
            <Globe2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              Marble Community Gallery
            </h1>
            <p className="text-sm text-slate-400">
              Public worlds shared on marble.worldlabs.ai — prompts, seeds, and
              splat assets from the community. This is not your local World
              Library or the Style Gallery presets.
            </p>
          </div>
        </div>
      </div>

      {/* Tag tabs */}
      <div className="flex flex-wrap gap-1.5" data-testid="gallery-tabs">
        {GALLERY_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => switchTag(t)}
            data-testid={`gallery-tab-${t}`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              tag === t
                ? "bg-aurora-500/15 text-aurora-300 border border-aurora-500/30"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.07]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-16 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Fetching community worlds...
        </div>
      ) : isError ? (
        <div
          className="glass-card p-6 text-xs text-red-400"
          data-testid="gallery-error"
        >
          Gallery request failed:{" "}
          {error instanceof Error ? error.message : "unknown error"}
        </div>
      ) : !data || data.entries.length === 0 ? (
        <div className="glass-card p-6 text-xs text-slate-500 text-center py-16">
          No entries in this tag yet.
        </div>
      ) : (
        <>
          <div
            className={cn(
              "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              isFetching && "opacity-60 pointer-events-none transition-opacity",
            )}
            data-testid="gallery-grid"
          >
            {data.entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onUsePrompt={usePrompt} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={prevPage}
              disabled={tokenStack.length === 0}
              data-testid="gallery-prev"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-[10px] text-slate-600 font-mono">
              {data.count} worlds · tag:{tag}
            </span>
            <button
              onClick={nextPage}
              disabled={!data.next_page_token}
              data-testid="gallery-next"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      <div className="flex items-center gap-2 text-[10px] text-slate-600">
        <Sparkles className="w-3 h-3" />
        Prompts are the creators' originals. Reuse for inspiration; attribution
        shown per entry.
      </div>
    </div>
  );
}
