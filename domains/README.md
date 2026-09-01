# Domains

Canonical principles corpus files and accepted domain taxonomy live here.

Each accepted domain directory contains:

```text
domains/<domain>/
├── domain.yaml          # canonical accepted taxonomy for this domain
├── principles.md        # universal corpus file, created when content is built
├── personal-growth.md   # universal corpus file, created when content is built
└── <subdomain>.md       # registered subdomain files, created incrementally
```

`domain.yaml` may register scopes before all Markdown files exist.

Taxonomy rules are defined by `config/taxonomy-policy.yaml` and `docs/standards/taxonomy.md`.

Do not add an unregistered corpus file. Add or change the subdomain in `domain.yaml` through the taxonomy workflow first.

Do not bulk-generate domain content until repository bootstrap and pilot review are complete.
