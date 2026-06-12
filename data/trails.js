/* trails.js — curated learning paths through the Chemistry Nobels.
   There is no single linear order through all 117 prizes; they branch into
   threads. Each trail is an ordered prerequisite chain within one thread,
   with a "why this comes next" note per step. A prize may appear on more
   than one trail (e.g. Pauling sits on both Bonding and Structure). */
window.NOBEL_TRAILS = [
  {
    id: "foundations",
    name: "Foundations: chemistry becomes quantitative",
    color: "#6cc5ff",
    blurb: "Start here. How chemistry turned from descriptive recipes into a predictive, mathematical science of rates, equilibria, and energy. Almost everything else assumes this.",
    steps: [
      { id: "chem-1901", why: "The starting point of physical chemistry: rates, chemical equilibrium, and osmotic pressure put on a quantitative footing." },
      { id: "chem-1903", why: "Explains WHY solutions behave as van 't Hoff described — ions, dissociation, and the link between concentration and reactivity." },
      { id: "chem-1909", why: "Catalysis, reaction velocities, and equilibria — the machinery that controls how fast and how far a reaction goes." },
      { id: "chem-1920", why: "Adds the energy bookkeeping: the heat theorem (third law) lets you predict whether a reaction is even possible." },
      { id: "chem-1932", why: "Brings reactions to surfaces and interfaces (adsorption) — where most real-world and industrial chemistry actually happens." },
      { id: "chem-1956", why: "Reaction mechanisms and chain reactions: the step-by-step elementary events behind an overall rate law." },
      { id: "chem-1968", why: "Extends thermodynamics to systems not at equilibrium (reciprocal relations) — the bridge to living and flowing systems." },
      { id: "chem-1977", why: "Caps the thread: dissipative structures and order arising far from equilibrium." }
    ]
  },
  {
    id: "bonding",
    name: "Bonding & quantum chemistry: why atoms stick",
    color: "#7af0e0",
    blurb: "The theory of the chemical bond and electronic structure — from valence and coordination to molecular orbitals, frontier-orbital reasoning, and modern computation.",
    steps: [
      { id: "chem-1913", why: "Coordination theory: the first real model of how metal ions bind groups in 3D, breaking the simple valence picture." },
      { id: "chem-1936", why: "Dipole moments and diffraction reveal real molecular shapes and charge distribution — evidence the bond theories must explain." },
      { id: "chem-1954", why: "The keystone: the nature of the chemical bond, resonance, hybridization, electronegativity. Read this slowly." },
      { id: "chem-1966", why: "Molecular orbital theory — electrons delocalized over the whole molecule, the alternative/complement to Pauling's valence bonds." },
      { id: "chem-1981", why: "Frontier orbitals (HOMO/LUMO) and the Woodward–Hoffmann rules: predicting whether a reaction is allowed from orbital symmetry." },
      { id: "chem-1992", why: "Marcus theory: a quantitative model of electron-transfer rates built on the energy ideas above." },
      { id: "chem-1998", why: "Density functional theory + computational methods: turning quantum mechanics into a practical predictive tool." },
      { id: "chem-2013", why: "Multiscale modeling — combining quantum and classical descriptions to simulate large, real molecules." }
    ]
  },
  {
    id: "structure",
    name: "Seeing molecules: structure determination",
    color: "#b0b8ff",
    blurb: "How we learned to 'see' atoms and molecules — the instruments and methods that reveal 3D structure, ending at predicting it from sequence.",
    steps: [
      { id: "chem-1922", why: "The mass spectrograph: separating atoms/molecules by mass, the root of isotope and structure analysis." },
      { id: "chem-1936", why: "Electron/X-ray diffraction of molecules gives the first direct geometries — bond lengths and angles you can measure." },
      { id: "chem-1962", why: "X-ray crystallography cracks the first protein structures (haemoglobin, myoglobin) — 3D biology begins." },
      { id: "chem-1964", why: "Pushes crystallography to complex biomolecules (penicillin, vitamin B12) — proves the method's reach." },
      { id: "chem-1985", why: "Direct methods: the math that lets you solve a structure from diffraction data without prior knowledge." },
      { id: "chem-1991", why: "NMR spectroscopy: structure and dynamics in solution, not just crystals." },
      { id: "chem-2002", why: "Mass spec + NMR extended to large biomolecules — sequencing and structures of proteins in the gas phase and solution." },
      { id: "chem-2014", why: "Super-resolution fluorescence microscopy breaks the diffraction limit — watching molecules in living cells." },
      { id: "chem-2017", why: "Cryo-EM images macromolecules at atomic detail without crystals — today's structural workhorse." },
      { id: "chem-2024", why: "The endpoint: predicting 3D structure directly from sequence (AlphaFold) and designing new proteins." }
    ]
  },
  {
    id: "synthesis",
    name: "Building molecules: synthesis & catalysis",
    color: "#ff9f6c",
    blurb: "The art of making molecules on purpose — from classic total synthesis to the catalytic and 'click' methods that make it efficient and selective.",
    steps: [
      { id: "chem-1902", why: "Fischer's sugar and purine work: the first systematic, logical synthesis of complex natural molecules." },
      { id: "chem-1912", why: "Grignard reagents and catalytic hydrogenation — general C–C bond-forming and reduction tools used ever since." },
      { id: "chem-1947", why: "Alkaloid synthesis and the electronic theory of organic reactions: starting to reason about WHY reactions go." },
      { id: "chem-1950", why: "The Diels–Alder reaction: a single, predictable step that builds six-membered rings — a synthetic Swiss-army knife." },
      { id: "chem-1965", why: "Woodward's total syntheses (quinine, cholesterol, B12): the high-water mark of planning a route to any molecule." },
      { id: "chem-1979", why: "Boron and phosphorus-ylide reagents (hydroboration, Wittig) add precise new bond-forming reactions." },
      { id: "chem-1984", why: "Solid-phase synthesis: automating peptide assembly — chemistry becomes a repeatable machine process." },
      { id: "chem-1990", why: "Retrosynthetic analysis: Corey's formal logic for planning a synthesis backwards from the target." },
      { id: "chem-2001", why: "Asymmetric catalysis: making a single mirror-image (chirality) on demand — essential for drugs." },
      { id: "chem-2005", why: "Olefin metathesis: swapping pieces of double bonds, a powerful and green way to build skeletons." },
      { id: "chem-2010", why: "Palladium cross-couplings (Heck/Negishi/Suzuki): joining carbon fragments precisely — modern synthesis's backbone." },
      { id: "chem-2021", why: "Organocatalysis: small organic catalysts do asymmetric chemistry without metals." },
      { id: "chem-2022", why: "Click & bioorthogonal chemistry: reactions so reliable they snap together, even inside living cells." }
    ]
  },
  {
    id: "life",
    name: "The molecules of life: biochemistry & molecular biology",
    color: "#5fd38a",
    blurb: "From 'what is fermentation?' to reading, editing, and designing the molecules of life. The largest thread — many prizes build directly on the previous one.",
    steps: [
      { id: "chem-1907", why: "Fermentation works without living cells — life's chemistry is just enzyme chemistry. The conceptual starting gun." },
      { id: "chem-1929", why: "The chemistry of fermentation and the role of coenzymes — metabolism becomes traceable reactions." },
      { id: "chem-1946", why: "Enzymes are proteins, and can be crystallized — connecting catalysis to defined molecules." },
      { id: "chem-1958", why: "Sanger sequences insulin: proteins have an exact, readable amino-acid order. Foundational method." },
      { id: "chem-1961", why: "Calvin maps the path of carbon in photosynthesis — a full metabolic pathway worked out with tracers." },
      { id: "chem-1962", why: "The first 3D protein structures explain how sequence becomes function." },
      { id: "chem-1972", why: "Anfinsen: a protein's sequence encodes its fold (the folding problem) — plus how enzymes work chemically." },
      { id: "chem-1978", why: "Chemiosmosis: how cells actually make energy (ATP) using ion gradients — a deep mechanistic idea." },
      { id: "chem-1980", why: "Recombinant DNA and DNA sequencing: now we can read and splice the genetic code itself." },
      { id: "chem-1989", why: "RNA can be an enzyme (ribozymes) — rewrites the origin-of-life and central-dogma story." },
      { id: "chem-1993", why: "PCR amplifies DNA at will and site-directed mutagenesis lets you edit it — the tools that power modern biology." },
      { id: "chem-1997", why: "ATP synthase: the rotary molecular machine behind Mitchell's chemiosmosis, caught in the act." },
      { id: "chem-2004", why: "Ubiquitin-tagged protein degradation — the cell's regulated disposal system." },
      { id: "chem-2006", why: "The structural basis of transcription: how DNA is copied into RNA, atom by atom." },
      { id: "chem-2009", why: "The ribosome structure: how the genetic code is translated into protein." },
      { id: "chem-2015", why: "DNA repair mechanisms — how cells protect and correct the code." },
      { id: "chem-2018", why: "Directed evolution and phage display: harnessing evolution to engineer new proteins." },
      { id: "chem-2020", why: "CRISPR-Cas9: programmable genome editing — rewriting DNA precisely." },
      { id: "chem-2024", why: "Predicting and designing protein structure with AI — the culmination of the whole thread." }
    ]
  },
  {
    id: "nucleus",
    name: "Atoms, isotopes & the nucleus",
    color: "#ffd24a",
    blurb: "Radiochemistry: discovering radioactivity, isotopes, and artificial elements — and turning them into tools like tracers and radiocarbon dating.",
    steps: [
      { id: "chem-1908", why: "Rutherford shows radioactivity is atoms transmuting — the nucleus enters chemistry." },
      { id: "chem-1911", why: "Marie Curie isolates radium and polonium: new radioactive elements, and the methods to handle them." },
      { id: "chem-1921", why: "Soddy's isotopes: same element, different mass — the key concept the rest depends on." },
      { id: "chem-1922", why: "Aston's mass spectrograph measures those isotopes directly and finds the whole-number rule." },
      { id: "chem-1934", why: "Urey discovers deuterium (heavy hydrogen) — isotopes you can do chemistry with." },
      { id: "chem-1935", why: "The Joliot-Curies make radioactivity artificial — create radioisotopes on demand." },
      { id: "chem-1943", why: "Hevesy turns radioisotopes into tracers — following atoms through chemical and biological processes." },
      { id: "chem-1944", why: "Hahn's nuclear fission: splitting the nucleus, the discovery that reshaped the 20th century." },
      { id: "chem-1951", why: "McMillan and Seaborg create the transuranium elements, extending the periodic table." },
      { id: "chem-1960", why: "Libby's radiocarbon dating: isotopes become a clock for archaeology and geology." }
    ]
  },
  {
    id: "materials",
    name: "Materials & the very small: polymers to nanotech",
    color: "#ff7aa8",
    blurb: "From understanding giant molecules to designing materials atom-by-atom: polymers, fullerenes, quasicrystals, molecular machines, batteries, quantum dots, and frameworks.",
    steps: [
      { id: "chem-1953", why: "Staudinger proves polymers are real giant covalent molecules — the foundation of all materials chemistry." },
      { id: "chem-1963", why: "Ziegler–Natta catalysts control how polymers are built — making modern plastics possible." },
      { id: "chem-1974", why: "Flory's physical chemistry of macromolecules: predicting how polymer chains behave." },
      { id: "chem-1996", why: "Fullerenes (C60): carbon forms hollow cages — a whole new branch of nanomaterials." },
      { id: "chem-2000", why: "Conductive polymers: plastics that carry current, blending organic chemistry and electronics." },
      { id: "chem-2011", why: "Quasicrystals: ordered but non-repeating atomic arrangements — breaking a 'rule' of crystallography." },
      { id: "chem-2016", why: "Molecular machines: building motors and switches from individual molecules." },
      { id: "chem-2019", why: "Lithium-ion batteries: the materials chemistry powering portable electronics." },
      { id: "chem-2023", why: "Quantum dots: nanocrystals whose color is set by size — quantum effects you can engineer." },
      { id: "chem-2025", why: "Metal–organic frameworks: porous designer solids with vast internal surface area." }
    ]
  }
];

/* Suggested overall on-ramp shown in the Trails intro. */
window.NOBEL_TRAIL_INTRO =
  "There isn't one straight line through all 117 prizes — they branch. The strongest path: " +
  "start with Foundations to get the quantitative mindset, then pick the thread you care about most. " +
  "If your goal is a modern Chemistry Nobel, the Life and Synthesis trails are where the most recent prizes cluster, " +
  "but Bonding and Structure give you the tools the others assume. A prize can sit on several trails — that overlap is the point.";
