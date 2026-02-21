import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { buildFtsQueryVariants, sanitizeFtsInput } from '../utils/fts-query.js';

export interface SbomFieldSummary {
  id: string;
  format: string;
  format_version: string;
  field_name: string;
  field_type: string;
  required: number;
  description: string;
  category: string | null;
}

const SUMMARY_COLUMNS =
  's.id, s.format, s.format_version, s.field_name, s.field_type, s.required, s.description, s.category';

export function searchSbomFields(
  db: Db,
  params: { query: string; format?: string },
): ToolResponse<SbomFieldSummary[]> {
  const variants = buildFtsQueryVariants(params.query);
  let rows: SbomFieldSummary[] = [];

  // Try FTS5 variants first
  for (const variant of variants) {
    const sql = params.format
      ? `SELECT ${SUMMARY_COLUMNS} FROM sbom_standards_fts f JOIN sbom_standards s ON f.id = s.id WHERE f.sbom_standards_fts MATCH ? AND s.format = ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM sbom_standards_fts f JOIN sbom_standards s ON f.id = s.id WHERE f.sbom_standards_fts MATCH ? LIMIT 50`;

    try {
      rows = params.format
        ? (db.prepare(sql).all(variant, params.format) as SbomFieldSummary[])
        : (db.prepare(sql).all(variant) as SbomFieldSummary[]);
    } catch {
      continue;
    }
    if (rows.length > 0) break;
  }

  // LIKE fallback
  if (rows.length === 0) {
    const sanitized = sanitizeFtsInput(params.query);
    const likePattern = `%${sanitized}%`;

    const sql = params.format
      ? `SELECT ${SUMMARY_COLUMNS.replace(/s\./g, 's.')} FROM sbom_standards s WHERE (s.field_name LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) AND s.format = ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS.replace(/s\./g, 's.')} FROM sbom_standards s WHERE (s.field_name LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) LIMIT 50`;

    rows = params.format
      ? (db.prepare(sql).all(likePattern, likePattern, likePattern, params.format) as SbomFieldSummary[])
      : (db.prepare(sql).all(likePattern, likePattern, likePattern) as SbomFieldSummary[]);
  }

  return {
    results: rows,
    _metadata: generateResponseMetadata(),
  };
}
