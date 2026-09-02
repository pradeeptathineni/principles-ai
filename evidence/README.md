# Evidence Review Records

Minimal claim-review provenance may be stored under `evidence/claims/` using `config/schema.yaml#/$defs/claim_review_record` and `config/evidence-policy.yaml`.

Each `evidence/claims/<entry-id>.yaml` is one complete record per entry. Coverage, hashing, source/locator agreement, outcomes, reviewer configuration, and invalidation are defined in `docs/standards/evidence.md`.

AI and hybrid reviews reference a resolving versioned evaluator setup under `evals/configurations/`; human reviews use null configuration.

Records are required for named pilot paths when the corpus file exists; absence before the authorized pilot is valid. They are optional elsewhere until post-pilot human review.

Do not store fabricated examples as real reviews or bulk-copy source text.
