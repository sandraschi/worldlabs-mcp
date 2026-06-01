import { type LogEntry, type LogLevel, logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import {
	ChevronDown,
	Download,
	Filter,
	Pause,
	Play,
	Search,
	Terminal,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function LogsPage() {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [filter, setFilter] = useState<LogLevel | "ALL">("ALL");
	const [search, setSearch] = useState("");
	const [isPaused, setIsPaused] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Initial fetch and subscription
		const unsubscribe = logger.subscribe((newLogs) => {
			if (!isPaused) {
				setLogs([...newLogs].reverse()); // We want chronological for the terminal view
			}
		});

		return unsubscribe;
	}, [isPaused]);

	useEffect(() => {
		// Auto-scroll to bottom
		if (scrollRef.current && !isPaused) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs, isPaused]);

	const filteredLogs = logs.filter((log) => {
		const matchesFilter = filter === "ALL" || log.level === filter;
		const matchesSearch =
			log.message.toLowerCase().includes(search.toLowerCase()) ||
			log.logger?.toLowerCase().includes(search.toLowerCase());
		return matchesFilter && matchesSearch;
	});

	const getLevelColor = (level: LogLevel) => {
		switch (level) {
			case "DEBUG":
				return "text-slate-500";
			case "INFO":
				return "text-blue-400";
			case "WARN":
				return "text-amber-400";
			case "ERROR":
				return "text-rose-500";
			default:
				return "text-slate-300";
		}
	};

	const downloadLogs = () => {
		const content = filteredLogs
			.map((l) => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`)
			.join("\n");
		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `mcp-bridge-logs-${new Date().toISOString().split("T")[0]}.log`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold text-white flex items-center gap-2">
						<Terminal className="w-5 h-5 text-cosmos-400" />
						Sovereign Terminal
					</h2>
					<p className="text-sm text-slate-400">
						Real-time system telemetry and bridge logs
					</p>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
						<input
							type="text"
							placeholder="Filter logs..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cosmos-500/50 w-64"
						/>
					</div>

					<div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
						{(["ALL", "INFO", "WARN", "ERROR", "DEBUG"] as const).map((l) => (
							<button
								key={l}
								onClick={() => setFilter(l)}
								className={cn(
									"px-3 py-1 text-[10px] font-bold rounded-md transition-all",
									filter === l
										? "bg-cosmos-500 text-white shadow-lg"
										: "text-slate-400 hover:text-slate-200",
								)}
							>
								{l}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex-1 flex flex-col bg-[#05040a] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
				{/* Terminal Header */}
				<div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex gap-1.5">
							<div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
							<div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
							<div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
						</div>
						<span className="ml-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
							worldlabs-mcp-bridge.sh
						</span>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsPaused(!isPaused)}
							className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
							title={isPaused ? "Resume Stream" : "Pause Stream"}
						>
							{isPaused ? (
								<Play className="w-3.5 h-3.5" />
							) : (
								<Pause className="w-3.5 h-3.5" />
							)}
							<span className="text-[10px] font-bold uppercase">
								{isPaused ? "Output Paused" : "Streaming"}
							</span>
						</button>
						<div className="w-px h-3 bg-white/10" />
						<button
							onClick={() => logger.clear()}
							className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
							title="Clear Terminal"
						>
							<Trash2 className="w-3.5 h-3.5" />
							<span className="text-[10px] font-bold uppercase">Clear</span>
						</button>
						<button
							onClick={downloadLogs}
							className="text-slate-400 hover:text-cosmos-400 flex items-center gap-1.5 transition-colors"
							title="Export Log File"
						>
							<Download className="w-3.5 h-3.5" />
							<span className="text-[10px] font-bold uppercase">Export</span>
						</button>
					</div>
				</div>

				{/* Terminal Body */}
				<div
					ref={scrollRef}
					className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed selection:bg-cosmos-500/30"
				>
					{filteredLogs.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
							<Terminal className="w-8 h-8" />
							<p className="uppercase tracking-[0.2em] text-[9px]">
								Awaiting system signals...
							</p>
						</div>
					) : (
						filteredLogs.map((log) => (
							<div
								key={log.id}
								className="group flex gap-3 py-0.5 border-l border-transparent hover:border-cosmos-500/30 hover:bg-white/[0.02] transition-colors -ml-1 pl-1"
							>
								<span className="text-slate-600 shrink-0 select-none">
									{new Date(log.timestamp).toLocaleTimeString([], {
										hour12: false,
										fractionalSecondDigits: 3,
									})}
								</span>
								<span
									className={cn(
										"font-bold shrink-0 min-w-[50px]",
										getLevelColor(log.level),
									)}
								>
									{log.level}
								</span>
								<span
									className={cn(
										"shrink-0 px-1.5 py-0 rounded text-[9px] font-bold",
										log.source === "backend"
											? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
											: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
									)}
								>
									{log.source.toUpperCase()}
								</span>
								<span className="text-slate-300 break-all whitespace-pre-wrap">
									{log.message}
								</span>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
