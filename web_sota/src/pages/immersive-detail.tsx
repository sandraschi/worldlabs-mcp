import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Glasses,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Terminal,
  Usb,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-aurora-400 shrink-0" />
          <span className="text-sm font-bold text-slate-200">{title}</span>
        </div>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>
      {open && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  );
}

export function ImmersiveDetail() {
  const [copied, setCopied] = useState<string | null>(null);
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const {
    data: adbData,
    isLoading: adbLoading,
    refetch: adbRefetch,
  } = useQuery({
    queryKey: ["adb-devices"],
    queryFn: () => api.adbDevices(),
    staleTime: 5000,
    retry: false,
  });

  return (
    <div className="space-y-4 page-enter max-w-4xl mx-auto pb-20">
      {/* Hero */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-aurora-600/10 via-transparent to-cosmos-600/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-500 to-cosmos-600 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
            <Glasses className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Reality Hub</h1>
            <p className="text-sm text-slate-400">
              Cross-reality streaming, device debugging, and spatial
              orchestration.
            </p>
          </div>
        </div>
      </div>

      {/* Protocols */}
      <Section title="Protocols & Compatibility" icon={Zap} defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-aurora-400" />
              <h3 className="text-xs font-bold text-white">WebRTX Protocol</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Optimises LoD splat tree streaming for 6DOF headsets with
              bitrate-aware progressive refinement.
            </p>
          </div>
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cosmos-400" />
              <h3 className="text-xs font-bold text-white">
                Android XR Native
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Native hand-tracking, shared spatial anchors, multithreaded splat
              sorting for Quest 3 & Pico 4.
            </p>
          </div>
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">
                Sovereign Handoff
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Stream directly from your workstation (port 10865) to HMD with
              zero-latency handshakes.
            </p>
          </div>
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Pico 4 / Ultra</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Stereo Passthrough v2, PicoOS hand-tracking, WiFi-7 optimised
              streaming.
            </p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {[
            {
              name: "Meta Quest 3 / Ultra",
              os: "Android XR",
              status: "Optimal",
              color: "text-aurora-400",
            },
            {
              name: "Apple Vision Pro",
              os: "visionOS 3.0",
              status: "WebGL2",
              color: "text-cosmos-400",
            },
            {
              name: "Vive XR Elite",
              os: "Android XR",
              status: "Compatible",
              color: "text-slate-400",
            },
            {
              name: "Pico 4 Ultra",
              os: "PicoOS",
              status: "Optimized",
              color: "text-aurora-400",
            },
          ].map((hmd) => (
            <div
              key={hmd.name}
              className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1"
            >
              <p className="text-xs font-bold text-white">{hmd.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-mono">
                  {hmd.os}
                </span>
                <span
                  className={cn("text-[10px] font-bold uppercase", hmd.color)}
                >
                  {hmd.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ADB Connection Wizard */}
      <Section
        title="Headset Connection Wizard"
        icon={Terminal}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect your Quest, Pico, or Vive headset to this workstation for
            wireless streaming. Requires <strong>ADB</strong> (Android Platform
            Tools) installed on your system.
          </p>

          {/* Live device detection */}
          <div className="glass-card p-4 border-aurora-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Usb className="w-3.5 h-3.5 text-aurora-400" />
                Connected Devices
              </h4>
              <button
                onClick={() => adbRefetch()}
                disabled={adbLoading}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("w-3 h-3", adbLoading && "animate-spin")}
                />
                Refresh
              </button>
            </div>
            {adbLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning for ADB devices...
              </div>
            )}
            {adbData && !adbData.success && (
              <div className="flex items-start gap-2 text-xs text-red-400">
                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">ADB not detected</p>
                  <p className="text-slate-500 mt-0.5">
                    {adbData.error ||
                      "Install Android Platform Tools and add adb to PATH."}
                  </p>
                  <a
                    href="https://developer.android.com/studio/releases/platform-tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cosmos-400 hover:text-cosmos-300 mt-1"
                  >
                    Download Platform Tools <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
            {adbData &&
              adbData.success &&
              (adbData.devices && adbData.devices.length > 0 ? (
                <div className="space-y-2">
                  {adbData.devices.map((d) => (
                    <div
                      key={d.serial}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-aurora-400" />
                        <span className="text-xs font-mono text-slate-200">
                          {d.serial}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          d.status === "device"
                            ? "text-aurora-400 bg-aurora-500/10"
                            : "text-amber-400 bg-amber-500/10",
                        )}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  No devices connected. Connect your headset via USB and ensure
                  Developer Mode is enabled.
                </div>
              ))}
          </div>

          {/* Setup steps */}
          <div className="space-y-2">
            {[
              {
                id: "adb-devices",
                cmd: "adb devices",
                label: "Verify connection",
                desc: "List connected devices",
              },
              {
                id: "adb-tcp",
                cmd: "adb tcpip 5555",
                label: "Enable wireless mode",
                desc: "Restarts ADB over TCP (requires USB first)",
              },
              {
                id: "adb-connect",
                cmd: adbData?.devices?.length
                  ? `adb connect ${adbData.devices[0].serial.replace(/:.*$/, "")}:5555`
                  : "adb connect <headset-ip>:5555",
                label: "Connect over WiFi",
                desc: "Requires a connected device — shown once detected",
                disabled: !adbData?.devices?.length,
              },
              {
                id: "adb-reverse",
                cmd: "adb reverse tcp:10864 tcp:10865",
                label: "Port forward dashboard",
                desc: "Access worldlabs-mcp from headset browser",
              },
            ].map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]",
                  item.disabled && "opacity-50",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      — {item.desc}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-cosmos-200 mt-1 block truncate">
                    {item.cmd}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(item.cmd, item.id)}
                  disabled={item.disabled}
                  title={
                    item.disabled ? "Connect a device first" : "Copy command"
                  }
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-cosmos-500/20 text-slate-500 hover:text-cosmos-400 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.05] disabled:hover:text-slate-500"
                >
                  <ShieldCheck
                    className={cn(
                      "w-4 h-4",
                      copied === item.id && "text-aurora-500",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-400 leading-relaxed space-y-2">
            <p className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              After port forwarding
            </p>
            <p>
              Open the headset browser and navigate to{" "}
              <code className="text-amber-200 bg-black/30 px-1 rounded">
                http://localhost:10864
              </code>{" "}
              to access the Spark 2.0 viewer. The "Enter VR" button requires a
              secure context — set{" "}
              <code className="text-amber-200 bg-black/30 px-1 rounded">
                chrome://flags/#unsafely-treat-insecure-origin-as-secure
              </code>{" "}
              on the headset browser.
            </p>
          </div>
        </div>
      </Section>

      {/* Quick reference */}
      <Section
        title="Spark Viewer Controls"
        icon={HelpCircle}
        defaultOpen={false}
      >
        <div className="text-xs text-slate-400 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { action: "Orbit / Rotate", input: "Left-click + drag" },
              { action: "Pan", input: "Right-click + drag" },
              { action: "Zoom", input: "Scroll wheel" },
              { action: "Reset view", input: "Rotate icon (bottom-right)" },
              { action: "Fullscreen", input: "Fullscreen button (top bar)" },
              { action: "Load URL", input: "Paste URL + click Initialize" },
            ].map((i) => (
              <div
                key={i.action}
                className="flex justify-between p-2 rounded bg-white/[0.03] border border-white/[0.06]"
              >
                <span className="text-slate-200">{i.action}</span>
                <span className="text-slate-500 font-mono text-[10px]">
                  {i.input}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
