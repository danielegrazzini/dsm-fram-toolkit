# dsm-fram-toolkit

**A browser-based simulator suite for DSM–FRAM integration and functional resonance risk analysis**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![JOSS](https://joss.theoj.org/papers/placeholder/badge.svg)](paper.md)

---

## Overview

`dsm-fram-toolkit` provides three browser-based simulation tools that operationalise a quantitative integration between the **Design Structure Matrix (DSM)** methodology and the **Functional Resonance Analysis Method (FRAM)**. No installation is required — every simulator runs as a self-contained HTML file in any modern web browser.

The three simulators form a progressive analytical hierarchy:

| Simulator | Description | Key output |
|---|---|---|
| **B-E Simulator** | Full Browning-Eppinger (2002) stochastic process simulation | E[S], sigma[S], P[S], Interface Criticality |
| **FEBS Simulator** | FRAM-Extended B-E — replaces scalar weights with 6D coupling tensors | Interface Resonance Risk Index (IRR) |
| **FRAME-Q Simulator** | Network variability propagation + Saltelli (2002) global sensitivity analysis | Rnet, Sobol Si and Ti |

> **Note on the IRR acronym.** The per-activity index produced by the FEBS Simulator is written **IRR**. It appears in the literature under two equivalent long forms: *Interface Resonance Risk Index* (used here and in the extension study) and *Functional Resonance Risk Index* (used in the DSM 2026 conference paper). Both denote the same quantity; the acronym IRR is stable across all project outputs.

---

## Quick Start

1. **Download** any simulator HTML file from `simulators/`
2. **Open** it in Chrome, Firefox, Edge, or Safari (no server needed)
3. **Load an example**: click the "Load Example" button to use the preloaded UCAV case
4. **Run the simulation**: follow the step-by-step wizard

That's it. No Python, no npm, no configuration.

---

## Repository Structure

```
dsm-fram-toolkit/
├── .github/workflows/
│   └── draft-pdf.yml                        # JOSS paper PDF build workflow
├── simulators/
│   ├── DSM_B-E_Simulator_v7.2.1.html        # Browning-Eppinger 2002 stochastic simulation
│   ├── FEBS_Simulator_v6.0.2.html           # FRAM-Extended B-E Simulation
│   └── FRAMEQ_Simulator.html                # FRAME-Q variability propagation + Sobol analysis
├── data/
│   ├── UCAV_source_verified_S12.json               # UCAV case data, verified cell by cell
│   ├── UCAV_FEBS_full_v1.json                      # Full coupling tensor (v1)
│   ├── UCAV_tensor_B_v1.json                       # Reviewed v1 tensor, rescaled to the norm constraint
│   ├── UCAV_FEBS_reduction_test2.json              # FEBS->B-E reduction test configuration
│   ├── PROOF_FEBS_extends_Browning-Eppinger.md     # Formal proof (English)
│   └── PROOF_FEBS_estende_Browning-Eppinger.md     # Formal proof (Italian)
├── tests/
│   ├── be_published_replication.js          # B-E replication of published UCAV baseline (Table V)
│   ├── febs_be_reduction_equivalence.js     # FEBS->B-E reduction on the UCAV case
│   ├── frameq_sigma_regression.js           # FRAME-Q variability-handling regression suite
│   └── sobol_saltelli_verification.py       # FRAME-Q Saltelli estimator vs Ishigami function
├── CHANGELOG.md
├── CITATION.cff                             # Citation metadata
├── LICENSE                                  # MIT License
├── README.md
├── paper.bib                                # Bibliography
└── paper.md                                 # JOSS paper
```

### Verified simulator versions

The results reported in the extension study (see *Related Publications*) were produced with the following exact simulator versions. The SHA-256 of each file is given so that the published numbers can be traced to the exact code that produced them:

| Simulator | File | SHA-256 (first 16 hex) |
|---|---|---|
| B-E Simulator | `simulators/DSM_B-E_Simulator_v7.2.1.html` | `7d4bae87590877d9` |
| FEBS Simulator | `simulators/FEBS_Simulator_v6.0.2.html` | `9932c988401e92b9` |

If you update a simulator, recompute its SHA-256 and update this table so that the mapping between published results and code remains exact.

---

## Simulators

### B-E Simulator (v7.2.1)

A complete implementation of the Browning & Eppinger (2002) process simulation model.

**Features:**

- Triangular distribution sampling (BCV / MLV / WCV) with Latin Hypercube Sampling
- Cost-duration correlation via Normal copula (rho = 0.9 default)
- Comonotonic and independent sampling modes (see note below)
- First- and second-order rework propagation
- All 10 schedule and cost risk metrics from Table V of Browning & Eppinger (2002)
- Interface Criticality analysis (analytic and empirical)
- Multi-architecture comparison with minimum highlighting
- Import/export in MIT DSM format and JSON
- Preloaded UCAV design process case (Browning, 1998)

> **Sampling mode.** Reproducing the published UCAV variances requires *comonotonic* sampling — a single quantile drawn per run and applied to all activities — a detail not explicit in the 2002 paper but recovered from its published values. The simulator exposes both modes; the comonotonic mode is the one that replicates the reference (see `tests/be_published_replication.js`).

### FEBS Simulator (v6.0.2)

Extends B-E by replacing scalar rework probabilities with six-dimensional coupling tensors.

**Features:**

- FRAME-6 structured elicitation panel for all 6 FRAM aspects per active pair
- Weighted Euclidean norm aggregation of tensor components
- Interface Resonance Risk Index (IRR) per activity
- Full Monte Carlo simulation with empirical rework frequency tracking
- Export tensor M in shared JSON format for FRAME-Q import
- Preloaded UCAV case with full tensor M

**The FRAME-6 aspects:**

| Aspect | Central question |
|---|---|
| Input (I) | Does j provide the trigger that starts or re-orients i? |
| Output (O) | Does a variation in j's output alter the technical context of i? |
| Precondition (P) | Must the state established by j exist before i can proceed? |
| Resource (R) | Do j and i share resources, or does j produce tools that i uses? |
| Control (C) | Does j define constraints on how i must carry out its work? |
| Time (T) | Is the timing of j critical for the operational window of i? |

**Degenerate-case property.** When the six-dimensional tensor reduces to a uniform scalar (uniform weights, beta = 1, threshold at the minimum, P_base at the maximum norm), all FEBS metrics reduce exactly to their B-E equivalents. The reduction is proved formally in `data/PROOF_FEBS_extends_Browning-Eppinger.md` and demonstrated numerically by `tests/febs_be_reduction_equivalence.js`.

### FRAME-Q Simulator

Implements network-level variability propagation and global sensitivity analysis.

**Features:**

- Three-level propagation: L1 (direct), L2 (two-step), L3 (network)
- Beta distribution sampling for activity variability sigma_i
- Saltelli (2002) estimator for Sobol' first-order (Si) and total-order (Ti) indices
- Ne in {64, 128, 256, 512, 1024} sample sizes
- Network resonance index Rnet with P(Rnet > 1) exceedance probability
- Four-quadrant resonance map (V(Of_i) vs Phi_i)
- Full Sobol ranking table with bar chart visualisation
- Export JSON for reproducibility
- Preloaded UCAV case (14 activities, 52 active pairs, 312 tensor components)

---

## Data and the Formal Proof

The `data/` folder contains the UCAV case inputs and the formal proof.

**Case data (JSON).**

- `UCAV_source_verified_S12.json` — the UCAV case data (dependency matrix, rework probabilities and impacts, durations and costs) verified cell by cell against Browning & Eppinger (2002) and corroborated by the interface tables of Browning (1998). This is the dataset underlying the source-verification step of the extension study (Section 4.1).
- `UCAV_FEBS_full_v1.json` — the full six-aspect coupling tensor for the UCAV case.
- `UCAV_tensor_B_v1.json` — the reviewed v1 tensor, rescaled to the norm constraint (norm_w = published rework probability). It carries, for each of the 52 interfaces, the per-aspect profile, the rescaled vector, and the review rationale with references to the source documentation. This file documents the systematic pair-by-pair review described in Section 4.2 (nineteen profiles confirmed, thirty-three corrected under the two-branch Control rule). Harmonisation with a second independent elicitation (-> v2) is pending.
- `UCAV_FEBS_reduction_test2.json` — the configuration for the FEBS->B-E reduction test (Section 5.2).

**Formal proof.**

- `data/PROOF_FEBS_extends_Browning-Eppinger.md` (English)
- `data/PROOF_FEBS_estende_Browning-Eppinger.md` (Italian)

The proof establishes that FEBS **extends** the Browning-Eppinger model — containing it as a particular case (Thesis 1) while producing outputs no B-E configuration can produce (Thesis 2). All numerical values were verified at machine precision by running the FEBS Simulator (v6.0.2) on the UCAV case. The proof is the supplementary material of the extension study; its results are summarised in that article's "Formal foundation" section.

---

## Verification

The toolkit ships dependency-free verification scripts under `tests/`.

`tests/sobol_saltelli_verification.py` benchmarks the FRAME-Q Saltelli estimator against the Ishigami function, whose Sobol' indices are known analytically.

**Requirements:** Python >= 3.8, NumPy, SciPy

```
pip install numpy scipy
python tests/sobol_saltelli_verification.py
```

**Expected output (all checks at Ne = 2048):**

```
x1: Si error = 0.0009 (ok), Ti error = 0.0071 (ok)  [PASS]
x2: Si error = 0.0006 (ok), Ti error = 0.0021 (ok)  [PASS]
x3: Si error = 0.0018 (ok), Ti error = 0.0002 (ok)  [PASS]
ALL CHECKS PASSED
```

The Node scripts (no dependencies) verify the B-E and FEBS engines directly:

```
node tests/be_published_replication.js        # replicates the published UCAV baseline (Table V)
node tests/febs_be_reduction_equivalence.js    # verifies the FEBS->B-E reduction to machine precision
node tests/frameq_sigma_regression.js          # FRAME-Q variability-handling regression
```

The Ishigami x3 variable (S3 = 0.000, T3 = 0.244) is the canonical mathematical example of the **silent multiplier** phenomenon: a parameter with zero direct effect but dominant interaction effects. The FRAME-Q UCAV analysis identifies A2 ('Create Preliminary Design Architecture') as a silent multiplier with S2 approx 0.000 and T2 = 0.741, confirming that the phenomenon occurs in real process coupling networks.

---

## Shared JSON Format

A single FRAME-6 elicitation session can feed all three simulators. The shared format:

```
{
  "activities": ["A1", "A2", ...],
  "m_pairs": {
    "i,j": [cI, cO, cP, cR, cC, cT]
  },
  "impact": { "i,j": value },
  "prob":   { "i,j": value }
}
```

Export from FEBS -> import into FRAME-Q eliminates data re-entry.

---

## The UCAV Benchmark Case

All three simulators ship with the UCAV (Unmanned Combat Air Vehicle) design process case, originally published in Browning (1998) and used as the running example in Browning & Eppinger (2002). The case comprises 14 design activities with 52 active dependency pairs. It serves as the common benchmark for comparing B-E, FEBS, and FRAME-Q results on the same process.

---

## Citation

If you use `dsm-fram-toolkit` in your research, please cite:

```
@article{grazzini2026toolkit,
  author  = {Grazzini, Daniele},
  title   = {dsm-fram-toolkit: A browser-based simulator suite for DSM--FRAM
             integration and functional resonance risk analysis},
  journal = {Journal of Open Source Software},
  year    = {2026},
  doi     = {10.21105/joss.XXXXX}
}
```

See also `CITATION.cff` for full citation metadata.

---

## Related Publications

- Grazzini, D., Pourghadiri, P. (2026). *FEBS: extending the Browning-Eppinger stochastic model with a six-aspect FRAM coupling tensor.* (Extension study; UCAV case, FEBS->B-E reduction, and the formal proof in `data/`.) Working paper.
- Grazzini, D. (2026). *FRAM Extended Browning-Eppinger Simulation (FEBS): a multidimensional coupling model for functional resonance risk assessment.* Proceedings of the International DSM Conference, Milan.
- Grazzini, D., Pourghadiri, P. (2026). *FRAME-Q: Functional Resonance Analysis Method Extended and Quantified.* Working paper.
- Grazzini, D. et al. (2024). *Development of a method for comparing industrial processes using DSM: the SeatBridge patent.* Proceedings of the International DSM Conference, Stuttgart.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contributing

Issues, questions, and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
