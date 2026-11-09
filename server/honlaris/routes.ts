import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { z } from "zod";

// Minimal cookie helpers (avoids pulling in the `cookie` package types).
function parseCookie(header: string): Record<string, string> {
  const jar: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      jar[key] = decodeURIComponent(raw);
    } catch {
      // Ignore malformed percent-encoding instead of throwing a 500.
      jar[key] = raw;
    }
  }
  return jar;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    sameSite?: string;
    path?: string;
    maxAge?: number;
    secure?: boolean;
  } = {}
): string {
  let out = `${name}=${encodeURIComponent(value)}`;
  if (options.path) out += `; Path=${options.path}`;
  if (options.maxAge !== undefined) {
    const seconds = Math.floor(options.maxAge / 1000);
    if (seconds > 0) {
      out += `; Max-Age=${seconds}`;
      out += `; Expires=${new Date(Date.now() + options.maxAge).toUTCString()}`;
    } else {
      out += "; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }
  if (options.httpOnly) out += "; HttpOnly";
  if (options.sameSite) out += `; SameSite=${options.sameSite}`;
  if (options.secure) out += "; Secure";
  return out;
}

// ---------------------------------------------------------------------------
// Storage locations (always inside the project folder)
// ---------------------------------------------------------------------------
const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const UPLOADS_DIR = path.resolve(process.cwd(), "client", "public", "uploads");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SECRET_FILE = path.join(DATA_DIR, "secret.key");

const ADMIN_COOKIE = "honlaris_admin";
const SESSION_DAYS = 7;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown): void {
  ensureDataDir();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

// ---------------------------------------------------------------------------
// Admin session: short-lived-issue JWT cookie signed by a local secret
// ---------------------------------------------------------------------------
function getSecret(): Uint8Array {
  ensureDataDir();
  if (process.env.ADMIN_JWT_SECRET) {
    return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
  }
  if (!fs.existsSync(SECRET_FILE)) {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString("hex"), {
      mode: 0o600,
    });
  }
  return new TextEncoder().encode(fs.readFileSync(SECRET_FILE, "utf-8"));
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  // Hash first so both inputs always produce equal-length buffers.
  const hashA = crypto.createHash("sha256").update(a, "utf-8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf-8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// ---------------------------------------------------------------------------
// Lightweight in-memory rate limiting (the built-in server is single-process).
// The public deployment is served by Vercel functions instead.
// ---------------------------------------------------------------------------
type RateEntry = { count: number; resetAt: number };
const rateLimits = new Map<string, RateEntry>();

function rateLimit(
  bucket: string,
  req: Request,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (rateLimits.size > 5000) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(key);
    }
  }
  // Socket address cannot be spoofed with a header (unlike X-Forwarded-For).
  const id = `${bucket}:${req.socket.remoteAddress ?? "unknown"}`;
  const entry = rateLimits.get(id);
  if (!entry || entry.resetAt <= now) {
    rateLimits.set(id, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function clearRateLimit(bucket: string, req: Request) {
  rateLimits.delete(`${bucket}:${req.socket.remoteAddress ?? "unknown"}`);
}

async function issueSession(req: Request, res: Response) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
  res.setHeader(
    "Set-Cookie",
    serializeCookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    })
  );
}

function clearSession(res: Response) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 })
  );
}

async function isAdmin(req: Request): Promise<boolean> {
  const cookies = parseCookie(req.headers.cookie ?? "");
  const token = cookies[ADMIN_COOKIE];
  if (!token || !token.trim()) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function supabaseConfig(): { url: string; key: string } {
  const url =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  return { url, key };
}

async function verifySupabaseAdmin(req: Request): Promise<boolean> {
  const { url, key } = supabaseConfig();
  if (!url || !key) return false;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return false;
  try {
    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return false;
    const user = (await userRes.json()) as { id?: string };
    if (!user?.id) return false;
    const adminRes = await fetch(
      `${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`,
      { headers: { apikey: key, Authorization: `Bearer ${token}` } }
    );
    if (!adminRes.ok) return false;
    const rows = (await adminRes.json()) as Array<{ user_id: string }>;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (await isAdmin(req)) return next();
  if (await verifySupabaseAdmin(req)) return next();
  res.status(401).json({ error: "Admin sign-in required." });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number looks too short.")
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, "Phone can only contain digits and + ( ) -."),
  service: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  time: z.string().trim().min(1).max(20),
  note: z.string().trim().max(600).optional(),
});

type BookingRecord = z.infer<typeof bookingSchema> & {
  id: string;
  status: "new" | "done";
  createdAt: string;
};

const uploadSchema = z.object({
  dataUrl: z.string().startsWith("data:image/").max(11 * 1024 * 1024),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export function registerHonlarisRoutes(app: Express) {
  ensureDataDir();
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "1d" }));

  // ---- public content -----------------------------------------------------
  app.get("/api/content", (_req, res) => {
    const stored = readJson<{ content: unknown } | null>(CONTENT_FILE, null);
    res.json({ content: stored?.content ?? null });
  });

  app.put("/api/content", requireAdmin, async (req, res) => {
    const parsed = z.object({ content: z.record(z.string(), z.unknown()) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Content must be an object." });
      return;
    }
    writeJson(CONTENT_FILE, { content: parsed.data.content, updatedAt: new Date().toISOString() });
    res.json({ ok: true });
  });

  // ---- admin auth ---------------------------------------------------------
  app.post("/api/admin/login", async (req, res) => {
    const gate = rateLimit("login", req, 10, 15 * 60 * 1000);
    if (!gate.allowed) {
      res.setHeader("Retry-After", String(gate.retryAfter));
      res.status(429).json({
        error: "Too many sign-in attempts. Please try again later.",
      });
      return;
    }
    const adminPassword = process.env.ADMIN_PASSWORD ?? "";
    if (!adminPassword) {
      res.status(500).json({ error: "ADMIN_PASSWORD is not set on the server." });
      return;
    }
    const parsed = z.object({ password: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Password is required." });
      return;
    }
    if (!timingSafeEqualStrings(parsed.data.password, adminPassword)) {
      res.status(401).json({ error: "Incorrect password." });
      return;
    }
    await issueSession(req, res);
    clearRateLimit("login", req);
    res.json({ ok: true });
  });

  app.get("/api/admin/me", async (req, res) => {
    res.json({ authorized: await isAdmin(req) });
  });

  app.post("/api/admin/logout", (_req, res) => {
    clearSession(res);
    res.json({ ok: true });
  });

  // ---- image upload (base64 data URL) --------------------------------------
  app.post("/api/upload", requireAdmin, async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Send an image file as a data URL." });
      return;
    }
    const match = /^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.*)$/s.exec(parsed.data.dataUrl);
    if (!match) {
      res.status(400).json({ error: "Choose a PNG, JPG, WebP, or GIF image." });
      return;
    }
    const [, mime, ext, base64] = match;
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > 8 * 1024 * 1024) {
      res.status(400).json({ error: "Images must be 8 MB or smaller." });
      return;
    }
    const name = `${Date.now()}-${nanoid(6)}.${ext === "jpeg" ? "jpg" : ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, name), bytes);
    res.json({ url: `/uploads/${name}`, type: mime });
  });

  // ---- bookings -----------------------------------------------------------
  app.post("/api/bookings", (req, res) => {
    const gate = rateLimit("booking", req, 10, 10 * 60 * 1000);
    if (!gate.allowed) {
      res.setHeader("Retry-After", String(gate.retryAfter));
      res.status(429).json({
        error: "Too many requests. Please try again in a few minutes.",
      });
      return;
    }
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid booking." });
      return;
    }
    const bookings = readJson<BookingRecord[]>(BOOKINGS_FILE, []);
    const booking: BookingRecord = {
      ...parsed.data,
      id: nanoid(12),
      status: "new",
      createdAt: new Date().toISOString(),
    };
    bookings.unshift(booking);
    writeJson(BOOKINGS_FILE, bookings);
    res.status(201).json({ ok: true, booking });
  });

  app.get("/api/bookings", requireAdmin, (_req, res) => {
    res.json({ bookings: readJson<BookingRecord[]>(BOOKINGS_FILE, []) });
  });

  app.patch("/api/bookings/:id", requireAdmin, (req, res) => {
    const bookings = readJson<BookingRecord[]>(BOOKINGS_FILE, []);
    const target = bookings.find(booking => booking.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    const parsed = z
      .object({ status: z.enum(["new", "done"]) })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Status must be new or done." });
      return;
    }
    target.status = parsed.data.status;
    writeJson(BOOKINGS_FILE, bookings);
    res.json({ ok: true });
  });

  app.delete("/api/bookings/:id", requireAdmin, (req, res) => {
    const bookings = readJson<BookingRecord[]>(BOOKINGS_FILE, []);
    const next = bookings.filter(booking => booking.id !== req.params.id);
    if (next.length === bookings.length) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    writeJson(BOOKINGS_FILE, next);
    res.json({ ok: true });
  });
}
