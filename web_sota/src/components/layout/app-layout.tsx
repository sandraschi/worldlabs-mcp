import { useState, createContext, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Globe2,
    LayoutDashboard,
    Activity,
    Wrench,
    Settings,
    ChevronLeft,
    ChevronRight,
    Zap,
    Menu,
    Wand2,
    Binary,
    Triangle,
    Glasses,
    Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarContextValue {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
    collapsed: false,
    setCollapsed: () => { },
});

export function useSidebar() {
    return useContext(SidebarContext);
}

const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/library', label: 'World Library', icon: Globe2 },
    { to: '/status', label: 'Bridge Health', icon: Activity },
    { to: '/logs', label: 'System Logs', icon: Terminal },
    { to: '/settings', label: 'Configuration', icon: Settings },
];

const engineItems = [
    { to: '/spark-v2', label: 'Spark Engine', icon: Binary },
    { to: '/chisel', label: 'Chiseling', icon: Triangle },
];

const xrItems = [
    { to: '/immersive', label: 'Reality Hub', icon: Glasses },
];

function Sidebar() {
    const { collapsed, setCollapsed } = useSidebar();
    const location = useLocation();

    return (
        <aside
            className={cn(
                'relative flex flex-col h-full',
                'bg-[#070510]/80 backdrop-blur-xl border-r border-white/[0.06]',
                'transition-all duration-300 ease-in-out',
                collapsed ? 'w-16' : 'w-56',
            )}
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]',
                collapsed && 'justify-center px-0',
            )}>
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cosmos-500 to-void-600 flex items-center justify-center shadow-[0_0_16px_rgba(92,84,255,0.4)]">
                    <Globe2 className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in min-w-0">
                        <div className="text-sm font-bold text-white truncate">World Labs</div>
                        <div className="text-[11px] text-cosmos-300 font-medium truncate">MCP Server</div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" aria-label="Sidebar navigation">
                {!collapsed && (
                    <div className="section-label px-2 pb-2">Navigation</div>
                )}
                {navItems.map(({ to, label, icon: Icon }) => {
                    const isActive = to === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(to);
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            title={collapsed ? label : undefined}
                            className={cn(
                                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium',
                                'transition-all duration-150',
                                collapsed && 'justify-center',
                                isActive
                                    ? 'bg-cosmos-600/30 text-cosmos-300 border border-cosmos-500/30 shadow-[inset_0_1px_0_rgba(92,84,255,0.15)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]',
                            )}
                            aria-current={isActive ? 'page' : undefined}
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
                                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium',
                                'transition-all duration-150',
                                collapsed && 'justify-center',
                                isActive
                                    ? 'bg-void-600/30 text-void-300 border border-void-500/30 shadow-[inset_0_1px_0_rgba(111,84,255,0.15)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]',
                            )}
                            aria-current={isActive ? 'page' : undefined}
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
                                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium',
                                'transition-all duration-150',
                                collapsed && 'justify-center',
                                isActive
                                    ? 'bg-aurora-600/30 text-aurora-300 border border-aurora-500/30 shadow-[inset_0_1px_0_rgba(74,222,128,0.15)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]',
                            )}
                            aria-current={isActive ? 'page' : undefined}
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
                        <Zap className="w-3 h-3 text-cosmos-400 flex-shrink-0" aria-hidden="true" />
                        <span className="text-xs text-slate-400">Marble API v1</span>
                    </div>
                </div>
            )}

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={cn(
                    'absolute -right-3 top-1/2 -translate-y-1/2 z-10',
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    'bg-[#121024] border border-white/[0.12] text-slate-400',
                    'hover:text-white hover:border-cosmos-500/50 hover:bg-cosmos-900/50',
                    'transition-all duration-150 shadow-md',
                )}
            >
                {collapsed
                    ? <ChevronRight className="w-3 h-3" aria-hidden="true" />
                    : <ChevronLeft className="w-3 h-3" aria-hidden="true" />
                }
            </button>
        </aside>
    );
}

function Topbar() {
    const { setCollapsed, collapsed } = useSidebar();
    const location = useLocation();

    const currentPage = [...navItems, ...engineItems, ...xrItems].find(n =>
        n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
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
                {currentPage && (() => {
                    const Icon = currentPage.icon;
                    return <Icon className="w-4 h-4 text-cosmos-400" aria-hidden="true" />;
                })()}
                <h1 className="text-sm font-semibold text-slate-200">
                    {currentPage?.label ?? 'World Labs MCP'}
                </h1>
            </div>

            <div className="flex-1" />

            {/* Status pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-aurora-500/10 border border-aurora-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-aurora-400 animate-pulse-slow" aria-hidden="true" />
                <span className="text-xs font-semibold text-aurora-400">Live</span>
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

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <div className="flex h-screen overflow-hidden bg-[#0a0812]">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
