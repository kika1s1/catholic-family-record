import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMA_SQL } from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const dbPath = path.join(dataDir, "cfr.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db: Database.Database = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(SCHEMA_SQL);

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  created_at: string;
};

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  message: string | null;
  status: string;
  source: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "scheduled" | "closed" | "archived";
