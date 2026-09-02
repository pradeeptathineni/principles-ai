# Domains

Canonical taxonomy state and corpus Markdown live under one directory per domain.

```text
domains/<domain>/
├── domain.yaml          # lifecycle, protected intent, taxonomy state
├── taxonomy-review.md   # created only after a real independent review
├── principles.md        # optional until content is authorized
├── personal-growth.md   # optional until content is authorized
└── <subdomain>.md       # registered accepted scope, created incrementally
```

Current undocumented research-origin taxonomy is preserved as `proposed`. Do not change it to `accepted` without a real taxonomy review record and human approval. Coding is the first planned independent review before pilot content.

Taxonomy acceptance does not imply content exists. Content coverage is derived from validated Markdown files.

An accepted domain has a complete `taxonomy-review.md` state with a date and at least one resolving stable source ID. Required subdomains of an accepted domain are accepted; other candidates may remain proposed. Corpus files require accepted scope and exact path/frontmatter/title agreement under `config/content-policy.yaml`.

Do not add unregistered corpus files, silently alter protected human intent, or derive principle identity from domain/subdomain codes.
