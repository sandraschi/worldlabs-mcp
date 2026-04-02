const BASE = "/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export function downloadAssetUrl(worldId, assetType, assetUrl) {
  const params = new URLSearchParams({ asset_type: assetType, url: assetUrl });
  return `${BASE}/worlds/${worldId}/download?${params.toString()}`;
}

export function triggerDownload(worldId, assetType, assetUrl) {
  const a = document.createElement("a");
  a.href = downloadAssetUrl(worldId, assetType, assetUrl);
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function streamOperation(operationId, onEvent, onError) {
  const url = `${BASE}/operations/${operationId}/stream`;
  const es = new EventSource(url);
  es.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data);
      onEvent(event);
      if (event.done) es.close();
    } catch (_) {}
  };
  es.onerror = (err) => {
    es.close();
    onError?.(err);
  };
  return () => es.close();
}

export const api = {
  health: () => get("/health"),
  systemInfo: () => get("/system"),
  getOperation: (id) => get(`/operations/${id}`),
  getWorld: (id) => get(`/worlds/${id}`),
  generateText: (prompt, name, model) =>
    post("/generate/text", { prompt, name, model }),
  generateImage: (url, prompt, name, model, is_panorama) =>
    post("/generate/image", { url, prompt, name, model, is_panorama }),
  generateVideo: (url, prompt, name, model) =>
    post("/generate/video", { url, prompt, name, model }),
  discoverLlms: () => get("/llm/discover"),
  refinePrompt: (req) => post("/llm/refine", req),
  exportToBlender: (req) => post("/export/blender", req),
  exportToUnity3D: (req) => post("/export/unity3d", req),
  exportToResonite: (req) => post("/export/resonite", req),
  handoffAsset: (req) => post("/handoff", req),
  getHistory: () => get("/history"),
  getPrompts: () => get("/prompts"),
  createPrompt: (entry) => post("/prompts", entry),
  updatePrompt: (id, update) => patch(`/prompts/${id}`, update),
  deletePrompt: (id) => del(`/prompts/${id}`),
};
