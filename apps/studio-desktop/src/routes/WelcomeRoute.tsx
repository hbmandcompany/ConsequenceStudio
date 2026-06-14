import { SpaceBackground } from "../components/welcome/SpaceBackground";
import { AuthPanel } from "../components/welcome/AuthPanel";

export function WelcomeRoute() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <SpaceBackground />
      <AuthPanel />
    </div>
  );
}
