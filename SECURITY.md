# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Scanning

This project uses multiple layers of automated security scanning:

### Dependency Vulnerabilities
- **npm audit**: Runs on every CI build (fails on high/critical)
- **Trivy**: Weekly vulnerability scanning for dependencies
- **Socket Security**: Supply chain attack detection on PRs

### Code Analysis
- **CodeQL**: Semantic security analysis (weekly + on PRs)
- **Semgrep**: SAST scanning with security-audit ruleset
- **Gitleaks**: Secret detection in code and commit history

### Security Metrics
- **OpenSSF Scorecard**: Weekly security posture evaluation
- **GitHub Security Tab**: Centralized vulnerability tracking

## Reporting a Vulnerability

**Email:** security@ansvar.eu

**Please DO NOT:**
- Open a public GitHub issue
- Disclose the vulnerability publicly before we've had a chance to address it

### Response Timeline

| Severity | Initial Response | Fix Timeline |
|----------|-----------------|--------------|
| Critical | 24 hours | 7 days |
| High | 48 hours | 30 days |
| Medium | 5 days | 90 days |
| Low | 2 weeks | Next release |

## Scope

### In Scope
- MCP server implementation (`src/` directory)
- Database layer and query construction
- Input validation and sanitization
- Dependencies and supply chain
- Build and publishing process
- GitHub Actions workflows

### Out of Scope
- **Supply chain data accuracy**: We compile data from SPDX/Linux Foundation, OWASP/CycloneDX, OpenSSF/SLSA, EU (Cyber Resilience Act), NIST (SSDF), and MITRE (ATT&CK). Content issues should be reported to the source organizations.
- **Third-party MCP clients**: Issues with Claude Desktop, Cursor, or other clients should be reported to their respective projects.
- **User's local environment**: Configuration issues outside the MCP server itself.

## Database Security

The supply chain security database (`data/database.db`) is:
- **Pre-built and version-controlled** (tamper evident)
- **Opened in read-only mode** (no write risk from tools)
- **Source data from official standards bodies** (SPDX/Linux Foundation, OWASP/CycloneDX, OpenSSF/SLSA, EU, NIST, MITRE)
- **Ingestion scripts require manual execution** (no auto-download from arbitrary sources)
- **Drift detection** compares upstream content hashes weekly

---

**Last Updated:** 2026-02-21
