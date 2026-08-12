# Synthetic Chemistry Roadmap (2–3 Days)

A fast, job-targeted crash course covering **small-molecule synthesis**, **polymer chemistry**, **electrochemistry**, **analytical assays**, and the **industry landscape** — built around the skill profile of the X (Google moonshot factory) PhD Residency: *"Organic Synthesis of Polymers and Small Molecules"*, and equally useful for pharma/materials roles.

**What that posting actually asks for, decoded:**

| Requirement in posting | What to be fluent in |
|---|---|
| Organic synthesis of small molecules & polymers | Core mechanisms, named reactions, polymerization methods |
| Electrochemically reactive molecules / redox polymers | Cyclic voltammetry, redox-active motifs (quinones, TEMPO, ferrocene, viologens), conducting polymers |
| Molecular characterization: HPLC, LC-MS, GC-MS, NMR, LC-QTOF, UV | How each instrument works, when to use it, how to design a *validated assay* |
| Polymers for **sensing** applications | Electrochemical sensors, functionalized/conducting polymers |
| Python + automation of workflows | RDKit basics, scripting instrument data processing, DBTL loops |
| ML for chemical design (nice-to-have) | One-sentence fluency: property prediction, generative design, active learning |

> **How to use this:** Each day is ~6–8 hours in blocks. Aim for interview fluency, not mastery. Keep a notes file; end each day by writing a 10-line summary from memory.

---

## Day 1 — Small-Molecule Synthesis + Characterization

### Block 1: Core organic chemistry refresher (2 hrs)

- **Functional groups & interconversions:** alcohols, amines, carbonyls (aldehyde/ketone/ester/amide), carboxylic acids, halides, nitriles.
- **Mechanism families:** SN1/SN2, E1/E2, nucleophilic addition to carbonyls (Grignard, NaBH4/LiAlH4), aldol/Claisen condensations, electrophilic & nucleophilic aromatic substitution.
- **Named reactions to recognize on sight:** Suzuki, Heck, Buchwald–Hartwig (Pd cross-couplings), Wittig, Diels–Alder, amide coupling (EDC/HATU), reductive amination, click chemistry (CuAAC — heavily used to functionalize polymers).
- **Retrosynthesis logic:** disconnect targets backward; protecting groups (Boc, TBS); convergent vs. linear routes. Practice on paracetamol and ibuprofen.

**Resources:** Clayden *Organic Chemistry* (mechanism chapters), masterorganicchemistry.com, Warren *The Disconnection Approach* (ch. 1–5).

### Block 2: Redox-active small molecules — the job's core theme (2 hrs)

Learn the electroactive motifs; these are the "small molecules" the posting means:

- **Quinones** (quinone/hydroquinone couple — 2e⁻/2H⁺; flow-battery and sensing workhorse)
- **TEMPO and nitroxide radicals** (stable radicals, catholytes, oxidation catalysts)
- **Ferrocene** (the reference redox couple; used as internal standard in voltammetry)
- **Viologens** (methyl viologen — classic anolyte, electrochromics)
- **Phenothiazines, anthraquinones, catechols** (organic redox flow batteries, sensors)

For each, know: the redox couple, roughly where it sits vs. NHE/Fc⁺/Fc, what tuning substituents do (electron-donating groups shift potential negative, withdrawing groups positive), and one application.

**Resources:** review articles on "organic redox flow batteries" (Aziz/Aspuru-Guzik groups) and "redox-active polymers" — skim two, harvest the intro sections.

### Block 3: Analytical characterization & assay design (2–3 hrs)

The posting stresses *building robust assays*, not just running instruments.

- **NMR (¹H/¹³C):** interpret a simple spectrum — chemical shift, integration, multiplicity. Know what 2D (COSY, HSQC) adds.
- **LC-MS / LC-QTOF:** LC separates, MS identifies by m/z; QTOF gives high-resolution exact mass → molecular formula. Electrospray ionization basics ([M+H]⁺, [M+Na]⁺ adducts).
- **GC-MS:** volatile/thermally stable analytes; EI fragmentation patterns.
- **HPLC:** reverse-phase vs. normal-phase, gradient elution, UV detection, purity by area %.
- **UV-Vis:** Beer–Lambert law, λmax, concentration assays.
- **What makes an assay "validated":** calibration curve linearity, LOD/LOQ, reproducibility (RSD), internal standards, specificity. Be able to say: *"I'd build a calibration curve with an internal standard, confirm linearity R² > 0.99, establish LOD/LOQ, and run replicates for precision."*
- **Practical lab reality:** TLC monitoring, column chromatography, recrystallization, Schlenk/glovebox technique, workups.

Interview-ready answer to prepare: *"Walk me through how you'd confirm you made the compound you intended"* → TLC → crude NMR → purify → clean ¹H/¹³C NMR + HRMS exact mass + HPLC purity.

---

## Day 2 — Polymer Chemistry + Electrochemistry

### Block 1: Polymer fundamentals (2 hrs)

- **Mechanisms:** free-radical (PS, PMMA, PVC), step-growth/condensation (nylon, PET, polyurethanes), ring-opening (PLA, PCL, silicones), Ziegler–Natta/metallocene (polyolefins).
- **Controlled/living polymerization — know these well, they signal you're current:**
  - **RAFT** (reversible addition–fragmentation chain transfer — most functional-group tolerant)
  - **ATRP** (atom transfer radical polymerization — Cu-catalyzed)
  - **ROMP** (ring-opening metathesis — Grubbs catalysts)
  - **Anionic** (narrowest dispersity, block copolymers)
  - Why they matter: control over molecular weight, low dispersity (Đ), block/graft architectures, end-group functionality.
- **Key terms:** Mn vs. Mw, dispersity Đ = Mw/Mn, Tg, Tm, crystallinity, crosslinking.
- **Polymer characterization:** GPC/SEC (molecular weight distribution), DSC (Tg/Tm), TGA (thermal stability), NMR end-group analysis, FTIR.
- **Post-polymerization modification:** click chemistry, active esters — how you attach redox groups or receptors to a polymer backbone (directly relevant to "modifying polymers for sensing").

**Resources:** Odian *Principles of Polymerization* (skim), pslc.ws, NPTEL polymer chemistry lectures.

### Block 2: Electrochemistry crash course (2–3 hrs) — **highest-leverage block for this job**

- **The setup:** 3-electrode cell — working, reference (Ag/AgCl, or Fc⁺/Fc as internal standard in organic solvent), counter. Supporting electrolyte (e.g., TBAPF6 in MeCN).
- **Cyclic voltammetry (CV) — be able to sketch and read one:**
  - Reversible couple: ΔEp ≈ 59/n mV, ipa/ipc ≈ 1
  - E½ = (Epa + Epc)/2 → the redox potential you report
  - Scan-rate dependence: ip ∝ √v (diffusion, Randles–Ševčík) vs. ip ∝ v (surface-adsorbed/film — how you prove a redox polymer is on the electrode!)
  - Irreversibility → chemical follow-up reactions or slow kinetics
- **Other techniques, one line each:** differential pulse voltammetry (DPV — sensitive, for sensing), chronoamperometry, electrochemical impedance spectroscopy (EIS), bulk electrolysis.
- **Vocabulary:** overpotential, faradaic vs. capacitive current, electron-transfer kinetics, diffusion coefficient.

**Resources:** "A Practical Beginner's Guide to Cyclic Voltammetry" (Dempsey group, *J. Chem. Educ.* 2018) — **read this paper in full, it's the single best 2 hours you can spend for this role.**

### Block 3: Redox polymers, conducting polymers & sensors (2 hrs)

Where Blocks 1 and 2 combine — the actual job description:

- **Conducting polymers:** PEDOT:PSS, polypyrrole, polyaniline, polythiophenes. Made by chemical or **electropolymerization** (grow the film directly on the electrode). Conjugated backbone → electronic conductivity; doping.
- **Redox polymers:** non-conjugated backbone with pendant redox groups (ferrocene-, TEMPO-, quinone-functionalized polymers). Charge moves by electron hopping between sites.
- **Applications to speak about:**
  - **Biosensors:** glucose sensors use redox-polymer "wired" enzymes (Heller-type osmium redox hydrogels) — the classic success story
  - Organic batteries / flow batteries (polymer catholytes/anolytes)
  - Electrochromic devices, molecularly imprinted polymer (MIP) sensors
- **How you'd evaluate a new redox polymer:** synthesize monomer → polymerize (RAFT/ATRP for control) → characterize (NMR, GPC, DSC) → film on electrode (drop-cast or electropolymerize) → CV (E½, surface coverage, scan-rate study, stability cycling) → sensing response (DPV vs. analyte concentration). Being able to narrate this full **design–build–test–learn loop** is exactly what they're screening for.

---

## Day 3 — Python/Automation + Industry Landscape + Application Prep

### Block 1: Python, automation & ML-for-chemistry (2–3 hrs)

The posting requires Python proficiency and automation experience; ML familiarity is a plus.

- **RDKit (2 hrs, hands-on):** `pip install rdkit`. Learn to: parse SMILES, compute descriptors (MW, logP, TPSA), generate fingerprints, do a substructure search, draw molecules. Write one small script — e.g., load 20 quinone SMILES, compute descriptors, plot with matplotlib.
- **Data/automation stack to name-drop honestly:** pandas + matplotlib for instrument data (e.g., batch-processing CV or HPLC exports), `scipy` for peak fitting.
- **Lab automation landscape (30 min, reading):** liquid handlers (Opentrons), high-throughput experimentation (HTE) in well plates, self-driving labs (Aspuru-Guzik's "Ada", Cronin's chemputer), Emerald Cloud Lab. Know the term **DBTL (design–build–test–learn) loop** — the posting uses it almost verbatim.
- **ML for chemistry, one sentence each:** property prediction (graph neural networks on molecules), generative models proposing new structures, **active learning/Bayesian optimization** picking the next best experiment (this is the moonshot-relevant one), AlphaFold as the flagship ML-for-science story (X will care that you know Alphabet's ecosystem: Isomorphic Labs, DeepMind GNoME for materials).
- **Portfolio move (do this!):** push your RDKit script to this GitHub repo. The application asks for a GitHub profile — a small "chemistry + Python" repo directly evidences the exact skill combination they want.

### Block 2: Industry landscape — who hires this skill set (1 hr)

- **Moonshot/deep-tech & ML-driven labs:** X (Google), DeepMind/Isomorphic Labs, Recursion, Insilico Medicine, Citrine, Kebotix-style self-driving-lab startups.
- **Energy storage & electrochemistry:** Form Energy, ESS, Sila, QuantumScape, Redflow; flow-battery startups (quinone/TEMPO chemistry commercialized).
- **Sensors & diagnostics:** Abbott (FreeStyle Libre — a redox-polymer product!), Dexcom, Medtronic Diabetes, Siemens Healthineers.
- **Big pharma & CROs/CDMOs (classic synthesis jobs):** Pfizer, Merck, Novartis, Roche/Genentech, AstraZeneca, Lilly; WuXi AppTec, Lonza, Evotec, Syngene, Aragen, Sai Life.
- **Polymers & specialty chemicals:** BASF, Dow, DuPont, Covestro, Solvay, Arkema, Evonik, 3M, SABIC.
- **Role names to search:** research associate / scientist I (synthesis), electrochemist, polymer chemist, analytical scientist, HTE chemist, automation chemist, "AI residency" / "science resident" programs (X, Recursion, and several pharmas run them).

### Block 3: Application prep for the X residency (2 hrs)

The form's written questions are screening for storytelling — draft these now, while it's fresh:

1. **"Describe a significant failure or unexpected chaos in a project — how did you pivot?"** (3–4 sentences). Structure: concrete failure → what you diagnosed → the pivot → outcome/lesson. A failed synthesis route, dead instrument before a deadline, or contaminated product story works well. Show calm systematic debugging, not heroics.
2. **"Summarize your current thesis/research focus."** 3–4 sentences, jargon-light, ending with why it matters. Practice saying it aloud in 30 seconds.
3. **"Describe a rabbit hole you went down out of pure curiosity."** They're screening for genuine intellectual curiosity — pick something real (a weird reaction color change you chased, a paper trail you followed, learning to code to plot your own data). Specificity beats impressiveness.
4. **"How did you hear about X and what do you know about us?"** Do 30 min of homework: X = Alphabet's moonshot factory (Waymo, Wing, Verily graduated from it), led by Astro Teller, "10x not 10%" philosophy, celebrates killing projects fast ("monkey first" — tackle the hardest part first). Watch the Wired25 Astro Teller video linked in the posting. Mention the Design Kitchen (the team named in the posting).
5. **Logistics answers ready:** enrollment status, graduation date, relocation to Mountain View, work authorization/sponsorship (check with your university's international office if on a student visa — the posting explicitly flags this), start date + duration (they take 4 mo–1 yr, rolling).
6. **Resume tune-up:** lead with hands-on techniques matching the posting's exact words — organic synthesis, polymer synthesis, HPLC, LC-MS, GC-MS, NMR, (any electrochemistry), Python. Quantify: "synthesized X monomers over N steps," "developed LC-MS assay with LOD of…". Mirror their vocabulary.
7. **LinkedIn:** required field — make sure it's current and consistent with the resume before submitting.

---

## After the 3 Days — Keep Momentum

- Read one CV-containing paper per day for a week; sketch the voltammogram and explain it aloud.
- Work through Warren's retrosynthesis book properly; one disconnection problem daily.
- Extend the RDKit script into a mini-project (e.g., "descriptor dashboard for 50 redox-active molecules") and pin it on GitHub.
- Follow: *In the Pipeline* (Derek Lowe), *Chemjobber*, JACS/Macromolecules/OPRD abstract feeds, and X's blog.
- If you can get any bench time: run one CV (many university labs will let you shadow) — "I've run cyclic voltammetry" is worth more than a week of reading.

---

## One-Page Cheat Sheet

- **Redox motifs:** quinone (2e⁻/2H⁺), TEMPO (stable radical), ferrocene (reference couple), viologen (anolyte)
- **CV reading:** reversible ⇒ ΔEp ≈ 59/n mV; E½ = (Epa+Epc)/2; ip ∝ √v = diffusing, ip ∝ v = surface-bound film
- **Controlled polymerizations:** RAFT (most tolerant), ATRP (Cu), ROMP (Grubbs), anionic (lowest Đ); Đ = Mw/Mn
- **Conducting vs. redox polymer:** conjugated backbone conducts vs. pendant redox groups hop electrons
- **Assay validation:** calibration curve + internal standard + linearity + LOD/LOQ + replicate precision
- **Confirm a product:** TLC → NMR → purify → ¹H/¹³C NMR + HRMS + HPLC purity
- **X-speak:** moonshot factory, 10x not 10%, monkey first, Design Kitchen, DBTL loop
- **Acronyms:** CV, DPV, EIS, E½, GPC, DSC, TGA, RAFT, ATRP, ROMP, LC-QTOF, LOD/LOQ, HTE, DBTL, MIP
