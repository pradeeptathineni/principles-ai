---
schema_version: 5
id: artificial-intelligence.training-fine-tuning
title: Artificial Intelligence Training & Fine-Tuning
domain: artificial-intelligence
type: subdomain
subdomain: training-fine-tuning
status: draft
last_reviewed: null
reviewed_content_sha256: null
---

# Artificial Intelligence Training & Fine-Tuning

Guidance for controlled, reproducible changes to model parameters and learned behavior.

## Principles

### PRN-000123 — Use the least invasive adaptation that works

Compare prompting, retrieval, lightweight adaptation, fine-tuning, and full training, and modify weights only when the expected gain justifies new data, evaluation, security, and maintenance obligations. [1], [2]

#### Why

Changing model weights creates a new artifact whose behavior depends on training mixtures, objectives, infrastructure, and reproducibility controls. [2], [3]

#### Practices

- Establish prompt-only and retrieval baselines before approving a training run. [1]
- Define the behavioral gap, success thresholds, regression suite, budget, and rollback artifact before changing weights. [2]

### PRN-000124 — Make every promoted run reproducible and attributable

Bind trained artifacts to versioned code, base model, data, objectives, hyperparameters, environment, evaluation, and approvals with enough detail to investigate or repeat the run. [2], [3]

#### Why

Reproducibility supports verification and exposes unintentional errors, while secure provenance reduces ambiguity about which inputs and processes produced a released model. [2], [3]

#### Practices

- Capture immutable manifests for datasets, checkpoints, dependencies, parameters, seeds where meaningful, hardware assumptions, and code revision. [2], [3]
- Protect training data, pipelines, logs, and model artifacts from unauthorized access, tampering, and substitution. [2]

## References

1. [Rules of Machine Learning: Best Practices for ML Engineering][1] — `SRC-000084`
2. [NIST SP 800-218A, Secure Software Development Practices for Generative AI and Dual-Use Foundation Models][2] — `SRC-000079`
3. [Improving Reproducibility in Machine Learning Research][3] — `SRC-000097`

[1]: https://developers.google.com/machine-learning/guides/rules-of-ml
[2]: https://doi.org/10.6028/NIST.SP.800-218A
[3]: https://www.jmlr.org/papers/v22/20-303.html
