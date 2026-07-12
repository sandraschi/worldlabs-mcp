import { useState, useRef, useEffect } from "react";
import { API_BASE } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LlmModel {
  id: string;
  name: string;
  provider: string;
}

const PERSONALITIES = [
  { id: "helpful", label: "Helpful", prompt: "You are a helpful assistant." },
  { id: "expert", label: "Expert", prompt: "You are an expert technical assistant. Provide detailed, precise answers." },
  { id: "concise", label: "Concise", prompt: "You are a concise assistant. Give brief, to-the-point answers." },
];

const EXAMPLES = ["What can you do?", "Show me the current status", "Help me understand this system"];

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem("llm_chat_provider") || "ollama");
  const [model, setModel] = useState(() => localStorage.getItem("llm_chat_model") || "");
  const [models, setModels] = useState<LlmModel[]>([]);
  const [skillName, setSkillName] = useState("");
  const [personality, setPersonality] = useState(() => localStorage.getItem("fc_personality") || "helpful");
  const bottomRef = useRef<HTMLDivElement>(null);

  const API = `${API_BASE}/api`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fc_chat");
      if (saved) setChat(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      const trimmed = chat.length > 100 ? chat.slice(-100) : chat;
      localStorage.setItem("fc_chat", JSON.stringify(trimmed));
    } else {
      localStorage.removeItem("fc_chat");
    }
  }, [chat]);

  useEffect(() => {
    fetch(`${API}/llm/discover`)
      .then((r) => r.json())
      .then((d) => {
        const list: LlmModel[] = [];
        const ollamaModels = d.ollama?.models || [];
        const lmstudioModels = d.lmstudio?.models || [];
        for (const m of ollamaModels) list.push({ ...m, provider: "ollama" });
        for (const m of lmstudioModels) list.push({ ...m, provider: "lmstudio" });
        setModels(list);
        if (list.length > 0 && !model) {
          const saved = localStorage.getItem("llm_chat_model");
          if (saved && list.find((m) => m.id === saved)) {
            setModel(saved);
          } else {
            setModel(list[0].id);
            setProvider(list[0].provider);
            localStorage.setItem("llm_chat_model", list[0].id);
            localStorage.setItem("llm_chat_provider", list[0].provider);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, open]);

  useEffect(() => {
    fetch(`${API}/skills`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setSkillName(d[0].name || String(d[0]));
      })
      .catch(() => {});
  }, []);

  const sendMessage = async (text: string) => {
    setChat((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const sp = PERSONALITIES.find((p) => p.id === personality);
      const r = await fetch(`${API}/llm/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, prompt: text, system: sp?.prompt }),
      });
      const data = await r.json();
      setChat((prev) => [...prev, { role: "assistant", content: data.response || "No response" }]);
    } catch {
      setChat((prev) => [...prev, { role: "assistant", content: "Request failed. Is the backend running?" }]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleModelChange = (modelId: string) => {
    setModel(modelId);
    localStorage.setItem("llm_chat_model", modelId);
    const found = models.find((m) => m.id === modelId);
    if (found) {
      setProvider(found.provider);
      localStorage.setItem("llm_chat_provider", found.provider);
    }
  };

  const handleExport = () => {
    if (chat.length === 0) return;
    const lines = chat.map((m) => `[${m.role.toUpperCase()}] ${m.content}`);
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "chat-export.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setChat([]);
    localStorage.removeItem("fc_chat");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50" data-testid="floating-chat">
      {open ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[380px] h-[520px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">AI Chat</span>
              {skillName && <span className="text-[10px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded-full">{skillName}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <select
                className="bg-slate-800 border border-slate-600 rounded text-[10px] px-1.5 py-1 text-slate-300 max-w-[80px]"
                value={personality}
                onChange={(e) => { setPersonality(e.target.value); localStorage.setItem("fc_personality", e.target.value); }}
              >
                {PERSONALITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              {models.length > 0 && (
                <select
                  className="bg-slate-800 border border-slate-600 rounded text-xs px-2 py-1 text-slate-300 max-w-[160px]"
                  value={model}
                  onChange={(e) => handleModelChange(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.provider}] {m.name}
                    </option>
                  ))}
                </select>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">&times;</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {chat.length === 0 && models.length === 0 && (
              <p className="text-slate-500 text-xs text-center pt-8">
                No local LLM detected. Start Ollama or LM Studio first.
              </p>
            )}
            {chat.length === 0 && models.length > 0 && (
              <div className="text-center pt-4">
                <p className="text-slate-500 text-xs mb-3">Ask anything — running on your GPU.</p>
                <div className="flex flex-wrap justify-center gap-1.5" data-testid="example-prompts">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setInput(ex); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] px-2 py-1 rounded-full border border-slate-700 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 whitespace-pre-wrap ${
                  msg.role === "user" ? "bg-cyan-800 text-cyan-100" : "bg-slate-800 text-slate-300"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-slate-500 text-xs animate-pulse">Thinking...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-slate-700 p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                data-testid="floating-chat-input"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || models.length === 0}
                className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                data-testid="floating-chat-send"
              >
                Go
              </button>
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={handleExport}
                disabled={chat.length === 0}
                className="text-slate-500 hover:text-slate-300 disabled:text-slate-700 text-xs px-1.5 py-1 rounded"
                title="Export chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <button
                onClick={handleClear}
                disabled={chat.length === 0}
                className="text-slate-500 hover:text-slate-300 disabled:text-slate-700 text-xs px-1.5 py-1 rounded"
                title="Clear chat"
                data-testid="floating-chat-clear"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="h-12 w-12 rounded-full bg-cyan-700 hover:bg-cyan-600 shadow-xl flex items-center justify-center text-white text-xl transition-colors"
          title="AI Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
