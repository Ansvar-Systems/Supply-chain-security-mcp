import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface SbomStandard {
  id: string;
  format: string;
  format_version: string;
  field_name: string;
  field_type: string;
  required: number;
  description: string;
  validation_rules: string | null;
  examples: string | null;
  equivalent_field: string | null;
  category: string | null;
  keywords: string | null;
  last_updated: string | null;
}

export function getSbomStandard(
  db: Db,
  params: { standard_id: string },
): ToolResponse<SbomStandard | null> {
  const row = db
    .prepare('SELECT * FROM sbom_standards WHERE id = ?')
    .get(params.standard_id) as SbomStandard | undefined;

  return {
    results: row ?? null,
    _metadata: generateResponseMetadata(),
  };
}
