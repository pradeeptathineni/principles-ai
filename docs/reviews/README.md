# Reviews

This directory contains curated historical records of consequential architecture audits, self-review checkpoints, major deterministic-tooling and readiness reviews, first-production or first-scale-run reviews, and production postmortems.

Reviews explain what was assessed at a point in time but are not canonical policy. Accepted outcomes become authoritative only when encoded in the current architecture, standards, workflows, executable configuration, templates, and manifests.

Use `YYYY-MM-DD-short-description.md`. A title, date, noncanonical status, and scope are normally sufficient metadata; add disposition only when it helps readers locate the canonical changes. Ordinary content review and routine maintenance do not warrant durable sidecars.

Promote conclusions, not conversations. Do not continuously rewrite historical reviews to mirror later implementation. When accepted findings from a saved architecture review are implemented, preserve the original review body and conclusion, then append a disposition after them that records implementation scope, verification outcome, deferred work, and outstanding human gates. Current behavior must remain discoverable from the canonical files named by that disposition rather than from the historical record alone.

When a review is superseded, preserve its original findings and point to the later review or canonical migration instead of making the old record appear current.
