import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ToolResponse } from '../utils/metadata.js';
import { generateResponseMetadata } from '../utils/metadata.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SourceEntry {
  name: string;
  url: string;
  type: string;
  licence: string;
  update_frequency: string;
  note?: string;
}

export function listSources(): ToolResponse<SourceEntry[]> {
  const sourcesPath = join(__dirname, '..', '..', 'sources.yml');
  const raw = readFileSync(sourcesPath, 'utf-8');

  // Simple YAML parsing for our known flat structure
  const sources: SourceEntry[] = [];
  let current: Partial<SourceEntry> | null = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- name:')) {
      if (current && current.name) sources.push(current as SourceEntry);
      current = { name: trimmed.replace('- name:', '').trim() };
    } else if (current) {
      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        (current as Record<string, string>)[key] = value;
      }
    }
  }
  if (current && current.name) sources.push(current as SourceEntry);

  return { results: sources, _metadata: generateResponseMetadata() };
}
