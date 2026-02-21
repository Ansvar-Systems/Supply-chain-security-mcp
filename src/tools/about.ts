import type { Db } from '../constants.js';
import type { ToolResponse } from '../utils/metadata.js';
import { generateResponseMetadata } from '../utils/metadata.js';
import { SERVER_NAME, SERVER_VERSION } from '../constants.js';

interface AboutInfo {
  server: string;
  version: string;
  domain: string;
  description: string;
  table_counts: Record<string, number>;
  capabilities: string[];
  built_at: string | null;
}

export function about(db: Db): ToolResponse<AboutInfo> {
  const builtAt = (db.prepare("SELECT value FROM db_metadata WHERE key = 'built_at'").get() as { value: string } | undefined)?.value ?? null;

  const tables = ['sbom_standards', 'slsa_requirements', 'supply_chain_regulations', 'supply_chain_attacks', 'signing_verification', 'composition_risks', 'regulation_versions'];
  const tableCounts: Record<string, number> = {};
  const capabilities: string[] = [];

  for (const table of tables) {
    try {
      const count = (db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number }).cnt;
      tableCounts[table] = count;
      if (count > 0) capabilities.push(table);
    } catch {
      tableCounts[table] = 0;
    }
  }

  return {
    results: {
      server: SERVER_NAME,
      version: SERVER_VERSION,
      domain: 'supply-chain-security',
      description: 'Software supply chain risk intelligence: SBOM standards (SPDX, CycloneDX), SLSA framework levels and requirements, EU Cyber Resilience Act, US EO 14028, NIST SSDF, supply chain attack patterns with MITRE ATT&CK mapping, artifact signing and verification patterns, and software composition risk assessment.',
      table_counts: tableCounts,
      capabilities,
      built_at: builtAt,
    },
    _metadata: generateResponseMetadata(builtAt ?? undefined),
  };
}
