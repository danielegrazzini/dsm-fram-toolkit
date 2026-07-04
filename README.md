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
| **B-E Simulator** | Full Browning-Eppinger (2002) stochastic process simulation | E[S], σ[S], P[S], Interface Criticality |
| **FEBS Simulator** | FRAM-Extended B-E — replaces scalar weights with 6D coupling tensors | Interface Resonance Risk (IRR) |
| **FRAME-Q Simulator** | Network variability propagation + Saltelli (2002) global sensitivity analysis | Rnet, Sobol Sᵢ and Tᵢ |

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
│   ├── BE_Simulator_v5.html        # Browning-Eppinger 2002 stochastic simulation
│   ├── FEBS_Simulator_v6.html      # FRAM-Extended B-E Simulation
│   └── FRAMEQ_Simulator.html       # FRAME-Q variability propagation + Sobol analysis
├── tests/
│   └── sobol_saltelli_verification.py  # Analytical benchmark (Ishigami function)
├── docs/
│   ├── FRAME6_Protocol_EN.docx     # Structured elicitation protocol for tensor M
│   └── BE_Model_Guide.docx         # B-E simulator user guide
├── paper.md                        # JOSS paper
├── paper.bib                       # Bibliography
├── CITATION.cff                    # Citation metadata
└── LICENSE                         # MIT License
```

---

## Simulators

### B-E Simulator v5

A complete implementation of the Browning & Eppinger (2002) process simulation model.

**Features:**
- Triangular distribution sampling (BCV / MLV / WCV) with Latin Hypercube Sampling
- Cost-duration correlation via Normal copula (ρ = 0.9 default)
- First- and second-order rework propagation
- All 10 schedule and cost risk metrics from Table V of Browning & Eppinger (2002)
- Interface Criticality analysis (analytic and empirical)
- Multi-architecture comparison with minimum highlighting
- Import/export in MIT DSM format and JSON
- Preloaded UCAV design process case (Browning, 1998)

### FEBS Simulator v6

Extends B-E by replacing scalar rework probabilities with six-dimensional coupling tensors.

**Features:**
- FRAME-6 structured elicitation panel for all 6 FRAM aspects per active pair
- Weighted Euclidean norm aggregation of tensor components
- Interface Resonance Risk (IRR) index per activity
- Full Monte Carlo simulation with empirical rework frequency tracking
- Sobol sensitivity analysis on E[S] (forthcoming extension)
- Export tensor M in shared JSON format for FRAME-Q import
- Preloaded UCAV case with full tensor M

**The FRAME-6 aspects:**

| Aspect | Central question |
|--------|-----------------|
| Input (I) | Does j provide the trigger that starts or re-orients i? |
| Output (O) | Does a variation in j's output alter the technical context of i? |
| Precondition (P) | Must the state established by j exist before i can proceed? |
| Resource (R) | Do j and i share resources, or does j produce tools that i uses? |
| Control (C) | Does j define constraints on how i must carry out its work? |
| Time (T) | Is the timing of j critical for the operational window of i? |

### FRAME-Q Simulator

Implements network-level variability propagation and global sensitivity analysis.

**Features:**
- Three-level propagation: L1 (direct), L2 (two-step), L3 (network)
- Beta distribution sampling for activity variability σᵢ
- Saltelli (2002) estimator for Sobol' first-order (Sᵢ) and total-order (Tᵢ) indices
- Ne ∈ {64, 128, 256, 512, 1024} sample sizes
- Network resonance index Rnet with P(Rnet > 1) exceedance probability
- Four-quadrant resonance map (V(Ofᵢ) vs Φᵢ)
- Full Sobol ranking table with bar chart visualisation
- Export JSON for reproducibility
- Preloaded UCAV case (14 activities, 52 active pairs, 312 tensor components)

---

## Verification

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

---

## Shared JSON Format

A single FRAME-6 elicitation session can feed all three simulators. The shared format:

```json
{
  "activities": ["A1", "A2", ...],
  "m_pairs": {
    "i,j": [cI, cO, cP, cR, cC, cT]
  },
  "impact": { "i,j": value },
  "prob":   { "i,j": value }
}
```

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

See also `CITATION.cff` for full citation metadata.

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
