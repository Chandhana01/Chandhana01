"""
compound_db.py

Comprehensive environmental contaminant compound database for mass spectrometry.
Provides monoisotopic masses, common adduct m/z values, CAS numbers, and
molecular formulas for phthalates, bisphenols, mycotoxins, and pesticides.

Adduct mass offsets used:
    [M+H]+   = M + 1.00728
    [M+NH4]+ = M + 18.03437
    [M+Na]+  = M + 22.98922
    [M-H]-   = M - 1.00728
    [M+Cl]-  = M + 34.96885
"""

import pandas as pd


# ---------------------------------------------------------------------------
# Atomic monoisotopic masses (IUPAC 2016)
# ---------------------------------------------------------------------------
_H  = 1.0078250319
_C  = 12.0000000
_N  = 14.0030740052
_O  = 15.9949146221
_S  = 31.97207069
_Cl = 34.96885271
_P  = 30.97376151
_F  = 18.99840322
_Br = 78.91833710


def _mass(formula: dict) -> float:
    """Return monoisotopic mass from an atom-count dict."""
    atoms = {
        "H": _H, "C": _C, "N": _N, "O": _O,
        "S": _S, "Cl": _Cl, "P": _P, "F": _F, "Br": _Br,
    }
    return sum(atoms[el] * count for el, count in formula.items())


# Adduct offsets
_ADD_H    =  1.00728
_ADD_NH4  = 18.03437
_ADD_Na   = 22.98922
_SUB_H    =  1.00728
_ADD_Cl   = 34.96885


def _adducts(m: float) -> dict:
    return {
        "mz_pos_H":   round(m + _ADD_H,   5),
        "mz_pos_NH4": round(m + _ADD_NH4, 5),
        "mz_pos_Na":  round(m + _ADD_Na,  5),
        "mz_neg_H":   round(m - _SUB_H,   5),
        "mz_neg_Cl":  round(m + _ADD_Cl,  5),
    }


# ---------------------------------------------------------------------------
# Compound records
# ---------------------------------------------------------------------------

def _records() -> list:
    rows = []

    def add(name, cls, cas, formula_str, formula_dict):
        m = round(_mass(formula_dict), 5)
        row = {
            "compound_name":     name,
            "compound_class":    cls,
            "cas_number":        cas,
            "molecular_formula": formula_str,
            "monoisotopic_mass": m,
        }
        row.update(_adducts(m))
        rows.append(row)

    # -----------------------------------------------------------------------
    # PHTHALATES
    # -----------------------------------------------------------------------
    # DMP  Dimethyl phthalate  C10H10O4
    add("Dimethyl phthalate (DMP)", "Phthalate", "131-11-3",
        "C10H10O4", {"C": 10, "H": 10, "O": 4})

    # DEP  Diethyl phthalate  C12H14O4
    add("Diethyl phthalate (DEP)", "Phthalate", "84-66-2",
        "C12H14O4", {"C": 12, "H": 14, "O": 4})

    # DBP  Di-n-butyl phthalate  C16H22O4
    add("Di-n-butyl phthalate (DBP)", "Phthalate", "84-74-2",
        "C16H22O4", {"C": 16, "H": 22, "O": 4})

    # BBP  Benzyl butyl phthalate  C19H20O4
    add("Benzyl butyl phthalate (BBP)", "Phthalate", "85-68-7",
        "C19H20O4", {"C": 19, "H": 20, "O": 4})

    # DEHP  Bis(2-ethylhexyl) phthalate  C24H38O4
    add("Bis(2-ethylhexyl) phthalate (DEHP)", "Phthalate", "117-81-7",
        "C24H38O4", {"C": 24, "H": 38, "O": 4})

    # DINP  Diisononyl phthalate (representative isomer)  C26H42O4
    add("Diisononyl phthalate (DINP)", "Phthalate", "28553-12-0",
        "C26H42O4", {"C": 26, "H": 42, "O": 4})

    # DIDP  Diisodecyl phthalate (representative isomer)  C28H46O4
    add("Diisodecyl phthalate (DIDP)", "Phthalate", "26761-40-0",
        "C28H46O4", {"C": 28, "H": 46, "O": 4})

    # DCHP  Dicyclohexyl phthalate  C20H26O4
    add("Dicyclohexyl phthalate (DCHP)", "Phthalate", "84-61-7",
        "C20H26O4", {"C": 20, "H": 26, "O": 4})

    # DNOP  Di-n-octyl phthalate  C24H38O4  (same formula as DEHP, different structure)
    add("Di-n-octyl phthalate (DNOP)", "Phthalate", "117-84-0",
        "C24H38O4", {"C": 24, "H": 38, "O": 4})

    # DPP  Di-n-pentyl phthalate  C18H26O4
    add("Di-n-pentyl phthalate (DPP)", "Phthalate", "131-18-0",
        "C18H26O4", {"C": 18, "H": 26, "O": 4})

    # -----------------------------------------------------------------------
    # BISPHENOLS
    # -----------------------------------------------------------------------
    # BPA  Bisphenol A  C15H16O2
    add("Bisphenol A (BPA)", "Bisphenol", "80-05-7",
        "C15H16O2", {"C": 15, "H": 16, "O": 2})

    # BPF  Bisphenol F  C13H12O2
    add("Bisphenol F (BPF)", "Bisphenol", "620-92-8",
        "C13H12O2", {"C": 13, "H": 12, "O": 2})

    # BPS  Bisphenol S  C12H10O4S
    add("Bisphenol S (BPS)", "Bisphenol", "80-09-1",
        "C12H10O4S", {"C": 12, "H": 10, "O": 4, "S": 1})

    # BPAF  Bisphenol AF  C15H10F6O2
    add("Bisphenol AF (BPAF)", "Bisphenol", "1478-61-1",
        "C15H10F6O2", {"C": 15, "H": 10, "F": 6, "O": 2})

    # BPB  Bisphenol B  C16H18O2
    add("Bisphenol B (BPB)", "Bisphenol", "77-40-7",
        "C16H18O2", {"C": 16, "H": 18, "O": 2})

    # BPC  Bisphenol C  C17H20O2
    add("Bisphenol C (BPC)", "Bisphenol", "14868-03-2",
        "C17H20O2", {"C": 17, "H": 20, "O": 2})

    # BPE  Bisphenol E  C14H14O2
    add("Bisphenol E (BPE)", "Bisphenol", "2081-08-5",
        "C14H14O2", {"C": 14, "H": 14, "O": 2})

    # TMBPA  Tetramethyl bisphenol A  C19H24O2
    add("Tetramethyl bisphenol A (TMBPA)", "Bisphenol", "5613-46-7",
        "C19H24O2", {"C": 19, "H": 24, "O": 2})

    # BPP  Bisphenol P  C23H24O2
    add("Bisphenol P (BPP)", "Bisphenol", "2167-51-3",
        "C23H24O2", {"C": 23, "H": 24, "O": 2})

    # BPAP  Bisphenol AP  C21H20O2
    add("Bisphenol AP (BPAP)", "Bisphenol", "1571-75-1",
        "C21H20O2", {"C": 21, "H": 20, "O": 2})

    # -----------------------------------------------------------------------
    # MYCOTOXINS
    # -----------------------------------------------------------------------
    # Aflatoxin B1  C17H12O6
    add("Aflatoxin B1", "Mycotoxin", "1162-65-8",
        "C17H12O6", {"C": 17, "H": 12, "O": 6})

    # Aflatoxin B2  C17H14O6
    add("Aflatoxin B2", "Mycotoxin", "7220-81-7",
        "C17H14O6", {"C": 17, "H": 14, "O": 6})

    # Aflatoxin G1  C17H12O7
    add("Aflatoxin G1", "Mycotoxin", "1165-39-5",
        "C17H12O7", {"C": 17, "H": 12, "O": 7})

    # Aflatoxin G2  C17H14O7
    add("Aflatoxin G2", "Mycotoxin", "7241-98-7",
        "C17H14O7", {"C": 17, "H": 14, "O": 7})

    # Ochratoxin A  C20H18ClNO6
    add("Ochratoxin A", "Mycotoxin", "303-47-9",
        "C20H18ClNO6", {"C": 20, "H": 18, "Cl": 1, "N": 1, "O": 6})

    # Zearalenone  C18H22O5
    add("Zearalenone", "Mycotoxin", "17924-92-4",
        "C18H22O5", {"C": 18, "H": 22, "O": 5})

    # Deoxynivalenol (DON / vomitoxin)  C15H20O6
    add("Deoxynivalenol (DON)", "Mycotoxin", "51481-10-8",
        "C15H20O6", {"C": 15, "H": 20, "O": 6})

    # Fumonisin B1  C34H59NO15
    add("Fumonisin B1", "Mycotoxin", "116355-83-0",
        "C34H59NO15", {"C": 34, "H": 59, "N": 1, "O": 15})

    # Fumonisin B2  C34H59NO14
    add("Fumonisin B2", "Mycotoxin", "116355-84-1",
        "C34H59NO14", {"C": 34, "H": 59, "N": 1, "O": 14})

    # T-2 Toxin  C24H34O9
    add("T-2 Toxin", "Mycotoxin", "21259-20-1",
        "C24H34O9", {"C": 24, "H": 34, "O": 9})

    # HT-2 Toxin  C22H32O8
    add("HT-2 Toxin", "Mycotoxin", "26934-87-2",
        "C22H32O8", {"C": 22, "H": 32, "O": 8})

    # Patulin  C7H6O4
    add("Patulin", "Mycotoxin", "149-29-1",
        "C7H6O4", {"C": 7, "H": 6, "O": 4})

    # -----------------------------------------------------------------------
    # PESTICIDES
    # -----------------------------------------------------------------------
    # Atrazine  C8H14ClN5
    add("Atrazine", "Pesticide", "1912-24-9",
        "C8H14ClN5", {"C": 8, "H": 14, "Cl": 1, "N": 5})

    # Chlorpyrifos  C9H11Cl3NO3PS
    add("Chlorpyrifos", "Pesticide", "2921-88-2",
        "C9H11Cl3NO3PS", {"C": 9, "H": 11, "Cl": 3, "N": 1, "O": 3, "P": 1, "S": 1})

    # Malathion  C10H19O6PS2
    add("Malathion", "Pesticide", "121-75-5",
        "C10H19O6PS2", {"C": 10, "H": 19, "O": 6, "P": 1, "S": 2})

    # Permethrin  C21H20Cl2O3
    add("Permethrin", "Pesticide", "52645-53-1",
        "C21H20Cl2O3", {"C": 21, "H": 20, "Cl": 2, "O": 3})

    # Diazinon  C12H21N2O3PS
    add("Diazinon", "Pesticide", "333-41-5",
        "C12H21N2O3PS", {"C": 12, "H": 21, "N": 2, "O": 3, "P": 1, "S": 1})

    # Cypermethrin  C22H19Cl2NO3
    add("Cypermethrin", "Pesticide", "52315-07-8",
        "C22H19Cl2NO3", {"C": 22, "H": 19, "Cl": 2, "N": 1, "O": 3})

    # Endosulfan (alpha)  C9H6Cl6O3S
    add("Endosulfan", "Pesticide", "115-29-7",
        "C9H6Cl6O3S", {"C": 9, "H": 6, "Cl": 6, "O": 3, "S": 1})

    # Lindane (gamma-HCH)  C6H6Cl6
    add("Lindane", "Pesticide", "58-89-9",
        "C6H6Cl6", {"C": 6, "H": 6, "Cl": 6})

    # DDT (p,p'-DDT)  C14H9Cl5
    add("DDT (p,p')", "Pesticide", "50-29-3",
        "C14H9Cl5", {"C": 14, "H": 9, "Cl": 5})

    # Glyphosate  C3H8NO5P
    add("Glyphosate", "Pesticide", "1071-83-6",
        "C3H8NO5P", {"C": 3, "H": 8, "N": 1, "O": 5, "P": 1})

    return rows


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_compound_db() -> pd.DataFrame:
    """
    Return a pandas DataFrame of environmental contaminant compounds with
    monoisotopic masses and common ESI adduct m/z values.

    Columns
    -------
    compound_name      : str   — IUPAC/common name with abbreviation
    compound_class     : str   — "Phthalate", "Bisphenol", "Mycotoxin", or "Pesticide"
    cas_number         : str   — CAS registry number
    molecular_formula  : str   — Hill-order molecular formula
    monoisotopic_mass  : float — neutral monoisotopic mass (Da), 5 decimal places
    mz_pos_H           : float — [M+H]+  m/z
    mz_pos_NH4         : float — [M+NH4]+ m/z
    mz_pos_Na          : float — [M+Na]+  m/z
    mz_neg_H           : float — [M-H]-   m/z
    mz_neg_Cl          : float — [M+Cl]-  m/z

    Returns
    -------
    pd.DataFrame with 42 rows (10 phthalates, 10 bisphenols,
                                12 mycotoxins, 10 pesticides).
    """
    columns = [
        "compound_name",
        "compound_class",
        "cas_number",
        "molecular_formula",
        "monoisotopic_mass",
        "mz_pos_H",
        "mz_pos_NH4",
        "mz_pos_Na",
        "mz_neg_H",
        "mz_neg_Cl",
    ]
    df = pd.DataFrame(_records(), columns=columns)
    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    df = get_compound_db()
    print(f"Total compounds: {len(df)}")
    print(df.groupby("compound_class")["compound_name"].count().to_string())
    print()
    print(df.to_string(index=False))
