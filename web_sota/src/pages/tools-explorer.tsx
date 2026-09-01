import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Code2, Search, Wrench } from "lucide-react";
import { useState } from "react";
import { api, type ToolInfo } from "@/lib/api";
import { cn } from "@/lib/utils";

function ToolCard({
  tool,
  expanded,
  onToggle,
}: {
  tool: ToolInfo;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "glass-card overflow-hidden transition-all duration-200",
        expanded ? "border-cosmos-500/30" : "",
      )}
    >
      <button
        data-testid="tools_explorer-action"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
        aria-expanded={expanded}
        aria-controls={`tool-${tool.name}`}
      >
        <div
          data-testid="tools_explorer-page"
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmos-600/30 to-void-600/30 border border-cosmos-500/20 flex items-center justify-center flex-shrink-0"
        >
          <Wrench className="w-3.5 h-3.5 text-cosmos-400" aria-hidden="true" />
          <span data-testid="tools_explorer-extra-2" className="hidden" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-200 font-mono">
            {tool.name}
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5 line-clamp-1">
            {tool.description}
          </div>
        </div>
        {expanded ? (
          <ChevronDown
            className="w-4 h-4 text-slate-500 flex-shrink-0"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            className="w-4 h-4 text-slate-500 flex-shrink-0"
            aria-hidden="true"
          />
        )}
      </button>

      {expanded && (
        <div
          id={`tool-${tool.name}`}
          className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-4"
        >
          <p className="text-sm text-slate-400 leading-relaxed">
            {tool.description}
          </p>
          {Object.keys(tool.parameters).length > 0 && (
            <div>
              <div className="section-label mb-2 flex items-center gap-1.5">
                <Code2 className="w-3 h-3" aria-hidden="true" /> Parameters
              </div>
              <pre className="text-xs bg-black/30 border border-white/[0.06] rounded-lg p-3 overflow-x-auto text-slate-300 font-mono leading-relaxed">
                {JSON.stringify(tool.parameters, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolsExplorer() {
  const {
    data: system,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["system"],
    queryFn: api.systemInfo,
  });

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const tools = system?.tools ?? [];
  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6 page-enter max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-bold gradient-text">MCP Tools</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {isLoading ? "Loading…" : `${tools.length} tools available`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search tools…"
          aria-label="Search MCP tools"
          className="input-glass pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Tool list */}
      {isError && (
        <div className="glass-card p-4 text-sm text-red-400 border-red-500/20">
          Could not load tools — is the backend running?
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((tool) => (
          <ToolCard
            key={tool.name}
            tool={tool}
            expanded={expanded === tool.name}
            onToggle={() =>
              setExpanded((prev) => (prev === tool.name ? null : tool.name))
            }
          />
        ))}
        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-10 text-sm text-slate-500">
            No tools match &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
