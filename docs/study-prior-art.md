# Study prior art and transfer decision

Inspected 2026-10-23: SurfSense `MODSetter/SurfSense`, exact commit `e3de9e0d293b2ebb1fb813628ecc1d6f26909396` (GitHub commit collection resolved the catalog's unpinned reference). Root LICENSE blob `7a9765211486c75407a96be65b1e80c030dee447` contains Copyright (c) SurfSense and Apache License 2.0 terms. Full inspected license is retained in the task's STUDY receipt, outside this repository.

Exact inspected files under `surfsense_web/features/artifacts/rendering/formats/flashcards/`:

- `schema.ts`, blob `741d99baf7844f35aa8f67547214b97397f3d57d`: bounded front/back/hint schema, versioned deck.
- `study-state.ts`, blob `70d0e899b9441e76be4035b86f69432cafd84264`: generation-bound state and good/again self marks; mismatched state normalizes to a new generation.
- `flashcard-surface.tsx`, blob `427878d2f1f100ee0e7c28572f58e8d21361a734`: separate front/back and explicit Reveal answer action, with accessible hidden faces and reduced-motion behavior.

Decision before implementation: reproduce only the general cue → reveal → personal mark method in original deterministic code. No code, prompt, asset, schema text, or dependency is transferred; no license change or third-party runtime added. Deck size rules, generated questions, scoring, and automatic state reset are unsuitable here. The owned tool requires an explanation before reveal, preserves immutable source/cue history, and treats changed generations as explicit source comparisons. Dates are chosen by the person. Self-rating is not measured mastery, efficacy, or a source claim. This receipt is method provenance, not a claim of empirical learning benefit.
