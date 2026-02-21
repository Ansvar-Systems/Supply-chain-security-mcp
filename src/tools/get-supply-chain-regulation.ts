import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface Regulation {
  id: string;
  regulation: string;
  regulation_version: string;
  article_or_section: string;
  title: string;
  description: string;
  requirements: string[];
  applicability: string | null;
  effective_date: string | null;
  enforcement: string | null;
  framework_mappings: Record<string, string>;
  keywords: string | null;
  last_updated: string | null;
}

interface RegulationRow {
  id: string;
  regulation: string;
  regulation_version: string;
  article_or_section: string;
  title: string;
  description: string;
  requirements: string;
  applicability: string | null;
  effective_date: string | null;
  enforcement: string | null;
  framework_mappings: string;
  keywords: string | null;
  last_updated: string | null;
}

function parseRow(row: RegulationRow): Regulation {
  return {
    ...row,
    requirements: JSON.parse(row.requirements || '[]'),
    framework_mappings: JSON.parse(row.framework_mappings || '{}'),
  };
}

export function getSupplyChainRegulation(
  db: Db,
  params: { regulation_id: string },
): ToolResponse<Regulation | null> {
  const row = db
    .prepare('SELECT * FROM supply_chain_regulations WHERE id = ?')
    .get(params.regulation_id) as RegulationRow | undefined;

  return {
    results: row ? parseRow(row) : null,
    _metadata: generateResponseMetadata(),
  };
}
