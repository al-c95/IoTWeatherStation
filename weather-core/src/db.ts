import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../weather.db");

console.log("Opening SQLite DB at:", dbPath);

export const db = new Database(dbPath);

// Optional but recommended
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema sanity check
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
  .map((r: any) => r.name);

console.log("SQLite tables:", tables);

if (!tables.includes("daily_weather")) {
  throw new Error(
    "Database opened, but expected table 'daily_weather' was not found."
  );
}