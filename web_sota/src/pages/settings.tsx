import { ExternalLink, Globe2, Key, Settings2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function LLMSettings() {
  const [providers, setProviders] = useState<{
    ollama?: { models: { name: string }[] };
    lmstudio?: { models: { name: string }[] };
  }>({});
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [selectedModel, setSelectedModel] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  useEffect(() => {
    api
      .discoverLlms()
      .then((d) => {
        setProviders(d);
        const savedP = localStorage.getItem("llm_provider") || "ollama";
        const savedM = localStorage.getItem("llm_model") || "";
        setSelectedProvider(savedP);
        const models =
          (savedP === "ollama" ? d.ollama?.models : d.lmstudio?.models) || [];
        setSelectedModel(
          savedM && models.some((m) => m.name === savedM)
            ? savedM
            : models[0]?.name || "",
        );
        setStatus(models.length > 0 ? "ready" : "error");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);
  const save = (p: string, m: string) => {
    localStorage.setItem("llm_provider", p);
    localStorage.setItem("llm_model", m);
  };
  const models =
    (selectedProvider === "ollama"
      ? providers.ollama?.models
      : providers.lmstudio?.models) || [];
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <Settings2 className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
        <h3 className="text-sm font-bold text-slate-200">Local LLM</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="section-label block">Provider</label>
          <select
            className="input-glass font-mono w-full"
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value);
              save(e.target.value, "");
            }}
          >
            <option value="ollama">Ollama</option>
            <option value="lm_studio">LM Studio</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="section-label block">Model</label>
          <select
            className="input-glass font-mono w-full"
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              save(selectedProvider, e.target.value);
            }}
            disabled={status !== "ready"}
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          {status === "error" && (
            <p className="text-xs text-slate-500">
              No local LLM detected. Start Ollama or LM Studio to enable AI
              features.
            </p>
          )}
        </div>
      </div>
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
