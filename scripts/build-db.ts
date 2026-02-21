import Database from 'better-sqlite3';
import { existsSync, unlinkSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DB_PATH = process.env.SUPPLY_CHAIN_SECURITY_DB_PATH ?? join(import.meta.dirname, '..', 'data', 'database.db');

const SCHEMA = `
-- SBOM standards (SPDX, CycloneDX field specifications)
CREATE TABLE sbom_standards (
  id TEXT PRIMARY KEY,
  format TEXT NOT NULL CHECK(format IN ('SPDX','CycloneDX')),
  format_version TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  validation_rules TEXT,
  examples TEXT,
  equivalent_field TEXT,
  category TEXT,
  keywords TEXT,
  last_updated TEXT
);

-- SLSA framework requirements
CREATE TABLE slsa_requirements (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL CHECK(level IN (1,2,3,4)),
  requirement_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_types TEXT NOT NULL DEFAULT '[]',
  verification_criteria TEXT,
  build_system_guidance TEXT,
  category TEXT,
  framework_mappings TEXT NOT NULL DEFAULT '{}',
  keywords TEXT,
  last_updated TEXT
);

-- Supply chain regulations (EU CRA, EO 14028, NIST SSDF)
CREATE TABLE supply_chain_regulations (
  id TEXT PRIMARY KEY,
  regulation TEXT NOT NULL CHECK(regulation IN ('EU_CRA','EO_14028','NIST_SSDF','OTHER')),
  regulation_version TEXT NOT NULL,
  article_or_section TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL DEFAULT '[]',
  applicability TEXT,
  effective_date TEXT,
  enforcement TEXT,
  framework_mappings TEXT NOT NULL DEFAULT '{}',
  keywords TEXT,
  last_updated TEXT
);

-- Supply chain attack patterns
CREATE TABLE supply_chain_attacks (
  id TEXT PRIMARY KEY,
  attack_name TEXT NOT NULL,
  description TEXT NOT NULL,
  attack_vector TEXT NOT NULL,
  mitre_attack_id TEXT,
  mitre_tactic TEXT,
  capec_id TEXT,
  case_study TEXT,
  affected_ecosystem TEXT,
  impact TEXT,
  detection_methods TEXT NOT NULL DEFAULT '[]',
  mitigations TEXT NOT NULL DEFAULT '[]',
  keywords TEXT,
  last_updated TEXT
);

-- Signing and verification patterns
CREATE TABLE signing_verification (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT NOT NULL,
  specification_url TEXT,
  key_management TEXT,
  verification_steps TEXT NOT NULL DEFAULT '[]',
  integration_patterns TEXT NOT NULL DEFAULT '[]',
  ecosystem TEXT,
  keywords TEXT,
  last_updated TEXT
);

-- Composition risks (dependency confusion, typosquatting, etc.)
CREATE TABLE composition_risks (
  id TEXT PRIMARY KEY,
  risk_type TEXT NOT NULL CHECK(risk_type IN ('dependency_confusion','typosquatting','maintainer_compromise','malicious_package','abandoned_dependency','other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attack_mechanism TEXT NOT NULL,
  detection_methods TEXT NOT NULL DEFAULT '[]',
  prevention_measures TEXT NOT NULL DEFAULT '[]',
  real_world_examples TEXT NOT NULL DEFAULT '[]',
  affected_ecosystems TEXT NOT NULL DEFAULT '[]',
  severity TEXT NOT NULL CHECK(severity IN ('critical','high','medium','low')),
  keywords TEXT,
  last_updated TEXT
);

-- Premium: regulation version tracking
CREATE TABLE regulation_versions (
  id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL,
  version_label TEXT NOT NULL,
  effective_date TEXT,
  body_text TEXT,
  scraped_at TEXT,
  change_summary TEXT,
  diff_from_previous TEXT
);

-- FTS5 for sbom_standards
CREATE VIRTUAL TABLE sbom_standards_fts USING fts5(
  id, field_name, description, validation_rules, keywords,
  content='sbom_standards',
  content_rowid='rowid',
  tokenize='unicode61'
);
CREATE TRIGGER sbom_standards_ai AFTER INSERT ON sbom_standards BEGIN
  INSERT INTO sbom_standards_fts(rowid, id, field_name, description, validation_rules, keywords)
    VALUES (new.rowid, new.id, new.field_name, new.description, new.validation_rules, new.keywords);
END;

-- FTS5 for slsa_requirements
CREATE VIRTUAL TABLE slsa_requirements_fts USING fts5(
  id, title, description, verification_criteria, keywords,
  content='slsa_requirements',
  content_rowid='rowid',
  tokenize='unicode61'
);
CREATE TRIGGER slsa_requirements_ai AFTER INSERT ON slsa_requirements BEGIN
  INSERT INTO slsa_requirements_fts(rowid, id, title, description, verification_criteria, keywords)
    VALUES (new.rowid, new.id, new.title, new.description, new.verification_criteria, new.keywords);
END;

-- FTS5 for supply_chain_regulations
CREATE VIRTUAL TABLE supply_chain_regulations_fts USING fts5(
  id, title, description, requirements, keywords,
  content='supply_chain_regulations',
  content_rowid='rowid',
  tokenize='unicode61'
);
CREATE TRIGGER supply_chain_regulations_ai AFTER INSERT ON supply_chain_regulations BEGIN
  INSERT INTO supply_chain_regulations_fts(rowid, id, title, description, requirements, keywords)
    VALUES (new.rowid, new.id, new.title, new.description, new.requirements, new.keywords);
END;

-- FTS5 for supply_chain_attacks
CREATE VIRTUAL TABLE supply_chain_attacks_fts USING fts5(
  id, attack_name, description, attack_vector, keywords,
  content='supply_chain_attacks',
  content_rowid='rowid',
  tokenize='unicode61'
);
CREATE TRIGGER supply_chain_attacks_ai AFTER INSERT ON supply_chain_attacks BEGIN
  INSERT INTO supply_chain_attacks_fts(rowid, id, attack_name, description, attack_vector, keywords)
    VALUES (new.rowid, new.id, new.attack_name, new.description, new.attack_vector, new.keywords);
END;

-- FTS5 for signing_verification
CREATE VIRTUAL TABLE signing_verification_fts USING fts5(
  id, tool_name, description, use_case, keywords,
  content='signing_verification',
  content_rowid='rowid',
  tokenize='unicode61'
);
CREATE TRIGGER signing_verification_ai AFTER INSERT ON signing_verification BEGIN
  INSERT INTO signing_verification_fts(rowid, id, tool_name, description, use_case, keywords)
    VALUES (new.rowid, new.id, new.tool_name, new.description, new.use_case, new.keywords);
END;

-- FTS5 for composition_risks
CREATE VIRTUAL TABLE composition_risks_fts USING fts5(
  id, title, description, attack_mechanism, keywords,
  content='composition_risks',
  content_rowid='rowid',
  tokenize='unicode61'
);
CREATE TRIGGER composition_risks_ai AFTER INSERT ON composition_risks BEGIN
  INSERT INTO composition_risks_fts(rowid, id, title, description, attack_mechanism, keywords)
    VALUES (new.rowid, new.id, new.title, new.description, new.attack_mechanism, new.keywords);
END;

-- Metadata
CREATE TABLE db_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

export function buildDatabase(dbPath: string = DB_PATH): void {
  if (existsSync(dbPath)) unlinkSync(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  // Load seed data
  const seedDir = join(import.meta.dirname, '..', 'data', 'seed');
  if (existsSync(seedDir)) {
    const seedFiles = readdirSync(seedDir).filter((f) => f.endsWith('.json'));

    const insertSbomStandard = db.prepare(`
      INSERT INTO sbom_standards (id, format, format_version, field_name, field_type,
        required, description, validation_rules, examples, equivalent_field,
        category, keywords, last_updated)
      VALUES (@id, @format, @format_version, @field_name, @field_type,
        @required, @description, @validation_rules, @examples, @equivalent_field,
        @category, @keywords, @last_updated)
    `);

    const insertSlsaRequirement = db.prepare(`
      INSERT INTO slsa_requirements (id, level, requirement_id, title, description,
        evidence_types, verification_criteria, build_system_guidance, category,
        framework_mappings, keywords, last_updated)
      VALUES (@id, @level, @requirement_id, @title, @description,
        @evidence_types, @verification_criteria, @build_system_guidance, @category,
        @framework_mappings, @keywords, @last_updated)
    `);

    const insertRegulation = db.prepare(`
      INSERT INTO supply_chain_regulations (id, regulation, regulation_version,
        article_or_section, title, description, requirements, applicability,
        effective_date, enforcement, framework_mappings, keywords, last_updated)
      VALUES (@id, @regulation, @regulation_version,
        @article_or_section, @title, @description, @requirements, @applicability,
        @effective_date, @enforcement, @framework_mappings, @keywords, @last_updated)
    `);

    const insertAttack = db.prepare(`
      INSERT INTO supply_chain_attacks (id, attack_name, description, attack_vector,
        mitre_attack_id, mitre_tactic, capec_id, case_study, affected_ecosystem,
        impact, detection_methods, mitigations, keywords, last_updated)
      VALUES (@id, @attack_name, @description, @attack_vector,
        @mitre_attack_id, @mitre_tactic, @capec_id, @case_study, @affected_ecosystem,
        @impact, @detection_methods, @mitigations, @keywords, @last_updated)
    `);

    const insertSigning = db.prepare(`
      INSERT INTO signing_verification (id, tool_name, description, use_case,
        specification_url, key_management, verification_steps, integration_patterns,
        ecosystem, keywords, last_updated)
      VALUES (@id, @tool_name, @description, @use_case,
        @specification_url, @key_management, @verification_steps, @integration_patterns,
        @ecosystem, @keywords, @last_updated)
    `);

    const insertCompositionRisk = db.prepare(`
      INSERT INTO composition_risks (id, risk_type, title, description,
        attack_mechanism, detection_methods, prevention_measures, real_world_examples,
        affected_ecosystems, severity, keywords, last_updated)
      VALUES (@id, @risk_type, @title, @description,
        @attack_mechanism, @detection_methods, @prevention_measures, @real_world_examples,
        @affected_ecosystems, @severity, @keywords, @last_updated)
    `);

    db.transaction(() => {
      for (const file of seedFiles) {
        const data = JSON.parse(readFileSync(join(seedDir, file), 'utf-8'));

        if (data.sbom_standards) {
          for (const r of data.sbom_standards) {
            insertSbomStandard.run(r);
          }
        }

        if (data.slsa_requirements) {
          for (const r of data.slsa_requirements) {
            insertSlsaRequirement.run({
              ...r,
              evidence_types: JSON.stringify(r.evidence_types ?? []),
              framework_mappings: JSON.stringify(r.framework_mappings ?? {}),
            });
          }
        }

        if (data.supply_chain_regulations) {
          for (const r of data.supply_chain_regulations) {
            insertRegulation.run({
              ...r,
              requirements: JSON.stringify(r.requirements ?? []),
              framework_mappings: JSON.stringify(r.framework_mappings ?? {}),
            });
          }
        }

        if (data.supply_chain_attacks) {
          for (const r of data.supply_chain_attacks) {
            insertAttack.run({
              ...r,
              detection_methods: JSON.stringify(r.detection_methods ?? []),
              mitigations: JSON.stringify(r.mitigations ?? []),
            });
          }
        }

        if (data.signing_verification) {
          for (const r of data.signing_verification) {
            insertSigning.run({
              ...r,
              verification_steps: JSON.stringify(r.verification_steps ?? []),
              integration_patterns: JSON.stringify(r.integration_patterns ?? []),
            });
          }
        }

        if (data.composition_risks) {
          for (const r of data.composition_risks) {
            insertCompositionRisk.run({
              ...r,
              detection_methods: JSON.stringify(r.detection_methods ?? []),
              prevention_measures: JSON.stringify(r.prevention_measures ?? []),
              real_world_examples: JSON.stringify(r.real_world_examples ?? []),
              affected_ecosystems: JSON.stringify(r.affected_ecosystems ?? []),
            });
          }
        }
      }
    })();
  }

  // Write metadata
  const insertMeta = db.prepare('INSERT INTO db_metadata (key, value) VALUES (?, ?)');
  db.transaction(() => {
    insertMeta.run('tier', 'offline-first');
    insertMeta.run('schema_version', '1');
    insertMeta.run('built_at', new Date().toISOString());
    insertMeta.run('builder', 'build-db.ts');
    insertMeta.run('domain', 'supply-chain-security');
    insertMeta.run('source', 'SPDX, CycloneDX, SLSA, EU CRA, US EO 14028, NIST SSDF, MITRE ATT&CK, OpenSSF');
    insertMeta.run('licence', 'Mixed: CC-BY-3.0 (SPDX), Apache-2.0 (CycloneDX, SLSA, MITRE, OpenSSF), EU public access (CRA), US public domain (EO 14028, NIST)');
  })();

  // Finalize
  db.pragma('journal_mode = DELETE');
  db.exec('ANALYZE');
  db.exec('VACUUM');
  db.close();

  console.log(`Database built: ${dbPath}`);
}

// CLI entry point
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  buildDatabase();
}
