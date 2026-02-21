import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import type { RegulationSummary } from './check-cra-compliance.js';

export interface SsdfCrosswalkEntry {
  eo_section: string;
  related_ssdf: RegulationSummary[];
}

export interface Eo14028Mapping {
  eo_sections: RegulationSummary[];
  ssdf_crosswalk?: SsdfCrosswalkEntry[];
  total_sections: number;
}

const SUMMARY_COLUMNS =
  'id, regulation, article_or_section, title, description, keywords';

export function mapEo14028(
  db: Db,
  params: { section?: string; include_ssdf?: boolean },
): ToolResponse<Eo14028Mapping> {
  // Query all EO_14028 entries, optionally filtered by section
  const eoSql = params.section
    ? `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_regulations WHERE regulation = 'EO_14028' AND article_or_section = ? ORDER BY id`
    : `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_regulations WHERE regulation = 'EO_14028' ORDER BY id`;

  const eo_sections = params.section
    ? (db.prepare(eoSql).all(params.section) as RegulationSummary[])
    : (db.prepare(eoSql).all() as RegulationSummary[]);

  let ssdf_crosswalk: SsdfCrosswalkEntry[] | undefined;

  if (params.include_ssdf) {
    // Get all NIST_SSDF entries
    const ssdfSql = `SELECT ${SUMMARY_COLUMNS}, framework_mappings FROM supply_chain_regulations WHERE regulation = 'NIST_SSDF' ORDER BY id`;

    interface SsdfRow extends RegulationSummary {
      framework_mappings: string;
    }

    const ssdfRows = db.prepare(ssdfSql).all() as SsdfRow[];

    // Build crosswalk: for each EO section, find SSDF entries whose framework_mappings
    // reference EO_14028 and match the section
    ssdf_crosswalk = eo_sections.map((eo) => {
      const related_ssdf = ssdfRows
        .filter((ssdf) => {
          try {
            const mappings = JSON.parse(ssdf.framework_mappings || '{}');
            // Check if the SSDF entry references EO_14028 at all
            const eoRef = mappings['EO_14028'] as string | undefined;
            if (!eoRef) return false;
            // Check if the reference matches this EO section
            return eoRef.includes(eo.article_or_section) ||
              eo.article_or_section.includes('Section 4');
          } catch {
            return false;
          }
        })
        .map(({ framework_mappings: _fm, ...rest }) => rest as RegulationSummary);

      return {
        eo_section: eo.article_or_section,
        related_ssdf,
      };
    });
  }

  return {
    results: {
      eo_sections,
      ...(ssdf_crosswalk !== undefined ? { ssdf_crosswalk } : {}),
      total_sections: eo_sections.length,
    },
    _metadata: generateResponseMetadata(),
  };
}
