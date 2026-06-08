"""
demo_data.py
------------
Generates synthetic but realistic LC-MS data for six environmental
contaminants, suitable for demonstrating a mass-spectrometry web application.

The simulated experiment is a 20-minute reversed-phase LC run.  All analytes
are detected in negative-ion mode ([M-H]-) except Atrazine, which is detected
as [M+H]+ in positive mode.

Public API
----------
    generate_demo_data(seed=42) -> pd.DataFrame
        Columns: scan_number, ms_level, rt, mz, intensity, compound_label

    get_demo_metadata() -> dict
        Instrument / method / analyte information for the simulated run.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Compound definitions
# ---------------------------------------------------------------------------
# Fields
#   name         : compound label used in the output DataFrame
#   rt_apex      : chromatographic peak apex (minutes)
#   rt_sigma     : Gaussian peak width – 1-sigma (minutes); ~4-sigma = peak width
#   mz_exact     : monoisotopic m/z of the primary ion
#   peak_height  : approximate apex signal (instrument counts)
#   ion_mode     : '+' or '-'
#   ion_form     : IUPAC adduct notation

_COMPOUNDS: list[dict] = [
    {
        "name": "BPA",
        "rt_apex": 8.2,
        "rt_sigma": 0.25,
        "mz_exact": 227.1072,    # [M-H]-  Bisphenol A, MW 228.1150
        "peak_height": 380_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "DEHP",
        "rt_apex": 15.6,
        "rt_sigma": 0.35,
        "mz_exact": 389.2692,    # [M-H]-  DEHP, MW 390.2771
        "peak_height": 210_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "DBP",
        "rt_apex": 12.1,
        "rt_sigma": 0.28,
        "mz_exact": 277.1445,    # [M-H]-  Dibutyl phthalate, MW 278.1523
        "peak_height": 155_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "Aflatoxin B1",
        "rt_apex": 9.4,
        "rt_sigma": 0.22,
        "mz_exact": 311.0561,    # [M-H]-  Aflatoxin B1, MW 312.0634
        "peak_height": 495_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "Zearalenone",
        "rt_apex": 11.8,
        "rt_sigma": 0.30,
        "mz_exact": 317.1395,    # [M-H]-  Zearalenone, MW 318.1472
        "peak_height": 290_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "Atrazine",
        "rt_apex": 7.3,
        "rt_sigma": 0.20,
        "mz_exact": 216.0909,    # [M+H]+  Atrazine, MW 215.0836
        "peak_height": 120_000,
        "ion_mode": "+",
        "ion_form": "[M+H]+",
    },
]


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------

def generate_demo_data(seed: int = 42) -> pd.DataFrame:
    """
    Generate a synthetic LC-MS dataset (~2 000 rows) for six environmental
    contaminants.

    Each compound is represented as a Gaussian chromatographic peak with
    realistic mass accuracy (±0.001 Da noise on m/z) and multiplicative
    intensity noise (~5 % RSD).  Background chemical noise fills the rest of
    the chromatogram.

    Parameters
    ----------
    seed : int
        NumPy random seed – set to the same value for reproducible data.

    Returns
    -------
    pd.DataFrame
        Columns:

        * ``scan_number``   – int, 1-based scan index
        * ``ms_level``      – int, always 1 (full-scan MS1)
        * ``rt``            – float, retention time in minutes
        * ``mz``            – float, measured m/z (monoisotopic + noise)
        * ``intensity``     – float, signal in instrument counts
        * ``compound_label``– str, compound name or ``'background'``
    """
    rng = np.random.default_rng(seed)

    # -----------------------------------------------------------------------
    # 1. Scan timeline – one scan every ~0.5 s over a 20-min run
    #    2 400 scans gives a comfortable margin above the 2 000-row target.
    # -----------------------------------------------------------------------
    total_min = 20.0
    n_scans = 2400
    rt_axis = np.linspace(0.0, total_min, n_scans)           # minutes
    scan_nums = np.arange(1, n_scans + 1, dtype=np.int64)

    chunks: list[pd.DataFrame] = []

    # -----------------------------------------------------------------------
    # 2. Background chemical noise
    #    Model: a fixed pool of 80 low-level background ions sampled once
    #    per scan; intensity slightly elevated in mid-run (matrix effect).
    # -----------------------------------------------------------------------
    bg_mz_pool = rng.uniform(150.0, 650.0, size=80)
    bg_mz_per_scan = rng.choice(bg_mz_pool, size=n_scans)
    bg_mz_per_scan += rng.normal(0.0, 0.001, size=n_scans)   # instrument noise

    # RT-dependent envelope: mild bump around 10 min
    bg_envelope = 1.0 + 0.4 * np.exp(-((rt_axis - 10.0) ** 2) / (2 * 5.0 ** 2))
    bg_intensity = 1_000.0 * bg_envelope * rng.lognormal(0.0, 0.5, size=n_scans)

    chunks.append(
        pd.DataFrame(
            {
                "scan_number": scan_nums,
                "ms_level": np.ones(n_scans, dtype=np.int64),
                "rt": rt_axis,
                "mz": bg_mz_per_scan,
                "intensity": bg_intensity,
                "compound_label": "background",
            }
        )
    )

    # -----------------------------------------------------------------------
    # 3. Compound peaks
    #    One data-point per scan in the elution window (> 1 % of apex height).
    # -----------------------------------------------------------------------
    for cpd in _COMPOUNDS:
        apex = cpd["rt_apex"]
        sigma = cpd["rt_sigma"]
        height = float(cpd["peak_height"])
        mz_exact = cpd["mz_exact"]

        # Gaussian chromatographic peak shape
        gaussian = height * np.exp(-((rt_axis - apex) ** 2) / (2.0 * sigma ** 2))

        # Only emit rows within the observable peak (> 1 % of apex)
        mask = gaussian >= height * 0.01
        n_peak = int(mask.sum())
        if n_peak == 0:
            continue

        rt_peak = rt_axis[mask]
        scan_peak = scan_nums[mask]
        intensity_ideal = gaussian[mask]

        # ~5 % RSD multiplicative noise via lognormal
        noise_factor = rng.lognormal(mean=0.0, sigma=0.05, size=n_peak)
        intensity_noisy = np.maximum(intensity_ideal * noise_factor, 100.0)

        # Instrument mass accuracy: ±0.001 Da (1-sigma)
        mz_noisy = mz_exact + rng.normal(0.0, 0.001, size=n_peak)

        chunks.append(
            pd.DataFrame(
                {
                    "scan_number": scan_peak.astype(np.int64),
                    "ms_level": np.ones(n_peak, dtype=np.int64),
                    "rt": rt_peak,
                    "mz": mz_noisy,
                    "intensity": intensity_noisy,
                    "compound_label": cpd["name"],
                }
            )
        )

    # -----------------------------------------------------------------------
    # 4. Assemble and thin to ~2 000 rows
    # -----------------------------------------------------------------------
    df = pd.concat(chunks, ignore_index=True)
    df = df.sort_values(["scan_number", "mz"]).reset_index(drop=True)

    compound_mask = df["compound_label"] != "background"
    compound_df = df[compound_mask]
    background_df = df[~compound_mask]

    target_total = 2000
    n_bg_keep = max(target_total - len(compound_df), 100)
    if len(background_df) > n_bg_keep:
        bg_idx = np.sort(rng.choice(len(background_df), size=n_bg_keep, replace=False))
        background_df = background_df.iloc[bg_idx]

    df = (
        pd.concat([compound_df, background_df], ignore_index=True)
        .sort_values(["scan_number", "mz"])
        .reset_index(drop=True)
    )

    # Final dtype enforcement
    df["scan_number"] = df["scan_number"].astype(np.int64)
    df["ms_level"] = df["ms_level"].astype(np.int64)
    df["rt"] = df["rt"].astype(np.float64)
    df["mz"] = df["mz"].astype(np.float64)
    df["intensity"] = df["intensity"].astype(np.float64)

    return df[["scan_number", "ms_level", "rt", "mz", "intensity", "compound_label"]]


def get_demo_metadata() -> dict:
    """
    Return a dictionary describing the simulated LC-MS experiment.

    Includes instrument parameters, LC gradient, MS settings, and per-analyte
    information.  All values are entirely fictitious and intended only for
    software demonstration.
    """
    return {
        "instrument": {
            "manufacturer": "Simulated Instruments Inc.",
            "model": "SynthQ Orbitrap",
            "mass_analyzer": "Orbitrap (simulated)",
            "ionization": "ESI (electrospray ionization)",
            "resolution": 60_000,
            "mass_accuracy_ppm": 5.0,
        },
        "lc_method": {
            "column": "Hypersil GOLD C18, 100 × 2.1 mm, 1.9 µm",
            "flow_rate_mL_min": 0.3,
            "total_run_time_min": 20.0,
            "mobile_phase_A": "Water + 0.1 % formic acid",
            "mobile_phase_B": "Acetonitrile + 0.1 % formic acid",
            "gradient": [
                {"time_min": 0.0,  "B_percent": 5},
                {"time_min": 2.0,  "B_percent": 5},
                {"time_min": 16.0, "B_percent": 95},
                {"time_min": 18.0, "B_percent": 95},
                {"time_min": 18.1, "B_percent": 5},
                {"time_min": 20.0, "B_percent": 5},
            ],
        },
        "ms_method": {
            "scan_range_mz": [100, 1000],
            "primary_polarity": "negative",
            "scan_rate_Hz": 2.0,
            "injection_volume_uL": 5.0,
            "notes": "Atrazine detected in positive mode [M+H]+; all others [M-H]-",
        },
        "analytes": [
            {
                "name": cpd["name"],
                "rt_apex_min": cpd["rt_apex"],
                "rt_peak_width_min_4sigma": round(4 * cpd["rt_sigma"], 2),
                "mz_exact": cpd["mz_exact"],
                "ion_form": cpd["ion_form"],
                "ion_mode": cpd["ion_mode"],
                "peak_height_counts": cpd["peak_height"],
            }
            for cpd in _COMPOUNDS
        ],
        "sample": {
            "matrix": "Environmental water (simulated)",
            "preparation": "SPE enrichment (simulated)",
            "concentration_level": "ng/L to µg/L range (simulated)",
        },
        "data_generation": {
            "software": "demo_data.py (synthetic data generator)",
            "default_random_seed": 42,
            "target_rows": 2000,
            "disclaimer": (
                "All data are entirely synthetic and intended solely for "
                "software demonstration purposes. No real samples were analysed."
            ),
        },
    }
