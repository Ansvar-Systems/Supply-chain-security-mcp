# @ansvar/supply-chain-security-mcp

<!-- ANSVAR-CTA-BEGIN -->
> ### ▶ Try this MCP instantly via Ansvar Gateway
> **50 free queries/day · no card required · OAuth signup at [ansvar.eu/gateway](https://ansvar.eu/gateway)**
>
> One endpoint, one OAuth signup, access from any MCP-compatible client.

### Connect

**Claude Code** (one line):

```bash
claude mcp add ansvar --transport http https://gateway.ansvar.eu/mcp
```

**Claude Desktop / Cursor** — add to `claude_desktop_config.json` (or `mcp.json`):

```json
{
  "mcpServers": {
    "ansvar": {
      "type": "url",
      "url": "https://gateway.ansvar.eu/mcp"
    }
  }
}
```

**Claude.ai** — Settings → Connectors → Add custom connector → paste `https://gateway.ansvar.eu/mcp`

First request opens an OAuth flow at [ansvar.eu/gateway](https://ansvar.eu/gateway). After signup, your client is bound to your account; tier (free / premium / team / company) determines fan-out, quota, and which downstream MCPs are reachable.

---

## Self-host this MCP

You can also clone this repo and build the corpus yourself. The schema,
fetcher, and tool implementations all live here. What is not in the repo is
the pre-built database — TDM and standards-licensing constraints on the
upstream sources mean we host the corpus on Ansvar infrastructure rather
than redistribute it as a public artifact.

Build your own: run this repo's ingestion script (entry-point varies per
repo — typically `scripts/ingest.sh`, `npm run ingest`, or `make ingest`;
check the repo root).
<!-- ANSVAR-CTA-END -->


Software supply chain risk intelligence MCP server. Provides structured reference data about SBOM standards (SPDX 2.3/3.0, CycloneDX 1.5/1.6), SLSA framework levels 1-4, supply chain regulations (EU Cyber Resilience Act, US EO 14028, NIST SSDF SP 800-218), MITRE ATT&CK supply chain attack techniques, artifact signing patterns (Sigstore, in-toto, Notary v2, GPG, TUF), and software composition risk assessment.

Built for the [Ansvar](https://ansvar.eu) threat modeling platform. Uses the [Model Context Protocol](https://modelcontextprotocol.io/) to give AI agents queryable access to supply chain security knowledge.

**This is a reference data server.** It does not scan actual software supply chains, access package registries, or evaluate real SBOM files. It answers questions like "What fields must an SPDX SBOM contain?", "What does SLSA Level 3 require?", "How does the EU CRA affect my product?", and "What supply chain attack patterns target npm?".

## Installation

Run directly with npx (stdio transport):

Or install as a dependency:

### Claude Desktop / Claude Code

### Cursor

---

### Public Endpoint (Streamable HTTP)

Connect from any MCP client (Claude Desktop, ChatGPT, Cursor, VS Code, GitHub Copilot):

**Claude Code:**

**Claude Desktop / Cursor** (`claude_desktop_config.json`):

No authentication required. See [all Ansvar MCP endpoints](https://github.com/Ansvar-Systems/Ansvar-Architecture-Documentation/blob/main/docs/mcp-remote-access.md).
## What's in this MCP

### 50 SBOM Standard Fields

Field definitions from SPDX (25 fields) and CycloneDX (25 fields) specifications, including field type, validation rules, required status, examples, and cross-format equivalents.

| Format | Version | Fields | Coverage |
|--------|---------|--------|----------|
| SPDX | 2.3 / 3.0 | 25 | Document creation, package info, licensing, relationships, file info, snippets |
| CycloneDX | 1.5 / 1.6 | 25 | Metadata, components, vulnerabilities, services, dependencies, compositions |

### 40 SLSA Framework Requirements

SLSA (Supply-chain Levels for Software Artifacts) requirements across all four levels with evidence types, verification criteria, build system guidance, and framework cross-mappings.

| Level | Focus | Coverage |
|-------|-------|----------|
| Level 1 | Provenance exists | Build process documentation, basic provenance |
| Level 2 | Hosted build platform | Authenticated provenance, build service |
| Level 3 | Hardened builds | Isolated builds, non-falsifiable provenance |
| Level 4 | Full verification | Hermetic, reproducible builds, two-person review |

### 70 Supply Chain Regulations

Regulatory articles and requirements from three major supply chain security frameworks.

| Regulation | Entries | Coverage |
|-----------|---------|----------|
| EU Cyber Resilience Act | 35 | Essential cybersecurity requirements, conformity assessment, market surveillance, Annex I obligations |
| US Executive Order 14028 | 15 | Software supply chain security mandates, SBOM requirements, federal procurement |
| NIST SSDF (SP 800-218) | 20 | Secure software development practices, organizational preparation, software protection |

### 40 Supply Chain Attack Patterns

Real-world supply chain attack patterns with MITRE ATT&CK and CAPEC mappings, case studies, affected ecosystems, impact assessment, detection methods, and mitigations.

| Category | Examples |
|----------|---------|
| Dependency attacks | Dependency confusion, typosquatting, malicious package injection |
| Build compromise | CI/CD pipeline hijacking, build system tampering, artifact substitution |
| Source attacks | Repository compromise, commit signing bypass, maintainer account takeover |
| Distribution | Registry poisoning, CDN compromise, update mechanism hijacking |

### 27 Signing & Verification Patterns

Artifact signing and verification patterns covering tools, key management approaches, verification steps, integration patterns, and ecosystem-specific guidance.

| Tool/Framework | Patterns | Coverage |
|----------------|----------|----------|
| Sigstore (Cosign, Fulcio, Rekor) | Keyless signing, transparency logs, container signing |
| GPG / PGP | Traditional key-based signing, key distribution |
| TUF (The Update Framework) | Repository metadata, delegation, threshold signing |
| in-toto | Supply chain layout, attestation verification |
| Notary v2 | OCI artifact signing, registry-native signatures |

### 27 Composition Risks

Software composition risk entries covering dependency confusion, typosquatting, maintainer compromise, malicious packages, and abandoned dependencies -- with attack mechanisms, detection methods, prevention measures, real-world examples, and severity ratings.

---

## What's NOT in this MCP

| Not Included | Where to Find It |
|-------------|-----------------|
| **Actual SBOM generation or parsing** | Use Syft, CycloneDX CLI, or SPDX tools |
| **Package registry scanning** | Use Snyk, Socket.dev, or npm audit |
| **Build pipeline implementation** | Use SLSA GitHub Generator, Tekton Chains |
| **Security controls frameworks** (ISO 27001, NIST 800-53) | `@ansvar/security-controls-mcp` |
| **Regulatory compliance text** (EU/national law) | Domain-specific law MCPs |
| **CVE vulnerability data** | `@ansvar/cve-mcp` |
| **STRIDE threat patterns** | `@ansvar/stride-mcp` |

---

## Tools (19)

### SBOM Standards (3 tools)

| Tool | Purpose |
|------|---------|
| `get_sbom_standard` | Full details for a specific SBOM standard field by ID (e.g., `SPDX-2.3-001`, `CDX-1.5-001`). Returns format, field type, validation rules, examples, and cross-format equivalents. |
| `search_sbom_fields` | Full-text search across SBOM standard fields. Filter by format (SPDX or CycloneDX). |
| `compare_sbom_formats` | Side-by-side comparison of SPDX and CycloneDX fields within a category (e.g., "Package Information", "Licensing"). |

### SLSA Framework (3 tools)

| Tool | Purpose |
|------|---------|
| `get_slsa_level` | Full details for a SLSA requirement by ID (e.g., `SLSA-L1-SOURCE-001`). Returns level, evidence types, verification criteria, and framework cross-mappings. |
| `search_slsa_requirements` | Full-text search across SLSA requirements. Filter by level (1-4). |
| `assess_slsa_posture` | Overview of SLSA requirements grouped by level with counts. Optionally filter to a single level. |

### Regulations (3 tools)

| Tool | Purpose |
|------|---------|
| `get_supply_chain_regulation` | Full details for a regulation article by ID (e.g., `CRA-ART-5`, `EO14028-SEC-4`, `SSDF-PO.1`). Returns requirements, scope, effective date, enforcement. |
| `check_cra_compliance` | EU Cyber Resilience Act compliance check: all CRA articles with requirements and Annex I essential cybersecurity requirements. |
| `map_eo14028` | Map US EO 14028 sections with optional NIST SSDF crosswalk. |

### Threat Intelligence (3 tools)

| Tool | Purpose |
|------|---------|
| `get_supply_chain_attack` | Full details for an attack pattern by ID (e.g., `SCA-DEP-001`). Returns ATT&CK/CAPEC mappings, case study, detection, mitigations. |
| `search_attack_patterns` | Full-text search across supply chain attack patterns. Filter by ecosystem (npm, PyPI, Maven, etc.). |
| `assess_composition_risk` | Software composition risk assessment grouped by risk type with severity, detection, prevention, and real-world examples. |

### Signing & Attestation (2 tools)

| Tool | Purpose |
|------|---------|
| `get_signing_pattern` | Full details for a signing/verification pattern by ID (e.g., `SIGN-SIGSTORE-001`). Returns tool, use case, key management, verification steps. |
| `search_verification_methods` | Full-text search across signing and verification methods. Filter by ecosystem. |

### Premium Version Tracking (3 tools)

Gated behind `PREMIUM_ENABLED=true` environment variable.

| Tool | Purpose |
|------|---------|
| `get_regulation_history` | Full version history of a supply chain regulation showing all tracked versions. |
| `diff_regulation` | Compare regulation versions to see what changed between releases. |
| `get_recent_changes` | List regulation changes within a recent time window (default 30 days). |

### Utility (2 tools)

| Tool | Purpose |
|------|---------|
| `about` | Server version, data summary (live row counts), data sources. |
| `list_sources` | All 7 data sources with URLs, licences, and update frequencies. |

---

## Data Sources

All data is curated from authoritative public sources. No proprietary data.

| Source | Type | Licence | Update Frequency |
|--------|------|---------|-----------------|
| SPDX Specification (Linux Foundation) | GitHub Markdown | CC-BY-3.0 | Quarterly |
| CycloneDX Specification (OWASP) | GitHub JSON Schema | Apache-2.0 | Quarterly |
| SLSA Framework (OpenSSF) | GitHub Markdown | Apache-2.0 | Quarterly |
| EU Cyber Resilience Act | EUR-Lex HTML | EU public access | Monthly |
| US EO 14028 + NIST SSDF (SP 800-218) | NIST HTML | US Government public domain | Quarterly |
| MITRE ATT&CK Supply Chain Techniques | STIX 2.1 | Apache-2.0 | Weekly |
| OpenSSF Scorecards / Best Practices | GitHub JSON | Apache-2.0 | Monthly |

### Data Freshness

- Database is rebuilt from seed data on every release
- Drift detection runs weekly (GitHub Actions) and opens issues when upstream data changes
- Every tool response includes `_metadata.freshness` timestamp and disclaimer

---

## Database Schema

| Table | Rows | Description |
|-------|------|-------------|
| `sbom_standards` | 50 | SPDX and CycloneDX field definitions with validation rules and cross-format mapping |
| `slsa_requirements` | 40 | SLSA Levels 1-4 requirements with evidence types and verification criteria |
| `supply_chain_regulations` | 70 | EU CRA, US EO 14028, and NIST SSDF articles with requirements and cross-mappings |
| `supply_chain_attacks` | 40 | Attack patterns with MITRE ATT&CK/CAPEC mappings, case studies, and mitigations |
| `signing_verification` | 27 | Artifact signing and verification patterns with integration guidance |
| `composition_risks` | 27 | Software composition risks with detection, prevention, and severity |
| `regulation_versions` | 0 | Version tracking for regulations (premium, data backfill pending) |
| `db_metadata` | 7 | Build provenance (tier, schema_version, built_at, builder, domain) |

**Total: 254 reference records** across 6 core tables.

---

## Development

```bash
# Install dependencies
npm install

# Build the SQLite database from seed JSON
npm run build:db

# Run in development mode (stdio)
npm run dev

# Run unit tests
npm test

# Run contract tests
npm run test:contract

# Type-check
npm run lint

# Full validation (lint + unit + contract)
npm run validate

# Check for upstream data drift
npm run drift:detect
```

### Project Structure

```
├── src/
│   ├── index.ts              # stdio entry point
│   ├── constants.ts           # server name, version, env var names, Db interface
│   ├── db.ts                  # database wrapper (@ansvar/mcp-sqlite)
│   ├── capabilities.ts        # runtime table detection
│   ├── utils/
│   │   ├── fts-query.ts       # FTS5 query sanitization and variant generation
│   │   └── metadata.ts        # ToolResponse<T> wrapper with _metadata
│   └── tools/
│       ├── registry.ts        # tool registration (all 19 tools)
│       └── *.ts               # individual tool handlers
├── data/
│   └── seed/                  # JSON seed files (10 files)
├── scripts/
│   └── build-db.ts            # seed JSON -> SQLite database
├── tests/                     # unit tests (vitest)
│   ├── build-db.test.ts
│   ├── tools/                 # tool-level tests
│   └── utils/                 # utility tests
├── __tests__/contract/        # contract tests (scaffolded)
└── fixtures/                  # test fixtures (scaffolded)
```

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch from `dev`
3. Use conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`)
4. Ensure `npm run validate` passes
5. Open a pull request targeting `dev`

## License

Apache-2.0. See [LICENSE](LICENSE) for details.

Copyright 2026 Ansvar Systems AB.
