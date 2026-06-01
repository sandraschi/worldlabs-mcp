import { logger } from "@/lib/logger";
import { Cpu, Database, Globe, HardDrive } from "lucide-react";
import { useEffect, useState } from "react";

interface Stats {
	status: string;
	system: {
		cpu_percent: number;
		memory: { percent: number };
		disk: { percent: number };
	};
}

export function Status() {
	const [stats, setStats] = useState<Stats | null>(null);

	useEffect(() => {
		const fetchStatus = async () => {
			try {
				const res = await fetch("/api/health");
				const data = await res.json();
				setStats(data);
			} catch (err) {
				logger.error("Failed to fetch stats", { error: err });
			}
		};
		fetchStatus();
		const interval = setInterval(fetchStatus, 5000);
		return () => clearInterval(interval);
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
		</div>
	);
}
