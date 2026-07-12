import { create } from "zustand";
import { API_BASE } from "./api";

export interface BackendStatus {
  ok: boolean | null;
  error?: string;
}

interface AppState {
  backend: BackendStatus;
  setBackend: (status: BackendStatus) => void;
  checkHealth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  backend: { ok: null },
  setBackend: (status) => set({ backend: status }),
  checkHealth: async () => {
    try {
      const r = await fetch(`${API_BASE}/api/health`);
      set({ backend: { ok: r.ok } });
    } catch (e) {
      set({ backend: { ok: false, error: e instanceof Error ? e.message : "Network error" } });
    }
  },
}));
