# Jargon Glossary — "Is machine learning taking over drug discovery?"

A term-by-term decoder for Melissa Du's essay (*bearably light*, Dec 29 2025). Terms are grouped
in roughly the order the essay introduces them.

---

## 1. The framing argument

| Term | Plain-English meaning | Why it matters in the essay |
|---|---|---|
| **AlphaFold** | DeepMind's protein structure prediction model; AlphaFold2 (2020/21) was the breakthrough version. | The essay's clock starts here — "five years out from AlphaFold," and still zero AI-designed drugs on the market. |
| **AI-designed / AI-discovered drug** | A drug whose molecule was proposed or heavily optimized by a computational model, rather than found by conventional screening. | The headline metric: 0 approved so far. |
| **AI-enabled drug** | Weaker claim — a drug where AI helped *somewhere* in the process (target picking, triage) but didn't design the molecule. | The 67-drugs-in-trials figure mixes both categories, which inflates it. |
| **Drug pipeline** | The whole sequence from target → molecule → trials → approval. Also used for a company's portfolio of in-progress drugs. | The essay's core question is *which stage* AI actually compresses. |
| **Step function** | A sudden jump in a curve, not a gradual slope. | The essay argues against expecting one — no "ChatGPT moment" for drugs. |
| **"ChatGPT moment"** | Shorthand for a sudden, visible, discontinuous capability leap that reorganizes a field. | The thing AI-pharma marketing implies is coming; the essay says it isn't. |
| **Eroom's Law** | "Moore" spelled backwards. The observed trend that new drugs approved *per billion dollars* of R&D has **halved roughly every 9 years for ~70 years** — drug discovery gets steadily more expensive. | The essay's central puzzle: can ML reverse it? Verdict: not on its own. |
| **R&D magnitude** | Total industry research-and-development spend. | AI-first drug discovery is only ~1–2.5% of it — so the essay doubts AI can be *blamed* for Eroom's Law either. |
| **Over-index / under-index** | Investing disproportionately much (or little) attention in something relative to its actual importance. | Teams over-index on novel models, under-index on assays and clinical execution. |
| **Self-accreting** | Compounding on itself without extra input — each unit of progress makes the next easier. | Why software scaled and biology doesn't: no free distribution, no instant iteration, no network effects. |

---

## 2. Target biology — where a drug program starts

| Term | Plain-English meaning | Why it matters in the essay |
|---|---|---|
| **Biological target** | The specific molecule in the body a drug is designed to act on — usually a human protein, a pathogen protein, or a nucleic acid. | Everything downstream is defined relative to the target. |
| **Modulating a target** | Changing the target's behavior — turning it up, down, or off. | The general mechanism of most therapeutics. |
| **Therapeutic** | Any treatment intended to have a medical effect; broader than "drug." | Covers small molecules, antibodies, vaccines, peptides. |
| **Nucleic acids** | DNA and RNA. | A drug target class alongside proteins. |
| **Physicochemical / reactive chemical mechanism** | A drug that works through raw chemistry (pH, reactivity, osmosis) rather than by binding a specific protein. | The exception to the "drugs hit a target" rule — e.g. antacids. |
| **Target discovery** | Working out *which* molecule to drug for a given disease. | The essay's step zero — and where LLMs are already landing. |
| **Multiomics** | Combining several layers of biological measurement at once — genomics (DNA), transcriptomics (RNA), proteomics (proteins), metabolomics (metabolites). | A source of candidate targets, but correlational. |
| **Pathway** | A chain of interacting molecules that carries out a biological function. | Multiomics "implicates pathways in disease" — flags suspects, doesn't convict. |
| **Causal evidence** | Proof that the target actually *drives* the disease, not just that it's present alongside it. | The bar that separates a real target from a correlation. |
| **GWAS (genome-wide association study)** | Scanning many people's genomes to find genetic variants statistically linked to a disease. | Human genetic evidence is the strongest natural-experiment support a target can have. |
| **Functional perturbation screen** | Systematically breaking or silencing genes one at a time and watching what changes. | Turns correlation into causation, experimentally. |
| **CRISPR-based interference (CRISPRi)** | Using a disabled CRISPR system to switch a gene *down* without cutting the DNA. | The standard tool for perturbation screens. |
| **Assay** | A lab test that measures something specific — does this compound bind? is this cell dying? | The essay's recurring point: better assays are the real bottleneck, not better models. |
| **Reagent** | The lab supplies (antibodies, cell lines, labelled probes) needed to run an assay. | A target with no reagents is a target you can't test cheaply. |
| **Poorly characterized target** | A protein with little published data, no reliable assay, no known safety profile. | Higher risk, and exactly where models have the least training data. |
| **Pharos** | NIH-funded public database of human proteins and how well-studied each one is. | Named as a public target-knowledge resource. |
| **Human Protein Atlas** | Public database mapping where each human protein is expressed across tissues and cells. | Same role — prior knowledge you don't have to regenerate. |
| **Proteome** | The complete set of proteins an organism can make. | Footnote: we only have decent chemical data on ~69% of the known human proteome. |
| **Mechanistic hypothesis** | A proposed causal story: "drugging X should change Y, which relieves symptom Z." | What LLMs are being used to generate at scale from literature. |

---

## 3. Preclinical discovery — making the molecule

| Term | Plain-English meaning | Why it matters in the essay |
|---|---|---|
| **Preclinical development** | Everything before the drug enters humans: design, synthesis, animal testing, safety. | ~4–5 years, roughly **1/3** of total cost and time — and where nearly all AI drug discovery is aimed. |
| **Design–make–test cycle (DMTA)** | The iterative loop: design a molecule → synthesize it → assay it → learn → redesign. | The unit of progress in medicinal chemistry. AI tries to shrink each turn. |
| **Screening** | Testing large libraries of candidate molecules — computationally or physically — to see which ones bind the target. | The step after target selection. |
| **Library** | A large collection of pre-made or virtually enumerable compounds to screen against a target. | Millions to billions of candidates; the "haystack." |
| **Hit** | A compound that shows real, confirmed activity against the target. | The needle. |
| **Validated hit** | A hit that survives follow-up testing (not an artifact of the assay). | The metric the essay actually cares about — raw hits are cheap. |
| **Lead** | A promising hit chosen for serious optimization. | Between "hit" and "candidate." |
| **Lead optimization** | Iteratively tweaking the lead — sometimes hundreds of thousands of variants — to improve potency, safety, and drug-likeness at once. | Multi-objective, and where property-prediction models help most. |
| **Candidate** | The single optimized molecule chosen to take into humans. | The output of preclinical work. |
| **Novel compound synthesized** | A never-before-made molecule that was physically produced in a lab. | Exscientia's EXS4318 was the **150th** compound made — vs. industry norms often in the thousands. |
| **Small molecule** | A conventional, chemically synthesized drug — small enough to be swallowed and cross cell membranes. | One of the two main modalities; most appendix entries are these. |
| **Biologic** | A large molecule made by living cells — antibodies, proteins, peptides, vaccines. | The other modality; different optimization priorities (stability, immunogenicity). |
| **Synthesizability / feasible to synthesize** | Whether a chemist can actually make the molecule at reasonable cost. | A model can design a molecule nobody can build — a real failure mode. |
| **Wet lab** | Physical, hands-on experimental biology and chemistry (as opposed to "dry lab" computation). | The friction that makes biology unlike software. |
| **High-throughput assaying** | Running thousands to millions of experiments in parallel via robotics and miniaturization. | The data-generation engine that must scale alongside the models. |
| **Wet-lab automation** | Robots running the experiments. | The essay's "unglamorous work" that actually closes the loop. |
| **Closed-loop platform** | A system where the model proposes, the lab tests, and the results feed straight back into the model — automatically. | Genesis's approach; the ideal architecture for AI drug discovery. |
| **IND (Investigational New Drug) application** | The FDA filing you must clear before dosing a human, showing preclinical safety data and a trial plan. | The gate between preclinical and clinical. |

---

## 4. Drug properties being optimized

| Term | Plain-English meaning | Why it matters in the essay |
|---|---|---|
| **Potency** | How little drug you need for the desired effect. | Lower dose = fewer side effects, cheaper manufacturing. |
| **Selectivity** | How well the drug hits its intended target and *not* similar ones. | The hard part. EXS4318's kinase target needed "very high selectivity." |
| **Target engagement** | Direct evidence the drug actually binds its target *inside a living organism* — not just in a test tube. | Distinguishes "it works in a dish" from "it works in a body." |
| **Binding affinity / binding strength** | How tightly the drug sticks to the target. | The primary thing docking and structure models try to predict. |
| **ADME** | **A**bsorption, **D**istribution, **M**etabolism, **E**xcretion — what the body does to the drug. The essay phrases it as "absorption, distribution, breakdown, and clearance." | Governs dosing and whether the drug reaches the target at all. |
| **Pharmacokinetics (PK)** | The quantitative study of ADME over time — concentration curves. | **10–15%** of clinical failures are poor PK. |
| **Clearance** | How fast the body eliminates the drug. | Too fast = no effect; too slow = accumulation and toxicity. |
| **Safety margin** | The gap between the effective dose and the toxic dose. | Wider is better; a narrow margin kills programs. |
| **Toxicity** | Harm the drug causes beyond its intended effect. | **~30%** of clinical failures. |
| **Solubility** | Whether the drug dissolves well enough to be absorbed. | A classic developability killer. |
| **Stability** | Whether the molecule survives storage, transport, and the body. | Part of developability. |
| **Developability** | Whether the molecule can be manufactured, formulated, stored, and shipped at scale — regardless of how well it works. | The property teams most often forget until it's expensive. |
| **Formulation** | Turning the active molecule into an actual pill, injection, or cream. | Where "topical," "oral," and "gut-restricted" in the appendix come from. |
| **Manufacturability** | Whether you can make it consistently at commercial scale. | Especially hard for biologics. |
| **Sustained effect at a low daily dose** | The drug stays active long enough for once-daily dosing at a small amount. | An explicit design constraint on EXS4318. |

---

## 5. Clinical trials

| Term | Plain-English meaning | Why it matters in the essay |
|---|---|---|
| **Clinical trials** | Testing in humans, in staged phases. | **6–10 years**, ~**2/3** of cost and time — and the essay's argument is that AI barely touches this. |
| **Phase 1** | ~20–100 people, usually healthy volunteers. Question: *is it safe, and what dose?* | Measures side effects, tolerability, PK, early activity signals. |
| **Phase 2** | ~100–300 patients. Question: *does it actually work, and at what dose?* | Where most drugs die — only ~28% go on to Phase 3. |
| **Phase 3** | ~300–3,000+ patients. Question: *does it beat placebo or standard care, at scale?* | The expensive, multi-year, decisive trial. |
| **Phase 4** | Post-approval monitoring in thousands to millions of real-world users. | Catches rare and long-term effects, new indications. |
| **Phase 2a / Phase 1b** | Sub-stages. "a" is typically a smaller exploratory proof-of-concept; "b" a larger expansion. | Several appendix drugs sit at these. |
| **First-in-human (FIH)** | The very first trial dosing the drug in people. | RLY-2608's Phase 1 is labelled FIH. |
| **Healthy volunteer** | A trial participant without the disease, paid to test safety. | Standard for Phase 1 — except in oncology, where the drugs are too toxic. |
| **Tolerability** | Whether patients can live with the side effects, distinct from whether it's technically safe. | A drug can be safe and still intolerable. |
| **Dose–response** | The relationship between how much drug is given and how much effect you see. | Establishes the therapeutic window. |
| **Biomarker** | A measurable proxy signal — a blood protein, an imaging readout — that stands in for the real outcome. | Lets you read out a trial faster than waiting for survival data. |
| **Endpoint** | The pre-declared outcome the trial is judged on. Missing it = failure, regardless of other results. | Zasocitinib "met endpoints" in pivotal Phase 3. |
| **Pivotal study** | The trial (usually Phase 3) whose result the regulator's approval decision rests on. | The one that counts. |
| **Placebo / standard of care** | The comparison arm — an inert control, or the current best available treatment. | You must beat the comparator, not just show an effect. |
| **Clinically meaningful outcome** | A change patients actually feel or that extends life — symptoms, function, survival, relapse rate. | As opposed to a biomarker that moved but changed nothing. |
| **Clinical efficacy** | Does the drug produce its intended effect in actual people? | **40–50%** of all failures. The single biggest killer. |
| **Readout** | The moment trial results are unblinded and reported. | "Positive readout published" = the data looked good. |
| **Indication** | The specific disease a drug is approved or being tested for. | One molecule can pursue several indications. |
| **Adjuvant setting** | Given *after* primary treatment (e.g. surgery) to stop the disease returning. | EVX-02 in melanoma. |
| **Relapsed/refractory** | Patients whose disease came back (relapsed) or never responded (refractory) to existing treatment. | The standard entry population for early oncology trials — sickest patients, fewest options. |
| **Enrollment** | Recruiting and signing up trial participants. | The essay's specific complaint: trials enroll slower and cost more than 3–5 years ago. |
| **EMR (electronic medical record)** | Digitized patient health records. | Deep 6 AI mines these to match patients to trials — a real, if unglamorous, AI win. |
| **FDA review** | The 6–10 month regulatory assessment after filing. | Why the first AI-designed approvals can't realistically land before 2026–27. |
| **Filing** | Submitting the completed application for approval (NDA/BLA). | ~92% of filings are approved — the easy final step. |
| **ClinicalTrials.gov** | The US public registry where trials must be listed. | The source for much of the appendix table. |

---

## 6. Efficiency metrics the essay proposes

| Metric | What it measures | Why it's the right thing to watch |
|---|---|---|
| **Validated hit rate per target** | How many confirmed hits you get, and how many designs you had to screen to get them. | Directly tests whether the model is better than brute force. |
| **Cycle time** | How long from "design a candidate" to "synthesized and validated for activity." | The clock speed of the DMTA loop. |
| **Lead optimization efficiency** | Potency/selectivity gained *per design–make–test round*. | Measures learning rate, not just final quality. |
| **Clinical progression** | % success rate passing each clinical stage. 2023 rates: Phase I→II ~47%, II→III ~28%, III→Approval ~55%, Filing→Approval ~92%. | The only metric that captures whether AI drugs are actually *better*, not just faster to design. |

---

## 7. Machine learning concepts

| Term | Plain-English meaning | Why it matters in the essay |
|---|---|---|
| **Transformer** | The neural network architecture behind modern LLMs and most current protein models. | Everyone is training them on every kind of biological data. |
| **Scaling laws** | The empirical finding that model performance improves predictably with more data, parameters, and compute. | The essay's key caveat: **these don't transfer cleanly from text to biology**, because biological data is scarce and expensive, not free on the internet. |
| **LLM (large language model)** | A model trained on text to predict and generate language. | Best used here for literature synthesis, evidence aggregation, and patient–trial matching. |
| **GPT-3** | OpenAI's 2020 model; the reference point for "before the current AI wave." | ML on biological data predates it. |
| **Unstructured data** | Free text, papers, notes — data with no fixed schema. | The thing LLMs are genuinely good at digesting at scale. |
| **Bespoke biological insight / inductive bias** | Domain knowledge hard-coded into a model's architecture rather than learned from data. | Why the best bio models aren't just big transformers. |
| **Evolutionary signal / MSA (multiple sequence alignment)** | Comparing the same protein across many species; positions that mutate together are physically close in 3D. | The explicitly encoded prior that made AlphaFold2 work. |
| **Structure model** | Predicts the 3D arrangement of atoms for a protein or a multi-molecule complex. | Bucket 1 of protein ML. |
| **Property model** | Predicts experimental behavior (binding, solubility, clearance, toxicity) directly from sequence or structure. | Bucket 2 — fast, approximate feedback across many objectives at once. |
| **Complex / assembly** | Several molecules bound together — e.g. protein + DNA, or protein + small-molecule ligand. | AlphaFold3's advance over AlphaFold2 was predicting these. |
| **Ligand** | The small molecule that binds a protein. | In drug discovery, usually the drug itself. |
| **Docking** | Computationally predicting how and how strongly a ligand fits into a target's binding site. | The virtual screening filter. |
| **Pose prediction** | Predicting the specific 3D orientation the ligand adopts when bound. | Wrong pose = wrong affinity estimate = wasted synthesis. |
| **Generative / diffusion model** | A model that produces new samples by iteratively denoising random noise into structured output. | DiffDock reframes docking as *sampling plausible poses* rather than scoring fixed ones. |
| **Conditioned on** | Generating output constrained by given input (e.g. poses generated *for a specific* target structure). | Standard generative-modelling phrasing. |
| **Molecular dynamics (MD)** | Physics simulation of atoms moving over time, from first principles. | Slower and more rigorous than ML prediction; used to check potency and selectivity estimates. |
| **Ensemble of models** | Combining several specialized models rather than relying on one. | Genesis's architecture: generation + property prediction + docking + MD. |
| **Architectures vs. data as the bottleneck** | Whether progress is limited by model design or by the amount/quality of measurements. | The essay's central technical claim — **it's data**, and frontier researchers agree. |
| **Clean abstractions** | Simplifying assumptions that hold reliably. | Biology's "esoteric edge cases" break them, which is why software intuitions mislead here. |

---

## 8. Named models, tools, and platforms

| Name | What it is |
|---|---|
| **AlphaFold2** | The 2020/21 model that solved single-protein structure prediction by encoding evolutionary signal. |
| **AlphaFold 3** | Successor that predicts structures for *assemblies* — proteins with nucleic acids and small molecules together. |
| **RoseTTAFold All-Atom** | Baker lab's structure predictor, extended to handle all atom types, not just protein backbones. |
| **Boltz** (and "Boltz-style") | Open-source, openly licensed AlphaFold3-class structure models — the community reimplementation track. |
| **Pearl** | Genesis Molecular AI's 3D structure generation model. |
| **Chai-1** | Chai Discovery's open structure prediction model for biomolecular complexes. |
| **DiffDock** | Diffusion-based docking model that samples ligand poses rather than scoring a fixed set. |
| **Deep 6 AI** | Platform that mines EMR data to match patients to clinical trials. |
| **Genesis (Genesis Molecular AI)** | Company building a closed-loop platform: molecule proposal → property prediction → docking → molecular dynamics. |
| **X-ray crystallography** | Experimental method for solving structures by diffracting X-rays through a crystallized protein. Slow, expensive (**$100k+**), and needs a crystal. |
| **NMR (nuclear magnetic resonance)** | Experimental structure determination using magnetic properties of atomic nuclei. Works in solution but limited to smaller proteins. |
| **Datawrapper** | The charting tool used for the essay's figures (not a drug discovery term). |

---

## 9. Companies named

| Company | Role in the essay |
|---|---|
| **Isomorphic Labs** | DeepMind spinout that inherited AlphaFold; standing up clinical infrastructure in Boston, first human trials targeted early 2026. |
| **Exscientia** | AI drug design pioneer; designed EXS4318 in ~11 months vs. the 4–5 year industry average. Now merged into Recursion. |
| **Recursion** | AI-first biotech built on high-throughput cellular imaging; absorbed Exscientia. |
| **Insilico Medicine** | Generative-chemistry company behind Rentosertib, the furthest-advanced fully AI-discovered drug (target *and* molecule). |
| **BenevolentAI** | Knowledge-graph-driven target discovery company. |
| **Absci** | Generative AI for antibody design. |
| **Iambic Therapeutics** | AI-driven small-molecule oncology. |
| **Schrödinger** | Long-established physics-based (molecular simulation) drug design company, now blending in ML. |
| **Relay Therapeutics** | Uses protein motion/dynamics simulation to find mutant-selective drugs. |
| **Evaxion** | AI-designed personalized cancer vaccines. |
| **ProteinQure** | Computational peptide therapeutic design. |
| **Nimbus / Takeda / Sumitomo / Evotec** | Pharma partners that in-licensed or co-developed several appendix candidates — evidence of the ~30% growth in AI-pharma partnerships. |

---

## 10. Appendix decoder — mechanism and modality terms

| Term | Plain-English meaning |
|---|---|
| **Inhibitor** | A drug that blocks or slows a target's activity. Most appendix drugs are these. |
| **Agonist** | A drug that activates a target, mimicking its natural signal. |
| **Antagonist** | A drug that blocks the natural signal without activating anything. |
| **Allosteric** | Binds at a site *other than* the target's main active site, changing its shape indirectly. Usually more selective than binding the active site directly. |
| **Oral** | Taken by mouth — must survive the gut and liver. |
| **Topical** | Applied to the skin; stays local, limiting systemic side effects. |
| **Gut-restricted** | Deliberately designed *not* to be absorbed, so it acts only in the intestine. ISM5411's strategy for ulcerative colitis. |
| **Pan-** (e.g. pan-Trk, pan mutant-selective) | Hits *all* members of a family — all Trk receptors, or all mutant forms of a protein. |
| **Selective** | The opposite emphasis — hits one family member and spares the rest. |
| **Antibody** | A large Y-shaped protein drug that binds a target with very high specificity. A biologic. |
| **Anti-X antibody** (anti-TL1A, anti–PD-1) | An antibody that binds and blocks target X. |
| **Peptide–drug conjugate** | A targeting peptide chemically linked to a toxic payload — the peptide delivers the poison only to the right cells. PQ203 = Sortilin-targeting peptide + MMAE. |
| **MMAE (monomethyl auristatin E)** | A potent cell-killing payload, far too toxic to give on its own; only used attached to a targeting molecule. |
| **Neoantigen vaccine** | A cancer vaccine built from mutations unique to *that individual patient's* tumor. Personalized by construction. |
| **Kinase** | An enzyme that adds phosphate groups to switch other proteins on/off. A huge, druggable, and notoriously hard-to-be-selective-about family. |
| **Mutant-selective** | Targets only the mutated (cancerous) version of a protein, sparing the normal one — much better safety. |
| **First-line / combo** | Given as initial treatment / given together with another drug (e.g. RLY-2608 + fulvestrant). |

---

## 11. Appendix decoder — targets and diseases

| Term | Plain-English meaning |
|---|---|
| **TYK2** | A kinase in inflammatory signalling. Target of zasocitinib for psoriasis. |
| **TNIK** | A kinase implicated in fibrosis. Insilico's Rentosertib target — notable because the *target itself* was AI-proposed. |
| **PHD (prolyl hydroxylase)** | Enzyme regulating the body's oxygen-sensing / red blood cell response. |
| **TL1A** | An inflammatory signalling protein; a hot IBD target. |
| **HER2** | A growth-factor receptor overexpressed in some breast and gastric cancers. |
| **MALT1** | An enzyme in B-cell survival signalling; a lymphoma target. |
| **PTPN2** | A phosphatase that dampens immune response; blocking it is an immuno-oncology strategy. |
| **Adenosine A2A receptor** | A receptor tumors exploit to suppress nearby immune cells. |
| **5-HT1A / 5-HT2A** | Serotonin receptor subtypes; CNS drug targets. |
| **Sortilin** | A cell-surface receptor used as a delivery address in certain cancers. |
| **Trk** | Nerve growth factor receptors; implicated in itch and pain. |
| **PI3Kα** | A frequently mutated cancer signalling enzyme. |
| **PD-1** | An immune "brake" on T-cells; blocking it releases the immune system against tumors. |
| **IMID (immune-mediated inflammatory disease)** | Umbrella term — psoriasis, IBD, rheumatoid arthritis, etc. |
| **IPF (idiopathic pulmonary fibrosis)** | Progressive lung scarring of unknown cause; few effective treatments. |
| **IBD / ulcerative colitis** | Inflammatory bowel disease; UC is one of its two main forms. |
| **Atopic dermatitis** | Chronic inflammatory eczema. |
| **TNBC (triple-negative breast cancer)** | Breast cancer lacking all three common drug targets (ER, PR, HER2) — hardest subtype to treat. |
| **HR+, HER2–** | Hormone-receptor-positive, HER2-negative — the most common breast cancer subtype. |
| **Solid tumor** | Cancer forming a mass (vs. blood cancers like lymphoma/leukemia). |
| **CNS** | Central nervous system — brain and spinal cord. Drugs must cross the blood-brain barrier. |
| **Fulvestrant / capivasertib** | Existing breast cancer drugs used as combination partners or comparator arms. |
| **CDK inhibitor** | Cell-cycle-blocking cancer drug class; a standard combination partner in HR+ breast cancer. |

---

## The one-paragraph summary

Drug development is **10–15 years**: target discovery, then **4–5 years preclinical** (~1/3 of cost),
then **6–10 years of clinical trials** (~2/3 of cost), with a **<10% overall success rate**. AI is
concentrated almost entirely in the preclinical third — structure models, docking, and property
prediction that speed up the design–make–test loop. But **40–50% of failures are lack of clinical
efficacy**, which no structure model predicts. Hence the essay's verdict: structure and sequence
models plausibly automate **up to ~30%** of drug discovery, and the rest depends on better assays,
better datasets, and better clinical infrastructure — not better architectures.
