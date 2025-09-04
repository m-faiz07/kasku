import 'dotenv/config';
import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import { getDb, membersCol, billsCol, txsCol, settingsCol } from "./db.js";
import { z } from "zod";
import { ymKey, type Member, type DuesBill, type Tx } from "./types.js";

const app = express();
// CORS whitelist (comma-separated origins). If not set, allow all (dev)
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: CORS_ORIGINS.length === 0 ? true : (origin, cb) => {
      if (!origin) return cb(null, true);
      if (CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

const id = (s: string) => new ObjectId(s);
const toId = (x: any) => ({ id: String(x._id), ...Object.fromEntries(Object.entries(x).filter(([k]) => k !== "_id")) });

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Optional API key protection (set API_KEY to enable)
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const expected = process.env.API_KEY;
  if (!expected) return next();
  const provided = req.header("x-api-key");
  if (provided !== expected) return res.status(401).json({ error: "Unauthorized" });
  return next();
});

// Settings: dues amount
app.get("/dues/amount", async (_req, res) => {
  const db = await getDb();
  const doc = await settingsCol(db).findOne({ _id: new ObjectId("000000000000000000000001") }).catch(() => null);
  const duesAmount = doc?.duesAmount ?? 20000;
  res.json({ duesAmount });
});

app.post("/dues/amount", async (req, res) => {
  const body = z.object({ amount: z.number().int().nonnegative() }).parse(req.body);
  const db = await getDb();
  await settingsCol(db).updateOne(
    { _id: new ObjectId("000000000000000000000001") },
    { $set: { duesAmount: body.amount } },
    { upsert: true }
  );
  res.json({ duesAmount: body.amount });
});

// Members
app.get("/members", async (_req, res) => {
  const db = await getDb();
  const items = await membersCol(db).find().sort({ _id: -1 }).toArray();
  res.json(items.map(toId));
});

app.post("/members", async (req, res) => {
  const body = z.object({ name: z.string().min(1), nim: z.string().optional(), phone: z.string().optional() }).parse(req.body);
  const db = await getDb();
  const doc: Omit<Member, "id"> = { name: body.name.trim(), nim: body.nim?.trim() || undefined, phone: body.phone, active: true };
  const r = await membersCol(db).insertOne(doc as any);
  res.json({ id: String(r.insertedId), ...doc });
});

app.patch("/members/:id", async (req, res) => {
  const body = z.object({ name: z.string().optional(), nim: z.string().optional(), phone: z.string().optional(), active: z.boolean().optional() }).parse(req.body);
  const db = await getDb();
  const r = await membersCol(db).findOneAndUpdate({ _id: id(req.params.id) }, { $set: body }, { returnDocument: "after" });
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json(toId(r));
});

app.delete("/members/:id", async (req, res) => {
  const db = await getDb();
  const mId = String(req.params.id);
  await billsCol(db).deleteMany({ memberId: mId });
  await membersCol(db).deleteOne({ _id: id(mId) });
  res.json({ ok: true });
});

// Bills
app.get("/bills", async (req, res) => {
  const ym = z.string().regex(/^\d{4}-\d{2}$/).optional().parse(req.query.ym);
  const db = await getDb();
  const q = ym ? { ym } : {};
  const items = await billsCol(db).find(q).sort({ _id: -1 }).toArray();
  res.json(items.map(toId));
});

app.post("/bills/generate", async (req, res) => {
  const body = z.object({ ym: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(req.body ?? {});
  const db = await getDb();
  const month = body.ym ?? ymKey(new Date());
  const settings = await settingsCol(db).findOne({ _id: new ObjectId("000000000000000000000001") }).catch(() => null);
  const duesAmount = settings?.duesAmount ?? 20000;

  const members = await membersCol(db).find({ active: true }).toArray();
  for (const m of members) {
    const exists = await billsCol(db).findOne({ memberId: String(m._id), ym: month });
    if (!exists) {
      await billsCol(db).insertOne({ memberId: String(m._id), ym: month, amount: duesAmount, status: "UNPAID" } as any);
    }
  }
  const items = await billsCol(db).find({ ym: month }).toArray();
  res.json(items.map(toId));
});

app.post("/bills/bulkPaid", async (req, res) => {
  const body = z.object({ memberIds: z.array(z.string().min(1)), ym: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
  const db = await getDb();
  const members = await membersCol(db)
    .find({ _id: { $in: body.memberIds.map((x) => id(x)) } })
    .toArray();
  for (const mid of body.memberIds) {
    const bill = await billsCol(db).findOne({ memberId: mid, ym: body.ym });
    if (!bill || bill.status !== "UNPAID") continue;
    await billsCol(db).updateOne({ _id: (bill as any)._id }, { $set: { status: "PAID" } });
    const member = members.find((m) => String(m._id) === mid);
    await txsCol(db).insertOne({
      type: "in",
      amount: bill.amount,
      category: "Iuran",
      note: `Iuran ${body.ym}${member ? ` - ${member.name}` : ""}`,
      date: new Date().toISOString(),
      memberId: mid,
    } as any);
  }
  const items = await billsCol(db).find({ ym: body.ym }).toArray();
  res.json(items.map(toId));
});

// Transactions
app.get("/txs", async (req, res) => {
  const ym = z.string().regex(/^\d{4}-\d{2}$/).optional().parse(req.query.ym);
  const db = await getDb();
  const q = ym ? { $expr: { $eq: [ym, { $concat: [{ $toString: { $year: { $toDate: "$date" } } }, "-", { $toString: { $lpad: [{ $toString: { $month: { $toDate: "$date" } } }, 2, "0"] } }] }] } } : {};
  const items = ym
    ? await txsCol(db).find().toArray() // fallback client-side if expression not supported
    : await txsCol(db).find().sort({ _id: -1 }).toArray();
  const list = ym ? items.filter((t) => ymKey(t.date) === ym) : items;
  res.json(list.map(toId));
});

app.post("/txs", async (req, res) => {
  const body = z
    .object({
      type: z.enum(["in", "out"]),
      amount: z.number().int().positive(),
      category: z.string().optional(),
      note: z.string().optional(),
      date: z.string(),
      memberId: z.string().optional(),
    })
    .parse(req.body);
  const db = await getDb();
  const r = await txsCol(db).insertOne(body as any);
  res.json({ id: String(r.insertedId), ...body });
});

app.delete("/txs/:id", async (req, res) => {
  const db = await getDb();
  await txsCol(db).deleteOne({ _id: id(req.params.id) });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Kasku API listening on :${PORT}`);
});
