import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import type { SbomFieldSummary } from './search-sbom-fields.js';

export interface SbomFormatComparison {
  spdx: SbomFieldSummary[];
  cyclonedx: SbomFieldSummary[];
  category: string;
}

export function compareSbomFormats(
  db: Db,
  params: { category: string },
): ToolResponse<SbomFormatComparison> {
  const sql =
    'SELECT id, format, format_version, field_name, field_type, required, description, category FROM sbom_standards WHERE category = ? AND format = ?';

  const spdx = db.prepare(sql).all(params.category, 'SPDX') as SbomFieldSummary[];
  const cyclonedx = db.prepare(sql).all(params.category, 'CycloneDX') as SbomFieldSummary[];

  return {
    results: {
      spdx,
      cyclonedx,
      category: params.category,
    },
    _metadata: generateResponseMetadata(),
  };
}
