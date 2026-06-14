import { fileOpenProject, fileSaveProject } from "./tauri-commands.js";

export interface ProjectFile {
  name: string;
  tempo: number;
  timeSignature: [number, number];
  tracks: unknown[];
  [key: string]: unknown;
}

/** Project file operations via Tauri filesystem commands. */
export class FileManager {
  async open(path: string): Promise<ProjectFile> {
    return fileOpenProject(path) as Promise<ProjectFile>;
  }

  async save(projectData: ProjectFile, path: string): Promise<void> {
    return fileSaveProject(projectData, path);
  }
}
