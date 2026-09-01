import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import FloatingChat from "@/components/FloatingChat";
import { AppLayout } from "@/components/layout/app-layout";
import { Apps } from "@/pages/apps";
import ChatPage from "@/pages/chat";
import { ChiselDetail } from "@/pages/chisel-detail";
import { Dashboard } from "@/pages/dashboard";
import { MarbleGallery } from "@/pages/gallery";
import { Help } from "@/pages/help.jsx";
import { ImmersiveDetail } from "@/pages/immersive-detail";
import { WorldLibrary } from "@/pages/library";
import { LocalLlm } from "@/pages/local-llm";
import LogsPage from "@/pages/logs";
import { Onboarding } from "@/pages/onboarding";
import { PaintingPortals } from "@/pages/painting-portals";
import { LocalPaintings } from "@/pages/paintings";
import PlexCinema from "@/pages/plex-cinema";
import { Settings } from "@/pages/settings";
import { SkillsPage } from "@/pages/skills";
import { SparkDetail } from "@/pages/spark-detail";
import { SparkViewer } from "@/pages/spark-viewer";
import { Status } from "@/pages/status";
import { ToolsExplorer } from "@/pages/tools-explorer";
import Architect from "@/pages/world-gen";
import { WorldViewer } from "@/pages/world-viewer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/status" element={<Status />} />
              <Route
                path="/tools"
                element={<Navigate to="/tools-explorer" replace />}
              />
              <Route path="/architect" element={<Architect />} />
              <Route path="/library" element={<WorldLibrary />} />
              <Route path="/library/viewer" element={<WorldViewer />} />
              <Route path="/portals" element={<PaintingPortals />} />
              <Route path="/paintings" element={<LocalPaintings />} />
              <Route path="/gallery" element={<MarbleGallery />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/spark-viewer" element={<SparkViewer />} />
              <Route path="/spark-v2" element={<SparkDetail />} />
              <Route path="/chisel" element={<ChiselDetail />} />
              <Route path="/immersive" element={<ImmersiveDetail />} />
              <Route path="/tools-explorer" element={<ToolsExplorer />} />
              <Route path="/local-llm" element={<LocalLlm />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/help" element={<Help />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/plex" element={<PlexCinema />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </QueryClientProvider>
      <FloatingChat />
    </>
  );
}

export default App;
