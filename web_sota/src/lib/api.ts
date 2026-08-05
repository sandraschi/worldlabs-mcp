export const API_BASE = "http://127.0.0.1:10865";
const BASE = "/api";

// ÔöÇÔöÇ Asset types ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

export interface SpzUrls {
  "100k": string;
  "500k": string;
  full_res: string;
}

export interface WorldAssets {
  caption?: string;
  thumbnail_url?: string;
  splats?: { spz_urls: SpzUrls };
  mesh?: { collider_mesh_url: string };
  imagery?: { pano_url: string };
  _assets?: FlatAssets;
}

export interface FlatAssets {
  rad?: string;
  ksplat?: string;
  splat_100k?: string;
  splat_500k?: string;
  splat_full?: string;
  mesh?: string;
  panorama?: string;
  thumbnail?: string;
  caption?: string;
}

export type AssetType =
  | "rad"
  | "ksplat"
  | "splat_100k"
  | "splat_500k"
  | "splat_full"
  | "mesh"
  | "panorama";

export interface World {
  id?: string;
  world_id?: string;
  display_name?: string;
  world_marble_url?: string;
  model?: string;
  assets?: WorldAssets;
  _assets?: FlatAssets;
  created_at?: string;
  updated_at?: string;
}

export interface OperationProgress {
  status: "IN_PROGRESS" | "SUCCEEDED" | "FAILED";
  description?: string;
}

export interface OperationMetadata {
  progress?: OperationProgress;
  world_id?: string;
}

export interface Operation {
  operation_id: string;
  created_at?: string;
  done: boolean;
  error?: string | null;
  metadata?: OperationMetadata | null;
  response?: World | null;
}

/** Payload emitted by the SSE /api/operations/{id}/stream endpoint */
export interface OperationStreamEvent {
  operation_id: string;
  done: boolean;
  status: "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "POLL_ERROR" | "TIMEOUT";
  description?: string;
  elapsed_seconds?: number;
  response?: World | null;
}

export interface ToolInfo {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface SystemInfo {
  name: string;
  version: string;
  description: string;
  tools: ToolInfo[];
  api_key_set: boolean;
  base_url: string;
}

export interface HealthResponse {
  status: string;
  timestamp?: string;
}

export interface LlmModel {
  id: string;
  name: string;
  provider: string;
  size?: string;
  parameters?: string;
}

export interface LlmProvider {
  available: boolean;
  models: LlmModel[];
  url: string;
}

export interface LlmDiscoveryResult {
  ollama: LlmProvider;
  lmstudio: LlmProvider;
}

export interface ExportRequest {
  world_id: string;
  world_name?: string;
  spz_url?: string;
  mesh_url?: string;
  splat_lod?: string;
}

export interface RefineRequest {
  prompt: string;
  style?: string;
  provider: string;
  model: string;
}

export interface HandoffRequest {
  world_id: string;
  target: "resonite" | "unity3d" | "blender";
  asset_type: "splat" | "mesh";
  asset_url: string;
}

export interface ExportResult {
  status: string;
  world_id: string;
  target: string;
  note?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface PromptEntry {
  id: string;
  text: string;
  style: string;
  timestamp: string;
  fave: boolean;
  star: boolean;
  comment: string;
}

export interface PromptUpdate {
  fave?: boolean;
  star?: boolean;
  comment?: string;
}

export interface NarrationRequest {
  type: "speech" | "audio" | "video" | "avatar" | "event";
  text?: string;
  url?: string;
  x?: number;
  y?: number;
  z?: number;
  is_loop?: boolean;
  rotation?: number;
  scale?: number;
}

export interface NarrationResponse {
  status: string;
  recipients: number;
}

// ÔöÇÔöÇ HTTP helpers ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

// -- Plex types ----------------------------------------------------------------

export interface PlexStatus {
  available: boolean;
  server_name?: string;
  version?: string;
  base_url?: string;
  error?: string;
}

export interface PlexLibrary {
  id: string;
  title: string;
  type: string;
  count?: number;
}

export interface PlexItem {
  rating_key: string;
  title: string;
  type: string;
  year?: number;
  summary?: string;
  thumb?: string;
  art?: string;
  duration_ms?: number;
  duration_s?: number;
  part_key?: string;
  grandparent_title?: string;
  parent_index?: number;
  index?: number;
}

export interface PlexBrowseResult {
  total: number;
  page: number;
  page_size: number;
  items: PlexItem[];
}

export interface PlexVideoUrl {
  proxy_url: string;
  direct_url: string;
  title?: string;
  part_key?: string;
}

export interface PlexGenerateRequest {
  rating_key: string;
  display_name?: string;
  text_prompt?: string;
  model?: string;
}

export interface GalleryEntry {
  id: string;
  display_name: string;
  owner: string;
  owner_id: string;
  like_count: number;
  created_at: number;
  tags: string[];
  model: string;
  seed: number;
  prompt: string;
  minimap_url: string | null;
  spz_urls: string[];
  marble_url: string;
}

export interface GalleryBrowseResult {
  tag: string;
  next_page_token: string;
  count: number;
  entries: GalleryEntry[];
}

function urlFor(path: string): string {
  return `${API_BASE}${BASE}${path}`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(urlFor(path));
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(urlFor(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(urlFor(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(urlFor(path), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function downloadAssetUrl(
  worldId: string,
  assetType: AssetType,
  assetUrl: string,
): string {
  const params = new URLSearchParams({ asset_type: assetType, url: assetUrl });
  return urlFor(`/worlds/${worldId}/download?${params.toString()}`);
}

export function triggerDownload(
  worldId: string,
  assetType: AssetType,
  assetUrl: string,
): void {
  const a = document.createElement("a");
  a.href = downloadAssetUrl(worldId, assetType, assetUrl);
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ÔöÇÔöÇ SSE streaming helper ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

/**
 * Opens an SSE connection to the bridge's stream endpoint and calls
 * onEvent for each update until done=true or the stream errors.
 * Returns a cleanup function to close the connection early.
 */
export function streamOperation(
  operationId: string,
  onEvent: (event: OperationStreamEvent) => void,
  onError?: (err: Event) => void,
): () => void {
  const url = urlFor(`/operations/${operationId}/stream`);
  const es = new EventSource(url);

  es.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data) as OperationStreamEvent;
      onEvent(event);
      if (event.done) {
        es.close();
      }
    } catch {
      // ignore malformed events
    }
  };

  es.onerror = (err) => {
    es.close();
    onError?.(err);
  };

  return () => es.close();
}

// ÔöÇÔöÇ API client ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

export const api = {
  health: () => get<HealthResponse>("/health"),
  systemInfo: () => get<SystemInfo>("/system"),

  // Operations
  getOperation: (id: string) => get<Operation>(`/operations/${id}`),
  getWorld: (id: string) => get<{ world: World }>(`/worlds/${id}`),

  // Generation
  generateText: (
    prompt: string,
    name: string,
    model: string,
    seed?: number,
    tags?: string[],
  ) => post<Operation>("/generate/text", { prompt, name, model, seed, tags }),
  generateImage: (
    url: string,
    prompt: string,
    name: string,
    model: string,
    is_panorama: boolean,
    seed?: number,
    tags?: string[],
    disable_recaption?: boolean,
  ) =>
    post<Operation>("/generate/image", {
      url,
      prompt,
      name,
      model,
      is_panorama,
      seed,
      tags,
      disable_recaption,
    }),
  generateVideo: (
    url: string,
    prompt: string,
    name: string,
    model: string,
    seed?: number,
    tags?: string[],
    disable_recaption?: boolean,
  ) =>
    post<Operation>("/generate/video", {
      url,
      prompt,
      name,
      model,
      seed,
      tags,
      disable_recaption,
    }),

  // LLM discovery
  discoverLlms: () => get<LlmDiscoveryResult>("/llm/discover"),
  refinePrompt: (req: RefineRequest) =>
    post<{ refined: string }>("/llm/refine", req),

  // DCC export
  exportToBlender: (req: ExportRequest) =>
    post<ExportResult>("/export/blender", req),
  exportToUnity3D: (req: ExportRequest) =>
    post<ExportResult>("/export/unity3d", req),
  exportToResonite: (req: ExportRequest) =>
    post<ExportResult>("/export/resonite", req),

  // Unified Handoff
  handoffAsset: (req: HandoffRequest) => post<ExportResult>("/handoff", req),

  // Media assets
  getMediaAsset: (id: string) =>
    get<Record<string, unknown>>(`/media-assets/${id}`),

  // Worlds
  getHistory: () => get<Operation[]>("/history"),
  getWorldsRemote: (pageSize = 50) =>
    get<{ worlds: World[]; next_page_token?: string }>(
      `/history/remote?page_size=${pageSize}`,
    ),
  deleteWorld: (worldId: string) =>
    del<{ world_id: string; deleted: boolean }>(`/worlds/${worldId}`),

  // ADB device detection
  adbDevices: () =>
    get<{
      success: boolean;
      devices?: { serial: string; status: string }[];
      raw?: string;
      error?: string;
    }>("/adb/devices"),

  // Spatial Narration
  broadcastNarration: (req: NarrationRequest) =>
    post<NarrationResponse>("/narration", req),

  // Prompt Memory
  getPrompts: () => get<PromptEntry[]>("/prompts"),
  createPrompt: (entry: Partial<PromptEntry>) =>
    post<PromptEntry>("/prompts", entry),
  updatePrompt: (id: string, update: PromptUpdate) =>
    patch<PromptEntry>(`/prompts/${id}`, update),
  deletePrompt: (id: string) => del<{ status: string }>(`/prompts/${id}`),
  // Plex Cinema Worlds
  plexStatus: () => get<PlexStatus>("/plex/status"),
  plexLibraries: () => get<PlexLibrary[]>("/plex/libraries"),
  plexBrowse: (sectionId: string, page = 0, pageSize = 30) =>
    get<PlexBrowseResult>(
      `/plex/library/${sectionId}?page=${page}&page_size=${pageSize}`,
    ),
  plexSearch: (q: string) =>
    get<PlexItem[]>(`/plex/search?q=${encodeURIComponent(q)}`),
  plexItem: (ratingKey: string) => get<PlexItem>(`/plex/item/${ratingKey}`),
  plexEpisodes: (ratingKey: string) =>
    get<PlexItem[]>(`/plex/item/${ratingKey}/episodes`),
  plexVideoUrl: (ratingKey: string) =>
    get<PlexVideoUrl>(`/plex/video/${ratingKey}`),
  plexGenerate: (req: PlexGenerateRequest) =>
    post<Operation>("/plex/generate", req),

  // Marble Community Gallery (public worlds from marble.worldlabs.ai)
  galleryBrowse: (tag: string, pageToken = "", pageSize = 24) =>
    get<GalleryBrowseResult>(
      `/gallery?tag=${encodeURIComponent(tag)}&page_size=${pageSize}&page_token=${encodeURIComponent(pageToken)}`,
    ),
};
