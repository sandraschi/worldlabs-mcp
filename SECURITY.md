# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

Please report security vulnerabilities by opening a GitHub issue with the label `security`.

## API Key Handling

This server reads `WORLDLABS_API_KEY` from environment variables only.
Never commit API keys to source control.

The server does not log, store, or transmit API keys beyond the required
`WLT-Api-Key` header to `api.worldlabs.ai`.
