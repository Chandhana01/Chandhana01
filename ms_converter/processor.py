"""
Mass Spectrometry Environmental Contaminant Analysis Pipeline
Core processing module for feature detection and compound identification.
"""

from __future__ import annotations

import warnings
from typing import Any

import numpy as np
import pandas as pd
from scipy.signal import find_peaks
from scipy.integrate import trapezoid

# ---------------------------------------------------------------------------
# Default parameters
# ---------------------------------------------------------------------------

DEFAULT_PARAMS: dict[str, Any] = {
    "intensity_threshold": 1000,
    "mz_tolerance_ppm": 10,
    "ionization_mode": "negative",  # 'negative' or 'positive'
    "rt_window": 0.1,
    "min_peak_width": 0.05,
}

# Adduct columns available in the compound database
_ADDUCT_COLUMNS_POSITIVE = ["mz_pos_H", "mz_pos_NH4", "mz_pos_Na"]
_ADDUCT_COLUMNS_NEGATIVE = ["mz_neg_H", "mz_neg_Cl"]
_ALL_ADDUCT_COLUMNS = _ADDUCT_COLUMNS_POSITIVE + _ADDUCT_COLUMNS_NEGATIVE


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _merge_params(params: dict | None) -> dict:
    """Return a fully-populated params dict, filling missing keys with defaults."""
    merged = DEFAULT_PARAMS.copy()
    if params:
        merged.update(params)
    return merged


def _ppm_error(measured: float, reference: float) -> float:
    """Return absolute ppm error between measured and reference m/z."""
    if reference == 0:
        return np.inf
    return abs((measured - reference) / reference) * 1e6


def _bin_values(series: pd.Series, bin_width: float) -> pd.Series:
    """Bin a numeric Series to multiples of bin_width (floor binning)."""
    return (series / bin_width).apply(np.floor) * bin_width


# ---------------------------------------------------------------------------
# Step 1 – Raw Data Summary
# ---------------------------------------------------------------------------

def _raw_data_summary(raw_df: pd.DataFrame) -> dict:
    """
    Compute high-level summary statistics from the raw scan data.

    Expected columns in raw_df: rt, mz, intensity
    Returns a partial qc_metrics dict.
    """
    if raw_df.empty:
        return {
            "total_scans": 0,
            "rt_min": None,
            "rt_max": None,
            "mz_min": None,
            "mz_max": None,
            "intensity_min": None,
            "intensity_max": None,
            "intensity_mean": None,
            "intensity_median": None,
            "intensity_total": None,
        }

    return {
        "total_scans": len(raw_df),
        "rt_min": float(raw_df["rt"].min()),
        "rt_max": float(raw_df["rt"].max()),
        "mz_min": float(raw_df["mz"].min()),
        "mz_max": float(raw_df["mz"].max()),
        "intensity_min": float(raw_df["intensity"].min()),
        "intensity_max": float(raw_df["intensity"].max()),
        "intensity_mean": float(raw_df["intensity"].mean()),
        "intensity_median": float(raw_df["intensity"].median()),
        "intensity_total": float(raw_df["intensity"].sum()),
    }


# ---------------------------------------------------------------------------
# Step 2 – Total Ion Chromatogram
# ---------------------------------------------------------------------------

def _build_tic(raw_df: pd.DataFrame, rt_bin_width: float = 0.05) -> pd.DataFrame:
    """
    Build the Total Ion Chromatogram by grouping RT into bin_width windows
    and summing intensities within each window.

    Returns DataFrame with columns: rt, tic
    """
    if raw_df.empty:
        return pd.DataFrame(columns=["rt", "tic"])

    df = raw_df.copy()
    df["rt_bin"] = _bin_values(df["rt"], rt_bin_width)
    tic = (
        df.groupby("rt_bin", sort=True)["intensity"]
        .sum()
        .reset_index()
        .rename(columns={"rt_bin": "rt", "intensity": "tic"})
    )
    return tic.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Step 3 – Peak Detection
# ---------------------------------------------------------------------------

def _detect_peaks_for_mz_group(
    group_df: pd.DataFrame,
    mz_center: float,
    intensity_threshold: float,
    rt_window: float,
    min_peak_width: float,
    feature_counter: list[int],
) -> list[dict]:
    """
    Detect chromatographic peaks for a single binned m/z group.

    Parameters
    ----------
    group_df : DataFrame with columns rt, intensity (already sorted by rt)
    mz_center : representative m/z for this bin
    intensity_threshold : minimum peak height
    rt_window : ± RT window (minutes) for peak area integration
    min_peak_width : minimum peak width in minutes (used to set find_peaks distance)
    feature_counter : mutable list holding [next_feature_id]

    Returns list of feature dicts.
    """
    features: list[dict] = []

    if group_df.empty or group_df["intensity"].max() < intensity_threshold:
        return features

    rt_arr = group_df["rt"].values
    intensity_arr = group_df["intensity"].values

    # Estimate the RT spacing so we can convert min_peak_width to samples
    if len(rt_arr) < 2:
        return features

    rt_spacing = np.median(np.diff(np.sort(rt_arr)))
    if rt_spacing <= 0:
        rt_spacing = 0.01

    min_distance_samples = max(1, int(min_peak_width / rt_spacing))

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        peak_indices, properties = find_peaks(
            intensity_arr,
            height=intensity_threshold,
            distance=min_distance_samples,
        )

    for idx in peak_indices:
        rt_apex = float(rt_arr[idx])
        peak_height = float(intensity_arr[idx])

        # --- Peak area via trapezoid integration over ±rt_window ---
        mask = (rt_arr >= rt_apex - rt_window) & (rt_arr <= rt_apex + rt_window)
        if mask.sum() >= 2:
            peak_area = float(trapezoid(intensity_arr[mask], rt_arr[mask]))
        else:
            peak_area = float(peak_height * rt_window * 2)

        # --- m/z standard deviation within the window ---
        mz_in_window = group_df.loc[
            (group_df["rt"] >= rt_apex - rt_window)
            & (group_df["rt"] <= rt_apex + rt_window),
            "mz",
        ]
        mz_std = float(mz_in_window.std()) if len(mz_in_window) > 1 else 0.0

        feature_id = f"F{feature_counter[0]:05d}"
        feature_counter[0] += 1

        features.append(
            {
                "feature_id": feature_id,
                "mz_center": mz_center,
                "rt_apex": rt_apex,
                "peak_height": peak_height,
                "peak_area": peak_area,
                "mz_std": mz_std,
            }
        )

    return features


def _detect_peaks(raw_df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """
    Run peak detection across all binned m/z groups.

    Returns feature_table DataFrame:
        feature_id, mz_center, rt_apex, peak_height, peak_area, mz_std
    """
    if raw_df.empty:
        return pd.DataFrame(
            columns=["feature_id", "mz_center", "rt_apex", "peak_height", "peak_area", "mz_std"]
        )

    intensity_threshold = params["intensity_threshold"]
    rt_window = params["rt_window"]
    min_peak_width = params["min_peak_width"]
    mz_bin_width = 0.01  # Da

    df = raw_df.copy()
    df["mz_bin"] = _bin_values(df["mz"], mz_bin_width)

    # Representative m/z per bin = median of all m/z values in that bin
    mz_bin_centers = (
        df.groupby("mz_bin")["mz"].median().rename("mz_center").reset_index()
    )

    all_features: list[dict] = []
    feature_counter = [1]

    for _, row in mz_bin_centers.iterrows():
        mz_bin = row["mz_bin"]
        mz_center = row["mz_center"]

        group = df[df["mz_bin"] == mz_bin][["rt", "mz", "intensity"]].sort_values("rt")

        # Aggregate duplicate RTs (can happen with multiple scans at same nominal RT)
        group = group.groupby("rt", sort=True).agg({"mz": "mean", "intensity": "sum"}).reset_index()

        feats = _detect_peaks_for_mz_group(
            group_df=group,
            mz_center=mz_center,
            intensity_threshold=intensity_threshold,
            rt_window=rt_window,
            min_peak_width=min_peak_width,
            feature_counter=feature_counter,
        )
        all_features.extend(feats)

    if not all_features:
        return pd.DataFrame(
            columns=["feature_id", "mz_center", "rt_apex", "peak_height", "peak_area", "mz_std"]
        )

    feature_table = pd.DataFrame(all_features)
    feature_table = feature_table.sort_values("peak_height", ascending=False).reset_index(drop=True)
    return feature_table


# ---------------------------------------------------------------------------
# Step 4 – Compound Matching
# ---------------------------------------------------------------------------

def _get_adduct_priority(ionization_mode: str) -> list[str]:
    """Return adduct columns in priority order for the given ionization mode."""
    if ionization_mode == "positive":
        return _ADDUCT_COLUMNS_POSITIVE + _ADDUCT_COLUMNS_NEGATIVE
    else:  # negative (default)
        return _ADDUCT_COLUMNS_NEGATIVE + _ADDUCT_COLUMNS_POSITIVE


def _confidence_label(ppm: float) -> str:
    if ppm < 5:
        return "High"
    elif ppm < 10:
        return "Medium"
    else:
        return "Low"


def _match_compounds(
    feature_table: pd.DataFrame,
    compound_db: pd.DataFrame,
    params: dict,
) -> pd.DataFrame:
    """
    For each feature, search compound_db for m/z matches within ppm tolerance.

    Returns identified_compounds DataFrame with columns:
        feature_id, mz_center, rt_apex, peak_height, peak_area,
        compound_name, compound_class, adduct, ppm_error, confidence
    """
    empty_cols = [
        "feature_id", "mz_center", "rt_apex", "peak_height", "peak_area",
        "compound_name", "compound_class", "adduct", "ppm_error", "confidence",
    ]

    if feature_table.empty or compound_db.empty:
        return pd.DataFrame(columns=empty_cols)

    mz_tolerance_ppm = params["mz_tolerance_ppm"]
    ionization_mode = params["ionization_mode"]
    adduct_priority = _get_adduct_priority(ionization_mode)

    # Only keep adduct columns that actually exist in compound_db
    available_adducts = [col for col in adduct_priority if col in compound_db.columns]

    if not available_adducts:
        return pd.DataFrame(columns=empty_cols)

    matches: list[dict] = []

    for _, feat in feature_table.iterrows():
        measured_mz = feat["mz_center"]
        best_match: dict | None = None
        best_ppm = np.inf

        for adduct_col in available_adducts:
            # Drop rows where the adduct column is NaN
            valid_db = compound_db.dropna(subset=[adduct_col])

            if valid_db.empty:
                continue

            ref_mz_arr = valid_db[adduct_col].values
            ppm_arr = np.abs((measured_mz - ref_mz_arr) / ref_mz_arr) * 1e6

            within_tol = ppm_arr <= mz_tolerance_ppm
            if not within_tol.any():
                continue

            # Among all hits within tolerance, pick the one with smallest ppm
            best_idx_in_valid = int(np.argmin(np.where(within_tol, ppm_arr, np.inf)))
            candidate_ppm = float(ppm_arr[best_idx_in_valid])

            if candidate_ppm < best_ppm:
                best_ppm = candidate_ppm
                db_row = valid_db.iloc[best_idx_in_valid]
                best_match = {
                    "feature_id": feat["feature_id"],
                    "mz_center": feat["mz_center"],
                    "rt_apex": feat["rt_apex"],
                    "peak_height": feat["peak_height"],
                    "peak_area": feat["peak_area"],
                    "compound_name": db_row.get("compound_name", db_row.get("name", "Unknown")),
                    "compound_class": db_row.get("compound_class", db_row.get("class", "Unknown")),
                    "adduct": adduct_col,
                    "ppm_error": round(candidate_ppm, 4),
                    "confidence": _confidence_label(candidate_ppm),
                }

        if best_match is not None:
            matches.append(best_match)

    if not matches:
        return pd.DataFrame(columns=empty_cols)

    identified = pd.DataFrame(matches)
    identified = identified.sort_values("peak_height", ascending=False).reset_index(drop=True)
    return identified


# ---------------------------------------------------------------------------
# Step 5 – QC Metrics (post-identification)
# ---------------------------------------------------------------------------

def _build_qc_metrics(
    raw_summary: dict,
    feature_table: pd.DataFrame,
    identified_compounds: pd.DataFrame,
) -> dict:
    """
    Combine raw data summary with feature/identification statistics.
    """
    total_features = len(feature_table)
    features_identified = len(identified_compounds)
    identification_rate = (
        round(features_identified / total_features * 100, 2)
        if total_features > 0
        else 0.0
    )

    most_abundant_compound: str | None = None
    compound_class_breakdown: dict[str, int] = {}

    if not identified_compounds.empty:
        most_abundant_row = identified_compounds.loc[
            identified_compounds["peak_height"].idxmax()
        ]
        most_abundant_compound = str(most_abundant_row["compound_name"])

        class_counts = (
            identified_compounds["compound_class"]
            .value_counts()
            .to_dict()
        )
        compound_class_breakdown = {str(k): int(v) for k, v in class_counts.items()}

    qc = {
        **raw_summary,
        "total_features_detected": total_features,
        "features_identified": features_identified,
        "identification_rate_pct": identification_rate,
        "most_abundant_compound": most_abundant_compound,
        "compound_class_breakdown": compound_class_breakdown,
    }
    return qc


# ---------------------------------------------------------------------------
# Public API – Main Pipeline
# ---------------------------------------------------------------------------

def run_pipeline(
    raw_df: pd.DataFrame,
    compound_db: pd.DataFrame,
    params: dict | None = None,
) -> dict:
    """
    Run the full MS environmental contaminant analysis pipeline.

    Parameters
    ----------
    raw_df : pd.DataFrame
        Raw mass spectrometry data.  Required columns: rt (float, minutes),
        mz (float, Da), intensity (float).
    compound_db : pd.DataFrame
        Reference compound database.  Required columns: compound_name,
        compound_class, and at least one of: mz_pos_H, mz_pos_NH4,
        mz_pos_Na, mz_neg_H, mz_neg_Cl.
    params : dict, optional
        Processing parameters.  Missing keys are filled with defaults:
            intensity_threshold  : 1000
            mz_tolerance_ppm     : 10
            ionization_mode      : 'negative'  ('positive' also accepted)
            rt_window            : 0.1  (minutes, ± integration window)
            min_peak_width       : 0.05 (minutes)

    Returns
    -------
    dict with keys:
        'feature_table'        – pd.DataFrame of detected chromatographic peaks
        'identified_compounds' – pd.DataFrame of database-matched features
        'qc_metrics'           – dict of QC and summary statistics
        'chromatogram'         – pd.DataFrame (rt, tic) Total Ion Chromatogram
    """
    params = _merge_params(params)

    # --- Validate / normalise input ---
    required_raw_cols = {"rt", "mz", "intensity"}
    if not raw_df.empty:
        missing = required_raw_cols - set(raw_df.columns)
        if missing:
            raise ValueError(
                f"raw_df is missing required columns: {missing}. "
                f"Available columns: {list(raw_df.columns)}"
            )
        raw_df = raw_df[["rt", "mz", "intensity"]].copy()
        raw_df["rt"] = pd.to_numeric(raw_df["rt"], errors="coerce")
        raw_df["mz"] = pd.to_numeric(raw_df["mz"], errors="coerce")
        raw_df["intensity"] = pd.to_numeric(raw_df["intensity"], errors="coerce")
        raw_df = raw_df.dropna(subset=["rt", "mz", "intensity"])
        raw_df = raw_df[raw_df["intensity"] > 0].reset_index(drop=True)

    # --- Step 1: Raw data summary ---
    raw_summary = _raw_data_summary(raw_df)

    # --- Step 2: Total Ion Chromatogram ---
    chromatogram = _build_tic(raw_df)

    # --- Step 3: Peak detection ---
    feature_table = _detect_peaks(raw_df, params)

    # --- Step 4: Compound matching ---
    identified_compounds = _match_compounds(feature_table, compound_db, params)

    # --- Step 5: QC metrics ---
    qc_metrics = _build_qc_metrics(raw_summary, feature_table, identified_compounds)

    return {
        "feature_table": feature_table,
        "identified_compounds": identified_compounds,
        "qc_metrics": qc_metrics,
        "chromatogram": chromatogram,
    }
