---
schema_version: 5
id: coding.security
title: Coding Security
domain: coding
type: subdomain
subdomain: security
status: active
last_reviewed: '2026-09-02'
reviewed_content_sha256: 549a5c0dddeb95e94e54908a40a28590b4447b74b4b7e80fa787ea5589adb62b
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

### PRN-000034 — Validate at the trust boundary

Validate untrusted data and authorize requested actions at the boundary where trust changes, using safe representations for downstream use. [1]

#### Why

Assumptions made by upstream interfaces can be bypassed or become stale. Boundary validation and output handling prevent malformed or adversarial data from reaching operations that interpret it with greater privilege. [1]

#### Practices

- Check type, range, structure, size, and authorization against an allowlist appropriate to the operation. [1]
- Use parameterized or context-aware APIs for interpreters, queries, markup, paths, and other injection-sensitive sinks. [1]

### PRN-000035 — Fail closed without hiding the failure

When a security decision cannot be completed safely, deny the protected action and emit bounded diagnostic evidence. [1], [2]

#### Why

Permissive fallback turns errors and outages into control bypasses. Silent denial, however, prevents diagnosis and incident response, so secure failure requires both a safe state and protected observability. [1], [2]

#### Practices

- Define the denied state for unavailable identity, policy, dependency, or validation services before implementing fallback behavior. [1], [2]
- Test security-control error paths and verify that external messages disclose no sensitive internals. [2]

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
