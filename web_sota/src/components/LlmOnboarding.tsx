// VENDORED from arxiv-mcp/web_sota/src/components/LlmOnboarding.tsx (fleet
// canonical copy per WEBAPP_SOTA_STANDARDS.md section VI.11) - do not rewrite the
// contracts (testids, endpoint shapes, localStorage keys); fix upstream and
// re-vend. Worldlabs adaptations: no @/components/ui primitives (native
// button + glass-card styling), imports from @/lib/api.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import {
  fetchOnboarding,
  fetchProviders,
  isOnboarded,
  loadSelection,
  markOnboarded,
  type OnboardingState,
  type ProviderInfo,
  saveLlmSettings,
  saveSelection,
} from "@/lib/llm";
import { cn } from "@/lib/utils";

type Props = {
  /** banner: render only when setup is incomplete. full: always render status + setup. */
  mode: "banner" | "full";
};

export function LlmOnboarding({ mode }: Props) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(mode === "full");
  const [choice, setChoice] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(isOnboarded());

  useEffect(() => {
    (async () => {
      try {
        const [ob, pv] = await Promise.all([
          fetchOnboarding(),
          fetchProviders().catch(() => null),
        ]);
        setState(ob);
        if (pv) setProviders(pv.providers);
        const rec = ob.recommendation.path;
        if (rec.startsWith("cloud:")) setChoice(rec);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (mode === "full") setExpanded(true);
  }, [mode]);

  if (loading || error || !state) return null;

  const detectedLocals = providers.filter(
    (p) => p.kind === "local" && p.detected,
  );
  const clouds: ProviderInfo[] = providers.filter((p) => p.kind === "cloud");
  const ready = detectedLocals.length > 0 || state.clouds_configured.length > 0;

  if (mode === "banner" && (ready || done)) return null;

  const needsKey = choice.startsWith("cloud:");
  const chosenCloud = needsKey ? choice.slice("cloud:".length) : "";

  async function save() {
    if (!choice) return;
    setSaving(true);
    setError(null);
    try {
      if (choice.startsWith("local:")) {
        const id = choice.slice("local:".length);
        const prev = loadSelection();
        const model = prev.provider === id && prev.model ? prev.model : "";
        await saveLlmSettings({ provider: id, model });
        saveSelection(id, model);
      } else {
        const id = chosenCloud;
        const prev = loadSelection();
        const model = prev.provider === id && prev.model ? prev.model : "";
        await saveLlmSettings({
          provider: id,
          model,
          api_key: keyInput || undefined,
        });
        saveSelection(id, model);
      }
      markOnboarded();
      setDone(true);
      const pv = await fetchProviders().catch(() => null);
      if (pv) setProviders(pv.providers);
      const ob = await apiGet<OnboardingState>("/api/llm/onboarding").catch(
        () => null,
      );
      if (ob) setState(ob);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="llm-onboarding"
      className={cn(
        "glass-card p-4 md:p-5",
        !ready && "border-red-500/50 bg-red-500/[0.04]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {ready ? "AI provider ready" : "Set up AI to enable chat"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            {ready
              ? "A local engine or cloud key is configured. Change providers anytime in Settings."
              : state.recommendation.reason}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "banner" && !ready && !expanded && (
            <button
              data-testid="onboarding-cue"
              onClick={() => setExpanded(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
            >
              Set up AI
            </button>
          )}
          {mode === "banner" && (
            <Link
              to="/settings"
              className="text-xs text-slate-400 hover:text-slate-200 rounded-lg px-3 py-2 transition"
            >
              Settings
            </Link>
          )}
        </div>
      </div>

      {(expanded || mode === "full") && !done && (
        <div className="mt-4 space-y-2" data-testid="onboarding-paths">
          {detectedLocals.map((p) => (
            <label
              key={p.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer text-slate-200",
                choice === `local:${p.id}`
                  ? "border-cosmos-500/60 bg-cosmos-500/5"
                  : "border-white/[0.08]",
              )}
            >
              <input
                type="radio"
                name="llm-path"
                checked={choice === `local:${p.id}`}
                onChange={() => setChoice(`local:${p.id}`)}
              />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{p.label}</span>
              <span className="text-slate-400 text-xs">
                detected · free · {p.models?.length ?? 0} models
              </span>
            </label>
          ))}

          {clouds.map((p) => (
            <label
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer text-slate-200",
                choice === `cloud:${p.id}`
                  ? "border-cosmos-500/60 bg-cosmos-500/5"
                  : "border-white/[0.08]",
              )}
            >
              <input
                type="radio"
                name="llm-path"
                checked={choice === `cloud:${p.id}`}
                onChange={() => setChoice(`cloud:${p.id}`)}
              />
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  p.configured ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              <span className="font-medium">{p.label}</span>
              <span className="text-slate-400 text-xs">
                {p.configured
                  ? "key configured"
                  : `needs ${p.key_env} — cheapest instant path`}
              </span>
              {choice === `cloud:${p.id}` && !p.configured && (
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Paste ${p.key_env}`}
                  aria-label={`${p.label} API key`}
                  data-testid={`llm-key-${p.id}`}
                  className="w-full sm:w-72 rounded border border-white/[0.08] bg-white/[0.05] px-2 py-1 font-mono text-xs mt-1 text-slate-100"
                />
              )}
            </label>
          ))}

          {state.locals.length > 0 && detectedLocals.length === 0 && (
            <p className="text-xs text-slate-400 rounded-lg border border-white/[0.08] px-3 py-2">
              No local engine running. Free path: install Ollama (
              <code className="font-mono">
                winget install -e --id Ollama.Ollama
              </code>
              , then <code className="font-mono">ollama pull qwen3.8:27b</code>)
              and come back — or paste a cloud key above.
            </p>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={
                saving ||
                !choice ||
                (needsKey &&
                  !keyInput &&
                  !clouds.find((c) => c.id === chosenCloud)?.configured)
              }
              data-testid="onboarding-save"
              className="text-sm bg-cosmos-600 hover:bg-cosmos-500 disabled:opacity-30 rounded-lg px-4 py-2 text-white transition"
            >
              {saving ? "Saving…" : "Use this setup"}
            </button>
          </div>
        </div>
      )}

      {done && mode === "full" && (
        <p className="text-xs text-emerald-400 mt-3">
          Saved. Chat is enabled with your selection.
        </p>
      )}
    </div>
  );
}
