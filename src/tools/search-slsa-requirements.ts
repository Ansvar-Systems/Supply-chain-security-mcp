import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { buildFtsQueryVariants, sanitizeFtsInput } from '../utils/fts-query.js';

export interface SlsaRequirementSummary {
  id: string;
  level: number;
  requirement_id: string;
  title: string;
  description: string;
  category: string | null;
}

const SUMMARY_COLUMNS =
  's.id, s.level, s.requirement_id, s.title, s.description, s.category';

export function searchSlsaRequirements(
  db: Db,
  params: { query: string; level?: number },
): ToolResponse<SlsaRequirementSummary[]> {
  const variants = buildFtsQueryVariants(params.query);
  let rows: SlsaRequirementSummary[] = [];

  // Try FTS5 variants first
  for (const variant of variants) {
    const sql = params.level
      ? `SELECT ${SUMMARY_COLUMNS} FROM slsa_requirements_fts f JOIN slsa_requirements s ON f.id = s.id WHERE f.slsa_requirements_fts MATCH ? AND s.level = ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM slsa_requirements_fts f JOIN slsa_requirements s ON f.id = s.id WHERE f.slsa_requirements_fts MATCH ? LIMIT 50`;

    try {
      rows = params.level
        ? (db.prepare(sql).all(variant, params.level) as SlsaRequirementSummary[])
        : (db.prepare(sql).all(variant) as SlsaRequirementSummary[]);
    } catch {
      continue;
    }
    if (rows.length > 0) break;
  }

  // LIKE fallback
  if (rows.length === 0) {
    const sanitized = sanitizeFtsInput(params.query);
    const likePattern = `%${sanitized}%`;

    const sql = params.level
      ? `SELECT ${SUMMARY_COLUMNS} FROM slsa_requirements s WHERE (s.title LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) AND s.level = ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM slsa_requirements s WHERE (s.title LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) LIMIT 50`;

    rows = params.level
      ? (db.prepare(sql).all(likePattern, likePattern, likePattern, params.level) as SlsaRequirementSummary[])
      : (db.prepare(sql).all(likePattern, likePattern, likePattern) as SlsaRequirementSummary[]);
  }

  return {
    results: rows,
    _metadata: generateResponseMetadata(),
  };
}
