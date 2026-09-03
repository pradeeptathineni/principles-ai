---
schema_version: 5
id: coding.debugging
title: Coding Debugging
domain: coding
type: subdomain
subdomain: debugging
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 17d6d513c8b8863c7a2a7d94d68f38d9cfa7a94526cfebf79b1b24163e7adb26
---

# Coding Debugging

Debugging concerns reproducing failures, locating their causes, correcting defects, and verifying the result.

## Principles

### PRN-000027 — Stabilize the failure before explaining it

First establish a reliable reproduction or a precise observation boundary, then distinguish observed facts from hypotheses. [1], [2]

#### Why

Debugging without a stable symptom encourages changes based on coincidence. A reproduction, trace, or bounded observation creates a falsifiable reference for diagnosis and later confirmation. [1], [2]

#### Practices

- Record the inputs, state, environment, timing, and observed result needed to reproduce or recognize the failure. [1], [2]
- Reduce the case while preserving the failure, checking after each reduction that the same symptom remains. [1]

### PRN-000028 — Change one hypothesis at a time

Use observations to form a specific causal hypothesis, make the smallest discriminating experiment, and update the hypothesis from the result. [2]

#### Why

Multiple simultaneous changes destroy causal information. Controlled experiments narrow the search space and keep an apparent improvement from being mistaken for an understood fix. [2]

#### Practices

- Compare healthy and failing executions at the earliest point where their relevant state diverges. [2]
- Add temporary instrumentation at decision boundaries, then remove or convert it into durable observability when it remains useful. [2]

### PRN-000029 — Correct the root cause

Identify and correct the root cause, then confirm that the original failure is resolved. [1], [2]

#### Why

Root-cause analysis can prevent similar failures that share the same cause. Repeating the original observation after the repair distinguishes a causal correction from a coincidental disappearance. [1], [2]

#### Practices

- Explain the causal chain from defect to observed failure and change the cause rather than only masking the symptom. [1], [2]
- Rerun the original reproduction under comparable conditions before expanding to regression testing. [1], [2]

## References

1. [ISTQB Certified Tester Foundation Level Syllabus v4.0.1][1] — `SRC-000013`
2. [Effective Troubleshooting][2] — `SRC-000023`

[1]: https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
[2]: https://sre.google/sre-book/effective-troubleshooting/
