import type { UnifiedStream } from "@consequence/stream";

let workspaceStream: UnifiedStream | null = null;

export function setWorkspaceStream(stream: UnifiedStream): void {
  workspaceStream = stream;
}

export function getWorkspaceStream(): UnifiedStream | null {
  return workspaceStream;
}
