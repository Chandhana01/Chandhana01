"""
MS Data Converter — Streamlit Web Application
Phthalates · Bisphenols · Environmental Toxins
"""

import os
import sys

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

sys.path.insert(0, os.path.dirname(__file__))

from compound_db import get_compound_db
from demo_data import generate_demo_data, get_demo_metadata
from file_parser import detect_format, parse_file
from processor import DEFAULT_PARAMS, run_pipeline

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="MS Data Converter",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Custom CSS
# ---------------------------------------------------------------------------

st.markdown(
    """
    <style>
    /* Confidence badge colours */
    .badge-high   { background:#1a9641; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.8em; font-weight:600; }
    .badge-medium { background:#f07300; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.8em; font-weight:600; }
    .badge-low    { background:#d7191c; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.8em; font-weight:600; }
    /* Metric cards */
    [data-testid="metric-container"] {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 8px 14px;
    }
    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        border-radius: 6px 6px 0 0;
        padding: 8px 18px;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CONFIDENCE_COLORS = {"High": "#1a9641", "Medium": "#f07300", "Low": "#d7191c"}
CLASS_COLORS = {
    "Phthalate": "#4e79a7",
    "Bisphenol": "#f28e2b",
    "Mycotoxin": "#e15759",
    "Pesticide": "#76b7b2",
}
ALL_CLASSES = ["Phthalate", "Bisphenol", "Mycotoxin", "Pesticide"]

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

col_title, col_logo = st.columns([5, 1])
with col_title:
    st.markdown("## 🔬 MS Data Converter")
    st.markdown(
        "**Phthalates · Bisphenols · Environmental Toxins**  \n"
        "Automated LC-MS feature detection and compound identification for environmental contaminant screening."
    )
st.divider()

# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------

with st.sidebar:
    st.markdown("### Data Source")
    data_source = st.radio(
        "Select input",
        ["Upload File", "Use Demo Data"],
        label_visibility="collapsed",
    )

    uploaded_file = None
    if data_source == "Upload File":
        uploaded_file = st.file_uploader(
            "Upload MS data file",
            type=["csv", "tsv", "mzML", "mgf"],
            help="Accepted formats: CSV, TSV, mzML, MGF",
        )
    else:
        st.info("Demo data: 6-compound LC-MS simulation (20 min run, negative mode).")

    st.markdown("---")

    with st.expander("⚙️ Processing Parameters", expanded=False):
        ionization_mode_label = st.selectbox(
            "Ionization Mode",
            ["Negative [M-H]-", "Positive [M+H]+"],
        )
        ionization_mode = (
            "negative" if ionization_mode_label.startswith("Negative") else "positive"
        )

        mz_tolerance_ppm = st.slider(
            "m/z Tolerance (ppm)",
            min_value=1,
            max_value=20,
            value=10,
            step=1,
        )

        intensity_threshold = st.number_input(
            "Intensity Threshold",
            min_value=0,
            value=1000,
            step=100,
            help="Minimum peak intensity to be considered a feature.",
        )

    st.markdown("---")
    st.markdown("### Compound Filter")
    selected_classes = st.multiselect(
        "Compound Classes",
        options=ALL_CLASSES,
        default=ALL_CLASSES,
        help="Only compounds from selected classes will be shown in results.",
    )

    st.markdown("---")
    run_btn = st.button("▶  Run Analysis", type="primary", use_container_width=True)

# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

if "results" not in st.session_state:
    st.session_state["results"] = None
if "raw_df" not in st.session_state:
    st.session_state["raw_df"] = None
if "metadata" not in st.session_state:
    st.session_state["metadata"] = {}

# ---------------------------------------------------------------------------
# Run analysis
# ---------------------------------------------------------------------------

if run_btn:
    # Build params dict
    params = {
        "ionization_mode": ionization_mode,
        "mz_tolerance_ppm": mz_tolerance_ppm,
        "intensity_threshold": intensity_threshold,
    }

    try:
        with st.spinner("Processing…"):
            # Load data
            if data_source == "Use Demo Data":
                raw_df = generate_demo_data()
                metadata = get_demo_metadata()
            else:
                if uploaded_file is None:
                    st.error("Please upload a file before running the analysis.")
                    st.stop()
                fmt = detect_format(uploaded_file.name)
                raw_df = parse_file(uploaded_file, fmt)
                metadata = {"source": uploaded_file.name, "format": fmt}

            # Filter compound DB by selected classes
            compound_db = get_compound_db()
            if selected_classes:
                compound_db = compound_db[
                    compound_db["compound_class"].isin(selected_classes)
                ].reset_index(drop=True)

            # Run pipeline
            results = run_pipeline(raw_df, compound_db, params)

        st.session_state["results"] = results
        st.session_state["raw_df"] = raw_df
        st.session_state["metadata"] = metadata
        st.success("Analysis complete!")

    except Exception as exc:
        st.error(f"Pipeline error: {exc}")
        st.exception(exc)

# ---------------------------------------------------------------------------
# Display results
# ---------------------------------------------------------------------------

results = st.session_state["results"]
raw_df = st.session_state["raw_df"]

if results is None:
    st.markdown(
        """
        <div style='text-align:center; padding:60px 20px; color:#888;'>
            <h3>No results yet</h3>
            <p>Configure parameters in the sidebar and click <strong>Run Analysis</strong>.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    st.stop()

# Unpack
feature_table: pd.DataFrame = results["feature_table"]
identified_compounds: pd.DataFrame = results["identified_compounds"]
qc_metrics: dict = results["qc_metrics"]
chromatogram: pd.DataFrame = results["chromatogram"]

# Apply class filter to identified compounds display
if selected_classes and not identified_compounds.empty:
    if "compound_class" in identified_compounds.columns:
        identified_compounds_filtered = identified_compounds[
            identified_compounds["compound_class"].isin(selected_classes)
        ].reset_index(drop=True)
    else:
        identified_compounds_filtered = identified_compounds
else:
    identified_compounds_filtered = identified_compounds

# ---------------------------------------------------------------------------
# Tabs
# ---------------------------------------------------------------------------

tab_raw, tab_features, tab_identified, tab_qc = st.tabs(
    ["📊 Raw Data", "🔍 Detected Features", "✅ Identified Compounds", "📋 QC Report"]
)

# ============================================================
# TAB 1 — Raw Data
# ============================================================
with tab_raw:
    st.markdown("#### Raw Data Summary")

    # Metrics
    if raw_df is not None and not raw_df.empty:
        total_scans = int(raw_df["rt"].nunique()) if "rt" in raw_df.columns else len(raw_df)
        rt_min = float(raw_df["rt"].min()) if "rt" in raw_df.columns else 0.0
        rt_max = float(raw_df["rt"].max()) if "rt" in raw_df.columns else 0.0
        mz_min = float(raw_df["mz"].min()) if "mz" in raw_df.columns else 0.0
        mz_max = float(raw_df["mz"].max()) if "mz" in raw_df.columns else 0.0
        max_intensity = float(raw_df["intensity"].max()) if "intensity" in raw_df.columns else 0.0
    else:
        total_scans = rt_min = rt_max = mz_min = mz_max = max_intensity = 0.0

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Scans", f"{total_scans:,}")
    m2.metric("RT Range (min)", f"{rt_min:.2f} – {rt_max:.2f}")
    m3.metric("m/z Range (Da)", f"{mz_min:.1f} – {mz_max:.1f}")
    m4.metric("Max Intensity", f"{max_intensity:,.0f}")

    # TIC plot
    st.markdown("#### Total Ion Chromatogram")
    if chromatogram is not None and not chromatogram.empty and "rt" in chromatogram.columns:
        tic_col = "tic" if "tic" in chromatogram.columns else chromatogram.columns[-1]
        fig_tic = px.line(
            chromatogram,
            x="rt",
            y=tic_col,
            labels={"rt": "Retention Time (min)", tic_col: "TIC (counts)"},
            template="plotly_white",
            color_discrete_sequence=["#4e79a7"],
        )
        fig_tic.update_traces(line_width=1.5)
        fig_tic.update_layout(
            height=320,
            margin=dict(l=0, r=0, t=10, b=0),
            xaxis=dict(showgrid=True, gridcolor="#ececec"),
            yaxis=dict(showgrid=True, gridcolor="#ececec"),
        )
        st.plotly_chart(fig_tic, use_container_width=True)
    else:
        st.info("TIC data not available.")

    # Raw data preview
    with st.expander("Raw Data Preview (first 500 rows)"):
        if raw_df is not None and not raw_df.empty:
            st.dataframe(raw_df.head(500), use_container_width=True, height=300)
        else:
            st.info("No raw data to display.")

# ============================================================
# TAB 2 — Detected Features
# ============================================================
with tab_features:
    st.markdown("#### Feature Detection Results")

    n_features = len(feature_table) if feature_table is not None else 0
    st.metric("Total Features Detected", f"{n_features:,}")

    if feature_table is not None and not feature_table.empty:
        # Feature map scatter
        st.markdown("#### Feature Map (RT vs m/z)")

        ft = feature_table.copy()
        # Determine column names flexibly
        rt_col = next((c for c in ["rt_apex", "rt", "rt_center"] if c in ft.columns), None)
        mz_col = next((c for c in ["mz_center", "mz", "mz_apex"] if c in ft.columns), None)
        int_col = next((c for c in ["peak_height", "peak_area", "intensity"] if c in ft.columns), None)

        if rt_col and mz_col and int_col:
            ft["_log_intensity"] = np.log10(ft[int_col].clip(lower=1))
            fig_fm = px.scatter(
                ft,
                x=rt_col,
                y=mz_col,
                size="_log_intensity",
                color=int_col,
                color_continuous_scale="Viridis",
                labels={
                    rt_col: "Retention Time (min)",
                    mz_col: "m/z (Da)",
                    int_col: "Peak Height",
                },
                template="plotly_white",
                hover_data={c: True for c in ft.columns if not c.startswith("_")},
            )
            fig_fm.update_layout(
                height=380,
                margin=dict(l=0, r=0, t=10, b=0),
                coloraxis_colorbar=dict(title="Peak Height"),
            )
            st.plotly_chart(fig_fm, use_container_width=True)
        else:
            st.info("Feature map requires rt, mz, and intensity columns.")

        # Feature table
        st.markdown("#### Feature Table")
        display_cols = [c for c in ft.columns if not c.startswith("_")]

        col_config = {}
        for c in display_cols:
            if "mz" in c.lower():
                col_config[c] = st.column_config.NumberColumn(c, format="%.4f")
            elif "rt" in c.lower():
                col_config[c] = st.column_config.NumberColumn(c, format="%.3f")
            elif any(k in c.lower() for k in ["area", "height", "intensity"]):
                col_config[c] = st.column_config.NumberColumn(c, format="%.0f")

        st.dataframe(ft[display_cols], use_container_width=True, column_config=col_config, height=320)
    else:
        st.info("No features were detected with the current parameters. Try lowering the intensity threshold.")

# ============================================================
# TAB 3 — Identified Compounds
# ============================================================
with tab_identified:
    st.markdown("#### Identified Compounds")

    idf = identified_compounds_filtered

    # Metrics
    total_id = len(idf)
    high_conf = int((idf["confidence"] == "High").sum()) if not idf.empty and "confidence" in idf.columns else 0
    n_classes = int(idf["compound_class"].nunique()) if not idf.empty and "compound_class" in idf.columns else 0

    mc1, mc2, mc3, mc4 = st.columns(4)
    mc1.metric("Total Identified", total_id)
    mc2.metric("High Confidence", high_conf)
    mc3.metric("Compound Classes", n_classes)
    if not idf.empty and "peak_area" in idf.columns:
        mc4.metric("Total Peak Area", f"{idf['peak_area'].sum():,.0f}")
    else:
        mc4.metric("Medium / Low Conf.", total_id - high_conf)

    if not idf.empty:
        col_charts_l, col_charts_r = st.columns(2)

        # Bar chart – compound class distribution
        with col_charts_l:
            st.markdown("##### Compound Class Distribution")
            if "compound_class" in idf.columns:
                class_counts = idf["compound_class"].value_counts().reset_index()
                class_counts.columns = ["compound_class", "count"]
                color_seq = [CLASS_COLORS.get(c, "#999") for c in class_counts["compound_class"]]
                fig_bar = px.bar(
                    class_counts,
                    x="compound_class",
                    y="count",
                    color="compound_class",
                    color_discrete_sequence=color_seq,
                    labels={"compound_class": "Compound Class", "count": "# Compounds"},
                    template="plotly_white",
                )
                fig_bar.update_layout(
                    height=300,
                    showlegend=False,
                    margin=dict(l=0, r=0, t=10, b=0),
                )
                st.plotly_chart(fig_bar, use_container_width=True)

        # Scatter – RT vs m/z coloured by class
        with col_charts_r:
            st.markdown("##### RT vs m/z (by Compound Class)")
            rt_col_id = next((c for c in ["rt_apex", "rt"] if c in idf.columns), None)
            mz_col_id = next((c for c in ["mz_center", "mz"] if c in idf.columns), None)

            if rt_col_id and mz_col_id and "compound_class" in idf.columns:
                hover_cols = {c: True for c in ["compound_name", "adduct", "ppm_error", "confidence"] if c in idf.columns}
                fig_id_scatter = px.scatter(
                    idf,
                    x=rt_col_id,
                    y=mz_col_id,
                    color="compound_class",
                    color_discrete_map=CLASS_COLORS,
                    hover_name="compound_name" if "compound_name" in idf.columns else None,
                    hover_data=hover_cols,
                    labels={
                        rt_col_id: "Retention Time (min)",
                        mz_col_id: "m/z (Da)",
                    },
                    template="plotly_white",
                    size_max=14,
                )
                fig_id_scatter.update_traces(marker=dict(size=10, opacity=0.85))
                fig_id_scatter.update_layout(
                    height=300,
                    margin=dict(l=0, r=0, t=10, b=0),
                    legend=dict(title="Class", orientation="v"),
                )
                st.plotly_chart(fig_id_scatter, use_container_width=True)

        st.markdown("##### Full Results Table")

        # Preferred column order
        preferred = [
            "compound_name", "compound_class", "adduct",
            "rt_apex", "mz_center", "peak_area",
            "ppm_error", "confidence",
        ]
        display_cols_id = [c for c in preferred if c in idf.columns] + \
                          [c for c in idf.columns if c not in preferred]

        # Column config
        col_config_id = {}
        if "rt_apex" in idf.columns:
            col_config_id["rt_apex"] = st.column_config.NumberColumn("RT (min)", format="%.3f")
        if "mz_center" in idf.columns:
            col_config_id["mz_center"] = st.column_config.NumberColumn("m/z (Da)", format="%.4f")
        if "peak_area" in idf.columns:
            col_config_id["peak_area"] = st.column_config.NumberColumn("Peak Area", format="%.0f")
        if "ppm_error" in idf.columns:
            col_config_id["ppm_error"] = st.column_config.NumberColumn("PPM Error", format="%.2f")

        st.dataframe(
            idf[display_cols_id],
            use_container_width=True,
            column_config=col_config_id,
            height=380,
        )

        # Download button
        csv_bytes = idf[display_cols_id].to_csv(index=False).encode("utf-8")
        st.download_button(
            label="⬇  Download Identified Compounds (CSV)",
            data=csv_bytes,
            file_name="identified_compounds.csv",
            mime="text/csv",
            use_container_width=True,
        )
    else:
        st.info(
            "No compounds were identified with the current parameters. "
            "Try adjusting the m/z tolerance, intensity threshold, or compound class filter."
        )

# ============================================================
# TAB 4 — QC Report
# ============================================================
with tab_qc:
    st.markdown("#### Quality Control Report")

    if qc_metrics:
        # Display QC metrics in a clean grid
        qc_items = list(qc_metrics.items())
        n_cols = 3
        for row_start in range(0, len(qc_items), n_cols):
            cols = st.columns(n_cols)
            for col_idx, (k, v) in enumerate(qc_items[row_start: row_start + n_cols]):
                label = k.replace("_", " ").title()
                if isinstance(v, float):
                    display_val = f"{v:.3g}"
                elif isinstance(v, int):
                    display_val = f"{v:,}"
                else:
                    display_val = str(v)
                cols[col_idx].metric(label, display_val)
    else:
        st.info("No QC metrics available.")

    st.markdown("---")

    # Pie chart – compound class breakdown
    if not identified_compounds_filtered.empty and "compound_class" in identified_compounds_filtered.columns:
        col_pie, col_summary = st.columns([2, 3])

        with col_pie:
            st.markdown("##### Compound Class Breakdown")
            class_pie = identified_compounds_filtered["compound_class"].value_counts().reset_index()
            class_pie.columns = ["compound_class", "count"]
            color_seq = [CLASS_COLORS.get(c, "#999") for c in class_pie["compound_class"]]
            fig_pie = px.pie(
                class_pie,
                names="compound_class",
                values="count",
                color="compound_class",
                color_discrete_sequence=color_seq,
                template="plotly_white",
                hole=0.4,
            )
            fig_pie.update_layout(
                height=300,
                margin=dict(l=0, r=0, t=10, b=0),
                legend=dict(orientation="h", yanchor="bottom", y=-0.25),
            )
            st.plotly_chart(fig_pie, use_container_width=True)

        with col_summary:
            st.markdown("##### Analysis Summary")
            n_total = len(identified_compounds_filtered)
            n_cls = identified_compounds_filtered["compound_class"].nunique()
            conf_counts = (
                identified_compounds_filtered["confidence"].value_counts().to_dict()
                if "confidence" in identified_compounds_filtered.columns
                else {}
            )
            high = conf_counts.get("High", 0)
            med = conf_counts.get("Medium", 0)
            low = conf_counts.get("Low", 0)

            st.markdown(
                f"""
                Analysis complete. **{n_total} compound{'s' if n_total != 1 else ''}** identified
                from **{n_cls} compound class{'es' if n_cls != 1 else ''}**.

                | Confidence | Count |
                |---|---|
                | 🟢 High   | {high} |
                | 🟠 Medium | {med} |
                | 🔴 Low    | {low} |
                """
            )

            if "compound_class" in identified_compounds_filtered.columns:
                st.markdown("**Classes found:**")
                for cls, grp in identified_compounds_filtered.groupby("compound_class"):
                    names = ", ".join(grp["compound_name"].unique()) if "compound_name" in grp.columns else ""
                    color = CLASS_COLORS.get(cls, "#888")
                    st.markdown(
                        f"<span style='color:{color}; font-weight:700;'>{cls}</span> ({len(grp)}): {names}",
                        unsafe_allow_html=True,
                    )
    else:
        st.info("No identified compounds to summarise.")

    # Metadata footer
    metadata = st.session_state.get("metadata", {})
    if metadata:
        st.markdown("---")
        with st.expander("Run Metadata"):
            for k, v in metadata.items():
                st.text(f"{k}: {v}")
