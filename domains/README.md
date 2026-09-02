# Domains

Each domain directory contains one human-readable manifest and any corpus files created for accepted scopes.

```text
domains/<domain>/
├── domain.yaml          # purpose, protected intent, scopes, and lifecycle
├── principles.md        # optional domain-wide principles
├── personal-growth.md   # optional personal-growth guidance
└── <subdomain>.md       # one accepted subdomain, created incrementally
```

The manifest is the navigation map: proposed scopes are preserved candidates, accepted scopes may contain corpus, and deprecated scopes retain history without a current corpus file. Content coverage is derived from files rather than duplicated in the manifest.

Corpus files remain the human-readable view: their titles, principle headings, rationales, practices, and references should be browsable without machine state. Do not maintain a second manual catalog; when volume warrants one, generate it reproducibly from manifests and validated corpus files.

Do not add unregistered corpus files, silently alter protected human intent, or derive principle identity from taxonomy codes.
