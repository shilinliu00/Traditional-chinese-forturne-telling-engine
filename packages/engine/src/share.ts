/**
 * Shareable chart links: encode the web form inputs as URL query params so a
 * chart can be bookmarked or sent as a link (e.g. ?date=2000-12-01&time=12:00).
 * Pure encode/decode with validation — the web UI reads the query string on
 * load and pre-fills the form when it parses cleanly.
 */
import type { Gender } from './luckPillars.ts';

export interface ShareParams {
  /** Gregorian birth date, 'YYYY-MM-DD'. */
  date: string;
  /** Local clock time, 'HH:mm' (24h). */
  time: string;
  /** Clock timezone offset from UTC in hours (-12..14, halves allowed). */
  utcOffset: number;
  /** Birthplace longitude in degrees East (-180..180). Omit for clock time. */
  longitude?: number;
  gender: Gender;
  lang: 'en' | 'zh';
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function validDate(s: string | null): s is string {
  if (!s) return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

function validTime(s: string | null): s is string {
  if (!s) return false;
  const m = TIME_RE.exec(s);
  if (!m) return false;
  return Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

function validOffset(n: number): boolean {
  return Number.isFinite(n) && n >= -12 && n <= 14 && n * 2 === Math.round(n * 2);
}

function validLongitude(n: number): boolean {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

/**
 * Encode birth params into a query string fragment (without the leading '?').
 * The result is URL-safe and deterministic.
 */
export function encodeShareParams(p: ShareParams): string {
  const q = new URLSearchParams();
  q.set('date', p.date);
  q.set('time', p.time);
  q.set('tz', String(p.utcOffset));
  if (p.longitude !== undefined) q.set('lon', String(p.longitude));
  q.set('gender', p.gender);
  q.set('lang', p.lang);
  return q.toString();
}

/**
 * Parse a query string (with or without the leading '?') back into birth
 * params. Returns null when anything required is missing or malformed — the
 * caller should then ignore the link and fall back to the default form.
 */
export function decodeShareParams(query: string): ShareParams | null {
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  } catch {
    return null;
  }
  const date = q.get('date');
  const time = q.get('time');
  if (!validDate(date) || !validTime(time)) return null;

  const tzRaw = q.get('tz');
  const utcOffset = tzRaw === null ? 8 : Number(tzRaw);
  if (!validOffset(utcOffset)) return null;

  const lonRaw = q.get('lon');
  let longitude: number | undefined;
  if (lonRaw !== null && lonRaw !== '') {
    const lon = Number(lonRaw);
    if (!validLongitude(lon)) return null;
    longitude = lon;
  }

  const gender = q.get('gender');
  if (gender !== 'male' && gender !== 'female') return null;
  const lang = q.get('lang');
  if (lang !== 'en' && lang !== 'zh') return null;

  return { date, time, utcOffset, longitude, gender, lang };
}
