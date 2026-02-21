import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { buildFtsQueryVariants, sanitizeFtsInput } from '../utils/fts-query.js';

export interface AttackSummary {
  id: string;
  attack_name: string;
  description: string;
  attack_vector: string;
  mitre_attack_id: string | null;
  mitre_tactic: string | null;
  affected_ecosystem: string | null;
}

const SUMMARY_COLUMNS =
  's.id, s.attack_name, s.description, s.attack_vector, s.mitre_attack_id, s.mitre_tactic, s.affected_ecosystem';

export function searchAttackPatterns(
  db: Db,
  params: { query: string; ecosystem?: string },
): ToolResponse<AttackSummary[]> {
  const variants = buildFtsQueryVariants(params.query);
  let rows: AttackSummary[] = [];

  // Try FTS5 variants first
  for (const variant of variants) {
    const sql = params.ecosystem
      ? `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_attacks_fts f JOIN supply_chain_attacks s ON f.id = s.id WHERE f.supply_chain_attacks_fts MATCH ? AND s.affected_ecosystem LIKE ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_attacks_fts f JOIN supply_chain_attacks s ON f.id = s.id WHERE f.supply_chain_attacks_fts MATCH ? LIMIT 50`;

    try {
      rows = params.ecosystem
        ? (db.prepare(sql).all(variant, `%${params.ecosystem}%`) as AttackSummary[])
        : (db.prepare(sql).all(variant) as AttackSummary[]);
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
      ? `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_attacks s WHERE (s.attack_name LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) AND s.affected_ecosystem LIKE ? LIMIT 50`
      : `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_attacks s WHERE (s.attack_name LIKE ? OR s.description LIKE ? OR s.keywords LIKE ?) LIMIT 50`;

    rows = params.ecosystem
      ? (db.prepare(sql).all(likePattern, likePattern, likePattern, `%${params.ecosystem}%`) as AttackSummary[])
      : (db.prepare(sql).all(likePattern, likePattern, likePattern) as AttackSummary[]);
  }

  return {
    results: rows,
    _metadata: generateResponseMetadata(),
  };
}
