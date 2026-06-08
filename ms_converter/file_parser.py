"""
file_parser.py
--------------
Parses mass spectrometry data files into a standardized pandas DataFrame.

Supported input formats
-----------------------
    CSV / TSV   – flexible column names
    mzML        – via pyteomics (falls back with a clear error when absent)
    MGF         – via pyteomics (falls back with a clear error when absent)

Output DataFrame columns
------------------------
    scan_number  (int)   – 1-based scan index
    ms_level     (int)   – MS level, default 1 when not present in the file
    rt           (float) – retention time in *minutes*
    mz           (float) – measured m/z
    intensity    (float) – signal intensity

Public API
----------
    parse_file(uploaded_file_or_path, file_format: str) -> pd.DataFrame
    detect_format(filename: str) -> str
"""

from __future__ import annotations

import io
import os
import re
import warnings
from pathlib import Path
from typing import Union

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Optional dependency guard – pyteomics
# ---------------------------------------------------------------------------
try:
    from pyteomics import mzml as _pt_mzml
    from pyteomics import mgf as _pt_mgf
    _PYTEOMICS_AVAILABLE = True
except ImportError:
    _PYTEOMICS_AVAILABLE = False

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------
_SCHEMA_COLS: list[str] = ["scan_number", "ms_level", "rt", "mz", "intensity"]

# ---------------------------------------------------------------------------
# Flexible column-name patterns (matched case-insensitively)
# ---------------------------------------------------------------------------
_RE_MZ = re.compile(
    r"^(mz|m[/_\-\.]z|mass[_\-]?to[_\-]?charge|masscharg e?|mass)$",
    re.IGNORECASE,
)
_RE_INT = re.compile(
    r"^(intensity|intensities|int\.?|signal|abundance|count s?|peak[_\-]?area)$",
    re.IGNORECASE,
)
_RE_RT = re.compile(
    r"^(rt|retention[_\-]?time|time|ret[_\-]?time|scan[_\-]?time|elution[_\-]?time)$",
    re.IGNORECASE,
)
_RE_SCAN = re.compile(
    r"^(scan[_\-]?(number|num|no|id|index)?|spectrum[_\-]?(number|num|id|index)?)$",
    re.IGNORECASE,
)
_RE_MSLEVEL = re.compile(
    r"^(ms[_\-]?level|mslevel|ms)$",
    re.IGNORECASE,
)


def _first_match(columns: list[str], pattern: re.Pattern) -> str | None:
    """Return the first column name matching *pattern*, or None."""
    for col in columns:
        if pattern.fullmatch(col.strip()):
            return col
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_format(filename: str) -> str:
    """
    Infer file format from *filename*'s extension.

    Returns
    -------
    str
        One of ``'csv'``, ``'tsv'``, ``'mzml'``, ``'mgf'``.

    Raises
    ------
    ValueError
        When the extension is not recognised.
    """
    ext = Path(filename).suffix.lower().lstrip(".")
    _MAP = {
        "csv": "csv",
        "tsv": "tsv",
        "txt": "csv",    # plain-text; delimiter auto-detected
        "mzml": "mzml",
        "mzxml": "mzml",
        "mgf": "mgf",
    }
    fmt = _MAP.get(ext)
    if fmt is None:
        raise ValueError(
            f"Unrecognised file extension '.{ext}'. "
            "Supported: .csv, .tsv, .txt, .mzml, .mzxml, .mgf"
        )
    return fmt


def parse_file(
    uploaded_file_or_path: Union[str, "os.PathLike[str]", "io.IOBase"],
    file_format: str,
) -> pd.DataFrame:
    """
    Parse a mass-spectrometry data file into a standardised DataFrame.

    Parameters
    ----------
    uploaded_file_or_path :
        A filesystem path (``str`` / ``pathlib.Path``) **or** any file-like
        object with a ``.read()`` method (e.g. ``streamlit.runtime.uploaded_file_manager.UploadedFile``,
        ``io.BytesIO``, open file handles, …).
    file_format : str
        One of ``'csv'``, ``'tsv'``, ``'mzml'``, ``'mgf'``.
        Use :func:`detect_format` to derive this from the filename.

    Returns
    -------
    pd.DataFrame
        Columns: ``scan_number`` (int), ``ms_level`` (int), ``rt`` (float,
        minutes), ``mz`` (float), ``intensity`` (float).

    Raises
    ------
    ValueError
        On unsupported format or unrecoverable content errors.
    FileNotFoundError
        When a path is supplied that does not exist on disk.
    ImportError
        When pyteomics is missing and an mzML/MGF file is requested.
    RuntimeError
        Wraps unexpected low-level errors with an informative message.
    """
    fmt = file_format.lower().strip()
    _SUPPORTED = {"csv", "tsv", "mzml", "mgf"}
    if fmt not in _SUPPORTED:
        raise ValueError(
            f"Unsupported format '{file_format}'. "
            f"Choose from: {', '.join(sorted(_SUPPORTED))}"
        )

    source, source_name = _resolve_source(uploaded_file_or_path)

    try:
        if fmt in ("csv", "tsv"):
            df = _parse_delimited(source, fmt, source_name)
        elif fmt == "mzml":
            df = _parse_mzml(source, source_name)
        else:  # mgf
            df = _parse_mgf(source, source_name)
    except (ImportError, FileNotFoundError, ValueError):
        raise
    except Exception as exc:
        raise RuntimeError(
            f"Unexpected error while parsing '{source_name}' as {fmt.upper()}: {exc}"
        ) from exc

    return _enforce_schema(df)


# ---------------------------------------------------------------------------
# Internal helpers – source normalisation
# ---------------------------------------------------------------------------

def _resolve_source(
    src: Union[str, "os.PathLike[str]", "io.IOBase"],
) -> tuple[Union[Path, io.BytesIO], str]:
    """
    Return ``(source, display_name)`` where *source* is either a
    ``pathlib.Path`` (for on-disk files) or a seekable ``io.BytesIO``
    (for in-memory / uploaded file objects).
    """
    if isinstance(src, (str, os.PathLike)):
        path = Path(src)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        return path, str(path)

    # File-like object
    name = getattr(src, "name", "<uploaded file>")
    if hasattr(src, "seek"):
        src.seek(0)
    raw = src.read()
    if isinstance(raw, str):
        raw = raw.encode("utf-8")
    return io.BytesIO(raw), name


# ---------------------------------------------------------------------------
# CSV / TSV parser
# ---------------------------------------------------------------------------

def _parse_delimited(
    source: Union[Path, io.BytesIO],
    fmt: str,
    source_name: str,
) -> pd.DataFrame:
    """
    Read a delimited file with flexible column names and return a DataFrame
    with *at least* ``mz`` and ``intensity`` columns.
    """
    # Decode to text
    if isinstance(source, io.BytesIO):
        source.seek(0)
        text = source.read().decode("utf-8", errors="replace")
    else:
        text = source.read_text(encoding="utf-8", errors="replace")

    # Auto-detect delimiter: prefer explicit TSV, otherwise let pandas sniff
    first_line = text.split("\n")[0] if text else ""
    if fmt == "tsv" or (fmt == "csv" and "\t" in first_line and "," not in first_line):
        sep = "\t"
    else:
        sep = None  # pandas engine="python" will sniff

    try:
        raw = pd.read_csv(
            io.StringIO(text),
            sep=sep,
            engine="python",
            comment="#",
            skip_blank_lines=True,
        )
    except Exception as exc:
        raise ValueError(
            f"Could not parse '{source_name}' as delimited text: {exc}"
        ) from exc

    if raw.empty:
        raise ValueError(
            f"'{source_name}' is empty or contains no data rows after the header."
        )

    cols = raw.columns.tolist()

    # --- Required columns ---------------------------------------------------
    mz_col = _first_match(cols, _RE_MZ)
    int_col = _first_match(cols, _RE_INT)

    missing = []
    if mz_col is None:
        missing.append("m/z  (expected: mz, m/z, mass_to_charge, …)")
    if int_col is None:
        missing.append("intensity  (expected: intensity, int, signal, abundance, …)")
    if missing:
        raise ValueError(
            f"Required columns not found in '{source_name}'.\n"
            f"  Missing: {'; '.join(missing)}\n"
            f"  Columns present: {cols}"
        )

    # --- Optional columns ---------------------------------------------------
    rt_col = _first_match(cols, _RE_RT)
    scan_col = _first_match(cols, _RE_SCAN)
    level_col = _first_match(cols, _RE_MSLEVEL)

    out: dict[str, "pd.Series"] = {
        "mz": pd.to_numeric(raw[mz_col], errors="coerce"),
        "intensity": pd.to_numeric(raw[int_col], errors="coerce"),
        "rt": pd.to_numeric(raw[rt_col], errors="coerce") if rt_col else pd.Series(np.nan, index=raw.index),
        "scan_number": pd.to_numeric(raw[scan_col], errors="coerce") if scan_col else pd.Series(np.nan, index=raw.index),
        "ms_level": pd.to_numeric(raw[level_col], errors="coerce") if level_col else pd.Series(np.nan, index=raw.index),
    }

    df = pd.DataFrame(out)
    df = df.dropna(subset=["mz", "intensity"], how="all")
    return df


# ---------------------------------------------------------------------------
# mzML parser
# ---------------------------------------------------------------------------

def _parse_mzml(
    source: Union[Path, io.BytesIO],
    source_name: str,
) -> pd.DataFrame:
    """Parse an mzML file using pyteomics.mzml."""
    if not _PYTEOMICS_AVAILABLE:
        raise ImportError(
            "The 'pyteomics' package is required to read mzML files.\n"
            "Install it with:  pip install pyteomics lxml"
        )

    if isinstance(source, io.BytesIO):
        source.seek(0)

    rows: list[dict] = []
    scan_idx = 0

    try:
        with _pt_mzml.MzML(source) as reader:
            for spectrum in reader:
                scan_idx += 1

                mz_arr = np.asarray(spectrum.get("m/z array", []), dtype=np.float64)
                int_arr = np.asarray(spectrum.get("intensity array", []), dtype=np.float64)

                if mz_arr.size == 0:
                    continue
                if int_arr.size != mz_arr.size:
                    int_arr = np.zeros_like(mz_arr)

                ms_level = int(spectrum.get("ms level", 1))
                rt = _rt_from_mzml_spectrum(spectrum)
                scan_num = _scan_number_from_id(spectrum.get("id", ""), scan_idx)

                n = mz_arr.size
                rows.append(
                    pd.DataFrame(
                        {
                            "scan_number": np.full(n, scan_num, dtype=np.int64),
                            "ms_level": np.full(n, ms_level, dtype=np.int64),
                            "rt": np.full(n, rt, dtype=np.float64),
                            "mz": mz_arr,
                            "intensity": int_arr,
                        }
                    )
                )
    except (ImportError, ValueError):
        raise
    except Exception as exc:
        raise ValueError(f"Failed to parse mzML '{source_name}': {exc}") from exc

    if not rows:
        raise ValueError(
            f"No spectra with m/z data were found in '{source_name}'."
        )
    return pd.concat(rows, ignore_index=True)


def _rt_from_mzml_spectrum(spectrum: dict) -> float:
    """Extract retention time in minutes from a pyteomics mzML spectrum dict."""
    scan_list = spectrum.get("scanList", {}).get("scan", [{}])
    if not scan_list:
        return np.nan
    scan = scan_list[0]

    # pyteomics >= 4.x stores pint quantities; plain floats in older versions
    for key in ("scan start time", "retention time"):
        val = scan.get(key)
        if val is None:
            continue
        try:
            rt = float(val)
        except (TypeError, ValueError):
            continue
        # Detect seconds via pint unit_info attribute or a separate key
        unit_key = key + " unit"
        unit = str(scan.get(unit_key, ""))
        if not unit:
            unit = str(getattr(val, "unit_info", ""))
        if "second" in unit.lower():
            rt /= 60.0
        return rt
    return np.nan


# ---------------------------------------------------------------------------
# MGF parser
# ---------------------------------------------------------------------------

def _parse_mgf(
    source: Union[Path, io.BytesIO],
    source_name: str,
) -> pd.DataFrame:
    """Parse an MGF file using pyteomics.mgf."""
    if not _PYTEOMICS_AVAILABLE:
        raise ImportError(
            "The 'pyteomics' package is required to read MGF files.\n"
            "Install it with:  pip install pyteomics"
        )

    if isinstance(source, io.BytesIO):
        source.seek(0)

    rows: list[dict] = []
    scan_idx = 0

    try:
        with _pt_mgf.MGF(source) as reader:
            for spectrum in reader:
                scan_idx += 1

                mz_arr = np.asarray(spectrum.get("m/z array", []), dtype=np.float64)
                int_arr = np.asarray(spectrum.get("intensity array", []), dtype=np.float64)

                if mz_arr.size == 0:
                    continue
                if int_arr.size != mz_arr.size:
                    int_arr = np.zeros_like(mz_arr)

                params = spectrum.get("params", {})
                rt = _rt_from_mgf_params(params)
                scan_num = _scan_number_from_mgf_params(params, scan_idx)
                ms_level = int(params.get("mslevel", params.get("ms_level", 2)))

                n = mz_arr.size
                rows.append(
                    pd.DataFrame(
                        {
                            "scan_number": np.full(n, scan_num, dtype=np.int64),
                            "ms_level": np.full(n, ms_level, dtype=np.int64),
                            "rt": np.full(n, rt, dtype=np.float64),
                            "mz": mz_arr,
                            "intensity": int_arr,
                        }
                    )
                )
    except (ImportError, ValueError):
        raise
    except Exception as exc:
        raise ValueError(f"Failed to parse MGF '{source_name}': {exc}") from exc

    if not rows:
        raise ValueError(
            f"No spectra with m/z data were found in '{source_name}'."
        )
    return pd.concat(rows, ignore_index=True)


def _rt_from_mgf_params(params: dict) -> float:
    """Extract retention time in minutes from an MGF params dict."""
    for key in ("rtinseconds", "rt", "retention time", "retentiontime"):
        val = params.get(key)
        if val is not None:
            try:
                rt = float(val)
                return rt / 60.0 if key == "rtinseconds" else rt
            except (TypeError, ValueError):
                continue
    return np.nan


def _scan_number_from_mgf_params(params: dict, fallback: int) -> int:
    """Extract an integer scan number from an MGF params dict."""
    for key in ("scans", "scan", "title"):
        val = params.get(key)
        if val is not None:
            m = re.search(r"(\d+)", str(val))
            if m:
                return int(m.group(1))
    return fallback


# ---------------------------------------------------------------------------
# Shared utilities
# ---------------------------------------------------------------------------

def _scan_number_from_id(spec_id: str, fallback: int) -> int:
    """Extract integer scan number from strings like ``'scan=123'``."""
    m = re.search(r"(?:scan|index|spectrum)\s*[=:]\s*(\d+)", spec_id, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m2 = re.search(r"\d+", spec_id)
    if m2:
        return int(m2.group())
    return fallback


# ---------------------------------------------------------------------------
# Schema enforcement
# ---------------------------------------------------------------------------

def _enforce_schema(df: pd.DataFrame) -> pd.DataFrame:
    """
    Guarantee output has exactly :data:`_SCHEMA_COLS` with correct dtypes.
    Fills defaults (``scan_number`` = sequential, ``ms_level`` = 1,
    ``rt`` = NaN) when columns were absent in the source file.
    """
    df = df.copy()

    # Ensure all schema columns exist
    for col in _SCHEMA_COLS:
        if col not in df.columns:
            df[col] = np.nan

    # Numeric coercion
    for col in ("mz", "intensity", "rt"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ms_level default = 1
    df["ms_level"] = pd.to_numeric(df["ms_level"], errors="coerce").fillna(1)

    # scan_number: fill NaN with sequential index, then cast to int
    if df["scan_number"].isna().any():
        sequential = pd.Series(range(1, len(df) + 1), index=df.index, dtype=float)
        df["scan_number"] = df["scan_number"].fillna(sequential)

    df["scan_number"] = pd.to_numeric(df["scan_number"], errors="coerce").astype("Int64")
    df["ms_level"] = df["ms_level"].astype("Int64")

    # Drop rows with unusable m/z
    n_before = len(df)
    df = df.dropna(subset=["mz"])
    n_dropped = n_before - len(df)
    if n_dropped > 0:
        warnings.warn(
            f"{n_dropped} row(s) dropped: m/z could not be parsed as a number.",
            stacklevel=4,
        )

    # Drop negative intensities (noise artefacts)
    df = df[df["intensity"].isna() | (df["intensity"] >= 0)]

    return df[_SCHEMA_COLS].reset_index(drop=True)
