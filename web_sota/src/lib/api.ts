const BASE = '/api';

// ── Asset types ───────────────────────────────────────────────────────────────

export interface SpzUrls {
    '100k': string;
    '500k': string;
    full_res: string;
}

export interface WorldAssets {
    caption?: string;
    thumbnail_url?: string;
    splats?: { spz_urls: SpzUrls };
    mesh?: { collider_mesh_url: string };
    imagery?: { pano_url: string };
    /** Normalised flat URLs injected by the bridge */
    _assets?: FlatAssets;
}

export interface FlatAssets {
    splat_100k?: string;
    splat_500k?: string;
    splat_full?: string;
    mesh?: string;
    panorama?: string;
    thumbnail?: string;
    caption?: string;
}

export type AssetType = 'splat_100k' | 'splat_500k' | 'splat_full' | 'mesh' | 'panorama';

export interface World {
    id: string;
    display_name?: string;
    world_marble_url?: string;
    model?: string;
    assets?: WorldAssets;
    _assets?: FlatAssets;
    created_at?: string;
    updated_at?: string;
}

export interface OperationProgress {
    status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
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
    status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'POLL_ERROR' | 'TIMEOUT';
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
    target: 'resonite' | 'unity3d' | 'blender';
    asset_type: 'splat' | 'mesh';
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

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
}

// ── Download helper ───────────────────────────────────────────────────────────

export function downloadAssetUrl(worldId: string, assetType: AssetType, assetUrl: string): string {
    const params = new URLSearchParams({ asset_type: assetType, url: assetUrl });
    return `${BASE}/worlds/${worldId}/download?${params.toString()}`;
}

export function triggerDownload(worldId: string, assetType: AssetType, assetUrl: string): void {
    const a = document.createElement('a');
    a.href = downloadAssetUrl(worldId, assetType, assetUrl);
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ── SSE streaming helper ──────────────────────────────────────────────────────

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
    const url = `${BASE}/operations/${operationId}/stream`;
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

// ── API client ────────────────────────────────────────────────────────────────

export const api = {
    health: () => get<HealthResponse>('/health'),
    systemInfo: () => get<SystemInfo>('/system'),

    // Operations
    getOperation: (id: string) => get<Operation>(`/operations/${id}`),
    getWorld: (id: string) => get<{ world: World }>(`/worlds/${id}`),

    // Generation
    generateText: (prompt: string, name: string, model: string) =>
        post<Operation>('/generate/text', { prompt, name, model }),
    generateImage: (url: string, prompt: string, name: string, model: string, is_panorama: boolean) =>
        post<Operation>('/generate/image', { url, prompt, name, model, is_panorama }),
    generateVideo: (url: string, prompt: string, name: string, model: string) =>
        post<Operation>('/generate/video', { url, prompt, name, model }),

    // LLM discovery
    discoverLlms: () => get<LlmDiscoveryResult>('/llm/discover'),
    refinePrompt: (req: RefineRequest) => post<{ refined: string }>('/llm/refine', req),

    // DCC export
    exportToBlender: (req: ExportRequest) => post<ExportResult>('/export/blender', req),
    exportToUnity3D: (req: ExportRequest) => post<ExportResult>('/export/unity3d', req),
    exportToResonite: (req: ExportRequest) => post<ExportResult>('/export/resonite', req),

    // Unified Handoff
    handoffAsset: (req: HandoffRequest) => post<ExportResult>('/handoff', req),

    // History
    getHistory: () => get<Operation[]>('/history'),

    // Prompt Memory
    getPrompts: () => get<PromptEntry[]>('/prompts'),
    createPrompt: (entry: Partial<PromptEntry>) => post<PromptEntry>('/prompts', entry),
    updatePrompt: (id: string, update: PromptUpdate) => patch<PromptEntry>(`/prompts/${id}`, update),
    deletePrompt: (id: string) => del<{ status: string }>(`/prompts/${id}`),
};
