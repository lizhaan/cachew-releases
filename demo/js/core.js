/* Rules, clock and saved state of the demo. Mirrors the app's data/Rules.kt and data/Game.kt. */
'use strict';

const RULES = {
  PAUSE_SECONDS: 10,
  SESSION_MINUTES: 10,
  CHECK_IN_MINUTE: 5,
  SPECIFIC_WARNING_MINUTES_LEFT: 2,
  BUY_SESSION_MINUTES: 5,
  // Demo speed-up: one minute of a shop session lasts this many real milliseconds (10 min = 20 s).
  DEMO_MS_PER_MINUTE: 2000,
  CASHEWS_PER_SAVED_ITEM: 15,
  CASHEWS_PER_CLOSE: 5,
  REWARDED_CLOSES_PER_DAY: 3,
  CASHEWS_PER_DOLLAR_LET_GO: 1,
  LEVEL_THRESHOLDS: [0, 50, 150, 400, 1000],
  LEVEL_NAMES: ['Kit', 'Forager', 'Keeper', 'Stasher', 'Winter-ready'],
  LEVEL_REWARDS: ['', 'a winter scarf', 'a warm hat', 'a flashlight for the den', 'a tree-hollow house'],
  LEVEL_ICONS: ['🌰', '🧣', '🧢', '🔦', '🏠'],
  HEARTS_PER_MONTH: 3,
  WAIT_HOURS_OPTIONS: [24, 48, 72],
  DEFAULT_WAIT_HOURS: 48,
  NIGHT_FROM: '23:00',
  NIGHT_TO: '07:00',
  BUBBLE_MS: 6000,
};

const HOUR = 3600e3, DAY = 24 * HOUR;
const STORAGE_KEY = 'cachew-demo-state';
const STATE_VERSION = 3;

/* ---------- Clock: real time plus whatever "48 hours later" added ---------- */
function now() { return Date.now() + (S.clockOffset || 0); }

/** The time the phone shows: in night mode the evening starts at 23:42 and runs on from there. */
function displayNow() {
  if (!S.night) return now();
  const d = new Date(now());
  d.setHours(23, 42, 0, 0);
  return d.getTime() + Math.max(0, Date.now() - (S.nightSince || Date.now()));
}
function displayTime() { return hhmm(displayNow()); }

/* ---------- State ---------- */
let S = null;

function seedState() {
  const t = Date.now();
  // Matches design-v2/08 before the sweater is shared: two waiting, one let go, one bought with a heart.
  return {
    v: STATE_VERSION,
    clockOffset: 0,
    night: false,
    firstDay: dayKey(t - DAY),          // 2-day streak today
    lastBoughtDay: null,                // "I already bought it" resets the streak
    pennyBackDay: null,                 // Penny sits with her back to you until the day ends
    cashews: 20,
    heartsUsed: 1,
    heartsMonth: monthOf(t),            // hearts refill when the month changes
    shieldOn: true,
    closes: {},                         // dayKey -> rewarded closes that day
    defaultWait: RULES.DEFAULT_WAIT_HOURS,
    goal: { name: 'Tokyo', amount: 900, setAt: t - 6 * DAY },
    goalsDone: [],
    items: [
      { id: 'i-sneakers', title: 'Running sneakers', price: 89, shop: 'amazon', art: 'sneakers', product: 'p-amz-sneakers', addedAt: t - 17 * HOUR, waitH: 48, status: 'waiting' },
      { id: 'i-gloss', title: 'Lip gloss set', price: 38, shop: 'temu', art: 'gloss', product: 'p-gloss', addedAt: t - 36 * HOUR, waitH: 48, status: 'waiting' },
      { id: 'i-case', title: 'Phone case', price: 22, shop: 'amazon', art: 'phonecase', addedAt: t - 3.2 * DAY, waitH: 24, status: 'kept', decidedAt: t - 2 * DAY },
      { id: 'i-lamp', title: 'Desk lamp', price: 31, shop: 'temu', art: 'lamp', addedAt: t - 2.6 * DAY, waitH: 48, status: 'heart', decidedAt: t - 1.9 * DAY },
    ],
    // Every shop entry (the app's PauseRecord log). Stats is counted from this.
    // Late evenings, so "riskiest hour" reads like design-v2/09 (11 PM).
    log: [
      { at: atHour(t, 3, 23, 12), shop: 'shein', mood: 'tired', specific: false, action: 'look', ms: 6e5 },
      { at: atHour(t, 2, 23, 40), shop: 'shein', mood: 'bored', specific: false, action: 'closed', ms: 0 },
      { at: atHour(t, 2, 13, 5), shop: 'amazon', mood: 'fine', specific: true, action: 'specific', ms: 4.2e5 },
      { at: atHour(t, 1, 22, 10), shop: 'temu', mood: 'stressed', specific: false, action: 'look', ms: 6e5 },
    ],
    session: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === STATE_VERSION) return s;
    }
  } catch (e) { /* private mode or blocked storage: start fresh */ }
  return seedState();
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* the demo still works in memory */ }
}

function resetState() {
  S = seedState();
  saveState();
}

/* ---------- Dates ---------- */
function dayKey(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
/** [daysAgo] days before [t], at hh:mm. */
function atHour(t, daysAgo, h, m) {
  const d = new Date(t - daysAgo * DAY);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}
function monthOf(ms) { const d = new Date(ms); return d.getFullYear() * 12 + d.getMonth(); }
function daysBetween(fromKey, toMs) {
  const [y, m, d] = fromKey.split('-').map(Number);
  const a = new Date(y, m - 1, d).getTime();
  const b = new Date(new Date(toMs).toDateString()).getTime();
  return Math.round((b - a) / DAY);
}
function hhmm(ms) {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dayTime(ms) { return WEEKDAYS[new Date(ms).getDay()] + ' ' + hhmm(ms); }
function monthName(ms) { return MONTHS[new Date(ms).getMonth()]; }

/* ---------- Game (data/Game.kt) ---------- */
const Game = {
  streak() {
    const t = now();
    if (S.lastBoughtDay) return Math.max(0, daysBetween(S.lastBoughtDay, t));
    return Math.max(0, daysBetween(S.firstDay, t) + 1);
  },
  heartsLeft() {
    if (S.heartsMonth !== monthOf(now())) { S.heartsMonth = monthOf(now()); S.heartsUsed = 0; saveState(); }
    return Math.max(0, RULES.HEARTS_PER_MONTH - S.heartsUsed);
  },
  heartsRefill() {
    const d = new Date(now());
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  },
  level(cashews = S.cashews) {
    let n = 1;
    RULES.LEVEL_THRESHOLDS.forEach((from, i) => { if (cashews >= from) n = i + 1; });
    return n;
  },
  // Night = the demo's night mode, and only while the shield is on (like shield.isNight in the app).
  isNight() { return !!S.night && S.shieldOn !== false; },
  // Headline of the choice screen, from the two answers only (Game.headline).
  headline(mood, specific) {
    const word = { tired: 'Tired', bored: 'Bored', stressed: 'Stressed', fine: 'Fine' }[mood];
    if (mood === 'fine' && specific) return 'Feeling fine, here for something specific.';
    if (mood === 'fine') return 'Feeling fine, just scrolling.';
    if (specific) return word + ', but here for something specific.';
    return word + ', just scrolling.';
  },
  isRisky(mood, specific) { return !(mood === 'fine' && specific); },
  closeRewardLeft() { return (S.closes[dayKey(now())] || 0) < RULES.REWARDED_CLOSES_PER_DAY; },
  // "Close <shop>" / "I'm done": +5 cashews, at most 3 times a day. Returns what was earned.
  rewardClose() {
    if (!Game.closeRewardLeft()) return 0;
    const k = dayKey(now());
    S.closes[k] = (S.closes[k] || 0) + 1;
    S.cashews += RULES.CASHEWS_PER_CLOSE;
    saveState();
    return RULES.CASHEWS_PER_CLOSE;
  },
  addItem(item) {
    S.items.push(item);
    S.cashews += RULES.CASHEWS_PER_SAVED_ITEM;
    saveState();
    return RULES.CASHEWS_PER_SAVED_ITEM;
  },
  logEntry(entry) {
    S.log.push(entry);
    saveState();
    return S.log.length - 1;
  },
};

function money(v) {
  if (v == null) return '';
  const whole = Math.abs(v - Math.round(v)) < 0.005;
  return '$' + (whole ? Math.round(v).toLocaleString('en-US') : v.toFixed(2));
}

S = loadState();
