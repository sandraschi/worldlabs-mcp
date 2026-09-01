import { Database, Download, FileText, HardDrive, Upload } from "lucide-react";
import { useState } from "react";
import { API_BASE } from "@/lib/api";

export function BackupCard() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setStatus("Preparing vault.zip…");
    try {
      const res = await fetch(`${API_BASE}/api/backup/vault`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memops-vault-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(
        "Vault exported — db/vectors will rebuild from markdown on restore.",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("404") || msg.includes("Not Found")) {
        setStatus(
          "Server backup endpoint not yet deployed — use manual copy: C:\\Users\\sandr\\.advanced-memory\\vault",
        );
      } else setStatus(`Export failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/backup/restore`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus(
        "Restore queued — vault overwritten, search index will re-embed (a few minutes).",
      );
    } catch (err) {
      setStatus(
        `Restore failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div data-testid="backup-card" className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <HardDrive className="w-4 h-4 text-cosmos-400" />
        <h3 className="text-sm font-bold text-slate-200">
          Vault Backup & Restore
        </h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/20">
          derivative-safe
        </span>
      </div>

      <div className="grid gap-2 text-xs leading-relaxed">
        <div className="flex gap-2 items-start">
          <FileText className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
          <span>
            <b className="text-slate-200">vault/*.md</b> — source of truth (25.7
            MB, 6,427 notes). Back this up.
          </span>
        </div>
        <div className="flex gap-2 items-start">
          <Database className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
          <span>
            <b className="text-slate-300">memory.db</b> (177 MB) +{" "}
            <b>vectors/</b> — <em>derivatives</em>, rebuilt from markdown on
            re-index. No need to version them.
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          data-testid="backup-export"
          onClick={handleExport}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cosmos-600 hover:bg-cosmos-500 disabled:opacity-40 px-3 py-2 text-xs font-semibold text-white"
        >
          <Download className="w-3.5 h-3.5" /> Export vault.zip
        </button>
        <label
          data-testid="backup-import"
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-300 cursor-pointer ${busy ? "opacity-40 pointer-events-none" : ""}`}
        >
          <Upload className="w-3.5 h-3.5" /> Restore
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleImport}
            disabled={busy}
          />
        </label>
      </div>
      {status && (
        <div
          data-testid="backup-status"
          className="text-xs text-slate-400 bg-white/[0.03] rounded px-3 py-2 border border-white/[0.06]"
        >
          {status}
        </div>
      )}
      <div className="text-[11px] text-slate-500">
        Manual fallback: copy{" "}
        <code className="font-mono">C:\Users\sandr\.advanced-memory\vault</code>{" "}
        to <code>\\OneDrive</code> or run{" "}
        <code>mcp-central-docs/scripts/backup-memops-vault.ps1</code>. Restore:
        unzip over vault, then <code>adn_system sync</code> re-embeds.
      </div>
    </div>
  );
}
