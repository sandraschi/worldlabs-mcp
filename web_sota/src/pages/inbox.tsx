import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Inbox as InboxIcon,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api, type Operation } from "@/lib/api";
import { cn } from "@/lib/utils";

type InboxFilter = "attention" | "progress" | "failed" | "done" | "all";

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "attention", label: "Needs attention" },
  { id: "progress", label: "In progress" },
  { id: "failed", label: "Failed" },
  { id: "done", label: "Completed" },
  { id: "all", label: "All" },
];

const PAGE_SIZE = 10;
const STALL_MS = 5 * 60 * 1000;

type OpStatus = "progress" | "failed" | "done";

function opStatus(op: Operation): OpStatus {
  const s = op.metadata?.progress?.status;
  if (op.done) return op.error || s === "FAILED" ? "failed" : "done";
  return s === "FAILED" ? "failed" : "progress";
}

function opAgeMs(op: Operation): number | null {
  if (!op.created_at) return null;
  const t = Date.parse(op.created_at);
  return Number.isNaN(t) ? null : Date.now() - t;
}

function needsAttention(op: Operation): boolean {
  const st = opStatus(op);
  if (st === "failed") return true;
  if (st !== "progress") return false;
  const age = opAgeMs(op);
  return age != null && age > STALL_MS;
}

function searchableText(op: Operation): string {
  return [
    op.operation_id,
    op.metadata?.world_id ?? "",
    op.metadata?.progress?.description ?? "",
    op.error ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function OperationRow({
  op,
  onPolled,
}: {
  op: Operation;
  onPolled: (next: Operation) => void;
}) {
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const st = opStatus(op);
  const worldId = op.metadata?.world_id ?? op.response?.world_id;
  const marbleUrl = op.response?.world_marble_url;
  const age = opAgeMs(op);
  const stalled = st === "progress" && age != null && age > STALL_MS;

  const pollNow = async () => {
    setPolling(true);
    try {
      onPolled(await api.getOperation(op.operation_id));
    } catch {
      // poll errors surface on the next background refetch - ignore here
    } finally {
      setPolling(false);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(op.operation_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable - ignore
    }
  };

  return (
    <div
      className="glass-card p-4 space-y-2"
      data-testid={`inbox-entry-${op.operation_id}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold border",
            st === "done" &&
              "bg-aurora-500/20 text-aurora-300 border-aurora-500/30",
            st === "failed" && "bg-red-500/20 text-red-300 border-red-500/30",
            st === "progress" &&
              "bg-amber-500/20 text-amber-300 border-amber-500/30",
          )}
          data-testid="inbox-entry-status"
        >
          {st === "done"
            ? "Completed"
            : st === "failed"
              ? "Failed"
              : "In progress"}
        </span>
        {stalled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold bg-red-500/10 text-red-300 border border-red-500/20">
            <AlertTriangle className="w-3 h-3" /> Stalled 5m+
          </span>
        )}
        <span className="font-mono text-sm text-slate-300 truncate">
          {op.operation_id}
        </span>
        {worldId && (
          <span className="font-mono text-sm text-cosmos-300 truncate">
            world {worldId}
          </span>
        )}
      </div>

      {(op.metadata?.progress?.description || op.error) && (
        <p className="text-sm text-slate-300 leading-relaxed">
          {op.error ?? op.metadata?.progress?.description}
        </p>
      )}

      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
        <button
          onClick={pollNow}
          disabled={polling}
          data-testid={`inbox-poll-${op.operation_id}`}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-all disabled:opacity-40"
        >
          <RefreshCw className={cn("w-3 h-3", polling && "animate-spin")} />
          {polling ? "Polling" : "Poll now"}
        </button>
        {marbleUrl && (
          <a
            href={marbleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-all"
          >
            Open in Marble <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={copyId}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-all"
        >
          {copied ? (
            <Check className="w-3 h-3 text-aurora-300" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy ID"}
        </button>
      </div>
    </div>
  );
}

export function InboxPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<InboxFilter>("attention");
  const [query, setQuery] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getHistory(),
    staleTime: 10_000,
    refetchInterval: (q) =>
      (q.state.data ?? []).some((op) => opStatus(op) === "progress")
        ? 15_000
        : false,
  });

  const ops = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = ops.filter((op) => {
      switch (filter) {
        case "attention":
          return needsAttention(op);
        case "progress":
          return opStatus(op) === "progress";
        case "failed":
          return opStatus(op) === "failed";
        case "done":
          return opStatus(op) === "done";
        case "all":
          return true;
      }
    });
    if (q) rows = rows.filter((op) => searchableText(op).includes(q));
    rows = [...rows].sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return newestFirst ? tb - ta : ta - tb;
    });
    return rows;
  }, [ops, filter, query, newestFirst]);

  const attentionCount = useMemo(
    () => ops.filter(needsAttention).length,
    [ops],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const switchFilter = (next: InboxFilter) => {
    setFilter(next);
    setPage(0);
  };

  const onPolled = (next: Operation) => {
    queryClient.setQueryData<Operation[]>(["history"], (prev) =>
      (prev ?? []).map((op) =>
        op.operation_id === next.operation_id ? next : op,
      ),
    );
  };

  return (
    <div
      className="space-y-4 page-enter max-w-6xl mx-auto pb-20"
      data-testid="inbox-page"
    >
      {/* Hero */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cosmos-600/10 via-transparent to-aurora-600/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmos-500 to-void-600 flex items-center justify-center shadow-[0_0_20px_rgba(92,84,255,0.3)]">
            <InboxIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              Inbox{" "}
              {attentionCount > 0 && (
                <span className="text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-2 py-0.5 ml-1">
                  {attentionCount} need attention
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-300">
              Every generation operation in one action queue. Failed runs and
              generations stalled over 5 minutes surface here first — poll them,
              open finished worlds in Marble, or clear the queue by working
              through it. Source: local operation history (last 50, live-polling
              while anything runs).
            </p>
          </div>
        </div>
      </div>

      {/* Controls: search + sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search operation ID, world ID, status..."
            data-testid="inbox-search"
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-300 focus:outline-none focus:border-cosmos-500/50"
          />
        </div>
        <button
          onClick={() => setNewestFirst((v) => !v)}
          data-testid="inbox-sort"
          title={newestFirst ? "Newest first" : "Oldest first"}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-all"
        >
          {newestFirst ? (
            <ArrowDownWideNarrow className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpNarrowWide className="w-3.5 h-3.5" />
          )}
          {newestFirst ? "Newest" : "Oldest"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5" data-testid="inbox-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => switchFilter(f.id)}
            data-testid={`inbox-filter-${f.id}`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-bold transition-all border",
              filter === f.id
                ? "bg-cosmos-500/15 text-cosmos-300 border-cosmos-500/30"
                : "bg-white/[0.03] text-slate-300 border-white/[0.06] hover:bg-white/[0.07]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div
          className="flex items-center gap-2 text-sm text-slate-300 py-16 justify-center"
          data-testid="inbox-loading"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading operation history...
        </div>
      ) : isError ? (
        <div
          className="glass-card p-6 text-sm text-red-300"
          data-testid="inbox-error"
        >
          Inbox request failed:{" "}
          {error instanceof Error ? error.message : "unknown error"}{" "}
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["history"] })
            }
            data-testid="inbox-retry"
            className="ml-2 px-2 py-1 rounded text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-100 transition-all"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-card p-6 text-sm text-slate-300 text-center py-16 space-y-2"
          data-testid="inbox-empty"
        >
          <InboxIcon className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-100">Inbox zero</p>
          <p>
            {filter === "attention"
              ? "Nothing failed or stalled. Generate a world from the Architect and watch it land here."
              : "No operations match this filter."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3" data-testid="inbox-list">
            {pageRows.map((op) => (
              <OperationRow key={op.operation_id} op={op} onPolled={onPolled} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              data-testid="inbox-prev"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span
              className="text-sm text-slate-300 font-mono"
              data-testid="inbox-count"
            >
              {filtered.length} ops · page {safePage + 1}/{pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              data-testid="inbox-next"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
