---
schema_version: 5
id: coding.testing
title: Coding Testing
domain: coding
type: subdomain
subdomain: testing
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 923ec2912bfd886755ec5fe571fbeb536219a0bcf8d97dcac1d3fd5a4df566dd
---

# Coding Testing

Testing concerns selecting and executing checks that provide useful evidence about code behavior and risk.

## Principles

### PRN-000023 — Test observable behavior against a purpose

Design each test around a stated objective and observable behavior, not around executing code for its own sake. [1], [2]

#### Why

A passing test is useful only when its setup, action, and assertions can detect a relevant defect. Objectives connect tests to requirements, user needs, risks, or contracts and make gaps visible. [1], [2]

#### Practices

- State what failure the test should reveal, then choose assertions that would fail if that behavior breaks. [1]
- Choose black-box, white-box, or combined techniques according to the objective and the coverage gap. [1], [2]

### PRN-000024 — Sample the risk space deliberately

Select tests across representative, boundary, invalid, state-transition, and interaction cases according to likelihood and impact. [1], [2]

#### Why

Exhaustive testing is infeasible for all but trivial cases. Deliberate techniques and risk-based prioritization provide broader evidence than repeating typical examples or chasing an undifferentiated coverage number. [1], [2]

#### Practices

- Partition the input and state space, then test boundaries and combinations where behavior changes. [1]
- Increase independence, depth, and environmental realism as the consequence or uncertainty of failure grows. [1]

### PRN-000025 — Keep tests trustworthy

Maintain tests as production-quality evidence: deterministic enough to diagnose, sensitive to relevant defects, and simple enough to review. [1], [2]

#### Why

Tests can contain defects, pass for the wrong reason, or become noisy. Untrusted results waste attention and can conceal regressions, so test design and maintenance deserve the same scrutiny as production code. [1]

#### Practices

- Control or explicitly model time, randomness, concurrency, external services, and mutable shared state. [2]
- When a flaky or misleading test is found, investigate and repair it before relying on its result. [1]

### PRN-000026 — Verify fixes and guard their neighborhood

After correcting a defect, confirm the original failure is resolved and test for regressions in affected behavior. [1]

#### Why

A fix can fail to address the actual cause or can disturb behavior elsewhere. Confirmation testing answers the first question; regression testing addresses the second. [1]

#### Practices

- Preserve the smallest useful reproduction as a test that fails before the fix and passes after it. [1]
- Select regression tests from the impact analysis rather than rerunning only the nearest existing unit tests. [1], [2]

## References

1. [ISTQB Certified Tester Foundation Level Syllabus v4.0.1][1] — `SRC-000013`
2. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][2] — `SRC-000001`

[1]: https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
[2]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
