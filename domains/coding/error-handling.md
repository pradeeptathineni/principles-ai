---
schema_version: 5
id: coding.error-handling
title: Coding Error Handling
domain: coding
type: subdomain
subdomain: error-handling
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 28b01fa5be6467b47175d7ee1dcbf13b3057afd0b4aab2f0c8506e15da25e15f
---

# Coding Error Handling

Error handling concerns detecting failures, preserving valid state, communicating them safely, and choosing an appropriate recovery or termination response.

## Principles

### PRN-000030 — Make failure explicit in the contract

Represent anticipated failure modes so callers can distinguish success from failure and know which responses are valid. [1], [2]

#### Why

Ambiguous sentinels, swallowed errors, and undocumented exceptions move uncertainty into every caller. Explicit failure contracts support consistent handling without forcing reusable code to dictate application policy. [1], [2]

#### Practices

- Use the language’s appropriate result, error, or exception mechanism without overloading valid data as an error indicator. [2]
- Document recoverable conditions, propagated failures, and state guarantees at the interface that exposes them. [1]

### PRN-000031 — Preserve invariants when operations fail

Handle partial work so a failed operation leaves owned state valid, resources accounted for, and retries or compensation well-defined. [1], [3], [4]

#### Why

Failure can occur after only part of a multi-step operation completes. Without explicit cleanup or transactional boundaries, later code observes leaked resources or contradictory state that obscures the original error. [1], [3], [4]

#### Practices

- Establish cleanup, rollback, and commit behavior before performing irreversible effects. [4]
- Exercise representative failure points and verify that cleanup, state guarantees, and reporting still hold. [3], [4]

### PRN-000032 — Separate user-safe errors from diagnostic detail

Give callers enough information to respond while keeping sensitive internals out of untrusted error channels. [1], [3]

#### Why

Vague errors prevent recovery, but stack traces, identifiers, secrets, and internal state can create security exposure. Different audiences need correlated but deliberately bounded information. [3]

#### Practices

- Return stable categories and actionable context to callers; send sensitive diagnostic detail only to protected telemetry. [3]
- Log enough protected context for support, quality assurance, forensics, or incident response without disclosing it to untrusted callers. [3]

## References

1. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][1] — `SRC-000001`
2. [Rec. 12. Error Handling (ERR)][2] — `SRC-000016`
3. [Handle all Errors and Exceptions][3] — `SRC-000015`
4. [ERR03-J. Restore prior object state on method failure][4] — `SRC-000031`

[1]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
[2]: https://cmu-sei.github.io/secure-coding-standards/sei-cert-c-coding-standard/recommendations/error-handling-err/
[3]: https://devguide.owasp.org/en/04-design/02-web-app-checklist/10-handle-errors-exceptions/
[4]: https://cmu-sei.github.io/secure-coding-standards/sei-cert-oracle-coding-standard-for-java/rules/exceptional-behavior-err/err03-j/
