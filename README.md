# dsm-fram-toolkit

**A browser-based simulator suite for DSM–FRAM integration and functional resonance risk analysis**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![JOSS](https://joss.theoj.org/papers/placeholder/badge.svg)](paper.md)

---

## Overview

`dsm-fram-toolkit` provides three browser-based simulation tools that operationalise a quantitative integration between the **Design Structure Matrix (DSM)** methodology and the **Functional Resonance Analysis Method (FRAM)**. No installation is required — every simulator runs as a self-contained HTML file in any modern web browser.

The three simulators form a progressive analytical hierarchy:

| Simulator | Description | Key output |
|-----------|-------------|------------|
| **B-E Simulator v7** | Full Browning-Eppinger (2002) stochastic process simulation | E[S], σ[S], P[S], Interface Criticality |
| **FEBS Simulator v6** | FRAM-Extended B-E — replaces scalar weights with 6D coupling tensors | Interface Resonance Risk (IRR) |
| **FRAME-Q Simulator S29** | Network variability propagation + Saltelli (2002) global sensitivity analysis | Rnet, Sobol Sᵢ and Tᵢ |

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
├── simulators/
│   ├── DSM_B-E_Simulator_v7.html       # Browning-Eppinger 2002 stochastic simulation
│   ├── FEBS_Simulator_v6.html          # FRAM-Extended B-E Simulation
│   └── FRAMEQ_Simulator.html           # FRAME-Q variability propagation + Sobol analysis (S29)
├── tests/
│   ├── sobol_saltelli_verification.py  # Analytical benchmark (Ishigami function)
│   └── frameq_sigma_regression.js      # FRAME-Q sigma handling and non-regression suite
├── .github/workflows/
│   └── draft-pdf.yml                   # JOSS paper draft compilation
├── CHANGELOG.md                        # Version history
├── README.md                           # This file
├── paper.md                            # JOSS paper
├── paper.bib                           # Bibliography
├── CITATION.cff                        # Citation metadata
└── LICENSE                             # MIT License
```

---

## Simulators

### B-E Simulator v7

A complete implementation of the Browning & Eppinger (2002) process simulation model.

**Features:**
- Triangular distribution sampling (BCV / MLV / WCV) with Latin Hypercube Sampling
- Cost-duration correlation via Normal copula (ρ = 0.9 default)
- First- and second-order rework propagation
- All 10 schedule and cost risk metrics from Table V of Browning & Eppinger (2002)
- Interface Criticality analysis (analytic and empirical)
- Multi-architecture comparison with minimum highlighting
- Import/export in MIT DSM format, JSON, and the shared Toolkit JSON format
- Preloaded UCAV design process case (Browning, 1998)

### FEBS Simulator v6

Extends B-E by replacing scalar rework probabilities with six-dimensional coupling tensors.

**Features:**
- FRAME-6 structured elicitation panel for all 6 FRAM aspects per active pair
- Weighted Euclidean norm aggregation of tensor components
- Interface Resonance Risk (IRR) index per activity
- Full Monte Carlo simulation with empirical rework frequency tracking
- Sobol sensitivity analysis on E[S] (forthcoming extension)
- Export tensor M in the shared Toolkit JSON format for FRAME-Q import
- Preloaded UCAV case with full tensor M

**The FRAME-6 aspects:**

For a coupling pair keyed `"i,j"` — read as *activity i depends on activity j* — each aspect asks:

| Aspect | Central question |
|--------|-----------------|
| Input (I) | Does j provide the trigger that starts or re-orients i? |
| Output (O) | Does a variation in j's output alter the technical context of i? |
| Precondition (P) | Must the state established by j exist before i can proceed? |
| Resource (R) | Do j and i share resources, or does j produce tools that i uses? |
| Control (C) | Does j define constraints on how i must carry out its work? |
| Time (T) | Is the timing of j critical for the operational window of i? |

### FRAME-Q Simulator (S29)

Implements network-level variability propagation and global sensitivity analysis.

**Features:**
- Three-level propagation: L1 (direct), L2 (two-step), L3 (network)
- Beta distribution sampling for activity variability σᵢ, with concentration ν ∈ [2, 50]
- Elicited σᵢ as a first-class input, with the duration-derived proxy as fallback (see below)
- Saltelli (2002) estimator for Sobol' first-order (Sᵢ) and total-order (Tᵢ) indices
- Ne ∈ {16, 32, 64, 128, 256, 512, 1024, 2048, 4096} sample sizes
- Network resonance index Rnet with P(Rnet > 1) exceedance probability
- Four-quadrant resonance map (V(Ofᵢ) vs Φᵢ)
- Full Sobol ranking table with bar chart visualisation
- Import/export in the shared Toolkit JSON format
- Preloaded UCAV case (14 activities, 52 active pairs, 312 tensor components)

#### Two ways to obtain σᵢ

Every activity requires **either** an elicited σᵢ **or** a complete BCV/MLV/WCV duration triple.

- **Elicited σᵢ (FRAME-6)** — the intrinsic performance variability of the function, judged
  directly against a variability taxonomy. This is the quantity FRAME-Q defines.
- **Derived σᵢ (Browning-Eppinger inheritance)** — `(WCV − BCV) / (6 · MLV)`, the relative
  spread of the duration triple. Used whenever no elicited σ is supplied: this is the case for
  B-E datasets, including the bundled UCAV example.

The two modes coexist within the same model. Where an elicited σ is present, it wins.

The identity *variability = schedule dispersion* holds in B-E, whose object is schedule and cost
risk. It does not hold in general: a function's variability is not a property of how long it
takes, and functions that are not scheduled activities may have real variability and no duration
at all. Since S29, such models are first-class citizens.

`Rnet` weights follow duration share when **all** activities carry durations, and are uniform
`1/n` otherwise. `Rᵢ` and its ranking never depend on these weights — they are duration-free.
State the weighting convention in use whenever `Rnet` is reported.

---

## Verification

### Sobol estimator — analytical benchmark

The script `tests/sobol_saltelli_verification.py` benchmarks the FRAME-Q Saltelli estimator against the Ishigami function, which has known analytical Sobol' indices.

**Requirements:** Python ≥ 3.8, NumPy, SciPy

```bash
pip install numpy scipy
python tests/sobol_saltelli_verification.py
```

**Expected output (all checks at Ne = 2048):**

```
x1: Si error = 0.0009 (ok), Ti error = 0.0071 (ok)  [PASS]
x2: Si error = 0.0006 (ok), Ti error = 0.0021 (ok)  [PASS]
x3: Si error = 0.0018 (ok), Ti error = 0.0002 (ok)  [PASS]
✓ ALL CHECKS PASSED
```

The Ishigami x₃ variable (S₃ = 0.000, T₃ = 0.244) is the canonical mathematical example of the **silent multiplier** phenomenon: a parameter with zero direct effect but dominant interaction effects. The FRAME-Q UCAV analysis identifies A2 ('Create Preliminary Design Architecture') as a silent multiplier with S₂ ≈ 0.000 and T₂ = 0.741, confirming that the phenomenon occurs in real process coupling networks.

### FRAME-Q σ handling — regression suite

The script `tests/frameq_sigma_regression.js` verifies that σᵢ is taken from the elicited value when present, that the duration-derived fallback reproduces the pre-S29 behaviour exactly, and that the input guards hold. It extracts the `<script>` block from the simulator HTML and runs it in a Node vm context with a minimal DOM stub.

**Requirements:** Node ≥ 14. No dependencies, no browser.

```bash
node tests/frameq_sigma_regression.js simulators/FRAMEQ_Simulator.html
```

**Expected output:** 18 assertions across four groups — UCAV non-regression, elicited σ path, mixed mode, input guards — ending in `ALL TESTS PASSED` with exit code 0. The UCAV group asserts that σ and the Rnet weights are identical to the pre-S29 values to zero difference, and that Rnet = 1.040429 on 13 valid functions is reproduced exactly.

---

## Shared JSON Format

A single FRAME-6 elicitation session can feed all three simulators. Every simulator imports and exports `dsm-fram-toolkit-v1`:

```json
{
  "_schema": "dsm-fram-toolkit-v1",
  "_description": "Shared format for B-E, FEBS and FRAME-Q simulators",
  "_source": "FRAME-Q",
  "timestamp": "2026-07-17T09:00:00.000Z",
  "activities": [
    { "id": 1, "name": "Prepare UCAV Preliminary DR&O", "desc": "",
      "bcv": 2.0, "mlv": 3.0, "wcv": 5.0 },
    { "id": 2, "name": "Develop procedural guidance", "desc": "",
      "sigma": 0.25 }
  ],
  "nu": 10,
  "m_pairs": {
    "2,1": [0.9, 0.7, 0.85, 0.2, 0.75, 0.5]
  },
  "binary_dsm": [[0, 0], [1, 0]]
}
```

**Key convention.** In `m_pairs`, the key `"i,j"` means **Aᵢ ← Aⱼ**: the first index is the
**receiver** (the dependent activity), the second is the **source** (the provider). So `"2,1"`
reads *A2 depends on A1*. The component order is `[cI, cO, cP, cR, cC, cT]`, matching the
FRAME-6 aspects table above. `binary_dsm[i-1][j-1] = 1` mirrors the same orientation.

**Fields.** `activities[].sigma` is the elicited σ (FRAME-Q); the duration triple
`bcv`/`mlv`/`wcv` is used by B-E and FEBS, and by FRAME-Q as the σ fallback. An activity needs
at least one of the two. `nu` is the Beta concentration used by FRAME-Q. FRAME-Q also emits an
optional `sobol_results` block after a run.

Export from FEBS → import into FRAME-Q eliminates data re-entry.

---

## The UCAV Benchmark Case

All three simulators ship with the UCAV (Unmanned Combat Air Vehicle) design process case, originally published in Browning (1998) and used as the running example in Browning & Eppinger (2002). The case comprises 14 design activities with 52 active dependency pairs. It serves as the common benchmark for comparing B-E, FEBS, and FRAME-Q results on the same process.

---

## Citation

If you use `dsm-fram-toolkit` in your research, please cite:

```bibtex
@article{grazzini2026toolkit,
  author  = {Grazzini, Daniele},
  title   = {dsm-fram-toolkit: A browser-based simulator suite for DSM--FRAM 
             integration and functional resonance risk analysis},
  journal = {Journal of Open Source Software},
  year    = {2026},
  doi     = {10.21105/joss.XXXXX}
}
```

See also `CITATION.cff` for full citation metadata, and `CHANGELOG.md` for version history.

---

## Related Publications

- Grazzini, D. (2026). FEBS: FRAM-Extended Browning-Eppinger Simulation for functional resonance risk assessment. *Proceedings of DSM 2026*, Milan.
- Grazzini, D., Browning, T.R., & Pourghadiri, P. (2026). FRAME-Q: Functional Resonance Analysis Method Extended and Quantified. *Working paper*.
- Grazzini, D. et al. (2024). Development of a method for comparing industrial processes using DSM: the SeatBridge patent. *Proceedings of DSM 2024*, Stuttgart.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contributing

Issues, questions, and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
