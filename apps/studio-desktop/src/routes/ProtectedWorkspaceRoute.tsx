import { Navigate } from "react-router-dom";
import { useAuthStore } from "@consequence/state";
import { WorkspaceRoute } from "./WorkspaceRoute";

export function ProtectedWorkspaceRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <WorkspaceRoute />;
}
