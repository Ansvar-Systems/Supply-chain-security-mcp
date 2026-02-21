import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Db } from '../constants.js';

import { getSbomStandard } from './get-sbom-standard.js';
import { searchSbomFields } from './search-sbom-fields.js';
import { compareSbomFormats } from './compare-sbom-formats.js';
import { getSlsaLevel } from './get-slsa-level.js';
import { searchSlsaRequirements } from './search-slsa-requirements.js';
import { assessSlsaPosture } from './assess-slsa-posture.js';
import { getSupplyChainRegulation } from './get-supply-chain-regulation.js';
import { checkCraCompliance } from './check-cra-compliance.js';
import { mapEo14028 } from './map-eo14028.js';
import { getSupplyChainAttack } from './get-supply-chain-attack.js';
import { searchAttackPatterns } from './search-attack-patterns.js';
import { assessCompositionRisk } from './assess-composition-risk.js';
import { getSigningPattern } from './get-signing-pattern.js';
import { searchVerificationMethods } from './search-verification-methods.js';
import { getRegulationHistory, diffRegulation, getRecentChanges } from './version-tracking.js';
import { about } from './about.js';
import { listSources } from './list-sources.js';

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export function registerTools(server: Server, db: Db): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const premiumEnabled = process.env.PREMIUM_ENABLED === 'true';

    const tools: ToolDefinition[] = [
      // ── SBOM Standards (3) ──────────────────────────────────────────
      {
        name: 'get_sbom_standard',
        description: 'Retrieve a specific SBOM standard field definition by ID. Use when you know the exact standard ID to get full details: format (SPDX or CycloneDX), field type, validation rules, examples, and equivalent fields in the other format. Essential for understanding what data elements an SBOM must contain.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            standard_id: { type: 'string', description: 'SBOM standard field ID (e.g., SPDX-2.3-001, CDX-1.5-001)' },
          },
          required: ['standard_id'],
        },
      },
      {
        name: 'search_sbom_fields',
        description: 'Full-text search across SBOM standard fields from SPDX and CycloneDX specifications. Use when you need to find which SBOM fields relate to a topic (e.g., "license", "hash", "supplier", "vulnerability"). Supports filtering by format. Returns matching field definitions with type, required status, and category.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Search text (e.g., "license", "hash", "supplier", "package URL")' },
            format: { type: 'string', enum: ['SPDX', 'CycloneDX'], description: 'Filter by SBOM format' },
          },
          required: ['query'],
        },
      },
      {
        name: 'compare_sbom_formats',
        description: 'Side-by-side comparison of SPDX and CycloneDX fields within a specific category. Use when you need to understand the differences between the two SBOM formats for a field category (e.g., "Package Information", "Licensing", "Relationships"). Returns fields from both formats grouped by category.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            category: { type: 'string', description: 'Field category to compare (e.g., "Package Information", "Licensing", "Relationships", "Document Creation")' },
          },
          required: ['category'],
        },
      },

      // ── SLSA Framework (3) ──────────────────────────────────────────
      {
        name: 'get_slsa_level',
        description: 'Retrieve a specific SLSA framework requirement by its requirement ID. Use when you know the exact requirement ID to get full details: level, description, evidence types, verification criteria, build system guidance, and framework cross-mappings. Essential for understanding what a specific SLSA requirement demands.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            requirement_id: { type: 'string', description: 'SLSA requirement ID (e.g., SLSA-L1-SOURCE-001, SLSA-L3-BUILD-002)' },
          },
          required: ['requirement_id'],
        },
      },
      {
        name: 'search_slsa_requirements',
        description: 'Full-text search across SLSA framework requirements (Levels 1-4). Use when you need to find requirements about a topic (e.g., "provenance", "build integrity", "source verification"). Supports filtering by SLSA level. Returns matching requirements with level, title, and category.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Search text (e.g., "provenance", "build integrity", "hermetic", "reproducible")' },
            level: { type: 'number', enum: [1, 2, 3, 4], description: 'Filter by SLSA level (1-4)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'assess_slsa_posture',
        description: 'Get a complete overview of SLSA requirements grouped by level, with counts. Use to understand what each SLSA level requires, compare levels, or assess readiness for a target level. Optionally filter to a single level for focused analysis.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            level: { type: 'number', enum: [1, 2, 3, 4], description: 'Optional: filter to a specific SLSA level (1-4). Omit for all levels.' },
          },
        },
      },

      // ── Regulations (3) ─────────────────────────────────────────────
      {
        name: 'get_supply_chain_regulation',
        description: 'Retrieve a specific supply chain regulation article or section by ID. Covers EU Cyber Resilience Act, US Executive Order 14028, and NIST SSDF (SP 800-218). Returns full details: requirements list, applicability scope, effective date, enforcement provisions, and framework cross-mappings.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            regulation_id: { type: 'string', description: 'Regulation entry ID (e.g., CRA-ART-5, EO14028-SEC-4, SSDF-PO.1)' },
          },
          required: ['regulation_id'],
        },
      },
      {
        name: 'check_cra_compliance',
        description: 'EU Cyber Resilience Act compliance check: lists all CRA articles with their requirements, and highlights essential cybersecurity requirements (Annex I). Use to understand CRA obligations for products with digital elements. Optionally filter to a specific article.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            article: { type: 'string', description: 'Optional: specific CRA article or section to check (e.g., "Article 10", "Annex I")' },
          },
        },
      },
      {
        name: 'map_eo14028',
        description: 'Map US Executive Order 14028 sections with optional NIST SSDF crosswalk. Use to understand EO 14028 software supply chain security mandates and how NIST SSDF practices map to each EO section. Set include_ssdf=true for the crosswalk.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            section: { type: 'string', description: 'Optional: specific EO section to map (e.g., "Section 4")' },
            include_ssdf: { type: 'boolean', description: 'Include NIST SSDF crosswalk mapping for each EO section (default: false)' },
          },
        },
      },

      // ── Threat Intelligence (3) ─────────────────────────────────────
      {
        name: 'get_supply_chain_attack',
        description: 'Retrieve a specific supply chain attack pattern by ID. Returns full details: attack vector, MITRE ATT&CK and CAPEC mappings, case study, affected ecosystem, impact assessment, detection methods, and mitigations. Use when you know the exact attack ID.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            attack_id: { type: 'string', description: 'Supply chain attack pattern ID (e.g., SCA-DEP-001, SCA-BUILD-002)' },
          },
          required: ['attack_id'],
        },
      },
      {
        name: 'search_attack_patterns',
        description: 'Full-text search across supply chain attack patterns with MITRE ATT&CK mapping. Use to find attacks about a topic (e.g., "dependency confusion", "typosquatting", "build compromise"). Supports filtering by ecosystem (npm, PyPI, Maven, etc.).',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Search text (e.g., "dependency confusion", "typosquatting", "malicious package", "CI/CD")' },
            ecosystem: { type: 'string', description: 'Filter by package ecosystem (e.g., "npm", "PyPI", "Maven", "RubyGems", "Go")' },
          },
          required: ['query'],
        },
      },
      {
        name: 'assess_composition_risk',
        description: 'Software composition risk assessment grouped by risk type (dependency confusion, typosquatting, maintainer compromise, malicious package, abandoned dependency). Returns risks with attack mechanisms, detection methods, prevention measures, real-world examples, and severity. Use to understand and prioritize supply chain composition risks.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            risk_type: { type: 'string', enum: ['dependency_confusion', 'typosquatting', 'maintainer_compromise', 'malicious_package', 'abandoned_dependency', 'other'], description: 'Filter by risk type' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: 'Filter by severity' },
          },
        },
      },

      // ── Signing & Attestation (2) ───────────────────────────────────
      {
        name: 'get_signing_pattern',
        description: 'Retrieve a specific artifact signing or verification pattern by ID. Returns full details: tool name, use case, specification URL, key management approach, verification steps, integration patterns, and ecosystem. Covers Sigstore, GPG, TUF, in-toto, Notary v2, and more.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            pattern_id: { type: 'string', description: 'Signing pattern ID (e.g., SIGN-SIGSTORE-001, SIGN-GPG-001, SIGN-TUF-001)' },
          },
          required: ['pattern_id'],
        },
      },
      {
        name: 'search_verification_methods',
        description: 'Full-text search across artifact signing and verification methods. Use to find signing tools and patterns for a topic (e.g., "container signing", "npm provenance", "keyless"). Supports filtering by ecosystem.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Search text (e.g., "container signing", "keyless", "provenance attestation", "npm")' },
            ecosystem: { type: 'string', description: 'Filter by ecosystem (e.g., "npm", "OCI", "Python", "Go")' },
          },
          required: ['query'],
        },
      },

      // ── Meta (2) ────────────────────────────────────────────────────
      {
        name: 'about',
        description: 'Information about this MCP server: version, capabilities, data source counts, domain description. Use to understand what data is available and how current it is.',
        inputSchema: { type: 'object' as const, properties: {} },
      },
      {
        name: 'list_sources',
        description: 'List all data sources with URLs, licences, and update frequencies. Use to understand data provenance and freshness.',
        inputSchema: { type: 'object' as const, properties: {} },
      },
    ];

    // ── Premium Version Tracking (3) ────────────────────────────────
    if (premiumEnabled) {
      tools.push(
        {
          name: 'get_regulation_history',
          description: 'Retrieve the full version history of a supply chain regulation. Shows all tracked versions with effective dates, change summaries, and diffs. Use to understand how a regulation has evolved over time. Premium feature — requires PREMIUM_ENABLED=true.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              regulation_id: { type: 'string', description: 'Regulation entry ID to get history for (e.g., CRA-ART-5, EO14028-SEC-4)' },
            },
            required: ['regulation_id'],
          },
        },
        {
          name: 'diff_regulation',
          description: 'Compare versions of a supply chain regulation to see what changed between releases. Optionally specify from/to version labels to narrow the range. Use to understand specific changes between regulation versions. Premium feature — requires PREMIUM_ENABLED=true.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              regulation_id: { type: 'string', description: 'Regulation entry ID to diff (e.g., CRA-ART-5, EO14028-SEC-4)' },
              from_version: { type: 'string', description: 'Optional: start version label (inclusive)' },
              to_version: { type: 'string', description: 'Optional: end version label (inclusive)' },
            },
            required: ['regulation_id'],
          },
        },
        {
          name: 'get_recent_changes',
          description: 'List supply chain regulation changes within a recent time window. Defaults to 30 days. Use to stay current on regulatory updates affecting software supply chain requirements. Premium feature — requires PREMIUM_ENABLED=true.',
          inputSchema: {
            type: 'object' as const,
            properties: {
              days: { type: 'number', description: 'Number of days to look back (default: 30)' },
            },
          },
        },
      );
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      let response;
      switch (name) {
        // SBOM Standards
        case 'get_sbom_standard':
          response = getSbomStandard(db, args as { standard_id: string });
          break;
        case 'search_sbom_fields':
          response = searchSbomFields(db, args as { query: string; format?: string });
          break;
        case 'compare_sbom_formats':
          response = compareSbomFormats(db, args as { category: string });
          break;

        // SLSA Framework
        case 'get_slsa_level':
          response = getSlsaLevel(db, args as { requirement_id: string });
          break;
        case 'search_slsa_requirements':
          response = searchSlsaRequirements(db, args as { query: string; level?: number });
          break;
        case 'assess_slsa_posture':
          response = assessSlsaPosture(db, args as { level?: number });
          break;

        // Regulations
        case 'get_supply_chain_regulation':
          response = getSupplyChainRegulation(db, args as { regulation_id: string });
          break;
        case 'check_cra_compliance':
          response = checkCraCompliance(db, args as { article?: string });
          break;
        case 'map_eo14028':
          response = mapEo14028(db, args as { section?: string; include_ssdf?: boolean });
          break;

        // Threat Intelligence
        case 'get_supply_chain_attack':
          response = getSupplyChainAttack(db, args as { attack_id: string });
          break;
        case 'search_attack_patterns':
          response = searchAttackPatterns(db, args as { query: string; ecosystem?: string });
          break;
        case 'assess_composition_risk':
          response = assessCompositionRisk(db, args as { risk_type?: string; severity?: string });
          break;

        // Signing & Attestation
        case 'get_signing_pattern':
          response = getSigningPattern(db, args as { pattern_id: string });
          break;
        case 'search_verification_methods':
          response = searchVerificationMethods(db, args as { query: string; ecosystem?: string });
          break;

        // Premium Version Tracking
        case 'get_regulation_history':
          response = getRegulationHistory(db, args as { regulation_id: string });
          break;
        case 'diff_regulation':
          response = diffRegulation(db, args as { regulation_id: string; from_version?: string; to_version?: string });
          break;
        case 'get_recent_changes':
          response = getRecentChanges(db, args as { days?: number });
          break;

        // Meta
        case 'about':
          response = about(db);
          break;
        case 'list_sources':
          response = listSources();
          break;

        default:
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
            isError: true,
          };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });
}
