import { Bot, Download, Eraser, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LlmProvider {
  id: string;
  available: boolean;
  models: { id: string; name: string }[];
}

const PERSONALITIES = [
  {
    id: "default",
    label: "Default",
    prompt: "You are a helpful assistant for World Labs 3D world generation.",
  },
  {
    id: "world-builder",
    label: "World Builder",
    prompt:
      "You are an expert world-building assistant. Help craft vivid, spatially coherent prompts for Marble.",
  },
  {
    id: "spark-guide",
    label: "Spark Guide",
    prompt:
      "You are a Spark 2.0 rendering expert. Help optimize Gaussian splat viewing and LoD.",
  },
  {
    id: "dcc-bridge",
    label: "DCC Bridge",
    prompt:
      "You are a DCC pipeline expert for Blender, Unity, and Resonite handoff.",
  },
  { id: "custom", label: "Custom", prompt: "" },
];

const STORAGE_KEY = "worldlabs-chat-history";
const MAX_MESSAGES = 100;

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Message[];
  } catch {
    /* ignore */
  }
  return [];
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [personality, setPersonality] = useState("default");
  const [customPrompt, setCustomPrompt] = useState("");
  const [skillPreprompt, setSkillPreprompt] = useState("");
  const [llmProvider, setLlmProvider] = useState<LlmProvider | null>(null);
  const [llmModel, setLlmModel] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load skills as system preprompt
  useEffect(() => {
    fetch(`${API_BASE}/api/capabilities`)
      .then((r) => r.json())
      .then((d: { skills?: string; tools?: unknown }) => {
        if (d.skills) setSkillPreprompt(String(d.skills));
      })
      .catch(() => {});
    // LLM discovery
    fetch(`${API_BASE}/api/llm/discover`)
      .then((r) => r.json())
      .then((d: { ollama?: LlmProvider; lmstudio?: LlmProvider }) => {
        const ollama = d.ollama?.available ? d.ollama : null;
        const lmstudio = d.lmstudio?.available ? d.lmstudio : null;
        const chosen = ollama || lmstudio || null;
        if (chosen) {
          setLlmProvider(chosen);
          const saved = localStorage.getItem("llm_model");
          setLlmModel(saved || chosen.models[0]?.id || "");
        }
      })
      .catch(() => {});
    // Also try /api/skills
    fetch(`${API_BASE}/api/skills`)
      .then((r) => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d) && d.length > 0)
          setSkillPreprompt(JSON.stringify(d).slice(0, 2000));
        else if (d && typeof d === "object")
          setSkillPreprompt(JSON.stringify(d).slice(0, 2000));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_MESSAGES)),
      );
    } catch {
      /* ignore */
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg].slice(-MAX_MESSAGES));
    setInput("");
    setSending(true);
    try {
      const personalityPrompt =
        PERSONALITIES.find((p) => p.id === personality)?.prompt || "";
      const sysPrompt = [
        skillPreprompt,
        personality === "custom" ? customPrompt : personalityPrompt,
      ]
        .filter(Boolean)
        .join("\n\n");
      const res = await fetch(`${API_BASE}/api/llm/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          system: sysPrompt || undefined,
          model: llmModel || undefined,
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as {
        content?: string;
        message?: string;
        reply?: string;
      };
      const reply =
        data.content || data.message || data.reply || JSON.stringify(data);
      setMessages((m) =>
        [...m, { role: "assistant", content: reply }].slice(-MAX_MESSAGES),
      );
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      setMessages((m) =>
        [
          ...m,
          {
            role: "assistant",
            content: `Error: ${err}. Is a local LLM running? Check /local-llm.`,
          },
        ].slice(-MAX_MESSAGES),
      );
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleExport = () => {
    const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldlabs-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const examplePrompts = [
    "Generate a world from: a misty Japanese garden at dawn",
    "List my recent worlds",
    "How do I export a world to Blender?",
    "Refine this prompt: cyberpunk alley at night",
    "What is Spark 2.0 LoD?",
    "Show me the Marble Community Gallery",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]" data-testid="chat-page">
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]"
        data-testid="chat-controls"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmos-500 to-aurora-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Chat</h1>
            <p className="text-xs text-slate-400">
              Skill-first assistant with local LLM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {llmProvider
              ? `${llmProvider.id} ${llmModel || ""}`
              : "No LLM detected"}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${llmProvider ? "bg-emerald-500" : "bg-amber-500"}`}
            title={llmProvider ? "LLM ready" : "No LLM"}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: personality + examples */}
        <div className="hidden lg:flex flex-col w-64 border-r border-white/[0.06] p-4 gap-4 overflow-y-auto">
          <div>
            <label className="section-label block mb-2">Personality</label>
            <select
              data-testid="personality-select"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-100"
            >
              {PERSONALITIES.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">
                  {p.label}
                </option>
              ))}
            </select>
            {personality === "custom" && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Custom system prompt..."
                className="mt-2 w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 min-h-[80px]"
              />
            )}
          </div>

          {llmProvider && llmProvider.models.length > 0 && (
            <div>
              <label className="section-label block mb-2">Model</label>
              <select
                data-testid="llm-model-select"
                value={llmModel}
                onChange={(e) => {
                  setLlmModel(e.target.value);
                  localStorage.setItem("llm_model", e.target.value);
                }}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                {llmProvider.models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">
                    {m.name || m.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="section-label mb-2">Example Prompts</div>
            <div className="space-y-1" data-testid="example-prompts">
              {examplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="w-full text-left text-xs text-slate-400 hover:text-cosmos-300 bg-white/[0.03] hover:bg-white/[0.06] rounded px-2 py-1.5 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              data-testid="chat-export"
              onClick={handleExport}
              disabled={messages.length === 0}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-30 rounded-lg px-2 py-2 text-slate-300"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              data-testid="chat-clear"
              onClick={handleClear}
              disabled={messages.length === 0}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-30 rounded-lg px-2 py-2 text-slate-300"
            >
              <Eraser className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            data-testid="chat-messages"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Sparkles className="w-10 h-10 text-cosmos-400/50 mb-4" />
                <h3 className="text-sm font-semibold text-white mb-1">
                  Welcome to World Labs Chat
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Ask about world generation, Spark rendering, or DCC export.
                  The assistant uses your selected personality + world skills as
                  the system prompt. Local LLM is detected automatically.
                </p>
                <div
                  className="flex flex-wrap gap-2 mt-4 justify-center lg:hidden"
                  data-testid="example-prompts"
                >
                  {examplePrompts.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="text-xs text-cosmos-300 bg-cosmos-500/10 border border-cosmos-500/20 rounded-full px-3 py-1"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-cosmos-600 text-white rounded-br-sm"
                        : "bg-white/[0.06] border border-white/[0.08] text-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-2 bg-[#070510]/50">
            <input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                llmProvider
                  ? "Ask about worlds, Spark, or export..."
                  : "Start Ollama/LM Studio first, then chat..."
              }
              className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cosmos-500/50"
            />
            <button
              data-testid="chat-send"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="w-9 h-9 rounded-full bg-cosmos-600 hover:bg-cosmos-500 disabled:opacity-30 flex items-center justify-center text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
