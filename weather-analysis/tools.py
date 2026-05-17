from typing import Any
import json
import calendar
import sqlite3
from data import get_db_connection
from typing import Any, Callable


TOOL_REGISTRY: dict[str, Callable[..., dict[str, Any]]] = {
    "get_schema": lambda: get_schema(),
    "run_sql_readonly": lambda sql: run_sql_readonly(sql),
    "calculate_climatology": lambda: calculate_climatology(),
}


TOOLS = [
    {
        "type": "function",
        "name": "get_schema",
        "description": "Return the SQLite schema for the weather database.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "run_sql_readonly",
        "description": "Run a read-only SQL query against the weather database and return rows.",
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "A single read-only SQL statement."
                }
            },
            "required": ["sql"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "calculate_climatology",
        "description": "Calculate climatological averages for a given month and day across all years in the dataset."
    }
]


def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    tool = TOOL_REGISTRY.get(name)

    if tool is None:
        raise ValueError(f"Unknown tool: {name}")

    result = tool(**arguments)

    if name == "get_schema":
        print("\n--- Schema requested ---")
        print(json.dumps(result, indent=2))

    return result


def calculate_percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None

    sorted_values = sorted(values)

    if len(sorted_values) == 1:
        return sorted_values[0]

    index = (len(sorted_values) - 1) * percentile
    lower_index = int(index)
    upper_index = min(lower_index + 1, len(sorted_values) - 1)

    fraction = index - lower_index

    return (
        sorted_values[lower_index] * (1 - fraction)
        + sorted_values[upper_index] * fraction
    )


def round_optional(value: float | None, digits: int = 1) -> float | None:
    if value is None:
        return None

    return round(value, digits)


def calculate_climatology() -> dict[str, Any]:
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row

    try:
        rows = conn.execute("""
            SELECT
                date,
                CAST(strftime('%m', date) AS INTEGER) AS month,
                CAST(strftime('%Y', date) AS INTEGER) AS year,
                min_temp,
                max_temp
            FROM daily_weather
            WHERE min_temp IS NOT NULL
              AND max_temp IS NOT NULL
            ORDER BY date
        """).fetchall()

        result: dict[str, Any] = {
            "months": []
        }

        for month in range(1, 13):
            month_rows = [row for row in rows if row["month"] == month]

            if not month_rows:
                result["months"].append({
                    "month": month,
                    "month_name": calendar.month_name[month],
                    "record_count": 0,
                    "year_count": 0,
                    "statistics": None,
                })
                continue

            min_temps = [row["min_temp"] for row in month_rows]
            max_temps = [row["max_temp"] for row in month_rows]
            daily_mean_temps = [
                (row["min_temp"] + row["max_temp"]) / 2
                for row in month_rows
            ]

            years = sorted({row["year"] for row in month_rows})

            lowest_min = min(month_rows, key=lambda row: row["min_temp"])
            highest_min = max(month_rows, key=lambda row: row["min_temp"])
            lowest_max = min(month_rows, key=lambda row: row["max_temp"])
            highest_max = max(month_rows, key=lambda row: row["max_temp"])

            yearly_threshold_counts = []

            for year in years:
                year_rows = [
                    row for row in month_rows
                    if row["year"] == year
                ]

                yearly_threshold_counts.append({
                    "min_lte_0": sum(1 for row in year_rows if row["min_temp"] <= 0),
                    "min_lte_2": sum(1 for row in year_rows if row["min_temp"] <= 2),
                    "min_lte_5": sum(1 for row in year_rows if row["min_temp"] <= 5),
                    "max_gte_30": sum(1 for row in year_rows if row["max_temp"] >= 30),
                    "max_gte_35": sum(1 for row in year_rows if row["max_temp"] >= 35),
                    "max_gte_40": sum(1 for row in year_rows if row["max_temp"] >= 40),
                })

            def mean(values: list[float]) -> float | None:
                if not values:
                    return None

                return sum(values) / len(values)

            def mean_threshold_count(key: str) -> float | None:
                values = [item[key] for item in yearly_threshold_counts]
                return mean(values)

            result["months"].append({
                "month": month,
                "month_name": calendar.month_name[month],
                "record_count": len(month_rows),
                "year_count": len(years),
                "statistics": {
                    "mean_min_temp": round_optional(mean(min_temps)),
                    "mean_daily_temp": round_optional(mean(daily_mean_temps)),
                    "mean_max_temp": round_optional(mean(max_temps)),

                    "lowest_min_temp": {
                        "value": round_optional(lowest_min["min_temp"]),
                        "date": lowest_min["date"],
                    },
                    "highest_min_temp": {
                        "value": round_optional(highest_min["min_temp"]),
                        "date": highest_min["date"],
                    },
                    "lowest_max_temp": {
                        "value": round_optional(lowest_max["max_temp"]),
                        "date": lowest_max["date"],
                    },
                    "highest_max_temp": {
                        "value": round_optional(highest_max["max_temp"]),
                        "date": highest_max["date"],
                    },

                    "decile_1_min_temp": round_optional(
                        calculate_percentile(min_temps, 0.1)
                    ),
                    "decile_1_max_temp": round_optional(
                        calculate_percentile(max_temps, 0.1)
                    ),
                    "decile_9_min_temp": round_optional(
                        calculate_percentile(min_temps, 0.9)
                    ),
                    "decile_9_max_temp": round_optional(
                        calculate_percentile(max_temps, 0.9)
                    ),

                    "mean_days_min_lte_0": round_optional(mean_threshold_count("min_lte_0")),
                    "mean_days_min_lte_2": round_optional(mean_threshold_count("min_lte_2")),
                    "mean_days_min_lte_5": round_optional(mean_threshold_count("min_lte_5")),
                    "mean_days_max_gte_30": round_optional(mean_threshold_count("max_gte_30")),
                    "mean_days_max_gte_35": round_optional(mean_threshold_count("max_gte_35")),
                    "mean_days_max_gte_40": round_optional(mean_threshold_count("max_gte_40")),
                },
            })

        return result

    finally:
        conn.close()


def get_schema() -> dict[str, Any]:
    conn = get_db_connection()
    try:
        tables = conn.execute("""
            SELECT name, sql
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
        """).fetchall()

        return {
            "tables": [
                {"name": row["name"], "sql": row["sql"]}
                for row in tables
            ]
        }
    finally:
        conn.close()


def run_sql_readonly(sql: str) -> dict[str, Any]:
    sql = validate_readonly_sql(sql)

    print("\n--- SQL requested by model ---")
    print(sql)

    conn = get_db_connection()
    try:
        cursor = conn.execute(sql)
        rows = cursor.fetchmany(200)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []

        result = {
            "columns": columns,
            "rows": [dict(row) for row in rows],
            "row_count_returned": len(rows),
        }

        print("\n--- SQL result ---")
        print(json.dumps(result, indent=2))

        return result
    finally:
        conn.close()


def validate_readonly_sql(sql: str) -> str:
    sql_stripped = sql.strip()

    if not sql_stripped:
        raise ValueError("SQL is empty")

    if ";" in sql_stripped.rstrip(";"):
        raise ValueError("Only one SQL statement is allowed")

    lowered = sql_stripped.lower()

    if not (lowered.startswith("select") or lowered.startswith("with")):
        raise ValueError("Only SELECT or WITH queries are allowed")

    banned = [
        "insert ", "update ", "delete ", "drop ", "alter ", "attach ",
        "detach ", "create ", "replace ", "truncate ", "pragma ",
        "vacuum ", "reindex ",
    ]
    for word in banned:
        if word in lowered:
            raise ValueError(f"Disallowed SQL keyword detected: {word.strip()}")

    return sql_stripped