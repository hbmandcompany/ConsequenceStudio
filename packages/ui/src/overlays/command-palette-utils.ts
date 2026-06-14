import type { CommandDefinition, CommandSection } from "../keymap.js";
import { COMMAND_SECTION_ORDER } from "../keymap.js";

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function commandMatchesQuery(command: CommandDefinition, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  const haystack = [command.label, command.section, ...(command.keywords ?? [])].join(" ").toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export function filterCommands(commands: CommandDefinition[], query: string): CommandDefinition[] {
  return commands.filter((command) => commandMatchesQuery(command, query));
}

export interface CommandSectionGroup {
  section: CommandSection;
  commands: CommandDefinition[];
}

export function groupFilteredCommands(commands: CommandDefinition[]): CommandSectionGroup[] {
  const groups: CommandSectionGroup[] = [];
  for (const section of COMMAND_SECTION_ORDER) {
    const sectionCommands = commands.filter((c) => c.section === section);
    if (sectionCommands.length > 0) {
      groups.push({ section, commands: sectionCommands });
    }
  }
  return groups;
}
