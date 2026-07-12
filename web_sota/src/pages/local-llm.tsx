import { type LlmModel, api, API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
	Brain,
	CheckCircle2,
	Cpu,
	Download,
	HardDrive,
	Layers,
	MessageSquare,
	RefreshCw,
	Send,
	Trash2,
	XCircle,
	Zap,
} from "lucide-react";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WORLDLABS_EXPERT_SKILL, PERSONALITIES, type PersonalityId } from "@/skills/worldlabs-expert";

function CopyButton({ text, label }: { text: string; label?: string }) {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<button onClick={handleCopy} className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-slate-400 hover:text-white" title={label || `Copy: ${text}`} aria-label={label || `Copy: ${text}`}>
			{copied ? <Check className="w-3.5 h-3.5 text-aurora-400" /> : <Copy className="w-3.5 h-3.5" />}
		</button>
	);
}

function ModelCard({ model, provider }: { model: LlmModel; provider: string }) {
	return (
		<div className="glass-card-hover p-4 flex items-center gap-3">
			<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nebula-600/30 to-cosmos-600/30 border border-nebula-500/20 flex items-center justify-center flex-shrink-0">
				<Layers className="w-4 h-4 text-nebula-400" aria-hidden="true" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm font-semibold text-slate-200 truncate">{model.name}</div>
				<div className="text-xs text-slate-500 mt-0.5">{provider}</div>
			</div>
			{model.size && <div className="flex items-center gap-1 text-xs text-slate-500"><HardDrive className="w-3 h-3" />{model.size}</div>}
			{model.parameters && <span className="badge-info">{model.parameters}</span>}
			<CopyButton text={`ollama run ${model.id}`} />
		</div>
	);
}

function ProviderSection({ name, available, models, url }: { name: string; available: boolean; models: LlmModel[]; url?: string }) {
	return (
		<div className="glass-card p-5 space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", available ? "bg-aurora-500/20" : "bg-slate-700/40")}>
						<Cpu className={cn("w-4 h-4", available ? "text-aurora-400" : "text-slate-500")} aria-hidden="true" />
					</div>
					<div>
						<div className="text-sm font-bold text-slate-200">{name}</div>
						{url && <div className="text-xs text-slate-500 font-mono">{url}</div>}
					</div>
				</div>
				{available ? (
					<span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Running</span>
				) : (
					<span className="badge-error"><XCircle className="w-3 h-3" /> Not found</span>
				)}
			</div>
			{available && models.length > 0 && (
				<div className="space-y-2">
					<div className="section-label">Loaded Models ({models.length})</div>
					{models.map((m) => <ModelCard key={m.id} model={m} provider={name} />)}
				</div>
			)}
			{available && models.length === 0 && <div className="text-sm text-slate-500 py-2 text-center">No models found.</div>}
			{!available && (
				<div className="text-sm text-slate-500 space-y-2">
					<p>Install {name} to enable local LLM inference.</p>
					<a href={name === "Ollama" ? "https://ollama.ai" : "https://lmstudio.ai"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cosmos-400 hover:text-cosmos-300"><Download className="w-3 h-3" /> Download {name}</a>
				</div>
			)}
		</div>
	);
}

const GPU_RECS = [
	{ model: "Llama 3.3 70B (Q4)", vram: "24 GB" },
	{ model: "Qwen 2.5 32B", vram: "18 GB" },
	{ model: "Gemma 3 27B", vram: "16 GB" },
	{ model: "Mistral Small 3 24B", vram: "14 GB" },
	{ model: "Phi-4 14B", vram: "8 GB" },
];

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

function genSessionId(): string {
	const stored = localStorage.getItem("llm_session_id");
	if (stored) return stored;
	const id = crypto.randomUUID?.() ?? `sess-${Date.now()}`;
	localStorage.setItem("llm_session_id", id);
	return id;
}

export function LocalLlm() {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["llm-discover"],
		queryFn: api.discoverLlms,
		retry: 0,
	});

	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [chatInput, setChatInput] = useState("");
	const [chatLoading, setChatLoading] = useState(false);
	const [chatModel, setChatModel] = useState(() => localStorage.getItem("llm_chat_model") || "");
	const [chatProvider, setChatProvider] = useState(() => localStorage.getItem("llm_chat_provider") || "ollama");
	const [personality, setPersonality] = useState<PersonalityId>(() => (localStorage.getItem("llm_personality") as PersonalityId) || "expert");
	const [injectSkill, setInjectSkill] = useState(() => localStorage.getItem("llm_inject_skill") !== "false");
	const [sessionId] = useState(genSessionId);
	const chatBottomRef = useRef<HTMLDivElement>(null);

	const allModels = [
		...(data?.ollama?.models?.map((m) => ({ ...m, provider: "ollama" })) || []),
		...(data?.lmstudio?.models?.map((m) => ({ ...m, provider: "lmstudio" })) || []),
	];

	useEffect(() => {
		if (allModels.length > 0 && !chatModel) {
			const m = allModels[0];
			setChatModel(m.id);
			setChatProvider(m.provider);
		}
	}, [allModels, chatModel]);

	useEffect(() => {
		chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatMessages]);

	const handleChatSend = async () => {
		const text = chatInput.trim();
		if (!text || !chatModel) return;
		setChatMessages((prev) => [...prev, { role: "user", content: text }]);
		setChatInput("");
		setChatLoading(true);
		try {
			const r = await fetch(`${API_BASE}/api/llm/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: chatProvider,
					model: chatModel,
					prompt: text,
					personality,
					inject_skill: injectSkill,
					skill_content: injectSkill ? WORLDLABS_EXPERT_SKILL.systemPrompt : "",
					session_id: sessionId,
				}),
			});
			const d = await r.json();
			setChatMessages((prev) => [...prev, { role: "assistant", content: d.response || "No response" }]);
		} catch {
			setChatMessages((prev) => [...prev, { role: "assistant", content: "Request failed. Is the backend running?" }]);
		}
		setChatLoading(false);
	};

	const handleModelSelect = (modelId: string) => {
		setChatModel(modelId);
		localStorage.setItem("llm_chat_model", modelId);
		const found = allModels.find((m) => m.id === modelId);
		if (found) {
			setChatProvider(found.provider);
			localStorage.setItem("llm_chat_provider", found.provider);
		}
	};

	const handlePersonalityChange = (p: PersonalityId) => {
		setPersonality(p);
		localStorage.setItem("llm_personality", p);
	};

	const handleSkillToggle = (v: boolean) => {
		setInjectSkill(v);
		localStorage.setItem("llm_inject_skill", String(v));
	};

	const handleClearChat = () => {
		setChatMessages([]);
		localStorage.removeItem("llm_session_id");
	};

	return (
		<div className="space-y-6 page-enter max-w-3xl mx-auto">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-bold gradient-text">Local LLM</h2>
					<p className="text-sm text-slate-500 mt-0.5">Chat with models on your RTX 4090</p>
				</div>
				<button onClick={() => void refetch()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]"><RefreshCw className="w-3.5 h-3.5" /> Rescan</button>
			</div>

			{/* GPU Opportunity */}
			<div className="glass-card p-5 border-void-500/20 bg-gradient-to-br from-void-900/20 to-transparent">
				<div className="flex items-center gap-3 mb-4"><Zap className="w-4 h-4 text-void-400" /><h3 className="text-sm font-bold text-slate-200">RTX 4090 Model Recommendations</h3></div>
				<div className="space-y-1">
					{GPU_RECS.map((r) => (
						<div key={r.model} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
							<span className="text-sm text-slate-300 font-mono">{r.model}</span>
							<div className="flex items-center gap-2">
								<span className="text-xs text-slate-500 w-12">{r.vram}</span>
								<CopyButton text={`ollama pull ${r.model.split(" ")[0].toLowerCase()}`} />
							</div>
						</div>
					))}
				</div>
				<p className="text-xs text-slate-600 mt-2">4-bit quantization on 24 GB GDDR6X.</p>
			</div>

			{/* Advanced Chat */}
			{allModels.length > 0 && (
				<div className="glass-card p-5 space-y-4">
					<div className="flex items-center justify-between flex-wrap gap-2">
						<h3 className="text-sm font-bold text-slate-200">Chat</h3>
						<div className="flex items-center gap-2">
							<select className="bg-slate-800 border border-slate-600 rounded text-xs px-2 py-1.5 text-slate-300 max-w-[180px]" value={chatModel} onChange={(e) => handleModelSelect(e.target.value)}>
								{allModels.map((m) => <option key={m.id} value={m.id}>[{m.provider}] {m.name.split(":")[0]}</option>)}
							</select>
							<button onClick={handleClearChat} className="p-1.5 rounded text-slate-500 hover:text-slate-300" title="Clear chat"><Trash2 className="w-3.5 h-3.5" /></button>
						</div>
					</div>

					{/* Controls bar */}
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-[10px] uppercase tracking-wider text-slate-600">Personality</span>
							<div className="flex gap-1">
								{(Object.entries(PERSONALITIES) as [PersonalityId, typeof PERSONALITIES[PersonalityId]][]).map(([id, p]) => (
									<button key={id} onClick={() => handlePersonalityChange(id)} className={cn("px-2 py-1 rounded text-[11px] font-medium transition-colors", personality === id ? "bg-cosmos-600/40 text-cosmos-300 border border-cosmos-500/40" : "text-slate-500 hover:text-slate-300 border border-transparent")} title={p.description}>{p.label}</button>
								))}
							</div>
						</div>
						<label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
							<input type="checkbox" checked={injectSkill} onChange={(e) => handleSkillToggle(e.target.checked)} className="accent-cosmos-500" />
							<Brain className="w-3 h-3" /> Marble Skill
						</label>
						{sessionId && <span className="text-[10px] text-slate-600 ml-auto">session active</span>}
					</div>

					<div className="h-72 overflow-y-auto space-y-2 text-sm pr-1" style={{ scrollBehavior: "smooth" }}>
						{chatMessages.length === 0 && <p className="text-slate-500 text-xs text-center pt-16">Ask anything — running on your GPU.</p>}
						{chatMessages.map((msg, i) => (
							<div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
								<div className={`max-w-[85%] rounded-xl px-3 py-2 whitespace-pre-wrap ${msg.role === "user" ? "bg-cosmos-800 text-cosmos-100" : "bg-slate-800 text-slate-300"}`}>{msg.content}</div>
							</div>
						))}
						{chatLoading && <div className="text-slate-500 text-xs animate-pulse">Thinking...</div>}
						<div ref={chatBottomRef} />
					</div>
					<div className="flex gap-2">
						<input className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cosmos-500" placeholder="Ask something..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChatSend()} />
						<button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()} className="bg-cosmos-700 hover:bg-cosmos-600 disabled:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium"><Send className="w-4 h-4" /></button>
					</div>
				</div>
			)}

			{isLoading && <div className="glass-card p-8 text-center text-sm text-slate-500"><RefreshCw className="w-6 h-6 text-slate-700 mx-auto mb-2 animate-spin" /> Scanning for local LLM providers…</div>}
			{isError && <div className="glass-card p-4 border-amber-500/20 text-sm text-amber-400">Backend not reachable — start the bridge server.</div>}

			{data && (
				<div className="space-y-4">
					<ProviderSection name="Ollama" available={data.ollama?.available ?? false} models={data.ollama?.models ?? []} url={data.ollama?.url} />
					<ProviderSection name="LM Studio" available={data.lmstudio?.available ?? false} models={data.lmstudio?.models ?? []} url={data.lmstudio?.url} />
				</div>
			)}
		</div>
	);
}