# Formal proof: FEBS extends the Browning-Eppinger model

*Supplementary material for the article:*
*D. Grazzini, "FEBS: extending the Browning-Eppinger stochastic model with a six-aspect FRAM coupling tensor".*

*This document contains the complete formal proof of the relationship between FEBS and the Browning-Eppinger model, summarised in the "Formal foundation" section of the article. All numerical values were verified at machine precision by running the simulator code published in this repository (FEBS v6.0.2, SHA 9932c988401e92b9) on the UCAV case dataset. The notation follows the nomenclature table of the article.*

*How to cite: if you use this proof, cite the main article.*

---

This appendix formally proves the relationship between FEBS and the Browning-Eppinger model stated in the body of the article, through two propositions: containment (B-E as a particular case of FEBS) and proper extension (FEBS not equivalent to B-E).

## Structure of the proof

To prove that FEBS **extends** Browning-Eppinger (B-E), two distinct propositions must be established:

- **Thesis 1 (Containment).** B-E is a particular case of FEBS: there exists a configuration of the FEBS parameters such that, for every B-E input, the FEBS output coincides with the B-E output.
- **Thesis 2 (Proper extension).** FEBS is not equivalent to B-E: there exist FEBS outputs that no B-E configuration can produce.

## Step A.1 — Formalisation of the two models

**B-E model.** The input is a pair of scalar matrices: DSM¹ ∈ [0,1]^{n×n} (rework probability) and DSM² ∈ [0,1]^{n×n} (rework impact). The probability that activity *i* requires rework because of *j* is P^BE_ij = DSM¹_ij. The B-E Monte Carlo uses P^BE_ij and DSM²_ij as direct parameters.

**FEBS model.** The input is a tensor M ∈ [0,1]^{n×n×6}, with C_ij = [c_I, c_O, c_P, c_R, c_C, c_T], and a matrix IMPACT ∈ [0,1]^{n×n}. The FEBS pipeline transforms M into P^FEBS through four operators:

    ‖C_ij‖_w = √( Σ_k w_k · c_k² )                    [weighted norm]
    θ = F⁻¹(p)  over  {‖C_ij‖ : (i,j) ∈ ℰ}            [adaptive threshold]
    S_ij = 0            if  ‖C_ij‖ < θ                [activation]
    S_ij = ‖C_ij‖^β    if  ‖C_ij‖ ≥ θ   (β ≥ 1)
    P^FEBS_ij = P_base · ( S_ij / S_max )              [normalisation]

The FEBS Monte Carlo uses P^FEBS_ij in place of P^BE_ij, and IMPACT in place of DSM², **with the same simulation engine as B-E**: contiguous banding on the binary structure, first-order rework, second-order rework, Normal copula ρ, and LHS sampling. FEBS replaces exclusively the front-end that generates the rework probabilities.

*Note on the shared engine.* Second-order rework propagates to the activities downstream of the triggering activity, according to the semantics k = j+1, …, n of the Browning-Eppinger model (2002, p. 430), which the FEBS implementation adopts. What the two proofs require is not a particular propagation radius, but that B-E and FEBS **share the same engine**: Thesis 1 holds for any rework semantics, provided it is common to the two models. The coincidence of the inclusive semantics between FEBS and Browning-Eppinger is verified in Section 5.1 of the article, where it is precisely what allows the replication of the published results to succeed.

## Step A.2 — Construction of the degenerate limit (Thesis 1)

We must find a FEBS configuration such that P^FEBS_ij = P^BE_ij for every (i,j) and IMPACT_ij = DSM²_ij.

**Choice of the tensor.** Uniform vector with α_ij ∈ [0,1]: C_ij = [α_ij, α_ij, α_ij, α_ij, α_ij, α_ij]. With uniform weights w_k = 1/6:

    ‖C_ij‖_w = √( Σ_k (1/6)·α_ij² ) = √( 6·(1/6)·α_ij² ) = α_ij

The norm coincides with α_ij: the tensor structure collapses into a scalar matrix. *(Verified: for α ∈ {0.1, 0.3, 0.5, 0.75, 1.0} the identity ‖[α×6]‖_w = α holds at machine precision.)*

**Choice of p and β.** With p at the minimum percentile, θ = min‖C‖ and the condition ‖C‖ ≥ θ is satisfied by all pairs: none dormant (in the simulator, p = 1). With β = 1 — a value admitted by the model, not merely a limit — one has S_ij = ‖C_ij‖¹ = α_ij. The degenerate case is therefore an **exactly reachable** configuration, not an asymptotic limit.

**Choice of P_base.** With P_base = S_max = max_{(i,j)} α_ij:  P^FEBS_ij = P_base · (α_ij / S_max) = α_ij.

**Choice of α_ij.** Setting α_ij = DSM¹_ij:  P^FEBS_ij = α_ij = DSM¹_ij = P^BE_ij.

**Conclusion of Thesis 1.** With the configuration C_ij = [α×6] (α = DSM¹_ij), IMPACT_ij = DSM²_ij, β = 1, p = p_min, P_base = max DSM¹, w_k = 1/6, one has P^FEBS = P^BE and IMPACT = DSM² (with the sole condition DSM¹ ≢ 0, needed so that S_max > 0). Since the Monte Carlo engine is by construction the same, the two models produce the same joint distribution of (S, C) and therefore all derived metrics: E[S], σ_S, E[C], σ_C, γ_S, γ_C, P_S, P_C, R_S, R_C. The IRR does not appear in the list because it is an output exclusive to FEBS (Step A.5). *Numerical validation: on the UCAV case (52 pairs) the construction reproduces P^FEBS = DSM¹ with a maximum error of 5.6·10⁻¹⁷ (machine precision); the equivalence of the two simulation engines is confirmed by the strong-equivalence test of Section 5.2.*  ∎

## Step A.3 — Non-uniqueness of the reduction

Any configuration with ‖C_ij‖_w = DSM¹_ij for every (i,j), θ ≤ min‖C_ij‖ (all pairs active), β = 1, and P_base = max DSM¹ produces P^FEBS_ij = DSM¹_ij. The sphere of radius DSM¹_ij in ℝ⁶ (weighted metric) contains infinitely many families of vectors with the correct norm: the reduction is compatible with the entire tensor structure, it is not an isolated case. (The norm constraint adopted for the tensor of the UCAV case in Section 4.2 of the article exploits exactly this freedom: it fixes the norm at the published value while leaving the direction free, which is the elicited information.)

## Step A.4 — Computational distinguishability (Thesis 2)

To prove proper extension, one must show that FEBS computes different outputs for systems that B-E cannot distinguish — not merely that it admits different representations of them.

**Preliminary observation (self-normalisation).** The map P_ij = P_base·(S_ij/S_max) is invariant under global rescaling of the norms: in a system with a single coupled pair, S_ij = S_max by construction and P_ij = P_base whatever the tensor. *(Verified: with C = [1,0,0,0,0,0] and C = [0,0,0,1,0,0] on a single pair, P = P_base exactly in both cases.)* The counterexample therefore requires at least two pairs: only the *relative* structure of the norms is informative.

**Construction.** Two systems A and B of three functions with identical structure: test pair (1←2, feedback), feed-forward pairs (3←1) and (3←2). The pair (3←2) has a full tensor [1,1,1,1,1,1] identical in A and B and fixes S_max = 1; the pair (3←1) is identical in the two systems. The systems differ **only** in the test pair:

    System A:  C^A_{12} = [1,0,0,0,0,0]   (Input dependency)
    System B:  C^B_{12} = [0,0,0,1,0,0]   (Resource dependency)

Parameters: w_I = 0.40, w_R = 0.05 (the other four weights 0.15, 0.15, 0.15, 0.10), β = 1.5, P_base = 0.5, p at the minimum percentile, IMPACT identical in the two systems.

**What B-E sees.** The B-E input format has a single scalar DSM¹_{12} for the test pair. A and B differ exclusively in the FRAM aspect on which the dependency insists — information that the scalar format cannot encode: for a given elicited knowledge, the B-E description of A and of B is the same, and therefore so is every B-E output.

**What FEBS computes.** The weighted norms of the test pair are ‖C^A‖_w = √0.40 = 0.632 and ‖C^B‖_w = √0.05 = 0.224. With S_max = 1: P^A_{12} = 0.5·(0.632)^1.5 = 0.2515 and P^B_{12} = 0.5·(0.224)^1.5 = 0.0529 *(both verified exactly)*. The Monte Carlo (40,000 runs, deterministic durations to isolate the effect) produces measurably different distributions: E[S]^A = 10.76 versus E[S]^B = 10.16 (+5.9%), E[C]^A = 31.52 versus E[C]^B = 30.31 (+4.0%), σ_S^A = 1.30 versus σ_S^B = 0.67 — with exact analytical verification E[S] = 10 + 3P, E[C] = 30 + 6P *(recomputation: E[S]^A = 10.75, E[S]^B = 10.16, E[C]^A = 31.51, E[C]^B = 30.32, in agreement within rounding)*.

**Interpretation.** A has an Input dependency (if function 1 changes its output, function 2 must start over). B has a Resource dependency (1 and 2 compete for shared resources; the degradation of 2 occurs independently of the success of 1). FEBS distinguishes them through the weights; B-E cannot.  ∎

## Step A.5 — The corollary on the IRR

The IRR is a second piece of evidence for proper extension, independent of Step A.4. In B-E the closest metric is the per-pair interface criticality:

    Crit_{ij} = DSM¹_{ij} · DSM²_{ij} · κ_j · MLV_j

aggregated over the couplings incoming to function i:  Crit_i^{in} = Σ_j DSM¹_{ij} · DSM²_{ij} · κ_j · MLV_j.
The FEBS resonance index is:

    IRR_i = [ Σ_{j∈𝒩_i} S_ij · IMPACT_ij ] · κ_i · MLV_i · ( 1 + freq_i / r )

The two quantities differ for four reasons:

1. **Dormancy.** In B-E the sum is over all j with DSM¹_ij > 0; in FEBS only over j with S_ij > 0 (norm above θ). Weak couplings are structurally excluded.
2. **Superlinear amplification.** S_ij = ‖C_ij‖^β with β > 1 amplifies strong couplings non-linearly; in B-E the probability is linear in DSM¹_ij.
3. **Dynamic component.** The factor (1 + freq_i/r) incorporates the empirical count of the rework events striking i during the r runs; B-E does not track this counter.
4. **Own vs counterpart weighting.** Both sum over the couplings incoming to i, but Crit_i^{in} weights each interface with the properties of the counterpart j (κ_j · MLV_j, the cost of re-executing j), whereas the IRR weights the whole row with the systemic properties of i (κ_i · MLV_i, its propagative capacity as a future source). The two metrics answer different questions and are not reducible to one another by rescaling.

**Conclusion.** IRR_i ≠ Crit_i^{in} for the four reasons. Equality holds only in the degenerate case (p = p_min, β = 1, structural form with freq_i/r = 0, κ and MLV homogeneous), which is the B-E limit of Step A.2. The IRR is an output that no B-E configuration can produce in the general form.  ∎

## Step A.6 — Formal synthesis

The relationship between the two models is:

    ∃ f : Param_BE → Param_FEBS   s.t.   Output_FEBS(f(x)) = Output_BE(x)   ∀x

On the common output space alone (the S and C metrics) there also exists an inverse map, the canonical projection of the pipeline. Proper extension therefore does **not** reside in the expressiveness of the parameter space with respect to (S, C), but in two independent and stronger facts:

- **(i) The FEBS output space strictly contains that of B-E:** IRR, freq, and the dormancy structure do not belong to Output_BE (Step A.5).
- **(ii) The projection π : Param_FEBS → Param_BE is many-to-one with fibres distinguishable in output:** there exist y ≠ y′ with an identical description expressible in B-E and Output_FEBS(y) ≠ Output_FEBS(y′) (Step A.4).

The first relationship is Thesis 1: B-E embeds into FEBS through the construction of Step A.2, with identity verified at machine precision on the UCAV case. The second is Thesis 2: proper extension is witnessed by two independent facts — under non-uniform weights FEBS produces different distributions for systems that B-E describes identically (Step A.4), and the IRR is an output that B-E cannot compute without modifying its own architecture (Step A.5).

FEBS is therefore a **strict informational refinement** of B-E: it does not replace it, does not modify it, but contains it as a proper subset of its family of models.  ∎

---
