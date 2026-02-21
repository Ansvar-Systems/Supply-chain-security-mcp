import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface CompositionRiskSummary {
  id: string;
  risk_type: string;
  title: string;
  description: string;
  attack_mechanism: string;
  detection_methods: string[];
  prevention_measures: string[];
  real_world_examples: string[];
  affected_ecosystems: string[];
  severity: string;
}

export interface CompositionRiskGroup {
  risk_type: string;
  risks: CompositionRiskSummary[];
  count: number;
}

export interface CompositionRiskAssessment {
  risk_types: CompositionRiskGroup[];
  total_risks: number;
}

interface CompositionRiskRow {
  id: string;
  risk_type: string;
  title: string;
  description: string;
  attack_mechanism: string;
  detection_methods: string;
  prevention_measures: string;
  real_world_examples: string;
  affected_ecosystems: string;
  severity: string;
}

function parseRow(row: CompositionRiskRow): CompositionRiskSummary {
  return {
    ...row,
    detection_methods: JSON.parse(row.detection_methods || '[]'),
    prevention_measures: JSON.parse(row.prevention_measures || '[]'),
    real_world_examples: JSON.parse(row.real_world_examples || '[]'),
    affected_ecosystems: JSON.parse(row.affected_ecosystems || '[]'),
  };
}

export function assessCompositionRisk(
  db: Db,
  params: { risk_type?: string; severity?: string },
): ToolResponse<CompositionRiskAssessment> {
  let sql = 'SELECT id, risk_type, title, description, attack_mechanism, detection_methods, prevention_measures, real_world_examples, affected_ecosystems, severity FROM composition_risks';
  const conditions: string[] = [];
  const bindings: string[] = [];

  if (params.risk_type) {
    conditions.push('risk_type = ?');
    bindings.push(params.risk_type);
  }
  if (params.severity) {
    conditions.push('severity = ?');
    bindings.push(params.severity);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY risk_type, id';

  const rows = db.prepare(sql).all(...bindings) as CompositionRiskRow[];

  // Group by risk_type
  const grouped = new Map<string, CompositionRiskSummary[]>();
  for (const row of rows) {
    const parsed = parseRow(row);
    const existing = grouped.get(row.risk_type) ?? [];
    existing.push(parsed);
    grouped.set(row.risk_type, existing);
  }

  const risk_types: CompositionRiskGroup[] = [];
  for (const [risk_type, risks] of grouped) {
    risk_types.push({
      risk_type,
      risks,
      count: risks.length,
    });
  }

  // Sort by risk_type alphabetically
  risk_types.sort((a, b) => a.risk_type.localeCompare(b.risk_type));

  return {
    results: {
      risk_types,
      total_risks: rows.length,
    },
    _metadata: generateResponseMetadata(),
  };
}
