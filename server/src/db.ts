import { MongoClient, Db, Collection } from "mongodb";
import type { Member, DuesBill, Tx, Settings, User } from "./types.js";
import { log } from "./logger.js";

let client: MongoClient | null = null;
let db: Db | null = null;

const DB_NAME = process.env.DB_NAME || "kasku";
const MONGODB_URI = process.env.MONGODB_URI || "";

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!MONGODB_URI) {
    log.error("MONGODB_URI not set");
    throw new Error("MONGODB_URI not set");
  }
  client = new MongoClient(MONGODB_URI);
  const safeUri = (() => {
    try {
      const u = new URL(MONGODB_URI);
      return `${u.protocol}//${u.hostname}`;
    } catch {
      return "[invalid mongodb uri]";
    }
  })();
  log.info("MongoDB connecting", { dbName: DB_NAME, uri: safeUri });
  await client.connect();
  db = client.db(DB_NAME);
  await ensureIndexes(db);
  log.info("MongoDB connected", { dbName: DB_NAME });
  return db;
}

export function membersCol(d: Db): Collection<any> {
  return d.collection("members");
}

export function billsCol(d: Db): Collection<any> {
  return d.collection("bills");
}

export function txsCol(d: Db): Collection<any> {
  return d.collection("txs");
}

export function settingsCol(d: Db): Collection<any> {
  return d.collection("settings");
}

export function usersCol(d: Db): Collection<any> {
  return d.collection("users");
}

async function ensureIndexes(d: Db) {
  await billsCol(d).createIndex({ memberId: 1, ym: 1 }, { unique: true });
  await txsCol(d).createIndex({ date: -1 });
  await usersCol(d).createIndex({ email: 1 }, { unique: true });
}
