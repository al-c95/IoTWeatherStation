import sqlite3
from typing import Any
from dotenv import load_dotenv
import os

# Load variables from .env file
load_dotenv()

# Get path from environment, fallback to default if missing
DB_PATH = os.getenv("DB_PATH", "../weather.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    return conn


def get_schema_rows():
    conn = get_db_connection()

    try:
        return conn.execute("""
            SELECT name, sql
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
        """).fetchall()

    finally:
        conn.close()


def get_daily_weather_for_climatology():
    conn = get_db_connection()

    try:
        return conn.execute("""
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

    finally:
        conn.close()


def run_readonly_query(sql: str, row_limit: int = 200) -> dict[str, Any]:
    conn = get_db_connection()

    try:
        cursor = conn.execute(sql)
        rows = cursor.fetchmany(row_limit)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []

        return {
            "columns": columns,
            "rows": [dict(row) for row in rows],
            "row_count_returned": len(rows),
        }

    finally:
        conn.close()