# Supply Chain Security MCP Server -- Developer Guide

## Git Workflow
- Never commit directly to main. Always create a feature branch and open a PR.
- Conventional commit prefixes: feat:, fix:, chore:, docs:

## What This MCP Does
Software supply chain risk intelligence server. Answers questions about SBOM standards (SPDX 2.3/3.0, CycloneDX 1.5/1.6), SLSA framework levels 1-4, supply chain regulations (EU Cyber Resilience Act, US Executive Order 14028, NIST SSDF SP 800-218), MITRE ATT&CK supply chain attack techniques, artifact signing and verification patterns (Sigstore, in-toto, Notary v2, GPG, TUF), and software composition risk assessment. Does NOT scan actual supply chains, parse real SBOM files, access package registries, or evaluate build pipelines.

## What's in the Database
- **50 SBOM standard fields** across SPDX (25) and CycloneDX (25) with validation rules, examples, and cross-format mapping
- **40 SLSA requirements** covering Levels 1-4 with evidence types, verification criteria, and framework cross-mappings
- **70 supply chain regulations** from EU CRA (35), US EO 14028 (15), and NIST SSDF (20) with requirements, scope, and enforcement
- **40 supply chain attack patterns** with MITRE ATT&CK/CAPEC mappings, case studies, detection, and mitigations
- **27 signing/verification patterns** covering Sigstore, GPG, TUF, in-toto, Notary v2 with integration guidance
- **27 composition risks** covering dependency confusion, typosquatting, maintainer compromise, malicious packages, abandoned dependencies
- **0 regulation versions** (premium version tracking, data backfill pending)

## Architecture
- **Transport:** stdio only (npm package)
- **Database:** SQLite + FTS5 via @ansvar/mcp-sqlite (WASM-compatible, no WAL mode)
- **Entry point:** src/index.ts (stdio)
- **Tool registry:** src/tools/registry.ts -- 19 tools (16 standard + 3 premium), all registered for stdio transport
- **Capability gating:** src/capabilities.ts -- detects available DB tables at runtime (sbom_standards, slsa_requirements, supply_chain_regulations, supply_chain_attacks, signing_verification, composition_risks, regulation_versions)

## Database Schema (6 tables + 6 FTS5 indexes + db_metadata + regulation_versions)
1. `sbom_standards` -- 50 rows, FTS5 index on (id, field_name, description, format, category, keywords)
2. `slsa_requirements` -- 40 rows, FTS5 index on (id, title, description, category, keywords)
3. `supply_chain_regulations` -- 70 rows, FTS5 index on (id, title, description, regulation, keywords)
4. `supply_chain_attacks` -- 40 rows, FTS5 index on (id, attack_name, description, ecosystem, keywords)
5. `signing_verification` -- 27 rows, FTS5 index on (id, tool_name, description, ecosystem, keywords)
6. `composition_risks` -- 27 rows, FTS5 index on (id, risk_name, description, risk_type, keywords)
7. `regulation_versions` -- 0 rows (premium version tracking, backfill pending)
8. `db_metadata` -- 7 rows, build provenance (tier, schema_version, built_at, builder, domain)

## 19 Tools (actual names)

### SBOM Standards (3)
- `get_sbom_standard` -- lookup by ID (e.g., `SPDX-2.3-001`, `CDX-1.5-001`)
- `search_sbom_fields` -- FTS5 + filters (format: SPDX/CycloneDX)
- `compare_sbom_formats` -- side-by-side SPDX vs CycloneDX fields by category

### SLSA Framework (3)
- `get_slsa_level` -- lookup by requirement ID (e.g., `SLSA-L1-SOURCE-001`, `SLSA-L3-BUILD-002`)
- `search_slsa_requirements` -- FTS5 + filters (level: 1-4)
- `assess_slsa_posture` -- requirements overview grouped by level with counts

### Regulations (3)
- `get_supply_chain_regulation` -- lookup by ID (e.g., `CRA-ART-5`, `EO14028-SEC-4`, `SSDF-PO.1`)
- `check_cra_compliance` -- EU CRA compliance check with Annex I requirements
- `map_eo14028` -- EO 14028 mapping with optional NIST SSDF crosswalk

### Threat Intelligence (3)
- `get_supply_chain_attack` -- lookup by ID with ATT&CK/CAPEC mapping, case study, mitigations
- `search_attack_patterns` -- FTS5 + filters (ecosystem: npm, PyPI, Maven, etc.)
- `assess_composition_risk` -- composition risk assessment grouped by risk type with severity

### Signing & Attestation (2)
- `get_signing_pattern` -- lookup by ID (e.g., `SIGN-SIGSTORE-001`, `SIGN-GPG-001`)
- `search_verification_methods` -- FTS5 + filters (ecosystem)

### Premium Version Tracking (3, gated by PREMIUM_ENABLED=true)
- `get_regulation_history` -- full version history of a regulation
- `diff_regulation` -- compare regulation versions with optional from/to range
- `get_recent_changes` -- regulation changes within N days (default 30)

### Utility (2)
- `about` -- server info with live row counts
- `list_sources` -- 7 data sources with URLs and licences

## Key Conventions
- All database queries use parameterized statements (never string interpolation)
- FTS5 queries go through buildFtsQueryVariants() with primary + fallback strategy
- User input is sanitized via sanitizeFtsInput() before FTS5 queries
- Every tool returns ToolResponse<T> with results + _metadata (freshness, disclaimer)
- Tool descriptions are written for LLM agents -- explain WHEN and WHY to use each tool
- JSON columns (requirements, framework_mappings, affected_resources, mitigations, etc.) are stored as JSON strings and parsed at query time

## Testing
- **Unit tests:** tests/ (vitest, in-memory SQLite fixtures)
  - tests/build-db.test.ts -- database build pipeline
  - tests/tools/ -- tool handler tests (sbom, slsa, regulation, signing, threat, version-tracking)
  - tests/utils/ -- fts-query, metadata utilities
- **Contract tests:** __tests__/contract/ (scaffolded, not yet populated)
- **Commands:** `npm test` (unit), `npm run test:contract` (contract), `npm run validate` (lint + both)
- Tests build a fresh in-memory database per suite using the same build-db.ts schema + seed data

## Data Pipeline
1. Seed JSON files in data/seed/ (10 files, manually curated + AI-assisted)
2. `scripts/build-db.ts` reads seed JSON -> builds SQLite database at data/database.db
3. Drift detection (`npm run drift:detect`) compares upstream content hashes against last known state
4. Drift detection runs weekly via GitHub Actions, opens issue on change

## Seed Data Files (10 files in data/seed/)
- `sbom-spdx.json` (SPDX 2.3/3.0 field definitions, 25 fields)
- `sbom-cyclonedx.json` (CycloneDX 1.5/1.6 field definitions, 25 fields)
- `slsa-requirements.json` (SLSA Levels 1-4 requirements, 40 requirements)
- `regulations-eu-cra.json` (EU Cyber Resilience Act articles, 35 entries)
- `regulations-eo14028.json` (US Executive Order 14028 sections, 15 entries)
- `regulations-nist-ssdf.json` (NIST SSDF SP 800-218 practices, 20 entries)
- `attacks-supply-chain.json` (MITRE ATT&CK supply chain attack patterns, 40 entries)
- `signing-verification.json` (artifact signing/verification patterns, 27 entries)
- `composition-risks.json` (software composition risks, 27 entries)
- `.gitkeep` (directory placeholder)

## Deployment
- **npm package:** @ansvar/supply-chain-security-mcp with bin entry for stdio
- **No Vercel/HTTP endpoint** -- stdio transport only
- **Database:** Pre-built at data/database.db, bundled in npm package
- **Journal mode:** DELETE (not WAL -- required for read-only usage)
- **Environment variable:** SUPPLY_CHAIN_SECURITY_DB_PATH overrides default database location
- **Premium tools:** gated by PREMIUM_ENABLED=true env var (version tracking tools only appear when enabled)
