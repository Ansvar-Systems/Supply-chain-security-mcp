# Supply Chain Security MCP — Data Coverage

## What's Included

### SBOM Standards
- **SPDX 2.3** — All document, package, file, snippet, and relationship fields
- **CycloneDX 1.5** — All component, service, dependency, and composition fields

### Build Security
- **SLSA v1.0** — All requirements for Levels 1 through 4 (source, build, provenance, common)

### Regulations
- **EU Cyber Resilience Act (CRA)** — All articles covering obligations for manufacturers, importers, and distributors of products with digital elements
- **US Executive Order 14028** — All sections on improving national cybersecurity, with focus on software supply chain
- **NIST SSDF (SP 800-218)** — Secure Software Development Framework practices and tasks

### Threat Intelligence
- **Supply chain attack patterns** — Dependency confusion, typosquatting, malicious packages, build system compromise, and more
- **MITRE ATT&CK mapping** — Attack patterns mapped to ATT&CK technique IDs where applicable
- **Ecosystem coverage** — npm, PyPI, Maven, RubyGems, NuGet, Go, Rust/crates.io, and others

### Signing & Attestation
- **Sigstore** (Cosign, Fulcio, Rekor) — Keyless signing and transparency log verification
- **GPG** — Traditional PGP-based signing for packages and commits
- **TUF (The Update Framework)** — Secure software update distribution
- **in-toto** — Software supply chain layout and verification
- **Notary v2** — OCI artifact signing

## What's NOT Included

| Topic | Reason / Alternative |
|-------|---------------------|
| **VEX (Vulnerability Exploitability eXchange)** | Planned for future release |
| **CSAF advisories** | Planned for future release |
| **Live NVD/CVE data** | Use the CVE MCP (`@ansvar/cve-mcp`) instead |
| **Dependency resolution graphs** | Out of scope — use package manager tools |
| **SBOM parsing or generation** | This MCP provides reference data, not SBOM tooling |
| **License analysis** | Use the Open Source License MCP (`@ansvar/open-source-license-mcp`) |
| **Real-time threat feeds** | Out of scope — this MCP covers documented patterns, not live feeds |

---

Last Updated: 2026-03-04
