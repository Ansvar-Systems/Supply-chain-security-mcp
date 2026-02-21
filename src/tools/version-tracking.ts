import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface RegulationVersion {
  id: string;
  regulation_id: string;
  version_label: string;
  effective_date: string | null;
  body_text: string | null;
  scraped_at: string | null;
  change_summary: string | null;
  diff_from_previous: string | null;
}

export interface RegulationDiff {
  regulation_id: string;
  versions: Array<{
    version_label: string;
    effective_date: string | null;
    change_summary: string | null;
    diff_from_previous: string | null;
  }>;
}

export interface PremiumDisabledMessage {
  message: string;
}

const PREMIUM_DISABLED_MESSAGE =
  'Premium version tracking is not enabled. Set PREMIUM_ENABLED=true to access regulation history.';

// ─── Helpers ───────────────────────────────────────────────────────

function isPremiumEnabled(): boolean {
  return process.env.PREMIUM_ENABLED === 'true';
}

function hasVersionTable(db: Db): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='regulation_versions'")
    .get() as { name: string } | undefined;
  return !!row;
}

// ─── getRegulationHistory ──────────────────────────────────────────

export function getRegulationHistory(
  db: Db,
  params: { regulation_id: string },
): ToolResponse<RegulationVersion[] | PremiumDisabledMessage> {
  if (!isPremiumEnabled()) {
    return {
      results: { message: PREMIUM_DISABLED_MESSAGE },
      _metadata: generateResponseMetadata(),
    };
  }

  if (!hasVersionTable(db)) {
    return {
      results: [],
      _metadata: generateResponseMetadata(),
    };
  }

  const rows = db
    .prepare(
      'SELECT * FROM regulation_versions WHERE regulation_id = ? ORDER BY effective_date DESC',
    )
    .all(params.regulation_id) as RegulationVersion[];

  return {
    results: rows,
    _metadata: generateResponseMetadata(),
  };
}

// ─── diffRegulation ────────────────────────────────────────────────

export function diffRegulation(
  db: Db,
  params: { regulation_id: string; from_version?: string; to_version?: string },
): ToolResponse<RegulationDiff | PremiumDisabledMessage> {
  if (!isPremiumEnabled()) {
    return {
      results: { message: PREMIUM_DISABLED_MESSAGE },
      _metadata: generateResponseMetadata(),
    };
  }

  if (!hasVersionTable(db)) {
    return {
      results: { regulation_id: params.regulation_id, versions: [] },
      _metadata: generateResponseMetadata(),
    };
  }

  let sql = 'SELECT version_label, effective_date, change_summary, diff_from_previous FROM regulation_versions WHERE regulation_id = ?';
  const sqlParams: unknown[] = [params.regulation_id];

  if (params.from_version) {
    sql += ' AND version_label >= ?';
    sqlParams.push(params.from_version);
  }
  if (params.to_version) {
    sql += ' AND version_label <= ?';
    sqlParams.push(params.to_version);
  }

  sql += ' ORDER BY version_label ASC';

  const rows = db.prepare(sql).all(...sqlParams) as Array<{
    version_label: string;
    effective_date: string | null;
    change_summary: string | null;
    diff_from_previous: string | null;
  }>;

  return {
    results: {
      regulation_id: params.regulation_id,
      versions: rows,
    },
    _metadata: generateResponseMetadata(),
  };
}

// ─── getRecentChanges ──────────────────────────────────────────────

export function getRecentChanges(
  db: Db,
  params: { days?: number },
): ToolResponse<RegulationVersion[] | PremiumDisabledMessage> {
  if (!isPremiumEnabled()) {
    return {
      results: { message: PREMIUM_DISABLED_MESSAGE },
      _metadata: generateResponseMetadata(),
    };
  }

  if (!hasVersionTable(db)) {
    return {
      results: [],
      _metadata: generateResponseMetadata(),
    };
  }

  const days = params.days ?? 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const rows = db
    .prepare(
      'SELECT * FROM regulation_versions WHERE scraped_at >= ? ORDER BY scraped_at DESC',
    )
    .all(cutoffIso) as RegulationVersion[];

  return {
    results: rows,
    _metadata: generateResponseMetadata(),
  };
}
