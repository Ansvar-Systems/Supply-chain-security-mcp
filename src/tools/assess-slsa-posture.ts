import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import type { SlsaRequirementSummary } from './search-slsa-requirements.js';

export interface SlsaLevelPosture {
  level: number;
  requirements: SlsaRequirementSummary[];
  count: number;
}

export interface SlsaPosture {
  levels: SlsaLevelPosture[];
  total_requirements: number;
}

export function assessSlsaPosture(
  db: Db,
  params: { level?: number },
): ToolResponse<SlsaPosture> {
  const sql = params.level
    ? 'SELECT id, level, requirement_id, title, description, category FROM slsa_requirements WHERE level = ? ORDER BY level, id'
    : 'SELECT id, level, requirement_id, title, description, category FROM slsa_requirements ORDER BY level, id';

  const rows = params.level
    ? (db.prepare(sql).all(params.level) as SlsaRequirementSummary[])
    : (db.prepare(sql).all() as SlsaRequirementSummary[]);

  // Group by level
  const grouped = new Map<number, SlsaRequirementSummary[]>();
  for (const row of rows) {
    const existing = grouped.get(row.level) ?? [];
    existing.push(row);
    grouped.set(row.level, existing);
  }

  const levels: SlsaLevelPosture[] = [];
  for (const [level, requirements] of grouped) {
    levels.push({
      level,
      requirements,
      count: requirements.length,
    });
  }

  // Sort levels numerically
  levels.sort((a, b) => a.level - b.level);

  return {
    results: {
      levels,
      total_requirements: rows.length,
    },
    _metadata: generateResponseMetadata(),
  };
}
