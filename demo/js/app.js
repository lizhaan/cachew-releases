/* The Cachew app itself: Den, Waiting list, Stats, Me (design-v2/01, 08, 09; 25), goal and night shield. */
'use strict';

const TAB_ICONS = {
  den: '<path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4Z"/>',
  waiting: '<path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7.5V12l3 2"/>',
  stats: '<path d="M4 20h16M7 20v-8M12 20V6M17 20V10"/>',
  me: '<path d="M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4.5 20.5c0-4 3.3-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
};
const TABS = [['den', 'Den'], ['waiting', 'Waiting list'], ['stats', 'Stats'], ['me', 'Me']];

ACTIONS['open-cachew'] = () => go({ screen: 'app', tab: 'den' });
ACTIONS.tab = tab => { if (NAV.tab !== tab) go({ screen: 'app', tab }, false); };

SCREENS.app = n => `<div class="scr bg-day">
    <div class="body" id="tab-body">${TAB_SCREENS[n.tab]()}</div>
    <nav class="tabbar">${TABS.map(([k, label]) => `<button type="button" class="${k === n.tab ? 'on' : ''}" data-act="tab|${k}">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TAB_ICONS[k]}</svg>${label}</button>`).join('')}</nav>
  </div>`;

const TAB_SCREENS = {};

/* ---------- Numbers shared by the tabs (data/Stats.kt) ---------- */
function monthKey(ms) { const d = new Date(ms); return d.getFullYear() * 12 + d.getMonth(); }
function decidedThisMonth() {
  const m = monthKey(now());
  return S.items.filter(i => i.status !== 'waiting' && i.decidedAt && monthKey(i.decidedAt) === m);
}
function keptThisMonth() { return decidedThisMonth().filter(i => i.status === 'kept').reduce((a, i) => a + (i.price || 0), 0); }
function goalProgress() {
  if (!S.goal) return 0;
  return S.items.filter(i => i.status === 'kept' && (i.decidedAt || 0) >= S.goal.setAt).reduce((a, i) => a + (i.price || 0), 0);
}
function dueAt(item) { return item.addedAt + item.waitH * HOUR; }
function levelInfo() {
  const n = Game.level();
  const from = RULES.LEVEL_THRESHOLDS[n - 1];
  const next = n < RULES.LEVEL_THRESHOLDS.length ? n + 1 : null;
  const frac = next ? Math.min(1, (S.cashews - from) / (RULES.LEVEL_THRESHOLDS[next - 1] - from)) : 1;
  return { n, next, frac, name: RULES.LEVEL_NAMES[n - 1] };
}
function progress(frac, color) {
  return `<div class="bar"><i style="width:${Math.round(frac * 100)}%;background:${color}"></i></div>`;
}
function shieldText() { return S.shieldOn === false ? 'off' : `${RULES.NIGHT_FROM} – ${RULES.NIGHT_TO}`; }
function hearts(left, size, gapPx) {
  let h = '';
  for (let i = 0; i < RULES.HEARTS_PER_MONTH; i++) h += icon(i < left ? 'heart' : 'heart_empty', size);
  return `<div style="display:flex;gap:${gapPx}px">${h}</div>`;
}
function heartsLeftText(left) { return `${left} heart${left === 1 ? '' : 's'} left in ${monthName(now())}`; }

/* =====================================================================
 * Den (design-v2/01). Title is just "Den" in the demo.
 * ===================================================================== */
TAB_SCREENS.den = () => {
  const hour = new Date(displayNow()).getHours();
  const greeting = hour >= 5 && hour <= 11 ? 'Good morning' : hour >= 12 && hour <= 17 ? 'Good afternoon' : 'Good evening';
  const lv = levelInfo();
  const left = Game.heartsLeft();
  const goal = S.goal;
  const gp = goalProgress();
  const reached = goal && gp >= goal.amount;
  // Penny: asleep at night, back turned after "I already bought it" today, celebrating a reached goal.
  const pose = Game.isNight() ? 'sleep' : S.pennyBackDay === dayKey(now()) ? 'back' : reached ? 'love' : 'look';
  const chip = (ic, v) => `<span class="cchip">${icon(ic, 18)}${v}</span>`;
  const nextIdx = (lv.next || lv.n) - 1;
  return `${gap(16)}
    <div style="display:flex;align-items:center;gap:8px">
      <div class="grow"><p class="txt">${greeting}</p><h1 class="h1" style="font-size:26px;line-height:32px">Den</h1></div>
      ${chip('flame', Game.streak())}${chip('cashew', S.cashews)}
    </div>
    ${gap(16)}
    <div class="card">
      <div style="display:flex;align-items:center">
        <div class="grow">
          <div class="label">Money saved this month</div>
          ${gap(4)}
          <div class="big" style="font-size:48px">${money(keptThisMonth())}</div>
          ${gap(8)}
          ${hearts(left, 20, 8)}
          ${gap(6)}
          <p class="txt" style="font-size:14px;line-height:20px">${heartsLeftText(left)}</p>
          ${goal ? `${gap(6)}<p class="gold" style="font-size:14px;font-weight:700;margin:0">✈ ${esc(goal.name)} goal · ${money(Math.min(gp, goal.amount))} of ${money(goal.amount)}</p>` : ''}
        </div>
        ${penny(pose, 104)}
      </div>
      ${gap(12)}
      <div style="display:flex;font-size:14px;font-weight:600"><span class="grow">Level ${lv.n}</span><span class="purple">${lv.name}</span></div>
      ${gap(6)}
      ${progress(lv.frac, 'var(--purple)')}
    </div>
    ${gap(12)}
    ${!goal ? `<button type="button" class="card sel" data-act="goal">
        <div class="ctitle">What are you saving for?</div>${gap(4)}
        <p class="txt">Pick a goal. Every “Let it go” moves you closer.</p></button>${gap(12)}`
      : reached ? `<div class="card sel">
        <div class="ctitle">${esc(goal.name)} goal reached! 🎉</div>${gap(4)}
        <p class="txt">Penny is so proud of you. Ready for the next one?</p>${gap(12)}
        ${primaryBtn('Set a new goal', 'goal-new')}</div>${gap(12)}` : ''}
    <div class="card">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="ctitle grow">Penny's winter stash</span>${icon('cashew', 22)}<span class="ctitle">${S.cashews}</span>
      </div>
      ${gap(12)}
      <div style="display:flex;align-items:center;gap:14px">
        <span style="font-size:30px;line-height:1">${RULES.LEVEL_ICONS[nextIdx]}</span>
        <div class="grow">
          <div style="font-size:15.5px;font-weight:700;color:var(--title)">${lv.next ? 'Next for Penny: ' + RULES.LEVEL_REWARDS[lv.next - 1] : 'Penny is winter-ready'}</div>
          ${gap(6)}
          ${progress(lv.frac, 'var(--gold)')}
          ${lv.next ? `${gap(6)}<p class="txt" style="font-size:13px;line-height:18px">at ${RULES.LEVEL_THRESHOLDS[lv.next - 1]} cashews · Level ${lv.next}</p>` : ''}
        </div>
      </div>
    </div>
    ${gap(12)}
    <button type="button" class="card" data-act="shield">
      <div style="display:flex;align-items:center;gap:14px">
        ${icon('moon', 24)}<span class="ctitle grow">Night shield</span><span class="txt" style="font-size:16px">${shieldText()}</span>
      </div>
    </button>
    ${gap(16)}`;
};

/* =====================================================================
 * Waiting list (design-v2/08)
 * ===================================================================== */
TAB_SCREENS.waiting = () => {
  const t = now();
  const waiting = S.items.filter(i => i.status === 'waiting').sort((a, b) => dueAt(a) - dueAt(b));
  const decided = S.items.filter(i => i.status !== 'waiting').sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0));
  const dm = decidedThisMonth();
  const sum = list => list.reduce((a, i) => a + (i.price || 0), 0);
  const saved = dm.filter(i => i.status === 'kept'), bought = dm.filter(i => i.status !== 'kept');
  const cell = (amount, label, count, color) => `<div class="grow center"><div style="font-size:22px;font-weight:800;color:${color}">${money(amount)}</div>
      <p class="txt" style="font-size:13px;line-height:18px">${label} · ${count}</p></div>`;
  const shop = i => (SHOPS[i.shop] || { name: 'Shop' }).name;
  const row = (i, sub, status, color, act) => `<${act ? 'button type="button"' : 'div'} class="card irow"${act ? ` data-act="${act}"` : ''}>
      <span class="thumb" style="width:56px;height:56px">${itemArt(i)}</span>
      <div class="grow" style="min-width:0"><div class="iname">${esc(i.title)}</div><div class="isub">${esc(sub)}</div></div>
      <div style="text-align:right;flex:none">${i.price != null ? `<div class="iprice">${money(i.price)}</div>` : ''}<div class="istatus" style="color:${color}">${status}</div></div>
    </${act ? 'button' : 'div'}>`;
  let html = `${gap(16)}<h1 class="h1">Waiting list</h1>${gap(6)}<p class="txt">Things you shared instead of buying.</p>${gap(16)}
    <div class="card" style="display:flex;align-items:center">
      ${cell(sum(waiting), 'waiting', waiting.length, 'var(--title)')}<span class="vdiv"></span>
      ${cell(sum(saved), 'saved', saved.length, 'var(--gold)')}<span class="vdiv"></span>
      ${cell(sum(bought), 'bought', bought.length, 'var(--title)')}
    </div>`;
  if (!S.items.length) {
    html += `${gap(32)}<div class="center">${penny('ball', 160)}${gap(12)}<h2 class="h2">Nothing waiting yet</h2>${gap(6)}
      <p class="txt">In a shop, tap Share → Cachew. Penny keeps it here while you wait.</p></div>`;
  }
  if (waiting.length) {
    html += `${gap(20)}<div class="label">Waiting</div>${gap(10)}`;
    html += waiting.map(i => {
      const left = dueAt(i) - t;
      const status = left <= 0 ? 'ready' : left < HOUR ? `${Math.floor(left / 60e3) + 1}m left` : `${Math.floor(left / HOUR)}h left`;
      return row(i, `${shop(i)} · added ${dayTime(i.addedAt)}`, status, 'var(--purple-text)', `item|${i.id}`);
    }).join('');
  }
  if (decided.length) {
    html += `${gap(20)}<div class="label">Decided</div>${gap(10)}`;
    html += decided.map(i => {
      if (i.status === 'kept') return row(i, `${shop(i)} · let go ${WEEKDAYS[new Date(i.decidedAt).getDay()]}`, i.price != null ? `+${money(i.price)} kept` : 'Let go ✓', 'var(--gold)');
      if (i.status === 'heart') return row(i, `${shop(i)} · bought with a heart`, 'heart used', 'var(--heart)');
      return row(i, `${shop(i)} · bought`, 'bought', 'var(--text2)');
    }).join('');
  }
  return html + gap(16);
};

/** Tap on a waiting item: ready → "Still want it?"; still waiting → edit dialog (with "Buy it"). */
ACTIONS.item = id => {
  const item = S.items.find(i => i.id === id);
  if (!item) return;
  if (dueAt(item) <= now() && typeof openStillWant === 'function') { openStillWant(id); return; }
  editItemDialog(item);
};

function editItemDialog(item) {
  const left = Game.heartsLeft();
  const refill = Game.heartsRefill().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const buy = typeof buyWithHeart === 'function'
    ? `<button type="button" class="dlg-text" data-act="dlg-buy|${item.id}"${left > 0 ? '' : ' disabled'}>${left > 0 ? `Buy it now · uses a heart (${left} left)` : `No hearts left to buy early. They refill ${refill}.`}</button>`
    : '';
  openSheet(`<div class="dialog" role="dialog" aria-label="Edit item">
    <h2 class="dlg-title">Edit item</h2>
    <label class="ofield"><span>Name</span><input id="e-name" value="${esc(item.title)}" autocomplete="off"></label>
    ${gap(8)}
    <label class="ofield"><span>Price ($)</span><input id="e-price" value="${item.price != null ? esc(String(item.price)) : ''}" inputmode="decimal" autocomplete="off"></label>
    ${gap(16)}
    ${buy}
    <div class="dlg-actions"><button type="button" data-act="dlg-close">Cancel</button><button type="button" data-act="dlg-save|${item.id}">Save</button></div>
  </div>`, 'dlg-close');
}
ACTIONS['dlg-close'] = () => closeSheet();
ACTIONS['dlg-save'] = id => {
  const item = S.items.find(i => i.id === id);
  const name = $('#e-name').value.trim();
  if (name) item.title = name;
  item.price = parsePrice($('#e-price').value);
  saveState();
  closeSheet();
  render(false);
};

/* =====================================================================
 * Stats (design-v2/09), from this month's data
 * ===================================================================== */
TAB_SCREENS.stats = () => {
  const m = monthKey(now());
  const decided = decidedThisMonth();
  const kept = decided.filter(i => i.status === 'kept');
  const weeks = [0, 0, 0, 0];
  kept.forEach(i => { weeks[Math.min(3, Math.floor((new Date(i.decidedAt).getDate() - 1) / 7))] += i.price || 0; });
  const max = Math.max(...weeks) || 1;
  const entries = S.log.filter(e => monthKey(e.at) === m);
  const most = key => {
    const c = {};
    entries.forEach(e => { const k = key(e); c[k] = (c[k] || 0) + 1; });
    let best = null;
    Object.keys(c).forEach(k => { if (best === null || c[k] > c[best]) best = k; });
    return best;
  };
  const hour = most(e => new Date(e.at).getHours());
  const shop = most(e => e.shop);
  const hourText = hour === null ? '–' : `${(Number(hour) % 12) || 12} ${Number(hour) < 12 ? 'AM' : 'PM'}`;
  const tile = (v, label) => `<div class="card"><div style="font-size:24px;font-weight:800;color:var(--title);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v}</div>${gap(2)}<p class="txt" style="font-size:14px;line-height:20px">${label}</p></div>`;
  return `${gap(16)}<h1 class="h1">Stats</h1>${gap(6)}<p class="txt">${monthName(now())} so far</p>${gap(16)}
    <div class="card">
      <div class="label" style="color:var(--gold)">Winter stash</div>${gap(6)}
      <div class="big">${money(kept.reduce((a, i) => a + (i.price || 0), 0))}</div>
      <p class="txt">kept instead of spent</p>${gap(16)}
      <div class="weeks">${weeks.map((w, i) => `<div><span><i style="height:${Math.max(8, Math.round(w / max * 100))}%"></i></span><b>W${i + 1}</b></div>`).join('')}</div>
    </div>
    ${gap(12)}
    <div class="row">${tile(entries.length || '–', 'pauses')}${tile(decided.length ? `${kept.length} of ${decided.length}` : '–', 'wants you let go')}</div>
    ${gap(12)}
    <div class="row">${tile(hourText, 'riskiest hour')}${tile(shop ? SHOPS[shop].name : '–', 'top trigger shop')}</div>
    ${gap(16)}`;
};

/* =====================================================================
 * Me (25)
 * ===================================================================== */
TAB_SCREENS.me = () => {
  const lv = levelInfo();
  const goal = S.goal;
  const rowHtml = (title, value, act) => `<button type="button" class="card setrow" data-act="${act}">
      <span class="ctitle grow">${title}</span><span class="txt setval">${esc((value + ' ›').trim())}</span></button>`;
  return `${gap(16)}
    <div style="display:flex;align-items:center;gap:16px">
      <img src="assets/icons/app_icon_512.png" alt="" style="width:76px;height:76px;border-radius:20px">
      <div><h1 class="h1">Penny</h1><p class="txt" style="font-size:16px">Level ${lv.n} · ${lv.name} · ${S.cashews} cashews</p></div>
    </div>
    ${gap(20)}
    ${rowHtml('Night shield', shieldText(), 'shield')}
    ${rowHtml('Shops with a pause', '3 apps', 'me-shops')}
    ${rowHtml('Waiting time', `${S.defaultWait} hours`, 'me-wait')}
    ${rowHtml('Savings goal', goal ? `${goal.name} · ${money(Math.min(goalProgress(), goal.amount))} of ${money(goal.amount)}` : 'Not set', 'goal')}
    ${rowHtml('Reset demo data', '', 'me-reset')}
    ${gap(4)}`;
};

ACTIONS['me-shops'] = () => toast('In the app you pick any shopping apps. Here it\'s Shein, Amazon and Temu.', 3200);
ACTIONS['me-wait'] = () => {
  openSheet(`<div class="dialog" role="dialog" aria-label="Waiting time">
    <h2 class="dlg-title">Waiting time</h2>
    <div class="row" style="gap:8px">${RULES.WAIT_HOURS_OPTIONS.map(h => `<button type="button" class="tile${h === S.defaultWait ? ' sel' : ''}" style="height:56px" data-act="set-wait|${h}">${h}h</button>`).join('')}</div>
    <div class="dlg-actions"><button type="button" data-act="dlg-close">OK</button></div>
  </div>`, 'dlg-close');
};
ACTIONS['set-wait'] = h => { S.defaultWait = Number(h); saveState(); closeSheet(); render(false); };
ACTIONS['me-reset'] = () => {
  openSheet(`<div class="dialog" role="dialog" aria-label="Reset demo data">
    <h2 class="dlg-title">Reset demo data?</h2>
    <p class="txt" style="font-size:14px;line-height:20px">The demo starts over: waiting items, cashews, streak, hearts, stats and goals go back to the sample data.</p>
    <div class="dlg-actions"><button type="button" data-act="dlg-close">Cancel</button><button type="button" data-act="demo-reset">Reset</button></div>
  </div>`, 'dlg-close');
};

/* =====================================================================
 * Savings goal
 * ===================================================================== */
ACTIONS.goal = () => go({ screen: 'goal', back: { ...NAV } });
ACTIONS['goal-new'] = () => {
  const gp = goalProgress();
  S.goalsDone.push({ name: S.goal.name, amount: S.goal.amount, doneAt: now(), progress: gp });
  S.goal = null;
  saveState();
  go({ screen: 'goal', back: { ...NAV } });
};

SCREENS.goal = () => {
  const g = S.goal;
  return `<div class="scr bg-day">
    <div class="body">
      ${gap(20)}
      <div style="display:flex;align-items:center"><h1 class="h1 grow">What are you saving for?</h1>${penny('sparkle', 100)}</div>
      ${gap(6)}
      <p class="txt">Every “Let it go” adds the item's price to your goal.</p>
      ${gap(20)}
      <label class="ofield"><span>Goal</span><input id="g-name" data-input="goal" value="${g ? esc(g.name) : ''}" placeholder="e.g. Tokyo" autocomplete="off"></label>
      ${gap(12)}
      <label class="ofield"><span>Amount ($)</span><input id="g-amount" data-input="goal" value="${g ? g.amount : ''}" inputmode="decimal" autocomplete="off"></label>
      ${S.goalsDone.length ? `${gap(24)}<div class="label" style="color:var(--gold)">Reached</div>${gap(10)}` +
        S.goalsDone.map(d => `<div class="card" style="margin-bottom:12px"><div style="display:flex"><span class="ctitle grow" style="font-size:17px">✓ ${esc(d.name)}</span><b class="gold">${money(d.amount)}</b></div>
          <p class="txt" style="font-size:13px">${new Date(d.doneAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>`).join('') : ''}
      ${gap(16)}
    </div>
    <div class="foot" style="padding-bottom:0">${primaryBtn('Set goal', 'goal-set', !(g && g.name && g.amount), 'goal-btn')}${textBtn('Skip', 'goal-skip')}</div>
  </div>`;
};
INPUTS.goal = () => { $('#goal-btn').disabled = !($('#g-name').value.trim() && parsePrice($('#g-amount').value)); };
ACTIONS['goal-set'] = () => {
  const name = $('#g-name').value.trim(), amount = parsePrice($('#g-amount').value);
  if (!name || !amount) return;
  // Changing only the amount keeps the progress; a new name starts a new goal.
  const same = S.goal && S.goal.name === name;
  S.goal = { name, amount, setAt: same ? S.goal.setAt : now() };
  saveState();
  go(NAV.back || { screen: 'app', tab: 'den' });
};
ACTIONS['goal-skip'] = () => go(NAV.back || { screen: 'app', tab: 'den' });

/* =====================================================================
 * Night shield (10, without Soft/Strict). Hours are fixed in the demo.
 * ===================================================================== */
ACTIONS.shield = () => go({ screen: 'shield', back: { ...NAV } });

SCREENS.shield = () => {
  const on = S.shieldOn !== false;
  // In the real app the schedule locks 2 hours before the night until it ends; in the demo: while night mode is on.
  const locked = on && Game.isNight();
  return `<div class="scr bg-day">
    <div class="body">
      ${gap(20)}
      <div style="display:flex;align-items:center;gap:8px">
        <div class="grow"><h1 class="h1" style="font-size:34px;line-height:40px">Night shield</h1>${gap(6)}
          <p class="txt" style="font-size:17px;line-height:24px">Your riskiest hours. The shops you picked stay closed.</p></div>
        ${penny('sleep', 120)}
      </div>
      ${gap(20)}
      <div class="card${on ? ' sel' : ''}" style="padding:24px 12px;display:flex;align-items:center;${locked ? 'opacity:.55' : ''}">
        <button type="button" class="grow center" data-act="shield-time"><span class="big" style="font-size:40px">${RULES.NIGHT_FROM}</span><span class="txt">from</span></button>
        <span class="txt" style="font-size:24px">→</span>
        <button type="button" class="grow center" data-act="shield-time"><span class="big" style="font-size:40px">${RULES.NIGHT_TO}</span><span class="txt">to</span></button>
      </div>
      ${locked ? `${gap(10)}<p class="txt" style="padding:0 6px"><b style="color:var(--title)">Locked until ${RULES.NIGHT_TO}</b><br>The shield starts soon, so tonight can only get longer.</p>` : ''}
      ${gap(12)}
      <button type="button" class="card" data-act="shield-toggle" style="display:flex;align-items:center;${locked ? 'opacity:.55' : ''}"${locked ? ' disabled' : ''}>
        <span class="ctitle grow">Night shield on</span><span class="switch${on ? ' on' : ''}"><i></i></span>
      </button>
      ${gap(10)}
      <p class="txt" style="font-size:14px;line-height:20px;padding:0 6px">${on ? `From ${RULES.NIGHT_FROM} to ${RULES.NIGHT_TO} the shops you picked don't open. Reminders wait for the morning.` : 'Shield off: shops open at night too. Reminders still wait until 9:00.'}</p>
      ${gap(12)}
      <div class="card"><div style="font-size:17px;font-weight:700;color:var(--title)">What happens at night</div>${gap(6)}
        <p class="txt" style="font-size:14px;line-height:21px">· the shops you picked stay closed<br>· you can still save things to your list<br>· reminders wait for the morning</p></div>
      ${gap(12)}
      <p class="txt" style="font-size:14px;line-height:20px;padding:0 6px">Pick your own hours any time. In the 2 hours before they start, they can only get longer, not shorter.</p>
      ${gap(16)}
    </div>
    <div class="foot">${primaryBtn('Save', 'shield-save')}</div>
  </div>`;
};
ACTIONS['shield-time'] = () => toast('In the app you pick your own hours. The demo keeps 23:00 – 07:00.', 3200);
ACTIONS['shield-toggle'] = () => { S.shieldOn = S.shieldOn === false; saveState(); render(false); };
ACTIONS['shield-save'] = () => go(NAV.back || { screen: 'app', tab: 'den' });
