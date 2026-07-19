---
title: 'dsm-fram-toolkit: A browser-based simulator suite for DSM–FRAM integration and functional resonance risk analysis'
tags:
  - Design Structure Matrix
  - Functional Resonance Analysis Method
  - sensitivity analysis
  - sociotechnical systems
  - process simulation
  - safety engineering
authors:
  - name: Daniele Grazzini
    orcid: 0009-0001-4800-6191
    affiliation: 1
affiliations:
  - name: Independent Researcher, Rome, Italy
    index: 1
date: 2026-06-01
bibliography: paper.bib
---

# Summary

`dsm-fram-toolkit` is a suite of three browser-based simulation tools that operationalise a quantitative integration between the Design Structure Matrix (DSM) methodology and the Functional Resonance Analysis Method (FRAM). The toolkit requires no installation and runs in any modern web browser as self-contained HTML applications.

The suite comprises three simulators. The **Browning-Eppinger (B-E) Simulator** implements the stochastic process simulation model of @browning2002 in full, including Latin Hypercube Sampling, first- and second-order rework propagation, and the complete set of ten schedule and cost risk metrics from the original paper. The **FEBS Simulator** (FRAM-Extended Browning-Eppinger Simulation) extends the B-E model by replacing scalar rework probabilities with six-dimensional coupling tensors aligned to the six FRAM aspects (Input, Output, Precondition, Resource, Control, Time), introducing the Interface Resonance Risk (IRR) index as a function-level risk metric. The **FRAME-Q Simulator** (Functional Resonance Analysis Method Extended and Quantified) implements a three-level variability propagation model and a full global sensitivity analysis using the @saltelli2002 estimator for Sobol' indices [@sobol2001], producing first-order and total-order sensitivity indices for all coupling parameters and activity variability parameters simultaneously.

The three simulators share a common JSON elicitation format so that a single expert session using the FRAME-6 structured protocol [@grazzini2026frameq] feeds all three analyses without data re-entry. A standalone Python verification script (`tests/sobol_saltelli_verification.py`) benchmarks the FRAME-Q Saltelli estimator against the analytical solutions of the Ishigami function [@ishigami1990], confirming correctness to within Monte Carlo sampling error across sample sizes Ne ∈ {512, 1024, 2048, 4096}.

# Statement of Need

Two well-established methodological traditions address the complexity of engineering and sociotechnical processes, but from different perspectives. The Design Structure Matrix (DSM) provides a matrix-based, quantitative framework for representing and analysing dependencies between process activities, with proven algorithms for partitioning, clustering, and stochastic simulation of cost and schedule risk [@eppinger2012]. The Functional Resonance Analysis Method (FRAM) provides a qualitative, function-based model of how everyday performance variability can couple and amplify through sociotechnical systems, producing emergent outcomes that are invisible to structural analysis alone [@hollnagel2012].

Despite their complementarity, no computational tool currently supports their integration. DSM tools (MIT spreadsheets, commercial DSM software) operate on scalar dependency weights and have no mechanism for representing the multidimensional coupling structure that FRAM identifies. FRAM tools (FMV, FMI) support qualitative modelling and sequential interpretation but provide no quantitative risk metrics or global sensitivity analysis.

`dsm-fram-toolkit` addresses this gap by providing three simulators that form a progressive hierarchy: B-E (scalar, probabilistic) $\subset$ FEBS (tensorial, resonance-aware) $\subset$ FRAME-Q (propagation-based, sensitivity-analysed). Each level adds analytical capability while remaining backwards-compatible with the previous. The FEBS degenerate-case property guarantees that when the six-dimensional tensor reduces to a uniform scalar, all FEBS metrics reduce exactly to their B-E equivalents; the toolkit ships an automated test that demonstrates this reduction numerically (see Verification).

The target audience is researchers and practitioners in systems engineering, safety science, resilience engineering, and complex process design who need to: (1) quantify functional resonance risk at the activity level, (2) identify which coupling parameters or activity variability parameters govern systemic risk through interaction effects (the "silent multiplier" phenomenon), and (3) validate integration hypotheses between DSM and FRAM representations of the same process.

# State of the Field

Existing software tools address portions of this problem space but none covers the full DSM–FRAM integration.

For DSM analysis, the MIT Process DSM spreadsheet [@eppinger2012] implements the B-E simulation model but does not expose sensitivity analysis or multidimensional coupling. Commercial tools such as Lattix and DSM This Week provide structural analysis but no stochastic simulation. For FRAM analysis, the FRAM Model Visualizer (FMV) and FRAM Model Interpreter (FMI) support model construction and sequential interpretation but provide no quantitative risk indices. The Monte Carlo FRAM extension of @patriarca2017 introduces stochastic simulation of FRAM instances but does not connect to DSM representations or provide global sensitivity analysis.

The approach of @falegnami2020, which reinterprets FRAM instances as multilayer networks and applies network centrality metrics, is the closest precursor to FRAME-Q. The present toolkit extends this line of work by introducing a structured elicitation protocol (FRAME-6), a tensor-based coupling representation, and a validated global sensitivity analysis engine, making the results reproducible and the methodology accessible without programming skills.

# Software Design

All three simulators are implemented as self-contained HTML files with embedded JavaScript and CSS. No server infrastructure, package installation, or internet connection is required after the initial load. This design choice reflects the operational context of the intended users: domain experts conducting elicitation sessions in field conditions, researchers replicating published analyses, and educators introducing the methodology without IT support.

**B-E Simulator.** The simulation engine implements the @browning2002 model with the following components: triangular distribution sampling for activity durations and costs using Latin Hypercube Sampling with Normal copula for cost-duration correlation; first-order rework propagation through the dependency matrix; second-order rework propagation for indirect effects; work-in-progress tracking; and computation of all ten metrics from Table V of the original paper (E[S], σ[S], P[S], R[S], E[C], σ[C], P[C], R[C], γ[S], γ[C]). The simulator also provides Interface Criticality analysis and multi-architecture comparison with minimum highlighting.

**FEBS Simulator.** The FEBS engine extends B-E by replacing the scalar rework probability matrix with a six-dimensional tensor M ∈ ℝⁿˣⁿˣ⁶. Each component M_ijk quantifies the coupling intensity from activity j to activity i through FRAM aspect k, elicited via the FRAME-6 structured protocol. Coupling intensity is aggregated via a weighted Euclidean norm. The Interface Resonance Risk (IRR) for each activity integrates coupling intensity, impact fraction, analytic interface criticality, and an empirical rework frequency factor that makes the metric sensitive to actual system dynamics. The Monte Carlo engine runs the full B-E simulation with tensor-weighted rework probabilities and records empirical rework frequencies across all runs.

**FRAME-Q Simulator.** The FRAME-Q engine implements a three-level variability propagation model (L1: direct, L2: two-step, L3: network-level) over activity variability parameters σᵢ and coupling tensor components M_ijk. Global sensitivity analysis uses the @saltelli2002 estimator: two independent N×k sample matrices A and B, with k matrices ABⱼ (A with column j replaced by B's column j). First-order indices Sᵢ and total-order indices Tᵢ are computed according to Equations 21 and 23 of @saltelli2002 respectively. The network resonance index Rnet aggregates individual resonance contributions across the full process graph. A four-quadrant map visualises activities by their variability profile (V(Ofᵢ)) and coupling exposure (Φᵢ).

**FRAME-6 Protocol.** The structured elicitation protocol guides domain experts through the assignment of six coupling values per active activity pair, one for each FRAM aspect. Aspect-specific operational questions, five-anchor rating scales, and critical-distinction rules ensure semantic consistency across elicitators. The protocol supports both single-expert (test-retest proxy) and multi-expert (ICC(2,k) inter-rater agreement) modes.

**Verification.** The toolkit ships three independent, dependency-free verification scripts. `tests/sobol_saltelli_verification.py` (Python) benchmarks the FRAME-Q Saltelli estimator against the Ishigami function [@ishigami1990], whose Sobol' indices are known analytically, and confirms recovery within Monte Carlo sampling error across Ne ∈ {512, 1024, 2048, 4096}. `tests/be_published_replication.js` (Node, no dependencies) extracts the B-E engine from its HTML file and replicates the published @browning2002 UCAV baseline results (Table V) within pre-registered Monte Carlo tolerances. `tests/febs_be_reduction_equivalence.js` (Node, no dependencies) demonstrates the FEBS→B-E reduction on the UCAV case: it verifies that the FEBS pipeline reproduces the scalar B-E rework probabilities to machine precision and that the two Monte Carlo engines are statistically equivalent, turning the degenerate-case property from a claim into a reproducible check. A regression suite for the FRAME-Q variability handling (`tests/frameq_sigma_regression.js`) completes the set.

# Research Impact Statement

The toolkit has been used in two peer-reviewed contributions. The B-E Simulator and FEBS Simulator supported the analysis presented in @grazzini2024, which developed a methodology for comparing industrial processes using DSM applied to the SeatBridge automotive patent case. The FEBS Simulator was central to @grazzini2026febs, presented at the 28th International DSM Conference (Milan, 2026), which introduced the FEBS framework and its mathematical model on a synthetic airport-turnaround case. The reduction of FEBS to the @browning2002 model, and the comparison of the two on the UCAV preliminary-design process, are the subject of a dedicated study in preparation. The FRAME-Q Simulator underpins the working paper @grazzini2026frameq (in preparation with T.R. Browning and P. Pourghadiri), which presents the full FRAME-Q quantitative framework and global sensitivity analysis results.

# AI Usage Disclosure

Claude Sonnet (Anthropic) was used to assist with: code generation for portions of the JavaScript simulation engines; drafting and copy-editing of documentation and paper text; generation of the Python verification script scaffolding. All AI-assisted outputs were reviewed, edited, and validated by the author. All core design decisions — the FEBS tensor representation, the FRAME-6 elicitation protocol, the FRAME-Q propagation model, the IRR index definition, and the research objectives — were made independently by the author. The author is fully responsible for the accuracy, originality, and correctness of all submitted materials.

# Acknowledgements

The author thanks T.R. Browning (Texas Christian University) and P. Pourghadiri (University of Tehran) for discussions that shaped the development of the FRAME-Q framework. The B-E Simulator builds on the process simulation model introduced by T.R. Browning and S.D. Eppinger in their 2002 paper, and the UCAV case study data originally published in T.R. Browning's 1998 doctoral dissertation at MIT.

# References
