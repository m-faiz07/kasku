import 'dotenv/config';
import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getDb, membersCol, billsCol, txsCol, settingsCol, usersCol } from "./db.js";
import { z } from "zod";
import { ymKey, type Member, type DuesBill, type Tx } from "./types.js";
import { log } from "./logger.js";
import { LoginSchema, RegisterSchema, login as loginSvc, register as registerSvc, authMiddleware } from "./auth.js";
import fs from "fs";
import path from "path";

const app = express();

// Global process-level error logging
process.on("unhandledRejection", (reason: any) => {
  log.error("unhandledRejection", { err: reason instanceof Error ? reason : new Error(String(reason)) });
});
process.on("uncaughtException", (err: Error) => {
  log.error("uncaughtException", { err });
});
// CORS whitelist (comma-separated origins). If not set, allow all (dev)
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: CORS_ORIGINS.length === 0
      ? true
      : (origin, cb) => {
          if (!origin) {
            log.debug("CORS: no origin header, allow");
            return cb(null, true);
          }
          if (CORS_ORIGINS.includes(origin)) {
            log.debug("CORS: allowed origin", { origin });
            return cb(null, true);
          }
          log.warn("CORS: blocked origin", { origin });
          return cb(new Error("Not allowed by CORS"));
        },
  })
);
app.use(express.json({ limit: '6mb' }));
// Disable ETag to avoid 304 on API JSON responses (clients expect 200)
app.set('etag', false);

// Serve uploaded files
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const AVATAR_DIR = path.resolve(UPLOAD_DIR, "avatars");
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOAD_DIR));

// Per-request id + request logging
app.use((req, res, next) => {
  const id = req.header("x-request-id") || randomUUID();
  (req as any).id = id;
  res.setHeader("x-request-id", id);
  const start = Date.now();
  log.debug("request:start", { id, method: req.method, path: req.path });
  res.on("finish", () => {
    const ms = Date.now() - start;
    const len = res.getHeader("content-length");
    log.info("request:end", { id, method: req.method, path: req.path, status: res.statusCode, ms, length: len ?? undefined });
  });
  next();
});

const id = (s: string) => new ObjectId(s);
const toId = (x: any) => ({ id: String(x._id), ...Object.fromEntries(Object.entries(x).filter(([k]) => k !== "_id")) });

// Async wrapper to bubble errors to error handler
const asyncHandler = <T extends express.RequestHandler>(fn: T): express.RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Optional API key protection (set API_KEY to enable)
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (req.path.startsWith("/auth/")) return next();
  const expected = process.env.API_KEY;
  if (!expected) return next();
  const provided = req.header("x-api-key");
  if (provided !== expected) return res.status(401).json({ error: "Unauthorized" });
  return next();
});

// Optional JWT auth requirement (set REQUIRE_AUTH=true to protect routes)
const REQUIRE_AUTH = String(process.env.REQUIRE_AUTH || "false").toLowerCase() === "true";
// Always parse JWT if provided so we can scope data per user
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (req.path.startsWith("/auth/")) return next();
  return authMiddleware(false)(req as any, res as any, next as any);
});

if (REQUIRE_AUTH) {
  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    if (req.path.startsWith("/auth/")) return next();
    return authMiddleware(true)(req, res, next);
  });
}

// Auth endpoints
app.post("/auth/register", asyncHandler(async (req, res) => {
  const body = RegisterSchema.parse(req.body);
  const out = await registerSvc(body);
  res.json(out);
}));
app.post("/auth/login", asyncHandler(async (req, res) => {
  const body = LoginSchema.parse(req.body);
  const out = await loginSvc(body);
  res.json(out);
}));

// Settings: dues amount
app.get("/dues/amount", asyncHandler(async (req, res) => {
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  let duesAmount = 20000;
  if (owner) {
    const doc = await settingsCol(db).findOne({ userId: owner }).catch(() => null);
    duesAmount = doc?.duesAmount ?? 20000;
  } else {
    const doc = await settingsCol(db).findOne({ _id: new ObjectId("000000000000000000000001") }).catch(() => null);
    duesAmount = doc?.duesAmount ?? 20000;
  }
  res.json({ duesAmount });
}));

app.post("/dues/amount", asyncHandler(async (req, res) => {
  const body = z.object({ amount: z.number().int().nonnegative() }).parse(req.body);
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  if (owner) {
    await settingsCol(db).updateOne(
      { userId: owner },
      { $set: { duesAmount: body.amount, userId: owner } },
      { upsert: true }
    );
  } else {
    await settingsCol(db).updateOne(
      { _id: new ObjectId("000000000000000000000001") },
      { $set: { duesAmount: body.amount } },
      { upsert: true }
    );
  }
  res.json({ duesAmount: body.amount });
}));

// Members
app.get("/members", asyncHandler(async (req, res) => {
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const q = owner ? { userId: owner } : {};
  const items = await membersCol(db).find(q).sort({ _id: -1 }).toArray();
  res.json(items.map(toId));
}));

app.post("/members", asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().min(1), nim: z.string().optional(), phone: z.string().optional() }).parse(req.body);
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const doc: Omit<Member, "id"> & { userId?: string } = { name: body.name.trim(), nim: body.nim?.trim() || undefined, phone: body.phone, active: true, ...(owner ? { userId: owner } : {}) };
  const r = await membersCol(db).insertOne(doc as any);
  res.json({ id: String(r.insertedId), ...doc });
}));

app.patch("/members/:id", asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().optional(), nim: z.string().optional(), phone: z.string().optional(), active: z.boolean().optional() }).parse(req.body);
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const filter: any = { _id: id(req.params.id) };
  if (owner) filter.userId = owner;
  const r = await membersCol(db).findOneAndUpdate(filter, { $set: body }, { returnDocument: "after" });
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json(toId(r));
}));

app.delete("/members/:id", asyncHandler(async (req, res) => {
  const db = await getDb();
  const mId = String(req.params.id);
  const owner = (req as any).user?.sub as string | undefined;
  const billFilter: any = { memberId: mId };
  const memberFilter: any = { _id: id(mId) };
  if (owner) { billFilter.userId = owner; memberFilter.userId = owner; }
  await billsCol(db).deleteMany(billFilter);
  await membersCol(db).deleteOne(memberFilter);
  res.json({ ok: true });
}));

// Bills
app.get("/bills", asyncHandler(async (req, res) => {
  const ym = z.string().regex(/^\d{4}-\d{2}$/).optional().parse(req.query.ym);
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const q: any = ym ? { ym } : {};
  if (owner) q.userId = owner;
  const items = await billsCol(db).find(q).sort({ _id: -1 }).toArray();
  res.json(items.map(toId));
}));

app.post("/bills/generate", asyncHandler(async (req, res) => {
  const body = z.object({ ym: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(req.body ?? {});
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const month = body.ym ?? ymKey(new Date());
  const settings = owner
    ? await settingsCol(db).findOne({ userId: owner }).catch(() => null)
    : await settingsCol(db).findOne({ _id: new ObjectId("000000000000000000000001") }).catch(() => null);
  const duesAmount = settings?.duesAmount ?? 20000;

  const memFilter: any = { active: true };
  if (owner) memFilter.userId = owner;
  const members = await membersCol(db).find(memFilter).toArray();
  for (const m of members) {
    const exists = await billsCol(db).findOne({ memberId: String(m._id), ym: month, ...(owner ? { userId: owner } : {}) });
    if (!exists) {
      await billsCol(db).insertOne({ memberId: String(m._id), ym: month, amount: duesAmount, status: "UNPAID", ...(owner ? { userId: owner } : {}) } as any);
    }
  }
  const items = await billsCol(db).find(owner ? { ym: month, userId: owner } : { ym: month }).toArray();
  res.json(items.map(toId));
}));

app.post("/bills/bulkPaid", asyncHandler(async (req, res) => {
  const body = z.object({ memberIds: z.array(z.string().min(1)), ym: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const members = await membersCol(db)
    .find({ _id: { $in: body.memberIds.map((x) => id(x)) }, ...(owner ? { userId: owner } : {}) })
    .toArray();
  for (const mid of body.memberIds) {
    const bill = await billsCol(db).findOne({ memberId: mid, ym: body.ym, ...(owner ? { userId: owner } : {}) });
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
      ...(owner ? { userId: owner } : {}),
    } as any);
  }
  const items = await billsCol(db).find(owner ? { ym: body.ym, userId: owner } : { ym: body.ym }).toArray();
  res.json(items.map(toId));
}));

// Transactions
app.get("/txs", asyncHandler(async (req, res) => {
  const ym = z.string().regex(/^\d{4}-\d{2}$/).optional().parse(req.query.ym);
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const filter: any = owner ? { userId: owner } : {};
  const items = await txsCol(db).find(filter).sort({ _id: -1 }).toArray();
  const list = ym ? items.filter((t) => ymKey(t.date) === ym) : items;
  res.json(list.map(toId));
}));

app.post("/txs", asyncHandler(async (req, res) => {
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
  const owner = (req as any).user?.sub as string | undefined;
  const r = await txsCol(db).insertOne({ ...body, ...(owner ? { userId: owner } : {}) } as any);
  res.json({ id: String(r.insertedId), ...body });
}));

app.delete("/txs/:id", asyncHandler(async (req, res) => {
  const db = await getDb();
  const owner = (req as any).user?.sub as string | undefined;
  const filter: any = { _id: id(req.params.id) };
  if (owner) filter.userId = owner;
  await txsCol(db).deleteOne(filter);
  res.json({ ok: true });
}));

// Profile endpoints (require auth)
app.get("/me", authMiddleware(true), asyncHandler(async (req, res) => {
  const db = await getDb();
  const userId = (req as any).user?.sub as string;
  const doc = await usersCol(db).findOne({ _id: id(userId) }).catch(() => null);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ id: String(doc._id), email: doc.email, name: doc.name });
}));

app.patch("/me", authMiddleware(true), asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
  const db = await getDb();
  const userId = (req as any).user?.sub as string;
  const r = await usersCol(db).findOneAndUpdate({ _id: id(userId) }, { $set: { name: body.name } }, { returnDocument: "after" });
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json({ id: String((r as any)._id || (r as any)?.value?._id || userId), email: (r as any).email || (r as any)?.value?.email, name: (r as any).name || (r as any)?.value?.name });
}));

app.patch("/me/email", authMiddleware(true), asyncHandler(async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const db = await getDb();
  const userId = (req as any).user?.sub as string;
  const u = await usersCol(db).findOne({ _id: id(userId) });
  if (!u) return res.status(404).json({ error: "Not found" });
  const ok = await (await import("bcryptjs")).default.compare(body.password, (u as any).passwordHash);
  if (!ok) {
    const err: any = new Error("Password salah");
    err.statusCode = 400;
    throw err;
  }
  const email = body.email.toLowerCase().trim();
  const exists = await usersCol(db).findOne({ email });
  if (exists && String((exists as any)._id) !== userId) {
    const err: any = new Error("Email sudah digunakan");
    err.statusCode = 409;
    throw err;
  }
  await usersCol(db).updateOne({ _id: id(userId) }, { $set: { email } });
  // Re-issue token with new email claim
  const { signToken } = await import("./auth.js");
  const token = signToken({ sub: userId, email });
  const doc = await usersCol(db).findOne({ _id: id(userId) });
  res.json({ token, user: { id: String((doc as any)._id), email: (doc as any).email, name: (doc as any).name, avatar: (doc as any).avatar } });
}));

app.patch("/me/password", authMiddleware(true), asyncHandler(async (req, res) => {
  const body = z.object({ oldPassword: z.string().min(1), newPassword: z.string().min(6) }).parse(req.body);
  const db = await getDb();
  const userId = (req as any).user?.sub as string;
  const u = await usersCol(db).findOne({ _id: id(userId) });
  if (!u) return res.status(404).json({ error: "Not found" });
  const ok = await (await import("bcryptjs")).default.compare(body.oldPassword, (u as any).passwordHash);
  if (!ok) {
    const err: any = new Error("Password lama salah");
    err.statusCode = 400;
    throw err;
  }
  const passwordHash = await (await import("bcryptjs")).default.hash(body.newPassword, 10);
  await usersCol(db).updateOne({ _id: id(userId) }, { $set: { passwordHash } });
  res.json({ ok: true });
}));

app.post("/me/avatar", authMiddleware(true), asyncHandler(async (req, res) => {
  const body = z.object({ image: z.string().min(10) }).parse(req.body);
  const userId = (req as any).user?.sub as string;
  const m = body.image.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
  if (!m) {
    const err: any = new Error("Format gambar tidak valid");
    err.statusCode = 400;
    throw err;
  }
  const mime = m[1];
  const base64 = m[3];
  const buf = Buffer.from(base64, "base64");
  const ext = mime.includes("png") ? "png" : "jpg";
  const file = path.join(AVATAR_DIR, `${userId}.${ext}`);
  fs.writeFileSync(file, buf);
  // Store relative url
  const avatarUrl = `/uploads/avatars/${userId}.${ext}`;
  const db = await getDb();
  await usersCol(db).updateOne({ _id: id(userId) }, { $set: { avatar: avatarUrl } });
  res.json({ avatarUrl });
}));

// Global error handler (last)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) {
    log.warn("Zod validation error", { path: req.path, id: (req as any).id, issues: err.issues });
    return res.status(400).json({ error: "Invalid request", issues: err.issues });
  }
  log.error("Unhandled error", { path: req.path, id: (req as any).id, err });
  const payload: any = { error: "Internal Server Error" };
  if (log.isDebug) {
    payload.message = err?.message;
    payload.stack = err?.stack;
  }
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  return res.status(status).json(payload);
});

const PORT = process.env.PORT || 4000;
// Debug: list registered routes
function listRoutes() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack = (app as any)._router?.stack || [];
    const routes: string[] = [];
    stack.forEach((s: any) => {
      if (s.route && s.route.path) {
        const methods = Object.keys(s.route.methods).join(",").toUpperCase();
        routes.push(`${methods} ${s.route.path}`);
      } else if (s.name === 'router' && s.handle?.stack) {
        s.handle.stack.forEach((h: any) => {
          if (h.route && h.route.path) {
            const methods = Object.keys(h.route.methods).join(",").toUpperCase();
            routes.push(`${methods} ${h.route.path}`);
          }
        });
      }
    });
    log.debug("routes", { count: routes.length, routes });
  } catch {}
}

app.listen(PORT, () => {
  log.info(`Kasku API listening on :${PORT}`);
  if (log.isDebug) listRoutes();
});
