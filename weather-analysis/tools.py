from typing import Any
import json
from data import get_db_connection


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
]


def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    if name == "get_schema":
        result = get_schema()
        print("\n--- Schema requested ---")
        print(json.dumps(result, indent=2))
        return result

    if name == "run_sql_readonly":
        return run_sql_readonly(arguments["sql"])

    raise ValueError(f"Unknown tool: {name}")


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