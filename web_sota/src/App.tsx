import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { Dashboard } from '@/pages/dashboard';
import { Status } from '@/pages/status';
import { Tools } from '@/pages/tools';
import Architect from '@/pages/world-gen';
import { WorldViewer as Library } from '@/pages/world-viewer';
import { SparkViewer } from '@/pages/spark-viewer';
import { SparkDetail } from '@/pages/spark-detail';
import { ChiselDetail } from '@/pages/chisel-detail';
import { ToolsExplorer } from '@/pages/tools-explorer';
import { LocalLlm } from '@/pages/local-llm';
import { Apps } from '@/pages/apps';
import { Help } from '@/pages/help.jsx';
import { Settings } from '@/pages/settings';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 10_000 },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AppLayout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/status" element={<Status />} />
                        <Route path="/tools" element={<Tools />} />
                        <Route path="/architect" element={<Architect />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/spark-viewer" element={<SparkViewer />} />
                        <Route path="/spark-v2" element={<SparkDetail />} />
                        <Route path="/chisel" element={<ChiselDetail />} />
                        <Route path="/tools-explorer" element={<ToolsExplorer />} />
                        <Route path="/local-llm" element={<LocalLlm />} />
                        <Route path="/apps" element={<Apps />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AppLayout>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
