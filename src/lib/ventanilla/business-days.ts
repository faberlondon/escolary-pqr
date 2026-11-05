/**
 * Días hábiles en Colombia (lunes a viernes, sin festivos nacionales).
 * Festivos calculados con la Ley 51 de 1983 ("Ley Emiliani") y la Pascua
 * (algoritmo de Meeus/Jones/Butcher), así sirve para cualquier año.
 *
 * Todas las fechas se manejan como "fecha civil en Bogotá" (YYYY-MM-DD),
 * para no depender de la zona horaria del navegador.
 */

const BOGOTA_TZ = "America/Bogota";
/** Radicados después de esta hora cuentan desde el siguiente día hábil (RN-05). */
export const CUTOFF_HOUR = 17;

export interface CivilDate {
  y: number;
  m: number;
  d: number;
}

const toUtc = (c: CivilDate): Date => new Date(Date.UTC(c.y, c.m - 1, c.d));
const fromUtc = (dt: Date): CivilDate => ({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
const addDays = (c: CivilDate, n: number): CivilDate => {
  const dt = toUtc(c);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromUtc(dt);
};
export const civilKey = (c: CivilDate): string =>
  `${c.y}-${String(c.m).padStart(2, "0")}-${String(c.d).padStart(2, "0")}`;

function easterSunday(year: number): CivilDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { y: year, m: month, d: day };
}

/** Traslada al lunes siguiente si no cae en lunes. */
function nextMonday(c: CivilDate): CivilDate {
  const dow = toUtc(c).getUTCDay();
  const shift = (8 - dow) % 7;
  return addDays(c, shift);
}

const holidayCache = new Map<number, Set<string>>();

export function colombianHolidays(year: number): Set<string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const fixed: CivilDate[] = [
    { y: year, m: 1, d: 1 },
    { y: year, m: 5, d: 1 },
    { y: year, m: 7, d: 20 },
    { y: year, m: 8, d: 7 },
    { y: year, m: 12, d: 8 },
    { y: year, m: 12, d: 25 },
  ];
  const movable: CivilDate[] = [
    { y: year, m: 1, d: 6 },
    { y: year, m: 3, d: 19 },
    { y: year, m: 6, d: 29 },
    { y: year, m: 8, d: 15 },
    { y: year, m: 10, d: 12 },
    { y: year, m: 11, d: 1 },
    { y: year, m: 11, d: 11 },
  ].map(nextMonday);
  const easter = easterSunday(year);
  const easterBased: CivilDate[] = [
    addDays(easter, -3),
    addDays(easter, -2),
    nextMonday(addDays(easter, 39)),
    nextMonday(addDays(easter, 60)),
    nextMonday(addDays(easter, 68)),
  ];
  const set = new Set([...fixed, ...movable, ...easterBased].map(civilKey));
  holidayCache.set(year, set);
  return set;
}

export function isBusinessDay(c: CivilDate): boolean {
  const dow = toUtc(c).getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !colombianHolidays(c.y).has(civilKey(c));
}

/** Fecha y hora civil en Bogotá de un instante. */
export function bogotaParts(instant: Date): CivilDate & { hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), hour: get("hour") };
}

/**
 * Vencimiento legal: el término corre desde el día hábil siguiente a la
 * radicación; si se radica tras la hora de corte o en día no hábil, se
 * considera recibido el siguiente día hábil.
 */
export function computeDueDate(radicatedAt: Date, businessDays: number): CivilDate {
  const p = bogotaParts(radicatedAt);
  let received: CivilDate = { y: p.y, m: p.m, d: p.d };
  if (!isBusinessDay(received) || p.hour >= CUTOFF_HOUR) {
    do received = addDays(received, 1);
    while (!isBusinessDay(received));
  }
  let cursor = received;
  let counted = 0;
  while (counted < businessDays) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) counted += 1;
  }
  return cursor;
}

/** Días hábiles desde hoy hasta la fecha (negativo si ya venció). */
export function businessDaysUntil(due: CivilDate, now: Date): number {
  const p = bogotaParts(now);
  const today: CivilDate = { y: p.y, m: p.m, d: p.d };
  const todayKey = civilKey(today);
  const dueKey = civilKey(due);
  if (todayKey === dueKey) return 0;
  const forward = dueKey > todayKey;
  let cursor = today;
  let count = 0;
  while (civilKey(cursor) !== dueKey) {
    cursor = addDays(cursor, forward ? 1 : -1);
    if (isBusinessDay(cursor)) count += 1;
  }
  return forward ? count : -count;
}

export const parseCivil = (key: string): CivilDate => {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
};
