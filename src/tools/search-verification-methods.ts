import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { buildFtsQueryVariants, sanitizeFtsInput } from '../utils/fts-query.js';

export interface SigningPatternSummary {
  id: string;
  tool_name: string;
  description: string;
  use_case: string;
  ecosystem: string | null;
}

const SUMMARY_COLUMNS =
  's.id, s.tool_name, s.description, s.use_case, s.ecosystem';

export function searchVerificationMethods(
  db: Db,
  params: { query: string; ecosystem?: string },
): ToolResponse<SigningPatternSummary[]> {
  const variants = buildFtsQueryVariants(params.query);
  let rows: SigningPatternSummary[] = [];

  // Try FTS5 variants first
  for (const variant of variants) {
    const sql = params.ecosystem
      ? `SELECT ${SUMMARY_COLUMNS} FROM signing_verification_fts f JOIN signing_verification s ON f.id = s.id WHERE f.signing_verification_fts MATCH ? AND s.ecosystem LIKE ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM signing_verification_fts f JOIN signing_verification s ON f.id = s.id WHERE f.signing_verification_fts MATCH ? LIMIT 50`;

    try {
      rows = params.ecosystem
        ? (db.prepare(sql).all(variant, `%${params.ecosystem}%`) as SigningPatternSummary[])
        : (db.prepare(sql).all(variant) as SigningPatternSummary[]);
    } catch {
      continue;
    }
    if (rows.length > 0) break;
  }

  // LIKE fallback
  if (rows.length === 0) {
    const sanitized = sanitizeFtsInput(params.query);
    const likePattern = `%${sanitized}%`;

    const sql = params.ecosystem
      ? `SELECT ${SUMMARY_COLUMNS} FROM signing_verification s WHERE (s.tool_name LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) AND s.ecosystem LIKE ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM signing_verification s WHERE (s.tool_name LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) LIMIT 50`;

    rows = params.ecosystem
      ? (db.prepare(sql).all(likePattern, likePattern, likePattern, `%${params.ecosystem}%`) as SigningPatternSummary[])
      : (db.prepare(sql).all(likePattern, likePattern, likePattern) as SigningPatternSummary[]);
  }

  return {
    results: rows,
    _metadata: generateResponseMetadata(),
  };
}
