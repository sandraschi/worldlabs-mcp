import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Smartphone, CheckCircle2, XCircle, Loader2,
    RefreshCw, ShieldCheck,
    AlertTriangle, ExternalLink,
    ArrowRight, Copy, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const STEPS = [
    {
        id: 'prereqs',
        label: 'Prerequisites',
        desc: 'Android Platform Tools + Developer Mode',
        content: `
Before you start, you need two things:

**ADB (Android Debug Bridge)** — a tool that lets your PC talk to Android
devices over USB or WiFi. VR headsets run Android, so ADB is how we forward
the dashboard URL into the headset's browser.

Download ADB from developer.android.com/studio/releases/platform-tools.
Extract the zip, then either:
• Add the folder to your system PATH, or
• Run adb commands from that folder

Verify: open a terminal and type adb --version — you should see version info.

**Developer Mode** enabled on your headset:
• Meta Quest: Meta phone app → Devices → Headset Settings → Developer Mode → ON
• Pico 4: Settings → General → About → tap "Software Version" 7 times →
  Developer Options → USB Debugging → ON
• Vive XR Elite: Enable via Vive phone app
        `,
    },
    {
        id: 'usb',
        label: 'Connect USB',
        desc: 'Plug in and accept the debugging prompt',
        content: `
Connect your headset to your PC via USB-C cable. Put on the headset — you'll see
a prompt: "Allow USB debugging?" Check "Always allow" and tap Allow.

Then verify the connection by clicking "Check Connection" below.
        `,
    },
    {
        id: 'wireless',
        label: 'Enable Wireless',
        desc: 'Switch ADB to TCP mode and disconnect USB',
        content: `
Run this command in your terminal:

    adb tcpip 5555

This restarts ADB in wireless mode. You can now disconnect the USB cable.
        `,
    },
    {
        id: 'connect',
        label: 'Connect WiFi',
        desc: 'Pair over your local network',
        content: `
Find your headset's IP address:
• Meta Quest: Settings → Wi-Fi → Network → IP Address
• Pico 4: Settings → Wi-Fi → current network → IP Address

Then run:

    adb connect 192.168.1.XXX:5555

(Replace with your headset's actual IP)
        `,
    },
    {
        id: 'forward',
        label: 'Port Forward',
        desc: 'Make dashboard accessible from the headset browser',
        content: `
Run this command to forward the dashboard to the headset:

    adb reverse tcp:10864 tcp:10865

Now open http://localhost:10864 in your headset's browser.
You should see the worldlabs-mcp dashboard.
        `,
    },
    {
        id: 'view',
        label: 'View Worlds',
        desc: 'Navigate to the Spark viewer',
        content: `
From the dashboard:
1. Go to World Library → click a world card → click "Spark 2.0"
2. The splat should load in the 3D viewer
3. Click "Enter VR" to go immersive

If "Enter VR" doesn't appear:
• Quest: chrome://flags → #unsafely-treat-insecure-origin-as-secure
  → add http://localhost:10864
• Pico: should work natively without flags
        `,
    },
];

export function Onboarding() {
    const [activeStep, setActiveStep] = useState(0);
    const [copied, setCopied] = useState<string | null>(null);

    const { data: adbData, isLoading: adbLoading, refetch: adbRefetch } = useQuery({
        queryKey: ['adb-devices'],
        queryFn: () => api.adbDevices(),
        staleTime: 3000,
        retry: false,
    });

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const step = STEPS[activeStep];

    return (
        <div className="space-y-6 page-enter max-w-3xl mx-auto pb-20">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora-500 to-cosmos-600 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                    <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">Headset Setup</h1>
                    <p className="text-sm text-slate-400">Connect your Quest, Pico, or Vive for wireless 3D streaming.</p>
                </div>
            </div>

            {/* Device type selector */}
            <div className="flex gap-2">
                {['Meta Quest', 'Pico 4'].map(d => (
                    <button key={d} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] transition-all">
                        {d}
                    </button>
                ))}
            </div>

            <div className="flex gap-6">
                {/* Step sidebar */}
                <div className="hidden md:flex flex-col gap-1 w-48 shrink-0">
                    {STEPS.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveStep(i)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all',
                                i === activeStep
                                    ? 'bg-cosmos-600/30 text-cosmos-300 border border-cosmos-500/30'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]',
                            )}
                        >
                            <span className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                i < activeStep ? 'bg-aurora-500/20 text-aurora-400' :
                                i === activeStep ? 'bg-cosmos-500 text-white' :
                                'bg-white/[0.06] text-slate-500',
                            )}>
                                {i < activeStep ? '✓' : i + 1}
                            </span>
                            <div className="min-w-0">
                                <div className="truncate font-medium">{s.label}</div>
                                <div className="truncate text-[9px] text-slate-600">{s.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Step content */}
                <div className="flex-1 space-y-4">
                    {/* Progress */}
                    <div className="flex gap-1">
                        {STEPS.map((_, i) => (
                            <div key={i} className={cn(
                                'flex-1 h-1 rounded-full transition-all',
                                i <= activeStep ? 'bg-cosmos-500' : 'bg-white/[0.06]',
                            )} />
                        ))}
                    </div>

                    {/* Step card */}
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-white">{activeStep + 1}. {step.label}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                            </div>
                            <span className="text-xs text-slate-600">{activeStep + 1} / {STEPS.length}</span>
                        </div>

                        <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                            {step.content}
                        </div>

                        {/* USB connection check for step 1 */}
                        {step.id === 'usb' && (
                            <div className="glass-card p-4 border-cosmos-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-200">Device check</span>
                                    <button onClick={() => adbRefetch()} disabled={adbLoading}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw className={cn('w-3 h-3', adbLoading && 'animate-spin')} />
                                        Check Connection
                                    </button>
                                </div>
                                {adbLoading && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Scanning for devices...
                                    </div>
                                )}
                                {adbData && !adbData.success && (
                                    <div className="flex items-start gap-2 text-xs text-red-400">
                                        <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium">ADB not found</p>
                                            <p className="text-slate-500 mt-0.5">{adbData.error}</p>
                                            <a href="https://developer.android.com/studio/releases/platform-tools" target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-cosmos-400 hover:text-cosmos-300 mt-1">
                                                Download Platform Tools <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {adbData && adbData.success && (
                                    adbData.devices && adbData.devices.length > 0 ? (
                                        <div className="space-y-2">
                                            {adbData.devices.map(d => (
                                                <div key={d.serial} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-aurora-400" />
                                                        <span className="text-xs font-mono text-slate-200">{d.serial}</span>
                                                    </div>
                                                    <span className={cn(
                                                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                                                        d.status === 'device' ? 'text-aurora-400 bg-aurora-500/10' : 'text-amber-400 bg-amber-500/10',
                                                    )}>{d.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500">No devices connected. Connect via USB and check the headset for the allow prompt.</div>
                                    )
                                )}
                            </div>
                        )}

                        {/* Command copy buttons */}
                        {['wireless', 'connect', 'forward'].includes(step.id) && (
                            <div className="glass-card p-4 border-amber-500/20 space-y-2">
                                {step.id === 'wireless' && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                                        <code className="text-xs font-mono text-cosmos-200">adb tcpip 5555</code>
                                        <button onClick={() => copyToClipboard('adb tcpip 5555', 'tcpip')}
                                            className="p-1.5 rounded text-slate-500 hover:text-cosmos-400 transition-all">
                                            <ShieldCheck className={cn('w-4 h-4', copied === 'tcpip' && 'text-aurora-500')} />
                                        </button>
                                    </div>
                                )}
                                {step.id === 'connect' && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                                        <code className="text-xs font-mono text-cosmos-200">adb connect 192.168.1.XXX:5555</code>
                                        <button onClick={() => copyToClipboard('adb connect 192.168.1.XXX:5555', 'connect')}
                                            className="p-1.5 rounded text-slate-500 hover:text-cosmos-400 transition-all">
                                            <ShieldCheck className={cn('w-4 h-4', copied === 'connect' && 'text-aurora-500')} />
                                        </button>
                                    </div>
                                )}
                                {step.id === 'forward' && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                                        <code className="text-xs font-mono text-cosmos-200">adb reverse tcp:10864 tcp:10865</code>
                                        <button onClick={() => copyToClipboard('adb reverse tcp:10864 tcp:10865', 'reverse')}
                                            className="p-1.5 rounded text-slate-500 hover:text-cosmos-400 transition-all">
                                            <ShieldCheck className={cn('w-4 h-4', copied === 'reverse' && 'text-aurora-500')} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Troubleshooting */}
                        {step.id === 'view' && (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-400 leading-relaxed space-y-2">
                                <p className="flex items-center gap-2 text-amber-400 font-bold">
                                    <AlertTriangle className="w-4 h-4" />
                                    "Enter VR" button not showing?
                                </p>
                                <p>Quest browsers require a secure context flag:</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="text-[10px] font-mono text-amber-200 bg-black/40 rounded px-2 py-1 flex-1 truncate border border-amber-500/10">
                                        chrome://flags/#unsafely-treat-insecure-origin-as-secure
                                    </code>
                                    <button onClick={() => copyToClipboard('chrome://flags/#unsafely-treat-insecure-origin-as-secure', 'flags')}
                                        className="p-1.5 rounded text-slate-500 hover:text-amber-400 transition-all">
                                        <ShieldCheck className={cn('w-4 h-4', copied === 'flags' && 'text-aurora-500')} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-amber-500/60">Add http://localhost:10864 to the list, then relaunch the browser.</p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                            disabled={activeStep === 0}
                            className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                            disabled={activeStep === STEPS.length - 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cosmos-600 to-cosmos-500 text-white hover:from-cosmos-500 hover:to-cosmos-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Full reference */}
            <details className="glass-card">
                <summary className="p-4 text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Complete reference (all commands, troubleshooting)
                </summary>
                <div className="px-4 pb-4 space-y-1">
                    {[
                        { cmd: 'adb devices', label: 'Verify USB connection' },
                        { cmd: 'adb tcpip 5555', label: 'Enable wireless mode' },
                        { cmd: 'adb connect 192.168.1.XXX:5555', label: 'Connect over WiFi' },
                        { cmd: 'adb reverse tcp:10864 tcp:10865', label: 'Port forward dashboard' },
                    ].map(item => (
                        <div key={item.cmd} className="flex items-center gap-2 p-2 rounded bg-white/[0.02]">
                            <code className="text-[10px] font-mono text-cosmos-300 flex-1">{item.cmd}</code>
                            <span className="text-[9px] text-slate-600">{item.label}</span>
                            <button onClick={() => copyToClipboard(item.cmd, item.cmd)}
                                className="p-1 rounded text-slate-600 hover:text-cosmos-400 transition-all">
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </details>

        </div>
    );
}
