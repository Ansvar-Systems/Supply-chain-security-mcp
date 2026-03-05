# Privacy Policy

## Data Collection

The Supply Chain Security MCP **does not collect, store, or transmit any user data**. It operates as a read-only database query tool. No telemetry, analytics, or usage tracking is built into this software.

## Deployment Modes

### Local npm (stdio) — Most Private

When installed via `npm install @ansvar/supply-chain-security-mcp` and run locally, all queries stay on your machine. No network requests are made. The database is bundled in the package.

### HTTP Server (Vercel / VM Docker)

When deployed as an HTTP endpoint, your queries are sent over the network to the server. The server does not log or persist query content, but infrastructure providers may collect standard request metadata (IP addresses, timestamps, request sizes).

## Third-Party Data Processing

When using this MCP through a client application:

- **Anthropic** may process your queries per [Anthropic's Privacy Policy](https://www.anthropic.com/privacy)
- **Vercel** (if hosted there) may collect request data per [Vercel's Privacy Policy](https://vercel.com/legal/privacy-policy)

## Recommendations

- Do not include proprietary SBOM data, internal dependency lists, or confidential software inventory details in queries to hosted endpoints.
- For maximum privacy, run the MCP locally via npm stdio mode.

---

Last Updated: 2026-03-04
