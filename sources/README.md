# Sources

Canonical stable source records live here as one YAML file per `SRC-......` identity.

The exact path is `sources/<source-id>.yaml`; filename and record ID must agree. IDs are allocated through the all-time identity ledger. Pull-request validation compares record persistence, retirement, and URL moves with trusted merge-base state. Registered canonical URLs and aliases use the exact enumerated normalized storage form in `config/source-policy.yaml` and are repository-wide unique after normalization; URL libraries may not apply unlisted rewriting.

The executable schema is `config/schema.yaml#/$defs/source_record`; semantic guidance is in `docs/standards/sources.md`.

This directory intentionally contains no placeholder source records. Allocate an identity only for a real source that has been inspected and is entering reviewed taxonomy or corpus work.
