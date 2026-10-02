/**
 * Resident-first local LLM model selection for fleet webapps.
 *
 * Canonical source: mcp-central-docs/templates/llm-detect/model-preference.ts
 * Python twin: mcp-central-docs/templates/llm-detect/detect.py (pick_model)
 *
 * The rule: NEVER load a different model while a preferred one is resident in
 * Ollama. Loading a second big model evicts the first and forces a ~30s cold
 * reload for every client using it. So the chat/settings default must be
 * resolved resident-first:
 *
 *   1. Probe Ollama /api/ps (models loaded right now)
 *   2. Use the highest-preference model that is already loaded
 *   3. If nothing loaded, use the highest-preference INSTALLED model (/api/tags)
 *   4. Fall back to the old default only if the preference list is not installed
 *
 * Multi-GPU (dual NVIDIA, e.g. 4090 + 16 GB secondary):
 *   The primary 4090 is typically occupied by resident Muse Glimmer (~21 GB).
 *   Webapp models must land on the SECONDARY card. `pickTargetGpu` resolves
 *   that target (default = index > 0, i.e. GPU #2); `pickPreferredModel` only
 *   considers models that FIT the target card's VRAM, so a 27B model is never
 *   selected for a 16 GB secondary.
 */

export const FLEET_MODEL_PREFERENCE = [
  "qwen3.8:27b",
  "gemma4:12b",
  "qwen2.5-coder:32b-instruct-q4_K_M",
  "deepseek-r1:32b",
  "gemma4:26b",
  "qwen2.5-coder:14b",
  "llama3.1:8b",
  "qwen2.5-coder:7b",
  "mistral:7b",
  "llama3.2:3b",
] as const;

/** Approx. minimum VRAM (MB) per model tier - matches TIERS in detect.py. */
const MODEL_TIER_MIN_VRAM_MB: Record<string, number> = {
  "qwen3.8:27b": 20000,
  "gemma4:12b": 20000,
  "qwen2.5-coder:32b-instruct-q4_K_M": 32000,
  "deepseek-r1:32b": 32000,
  "gemma4:26b": 32000,
  "qwen2.5-coder:14b": 20000,
  "llama3.1:8b": 20000,
  "qwen2.5-coder:7b": 14000,
  "mistral:7b": 14000,
  "llama3.2:3b": 14000,
};

export interface GpuInfo {
  index: number;
  name: string;
  vramMb: number;
}

export interface OllamaModelsState {
  /** Models currently loaded in Ollama (from GET /api/ps). */
  loaded: string[];
  /** Models installed in Ollama (from GET /api/tags). */
  installed: string[];
}

/**
 * Pick the GPU where local models should live.
 * Default = the SECONDARY card (index > 0), because the primary 4090 holds
 * resident Glimmer. Falls back to GPU 0 on a single-card machine.
 */
export function pickTargetGpu(
  gpus: GpuInfo[],
  preferred?: number,
): GpuInfo | null {
  if (gpus.length === 0) return null;
  if (preferred !== undefined) {
    const hit = gpus.find((g) => g.index === preferred);
    if (hit) return hit;
  }
  return gpus.find((g) => g.index > 0) ?? gpus[0];
}

/** True when a model's tier fits the target GPU's VRAM. */
export function fitsTarget(model: string, target: GpuInfo | null): boolean {
  if (!target || !target.vramMb) return true;
  const minVram = MODEL_TIER_MIN_VRAM_MB[model];
  if (minVram === undefined) return true;
  return target.vramMb >= minVram;
}

/**
 * Pick the default chat model, resident-first AND target-GPU-aware.
 * Returns "" if none available. Models that do not fit the target card
 * (e.g. a 27B on a 16 GB secondary) are skipped entirely.
 */
export function pickPreferredModel(
  psModels: string[],
  tagsModels: string[],
  targetGpu?: GpuInfo | null,
): string {
  const installedOrder = FLEET_MODEL_PREFERENCE.filter(
    (m) => tagsModels.includes(m) && fitsTarget(m, targetGpu ?? null),
  );
  const loaded = new Set(psModels);
  for (const m of installedOrder) {
    if (loaded.has(m)) return m; // resident wins - never evict it
  }
  return installedOrder[0] ?? ""; // fallback: highest-preference installed that fits
}

/** Probe Ollama for loaded + installed models. Returns empty state on failure. */
// NOTE: 127.0.0.1, not localhost — localhost can resolve to ::1 where nothing
// listens (measured 2026-09-21). Callers may still pass an explicit base.
export async function fetchOllamaModels(
  base = "http://127.0.0.1:11434",
): Promise<OllamaModelsState> {
  const state: OllamaModelsState = { loaded: [], installed: [] };
  try {
    const [tags, ps] = await Promise.all([
      fetch(`${base}/api/tags`).then((r) => r.json()),
      fetch(`${base}/api/ps`).then((r) => r.json()),
    ]);
    state.installed = (tags.models ?? []).map((m: { name: string }) => m.name);
    state.loaded = (ps.models ?? []).map((m: { name: string }) => m.name);
  } catch {
    // provider down — caller falls back to its existing default/disabled state
  }
  return state;
}

/**
 * Enumerate NVIDIA GPUs. The browser cannot run nvidia-smi, so the backend
 * must expose this via an endpoint (e.g. GET /api/llm/gpus) returning
 * [{ index, name, vramMb }]. Falls back to [] when absent (single-GPU or
 * non-NVIDIA machines degrade to the old behavior).
 */
export async function fetchGpus(backendBase = ""): Promise<GpuInfo[]> {
  if (!backendBase) return [];
  try {
    const r = await fetch(`${backendBase}/api/llm/gpus`);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d.gpus) ? d.gpus : [];
  } catch {
    return [];
  }
}

/**
 * Resolve the default model with one round trip, honoring a previously
 * user-selected model (localStorage llm_model) when it is still installed AND
 * fits the target GPU.
 */
export async function resolveDefaultModel(
  previous: string,
  base = "http://127.0.0.1:11434",
  targetGpu?: GpuInfo | null,
): Promise<string> {
  const state = await fetchOllamaModels(base);
  if (state.installed.length === 0) return previous ?? "";
  const preferred = pickPreferredModel(
    state.loaded,
    state.installed,
    targetGpu,
  );
  if (
    previous &&
    state.installed.includes(previous) &&
    fitsTarget(previous, targetGpu ?? null)
  ) {
    return previous;
  }
  return preferred;
}
