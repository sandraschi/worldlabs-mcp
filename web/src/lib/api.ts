// API client for worldlabs-mcp backend (FastAPI bridge on port 10865)

const BASE = '/api';

export interface SystemInfo {
    name: string;
    version: string;
    description: string;
    tools: ToolInfo[];
    api_key_set: boolean;
    base_url: string;
}

export interface ToolInfo {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface HealthResponse {
    status: string;
    timestamp: string;
}

export interface Operation {
    name: string;
    done: boolean;
    metadata?: {
        progress?: {
            status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
            progress_percent?: number;
        };
    };
    response?: {
        world?: World;
    };
    error?: {
        code: number;
        message: string;
    };
}

export interface World {
    name: string;
    display_name: string;
    create_time: string;
    assets?: {
        thumbnail_url?: string;
        splat_url?: string;
        mesh_url?: string;
        panorama_url?: string;
        caption?: string;
    };
}

export interface LlmModel {
    id: string;
    name: string;
    provider: 'ollama' | 'lmstudio';
    size?: string;
    parameters?: string;
}

export interface LlmDiscoveryResult {
    ollama: { available: boolean; models: LlmModel[]; url?: string };
    lmstudio: { available: boolean; models: LlmModel[]; url?: string };
}

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

export const api = {
    health: () => get<HealthResponse>('/health'),
    systemInfo: () => get<SystemInfo>('/system'),
    getOperation: (id: string) => get<Operation>(`/operations/${id}`),
    generateFromText: (prompt: string, name: string, model: string) =>
        post<Operation>('/generate/text', { prompt, name, model }),
    generateFromImage: (url: string, prompt: string, name: string, model: string, isPano: boolean) =>
        post<Operation>('/generate/image', { url, prompt, name, model, is_panorama: isPano }),
    generateFromVideo: (url: string, prompt: string, name: string, model: string) =>
        post<Operation>('/generate/video', { url, prompt, name, model }),
    discoverLlms: () => get<LlmDiscoveryResult>('/llm/discover'),
};
