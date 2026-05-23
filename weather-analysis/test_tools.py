import pytest
import tools


def test_calculate_percentile_empty_returns_none():
    assert tools.calculate_percentile([], 0.1) is None


def test_calculate_percentile_single_value():
    assert tools.calculate_percentile([7.0], 0.9) == 7.0


def test_calculate_percentile_interpolates():
    assert tools.calculate_percentile([10.0, 20.0, 30.0], 0.5) == 20.0


def test_round_optional_none():
    assert tools.round_optional(None) is None


def test_round_optional_rounds_to_one_decimal():
    assert tools.round_optional(12.34) == 12.3


def test_validate_readonly_sql_allows_select():
    assert tools.validate_readonly_sql("SELECT * FROM daily_weather") == "SELECT * FROM daily_weather"


def test_validate_readonly_sql_rejects_delete():
    with pytest.raises(ValueError):
        tools.validate_readonly_sql("DELETE FROM daily_weather")


def test_validate_readonly_sql_rejects_multiple_statements():
    with pytest.raises(ValueError):
        tools.validate_readonly_sql("SELECT * FROM daily_weather; SELECT * FROM daily_weather")


def test_get_schema(monkeypatch):
    # arrange
    fake_rows = [
        {"name": "daily_weather", "sql": "CREATE TABLE daily_weather (...)"}
    ]
    monkeypatch.setattr(tools, "get_schema_rows", lambda: fake_rows)

    # act
    result = tools.get_schema()

    # assert
    assert result == {
        "tables": [
            {
                "name": "daily_weather",
                "sql": "CREATE TABLE daily_weather (...)",
            }
        ]
    }


def test_run_sql_readonly_calls_repository(monkeypatch):
    # arrange
    called = {}
    def fake_run_readonly_query(sql):
        called["sql"] = sql
        return {
            "columns": ["date"],
            "rows": [{"date": "2024-01-01"}],
            "row_count_returned": 1,
        }
    monkeypatch.setattr(tools, "run_readonly_query", fake_run_readonly_query)

    # act
    result = tools.run_sql_readonly("SELECT date FROM daily_weather")

    # assert
    assert called["sql"] == "SELECT date FROM daily_weather"
    assert result["row_count_returned"] == 1
    assert result["rows"][0]["date"] == "2024-01-01"


def test_calculate_climatology_for_january(monkeypatch):
    # arrange
    fake_rows = [
        {
            "date": "2020-01-01",
            "month": 1,
            "year": 2020,
            "min_temp": 10.0,
            "max_temp": 30.0,
        },
        {
            "date": "2020-01-02",
            "month": 1,
            "year": 2020,
            "min_temp": 0.0,
            "max_temp": 40.0,
        },
        {
            "date": "2021-01-01",
            "month": 1,
            "year": 2021,
            "min_temp": 5.0,
            "max_temp": 35.0,
        },
    ]
    monkeypatch.setattr(tools, "get_daily_weather_for_climatology", lambda: fake_rows)

    # act
    result = tools.calculate_climatology()

    # assert
    january = result["months"][0]
    assert january["month"] == 1
    assert january["month_name"] == "January"
    assert january["record_count"] == 3
    assert january["year_count"] == 2
    stats = january["statistics"]
    assert stats["mean_min_temp"] == 5.0
    assert stats["mean_daily_temp"] == 20.0
    assert stats["mean_max_temp"] == 35.0
    assert stats["lowest_min_temp"] == {
        "value": 0.0,
        "date": "2020-01-02",
    }
    assert stats["highest_max_temp"] == {
        "value": 40.0,
        "date": "2020-01-02",
    }
    assert stats["mean_days_min_lte_0"] == 0.5
    assert stats["mean_days_min_lte_5"] == 1.0
    assert stats["mean_days_max_gte_30"] == 1.5
    assert stats["mean_days_max_gte_40"] == 0.5


def test_calculate_climatology_month_with_no_data(monkeypatch):
    # arrange
    monkeypatch.setattr(tools, "get_daily_weather_for_climatology", lambda: [])

    # act
    result = tools.calculate_climatology()

    # assert
    assert len(result["months"]) == 12
    assert result["months"][0]["statistics"] is None
    assert result["months"][0]["record_count"] == 0