---
schema_version: 5
id: coding.security
title: Coding Security
domain: coding
type: subdomain
subdomain: security
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: e8759f3c1646d021b702df1aa30e28ec22c064471c5e5b9d671aed272905ec6f
---

# Coding Security

Coding security concerns preventing, detecting, and containing vulnerabilities introduced through source code and its construction environment.

## Principles

### PRN-000033 — Derive controls from threats and assets

Identify the data, privileges, trust boundaries, and plausible abuse paths before selecting security controls for code. [1]

#### Why

Generic checklists cannot determine which failures matter most in a particular system. Risk modeling connects controls and verification effort to concrete assets, attackers, entry points, and consequences. [1]

#### Practices

- Map untrusted inputs, sensitive outputs, privileged operations, and external dependencies at each changed boundary. [1]
- Record mitigations and justified exceptions with the security requirement or risk they address. [1]

### PRN-000034 — Validate input and encode output

Validate inputs and properly encode outputs using secure coding practices appropriate to the language and execution environment. [1]

#### Why

Input validation and output encoding are construction practices that NIST identifies for preventing vulnerabilities in released software. Their correct form depends on how the program and its downstream consumers interpret data. [1]

#### Practices

- Apply input validation and output encoding consistently at relevant interfaces, using mechanisms designed for the language and execution environment. [1]

### PRN-000035 — Fail closed without hiding the failure

When a security decision cannot be completed safely, deny the protected action and emit bounded diagnostic evidence. [1], [2]

#### Why

Permissive fallback turns errors and outages into control bypasses. Silent denial, however, prevents diagnosis and incident response, so secure failure requires both a safe state and protected observability. [1], [2]

#### Practices

- Define the denied state for unavailable identity, policy, dependency, or validation services before implementing fallback behavior. [1], [2]
- Test security-control error paths and verify that external messages disclose no sensitive internals. [2]

#### Applicability

Fail-closed behavior applies to a protected action whose authorization or safety cannot be established. Other failures may have a valid recovery or degraded mode when that behavior is part of the reviewed contract. [1], [2]

### PRN-000036 — Use independent security checks

Combine secure coding rules, automated analysis, focused tests, and qualified review according to the risk of the change. [1], [3]

#### Why

Each technique observes different weakness classes and carries blind spots. Independent checks increase the chance of finding vulnerabilities before release without implying that any one tool proves security. [1], [3]

#### Practices

- Enable relevant compiler and analysis protections, triage their findings, and document justified exceptions. [1]
- Add a security-focused reviewer or test when the change affects authentication, authorization, sensitive data, cryptography, parsing, or privilege boundaries. [1], [3]

## References

1. [NIST SP 800-218, Secure Software Development Framework Version 1.1][1] — `SRC-000014`
2. [Handle all Errors and Exceptions][2] — `SRC-000015`
3. [Guide to the Software Engineering Body of Knowledge (SWEBOK Guide), Version 4.0a][3] — `SRC-000001`

[1]: https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-218.pdf
[2]: https://devguide.owasp.org/en/04-design/02-web-app-checklist/10-handle-errors-exceptions/
[3]: https://ieeecs-media.computer.org/media/education/swebok/swebok-v4.pdf
