const LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = typeof LEVELS[number];

const IS_DEBUG = (process.env.DEBUG ?? "").toLowerCase() === "true" || (process.env.NODE_ENV ?? "development") !== "production";
const DEFAULT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (IS_DEBUG ? "debug" : "info");

const levelIndex = (lvl: LogLevel) => LEVELS.indexOf(lvl);
const minLevelIdx = levelIndex(DEFAULT_LEVEL);

function fmtTs(d = new Date()): string {
  return d.toISOString();
}

function emit(lvl: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (levelIndex(lvl) < minLevelIdx) return;
  const line = `[${fmtTs()}] [${lvl}] ${msg}`;
  const printer = lvl === "error" ? console.error : lvl === "warn" ? console.warn : lvl === "debug" ? console.debug : console.log;
  if (meta && Object.keys(meta).length > 0) {
    try {
      printer(line, JSON.stringify(safeMeta(meta)));
    } catch {
      printer(line);
    }
  } else {
    printer(line);
  }
}

function safeMeta(meta: Record<string, unknown>) {
  const m: Record<string, unknown> = { ...meta };
  if (m.err && m.err instanceof Error) {
    const e = m.err as Error;
    m.err = {
      name: e.name,
      message: e.message,
      stack: IS_DEBUG ? e.stack : undefined,
    };
  }
  return m;
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
  isDebug: IS_DEBUG,
};

export default log;

