# Create Content Workflow

Use this workflow to create a corpus file after repository bootstrap.

1. Read `domains/<domain>/domain.yaml`.
2. Confirm the target is either a universal file defined by `config/taxonomy-policy.yaml` or a registered subdomain.
3. If the target is not registered, follow `docs/workflows/update-taxonomy.md` before creating the file.
4. Select the correct template.
5. Scope the file against neighboring files and the domain manifest.
6. Follow `docs/standards/research.md`.
7. Build a source set using `docs/standards/sources.md`.
8. Inspect source content and create a coverage map.
9. Synthesize only principles that meet the content selection bar.
10. Add claim-level citations according to `docs/standards/citations.md`.
11. Derive practices and goals.
12. Perform citation-entailment and adversarial review.
13. Validate IDs against the domain/subdomain codes registered in the manifest and taxonomy policy.
14. Run deterministic validation.
15. Run applicable semantic evals.
16. Summarize evidence, uncertainty, and notable disagreements in the pull request.
