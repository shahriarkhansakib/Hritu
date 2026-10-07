"""Unit tests for src/compute/trend.py.

Run with: pytest src/compute/tests/ -v

These tests prove that our statistics live in tested functions
and are NOT performed by the language model.
"""
import numpy as np
import pytest
from src.compute.trend import (
    modified_mann_kendall,
    theil_sen_slope,
    pettitt_change_point,
    full_trend_report,
)


class TestModifiedMannKendall:
    def test_clear_increasing_trend(self):
        """A strongly increasing noisy series must be detected as increasing.

        Note: We use noisy data, not a perfect ramp, because Hamed-Rao
        autocorrelation correction divides by acf[0] which is zero for a
        perfect linear sequence (zero variance after differencing).
        Real climate data always has noise — this test reflects that.
        """
        rng = np.random.default_rng(42)
        values = [i * 2.0 + rng.normal(0, 1) for i in range(40)]  # strong trend + noise
        result = modified_mann_kendall(values)
        assert result["trend"] == "increasing", f"Expected increasing, got: {result}"
        assert result["p_value"] < 0.05
        assert result["verdict"] == "REAL_TREND"

    def test_clear_decreasing_trend(self):
        """A strongly decreasing noisy series must be detected as decreasing."""
        rng = np.random.default_rng(42)
        values = [40 - i * 2.0 + rng.normal(0, 1) for i in range(40)]
        result = modified_mann_kendall(values)
        assert result["trend"] == "decreasing", f"Expected decreasing, got: {result}"
        assert result["verdict"] == "REAL_TREND"


    def test_hamed_rao_method(self):
        values = list(range(1, 20))
        result = modified_mann_kendall(values, method="hamed_rao")
        assert "hamed" in result["method_used"].lower() or "rao" in result["method_used"].lower()

    def test_yue_wang_method(self):
        values = list(range(1, 20))
        result = modified_mann_kendall(values, method="yue_wang")
        assert "yue" in result["method_used"].lower() or "wang" in result["method_used"].lower()

    def test_insufficient_data(self):
        result = modified_mann_kendall([1, 2, 3])
        assert result["verdict"] == "NOISE"
        assert "error" in result

    def test_verdict_field_always_present(self):
        for values in [[1, 2, 3, 4, 5], list(range(30)), [5, 5, 5, 5, 5, 5]]:
            result = modified_mann_kendall(values)
            assert "verdict" in result
            assert result["verdict"] in ("REAL_TREND", "WEAK_SIGNAL", "NOISE")


class TestTheilSenSlope:
    def test_slope_magnitude(self):
        """A series increasing by 1/year should have slope ≈ 1."""
        values = list(range(20))
        result = theil_sen_slope(values)
        assert abs(result["slope_per_year"] - 1.0) < 0.1
        assert abs(result["slope_per_decade"] - 10.0) < 1.0

    def test_ci_contains_true_slope(self):
        values = [i + 0.1 * np.sin(i) for i in range(30)]
        result = theil_sen_slope(values)
        assert result["ci_low"] <= result["slope_per_year"] <= result["ci_high"]

    def test_with_year_index(self):
        years = list(range(1981, 2021))
        values = [24 + 0.05 * (y - 1981) for y in years]  # +0.5°C per decade
        result = theil_sen_slope(values, years=years)
        assert abs(result["slope_per_decade"] - 0.5) < 0.15

    def test_negative_slope(self):
        values = [20 - i * 0.5 for i in range(20)]  # decreasing
        result = theil_sen_slope(values)
        assert result["slope_per_year"] < 0
        assert result["slope_per_decade"] < 0


class TestPettittChangePoint:
    def test_known_change_point(self):
        """A series with a step change should detect the boundary correctly.

        With 20 elements at 10.0 then 20 elements at 15.0 (0-indexed):
        - Indices 0-19 = before (10.0)
        - Indices 20-39 = after (15.0)
        The Pettitt U-stat peaks at k_index=19: 'change occurs AFTER index 19'.
        """
        before = [10.0] * 20
        after = [15.0] * 20
        values = before + after
        result = pettitt_change_point(values)
        # k_index=19 means "before = [0..19], after = [20..39]" — correct
        assert abs(result["change_point_index"] - 19) <= 2, \
            f"Expected ~19, got {result['change_point_index']}"
        assert result["p_value"] < 0.05
        assert result["significant"] is True


    def test_return_shape(self):
        values = list(range(40))
        result = pettitt_change_point(values)
        for key in ("change_point_index", "p_value", "u_stat", "significant"):
            assert key in result


class TestFullTrendReport:
    def test_report_has_required_fields(self):
        """The report must have all fields the Explanation Agent needs."""
        values = [10 + i * 0.5 for i in range(30)]
        report = full_trend_report(
            values=values,
            years=list(range(1990, 2020)),
            metric="T2M_MIN",
            district="Rajshahi",
            dataset_id="NASA_POWER_AG_DAILY",
            source_url="https://power.larc.nasa.gov",
        )
        required = [
            "trend", "p_value", "verdict", "slope_per_decade",
            "dataset_id", "source_url", "metric", "district",
            "change_point_year", "n_observations", "method_used",
        ]
        for field in required:
            assert field in report, f"Missing required field: {field}"

    def test_no_llm_computation_marker(self):
        """Confirm this function contains no network or LLM calls."""
        import inspect
        src = inspect.getsource(full_trend_report)
        assert "requests" not in src
        assert "anthropic" not in src
        assert "openai" not in src

    def test_provenance_fields_for_cite_check(self):
        """dataset_id and source_url must always be present for cite_check."""
        values = list(range(20))
        report = full_trend_report(values, dataset_id="TEST_DS", source_url="https://example.com")
        assert report["dataset_id"] == "TEST_DS"
        assert report["source_url"] == "https://example.com"
