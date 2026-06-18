import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@consequence/state";
import { AppUpdateBanner } from "./components/AppUpdateBanner";
import { ProtectedWorkspaceRoute } from "./routes/ProtectedWorkspaceRoute";
import { WelcomeRoute } from "./routes/WelcomeRoute";

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/workspace" replace />;
  return <WelcomeRoute />;
}

export default function App() {
  return (
    <>
      <AppUpdateBanner />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/workspace" element={<ProtectedWorkspaceRoute />} />
      </Routes>
    </>
  );
}
