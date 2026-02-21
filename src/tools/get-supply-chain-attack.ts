import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface SupplyChainAttack {
  id: string;
  attack_name: string;
  description: string;
  attack_vector: string;
  mitre_attack_id: string | null;
  mitre_tactic: string | null;
  capec_id: string | null;
  case_study: string | null;
  affected_ecosystem: string | null;
  impact: string | null;
  detection_methods: string[];
  mitigations: string[];
  keywords: string | null;
  last_updated: string | null;
}

interface SupplyChainAttackRow {
  id: string;
  attack_name: string;
  description: string;
  attack_vector: string;
  mitre_attack_id: string | null;
  mitre_tactic: string | null;
  capec_id: string | null;
  case_study: string | null;
  affected_ecosystem: string | null;
  impact: string | null;
  detection_methods: string;
  mitigations: string;
  keywords: string | null;
  last_updated: string | null;
}

function parseRow(row: SupplyChainAttackRow): SupplyChainAttack {
  return {
    ...row,
    detection_methods: JSON.parse(row.detection_methods || '[]'),
    mitigations: JSON.parse(row.mitigations || '[]'),
  };
}

export function getSupplyChainAttack(
  db: Db,
  params: { attack_id: string },
): ToolResponse<SupplyChainAttack | null> {
  const row = db
    .prepare('SELECT * FROM supply_chain_attacks WHERE id = ?')
    .get(params.attack_id) as SupplyChainAttackRow | undefined;

  return {
    results: row ? parseRow(row) : null,
    _metadata: generateResponseMetadata(),
  };
}
