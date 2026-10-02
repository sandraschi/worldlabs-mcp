import { ExternalLink, Globe2, Key, Settings2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { LlmOnboarding } from "@/components/LlmOnboarding";
import { api, apiDelete } from "@/lib/api";
import {
  fetchGpus,
  fetchLoaded,
  fetchModels,
  fetchProviders,
  installStatus,
  type LoadedModel,
  loadSelection,
  type ProviderInfo,
  saveLlmSettings,
  saveSelection,
  startInstall,
  testProvider,
  unloadLlm,
} from "@/lib/llm";
import {
  fetchOllamaModels,
  pickPreferredModel,
  pickTargetGpu,
  type GpuInfo as TargetGpu,
} from "@/lib/model-preference";
import { cn } from "@/lib/utils";

const GPU_KEY = "llm_gpu";

function LlmProviderCards({ onChanged }: { onChanged: () => void }) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, string>>({});

  const refresh = () =>
    fetchProviders()
      .then((d) => setProviders(d.providers))
      .catch(() => {});

  useEffect(() => {
    refresh();
  }, []);

  const set = async (id: string, op: string, fn: () => Promise<unknown>) => {
    setBusy((b) => ({ ...b, [id]: op }));
    setResult((r) => ({ ...r, [id]: "" }));
    try {
      await fn();
      await refresh();
      onChanged();
      setResult((r) => ({ ...r, [id]: `${op} ok` }));
    } catch (e) {
      setResult((r) => ({
        ...r,
        [id]: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setBusy((b) => {
        const n = { ...b };
        delete n[id];
        return n;
      });
    }
  };

  return (
    <div className="space-y-2">
      {providers.map((p) => (
        <div
          key={p.id}
          data-testid={`llm-provider-card-${p.id}`}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                p.kind === "local"
                  ? p.detected
                    ? "bg-emerald-500"
                    : "bg-slate-500"
                  : p.configured
                    ? "bg-emerald-500"
                    : "bg-amber-500",
              )}
            />
            <span className="text-sm font-medium text-slate-200">
              {p.label}
            </span>
            <span className="text-[11px] text-slate-500">
              {p.kind === "local" ? "local · free" : "cloud · paid"}
            </span>
            <span className="text-[11px] text-slate-500 ml-auto">
              {p.kind === "local"
                ? p.detected
                  ? `detected · ${p.models?.length ?? 0} models`
                  : "not found"
                : p.configured
                  ? "key configured"
                  : `needs ${p.key_env}`}
            </span>
          </div>
          {p.kind === "cloud" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={keys[p.id] || ""}
                onChange={(e) =>
                  setKeys((k) => ({ ...k, [p.id]: e.target.value }))
                }
                placeholder={`Paste ${p.key_env}`}
                aria-label={`${p.label} API key`}
                data-testid={`llm-key-${p.id}`}
                className="flex-1 min-w-44 rounded border border-white/[0.08] bg-white/[0.05] px-2 py-1.5 font-mono text-xs text-slate-100"
              />
              <button
                onClick={() =>
                  set(p.id, "save", async () => {
                    await saveLlmSettings({
                      provider: p.id,
                      model: "",
                      api_key: keys[p.id] || undefined,
                      select: false,
                    });
                    setKeys((k) => ({ ...k, [p.id]: "" }));
                  })
                }
                disabled={busy[p.id] !== undefined}
                className="text-xs bg-white/[0.05] hover:bg-white/[0.08] rounded-lg px-3 py-1.5 text-slate-200 transition"
              >
                Save
              </button>
              <button
                onClick={() =>
                  set(p.id, "test", async () => {
                    const r = await testProvider(p.id, keys[p.id] || undefined);
                    if (!r.ok)
                      throw new Error(
                        r.error || r.note || "provider not reachable",
                      );
                  })
                }
                disabled={busy[p.id] !== undefined}
                data-testid={`llm-test-${p.id}`}
                className="text-xs bg-white/[0.05] hover:bg-white/[0.08] rounded-lg px-3 py-1.5 text-slate-200 transition"
              >
                Test
              </button>
              {p.configured && (
                <button
                  onClick={() =>
                    set(p.id, "clear", () =>
                      apiDelete(
                        `/api/settings/llm/key?provider=${encodeURIComponent(p.id)}`,
                      ),
                    )
                  }
                  disabled={busy[p.id] !== undefined}
                  className="text-xs text-red-300/80 hover:text-red-300 rounded-lg px-2 py-1.5 transition"
                >
                  Clear
                </button>
              )}
            </div>
          )}
          {result[p.id] && (
            <p className="mt-1.5 text-[11px] text-slate-400">{result[p.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function LLMSettings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [selectedModel, setSelectedModel] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [gpus, setGpus] = useState<TargetGpu[]>([]);
  const [targetGpu, setTargetGpu] = useState<TargetGpu | null>(null);
  const [loaded, setLoaded] = useState<LoadedModel[]>([]);
  const [engineUp, setEngineUp] = useState(false);
  const [installState, setInstallState] = useState("");
  const [note, setNote] = useState("");

  const refreshProviders = () =>
    fetchProviders()
      .then((d) => setProviders(d.providers))
      .catch(() => setStatus("error"));

  useEffect(() => {
    (async () => {
      try {
        const [pv, gpuRaw] = await Promise.all([
          fetchProviders(),
          fetchGpus().catch(() => []),
        ]);
        setProviders(pv.providers);
        const mapped: TargetGpu[] = gpuRaw.map((g) => ({
          index: g.index,
          name: g.name,
          vramMb: g.total_mb,
        }));
        setGpus(mapped);
        const savedGpu = (() => {
          try {
            return localStorage.getItem(GPU_KEY);
          } catch {
            return null;
          }
        })();
        const target = pickTargetGpu(
          mapped,
          savedGpu !== null ? Number(savedGpu) : undefined,
        );
        setTargetGpu(target);

        const sel = loadSelection();
        const detectedLocal =
          pv.providers.find((p) => p.kind === "local" && p.detected)?.id ||
          sel.provider ||
          "ollama";
        const active = pv.providers.some(
          (p) => p.id === sel.provider && (p.detected || p.configured),
        )
          ? sel.provider
          : detectedLocal;
        setSelectedProvider(active);

        const md = await fetchModels(active).catch(() => null);
        const list = md?.models || [];
        setModels(list);

        // Resident-first default (never evict a loaded preferred model).
        let def = "";
        if (active === "ollama") {
          const st = await fetchOllamaModels();
          def = pickPreferredModel(st.loaded, st.installed, target);
          setLoaded(
            (
              await fetchLoaded("ollama").catch(() => ({
                models: [] as LoadedModel[],
              }))
            ).models,
          );
          setEngineUp(st.installed.length > 0);
        }
        const want =
          sel.provider === active && sel.model && list.includes(sel.model)
            ? sel.model
            : def || list[0] || "";
        setSelectedModel(want);
        setStatus(list.length > 0 || want ? "ready" : "error");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  const changeProvider = async (id: string) => {
    setSelectedProvider(id);
    setSelectedModel("");
    const md = await fetchModels(id).catch(() => null);
    const list = md?.models || [];
    setModels(list);
    const want = list[0] || "";
    setSelectedModel(want);
    saveSelection(id, want);
    try {
      await saveLlmSettings({ provider: id, model: want });
    } catch {
      /* selection persists locally; server save is best-effort */
    }
    setStatus(list.length > 0 ? "ready" : "error");
  };

  const changeModel = async (m: string) => {
    setSelectedModel(m);
    saveSelection(selectedProvider, m);
    try {
      await saveLlmSettings({ provider: selectedProvider, model: m });
    } catch {
      /* local-first */
    }
    setNote("");
  };

  const changeGpu = (idx: number) => {
    const t = gpus.find((g) => g.index === idx) || null;
    setTargetGpu(t);
    try {
      localStorage.setItem(GPU_KEY, String(idx));
    } catch {
      /* ignore */
    }
  };

  const doUnload = async () => {
    try {
      await unloadLlm({ provider: "ollama" });
      setLoaded([]);
      setNote("VRAM released.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    }
  };

  const doInstall = async () => {
    try {
      await startInstall("ollama");
      setInstallState("running");
      const poll = async () => {
        const st = await installStatus("ollama").catch(() => null);
        if (st) {
          setInstallState(st.state);
          if (st.state === "running") setTimeout(poll, 5000);
          if (st.state === "done") refreshProviders();
        }
      };
      setTimeout(poll, 5000);
    } catch (e) {
      setInstallState(e instanceof Error ? e.message : String(e));
    }
  };

  const locals = providers.filter((p) => p.kind === "local");

  return (
    <div data-testid="settings-page" className="glass-card p-5 space-y-4">
      <div
        data-testid="settings-content"
        className="flex items-center gap-2 border-b border-white/[0.06] pb-3"
      >
        <Settings2 className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-200">AI Providers</h3>
        <span data-testid="settings-extra-2" className="hidden" />
      </div>

      <LlmOnboarding mode="full" />

      <div className="space-y-2">
        <label className="section-label block">Provider</label>
        <select
          data-testid="llm-provider-select"
          className="input-glass font-mono w-full"
          value={selectedProvider}
          onChange={(e) => changeProvider(e.target.value)}
        >
          {providers.length === 0 && (
            <option value="">No local LLM detected</option>
          )}
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
              {p.kind === "local"
                ? p.detected
                  ? " (detected)"
                  : " (not found)"
                : p.configured
                  ? " (key set)"
                  : " (needs key)"}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="section-label block">Model</label>
        <select
          data-testid="llm-model-select"
          className="input-glass font-mono w-full"
          value={selectedModel}
          onChange={(e) => changeModel(e.target.value)}
          disabled={status !== "ready"}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {status === "error" && (
          <p className="text-xs text-slate-500">
            No usable provider. Start Ollama or LM Studio — or paste a cloud key
            below.
          </p>
        )}
      </div>

      {gpus.length > 1 && (
        <div className="space-y-2">
          <label className="section-label block">GPU target</label>
          <select
            data-testid="llm-gpu-select"
            className="input-glass font-mono w-full"
            value={targetGpu?.index ?? ""}
            onChange={(e) => changeGpu(Number(e.target.value))}
          >
            {gpus.map((g) => (
              <option key={g.index} value={g.index}>
                GPU {g.index} - {g.name} ({Math.round(g.vramMb / 1024)} GB)
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Models load on the secondary card — the primary stays resident.
          </p>
        </div>
      )}

      {selectedProvider === "ollama" && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                engineUp ? "bg-emerald-500" : "bg-slate-500",
              )}
            />
            {engineUp
              ? loaded.length > 0
                ? `Resident: ${loaded.map((m) => `${m.name} (${m.size_vram_mb} MB)`).join(", ")}`
                : "Engine up, nothing loaded"
              : "Engine not found"}
            <button
              onClick={doUnload}
              disabled={!engineUp}
              className="ml-auto text-xs bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-30 rounded-lg px-3 py-1.5 transition"
            >
              Release VRAM
            </button>
            {!engineUp && (
              <button
                onClick={doInstall}
                className="text-xs bg-cosmos-600 hover:bg-cosmos-500 rounded-lg px-3 py-1.5 text-white transition"
              >
                {installState === "running" ? "Installing…" : "Install Ollama"}
              </button>
            )}
          </div>
          {installState && installState !== "running" && (
            <p className="mt-1 text-[11px] text-slate-400">
              Install: {installState}
            </p>
          )}
          {locals.length > 0 && !engineUp && (
            <p className="mt-1 text-[11px] text-slate-500">
              Install Ollama or LM Studio to unlock AI features for free.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <span className="section-label block">All providers</span>
        <LlmProviderCards onChanged={refreshProviders} />
      </div>

      {note && <p className="text-[11px] text-slate-400">{note}</p>}
    </div>
  );
}

export function Settings() {
  const [keyStatus, setKeyStatus] = useState<"loading" | "set" | "unset">(
    "loading",
  );
  useEffect(() => {
    api
      .systemInfo()
      .then((d) => setKeyStatus(d.api_key_set ? "set" : "unset"))
      .catch(() => setKeyStatus("unset"));
  }, []);

  return (
    <div className="space-y-6 page-enter max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Settings2 className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-bold gradient-text">Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure World Labs MCP
          </p>
        </div>
      </div>

      {/* API Configuration */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Key className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-200">
            API Configuration
          </h3>
        </div>

        <div className="space-y-2">
          <span className="section-label block">Marble API Key</span>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                keyStatus === "loading"
                  ? "bg-slate-500 animate-pulse"
                  : keyStatus === "set"
                    ? "bg-aurora-400"
                    : "bg-red-400",
              )}
            />
            <span className="text-slate-300">
              {keyStatus === "loading"
                ? "Checking server configuration..."
                : keyStatus === "set"
                  ? "API key configured on the server"
                  : "No API key configured on the server"}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Set{" "}
            <code className="font-mono text-slate-500">WORLDLABS_API_KEY</code>{" "}
            in your environment (recommended), then restart the server. Get your
            key at{" "}
            <a
              href="https://platform.worldlabs.ai/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cosmos-400 hover:text-cosmos-300 transition-colors"
            >
              platform.worldlabs.ai
            </a>
            .
          </p>
        </div>
      </div>

      {/* Pricing & Credits */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Wallet className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-200">
            Pricing & Credits
          </h3>
        </div>
        <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
          <p>
            This MCP server wraps the{" "}
            <strong className="text-slate-200">World Labs Marble API</strong>.
            You need a{" "}
            <a
              href="https://platform.worldlabs.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cosmos-400 hover:text-cosmos-300 transition-colors"
            >
              World Labs account
            </a>{" "}
            with <strong className="text-slate-200">API credits</strong> — a
            free Marble account is not sufficient. Web App credits and API
            credits are separate billing pools.
          </p>
          <div className="bg-white/[0.03] rounded-lg p-4 space-y-2 border border-white/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">marble-1.1 (default)</span>
              <span className="text-slate-200 font-mono">
                1,500 credits / world
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">marble-1.1-plus (larger)</span>
              <span className="text-slate-200 font-mono">
                1,500 + 300 / dynamic cube
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Credits are consumed per generation regardless of success. Pricing
            and credit packages are set by World Labs — check the{" "}
            <a
              href="https://platform.worldlabs.ai/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cosmos-400 hover:text-cosmos-300 transition-colors inline-flex items-center gap-1"
            >
              billing page <ExternalLink className="w-3 h-3" />
            </a>{" "}
            for current rates.
          </p>
        </div>
      </div>

      {/* Server Settings */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Key className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-200">
            Server Configuration
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Server settings (bridge port, Marble base URL, polling and generation
          timeouts) are configured via environment variables and{" "}
          <code className="font-mono text-slate-400">.env</code> — restart the
          server after changing them. See INSTALL.md for the full variable list.
        </p>
      </div>

      {/* Display */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Globe2 className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-200">UI Preferences</h3>
        </div>
        <div className="text-sm text-slate-300">Dark mode (always enabled)</div>
        <p className="text-xs text-slate-500">
          The fleet identity — the webapp is dark by default and stays dark.
        </p>
      </div>

      <LLMSettings />
    </div>
  );
}
