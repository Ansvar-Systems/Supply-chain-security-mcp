import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface SigningPattern {
  id: string;
  tool_name: string;
  description: string;
  use_case: string;
  specification_url: string | null;
  key_management: string | null;
  verification_steps: string[];
  integration_patterns: string[];
  ecosystem: string | null;
  keywords: string | null;
  last_updated: string | null;
}

interface SigningPatternRow {
  id: string;
  tool_name: string;
  description: string;
  use_case: string;
  specification_url: string | null;
  key_management: string | null;
  verification_steps: string;
  integration_patterns: string;
  ecosystem: string | null;
  keywords: string | null;
  last_updated: string | null;
}

function parseRow(row: SigningPatternRow): SigningPattern {
  return {
    ...row,
    verification_steps: JSON.parse(row.verification_steps || '[]'),
    integration_patterns: JSON.parse(row.integration_patterns || '[]'),
  };
}

export function getSigningPattern(
  db: Db,
  params: { pattern_id: string },
): ToolResponse<SigningPattern | null> {
  const row = db
    .prepare('SELECT * FROM signing_verification WHERE id = ?')
    .get(params.pattern_id) as SigningPatternRow | undefined;

  return {
    results: row ? parseRow(row) : null,
    _metadata: generateResponseMetadata(),
  };
}
