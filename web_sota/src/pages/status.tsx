import { Coins, Cpu, Database, Globe, HardDrive } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE, api } from "@/lib/api";
import { logger } from "@/lib/logger";

interface Stats {
  status: string;
  system: {
    cpu_percent: number;
    memory: { percent: number };
    disk: { percent: number };
  };
}

interface Credits {
  status: string;
  live_balance: number | null;
  live_source: string;
  billing_url: string;
  local_generations: number;
  local_estimated_credits: number;
  local_by_model: Record<string, number>;
  local_note: string;
}

export function Status() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(API_BASE + "/api/health");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        logger.error("Failed to fetch stats", { error: err });
      }
    };
    const fetchCredits = async () => {
      try {
        const data = await api.credits();
        setCredits(data);
      } catch (err) {
        logger.error("Failed to fetch credits", { error: err });
      }
    };
    fetchStatus();
    fetchCredits();
    const interval = setInterval(fetchStatus, 5000);
    const creditInterval = setInterval(fetchCredits, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(creditInterval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Bridge Health
        </h2>
        <p className="text-slate-400">
          Monitoring spatial intelligence compute and bridge connectivity.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <Globe className="h-8 w-8 text-cyan-400" />
            <div>
              <p className="section-label mb-1">Bridge Status</p>
              <p className="text-2xl font-bold text-white uppercase">
                {stats?.status || "Online"}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <Cpu className="h-8 w-8 text-blue-500" />
            <div>
              <p className="section-label mb-1">CPU Usage</p>
              <p className="text-2xl font-bold text-white">
                {stats?.system?.cpu_percent ?? 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <Database className="h-8 w-8 text-purple-500" />
            <div>
              <p className="section-label mb-1">Memory Load</p>
              <p className="text-2xl font-bold text-white">
                {stats?.system?.memory?.percent ?? 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <HardDrive className="h-8 w-8 text-amber-500" />
            <div>
              <p className="section-label mb-1">Disk Usage</p>
              <p className="text-2xl font-bold text-white">
                {stats?.system?.disk?.percent ?? 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-6" data-testid="credits-balance">
          <div className="flex items-center gap-4">
            <Coins className="h-8 w-8 text-aurora-400" />
            <div>
              <p className="section-label mb-1">API Credits Remaining</p>
              <p className="text-2xl font-bold text-white">
                {credits?.live_balance !== null &&
                credits?.live_balance !== undefined
                  ? credits.live_balance.toLocaleString()
                  : "unavailable"}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {credits?.live_source === "api"
              ? "Live balance from the World Labs API."
              : "Live balance unavailable — check "}
            {credits?.live_source !== "api" && (
              <a
                href={
                  credits?.billing_url ??
                  "https://platform.worldlabs.ai/billing"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-cosmos-400 hover:text-cosmos-300"
              >
                platform.worldlabs.ai/billing
              </a>
            )}
          </p>
        </div>

        <div className="glass-card p-6" data-testid="credits-tally">
          <div className="flex items-center gap-4">
            <HardDrive className="h-8 w-8 text-cosmos-400" />
            <div>
              <p className="section-label mb-1">Credits Used (tally)</p>
              <p className="text-2xl font-bold text-white">
                {credits
                  ? credits.local_estimated_credits.toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {credits
              ? `${credits.local_generations} world${credits.local_generations === 1 ? "" : "s"} generated`
              : "No generations recorded yet."}
            {credits && Object.keys(credits.local_by_model).length > 0 && (
              <span className="block mt-1">
                {Object.entries(credits.local_by_model).map(
                  ([model, count]) => (
                    <span
                      key={model}
                      className="inline-block mr-2 px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] font-mono"
                    >
                      {model}: {count}
                    </span>
                  ),
                )}
              </span>
            )}
            {credits?.local_note && (
              <span className="block mt-1 text-[10px] text-slate-600">
                {credits.local_note}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
