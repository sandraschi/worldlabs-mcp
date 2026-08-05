import {
  Activity,
  Binary,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Glasses,
  Globe2,
  Images,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  Palette,
  Settings,
  Smartphone,
  Sun,
  Terminal,
  Triangle,
  Wrench,
  Zap,
} from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useZoom } from "@/hooks/use-zoom";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// EXPERIMENTAL light mode (invert hack). Not fleet standard — see index.css.
// Toggling `.dark` off the root flips the invert filter; persisted so the
// choice survives reloads. Delete this + the CSS block to revert.
const THEME_KEY = "worldlabs-light-mode";

function useExperimentalTheme() {
  const [light, setLight] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", !light);
    try {
      localStorage.setItem(THEME_KEY, light ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [light]);

  return { light, toggle: () => setLight((v) => !v) };
}

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/tools-explorer", label: "Tools", icon: Wrench },
  { to: "/library", label: "World Library", icon: Library },
  { to: "/status", label: "Bridge Health", icon: Activity },
  { to: "/logs", label: "System Logs", icon: Terminal },
  { to: "/settings", label: "Configuration", icon: Settings },
];

const creativeItems = [
  { to: "/portals", label: "Painting Portals", icon: Palette },
  { to: "/paintings", label: "Local Paintings", icon: Images },
  { to: "/gallery", label: "Marble Gallery", icon: Globe2 },
  { to: "/onboarding", label: "Headset Setup", icon: Smartphone },
  { to: "/plex", label: "Cinema Worlds", icon: Clapperboard },
];

const engineItems = [
  { to: "/spark-v2", label: "Spark Engine", icon: Binary },
  { to: "/chisel", label: "Chiseling", icon: Triangle },
];

const xrItems = [{ to: "/immersive", label: "Reality Hub", icon: Glasses }];

function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full",
        "bg-[#070510]/80 backdrop-blur-xl border-r border-white/[0.06]",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56",
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cosmos-500 to-void-600 flex items-center justify-center shadow-[0_0_16px_rgba(92,84,255,0.4)]">
          <Globe2 className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <div className="text-sm font-bold text-white truncate">
              World Labs
            </div>
            <div className="text-[11px] text-cosmos-300 font-medium truncate">
              MCP Server
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto"
        aria-label="Sidebar navigation"
      >
        {!collapsed && (
          <div className="section-label px-2 pb-2">Navigation</div>
        )}
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                collapsed && "justify-center",
                isActive
                  ? "bg-cosmos-600/30 text-cosmos-300 border border-cosmos-500/30 shadow-[inset_0_1px_0_rgba(92,84,255,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}

        {!collapsed && (
          <div className="section-label px-2 pt-6 pb-2">Creative</div>
        )}
        {creativeItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                collapsed && "justify-center",
                isActive
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow-[inset_0_1px_0_rgba(245,158,11,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}

        {!collapsed && (
          <div className="section-label px-2 pt-6 pb-2">Core Engines</div>
        )}
        {engineItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                collapsed && "justify-center",
                isActive
                  ? "bg-void-600/30 text-void-300 border border-void-500/30 shadow-[inset_0_1px_0_rgba(111,84,255,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}

        {!collapsed && (
          <div className="section-label px-2 pt-6 pb-2">Immersive Reality</div>
        )}
        {xrItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                collapsed && "justify-center",
                isActive
                  ? "bg-aurora-600/30 text-aurora-300 border border-aurora-500/30 shadow-[inset_0_1px_0_rgba(74,222,128,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: version badge */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
            <Zap
              className="w-3 h-3 text-cosmos-400 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs text-slate-400">Marble API v1</span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 z-10",
          "w-6 h-6 rounded-full flex items-center justify-center",
          "bg-[#121024] border border-white/[0.12] text-slate-400",
          "hover:text-white hover:border-cosmos-500/50 hover:bg-cosmos-900/50",
          "transition-all duration-150 shadow-md",
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        ) : (
          <ChevronLeft className="w-3 h-3" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}

function Topbar() {
  const { setCollapsed, collapsed } = useSidebar();
  const location = useLocation();
  const backend = useAppStore((s) => s.backend);
  const { light, toggle } = useExperimentalTheme();

  const currentPage = [
    ...navItems,
    ...creativeItems,
    ...engineItems,
    ...xrItems,
  ].find((n) =>
    n.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(n.to),
  );

  return (
    <header
      className="h-14 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-[#070510]/60 backdrop-blur-md"
      role="banner"
    >
      {/* Mobile menu toggle */}
      <button
        className="md:hidden text-slate-400 hover:text-white transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        title="Toggle sidebar"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2">
        {currentPage &&
          (() => {
            const Icon = currentPage.icon;
            return (
              <Icon className="w-4 h-4 text-cosmos-400" aria-hidden="true" />
            );
          })()}
        <h1 className="text-sm font-semibold text-slate-200">
          {currentPage?.label ?? "World Labs MCP"}
        </h1>
      </div>

      <div className="flex-1" />

      {/* Day mode toggle */}
      <button
        onClick={toggle}
        title={
          light
            ? "Switch to dark (experimental light mode)"
            : "Switch to light (experimental, ugly)"
        }
        aria-label="Toggle light mode (experimental)"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
      >
        {light ? (
          <Moon className="w-3.5 h-3.5" aria-hidden="true" />
        ) : (
          <Sun className="w-3.5 h-3.5" aria-hidden="true" />
        )}
      </button>

      {/* Status pill */}
      <div
        data-testid="backend-dot"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
          backend.ok === null
            ? "bg-gray-500/10 border-gray-500/20"
            : backend.ok
              ? "bg-aurora-500/10 border-aurora-500/20"
              : "bg-red-500/10 border-red-500/20"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            backend.ok === null
              ? "bg-gray-400"
              : backend.ok
                ? "bg-aurora-400 animate-pulse"
                : "bg-red-400 animate-pulse"
          }`}
          aria-hidden="true"
        />
        <span
          className={`text-xs font-semibold ${
            backend.ok === null
              ? "text-gray-400"
              : backend.ok
                ? "text-aurora-400"
                : "text-red-400"
          }`}
        >
          {backend.ok === null
            ? "Connecting..."
            : backend.ok
              ? "Live"
              : "Offline"}
        </span>
      </div>

      {/* World Labs link */}
      <a
        href="https://platform.worldlabs.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all"
        title="World Labs Platform"
      >
        <Globe2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Platform</span>
      </a>
    </header>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const checkHealth = useAppStore((s) => s.checkHealth);
  const setBackend = useAppStore((s) => s.setBackend);
  useZoom();

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlisten = await listen<string>("backend-status", (event) => {
          if (event.payload === "ready") {
            checkHealth();
          } else if (
            typeof event.payload === "string" &&
            event.payload.startsWith("error:")
          ) {
            setBackend({ ok: false, error: event.payload });
          }
        });
      } catch {
        // Not inside Tauri -- HTTP polling handles it
      }
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, [checkHealth, setBackend]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex h-screen overflow-hidden bg-[#0a0812]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
