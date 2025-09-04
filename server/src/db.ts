import { MongoClient, Db, Collection } from "mongodb";
import type { Member, DuesBill, Tx, Settings } from "./types.js";

let client: MongoClient | null = null;
let db: Db | null = null;

const DB_NAME = process.env.DB_NAME || "kasku";
const MONGODB_URI = process.env.MONGODB_URI || "";

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not set");
  }
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  await ensureIndexes(db);
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

async function ensureIndexes(d: Db) {
  await billsCol(d).createIndex({ memberId: 1, ym: 1 }, { unique: true });
  await txsCol(d).createIndex({ date: -1 });
}
