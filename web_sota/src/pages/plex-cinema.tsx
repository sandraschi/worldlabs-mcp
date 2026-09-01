import { Clapperboard, Film, Loader2, Search, Tv } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  api,
  type PlexItem,
  type PlexLibrary,
  type PlexStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

function fmtDuration(ms?: number): string {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m` : `${s}s`;
}

export default function PlexCinema() {
  const [status, setStatus] = useState<PlexStatus | null>(null);
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<string | null>(null);
  const [items, setItems] = useState<PlexItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlexItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();

  const loadLibraries = useCallback(async () => {
    try {
      const [st, libs] = await Promise.all([
        api.plexStatus(),
        api.plexLibraries(),
      ]);
      setStatus(st);
      setLibraries(libs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Plex");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLibraries();
  }, [loadLibraries]);

  const browse = useCallback(async (sectionId: string, pageNum = 0) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const res = await api.plexBrowse(sectionId, pageNum, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Browse failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLibraryClick = (lib: PlexLibrary) => {
    setActiveLibrary(lib.id);
    void browse(lib.id, 0);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await api.plexSearch(query.trim());
      setSearchResults(results);
      setItems([]);
      setTotal(0);
      setActiveLibrary(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleOpen = async (item: PlexItem) => {
    setOpening(item.rating_key);
    try {
      const video = await api.plexVideoUrl(item.rating_key);
      const url = video.proxy_url || video.direct_url;
      if (!url) throw new Error("No stream URL returned");
      setSearchParams({ cinema_video: url });
      window.location.href = `/spark-viewer?cinema_video=${encodeURIComponent(url)}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open stream");
      setOpening(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeTitle =
    libraries.find((l) => l.id === activeLibrary)?.title ?? "Library";

  return (
    <div
      data-testid="plex_cinema-page"
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clapperboard className="w-6 h-6 text-amber-400" />
            Cinema Worlds
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Watch Plex media inside a World Labs 3D world.
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold",
            status?.available
              ? "bg-aurora-500/10 border-aurora-500/20 text-aurora-400"
              : "bg-red-500/10 border-red-500/20 text-red-400",
          )}
          data-testid="plex-status"
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              status?.available ? "bg-aurora-400" : "bg-red-400",
            )}
          />
          {status === null
            ? "Probing Plex..."
            : status.available
              ? `Plex · ${status.server_name ?? "online"}`
              : "Plex unavailable"}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search Plex library..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          data-testid="plex_cinema-action"
          type="button"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Library grid */}
      {!activeLibrary && !searchResults.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {libraries.map((lib) => (
            <button
              key={lib.id}
              type="button"
              onClick={() => handleLibraryClick(lib)}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-amber-500/40 hover:bg-white/[0.06] transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-600/15 border border-amber-500/25 flex items-center justify-center mb-3">
                {lib.type === "movie" ? (
                  <Film className="w-5 h-5 text-amber-400" />
                ) : (
                  <Tv className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="text-sm font-semibold text-white">
                {lib.title}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lib.count ?? 0} items
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Browse / search results */}
      {(activeLibrary || searchResults.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {searchResults.length > 0 ? "Search Results" : activeTitle}
            </h2>
            {activeLibrary && (
              <button
                type="button"
                onClick={() => {
                  setActiveLibrary(null);
                  setItems([]);
                  setTotal(0);
                }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← All libraries
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : (searchResults.length > 0 ? searchResults : items).length ===
            0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] py-16 text-center text-slate-500">
              No media found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {(searchResults.length > 0 ? searchResults : items).map(
                  (item) => (
                    <button
                      key={item.rating_key}
                      type="button"
                      onClick={() => handleOpen(item)}
                      disabled={opening === item.rating_key}
                      className="group rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] text-left hover:border-amber-500/40 transition-all"
                    >
                      <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
                        {item.thumb ? (
                          <img
                            src={item.thumb}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                            loading="lazy"
                          />
                        ) : (
                          <Film className="w-6 h-6 text-slate-600" />
                        )}
                        {opening === item.rating_key && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-medium text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.grandparent_title ??
                            (item.year ? String(item.year) : "")}
                          {item.duration_ms || item.duration_s
                            ? ` · ${fmtDuration(item.duration_ms ?? (item.duration_s ?? 0) * 1000)}`
                            : ""}
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>

              {/* Pagination */}
              {activeLibrary && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => browse(activeLibrary, page - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {page + 1} / {totalPages} · {total} items
                  </span>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => browse(activeLibrary, page + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
