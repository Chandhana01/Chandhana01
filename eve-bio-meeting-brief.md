# EvE Bio Call — Briefing (Fri 3pm EST)

*Everyone on the call works at EvE Bio. It's a virtual call. Milan Cvitkovic made the intro.*

---

## 1. What EvE Bio does (30-sec version)
A **Focused Research Organization (FRO)** — a time-limited (~5-yr), philanthropically-funded nonprofit science startup built to produce a **public-good dataset**, not a product. Their mission: **"map the pharmome."**

- **Pharmome** = every approved drug × every human protein it actually touches, with emphasis on **unintended / off-target** interactions. Premise: *no drug hits only its intended target* — off-targets drive side effects AND repurposing.
- **Method:** industrial-scale **high-throughput screening (HTS)** — profile ~2,000 FDA-approved small molecules against up to ~1,000 human "druggable" targets, testing both **agonism and antagonism**.
- **Traction:** public data drops since Nov 2024 (at `data.evebio.org` + Hugging Face). Latest (~7th release): **~385,000 tested drug–target interactions, ~1,400 compounds × 159 validated targets** — largest public dataset of its kind (prior best: Novartis ~800 drugs × 105 targets). Partnered with **DrugBank** (Nov 2025) to distribute it; used to train FutureHouse's "ether0" chemistry AI. Also a new **OpenAI Foundation "AI for Alzheimer's"** partnership.
- **Funders:** Convergent Research (incubator), Eric & Wendy Schmidt, Founders Pledge, Lyda Hill Philanthropies. **Commercial sponsor:** DrugBank.

## 2. How it relates to YOUR work (the whole reason for the call)
You (**PlasticList**) find **which** plasticizer/EDC chemicals are in food. You **don't** know **what they do** in the body. EvE's core competency is exactly that missing half: **unbiased, high-throughput profiling of a compound against a large panel of human targets to discover what it binds.** They turn *"we detected X"* into *"X is an agonist/antagonist at receptors A, B, C."* Their screening rig is built for drugs, but a phthalate or bisphenol is just a small molecule — the same assays apply. **This is the bridge: PlasticList = exposure map; EvE = target/effect map.**

> **Why the fit is almost too perfect:** EvE's panel is built on **~19 nuclear receptors** (TR-FRET coactivator-recruitment / ligand-binding assays, run **agonist + antagonist**), **~21 GPCRs** (β-arrestin / G-protein cell assays), and **protein kinases** — with cytotoxicity counter-screens. **The dominant mechanism of the exact chemicals you detect (phthalates, bisphenols) IS nuclear-receptor + GPCR modulation** (ER, AR, PPARα/γ, TR, PXR, CAR). EvE has effectively already built the assay factory that EDC target-ID needs — same logic as EPA's ToxCast/EDSP, but at their scale, standardized, and **open (CC-licensed, on Hugging Face + DrugBank).**

> **Your PlasticList facts at fingertips** (report published **Dec 27, 2024**; lab = **IEH Laboratories**; funded by **Nat Friedman**): **705 samples / 296 products**, **18 analytes** (11 phthalates, 4 substitutes, 3 bisphenols). **86% of products** had ≥1 plastic chemical; **phthalates ~73%, substitutes ~73%, bisphenols ~22%.** Contamination near-universal even in premium/organic/raw foods; **all prenatal vitamins tested contained DEHP**; older foods skewed to classic phthalates, modern foods to substitutes (**DEHT, DEHA**) — direct evidence of "regrettable substitution." *(Confirm exact figures on plasticlist.org — you'd know best.)*

## 3. How Milan relates
**Milan Cvitkovic** incubated EvE Bio as **Strategy Lead at Convergent Research** (he helped launch EvE, Forest Neurotech, Lean FRO). He's now **Co-founder & CEO of Integral Neuro**, PhD (Caltech, computing & math sciences). He made the intro publicly on X: *"if PlasticList is interested in the biological effects in humans of the analytes you're testing food for, EvE Bio is worth talking to."* He is the connector, not an EvE employee.

## 4. Who's on the call — bios & why they matter to you
| Person | Title @ EvE | Background | Why they matter to your EDC questions |
|---|---|---|---|
| **Elaine McVey** (Houskeeper) — `emcvey` | **CEO**, co-founder | Neuroscience (Amherst) + MS Statistics (NC State); bench scientist → data scientist at Becton Dickinson | Your main counterpart. Strategy, **data quality/statistics, dataset design, public-good release model**. This is who you negotiate a collaboration with. |
| **Jeff DiBerto** — `jdiberto` | **Director of Assay Development**, co-founder | **PhD Pharmacology, UNC-Chapel Hill (Bryan Roth lab)** — GPCR pharmacology (opioid/serotonin); co-inventor of **TRUPATH** (open-source GPCR biosensor suite, *Nature* 2020); papers in Cell/Nature | **The deepest molecular-pharmacology brain in the room.** Talk receptor signaling, biosensors, assay design, target biology. Your best technical partner for "what does this EDC actually hit?" Also UNC-connected. |
| **Aaron Goetz** — `agoetz` | **Director of Screening**, co-founder | 32 yrs pharma HTS; ex-**Ribometrix** (RTP), ex-**GSK**; BS Bio/Chem (Kansas State), MS Project Mgmt | Runs the **throughput engine**. Talk feasibility, scale, hit-calling, "how many compounds could you run." |
| **Dawn Shelton** — `dshelton` | Exec Assistant to CEO/COO | (Organizer; little public bio) | Logistics/ops — the meeting organizer. |
| *(likely referenced)* **Bill (William) Busa** | **CSO**, co-founder, founding CEO | PhD; ex-Johns Hopkins prof (calcium/inositol signaling); ex-Cellomics CSO, ex-Becton Dickinson; writes the "Why map the pharmome?" blog | The **vision/"why" guy** for off-target biology & drug safety. May or may not be on the call. |

## 5. Where they are & distances (call is virtual, but for reference)
**EvE Bio, LLC — 4020 Stirrup Creek Dr, Suite 114, Durham, NC 27703** (in Research Triangle Park). Ph: (919) 436-4132.
- **From 2020 Kirkhaven Rd, Morrisville, NC:** ≈ **7–9 miles, ~10–12 min** drive (Kirkhaven is RTP-adjacent Morrisville; EvE is just across RTP).
- **From UNC Chapel Hill:** ≈ **14–17 miles, ~20–25 min** drive (west side of RTP to Chapel Hill via I-40 / NC-54).
- DiBerto's UNC pedigree = a natural academic bridge to Chapel Hill.

---

# THE SCIENCE — your questions, densely

## 6. Standard way to test EDC **exposure** (phthalates, bisphenols)
**Human biomonitoring** = measure **metabolites in urine** (blood for some) by **LC-MS/MS or GC-MS/MS**:
- **Phthalates** → measured as their **monoester metabolites** (DEHP → MEHP, MEHHP, MEOHP, MECPP; DBP → MnBP; BBzP → MBzP). You don't measure the parent — it's metabolized in minutes.
- **Bisphenols** → urinary **total BPA/BPS/BPF** after enzymatic de-conjugation (they circulate as glucuronides).
- **Flagship program:** CDC **NHANES** (population-level, since early 2000s) — that's how we know these are in ~**everyone**.
- **Key gotcha:** phthalates/BPA have **short half-lives (hours)** → a single spot urine is noisy; you need **repeated samples**. And **lab contamination is rampant** (plasticware everywhere) → field blanks + glass sampling are mandatory. (You know this pain from PlasticList's analytics.)

## 7–9. How you test **toxicity** — the tiered protocol (in vitro → in vivo → human)
There's a standard regulatory ladder (EPA **EDSP** / OECD test guidelines):

**Tier A — In vitro / mechanistic (cells & biochem):**
- **Receptor transactivation / reporter-gene assays:** ER (estrogen) & AR (androgen) agonism/antagonism — the workhorses for "is it a xenoestrogen/anti-androgen."
- **E-SCREEN** (MCF-7 breast-cell proliferation = estrogenicity), **YES/YAS** (yeast estrogen/androgen screen).
- **Steroidogenesis assay (H295R adrenal cells)** — does it perturb hormone *synthesis* (key for phthalates).
- **Aromatase, thyroid (TR, TPO), PPARα/γ** assays.
- **The big one, and where EvE lives:** EPA **ToxCast / Tox21** — **high-throughput screening of thousands of chemicals across hundreds of assays/targets.** EvE's platform is the same *species* of tool, aimed at drugs.

**Tier B — In vivo rodent (short-term, mechanism-anchored):**
- **Uterotrophic assay** (immature/ovariectomized rat, uterine weight ↑ = estrogenic).
- **Hershberger assay** (castrated rat, accessory-sex-tissue weight = (anti)androgenic).
- **Pubertal assays;** **developmental "phthalate syndrome"** endpoints: **anogenital distance (AGD)**, nipple retention, hypospadias, ↓ fetal testosterone.

**Tier C — Guideline in-vivo repro/dev tox:** OECD TG 443 **EOGRTS** (extended one-generation), 2-gen, developmental neurotox — the multi-month, multi-endpoint studies.

**Tier D — Human epidemiology:** see mixture/RCT below.

## 10–11. Mixtures, RCTs, and the causal-attribution threshold
- **Is it an RCT? No — and it essentially can't be.** You can't ethically dose humans with suspected toxicants. So human evidence is **observational**: **prospective birth cohorts** (measure maternal prenatal urinary phthalates → follow child AGD, neurodev, etc.), cross-sectional (NHANES), case-control. RCT-level control exists **only in animals** (randomized dosing) and **cells**.
- **How mixtures are actually studied** (the hard part — real exposure is always a cocktail):
  - **Concentration/dose addition** for chemicals with a **common mechanism** — e.g., anti-androgenic phthalates act **additively** on the fetal testis (Kortenkamp's *"something from nothing"*: several chemicals each **below** their individual no-effect dose still combine to a real effect). **Independent action** model when mechanisms differ.
  - **Cumulative risk assessment:** relative-potency factors summed into a **hazard index** (how EU/US have handled phthalate groups).
  - **Statistical mixture methods in epi:** **WQS regression, Bayesian Kernel Machine Regression (BKMR), quantile g-computation** — built to handle correlated exposure mixtures and estimate a *joint* effect + identify the bad actors.
  - **Experimental:** defined-mixture factorial dosing in animals/cells.
- **The "threshold" to blame a specific chemical** is **not a p-value — it's weight-of-evidence** (Bradford Hill-style triangulation): consistent human associations **+** animal causal data **+** plausible mechanism **+** dose-response **+** analogy. Regulators then set a **Reference Dose / TDI** = NOAEL or benchmark dose ÷ uncertainty factors. **Complication:** EDCs can show **non-monotonic (low-dose) dose-response curves**, which breaks classic threshold logic and is heavily contested.
- **Bottom line:** we very rarely say "*this* phthalate caused *this* person's harm." We say "this class, via this mechanism, raises population risk." Attribution is statistical + mechanistic, not deterministic.

## 12. Target-based vs. phenotypic — and the "we don't know" problem (your key insight)
- **Xenoestrogens (BPA etc.):** mechanism relatively **known** — bind **ER** (some AR antagonism, thyroid). Clean target.
- **Phthalates:** the developmental harm is **NOT direct receptor binding** — they **suppress fetal testicular testosterone synthesis (steroidogenesis: StAR, Cyp11a, Cyp17 downregulation)** and hit **PPARα/γ**. So the "target" is a **pathway**, not one receptor. **This is exactly the case where target-ID is unsolved and where EvE's unbiased profiling shines** — you *don't* have to know the target in advance.
- **Do we know the phthalate/bisphenol alternatives? Mostly NO — "regrettable substitution":**
  - BPA → **BPS, BPF, BPAF**: turn out to be **similarly estrogenic**. Not safer, just less studied.
  - Phthalate replacements → **DINCH, DEHT/DEHTP, DINP**: marketed as safer, **thin toxicology data**.
  - **This is your strongest pitch to EvE:** PlasticList detects these replacements in food; **nobody has mapped their human targets.** EvE can. That's a concrete, fundable collaboration.

## 13. "If they redid the FDA/tox testing from scratch, how?"
The **NRC 2007 "Toxicity Testing in the 21st Century"** vision, updated:
- Shift **from** chemical-by-chemical, low-throughput animal guideline studies **to** **New Approach Methodologies (NAMs):** high-throughput **mechanistic/target profiling** (Tox21-style), **in-vitro-to-in-vivo extrapolation (IVIVE),** organ-on-chip, **read-across** for data-poor analogs.
- **Require pre-market mechanistic data on replacements** (kill regrettable substitution).
- **Exposure-based prioritization** (test what people are actually eating/drinking — i.e., what PlasticList surfaces).
- **Cumulative/mixture-based** risk by default, not single-chemical.
- **An unbiased human-target map for every food-contact chemical** is a natural pillar — which is **literally EvE's method applied to the exposome.**

## 14. How you'd map the **exposome**
- **Exposome** = total lifetime environmental exposure + the body's response.
- **Tools:** **non-targeted high-resolution mass spec (HRMS)** on blood/urine (suspect + unknown screening), **silicone wristbands** (passive samplers), biomonitoring panels, **adductomics / metabolomics / proteomics** for the "internal exposome," environmental sensors.
- **The bottleneck is connecting exposure → effect.** A **target/pharmome-style map is the missing translation layer**: exposure → molecular target → biological effect. (PlasticList + EvE = the two halves of an exposome pipeline.)

## 15. How big a problem is this, really?
- **Evidence strength:** mechanistic + animal = **strong**; human epi = **consistent associations** (phthalates ↔ male reproductive development / "testicular dysgenesis," neurodevelopment, preterm birth; BPA ↔ metabolic & reproductive). **Ubiquity is certain** (NHANES: detectable in nearly everyone).
- **Magnitude is genuinely debated.** Attributable-cost estimates (e.g., **Trasande et al.**: hundreds of billions/yr in EU/US health costs) are influential but **contested**. Causal certainty at the individual level is incomplete — which is *why* better target/effect data matters.

## 16. Microplastics ("the macrophages / plastic-in-plaque situation")
**Separate axis — particles, not leached chemicals.** Micro/nanoplastics (MNPs) are now found in human **blood, placenta, testis, and arterial plaque.** The headline: a **2024 *NEJM* study** linked **microplastics in carotid plaque (taken up by plaque macrophages)** to higher rates of heart attack/stroke/death. Hypothesized mechanisms: particle uptake by **macrophages → inflammation + oxidative stress**, plus particles act as **carriers for adsorbed EDCs.** **Toxicology of particles ≠ toxicology of the chemicals** — flag it as a related but distinct frontier that's even less understood (and harder to fit EvE's small-molecule assay model — worth asking them about).

---

# TALK TRACK — what to actually say / ask

**Your ask/frame:** *"PlasticList tells the world which plasticizers are in food. The obvious next question everyone asks us is 'so what does it do to me?' — and we can't answer it. You've built the machine that can. Can we point your target-mapping engine at the plasticizers and their 'regrettable substitution' replacements we detect?"*

**High-value questions for them:**
1. Could your HTS panel screen **non-drug small molecules** (phthalates, bisphenols, DINCH/DEHTP, BPS/BPF) against your target set — any assay-chemistry blockers (volatility, solubility, metabolism)?
2. For a compound with **unknown mechanism**, what's your **hit-to-confidence** pipeline, and how many targets could you realistically cover?
3. Would EDC target maps be a **public-good release** like your pharmome data (aligns with both our missions)?
4. **DiBerto specifically:** could **TRUPATH / your biosensors** resolve which *signaling pathways* a phthalate perturbs beyond ER/AR?
5. Do you have a view on **mixtures** — can your platform test defined cocktails, not just single compounds?
6. **Funding/structure:** you're philanthropically funded (Schmidt, Lyda Hill, Founders Pledge) — is an EDC/exposome arm something a funder would back, and who? (Nat Friedman funded PlasticList — a natural bridge.)
7. Where do **microplastic particles** fall — inside or outside what your assays can address?

**Things to have at your fingertips:** PlasticList's headline numbers (what % of samples had phthalates, which foods worst, which analytes), your LC-MS/MS methodology, and the replacement chemicals you detect.

---

### One-line cheat sheet
*EvE maps drug→protein off-targets at industrial scale (public dataset, ~385k interactions). You map plastic-chemicals→food. The collaboration writes itself: aim their target-ID engine at the EDCs/replacements you find, especially the "we-don't-know-what-it-does" ones (phthalates hit steroidogenesis + PPAR, not a clean receptor; BPS/BPF/DINCH barely studied). Human testing is never an RCT — it's cohorts + animal + mechanism + mixture stats, integrated as weight-of-evidence. CEO Elaine McVey = your deal partner; Jeff DiBerto (UNC/Roth GPCR PhD) = your science partner. RTP, ~10 min from Morrisville, ~20 min from UNC.*
