# Dimostrazione formale: FEBS estende il modello di Browning-Eppinger

*Materiale supplementare dell'articolo:*
*D. Grazzini, "FEBS: estendere il modello stocastico di Browning-Eppinger con un tensore di accoppiamento a sei aspetti FRAM".*

*Questo documento contiene la dimostrazione formale completa della relazione tra FEBS e il modello di Browning-Eppinger, riassunta nella sezione "Fondamento formale" dell'articolo. Tutti i valori numerici sono stati verificati a precisione di macchina eseguendo il codice del simulatore pubblicato in questo repository (FEBS v6.0.2, SHA 9932c988401e92b9) sul dataset del caso UCAV. La notazione segue la tabella di nomenclatura dell'articolo.*

*Come citare: se si utilizza questa dimostrazione, citare l'articolo principale.*

---

Questa appendice dimostra formalmente la relazione tra FEBS e il modello di Browning-Eppinger enunciata nel corpo dell'articolo, attraverso due proposizioni: il contenimento (B-E caso particolare di FEBS) e l'estensione propria (FEBS non equivalente a B-E).

## Struttura della dimostrazione

Per dimostrare che FEBS **estende** Browning-Eppinger (B-E) occorre stabilire due proposizioni distinte:

- **Tesi 1 (Contenimento).** B-E è un caso particolare di FEBS: esiste una configurazione dei parametri FEBS tale che, per ogni input B-E, l'output FEBS coincide con l'output B-E.
- **Tesi 2 (Estensione propria).** FEBS non è equivalente a B-E: esistono output FEBS che nessuna configurazione B-E può produrre.

## Passo A.1 — Formalizzazione dei due modelli

**Modello B-E.** L'input è una coppia di matrici scalari: DSM¹ ∈ [0,1]^{n×n} (probabilità di rework) e DSM² ∈ [0,1]^{n×n} (impatto del rework). La probabilità che l'attività *i* richieda rework a causa di *j* è P^BE_ij = DSM¹_ij. Il Monte Carlo B-E usa P^BE_ij e DSM²_ij come parametri diretti.

**Modello FEBS.** L'input è un tensore M ∈ [0,1]^{n×n×6}, con C_ij = [c_I, c_O, c_P, c_R, c_C, c_T], e una matrice IMPACT ∈ [0,1]^{n×n}. La pipeline FEBS trasforma M in P^FEBS attraverso quattro operatori:

    ‖C_ij‖_w = √( Σ_k w_k · c_k² )                    [norma pesata]
    θ = F⁻¹(p)  su  {‖C_ij‖ : (i,j) ∈ ℰ}              [soglia adattiva]
    S_ij = 0            se  ‖C_ij‖ < θ                [attivazione]
    S_ij = ‖C_ij‖^β    se  ‖C_ij‖ ≥ θ   (β ≥ 1)
    P^FEBS_ij = P_base · ( S_ij / S_max )              [normalizzazione]

Il Monte Carlo FEBS usa P^FEBS_ij al posto di P^BE_ij, e IMPACT al posto di DSM², **con lo stesso motore di simulazione di B-E**: banding contiguo sulla struttura binaria, rework di primo ordine, rework di secondo ordine, copula Normale ρ e campionamento LHS. FEBS sostituisce esclusivamente il front-end che genera le probabilità di rework.

*Nota sul motore condiviso.* Il rework di secondo ordine si propaga alle attività a valle dell'attività innescante, secondo la semantica k = j+1, …, n del modello di Browning-Eppinger (2002, p. 430), che l'implementazione di FEBS adotta. Ciò che le due dimostrazioni richiedono non è un particolare raggio di propagazione, bensì che B-E e FEBS **condividano lo stesso motore**: la Tesi 1 vale per qualunque semantica di rework, purché comune ai due modelli. La coincidenza della semantica inclusiva tra FEBS e Browning-Eppinger è verificata nella Sezione 5.1 dell'articolo, dove essa è precisamente ciò che consente alla replica dei risultati pubblicati di riuscire.

## Passo A.2 — Costruzione del limite degenere (Tesi 1)

Occorre trovare una configurazione FEBS tale che P^FEBS_ij = P^BE_ij per ogni (i,j) e IMPACT_ij = DSM²_ij.

**Scelta del tensore.** Vettore uniforme con α_ij ∈ [0,1]: C_ij = [α_ij, α_ij, α_ij, α_ij, α_ij, α_ij]. Con pesi uniformi w_k = 1/6:

    ‖C_ij‖_w = √( Σ_k (1/6)·α_ij² ) = √( 6·(1/6)·α_ij² ) = α_ij

La norma coincide con α_ij: la struttura tensoriale collassa in una matrice scalare. *(Verificato: per α ∈ {0.1, 0.3, 0.5, 0.75, 1.0} l'identità ‖[α×6]‖_w = α vale a precisione di macchina.)*

**Scelta di p e β.** Con p al percentile minimo, θ = min‖C‖ e la condizione ‖C‖ ≥ θ è soddisfatta da tutte le coppie: nessuna dormiente (nel simulatore, p = 1). Con β = 1 — valore ammesso dal modello, non solo limite — si ha S_ij = ‖C_ij‖¹ = α_ij. Il caso degenere è dunque una configurazione **raggiungibile esattamente**, non un limite asintotico.

**Scelta di P_base.** Con P_base = S_max = max_{(i,j)} α_ij:  P^FEBS_ij = P_base · (α_ij / S_max) = α_ij.

**Scelta di α_ij.** Ponendo α_ij = DSM¹_ij:  P^FEBS_ij = α_ij = DSM¹_ij = P^BE_ij.

**Conclusione Tesi 1.** Con la configurazione C_ij = [α×6] (α = DSM¹_ij), IMPACT_ij = DSM²_ij, β = 1, p = p_min, P_base = max DSM¹, w_k = 1/6, si ha P^FEBS = P^BE e IMPACT = DSM² (con la sola condizione DSM¹ ≢ 0, necessaria perché S_max > 0). Poiché il motore Monte Carlo è per costruzione lo stesso, i due modelli producono la stessa distribuzione congiunta di (S, C) e quindi tutte le metriche derivate: E[S], σ_S, E[C], σ_C, γ_S, γ_C, P_S, P_C, R_S, R_C. L'IRR non figura nella lista perché è un output esclusivo di FEBS (Passo A.5). *Validazione numerica: sul caso UCAV (52 coppie) la costruzione riproduce P^FEBS = DSM¹ con errore massimo 5.6·10⁻¹⁷ (precisione di macchina); l'equivalenza dei due motori di simulazione è confermata dal test di equivalenza forte della Sezione 5.2.*  ∎

## Passo A.3 — Non-unicità della riduzione

Qualunque configurazione con ‖C_ij‖_w = DSM¹_ij per ogni (i,j), θ ≤ min‖C_ij‖ (tutte le coppie attive), β = 1 e P_base = max DSM¹ produce P^FEBS_ij = DSM¹_ij. La sfera di raggio DSM¹_ij in ℝ⁶ (metrica pesata) contiene infinite famiglie di vettori con la norma corretta: la riduzione è compatibile con l'intera struttura tensoriale, non è un caso isolato. (Il vincolo di norma adottato per il tensore del caso UCAV nella Sezione 4.2 dell'articolo sfrutta esattamente questa libertà: fissa la norma al valore pubblicato lasciando libera la direzione, che è l'informazione elicitata.)

## Passo A.4 — Distinguibilità computazionale (Tesi 2)

Per dimostrare l'estensione propria occorre mostrare che FEBS calcola output diversi per sistemi che B-E non sa distinguere — non solo che ne ammette rappresentazioni diverse.

**Osservazione preliminare (auto-normalizzazione).** La mappa P_ij = P_base·(S_ij/S_max) è invariante per riscalamento globale delle norme: in un sistema con una sola coppia accoppiata, S_ij = S_max per costruzione e P_ij = P_base qualunque sia il tensore. *(Verificato: con C = [1,0,0,0,0,0] e C = [0,0,0,1,0,0] su un'unica coppia, P = P_base esattamente in entrambi i casi.)* Il controesempio richiede quindi almeno due coppie: solo la struttura *relativa* delle norme è informativa.

**Costruzione.** Due sistemi A e B di tre funzioni con struttura identica: coppia test (1←2, feedback), coppie feed-forward (3←1) e (3←2). La coppia (3←2) ha tensore pieno [1,1,1,1,1,1] identico in A e B e fissa S_max = 1; la coppia (3←1) è identica nei due sistemi. I sistemi differiscono **solo** nella coppia test:

    Sistema A:  C^A_{12} = [1,0,0,0,0,0]   (dipendenza di Input)
    Sistema B:  C^B_{12} = [0,0,0,1,0,0]   (dipendenza di Risorsa)

Parametri: w_I = 0.40, w_R = 0.05 (altri quattro pesi 0.15, 0.15, 0.15, 0.10), β = 1.5, P_base = 0.5, p al percentile minimo, IMPACT identico nei due sistemi.

**Cosa vede B-E.** Il formato di input di B-E dispone di un unico scalare DSM¹_{12} per la coppia test. A e B differiscono esclusivamente per l'aspetto FRAM su cui insiste la dipendenza — informazione che il formato scalare non può codificare: a parità di conoscenza elicitata, la descrizione B-E di A e di B è la stessa, e quindi lo è ogni output B-E.

**Cosa calcola FEBS.** Le norme pesate della coppia test valgono ‖C^A‖_w = √0.40 = 0.632 e ‖C^B‖_w = √0.05 = 0.224. Con S_max = 1: P^A_{12} = 0.5·(0.632)^1.5 = 0.2515 e P^B_{12} = 0.5·(0.224)^1.5 = 0.0529 *(entrambi verificati esattamente)*. Il Monte Carlo (40 000 run, durate deterministiche per isolare l'effetto) produce distribuzioni misurabilmente diverse: E[S]^A = 10.76 contro E[S]^B = 10.16 (+5.9%), E[C]^A = 31.52 contro E[C]^B = 30.31 (+4.0%), σ_S^A = 1.30 contro σ_S^B = 0.67 — con verifica analitica esatta E[S] = 10 + 3P, E[C] = 30 + 6P *(ricalcolo: E[S]^A = 10.75, E[S]^B = 10.16, E[C]^A = 31.51, E[C]^B = 30.32, concordi entro l'arrotondamento)*.

**Interpretazione.** A ha una dipendenza di Input (se la funzione 1 cambia il proprio output, la 2 deve ricominciare). B ha una dipendenza di Risorsa (1 e 2 competono per risorse condivise; la degradazione di 2 avviene indipendentemente dal successo di 1). FEBS li distingue tramite i pesi; B-E non può.  ∎

## Passo A.5 — Il corollario sull'IRR

L'IRR è una seconda evidenza dell'estensione propria, indipendente dal Passo A.4. In B-E la metrica più vicina è la criticità di interfaccia per coppia:

    Crit_{ij} = DSM¹_{ij} · DSM²_{ij} · κ_j · MLV_j

aggregata sui coupling in ingresso alla funzione i:  Crit_i^{in} = Σ_j DSM¹_{ij} · DSM²_{ij} · κ_j · MLV_j.
L'indice di risonanza di FEBS è:

    IRR_i = [ Σ_{j∈𝒩_i} S_ij · IMPACT_ij ] · κ_i · MLV_i · ( 1 + freq_i / r )

Le due quantità differiscono per quattro ragioni:

1. **Dormienza.** In B-E la somma è su tutti i j con DSM¹_ij > 0; in FEBS solo su j con S_ij > 0 (norma sopra θ). I coupling deboli sono esclusi strutturalmente.
2. **Amplificazione superlineare.** S_ij = ‖C_ij‖^β con β > 1 amplifica i coupling forti in misura non lineare; in B-E la probabilità è lineare in DSM¹_ij.
3. **Componente dinamica.** Il fattore (1 + freq_i/r) incorpora il conteggio empirico degli eventi di rework che colpiscono i durante gli r run; B-E non traccia questo contatore.
4. **Pesatura propria vs di controparte.** Entrambe sommano sui coupling in ingresso a i, ma Crit_i^{in} pesa ogni interfaccia con le proprietà della controparte j (κ_j · MLV_j, il costo di rieseguire j), mentre l'IRR pesa l'intera riga con le proprietà sistemiche di i (κ_i · MLV_i, la sua capacità propagativa come futura sorgente). Le due metriche rispondono a domande diverse e non sono riconducibili l'una all'altra per riscalamento.

**Conclusione.** IRR_i ≠ Crit_i^{in} per le quattro ragioni. L'uguaglianza vale solo nel caso degenere (p = p_min, β = 1, forma strutturale con freq_i/r = 0, κ e MLV omogenei), che è il limite B-E del Passo A.2. L'IRR è un output che nessuna configurazione B-E può produrre nella forma generale.  ∎

## Passo A.6 — Sintesi formale

La relazione tra i due modelli è:

    ∃ f : Param_BE → Param_FEBS   t.c.   Output_FEBS(f(x)) = Output_BE(x)   ∀x

Sul solo spazio di output comune (le metriche di S e C) esiste anche una mappa inversa, la proiezione canonica della pipeline. L'estensione propria **non** risiede quindi nell'espressività dello spazio dei parametri rispetto a (S, C), ma in due fatti indipendenti e più forti:

- **(i) Lo spazio di output di FEBS contiene strettamente quello di B-E:** IRR, freq e la struttura di dormienza non appartengono a Output_BE (Passo A.5).
- **(ii) La proiezione π : Param_FEBS → Param_BE è molti-a-uno con fibre distinguibili in output:** esistono y ≠ y′ con identica descrizione esprimibile in B-E e Output_FEBS(y) ≠ Output_FEBS(y′) (Passo A.4).

La prima relazione è la Tesi 1: B-E si immerge in FEBS tramite la costruzione del Passo A.2, con identità verificata a precisione di macchina sul caso UCAV. La seconda è la Tesi 2: l'estensione propria è testimoniata da due fatti indipendenti — con pesi non uniformi FEBS produce distribuzioni diverse per sistemi che B-E descrive in modo identico (Passo A.4), e l'IRR è un output che B-E non può calcolare senza modificare la propria architettura (Passo A.5).

FEBS è dunque un **raffinamento informativo stretto** di B-E: non lo sostituisce, non lo modifica, ma lo contiene come sottoinsieme proprio della sua famiglia di modelli.  ∎

---