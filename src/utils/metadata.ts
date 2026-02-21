export interface ResponseMetadata {
  data_source: string;
  domain: string;
  disclaimer: string;
  freshness?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(builtAt?: string): ResponseMetadata {
  return {
    data_source: 'SPDX, CycloneDX, SLSA, EU CRA, US EO 14028, NIST SSDF, MITRE ATT&CK, OpenSSF',
    domain: 'supply-chain-security',
    disclaimer: 'Software supply chain risk intelligence and advisory data. Does not generate or validate actual SBOMs, scan repositories, or verify software signatures. Provides methodology, standards, and threat intelligence — actual supply chain security depends on implementation. Consult security professionals for specific assessments.',
    freshness: builtAt,
  };
}
