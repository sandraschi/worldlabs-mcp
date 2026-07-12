import {
	ArrowRight,
	BookOpen,
	Brain,
	ChevronDown,
	ChevronRight,
	Clock,
	Code2,
	Cpu,
	Download,
	ExternalLink,
	Globe2,
	HelpCircle,
	Info,
	Key,
	Layers,
	MessageSquare,
	Search,
	Smartphone,
	Wrench,
} from "lucide-react";
import { useState } from "react";

interface Tool {
	name: string;
	description: string;
	group: string;
	args?: Record<string, string>;
	example?: string;
	notes?: string;
	docstring?: string;
}

interface SectionProps {
	title: string;
	icon: React.ElementType;
	defaultOpen?: boolean;
	children: React.ReactNode;
}

function Section({ title, icon: Icon, defaultOpen = true, children }: SectionProps) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="glass-card overflow-hidden">
			<button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 p-5 text-left" aria-expanded={open}>
				<div className="flex items-center gap-2">
					<Icon className="w-4 h-4 text-cosmos-400 flex-shrink-0" aria-hidden="true" />
					<span className="text-sm font-bold text-slate-200">{title}</span>
				</div>
				{open ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
			</button>
			{open && <div className="px-5 pb-5 space-y-3">{children}</div>}
		</div>
	);
}

type DetailLevel = "quick" | "standard" | "verbose";

function ToolCard({ tool, detail }: { tool: Tool; detail: DetailLevel }) {
	const [expanded, setExpanded] = useState(false);
	return (
		<div className="glass-card p-3 space-y-1.5">
			<div className="flex items-start gap-2 cursor-pointer" onClick={() => detail !== "quick" && setExpanded((e) => !e)} role={detail !== "quick" ? "button" : undefined} tabIndex={detail !== "quick" ? 0 : undefined} onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}>
				<Code2 className="w-3.5 h-3.5 text-cosmos-400 flex-shrink-0 mt-0.5" />
				<div className="flex-1 min-w-0">
					<code className="text-xs font-mono text-cosmos-300">{tool.name}</code>
					<p className="text-xs text-slate-500 mt-0.5">{tool.description}</p>
				</div>
				{detail !== "quick" && <span className="text-[10px] text-slate-600 mt-0.5">{expanded ? "▲" : "▼"}</span>}
			</div>
			{expanded && detail !== "quick" && (
				<div className="mt-2 space-y-2 pl-5 border-l border-white/[0.06]">
					{tool.args && (
						<div>
							<p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Args</p>
							{Object.entries(tool.args).map(([k, v]) => (
								<div key={k} className="text-xs text-slate-400 flex gap-1.5"><code className="text-cosmos-400 flex-shrink-0">{k}</code><span className="text-slate-500">{v}</span></div>
							))}
						</div>
					)}
					{detail === "verbose" && tool.docstring && <p className="text-xs text-slate-400 leading-relaxed">{tool.docstring}</p>}
					{detail === "verbose" && tool.example && <div><p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Example</p><pre className="text-[11px] font-mono text-slate-300 bg-black/30 rounded p-2 overflow-x-auto">{tool.example}</pre></div>}
					{detail === "verbose" && tool.notes && <p className="text-[11px] text-amber-500/70 italic">{tool.notes}</p>}
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Tool data (mirrors server.py _TOOL_CATALOG — kept in sync manually)
// ---------------------------------------------------------------------------

const TOOLS: Tool[] = [
	{
		name: "generate_world_from_text",
		group: "generate",
		description: "Generate a 3D world from a text description",
		args: {
			text_prompt: "str — scene description",
			display_name: "str (optional)",
			model: "'marble-1.1' (default) or 'marble-1.1-plus'",
		},
		docstring: "Submits a text-to-world request to the Marble API. Returns immediately with an in-progress operation. Poll with get_operation or block with wait_for_world.",
		example: 'generate_world_from_text(\n  text_prompt="A gothic cathedral interior at night"\n)',
		notes: "Credits are consumed per generation. Check billing at platform.worldlabs.ai.",
	},
	{
		name: "generate_world_from_image",
		group: "generate",
		description: "Generate a 3D world from a public image URL",
		args: {
			image_url: "str — public URL (jpg, jpeg, png, webp)",
			text_prompt: "str (optional)",
			is_panorama: "bool — True for 360-degree equirectangular images",
			model: "str",
		},
		docstring: "Lifts a photograph into a navigable 3D space. Panoramas produce fuller 360-degree worlds. Non-panorama images are extrapolated.",
		example: 'generate_world_from_image(\n  image_url="https://example.com/photo.jpg"\n)',
		notes: "Image must be publicly accessible. GCS signed URLs are not supported here.",
	},
	{
		name: "generate_world_from_multi_image",
		group: "generate",
		description: "Generate from multiple images at specified azimuth angles",
		args: {
			image_urls: "list[str] — public image URLs",
			azimuths_deg: "list[float] — angle per image, 0-360",
			text_prompt: "str (optional)",
		},
		docstring: "Reconstructs a 3D scene from multiple views. 2-8 images at known azimuth angles for best results. Cardinal directions (0/90/180/270) work well.",
		example: 'generate_world_from_multi_image(\n  image_urls=["north.jpg", "south.jpg"],\n  azimuths_deg=[0, 180]\n)',
		notes: "Minimum 2 images. image_urls and azimuths_deg must have equal length.",
	},
	{
		name: "generate_world_from_video",
		group: "generate",
		description: "Generate a 3D world from a public video URL",
		args: {
			video_url: "str — public URL (mp4, mov, mkv)",
			text_prompt: "str (optional)",
		},
		docstring: "Extracts 3D structure from video. Works well with slow pans and walkthrough recordings. Fast movement degrades quality.",
		example: 'generate_world_from_video(video_url="https://example.com/walk.mp4")',
		notes: "Video must be publicly accessible.",
	},
	{
		name: "upload_and_generate",
		group: "upload",
		description: "Upload a local file and generate end-to-end",
		args: {
			local_file_path: "str — absolute path on disk",
			kind: "'image' or 'video'",
			text_prompt: "str (optional)",
			is_panorama: "bool (image only)",
		},
		docstring: "Handles the full GCS signed-upload flow then generation in one call. Supports jpg, jpeg, png, webp (image); mp4, mov, mkv (video).",
		example: 'upload_and_generate(\n  local_file_path="D:/photos/garden.jpg",\n  kind="image"\n)',
		notes: "Files up to 100MB.",
	},
	{
		name: "prepare_media_upload",
		group: "upload",
		description: "Get a signed GCS upload URL for manual file upload",
		args: {
			file_name: "str — original filename",
			kind: "'image' or 'video'",
			extension: "str — file extension without dot",
		},
		docstring: "Step 1 of the manual upload flow. PUT the raw bytes to upload_info.upload_url, then call generate_world_from_media_asset. Prefer upload_and_generate for simpler usage.",
		example: 'prepare_media_upload(file_name="photo.jpg", kind="image", extension="jpg")',
		notes: "Signed URLs expire after ~15 minutes.",
	},
	{
		name: "generate_world_from_media_asset",
		group: "generate",
		description: "Generate from a previously uploaded media asset ID",
		args: {
			media_asset_id: "str — ID from prepare_media_upload",
			kind: "'image' or 'video'",
		},
		docstring: "Step 2 of the manual upload flow.",
		example: 'generate_world_from_media_asset(media_asset_id="asset-xyz", kind="image")',
		notes: "Use upload_and_generate instead unless you need the two-step flow.",
	},
	{
		name: "get_operation",
		group: "poll",
		description: "Single poll of an operation status",
		args: { operation_id: "str — from any generate call" },
		docstring: "One-shot poll. Returns immediately with current state. Call in a loop for marble-1.1-plus jobs (often multi-minute). Preferred over wait_for_world for plus jobs.",
		example: 'get_operation("op-abc123")',
		notes: "Check the 'done' field. If done, 'response' contains the world data.",
	},
	{
		name: "wait_for_world",
		group: "poll",
		description: "Blocking poll until operation completes or times out",
		args: {
			operation_id: "str",
			poll_interval_seconds: "int (default 15)",
			timeout_seconds: "int (default 90)",
		},
		docstring: "Blocks until done or timeout. Raises RuntimeError on API failure, TimeoutError if timeout elapses. Default 90s is safe for marble-1.1. For plus use get_operation in a loop.",
		example: 'wait_for_world("op-abc123", poll_interval_seconds=10, timeout_seconds=90)',
		notes: "MCP client timeouts (~120s) limit how long this can block.",
	},
	{
		name: "list_worlds",
		group: "world",
		description: "Paginated list of all generated worlds",
		args: {
			page_size: "int (default 20, max 100)",
			page_token: "str (optional) — from previous next_page_token",
		},
		docstring: "Returns all worlds in the account. Paginate using next_page_token. Worlds are returned newest-first.",
		example: "list_worlds(page_size=50)",
	},
	{
		name: "get_world",
		group: "world",
		description: "Fetch full details and asset URLs for a world",
		args: { world_id: "str — UUID from list_worlds or operation response" },
		docstring: "Returns splat URLs (SPZ), collision mesh (GLB), panorama, thumbnail, AI caption, and Marble viewer link.",
		example: 'get_world("world-uuid-456")',
		notes: "Asset URLs are time-limited CDN links. Download promptly.",
	},
	{
		name: "delete_world",
		group: "world",
		description: "Permanently delete a world and all its assets",
		args: { world_id: "str — UUID" },
		example: 'delete_world("world-uuid-456")',
		docstring: "Permanently removes the world and all associated assets. This action cannot be undone.",
		notes: "Only the world owner can delete.",
	},
	{
		name: "show_worlds_card",
		group: "ui",
		description: "Paginated world library as a scannable table card (Prefab UI)",
		args: { page_size: "int (default 5)", page_token: "str (optional)" },
		example: "show_worlds_card(page_size=5)",
	},
	{
		name: "show_world_card",
		group: "ui",
		description: "Single world detail card with asset links and thumbnail (Prefab UI)",
		args: { world_id: "str" },
		example: 'show_world_card("world-uuid-456")',
	},
	{
		name: "broadcast_spatial_audio",
		group: "spatial",
		description: "Broadcast spatial audio (Music/Ambience) to the scene",
		args: { prompt_or_url: "str — URL to audio file", x: "float", y: "float", z: "float" },
	},
	{
		name: "broadcast_spatial_notification",
		group: "spatial",
		description: "Speak text at a 3D coordinate via the Spatial Voice Agent",
		args: { text: "str — message", x: "float", y: "float", z: "float" },
		notes: "Built-in TTS via edge-tts. Auto-generates audio.",
	},
	{
		name: "place_world_tv",
		group: "spatial",
		description: "Place a virtual TV screen playing a video in the scene",
		args: { video_url: "str", x: "float", y: "float", z: "float", rotation_y: "float" },
	},
	{
		name: "spawn_agent_avatar",
		group: "spatial",
		description: "Materialise an animated agent avatar in the scene",
		args: { avatar_url: "str — glTF URL or 'default_agent'", x: "float", y: "float", z: "float" },
	},
	{
		name: "refine_with_local_llm",
		group: "meta",
		description: "Refine a world prompt using a local Ollama model",
		args: { prompt: "str", style: "str (optional)", model: "str (optional)" },
		notes: "Requires Ollama running locally.",
	},
	{
		name: "worldlabs_help",
		group: "meta",
		description: "This help tool — API reference at three detail levels",
		args: { detail: "'quick' | 'standard' (default) | 'verbose'", topic: "str (optional)" },
		example: 'worldlabs_help(detail="verbose", topic="generate")',
	},
];

const GROUPS = ["generate", "upload", "poll", "world", "spatial", "ui", "meta"] as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Help() {
	const [detail, setDetail] = useState<DetailLevel>("standard");
	const [group, setGroup] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const filtered =
		group === "all"
			? TOOLS
			: TOOLS.filter((t) => t.group === group);
	const searched = searchQuery
		? filtered.filter(
				(t) =>
					t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					t.description.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: filtered;

	return (
		<div className="space-y-6 page-enter max-w-3xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3">
				<HelpCircle className="w-5 h-5 text-cosmos-400" aria-hidden="true" />
				<div>
					<h2 className="text-lg font-bold gradient-text">
						Help &amp; Documentation
					</h2>
					<p className="text-sm text-slate-500 mt-0.5">
						worldlabs-mcp · Marble API v1 · v0.5.0
					</p>
				</div>
			</div>

			{/* ---- What is this? ---- */}
			<Section title="What is this?" icon={Info} defaultOpen={true}>
				<p className="text-sm text-slate-400 leading-relaxed">
					<strong className="text-slate-200">worldlabs-mcp</strong> is an MCP
					server that exposes the{" "}
					<a
						href="https://docs.worldlabs.ai/api"
						target="_blank"
						rel="noopener noreferrer"
						className="text-cosmos-400 hover:text-cosmos-300 transition-colors"
					>
						World Labs Marble API
					</a>{" "}
					as tools callable by Claude (or any MCP client). It generates
					navigable 3D scenes — Gaussian splats, collision meshes, panoramas —
					from text descriptions, images, and video.
				</p>
				<p className="text-sm text-slate-400 leading-relaxed">
					This webapp (port 10864) is the management dashboard. The MCP server
					itself runs as a separate process (stdio for Claude Desktop, HTTP for
					testing). The FastAPI bridge on port 10865 proxies requests from this
					UI to the Marble API.
				</p>
				<div className="bg-black/30 rounded-lg border border-white/[0.06] p-3 font-mono text-xs text-slate-300 space-y-1">
					<div>
						<span className="text-slate-500"># .env</span>
					</div>
					<div>WORLDLABS_API_KEY=wlt_...</div>
				</div>
				<a
					href="https://platform.worldlabs.ai/api-keys"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 text-xs text-cosmos-400 hover:text-cosmos-300 transition-colors"
				>
					<Key className="w-3 h-3" /> Get your API key →
				</a>
			</Section>

			{/* ---- World Labs — The Company ---- */}
			<Section
				title="World Labs — The Company &amp; Marble API"
				icon={Globe2}
				defaultOpen={false}
			>
				<div className="space-y-3 text-sm text-slate-400 leading-relaxed">
					<p>
						World Labs was founded in 2023 in San Francisco by{" "}
						<strong className="text-slate-300">Fei-Fei Li</strong> (former
						director of the Stanford AI Lab and Google Cloud AI), Justin
						Johnson, and Christoph Lassner. Its stated mission is to build{" "}
						<em>spatial intelligence</em> — AI that understands the
						three-dimensional structure of the world, not just text and flat
						images.
					</p>
					<p>
						The company emerged from a body of academic work on 3D vision,
						neural rendering, and scene reconstruction. Fei-Fei Li had long
						argued that current language models are fundamentally limited by
						their inability to reason about space, objects, and causality the
						way a physical agent does. World Labs is the commercial vehicle for
						addressing that gap.
					</p>
					<p>
						<strong className="text-slate-300">Marble</strong> is the production
						API. It accepts a text prompt, a single image, multiple images at
						azimuth angles, or a video clip, and returns a fully navigable 3D
						Gaussian splat scene. Internally it runs a pipeline of: scene
						understanding → geometry estimation → Gaussian splatting →
						compression → asset packaging.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
						{[
							{
								label: "Output: SPZ (Gaussian Splat)",
								color: "text-cosmos-300",
								body: "Compressed representation of millions of coloured 3D Gaussians. Renderable in real time in WebGL viewers, Unity (with plugin), Blender (with plugin), and VR headsets. Multiple resolutions: 100k, 500k, full.",
							},
							{
								label: "Output: GLB (Collision Mesh)",
								color: "text-void-300",
								body: "GLTF Binary polygon mesh for physics simulation. Simplified geometry suitable for game engines and robotics simulation.",
							},
							{
								label: "Output: Panorama",
								color: "text-aurora-300",
								body: "360-degree equirectangular JPEG of the generated scene. Useful for environment maps, VR skyboxes, and reference.",
							},
							{
								label: "Output: Thumbnail + Caption",
								color: "text-slate-300",
								body: "Preview JPEG and an AI-generated text description of what the model actually produced (which may differ from your prompt).",
							},
						].map((item) => (
							<div key={item.label} className="glass-card p-3 space-y-1">
								<p
									className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}
								>
									{item.label}
								</p>
								<p className="text-xs text-slate-500">{item.body}</p>
							</div>
						))}
					</div>

					<p className="text-xs text-slate-500 border-l border-white/10 pl-3 italic">
						The Marble gallery at worldlabs.ai/gallery shows publicly shared
						worlds. Downloading from the gallery is an interactive browser task
						— there is no API endpoint for it. Use the world detail page to
						download SPZ directly once you have a world_id.
					</p>
				</div>
			</Section>

			{/* ---- Spatial Intelligence Scene 2026 ---- */}
			<Section
				title="Spatial Intelligence Landscape (2026)"
				icon={Layers}
				defaultOpen={false}
			>
				<div className="space-y-3 text-sm text-slate-400 leading-relaxed">
					<p>
						World Labs operates in the Large World Model (LWM) space, which in
						2026 has several distinct technical approaches competing for
						different use cases.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{[
							{
								label: "Generative / Persistent (World Labs)",
								color: "text-cosmos-300",
								body: "Full 3D scene files downloadable for DCC pipelines. High fidelity, slow generation, works without a GPU at query time once assets are built.",
							},
							{
								label: "Latent / Predictive (Meta JEPA / AMI Labs)",
								color: "text-void-300",
								body: "Physics reasoning in embedding space. No explicit 3D output — the model reasons about dynamics abstractly. Yann LeCun's preferred architecture for embodied intelligence.",
							},
							{
								label: "Interactive Real-Time (Google DeepMind Genie 3)",
								color: "text-aurora-300",
								body: "Playable simulation at high frame rates. Prioritises speed and controllability over geometric fidelity. Aimed at game AI and interactive training.",
							},
							{
								label: "Industrial (Alibaba / Baidu)",
								color: "text-slate-300",
								body: "Efficiency-first models for autonomous vehicle simulation and smart city digital twins. Latency and throughput optimised.",
							},
						].map((item) => (
							<div key={item.label} className="glass-card p-3 space-y-1">
								<p
									className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}
								>
									{item.label}
								</p>
								<p className="text-xs text-slate-500">{item.body}</p>
							</div>
						))}
					</div>
					<p className="text-xs text-slate-500 leading-relaxed">
						World Labs positions itself at the quality/persistence end: scenes
						you can download, import into Blender, and use in production, rather
						than scenes that only exist inside a model's latent space during
						inference.
					</p>
				</div>
			</Section>

			{/* ---- Agentic Workflow ---- */}
			<Section title="Agentic Workflow" icon={MessageSquare} defaultOpen={true}>
				<div className="space-y-1.5">
					{[
						"generate_world_from_text(text_prompt=...) → returns operation immediately",
						"Poll: get_operation(operation_id) until done=True",
						"  — or: wait_for_world(operation_id) for Marble 0.1-mini (≤90s)",
						"On success: get_world(world_id) → download asset URLs",
						'Local files: upload_and_generate(local_file_path=..., kind="image")',
						"Catalogue: list_worlds(page_size=50)",
					].map((step, i) => (
						<div key={i} className="flex items-start gap-2">
							<ArrowRight
								className="w-3.5 h-3.5 text-cosmos-400 flex-shrink-0 mt-0.5"
								aria-hidden="true"
							/>
							<code className="text-xs font-mono text-slate-300">{step}</code>
						</div>
					))}
				</div>
			</Section>

			{/* ---- Prompt Engineering Guide ---- */}
			<Section
				title="Prompt Engineering Guide"
				icon={MessageSquare}
				defaultOpen={false}
			>
				<div className="space-y-3 text-sm text-slate-400 leading-relaxed">
					<p>
						Marble is a <strong>3D world generator</strong> (Gaussian splat
						scenes), not a 2D image generator. Prompting strategies from
						Midjourney or DALL-E do not always translate. The core rule:{" "}
						<strong>
							if you can model it in Blender, Marble can render it
						</strong>
						.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{[
							{
								label: "Works Well",
								color: "text-aurora-300",
								items:
									"Architectural styles (gothic, brutalist, art deco), materials (raw concrete, weathered brass, moss-covered stone), weather & season (heavy rain, snow, autumn mist), lighting (golden hour, bioluminescent, fog), specific places (morgue, cathedral, greenhouse, crypt)",
							},
							{
								label: "Archetype, Not Reference",
								color: "text-amber-300",
								items:
									"Cultural references (Bates Motel → roadside motel + Victorian house, not the exact facade). Landmarks (Eiffel Tower → lattice tower with 3 tiers, not the specific proportions). For accuracy, use image-to-world with a reference photo.",
							},
							{
								label: "Does Not Work",
								color: "text-red-300",
								items:
									"2D painting techniques (impressionism, sfumato, fresco, impasto — these describe brushwork on canvas). Narrative emotions without translation (fear, melancholy — decompose into concrete 3D elements). Specific human faces or figures.",
							},
							{
								label: "Prompt Template",
								color: "text-cosmos-300",
								items:
									'[ARCHITECTURE] + [MATERIALS] + [LIGHTING/TIME] + [WEATHER] + [SCALE] + [COLOUR PALETTE]. Specify dimensions ("60m vaulted ceiling"), ground plane ("worn flagstone"), and sightlines ("receding into darkness").',
							},
						].map((item) => (
							<div key={item.label} className="glass-card p-3 space-y-1">
								<p
									className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}
								>
									{item.label}
								</p>
								<p className="text-xs text-slate-500">{item.items}</p>
							</div>
						))}
					</div>
					<p className="text-xs text-slate-500 border-l border-white/10 pl-3 italic">
						Full guide:{" "}
						<code className="text-cosmos-400">docs/PROMPT_GUIDE.md</code> —
						covers artist references (Giger ✓, Monet ✗), landmark prompting,
						material selection, weather/season, architectural styles, and
						category reference tables.
					</p>
				</div>
			</Section>

			{/* ---- LLM Chat & Skills ---- */}
			<Section title="LLM Chat &amp; Skill Injection" icon={Brain} defaultOpen={true}>
				<div className="space-y-3 text-sm text-slate-400 leading-relaxed">
					<p>
						The <strong>Local LLM</strong> page at <code className="text-cosmos-400">/local-llm</code> provides an interactive AI chat
						running entirely on your local GPU via Ollama or LM Studio.
					</p>
					<h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Personalities</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{[
							{ label: "Expert", body: "Technically precise. References specific tool names and parameters. Default." },
							{ label: "Creative", body: "Artistic and evocative. Helps craft vivid world prompts with sensory language." },
							{ label: "Guide", body: "Patient tutor. Walks through workflows step by step with concrete examples." },
							{ label: "Concise", body: "Short, direct answers in 1-3 sentences. Prefers bullet points." },
						].map((p) => (
							<div key={p.label} className="glass-card p-3">
								<p className="text-[10px] font-bold uppercase tracking-wider text-cosmos-300">{p.label}</p>
								<p className="text-xs text-slate-500 mt-0.5">{p.body}</p>
							</div>
						))}
					</div>
					<h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-2">Skill Injection</h4>
					<p>When the <strong>Marble Skill</strong> toggle is on, the World Labs Marble Expert skill is injected into the system prompt, giving the LLM detailed knowledge of all tools, models, output formats, prompt engineering, and pricing.</p>
					<p className="text-xs text-slate-500 border-l border-white/10 pl-3 italic">Conversation history is persisted per session and included as context for up to 10 previous exchanges.</p>
				</div>
			</Section>

			{/* ---- Models ---- */}
			<Section title="Generation Models" icon={Clock} defaultOpen={true}>
				<div className="space-y-2">
					{[
						{
							name: "marble-1.1",
							time: "~1-3 minutes",
							desc: "Default model. Improved fidelity over marble-1.0 at the same fixed cost (1500 credits). Good for most generations.",
							badge: "badge-pending",
						},
						{
							name: "marble-1.1-plus",
							time: "variable; longer for larger scenes",
							desc: "Auto-expanding — produces larger worlds when the scene allows. 1500 base + 300 per additional dynamic cube (up to 5 cubes). Use for outdoor scenes and large interiors.",
							badge: "badge-succeeded",
						},
					].map((m) => (
						<div key={m.name} className="glass-card p-3">
							<div className="flex items-center justify-between">
								<code className="text-xs font-mono text-void-300">
									{m.name}
								</code>
								<span className={m.badge}>{m.time}</span>
							</div>
							<p className="text-xs text-slate-500 mt-1">{m.desc}</p>
						</div>
					))}
				</div>
			</Section>

			{/* ---- Gallery Download ---- */}
			<Section
				title="Gallery &amp; Download"
				icon={Download}
				defaultOpen={false}
			>
				<div className="space-y-2 text-sm text-slate-400 leading-relaxed">
					<p>
						The{" "}
						<a
							href="https://worldlabs.ai/gallery"
							target="_blank"
							rel="noopener noreferrer"
							className="text-cosmos-400 hover:text-cosmos-300 transition-colors inline-flex items-center gap-1"
						>
							Marble gallery <ExternalLink className="w-3 h-3" />
						</a>{" "}
						shows publicly shared worlds. There is no API endpoint for browsing
						or downloading from the gallery — it requires browser interaction.
					</p>
					<p className="text-xs text-slate-500">
						To download a world you generated: use{" "}
						<code className="bg-white/[0.06] px-1 rounded text-[11px]">
							get_world(world_id)
						</code>{" "}
						to retrieve the SPZ and GLB URLs, then download directly. CDN links
						are time-limited — download within a few hours of generation.
					</p>
					<a
						href="https://worldlabs.ai/gallery"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-xs text-cosmos-400 hover:text-cosmos-300 transition-colors"
					>
						<Globe2 className="w-3 h-3" /> Open gallery →
					</a>
				</div>
			</Section>

			{/* ---- Tools ---- */}
			<Section title="MCP Tools Reference" icon={Wrench} defaultOpen={true}>
				<div className="flex flex-wrap gap-2 mb-3">
					<div className="flex items-center gap-2 flex-1 min-w-0">
						<div className="relative flex-1 max-w-[240px]">
							<Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
							<input
								type="text"
								placeholder="Search tools..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-slate-800/60 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cosmos-500"
							/>
						</div>
						<div className="flex gap-1.5">
							{(["quick", "standard", "verbose"] as DetailLevel[]).map((d) => (
								<button
									key={d}
									onClick={() => setDetail(d)}
									className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
										detail === d
											? "bg-cosmos-600/40 text-cosmos-300 border border-cosmos-500/40"
											: "text-slate-500 hover:text-slate-300 border border-transparent"
									}`}
								>
									{d}
								</button>
							))}
						</div>
					</div>
					<div className="flex gap-1.5">
						{(["all", ...GROUPS] as string[]).map((g) => (
							<button
								key={g}
								onClick={() => setGroup(g)}
								className={`px-2.5 py-1 rounded text-xs transition-colors ${
									group === g
										? "bg-void-600/30 text-void-300 border border-void-500/30"
										: "text-slate-600 hover:text-slate-400 border border-transparent"
								}`}
							>
								{g}
							</button>
						))}
					</div>
				</div>

				<p className="text-[11px] text-slate-600 mb-2">
					{detail !== "quick" ? "Click a tool to expand args and details." : ""}
				</p>

				<div className="space-y-2">
					{searched.length === 0 && (
						<p className="text-xs text-slate-500 text-center py-4">No tools match "{searchQuery}".</p>
					)}
					{searched.map((tool) => (
						<ToolCard key={tool.name} tool={tool} detail={detail} />
					))}
				</div>
			</Section>

			{/* ---- Immersive Reality ---- */}
			<Section
				title="Immersive Reality (WebRTX)"
				icon={Glasses}
				defaultOpen={false}
			>
				<div className="space-y-4 text-sm text-slate-400 leading-relaxed">
					<p>
						World Labs worlds are <strong>WebXR Ready</strong>. Experience
						generatively persistent worlds from the inside using the v0.4.0{" "}
						<strong>WebRTX</strong> protocol—proprietary real-time cross-reality
						streaming for Spark 2.0.
					</p>
					<a
						href="/onboarding"
						className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-aurora-600 to-cosmos-600 text-white hover:from-aurora-500 hover:to-cosmos-500 transition-all"
					>
						<Smartphone className="w-3.5 h-3.5" />
						Headset Setup Guide (Quest / Pico 4)
					</a>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="glass-card p-4 space-y-2">
							<h4 className="text-xs font-black uppercase text-aurora-300">
								Android XR Integration
							</h4>
							<p className="text-[11px] text-slate-500">
								Native optimization for Quest 3 Ultra. Optimized splat sorting
								and hand-tracking support.
							</p>
						</div>
						<div className="glass-card p-4 space-y-2">
							<h4 className="text-xs font-black uppercase text-cosmos-300">
								Spatialized Presence
							</h4>
							<p className="text-[11px] text-slate-500">
								Multimodal events (Speech/Audio/Video) are spatialized relative
								to the HMD position in real-time.
							</p>
						</div>
					</div>
					<div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
						<p className="text-xs font-bold text-orange-400 flex items-center gap-2">
							<Info className="w-4 h-4" />
							Security / Secure Context
						</p>
						<p className="text-[11px] text-slate-500 mt-1">
							Entering VR requires <strong>HTTPS</strong> or a trusted origin.
							If connecting to a local PC from a headset, use the{" "}
							<code className="text-orange-300 bg-black/30 px-1 rounded">
								adb reverse
							</code>{" "}
							utility found in the <strong>Reality Hub</strong>.
						</p>
					</div>
				</div>
			</Section>

			{/* ---- API Docs ---- */}
			<Section title="External Links" icon={BookOpen} defaultOpen={false}>
				<div className="space-y-2 text-xs">
					{[
						{
							label: "World Labs Platform (billing, API keys)",
							url: "https://platform.worldlabs.ai",
						},
						{
							label: "Marble API Documentation",
							url: "https://docs.worldlabs.ai/api",
						},
						{
							label: "Headset Setup Guide (local)",
							url: "https://github.com/sandraschi/worldlabs-mcp/blob/main/docs/HEADSET_SETUP.md",
						},
						{
							label: "Prompt Engineering Guide (local)",
							url: "https://github.com/sandraschi/worldlabs-mcp/blob/main/docs/PROMPT_GUIDE.md",
						},
						{
							label: "World Labs Gallery",
							url: "https://worldlabs.ai/gallery",
						},
						{
							label: "worldlabs-mcp GitHub",
							url: "https://github.com/sandraschi/worldlabs-mcp",
						},
						{
							label: "resonite-mcp GitHub",
							url: "https://github.com/sandraschi/resonite-mcp",
						},
						{
							label: "Glama MCP listing",
							url: "https://glama.ai/mcp/servers?query=sandraschi",
						},
					].map((link) => (
						<a
							key={link.url}
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-cosmos-400 hover:text-cosmos-300 transition-colors"
						>
							<ExternalLink className="w-3 h-3 flex-shrink-0" />
							{link.label}
						</a>
					))}
				</div>
			</Section>
		</div>
	);
}
