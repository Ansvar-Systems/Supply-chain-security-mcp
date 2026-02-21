export type Capability =
  | 'sbom_standards'
  | 'slsa_requirements'
  | 'supply_chain_regulations'
  | 'supply_chain_attacks'
  | 'signing_verification'
  | 'composition_risks'
  | 'regulation_versions';

export function detectCapabilities(db: any): Set<Capability> {
  const tables = new Set(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r: any) => r.name),
  );

  const capabilities = new Set<Capability>();
  if (tables.has('sbom_standards')) capabilities.add('sbom_standards');
  if (tables.has('slsa_requirements')) capabilities.add('slsa_requirements');
  if (tables.has('supply_chain_regulations')) capabilities.add('supply_chain_regulations');
  if (tables.has('supply_chain_attacks')) capabilities.add('supply_chain_attacks');
  if (tables.has('signing_verification')) capabilities.add('signing_verification');
  if (tables.has('composition_risks')) capabilities.add('composition_risks');
  if (tables.has('regulation_versions')) capabilities.add('regulation_versions');

  return capabilities;
}
