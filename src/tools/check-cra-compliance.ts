import type { Db } from '../constants.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface RegulationSummary {
  id: string;
  regulation: string;
  article_or_section: string;
  title: string;
  description: string;
  keywords: string | null;
}

export interface CraComplianceSummary {
  total_articles: number;
  articles: RegulationSummary[];
  essential_requirements: RegulationSummary[];
}

const SUMMARY_COLUMNS =
  'id, regulation, article_or_section, title, description, keywords';

export function checkCraCompliance(
  db: Db,
  params: { article?: string },
): ToolResponse<CraComplianceSummary> {
  // Query all EU_CRA entries, optionally filtered by article
  const sql = params.article
    ? `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_regulations WHERE regulation = 'EU_CRA' AND article_or_section = ? ORDER BY id`
    : `SELECT ${SUMMARY_COLUMNS} FROM supply_chain_regulations WHERE regulation = 'EU_CRA' ORDER BY id`;

  const articles = params.article
    ? (db.prepare(sql).all(params.article) as RegulationSummary[])
    : (db.prepare(sql).all() as RegulationSummary[]);

  // Filter essential requirements: keywords containing "essential" or article_or_section containing "Annex I"
  const essential_requirements = articles.filter(
    (r) =>
      (r.keywords && r.keywords.toLowerCase().includes('essential')) ||
      r.article_or_section.includes('Annex I'),
  );

  return {
    results: {
      total_articles: articles.length,
      articles,
      essential_requirements,
    },
    _metadata: generateResponseMetadata(),
  };
}
