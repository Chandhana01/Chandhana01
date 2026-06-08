"""
demo_data.py
------------
Generate synthetic but realistic LC-MS data for six environmental contaminants.

The simulated experiment is a 20-minute reversed-phase LC run in negative-ion
mode (except Atrazine, which is detected as [M+H]+ in positive mode).

Exported functions
------------------
generate_demo_data(seed=42) -> pd.DataFrame
    Columns: scan_number, ms_level, rt, mz, intensity, compound_label

get_demo_metadata() -> dict
    Instrument / method metadata for the simulated experiment.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Compound definitions
# ---------------------------------------------------------------------------

# Each entry:
#   name         : label used in compound_label column
#   rt_apex      : retention-time apex (minutes)
#   rt_sigma     : Gaussian peak width – 1-sigma (minutes)
#   mz_exact     : nominal exact m/z for the primary ion
#   peak_height  : approximate apex intensity (counts)
#   ion_mode     : '+' or '-'
#   ion_form     : human-readable adduct label
_COMPOUNDS = [
    {
        "name": "BPA",
        "rt_apex": 8.2,
        "rt_sigma": 0.25,
        "mz_exact": 227.1072,   # [M-H]- Bisphenol A (MW 228.1150)
        "peak_height": 380_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "DEHP",
        "rt_apex": 15.6,
        "rt_sigma": 0.35,
        "mz_exact": 389.2692,   # [M-H]- DEHP (MW 390.2771)
        "peak_height": 210_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "DBP",
        "rt_apex": 12.1,
        "rt_sigma": 0.28,
        "mz_exact": 277.1445,   # [M-H]- DBP (MW 278.1523)
        "peak_height": 155_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "Aflatoxin B1",
        "rt_apex": 9.4,
        "rt_sigma": 0.22,
        "mz_exact": 311.0561,   # [M-H]- Aflatoxin B1 (MW 312.0634)
        "peak_height": 495_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "Zearalenone",
        "rt_apex": 11.8,
        "rt_sigma": 0.30,
        "mz_exact": 317.1395,   # [M-H]- Zearalenone (MW 318.1472)
        "peak_height": 290_000,
        "ion_mode": "-",
        "ion_form": "[M-H]-",
    },
    {
        "name": "Atrazine",
        "rt_apex": 7.3,
        "rt_sigma": 0.20,
        "mz_exact": 216.0909,   # [M+H]+ Atrazine (MW 215.0836)
        "peak_height": 120_000,
        "ion_mode": "+",
        "ion_form": "[M+H]+",
    },
]

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_demo_data(seed: int = 42) -> pd.DataFrame:
    """Return a synthetic LC-MS dataset (~2000 rows) for six contaminants.

    Parameters
    ----------
    seed : int
        NumPy random seed for reproducibility.

    Returns
    -------
    pd.DataFrame with columns:
        scan_number (int), ms_level (int), rt (float, minutes),
        mz (float), intensity (float), compound_label (str)
        'background' is used as the label for noise data points.
    """
    rng = np.random.default_rng(seed)

    # ------------------------------------------------------------------
    # 1.  Build a regular scan timeline: one scan every ~0.5 s over 20 min
    #     = 2400 scans.  We will thin this down to ~2000 data points later.
    # ------------------------------------------------------------------
    total_minutes = 20.0
    scan_interval_min = total_minutes / 2400  # ≈ 0.00833 min per scan
    n_scans = 2400

    rt_values = np.linspace(0.0, total_minutes, n_scans)
    scan_numbers = np.arange(1, n_scans + 1, dtype=np.int64)

    rows: list[pd.DataFrame] = []

    # ------------------------------------------------------------------
    # 2.  Background / chemical noise — one m/z per scan sampled from a
    #     pool of low-level background ions (200–600 Da range)
    # ------------------------------------------------------------------
    bg_mz_pool = rng.uniform(150.0, 650.0, size=80)   # fixed background ions
    bg_scan_mz = rng.choice(bg_mz_pool, size=n_scans)

    # Background intensity: low, slightly elevated in the mid-run
    bg_base = 1_000.0
    bg_rt_envelope = 1.0 + 0.4 * np.exp(-((rt_values - 10.0) ** 2) / (2 * 5.0 ** 2))
    bg_intensity = bg_base * bg_rt_envelope * rng.lognormal(0, 0.5, size=n_scans)
    # Add tiny m/z noise
    bg_mz_noisy = bg_scan_mz + rng.normal(0, 0.001, size=n_scans)

    rows.append(
        pd.DataFrame(
            {
                "scan_number": scan_numbers,
                "ms_level": np.ones(n_scans, dtype=np.int64),
                "rt": rt_values,
                "mz": bg_mz_noisy,
                "intensity": bg_intensity,
                "compound_label": "background",
            }
        )
    )

    # ------------------------------------------------------------------
    # 3.  Compound peaks — Gaussian RT profile, one data point per scan
    # ------------------------------------------------------------------
    for cpd in _COMPOUNDS:
        apex = cpd["rt_apex"]
        sigma = cpd["rt_sigma"]
        height = cpd["peak_height"]
        mz_exact = cpd["mz_exact"]

        # Gaussian envelope (intensity vs. RT)
        gaussian = height * np.exp(-((rt_values - apex) ** 2) / (2 * sigma ** 2))

        # Only emit a data point where the peak is above ~1% of apex
        # (keeps the DataFrame tidy and realistic)
        threshold = height * 0.01
        active = gaussian >= threshold

        n_active = active.sum()
        if n_active == 0:
            continue

        rt_active = rt_values[active]
        scan_active = scan_numbers[active]
        intensity_active = gaussian[active]

        # Realistic multiplicative intensity noise (lognormal ~5 % RSD)
        noise = rng.lognormal(mean=0.0, sigma=0.05, size=n_active)
        intensity_noisy = np.maximum(intensity_active * noise, 100.0)

        # m/z noise: ±0.001 Da instrumental mass accuracy
        mz_noisy = mz_exact + rng.normal(0.0, 0.001, size=n_active)

        rows.append(
            pd.DataFrame(
                {
                    "scan_number": scan_active.astype(np.int64),
                    "ms_level": np.ones(n_active, dtype=np.int64),
                    "rt": rt_active,
                    "mz": mz_noisy,
                    "intensity": intensity_noisy,
                    "compound_label": cpd["name"],
                }
            )
        )

    # ------------------------------------------------------------------
    # 4.  Assemble, sort, and thin to ~2000 rows
    # ------------------------------------------------------------------
    df = pd.concat(rows, ignore_index=True)
    df = df.sort_values(["scan_number", "mz"]).reset_index(drop=True)

    # Thin: keep all compound rows; randomly subsample background to cap total
    compound_mask = df["compound_label"] != "background"
    compound_df = df[compound_mask]
    background_df = df[~compound_mask]

    target_total = 2000
    n_bg_keep = max(target_total - len(compound_df), 100)
    if len(background_df) > n_bg_keep:
        bg_idx = rng.choice(len(background_df), size=n_bg_keep, replace=False)
        background_df = background_df.iloc[np.sort(bg_idx)]

    df = (
        pd.concat([compound_df, background_df], ignore_index=True)
        .sort_values(["scan_number", "mz"])
        .reset_index(drop=True)
    )

    # Enforce final dtypes
    df["scan_number"] = df["scan_number"].astype(np.int64)
    df["ms_level"] = df["ms_level"].astype(np.int64)
    df["rt"] = df["rt"].astype(np.float64)
    df["mz"] = df["mz"].astype(np.float64)
    df["intensity"] = df["intensity"].astype(np.float64)

    return df[["scan_number", "ms_level", "rt", "mz", "intensity", "compound_label"]]


def get_demo_metadata() -> dict:
    """Return metadata describing the simulated LC-MS experiment."""
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
            "mobile_phase_A": "Water + 0.1% formic acid",
            "mobile_phase_B": "Acetonitrile + 0.1% formic acid",
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
            "polarity": "negative (except Atrazine: positive)",
            "scan_rate_Hz": 2.0,
            "injection_volume_uL": 5.0,
        },
        "analytes": [
            {
                "name": cpd["name"],
                "rt_apex_min": cpd["rt_apex"],
                "mz_exact": cpd["mz_exact"],
                "ion_form": cpd["ion_form"],
                "peak_height_counts": cpd["peak_height"],
            }
            for cpd in _COMPOUNDS
        ],
        "sample": {
            "matrix": "Environmental water (simulated)",
            "preparation": "SPE enrichment (simulated)",
            "concentration_level": "ng/L to µg/L range (simulated)",
        },
        "generation": {
            "software": "demo_data.py (synthetic data generator)",
            "random_seed": 42,
            "note": (
                "All data are entirely synthetic and intended only for "
                "software demonstration purposes.  No real samples were analysed."
            ),
        },
    }
