"""Streamlit evaluation dashboard."""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import streamlit as st

from app.core.config import get_settings
from app.models.schemas import EvaluationRun
from app.providers.factory import get_provider
from app.services.database import get_run, list_runs, save_run
from app.services.dataset_loader import load_dataset
from evaluation.runners.pipeline import run_evaluation

st.set_page_config(
    page_title="AI Evaluation Platform",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded",
)

settings = get_settings()

# ---------------------------------------------------------------------------
# Sidebar navigation
# ---------------------------------------------------------------------------
st.sidebar.title("🧪 AI Eval Platform")
page = st.sidebar.radio(
    "Navigate",
    ["Overview", "Run Evaluation", "Dataset Viewer", "Metrics", "Failed Cases", "Compare Runs", "Cost Analysis"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

@st.cache_data(ttl=10)
def _load_runs() -> list[EvaluationRun]:
    runs = list_runs(settings.database_url, limit=100)
    for r in runs:
        r.results = []
    return runs


def _get_run_with_results(run_id: str) -> EvaluationRun | None:
    return get_run(run_id, settings.database_url)


def _runs_df(runs: list[EvaluationRun]) -> pd.DataFrame:
    if not runs:
        return pd.DataFrame()
    return pd.DataFrame([
        {
            "Run ID": r.run_id[:8],
            "full_run_id": r.run_id,
            "Timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M"),
            "Provider": r.provider,
            "Model": r.model,
            "Dataset": r.dataset_name,
            "Cases": r.total_cases,
            "Passed": r.passed_cases,
            "Pass Rate": f"{r.passed_cases / r.total_cases * 100:.1f}%" if r.total_cases else "0%",
            "Avg Score": round(r.average_score, 4),
            "Avg Latency (ms)": round(r.avg_latency_ms, 0),
            "Cost ($)": round(r.total_cost_usd, 4),
        }
        for r in runs
    ])


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

def page_overview():
    st.title("📊 Overview")
    runs = _load_runs()

    if not runs:
        st.info("No evaluation runs yet. Go to **Run Evaluation** to get started.")
        return

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Runs", len(runs))
    col2.metric("Avg Score", f"{sum(r.average_score for r in runs) / len(runs):.3f}")
    col3.metric("Total Cases", sum(r.total_cases for r in runs))
    col4.metric("Total Cost", f"${sum(r.total_cost_usd for r in runs):.4f}")

    st.subheader("Recent Runs")
    df = _runs_df(runs)
    display_cols = [c for c in df.columns if c != "full_run_id"]
    st.dataframe(df[display_cols], use_container_width=True)

    st.subheader("Score Trend")
    chart_df = pd.DataFrame({
        "Run": [r.run_id[:8] for r in reversed(runs[-10:])],
        "Avg Score": [r.average_score for r in reversed(runs[-10:])],
    }).set_index("Run")
    st.line_chart(chart_df)

    st.subheader("Pass Rate Distribution")
    pass_rates = [r.passed_cases / r.total_cases * 100 if r.total_cases else 0 for r in runs]
    hist_df = pd.DataFrame({"Pass Rate (%)": pass_rates})
    st.bar_chart(hist_df["Pass Rate (%)"])


def page_run_evaluation():
    st.title("▶️ Run Evaluation")

    with st.form("eval_form"):
        dataset_path = st.text_input("Dataset Path", value="datasets/sample_dataset.json")
        col1, col2 = st.columns(2)
        provider = col1.selectbox("Provider", ["mock", "openai", "bedrock"])
        model = col2.text_input("Model", value=settings.model_name)

        available_metrics = [
            "exact_match", "keyword_overlap", "response_length", "latency",
            "token_efficiency", "answer_relevance", "semantic_similarity",
            "faithfulness", "context_relevance",
        ]
        selected_metrics = st.multiselect(
            "Metrics", available_metrics,
            default=["exact_match", "keyword_overlap", "response_length", "latency",
                     "answer_relevance", "semantic_similarity"],
        )
        submitted = st.form_submit_button("🚀 Run Evaluation")

    if submitted:
        with st.spinner("Running evaluation…"):
            try:
                dataset = load_dataset(dataset_path)
                llm_provider = get_provider(provider, model, settings)
                judge = get_provider(settings.judge_provider, settings.judge_model, settings)
                run = run_evaluation(
                    dataset=dataset,
                    provider=llm_provider,
                    judge=judge,
                    metrics=selected_metrics or None,
                )
                save_run(run, settings.database_url)
                st.cache_data.clear()
                st.success(f"✅ Evaluation complete! Run ID: `{run.run_id}`")

                col1, col2, col3, col4 = st.columns(4)
                col1.metric("Cases", run.total_cases)
                col2.metric("Passed", run.passed_cases)
                col3.metric("Avg Score", f"{run.average_score:.4f}")
                col4.metric("Cost", f"${run.total_cost_usd:.4f}")

            except FileNotFoundError as exc:
                st.error(f"Dataset not found: {exc}")
            except ValueError as exc:
                st.error(f"Configuration error: {exc}")
            except Exception as exc:
                st.error(f"Evaluation failed: {exc}")


def page_dataset_viewer():
    st.title("📂 Dataset Viewer")
    dataset_path = st.text_input("Dataset Path", value="datasets/sample_dataset.json")

    if st.button("Load Dataset"):
        try:
            dataset = load_dataset(dataset_path)
            st.success(f"Loaded **{dataset.name}** — {len(dataset.cases)} cases")
            st.write(dataset.description)

            rows = [
                {
                    "ID": c.id,
                    "Input": c.input[:80] + "…" if len(c.input) > 80 else c.input,
                    "Expected": c.expected_output[:80] + "…" if len(c.expected_output) > 80 else c.expected_output,
                    "Has Context": "✅" if c.context else "❌",
                    "Tags": ", ".join(c.tags),
                }
                for c in dataset.cases
            ]
            st.dataframe(pd.DataFrame(rows), use_container_width=True)

            # Tag distribution
            all_tags: list[str] = []
            for c in dataset.cases:
                all_tags.extend(c.tags)
            if all_tags:
                tag_counts = pd.Series(all_tags).value_counts()
                st.subheader("Tag Distribution")
                st.bar_chart(tag_counts)

        except Exception as exc:
            st.error(str(exc))


def page_metrics():
    st.title("📈 Metrics")
    runs = _load_runs()

    if not runs:
        st.info("No runs available.")
        return

    run_options = {f"{r.run_id[:8]} — {r.model} ({r.timestamp.strftime('%m/%d %H:%M')})": r.run_id for r in runs}
    selected_label = st.selectbox("Select Run", list(run_options.keys()))
    run_id = run_options[selected_label]

    run = _get_run_with_results(run_id)
    if not run or not run.results:
        st.warning("No results found for this run.")
        return

    # Aggregate metric scores
    metric_scores: dict[str, list[float]] = {}
    for result in run.results:
        for m in result.metrics:
            metric_scores.setdefault(m.name, []).append(m.score)

    avg_scores = {k: sum(v) / len(v) for k, v in metric_scores.items()}
    score_df = pd.DataFrame({"Metric": list(avg_scores.keys()), "Avg Score": list(avg_scores.values())})
    score_df = score_df.sort_values("Avg Score", ascending=False)

    st.subheader("Average Score by Metric")
    st.bar_chart(score_df.set_index("Metric")["Avg Score"])

    st.subheader("Score Distribution")
    overall_scores = [r.overall_score for r in run.results]
    hist_df = pd.DataFrame({"Overall Score": overall_scores})
    st.bar_chart(hist_df["Overall Score"])

    st.subheader("Latency Distribution (ms)")
    lat_df = pd.DataFrame({"Latency (ms)": [r.latency_ms for r in run.results]})
    st.bar_chart(lat_df["Latency (ms)"])


def page_failed_cases():
    st.title("❌ Failed Cases")
    runs = _load_runs()

    if not runs:
        st.info("No runs available.")
        return

    run_options = {f"{r.run_id[:8]} — {r.model}": r.run_id for r in runs}
    selected_label = st.selectbox("Select Run", list(run_options.keys()))
    run = _get_run_with_results(run_options[selected_label])

    if not run:
        return

    failed = [r for r in run.results if not r.passed]
    st.write(f"**{len(failed)} failed cases** out of {run.total_cases}")

    for r in failed:
        with st.expander(f"❌ {r.case_id} — score: {r.overall_score:.2f}"):
            st.write(f"**Input:** {r.input}")
            st.write(f"**Expected:** {r.expected_output}")
            st.write(f"**Generated:** {r.generated_output}")
            if r.error:
                st.error(f"Error: {r.error}")
            if r.metrics:
                metric_data = [{"Metric": m.name, "Score": m.score, "Passed": m.passed, "Reason": m.reason} for m in r.metrics]
                st.dataframe(pd.DataFrame(metric_data), use_container_width=True)


def page_compare_runs():
    st.title("⚖️ Compare Runs")
    runs = _load_runs()

    if len(runs) < 2:
        st.info("Need at least 2 runs to compare.")
        return

    run_options = {f"{r.run_id[:8]} — {r.model} ({r.timestamp.strftime('%m/%d %H:%M')})": r.run_id for r in runs}
    labels = list(run_options.keys())

    col1, col2 = st.columns(2)
    label_a = col1.selectbox("Run A", labels, index=0)
    label_b = col2.selectbox("Run B", labels, index=min(1, len(labels) - 1))

    if st.button("Compare"):
        run_a = _get_run_with_results(run_options[label_a])
        run_b = _get_run_with_results(run_options[label_b])

        if not run_a or not run_b:
            st.error("Could not load runs.")
            return

        def _pass_rate(r: EvaluationRun) -> float:
            return r.passed_cases / r.total_cases * 100 if r.total_cases else 0

        comparison = {
            "Metric": ["Avg Score", "Pass Rate (%)", "Avg Latency (ms)", "Total Cost ($)", "Total Tokens"],
            "Run A": [
                round(run_a.average_score, 4),
                round(_pass_rate(run_a), 1),
                round(run_a.avg_latency_ms, 0),
                round(run_a.total_cost_usd, 4),
                run_a.total_input_tokens + run_a.total_output_tokens,
            ],
            "Run B": [
                round(run_b.average_score, 4),
                round(_pass_rate(run_b), 1),
                round(run_b.avg_latency_ms, 0),
                round(run_b.total_cost_usd, 4),
                run_b.total_input_tokens + run_b.total_output_tokens,
            ],
        }
        df = pd.DataFrame(comparison).set_index("Metric")
        st.dataframe(df, use_container_width=True)

        # Per-metric comparison
        def _avg_metric(run: EvaluationRun) -> dict[str, float]:
            scores: dict[str, list[float]] = {}
            for result in run.results:
                for m in result.metrics:
                    scores.setdefault(m.name, []).append(m.score)
            return {k: sum(v) / len(v) for k, v in scores.items()}

        metrics_a = _avg_metric(run_a)
        metrics_b = _avg_metric(run_b)
        all_metrics = sorted(set(metrics_a) | set(metrics_b))

        if all_metrics:
            metric_df = pd.DataFrame({
                "Metric": all_metrics,
                "Run A": [metrics_a.get(m, 0) for m in all_metrics],
                "Run B": [metrics_b.get(m, 0) for m in all_metrics],
            }).set_index("Metric")
            st.subheader("Per-Metric Comparison")
            st.bar_chart(metric_df)


def page_cost_analysis():
    st.title("💰 Cost Analysis")
    runs = _load_runs()

    if not runs:
        st.info("No runs available.")
        return

    cost_df = pd.DataFrame({
        "Run": [r.run_id[:8] for r in runs],
        "Model": [r.model for r in runs],
        "Input Tokens": [r.total_input_tokens for r in runs],
        "Output Tokens": [r.total_output_tokens for r in runs],
        "Total Tokens": [r.total_input_tokens + r.total_output_tokens for r in runs],
        "Cost ($)": [round(r.total_cost_usd, 6) for r in runs],
        "Cases": [r.total_cases for r in runs],
        "Cost/Case ($)": [round(r.total_cost_usd / r.total_cases, 6) if r.total_cases else 0 for r in runs],
    })

    st.dataframe(cost_df, use_container_width=True)

    st.subheader("Cost per Run")
    st.bar_chart(cost_df.set_index("Run")["Cost ($)"])

    st.subheader("Token Usage per Run")
    token_df = cost_df.set_index("Run")[["Input Tokens", "Output Tokens"]]
    st.bar_chart(token_df)

    total_cost = sum(r.total_cost_usd for r in runs)
    total_tokens = sum(r.total_input_tokens + r.total_output_tokens for r in runs)
    col1, col2 = st.columns(2)
    col1.metric("Total Estimated Cost", f"${total_cost:.4f}")
    col2.metric("Total Tokens Used", f"{total_tokens:,}")


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
if page == "Overview":
    page_overview()
elif page == "Run Evaluation":
    page_run_evaluation()
elif page == "Dataset Viewer":
    page_dataset_viewer()
elif page == "Metrics":
    page_metrics()
elif page == "Failed Cases":
    page_failed_cases()
elif page == "Compare Runs":
    page_compare_runs()
elif page == "Cost Analysis":
    page_cost_analysis()
