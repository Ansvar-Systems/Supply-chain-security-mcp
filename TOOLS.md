# Supply Chain Security MCP — Tool Reference

19 tools total: 16 base + 3 premium (requires `PREMIUM_ENABLED=true`).

## SBOM Standards (3 tools)

### `get_sbom_standard`
Retrieve a specific SBOM standard field by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Field identifier (e.g., `spdx-2.3-document-creation`) |

**Returns:** Field definition including format (SPDX 2.3 or CycloneDX 1.5), category, description, required status, and data type.

**Use case:** Look up what a specific SBOM field means and whether it is mandatory.

### `search_sbom_fields`
Full-text search across SBOM standard fields, with optional format filter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search terms |
| `format` | string | no | Filter: `spdx` or `cyclonedx` |

**Returns:** Array of matching fields with relevance ranking.

**Use case:** Find all SBOM fields related to "license" or "supplier" across both formats.

### `compare_sbom_formats`
Side-by-side comparison of SPDX 2.3 and CycloneDX 1.5 fields within a category.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | yes | Field category to compare |

**Returns:** Paired fields showing SPDX and CycloneDX equivalents.

**Use case:** Understand how SPDX document-level fields map to CycloneDX equivalents.

## SLSA Framework (3 tools)

### `get_slsa_level`
Retrieve a specific SLSA build security requirement by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Requirement identifier |

**Returns:** Requirement definition including SLSA level (L1–L4), description, and verification criteria.

**Use case:** Check what a specific SLSA requirement entails before implementation.

### `search_slsa_requirements`
Full-text search across SLSA requirements, with optional level filter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search terms |
| `level` | integer | no | Filter by SLSA level (1–4) |

**Returns:** Array of matching requirements with relevance ranking.

**Use case:** Find all SLSA requirements that mention "provenance" or "hermetic builds."

### `assess_slsa_posture`
Overview of all SLSA requirements grouped by level.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

**Returns:** Summary of requirements per SLSA level with counts and descriptions.

**Use case:** Plan a SLSA adoption roadmap by understanding the gap between levels.

## Regulations (3 tools)

### `get_supply_chain_regulation`
Retrieve a specific regulation article or section.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Article/section identifier |

**Returns:** Full text of the regulation section (CRA, EO 14028, or NIST SSDF).

**Use case:** Read a specific EU CRA article or EO 14028 section.

### `check_cra_compliance`
EU Cyber Resilience Act compliance check against all articles.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

**Returns:** All CRA articles with compliance requirements and obligations.

**Use case:** Assess what the EU CRA requires for a software product entering the EU market.

### `map_eo14028`
Map US Executive Order 14028 sections with NIST SSDF (SP 800-218) crosswalk.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

**Returns:** EO 14028 sections mapped to corresponding NIST SSDF practices.

**Use case:** Understand how EO 14028 requirements translate to NIST SSDF implementation tasks.

## Threat Intelligence (3 tools)

### `get_supply_chain_attack`
Retrieve a supply chain attack pattern by ID, with MITRE ATT&CK mapping.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Attack pattern identifier |

**Returns:** Attack description, affected ecosystems, MITRE ATT&CK technique IDs, and mitigations.

**Use case:** Study a specific attack pattern (e.g., dependency confusion) and its known mitigations.

### `search_attack_patterns`
Full-text search across supply chain attack patterns, with optional ecosystem filter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search terms |
| `ecosystem` | string | no | Filter by ecosystem (e.g., `npm`, `pypi`) |

**Returns:** Array of matching attack patterns with relevance ranking.

**Use case:** Find all known attack patterns targeting the npm ecosystem.

### `assess_composition_risk`
Risk assessment for a specific supply chain risk type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | yes | Risk type (e.g., `dependency-confusion`, `typosquatting`) |

**Returns:** Risk description, likelihood, impact, affected ecosystems, and recommended controls.

**Use case:** Evaluate the risk of dependency confusion attacks for a project.

## Signing & Attestation (2 tools)

### `get_signing_pattern`
Retrieve a specific code signing or verification pattern.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Pattern identifier |

**Returns:** Pattern description covering tools (Sigstore, GPG, TUF, in-toto, Notary v2), workflows, and verification steps.

**Use case:** Look up how Sigstore keyless signing works and when to use it.

### `search_verification_methods`
Full-text search across signing and verification methods, with optional ecosystem filter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search terms |
| `ecosystem` | string | no | Filter by ecosystem |

**Returns:** Array of matching methods with relevance ranking.

**Use case:** Find all verification methods applicable to container images.

## Meta (2 tools)

### `about`
Server information and capabilities summary.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

**Returns:** Server name, version, tool count, data sources, and premium status.

### `list_sources`
Data source provenance information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

**Returns:** List of all data sources with names, versions, URLs, and last-updated dates.

## Premium Version Tracking (3 tools)

Requires `PREMIUM_ENABLED=true`. These tools track changes to supply chain regulations over time.

### `get_regulation_history`
Version history of a specific regulation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Regulation identifier |

**Returns:** Chronological list of versions with dates and change summaries.

**Use case:** Track how a CRA article changed between draft and final text.

### `diff_regulation`
Compare two versions of a regulation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Regulation identifier |
| `from_version` | string | yes | Earlier version |
| `to_version` | string | yes | Later version |

**Returns:** Diff showing added, removed, and changed text between versions.

**Use case:** See exactly what changed in a CRA article between two published versions.

### `get_recent_changes`
Recent regulatory changes within a time window.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | integer | no | Lookback window in days (default: 30) |

**Returns:** List of regulations that changed within the specified period.

**Use case:** Monitor for new supply chain regulation updates in the past month.
