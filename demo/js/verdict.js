/* Stage 3: the reminder, "Still want it?" and what follows (19, 20/design-v2/07, 21, 22),
 * "Buy it" (short pause → the item's page, 5-minute visit), night mode and its block screen. */
'use strict';

/* =====================================================================
 * Reminder on the lock screen (18)
 * ===================================================================== */
/** "⏩ 48 hours later": time jumps, waiting items get ready, Penny asks about the newest one. */
function fastForward() {
  if (S.session) finishSession();
  closeSheet();
  S.clockOffset = (S.clockOffset || 0) + 48 * HOUR;
  const t = now();
  const ready = S.items.filter(i => i.status === 'waiting' && !i.notified && dueAt(i) <= t)
    .sort((a, b) => b.addedAt - a.addedAt);
  ready.forEach(i => { i.notified = true; });
  saveState();
  if (!ready.length) {
    goHome();
    toast('48 hours later. Nothing new is ready yet.');
    return;
  }
  // Reminders only come in the daytime: at night Penny waits till the morning.
  if (S.night) {
    S.pendingReminder = ready[0].id;
    saveState();
    goHome();
    toast('It\'s night, so Penny waits till morning to ask. Turn night mode off.', 4000);
    return;
  }
  showLockScreen(ready[0].id, false);
}

function showLockScreen(id, movedToMorning) {
  const back = NAV.screen === 'lock' ? NAV.back : { ...NAV };
  go({ screen: 'lock', id, moved: movedToMorning, back });
}

SCREENS.lock = n => {
  const item = S.items.find(i => i.id === n.id);
  const t = new Date(now());
  const date = `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][t.getDay()]}, ${t.getDate()} ${monthName(now())}`;
  const body = (item.price != null ? `Still want ${item.title} for ${money(item.price)}?` : `Still want ${item.title}?`)
    + (n.moved ? ' Penny waited till morning to ask.' : '');
  return `<div class="scr lockscreen" data-act="lock-dismiss">
    <div class="center" style="padding-top:44px">
      <p class="txt" style="font-size:20px;font-weight:600;color:rgba(251,246,236,.8)">${date}</p>
      <div class="lock-time">${displayTime()}</div>
    </div>
    <div class="grow"></div>
    <button type="button" class="notif" data-act="notif-open|${item.id}">
      <img src="assets/icons/app_icon_512.png" alt="">
      <div class="grow" style="min-width:0">
        <div style="display:flex"><b class="grow">Cachew</b><span class="txt" style="font-size:13px">now</span></div>
        <div class="nt">Your ${item.waitH} hours are up</div>
        <div class="txt" style="font-size:15px;line-height:21px">${esc(body)}</div>
      </div>
    </button>
    <div class="grow"></div>
    <p class="txt center" style="font-size:13px;padding-bottom:18px">Tap the notification · tap anywhere else to unlock</p>
  </div>`;
};
ACTIONS['lock-dismiss'] = () => go(NAV.back && NAV.back.screen !== 'lock' ? NAV.back : { screen: 'home' });
ACTIONS['notif-open'] = id => openStillWant(id);

/* =====================================================================
 * 19 "Still want it?"
 * ===================================================================== */
function openStillWant(id) { go({ screen: 'still', id }); }

SCREENS.still = n => {
  const item = S.items.find(i => i.id === n.id);
  const added = new Date(item.addedAt);
  const h = added.getHours();
  const addedNight = h >= 23 || h < 7;
  const kept = keptThisMonth();
  // A nudge from real data, as in the app.
  const insight = addedNight ? `You added it at ${hhmm(item.addedAt)}. Late-night wants often fade by morning.`
    : kept > 0 ? `You've kept ${money(kept)} this month by waiting.`
      : 'Most wants fade with a little time. Letting this one go starts your stash.';
  return `<div class="scr bg-day">
    <div class="body">
      ${gap(20)}
      <div class="label">Waiting list · ${item.waitH}h later</div>
      ${gap(8)}
      <h1 class="h1">Still want it?</h1>
      ${gap(20)}
      ${itemCard(item, `Added ${WEEKDAYS[added.getDay()]}, ${hhmm(item.addedAt)}`)}
      ${gap(12)}
      <div class="card"><p class="txt">${insight}</p></div>
      ${gap(16)}
    </div>
    <div class="foot" style="padding-bottom:0">
      ${primaryBtn(item.price != null ? `Let it go · keep ${money(item.price)}` : 'Let it go', `let-go|${item.id}`)}
      ${gap(12)}
      ${secondaryBtn('Buy it, I waited', `buy-waited|${item.id}`, '', true)}
      ${textBtn('I already bought it', `already-bought|${item.id}`)}
    </div>
  </div>`;
};

function itemCard(item, subtitle) {
  return `<div class="card"><div style="display:flex;align-items:center;gap:14px">
    <span class="thumb" style="width:86px;height:86px">${itemArt(item)}</span>
    <div class="grow" style="min-width:0">
      <div class="f-name" style="line-height:23px">${esc(item.title)}</div>
      ${gap(2)}<div class="txt" style="font-size:15px">${esc(subtitle)}</div>
      ${item.price != null ? `${gap(6)}<div class="f-price">${money(item.price)}</div>` : ''}
    </div></div></div>`;
}

function statCard(value, label, ic) {
  return `<div class="card center" style="padding:16px 8px">
    <div style="display:flex;align-items:center;gap:8px;font-size:26px;font-weight:800;color:var(--title)">${value}${ic ? icon(ic, 24) : ''}</div>
    ${gap(2)}<div style="font-size:14px;font-weight:600;color:var(--text2)">${label}</div></div>`;
}

/* ---------- Let it go → "Kept, not spent" (design-v2/07) ---------- */
ACTIONS['let-go'] = id => {
  const item = S.items.find(i => i.id === id);
  const before = Game.level();
  const earned = item.price != null ? Math.round(item.price * RULES.CASHEWS_PER_DOLLAR_LET_GO) : 0;
  item.status = 'kept';
  item.decidedAt = now();
  S.cashews += earned;
  saveState();
  const level = Game.level();
  go({ screen: 'win', amount: item.price, earned, levelledUp: level > before, level });
};

SCREENS.win = n => {
  const nuts = [[-120, 40, -20], [-90, 22, 15], [-60, 44, -5], [-30, 18, 30], [0, 42, -25], [30, 16, 10], [60, 44, 35], [90, 22, -15],
    [120, 40, 20], [-75, 0, -35], [-15, -4, 5], [45, -2, -30], [-45, 30, 50], [15, 30, -45], [75, 30, 0]];
  const reward = RULES.LEVEL_REWARDS[n.level - 1];
  const name = RULES.LEVEL_NAMES[n.level - 1];
  return `<div class="scr bg-day">
    <div class="body center">
      ${gap(28)}
      <div class="label">Kept, not spent</div>
      ${gap(4)}
      <div class="win-amount" style="font-size:${n.amount != null ? 76 : 54}px">${n.amount != null ? '+' + money(n.amount) : 'Let go ✓'}</div>
      ${gap(8)}
      <div class="pile">
        ${nuts.map(([x, y, r]) => `<img src="assets/icons/cashew.svg" alt="" style="transform:translate(${x}px,${-y - 6}px) rotate(${r}deg)">`).join('')}
        ${penny('lie', 230, 'position:absolute;bottom:48px;left:50%;margin-left:-115px')}
      </div>
      ${gap(10)}
      <p style="margin:0;font-size:15.5px;font-weight:600;color:var(--text)">${n.earned > 0 ? `+${n.earned} cashews · Penny's stash: ${S.cashews}` : `Penny's stash: ${S.cashews}`}</p>
      <h1 class="h1" style="font-size:32px;line-height:40px">${n.levelledUp ? 'Penny levelled up' : 'Penny\'s stash grew'}</h1>
      <p class="txt" style="font-size:18px;line-height:24px">${n.levelledUp && reward ? `Level ${n.level} · ${name} · she got ${reward}` : `Level ${n.level} · ${name}`}</p>
      ${gap(20)}
      <div class="row" style="width:100%">
        ${statCard(money(keptThisMonth()), `saved in ${monthName(now()).slice(0, 3)}`)}
        ${statCard(Game.streak(), 'day streak', 'flame')}
        ${statCard(Game.heartsLeft(), 'hearts left', 'heart')}
      </div>
      ${gap(16)}
    </div>
    <div class="foot">${primaryBtn('Back to the den', 'to-den')}</div>
  </div>`;
};
ACTIONS['to-den'] = () => go({ screen: 'app', tab: 'den' });

/* ---------- I already bought it → 21 ---------- */
ACTIONS['already-bought'] = id => {
  const item = S.items.find(i => i.id === id);
  item.status = 'bought';
  item.decidedAt = now();
  S.lastBoughtDay = dayKey(now());   // streak back to 0
  S.pennyBackDay = dayKey(now());    // Penny sits with her back to you till the day ends
  saveState();
  go({ screen: 'bought' });
};

SCREENS.bought = () => `<div class="scr bg-day">
    <div class="body center">
      ${gap(36)}
      ${penny('back', 280, 'width:min(280px,34cqh);height:min(280px,34cqh)')}
      ${gap(12)}
      <h1 class="h1" style="font-size:34px;line-height:40px">Penny turned away</h1>
      ${gap(10)}
      <p class="txt">You bought it without waiting. Penny will be fine by morning, but the streak starts again. Tomorrow is a new day.</p>
      ${gap(24)}
      <div class="row" style="width:100%">${statCard(Game.streak(), 'streak', 'flame')}${statCard(Game.heartsLeft(), 'hearts left', 'heart')}</div>
      ${gap(16)}
    </div>
    <div class="foot">${primaryBtn('Okay, tomorrow is new', 'to-den')}</div>
  </div>`;

/* =====================================================================
 * "Buy it": free after the wait, a heart before it. Then a short pause and the item's page.
 * ===================================================================== */
ACTIONS['buy-waited'] = id => {
  const item = S.items.find(i => i.id === id);
  item.status = 'bought';
  item.decidedAt = now();
  saveState();
  startBuyPause(item);
};

/** From the edit dialog while the timer still runs: costs a heart (streak kept) → screen 22. */
function buyWithHeart(id) {
  const item = S.items.find(i => i.id === id);
  if (Game.heartsLeft() <= 0) return;
  S.heartsUsed += 1;
  item.status = 'heart';
  item.decidedAt = now();
  saveState();
  closeSheet();
  go({ screen: 'heart', id });
}
ACTIONS['dlg-buy'] = id => buyWithHeart(id);

SCREENS.heart = n => {
  const item = S.items.find(i => i.id === n.id);
  const left = Game.heartsLeft();
  const refill = Game.heartsRefill().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `<div class="scr bg-day">
    <div class="body center">
      ${gap(36)}
      ${penny('back', 250, 'width:min(250px,30cqh);height:min(250px,30cqh)')}
      ${gap(12)}
      <h1 class="h1" style="font-size:36px;line-height:42px">−1 heart</h1>
      ${gap(10)}
      <p class="txt">Penny turned away for a bit. You used a heart, so your streak is safe, but hearts run out fast.</p>
      ${gap(24)}
      <div class="card center">${hearts(left, 30, 14)}${gap(12)}<div style="font-size:17px;font-weight:700;color:var(--title)">${heartsLeftText(left)}</div></div>
      ${gap(12)}
      <div class="row" style="width:100%">${statCard(Game.streak(), 'streak kept', 'flame')}${statCard(refill, 'hearts refill')}</div>
      ${gap(16)}
    </div>
    <div class="foot" style="padding-bottom:0">
      ${primaryBtn(`Continue to ${SHOPS[item.shop].name}`, `heart-continue|${item.id}`)}
      ${textBtn('Back to the den', 'to-den')}
    </div>
  </div>`;
};
ACTIONS['heart-continue'] = id => startBuyPause(S.items.find(i => i.id === id));

/** Short pause: only the 10-second countdown, then the item's page in the shop. */
function startBuyPause(item) {
  if (Game.isNight()) { go({ screen: 'block', shop: item.shop }); return; }
  go({ screen: 'pause', shop: item.shop, step: 'count', buying: true, itemId: item.id, openedAt: now(), startedAt: Date.now() });
}

ACTIONS['buy-continue'] = () => {
  const item = S.items.find(i => i.id === NAV.itemId);
  const t = Date.now();
  if (S.session) finishSession();
  S.session = {
    shop: item.shop, mode: 'buy', logIndex: -1, startedAt: t, endsAt: t + RULES.BUY_SESSION_MINUTES * MS_PER_MIN,
    checkInShown: true, warned: true, lastProduct: item.product || null,
  };
  saveState();
  go({ screen: 'shop', shop: item.shop, product: item.product && findProduct(item.shop, item.product) ? item.product : null });
};

/* =====================================================================
 * Night mode and the night shield block
 * ===================================================================== */
SCREENS.block = n => `<div class="scr bg-night">
    <div class="body center">
      <div class="grow"></div>
      ${penny('sleep', 260, 'width:min(260px,32cqh);height:min(260px,32cqh)')}
      ${gap(20)}
      <h1 class="h1" style="font-size:32px;line-height:38px">${esc(SHOPS[n.shop].name)} opens at ${RULES.NIGHT_TO}</h1>
      ${gap(10)}
      <p class="txt" style="font-size:17px;line-height:24px">Penny's asleep. So is the sale.</p>
      <div style="flex:1.2"></div>
    </div>
    <div class="foot">${primaryBtn('Close', 'block-close')}</div>
  </div>`;
ACTIONS['block-close'] = () => goHome();

function setNight(on) {
  S.night = on;
  S.nightSince = Date.now();
  saveState();
  // The shield just started: a running session ends and the shop closes.
  if (Game.isNight() && S.session) finishSession();
  if (!on && S.pendingReminder) {
    const id = S.pendingReminder;
    S.pendingReminder = null;
    saveState();
    showLockScreen(id, true);
  } else {
    render(false);
  }
  renderPanel();
  toast(on ? (S.shieldOn === false ? 'Night mode on. The night shield is off, so shops still open.' : 'Night mode on: it\'s 23:42 and your shops are closed.') : 'Night mode off', 3200);
}
ACTIONS['demo-night'] = () => { closeFab(); setNight(!S.night); };
ACTIONS['demo-48h'] = () => { closeFab(); fastForward(); };
