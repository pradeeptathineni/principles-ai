---
schema_version: 5
id: artificial-intelligence.agents
title: Artificial Intelligence Agents
domain: artificial-intelligence
type: subdomain
subdomain: agents
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Agents

Guidance for AI systems that plan and act through tools, memory, and multi-step workflows.

## Principles

### PRN-000129 — Give agents the least authority needed

Bind each agent to a known human controller and grant only the tools, data, identity, duration, and action scope necessary for its current task. [1], [2]

#### Why

Agentic systems can turn model errors or manipulated context into real actions, making broad credentials and ambient authority disproportionately dangerous. [1], [2]

#### Practices

- Use task-scoped credentials, explicit tool allowlists, narrow arguments, resource limits, and short-lived execution contexts. [1]
- Require separate authorization for consequential, irreversible, external, or privilege-expanding actions. [1], [2]

### PRN-000130 — Make plans and actions observable and interruptible

Record agent inputs, plans, tool requests, results, state transitions, and final effects, and provide reliable pause, cancel, and recovery mechanisms. [1], [2]

#### Why

Multi-step autonomy compounds errors over time; traceability and intervention are necessary to investigate divergence and prevent continued harmful action. [1]

#### Practices

- Correlate every action with the initiating user, objective, policy decision, model and prompt version, tool, and resulting state change. [1]
- Set limits on steps, time, spend, retries, and changed resources, with fail-closed behavior when limits or monitoring fail. [1], [2]

### PRN-000131 — Treat memory and tool results as untrusted state

Validate and constrain information returned by tools, other agents, retrieved sources, and persistent memory before it can influence privileged decisions. [2], [3]

#### Why

Agent context and tool data can be poisoned or crafted to redirect planning, invoke unsafe tools, or persist attacker-controlled instructions across runs. [2], [3]

#### Practices

- Separate observations from policy and instructions, attach provenance, and prevent ordinary content from modifying authority. [2], [3]
- Sanitize writes to memory and re-authorize stored state when its source, age, or intended scope no longer matches the task. [2]

## References

1. [Google's Approach for Secure AI Agents][1] — `SRC-000093`
2. [Summary Analysis of Responses Regarding Security Considerations for AI Agents][2] — `SRC-000094`
3. [Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations][3] — `SRC-000080`

[1]: https://research.google/pubs/an-introduction-to-googles-approach-for-secure-ai-agents/
[2]: https://www.nist.gov/publications/summary-analysis-responses-request-information-regarding-security-considerations-ai
[3]: https://csrc.nist.gov/pubs/ai/100/2/e2025/final
