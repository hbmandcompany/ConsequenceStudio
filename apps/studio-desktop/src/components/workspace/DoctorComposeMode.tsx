import { PoetPanel } from "@consequence/ui";
import { poetPanelActions } from "./poet-actions.js";

/** Doctor panel Compose mode — instrument-grade Poet co-writer (no chat UI). */
export function DoctorComposeMode() {
  return <PoetPanel actions={poetPanelActions} />;
}
