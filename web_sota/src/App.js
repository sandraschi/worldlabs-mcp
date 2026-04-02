"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_router_dom_1 = require("react-router-dom");
var react_query_1 = require("@tanstack/react-query");
var app_layout_1 = require("@/components/layout/app-layout");
var dashboard_1 = require("@/pages/dashboard");
var status_1 = require("@/pages/status");
var tools_1 = require("@/pages/tools");
var world_gen_1 = require("@/pages/world-gen");
var world_viewer_1 = require("@/pages/world-viewer");
var tools_explorer_1 = require("@/pages/tools-explorer");
var local_llm_1 = require("@/pages/local-llm");
var apps_1 = require("@/pages/apps");
var help_1 = require("@/pages/help");
var settings_1 = require("@/pages/settings");
var queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 10000 },
    },
});
function App() {
    return (<react_query_1.QueryClientProvider client={queryClient}>
            <react_router_dom_1.BrowserRouter>
                <app_layout_1.AppLayout>
                    <react_router_dom_1.Routes>
                        <react_router_dom_1.Route path="/" element={<dashboard_1.Dashboard />}/>
                        <react_router_dom_1.Route path="/status" element={<status_1.Status />}/>
                        <react_router_dom_1.Route path="/tools" element={<tools_1.Tools />}/>
                        <react_router_dom_1.Route path="/architect" element={<world_gen_1.default />}/>
                        <react_router_dom_1.Route path="/library" element={<world_viewer_1.WorldViewer />}/>
                        <react_router_dom_1.Route path="/tools-explorer" element={<tools_explorer_1.ToolsExplorer />}/>
                        <react_router_dom_1.Route path="/local-llm" element={<local_llm_1.LocalLlm />}/>
                        <react_router_dom_1.Route path="/apps" element={<apps_1.Apps />}/>
                        <react_router_dom_1.Route path="/help" element={<help_1.Help />}/>
                        <react_router_dom_1.Route path="/settings" element={<settings_1.Settings />}/>
                        <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/" replace/>}/>
                    </react_router_dom_1.Routes>
                </app_layout_1.AppLayout>
            </react_router_dom_1.BrowserRouter>
        </react_query_1.QueryClientProvider>);
}
exports.default = App;
