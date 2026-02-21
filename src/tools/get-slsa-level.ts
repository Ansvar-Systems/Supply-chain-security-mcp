import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface SlsaRequirement {
  id: string;
  level: number;
  requirement_id: string;
  title: string;
  description: string;
  evidence_types: string[];
  verification_criteria: string | null;
  build_system_guidance: string | null;
  category: string | null;
  framework_mappings: Record<string, string>;
  keywords: string | null;
  last_updated: string | null;
}

interface SlsaRequirementRow {
  id: string;
  level: number;
  requirement_id: string;
  title: string;
  description: string;
  evidence_types: string;
  verification_criteria: string | null;
  build_system_guidance: string | null;
  category: string | null;
  framework_mappings: string;
  keywords: string | null;
  last_updated: string | null;
}

function parseRow(row: SlsaRequirementRow): SlsaRequirement {
  return {
    ...row,
    evidence_types: JSON.parse(row.evidence_types || '[]'),
    framework_mappings: JSON.parse(row.framework_mappings || '{}'),
  };
}

export function getSlsaLevel(
  db: Db,
  params: { requirement_id: string },
): ToolResponse<SlsaRequirement | null> {
  const row = db
    .prepare('SELECT * FROM slsa_requirements WHERE requirement_id = ?')
    .get(params.requirement_id) as SlsaRequirementRow | undefined;

  return {
    results: row ? parseRow(row) : null,
    _metadata: generateResponseMetadata(),
  };
}
