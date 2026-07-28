import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  type Download,
  ExternalLink,
  Eye,
  Globe2,
  Grid3X3,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  MapIcon,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { type AssetType, api, triggerDownload, type World } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}...` : str;
}

const assetActions: {
  key: AssetType;
  label: string;
  icon: typeof Download;
  color: string;
}[] = [
  {
    key: "splat_full",
    label: "SPZ Full",
    icon: Grid3X3,
    color: "text-cosmos-400",
  },
  {
    key: "splat_500k",
    label: "SPZ 500k",
    icon: Grid3X3,
    color: "text-void-400",
  },
  {
    key: "splat_100k",
    label: "SPZ 100k",
    icon: Grid3X3,
    color: "text-nebula-400",
  },
  { key: "mesh", label: "GLB Mesh", icon: Camera, color: "text-aurora-400" },
  {
    key: "panorama",
    label: "Panorama",
    icon: MapIcon,
    color: "text-amber-400",
  },
];

function getAssetUrl(world: World, assetType: AssetType): string | null {
  // prefer flattened _assets (added by bridge _extract_assets)
  const fa = world._assets;
  if (fa) {
    const raw = fa as Record<string, string | undefined>;
    if (assetType === "splat_100k") return raw.splat_100k ?? null;
    if (assetType === "splat_500k") return raw.splat_500k ?? null;
    if (assetType === "splat_full") return raw.splat_full ?? null;
    if (assetType === "mesh") return raw.mesh ?? null;
    if (assetType === "panorama") return raw.panorama ?? null;
  }
  // fallback to raw Marble API response structure
  const a = world.assets;
  if (!a) return null;
  if (assetType === "splat_100k") return a.splats?.spz_urls?.["100k"] ?? null;
  if (assetType === "splat_500k") return a.splats?.spz_urls?.["500k"] ?? null;
  if (assetType === "splat_full") return a.splats?.spz_urls?.full_res ?? null;
  if (assetType === "mesh") return a.mesh?.collider_mesh_url ?? null;
  if (assetType === "panorama") return a.imagery?.pano_url ?? null;
  return null;
}

function worldId(world: World): string {
  return world.world_id ?? world.id ?? "";
}

function getSplatViewerUrl(world: World): string | null {
  return (
    getAssetUrl(world, "splat_full") ??
    getAssetUrl(world, "splat_500k") ??
    world.assets?.splats?.spz_urls?.full_res ??
    world.assets?.splats?.spz_urls?.["500k"] ??
    null
  );
}

function buildViewerLink(world: World): string {
  const params = new URLSearchParams();
  params.set("name", world.display_name ?? "World");
  params.set("caption", getCaption(world));

  const full = getAssetUrl(world, "splat_full");
  const medium = getAssetUrl(world, "splat_500k");
  const low = getAssetUrl(world, "splat_100k");

  if (full) params.set("splat_full", full);
  if (medium) params.set("splat_500k", medium);
  if (low) params.set("splat_100k", low);

  const best = full ?? medium ?? low;
  if (best) params.set("url", best);

  return `/spark-viewer?${params.toString()}`;
}

function getThumbnailUrl(world: World): string | null {
  return world._assets?.thumbnail ?? world.assets?.thumbnail_url ?? null;
}

function getCaption(world: World): string {
  return world._assets?.caption ?? world.assets?.caption ?? "";
}

export function WorldLibrary() {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedWorld, setExpandedWorld] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState<string>("all");

  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["worlds-remote"],
    queryFn: () => api.getWorldsRemote(100),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (worldId: string) => api.deleteWorld(worldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds-remote"] });
    },
  });

  const worlds = data?.worlds ?? [];

  const filteredWorlds = worlds.filter((w) => {
    const nameMatch = (w.display_name ?? "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const prompt = w.assets?.caption ?? "";
    const promptMatch = prompt
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const modelMatch =
      modelFilter === "all" || (w.model ?? "unknown") === modelFilter;
    return (nameMatch || promptMatch) && modelMatch;
  });

  const models = [
    ...new Set(worlds.map((w) => w.model).filter(Boolean)),
  ] as string[];

  const assetDownload = (world: World, assetType: AssetType) => {
    const url = getAssetUrl(world, assetType);
    if (url) triggerDownload(worldId(world), assetType, url);
  };

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmos-500 to-void-600 flex items-center justify-center shadow-[0_0_20px_rgba(92,84,255,0.3)]">
            <Globe2 className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">World Library</h1>
            <p className="text-sm text-slate-300">
              {isLoading
                ? "Loading..."
                : `${filteredWorlds.length} of ${worlds.length} worlds`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.05] rounded-lg border border-white/[0.08] p-0.5">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "card"
                  ? "bg-cosmos-600/40 text-cosmos-300 shadow-sm"
                  : "text-slate-300 hover:text-slate-300",
              )}
              title="Card view"
              aria-label="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-cosmos-600/40 text-cosmos-300 shadow-sm"
                  : "text-slate-300 hover:text-slate-300",
              )}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefetching && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by name or caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setModelFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              modelFilter === "all"
                ? "bg-cosmos-600/30 border-cosmos-500/40 text-cosmos-300"
                : "bg-white/[0.04] border-white/[0.06] text-slate-300 hover:text-slate-200",
            )}
          >
            All
          </button>
          {models.map((m) => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                modelFilter === m
                  ? "bg-cosmos-600/30 border-cosmos-500/40 text-cosmos-300"
                  : "bg-white/[0.04] border-white/[0.06] text-slate-300 hover:text-slate-200",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-cosmos-400 animate-spin" />
          <span className="ml-3 text-sm text-slate-300">Loading worlds...</span>
        </div>
      )}

      {error && (
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-medium">
            Failed to load worlds
          </p>
          <p className="text-slate-300 text-xs mt-1">
            {(error as Error).message}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-white/[0.06] text-sm text-slate-300 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && filteredWorlds.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Globe2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-1">
            {searchQuery || modelFilter !== "all"
              ? "No matching worlds"
              : "No worlds yet"}
          </h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            {searchQuery || modelFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Generate your first world from the Architect page."}
          </p>
          {!searchQuery && modelFilter === "all" && (
            <Link
              to="/architect"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cosmos-600 to-void-600 text-sm font-semibold text-white hover:from-cosmos-500 hover:to-void-500 transition-all"
            >
              <Globe2 className="w-4 h-4" />
              Create World
            </Link>
          )}
        </div>
      )}

      {!isLoading &&
        !error &&
        filteredWorlds.length > 0 &&
        viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWorlds.map((world) => (
              <WorldCard
                key={worldId(world)}
                world={world}
                isExpanded={expandedWorld === worldId(world)}
                onToggle={() =>
                  setExpandedWorld(
                    expandedWorld === worldId(world) ? null : worldId(world),
                  )
                }
                onDownload={(assetType) => assetDownload(world, assetType)}
                onDelete={() => deleteMutation.mutate(worldId(world))}
              />
            ))}
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredWorlds.length > 0 &&
        viewMode === "list" && (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-slate-300 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">World</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">
                    Model
                  </th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">
                    Created
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWorlds.map((world) => (
                  <WorldRow
                    key={worldId(world)}
                    world={world}
                    onDownload={(assetType) => assetDownload(world, assetType)}
                    onDelete={() => deleteMutation.mutate(worldId(world))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ── Card view ─────────────────────────────────────────────────────────────────

function WorldCard({
  world,
  isExpanded,
  onToggle,
  onDownload,
  onDelete,
}: {
  world: World;
  isExpanded: boolean;
  onToggle: () => void;
  onDownload: (assetType: AssetType) => void;
  onDelete: () => void;
}) {
  const thumbUrl = getThumbnailUrl(world);
  const caption = getCaption(world);
  const splatUrl = getSplatViewerUrl(world);

  // Lazy-load world detail for thumbnail when expanded (list response may lack it)
  const { data: worldDetail } = useQuery({
    queryKey: ["world-detail", worldId(world)],
    queryFn: () => api.getWorld(worldId(world)),
    enabled: isExpanded && !thumbUrl,
    staleTime: 60_000,
  });
  const backfillThumb = worldDetail?.world
    ? getThumbnailUrl(worldDetail.world)
    : null;
  const displayThumb = thumbUrl || backfillThumb;

  return (
    <div
      className={cn(
        "glass-card overflow-hidden transition-all duration-200",
        "hover:border-white/[0.12] hover:bg-white/[0.06]",
        isExpanded && "border-cosmos-500/40",
      )}
    >
      {/* Thumbnail */}
      <Link
        to={buildViewerLink(world)}
        className="block aspect-video bg-gradient-to-br from-cosmos-900/60 to-void-900/60 relative overflow-hidden group"
      >
        {displayThumb ? (
          <img
            src={displayThumb}
            alt={world.display_name ?? "World thumbnail"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-300" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-xs text-white font-medium flex items-center gap-1">
            <Eye className="w-3 h-3" />
            View in Spark
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white truncate">
              {world.display_name || "Unnamed World"}
            </h3>
            {caption && (
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                {caption}
              </p>
            )}
          </div>
          {world.model && (
            <span className="badge-info shrink-0">{world.model}</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          {world.created_at && (
            <span>{formatRelativeTime(world.created_at)}</span>
          )}
          {world.created_at && world.model && <span>·</span>}
          {world.world_marble_url && (
            <a
              href={world.world_marble_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cosmos-400 hover:text-cosmos-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Marble <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Expand/collapse toggle */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-slate-300 hover:text-slate-300 transition-colors w-full"
        >
          {isExpanded ? (
            <>
              Less <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Assets <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>

        {/* Expanded: asset downloads */}
        {isExpanded && (
          <div className="pt-1 space-y-1.5 border-t border-white/[0.06]">
            <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
              Download
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {assetActions.map(({ key, label, icon: Icon, color }) => {
                const url = getAssetUrl(world, key);
                if (!url) return null;
                return (
                  <button
                    key={key}
                    onClick={() => onDownload(key)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-left"
                    title={`Download ${label}`}
                  >
                    <Icon
                      className={cn("w-3 h-3 shrink-0", color)}
                      aria-hidden="true"
                    />
                    <span className="truncate text-slate-300">{label}</span>
                  </button>
                );
              })}
            </div>
            {/* Viewer links */}
            <div className="pt-1">
              <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
                View
              </p>
              <div className="flex gap-1.5">
                {splatUrl && (
                  <Link
                    to={buildViewerLink(world)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-cosmos-600/20 text-cosmos-300 hover:bg-cosmos-600/30 border border-cosmos-500/20 transition-all"
                  >
                    <Eye className="w-3 h-3" />
                    Spark 2.0
                  </Link>
                )}
                {world.world_marble_url && (
                  <a
                    href={world.world_marble_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Marble
                  </a>
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all w-full"
              >
                <Trash2 className="w-3 h-3" />
                Delete world
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── List view row ─────────────────────────────────────────────────────────────

function WorldRow({
  world,
  onDownload,
  onDelete,
}: {
  world: World;
  onDownload: (assetType: AssetType) => void;
  onDelete: () => void;
}) {
  const [showDownloads, setShowDownloads] = useState(false);
  const thumbUrl = getThumbnailUrl(world);
  const splatUrl = getSplatViewerUrl(world);

  return (
    <>
      <tr
        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => setShowDownloads(!showDownloads)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded overflow-hidden bg-gradient-to-br from-cosmos-900/60 to-void-900/60 shrink-0">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-3 h-3 text-slate-300" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {world.display_name || "Unnamed World"}
              </div>
              <div className="text-xs text-slate-300 truncate max-w-xs">
                {truncate(getCaption(world), 80)}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          {world.model && <span className="badge-info">{world.model}</span>}
        </td>
        <td className="px-4 py-3 text-xs text-slate-300 hidden sm:table-cell">
          {world.created_at ? formatRelativeTime(world.created_at) : "-"}
        </td>
        <td
          className="px-4 py-3 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            {splatUrl && (
              <Link
                to={buildViewerLink(world)}
                className="p-1.5 rounded-md text-slate-300 hover:text-cosmos-400 hover:bg-cosmos-600/20 transition-all"
                title="View in Spark 2.0"
              >
                <Eye className="w-4 h-4" />
              </Link>
            )}
            {world.world_marble_url && (
              <a
                href={world.world_marble_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-slate-300 hover:text-void-400 hover:bg-void-600/20 transition-all"
                title="Open in Marble"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Delete world"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {showDownloads && (
        <tr className="bg-white/[0.02]">
          <td colSpan={4} className="px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-300 font-medium mr-1">
                Download:
              </span>
              {assetActions.map(({ key, label, icon: Icon, color }) => {
                const url = getAssetUrl(world, key);
                if (!url) return null;
                return (
                  <button
                    key={key}
                    onClick={() => onDownload(key)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 transition-all"
                  >
                    <Icon className={cn("w-3 h-3", color)} />
                    {label}
                  </button>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
