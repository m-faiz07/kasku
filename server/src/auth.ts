import { z } from "zod";
import { getDb, usersCol } from "./db.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "./types.js";
import { log } from "./logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_TTL = process.env.JWT_TTL || "7d";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(input: z.infer<typeof RegisterSchema>) {
  const db = await getDb();
  const now = new Date().toISOString();
  const email = input.email.toLowerCase().trim();
  const exists = await usersCol(db).findOne({ email });
  if (exists) {
    const err = new Error("Email sudah terdaftar");
    // @ts-ignore
    err.statusCode = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const doc: Omit<User, "id"> = {
    email,
    name: input.name?.trim() || undefined,
    passwordHash,
    createdAt: now,
  };
  const r = await usersCol(db).insertOne(doc as any);
  const user = { id: String(r.insertedId), email, name: doc.name, avatar: (doc as any).avatar };
  const token = signToken({ sub: user.id, email });
  return { token, user };
}

export async function login(input: z.infer<typeof LoginSchema>) {
  const db = await getDb();
  const email = input.email.toLowerCase().trim();
  const doc = await usersCol(db).findOne({ email });
  if (!doc) {
    const err = new Error("Email belum terdaftar");
    // @ts-ignore
    err.statusCode = 404;
    throw err;
  }
  const ok = await bcrypt.compare(input.password, (doc as any).passwordHash);
  if (!ok) {
    const err = new Error("Kata sandi salah");
    // @ts-ignore
    err.statusCode = 401;
    throw err;
  }
  const user = { id: String((doc as any)._id), email: (doc as any).email, name: (doc as any).name, avatar: (doc as any).avatar };
  const token = signToken({ sub: user.id, email: user.email });
  return { token, user };
}

export function signToken(payload: { sub: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token?: string): { sub: string; email: string } | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    log.warn("JWT verify failed");
    return null;
  }
}

export function authMiddleware(required: boolean) {
  return (req: any, res: any, next: any) => {
    if (!required) return next();
    const hdr = req.header("authorization") || req.header("Authorization");
    const token = hdr?.startsWith("Bearer ") ? hdr.slice("Bearer ".length) : undefined;
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });
    req.user = decoded;
    return next();
  };
}
