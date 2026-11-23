/* Screens of the demo and what their buttons do.
 * Stage 1: home screen → pause (10 s) → 2 questions → choice → shop session → Share → item card → Nice pause. */
'use strict';

let NAV = { screen: 'home' };
const SCREENS = {};     // screen name -> (nav) => html
const AFTER = {};       // screen name -> () => void, runs after the screen is drawn
const ACTIONS = {};     // data-act name -> (arg, el) => void
const INPUTS = {};      // data-input name -> (value) => void

function go(nav, animate = true) {
  NAV = nav;
  render(animate);
}

function render(animate = false) {
  const scr = $('#screen');
  scr.innerHTML = SCREENS[NAV.screen](NAV);
  if (animate && scr.firstElementChild) scr.firstElementChild.classList.add('enter');
  const shop = NAV.screen === 'shop' ? SHOPS[NAV.shop] : null;
  const light = shop && (NAV.product || shop.head === '#ffffff');
  $('#phone').className = light ? 'light-ui' : 'dark-ui';
  if (AFTER[NAV.screen]) AFTER[NAV.screen]();
  renderOverlays();
}

/* =====================================================================
 * Home screen of the phone
 * ===================================================================== */
const PROPS = [
  { name: 'Phone', bg: '#34C759', svg: '<path d="M7 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2z" fill="#fff"/>' },
  { name: 'Messages', bg: '#1A73E8', svg: '<path d="M4 5h16v11H9l-5 4z" fill="#fff"/>' },
  { name: 'Camera', bg: '#4b5563', svg: '<rect x="3" y="7" width="18" height="13" rx="3" fill="#fff"/><circle cx="12" cy="13.5" r="3.5" fill="#4b5563"/><rect x="8" y="4" width="8" height="4" rx="1.5" fill="#fff"/>' },
  { name: 'Browser', bg: '#f1f3f4', svg: '<circle cx="12" cy="12" r="9" fill="none" stroke="#1A73E8" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="#1A73E8" stroke-width="1.6"/>' },
];

SCREENS.home = () => {
  const t = new Date(now());
  const date = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][t.getDay()];
  const shopApp = k => `<button type="button" class="app${!S.triedPause && k === 'shein' ? ' pulse-dot' : ''}" data-act="open|${k}">
      <i style="background:${SHOPS[k].color}">${SHOPS[k].letter}</i><span>${SHOPS[k].name}</span></button>`;
  return `<div class="scr launcher">
    <div class="clock"><b id="ln-time">${displayTime()}</b><span>${date}, ${monthName(now())} ${t.getDate()}</span></div>
    ${S.triedPause ? '' : `<div class="hint">${penny('peek', 44)}<span>Open Shein, Amazon or Temu. Cachew pauses it before you shop.</span></div>`}
    <div class="grow"></div>
    <div class="apps">
      ${shopApp('shein')}${shopApp('amazon')}${shopApp('temu')}
      <button type="button" class="app" data-act="open-cachew"><i><img src="assets/icons/app_icon_512.png" alt=""></i><span>Cachew</span></button>
    </div>
    <div class="dock apps">
      ${PROPS.map(p => `<button type="button" class="app round" data-act="prop|${p.name}" aria-label="${p.name}"><i style="background:${p.bg}"><svg width="28" height="28" viewBox="0 0 24 24">${p.svg}</svg></i><span>${p.name}</span></button>`).join('')}
    </div>
  </div>`;
};

ACTIONS.prop = name => toast(`${name} isn't part of this demo. Try a shop.`);

/** Tap on a shop icon: night block, a running session, or a fresh pause. */
ACTIONS.open = shop => {
  // Not one of the "Shops with a pause": Cachew doesn't step in, the shop just opens.
  if (!(S.shops || []).includes(shop)) { go({ screen: 'shop', shop, product: null }); return; }
  // Night shield hours: the shop doesn't open at all.
  if (Game.isNight()) { go({ screen: 'block', shop }); return; }
  const s = S.session;
  if (s && s.shop === shop) {
    go({ screen: 'shop', shop, product: s.lastProduct || null });
    say('Like something? Tap me');
    return;
  }
  S.triedPause = true;
  saveState();
  go({ screen: 'pause', shop, step: 'count', openedAt: now(), startedAt: Date.now(), mood: null, specific: null });
};

/* =====================================================================
 * 13 Pause → 14 Questions → choice (always on the night background)
 * ===================================================================== */
const RING_R = 122, RING_LEN = 2 * Math.PI * RING_R;

SCREENS.pause = n => {
  if (n.step === 'quiz') return quizScreen(n);
  if (n.step === 'choice') return choiceScreen(n);
  const shop = SHOPS[n.shop];
  const elapsed = Math.min(RULES.PAUSE_SECONDS * 1000, Date.now() - n.startedAt);
  const done = elapsed >= RULES.PAUSE_SECONDS * 1000;
  return `<div class="scr bg-night">
    <div class="body center">
      ${gap(24)}
      <div class="pill">${letterTile(n.shop, 24)}${esc(shop.name)} · opened at ${hhmm(n.openedAt)}</div>
      <div style="flex:.6"></div>
      <div class="ring">
        <svg viewBox="0 0 272 272" aria-hidden="true">
          <defs>
            <radialGradient id="halo"><stop offset="0" stop-color="#8B5CF6" stop-opacity=".28"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient>
            <linearGradient id="arcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#C4B5FD"/></linearGradient>
          </defs>
          <circle cx="136" cy="136" r="136" fill="url(#halo)"/>
          <circle cx="136" cy="136" r="${RING_R}" fill="rgba(139,92,246,.16)"/>
          <circle cx="136" cy="136" r="${RING_R}" fill="none" stroke="rgba(139,92,246,.18)" stroke-width="9"/>
          <circle class="arc" cx="136" cy="136" r="${RING_R}" fill="none" stroke="url(#arcg)" stroke-width="9" stroke-linecap="round"
            transform="rotate(-90 136 136)" stroke-dasharray="${RING_LEN}" style="--len:${RING_LEN};animation-delay:-${elapsed}ms"/>
        </svg>
        ${penny('peek', 180, 'position:relative;width:66%;height:auto')}
      </div>
      ${gap(28)}
      <div class="count" id="count">${Math.ceil(RULES.PAUSE_SECONDS - elapsed / 1000)}</div>
      <h1 class="h1" style="font-size:32px;line-height:40px">Pause. Breathe.</h1>
      ${gap(12)}
      <p class="txt">${n.buying ? 'You waited for this one. One breath, then go get it.' : 'You\'re in a shop. Penny\'s got a couple of questions.'}</p>
      <div class="grow"></div>
    </div>
    <div class="foot">${n.buying ? primaryBtn('Continue to ' + shop.name, 'buy-continue', !done, 'answer') : primaryBtn('Answer Penny', 'pause-answer', !done, 'answer')}</div>
  </div>`;
};

/** Called by the main ticker while the countdown is on screen. */
function tickPause() {
  if (NAV.screen !== 'pause' || NAV.step !== 'count') return;
  const elapsed = Date.now() - NAV.startedAt;
  const left = Math.max(0, Math.ceil(RULES.PAUSE_SECONDS - elapsed / 1000));
  const c = $('#count');
  if (c && c.textContent !== String(left)) c.textContent = left;
  const b = $('#answer');
  if (b && left === 0 && b.disabled) b.disabled = false;
}

ACTIONS['pause-answer'] = () => go({ ...NAV, step: 'quiz' });

const MOODS = [['tired', '😴', 'Tired'], ['bored', '😐', 'Bored'], ['stressed', '😣', 'Stressed'], ['fine', '🙂', 'Fine']];

function quizScreen(n) {
  const shop = SHOPS[n.shop];
  const tile = ([k, e, label]) => `<button type="button" class="tile${n.mood === k ? ' sel' : ''}" style="height:108px" data-act="mood|${k}" data-group="mood" data-val="${k}">
      <span style="font-size:32px;line-height:1">${e}</span><span>${label}</span></button>`;
  const yes = (val, label) => `<button type="button" class="tile${n.specific === val ? ' sel' : ''}" style="height:72px" data-act="specific|${val}" data-group="specific" data-val="${val}">${label}</button>`;
  return `<div class="scr bg-night">
    <div class="body">
      ${gap(20)}
      <div style="display:flex;align-items:center"><span class="label grow">Pause · 2 questions</span><span class="txt" style="font-size:14px">${hhmm(n.openedAt)}</span></div>
      <div style="display:flex;align-items:flex-end;gap:4px">
        <h1 class="h1 grow" style="padding-top:12px">How are you feeling right now?</h1>${penny('question', 112)}
      </div>
      ${gap(24)}
      <div class="row">${tile(MOODS[0])}${tile(MOODS[1])}</div>${gap(12)}
      <div class="row">${tile(MOODS[2])}${tile(MOODS[3])}</div>
      ${gap(28)}
      <h2 class="h2">Did you open ${esc(shop.name)} for something specific, or just to scroll?</h2>
      ${gap(14)}
      <div class="row">${yes(true, 'Something specific')}${yes(false, 'Just scrolling')}</div>
      ${gap(16)}
    </div>
    <div class="foot">${primaryBtn('Continue', 'quiz-continue', n.mood == null || n.specific == null, 'quiz-go')}</div>
  </div>`;
}

/** Selecting a tile only toggles classes, so the scroll position stays put. */
function pickTile(group, val) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.toggle('sel', b.dataset.val === String(val)));
}
ACTIONS.mood = k => { NAV.mood = k; pickTile('mood', k); $('#quiz-go').disabled = NAV.specific == null; };
ACTIONS.specific = v => {
  NAV.specific = v === 'true';
  pickTile('specific', v);
  $('#quiz-go').disabled = NAV.mood == null;
};
ACTIONS['quiz-continue'] = () => go({ ...NAV, step: 'choice' });

function choiceScreen(n) {
  const shop = SHOPS[n.shop];
  const close = Game.closeRewardLeft() ? `<span class="tag">+${RULES.CASHEWS_PER_CLOSE} ${icon('cashew', 20)}</span>` : '';
  return `<div class="scr bg-night">
    <div class="body center">
      ${gap(24)}
      ${penny('calm', 170)}
      ${gap(16)}
      <h1 class="h1">${esc(Game.headline(n.mood, n.specific))}</h1>
      ${gap(10)}
      <p class="txt">${Game.isRisky(n.mood, n.specific) ? 'That\'s when most regret buys happen. What\'s the plan?' : 'Sounds planned. What\'s the plan?'}</p>
      ${gap(24)}
      <button type="button" class="card sel" data-act="choose|look">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="grow" style="font-size:18px;font-weight:700;line-height:23px;color:var(--title)">Just look, save, don't buy</span>
          <span class="tag">+${RULES.CASHEWS_PER_SAVED_ITEM} ${icon('cashew', 18)} <span style="font-weight:600">per saved item</span></span>
        </div>
        ${gap(4)}
        <p class="txt">${esc(shop.name)} opens for ${RULES.SESSION_MINUTES} min. Like something? Save it to Cachew, it waits ${S.defaultWait}h.</p>
      </button>
      ${gap(12)}
      <button type="button" class="card" data-act="choose|specific">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="grow" style="font-size:18px;font-weight:700;line-height:23px;color:var(--title)">I need something specific</span>
          <span class="tag" style="font-weight:600;color:var(--text2)">${RULES.SESSION_MINUTES} min</span>
        </div>
        ${gap(4)}
        <p class="txt">Get it and go. Penny waits in the corner and peeks in once.</p>
      </button>
      ${gap(12)}
      ${secondaryBtn('Close ' + shop.name, 'choose|close', close)}
      ${gap(16)}
    </div>
  </div>`;
}

ACTIONS.choose = what => {
  const entry = { at: NAV.openedAt, shop: NAV.shop, mood: NAV.mood, specific: NAV.specific, action: what, ms: 0 };
  if (what === 'close') {
    Game.logEntry(entry);
    const earned = Game.rewardClose();
    goHome();
    if (earned) toast(`+${earned} cashews for Penny's stash`);
    return;
  }
  const logIndex = Game.logEntry(entry);
  startSession(NAV.shop, what, logIndex);
};

/* =====================================================================
 * Shop session (design-v2/03, 04): pill with the timer, Penny's circle, check-in sheet
 * ===================================================================== */
const MS_PER_MIN = RULES.DEMO_MS_PER_MINUTE;
let bubble = null, bubbleTimer = 0, bounceNow = false;

function startSession(shop, mode, logIndex) {
  const t = Date.now();
  S.session = {
    shop, mode, logIndex, startedAt: t, endsAt: t + RULES.SESSION_MINUTES * MS_PER_MIN,
    checkInShown: false, warned: false, lastProduct: null,
  };
  saveState();
  go({ screen: 'shop', shop, product: null });
  say('Like something? Tap me');
}

function inSessionShop() {
  const s = S.session;
  return !!s && NAV.screen === 'shop' && NAV.shop === s.shop;
}

function pillText() {
  const s = S.session;
  const left = Math.max(0, Math.ceil((s.endsAt - Date.now()) / MS_PER_MIN * 60));
  const mode = { look: 'just looking', specific: 'specific', buy: 'buying' }[s.mode];
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left · ${mode}`;
}

function renderOverlays() {
  const el = $('#overlays');
  // Hidden under the share menu and the check-in sheet, as in design-v2/04 and 05.
  if (!inSessionShop() || sheetOpen()) { el.innerHTML = ''; return; }
  const withPenny = S.session.mode !== 'buy';
  el.innerHTML = `<div class="s-pill"><span>🐿</span><span id="pill-text">${pillText()}</span></div>
    ${withPenny ? `<div class="s-penny${bounceNow ? ' bounce' : ''}">
      ${bubble ? `<div class="s-bubble" data-act="penny-tap">${esc(bubble)}</div>` : ''}
      <button type="button" class="s-circle" data-act="penny-tap" aria-label="Penny"><img src="assets/penny/peek.png" alt=""></button>
    </div>` : ''}`;
  bounceNow = false;
}

/** Penny's speech bubble for a few seconds. */
function say(text, bounce = false) {
  bubble = text;
  bounceNow = bounce;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { bubble = null; renderOverlays(); }, RULES.BUBBLE_MS);
  renderOverlays();
}

ACTIONS['penny-tap'] = () => say('Tap Share → Cachew');

/** Main ticker hook: timer, 5-minute check-in, "2 minutes left", end of the session. */
function tickSession() {
  const s = S.session;
  if (!s) return;
  const t = Date.now();
  if (t >= s.endsAt) { finishSession(); return; }
  // A "Buy it" visit ends as soon as you leave the shop: next time it's a normal pause.
  if (s.mode === 'buy' && !inSessionShop()) { S.session = null; saveState(); renderOverlays(); return; }
  if (!inSessionShop()) return;
  const p = $('#pill-text');
  if (p) p.textContent = pillText();
  const elapsedMin = (t - s.startedAt) / MS_PER_MIN;
  if (s.mode === 'look' && !s.checkInShown && elapsedMin >= RULES.CHECK_IN_MINUTE && !sheetOpen()) {
    s.checkInShown = true;
    saveState();
    showCheckIn();
  }
  if (s.mode === 'specific' && !s.warned && (s.endsAt - t) / MS_PER_MIN <= RULES.SPECIFIC_WARNING_MINUTES_LEFT) {
    s.warned = true;
    saveState();
    say('2 minutes left', true);
  }
}

/** Time's up or "I'm done": log the length, clear the overlays, leave the shop if it's open. */
function finishSession() {
  const s = S.session;
  if (!s) return;
  if (S.log[s.logIndex]) S.log[s.logIndex].ms = Math.round((Math.min(Date.now(), s.endsAt) - s.startedAt) / MS_PER_MIN * 60e3);
  const wasInShop = inSessionShop();
  S.session = null;
  saveState();
  if (wasInShop) {
    closeSheet();
    goHome();
    if (s.mode === 'buy') toast('The shopping period has ended', 3500);
  } else {
    renderOverlays();
  }
}

function showCheckIn() {
  const shop = SHOPS[S.session.shop];
  openSheet(`<div class="bottom-sheet checkin">
    <div style="display:flex;align-items:center;gap:12px">
      ${penny('look', 96)}
      <div class="grow">
        <h2 class="h2">${RULES.CHECK_IN_MINUTE} minutes in. How's it going?</h2>
        ${gap(4)}
        <p class="txt" style="font-size:14px;line-height:20px">Just checking. You decide, Penny cheers.</p>
      </div>
    </div>
    ${gap(16)}
    <button type="button" class="card sel" data-act="ci-save">
      <div style="font-size:17px;font-weight:700;color:var(--title)">I found something → save it</div>
      ${gap(4)}
      <div class="txt" style="font-size:14px;display:flex;align-items:center;gap:4px">Share it to Cachew, it waits ${S.defaultWait}h · +${RULES.CASHEWS_PER_SAVED_ITEM} ${icon('cashew', 18)}</div>
    </button>
    ${gap(12)}
    ${secondaryBtn(`Still looking · ${RULES.SESSION_MINUTES - RULES.CHECK_IN_MINUTE} more min`, 'ci-more')}
    ${gap(12)}
    ${secondaryBtn(`I'm done · close ${shop.name}`, 'ci-done')}
  </div>`, '');
}

ACTIONS['ci-save'] = () => { closeSheet(); say('Tap Share → Cachew'); };
// The session keeps its original end time; "5 more min" is simply what is left.
ACTIONS['ci-more'] = () => closeSheet();
ACTIONS['ci-done'] = () => {
  const earned = Game.rewardClose();
  finishSession();
  if (earned) toast(`+${earned} cashews for Penny's stash`);
};

/* =====================================================================
 * Fake shop: feed and product page
 * ===================================================================== */
SCREENS.shop = n => (n.product ? productPage(n) : shopFeed(n));

function shopFeed(n) {
  const shop = SHOPS[n.shop];
  const items = CATALOG[n.shop].map(p => `<button type="button" class="prod" data-act="product|${p.id}">
      <div class="art">${artSvg(p.art, p.bg, p.fg)}</div>
      <div class="nm">${esc(p.short || p.title)}</div>
      <div class="pr">$${p.price.toFixed(2)}</div></button>`).join('');
  return `<div class="scr shop">
    <div class="shop-head" style="background:${shop.head};color:${shop.headText};margin-top:calc(-1 * var(--sb));padding-top:calc(var(--sb) + 10px)">
      <span class="shop-logo">${shop.logo}</span><span class="shop-search">Search ${esc(shop.name)}</span>
    </div>
    <div class="shop-tabs" style="background:#f7f7f7">${shop.tabs.map((t, i) => i ? `<span>${t}</span>` : `<b>${t}</b>`).join('')}</div>
    <div class="shop-body"><div class="shop-grid">${items}</div></div>
  </div>`;
}

let dealEndsAt = 0;
const SHARE_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';

function productPage(n) {
  const shop = SHOPS[n.shop];
  const p = findProduct(n.shop, n.product);
  if (dealEndsAt < Date.now() + 60e3) dealEndsAt = Date.now() + (2 * 3600 + 14 * 60 + 9) * 1000;
  const deal = p.was
    ? `<span class="pp-deal" id="deal">-${Math.round((1 - p.price / p.was) * 100)}% · ends in ${dealLeft()}</span>`
    : `<span class="pp-deal">🔥 ${200 + p.title.length * 7} sold today</span>`;
  return `<div class="scr shop" style="background:#fff">
    <div class="pp-top">
      <button type="button" data-act="sys:back" aria-label="Back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      <span style="font-weight:800;letter-spacing:1.5px">${shop.logo}</span>
      <button type="button" data-act="share-open" aria-label="Share">${SHARE_ICON}</button>
    </div>
    <div class="shop-body">
      <div class="pp-art">${artSvg(p.art, p.bg, p.fg)}</div>
      <div class="pp-info">
        <div class="pp-name">${esc(p.title)}</div>
        <div class="pp-price"><b>$${p.price.toFixed(2)}</b>${p.was ? `<s>$${p.was.toFixed(2)}</s>` : ''}${deal}</div>
      </div>
      <div class="pp-actions">
        <button type="button" class="pp-share" data-act="share-open">${SHARE_ICON} Share</button>
        <button type="button" class="pp-cart" data-act="cart">Add to cart</button>
      </div>
      <div class="pp-note">Free shipping on orders over $29 · Free returns within 30 days</div>
    </div>
  </div>`;
}

function dealLeft() {
  const left = Math.max(0, Math.floor((dealEndsAt - Date.now()) / 1000));
  const h = Math.floor(left / 3600), m = Math.floor(left / 60) % 60, s = left % 60;
  return [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
}
function tickDeal() {
  const d = $('#deal');
  if (d) d.textContent = d.textContent.replace(/\d\d:\d\d:\d\d/, dealLeft());
}

ACTIONS.product = id => {
  dealEndsAt = Date.now() + (2 * 3600 + 14 * 60 + 9) * 1000;
  if (S.session && S.session.shop === NAV.shop) { S.session.lastProduct = id; saveState(); }
  go({ screen: 'shop', shop: NAV.shop, product: id });
};

ACTIONS.cart = () => {
  if (inSessionShop() && S.session.mode !== 'buy') say('Tap Share → Cachew');
  toast('This is a demo shop: nothing is sold here.');
};

/* ---------- System "Share" menu (design-v2/05) ---------- */
ACTIONS['share-open'] = () => {
  const shop = SHOPS[NAV.shop];
  const p = findProduct(NAV.shop, NAV.product);
  const other = (name, bg, svg, border) => `<button type="button" class="ss-app" data-act="share-other|${name}">
      <i style="background:${bg}${border ? ';border:1px solid #ddd' : ''}">${svg}</i>${name}</button>`;
  openSheet(`<div class="bottom-sheet share-sheet">
    <div class="ss-item"><span class="thumb">${artSvg(p.art, p.bg, p.fg)}</span>
      <div><b>${esc(p.short || p.title)}</b><span>${shop.domain}</span></div></div>
    <div class="ss-apps">
      ${other('Messages', '#34C759', '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" fill="#fff"/></svg>')}
      <button type="button" class="ss-app cachew" data-act="share-cachew"><i><img src="assets/icons/app_icon_512.png" alt="" style="width:100%;height:100%"></i>Cachew</button>
      ${other('Telegram', '#2AABEE', '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 11.5 20 4l-3 16-5-4-3 3v-5l8-7-10 6z" fill="#fff"/></svg>')}
      ${other('Notes', '#fff', '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M6 7h12M6 11h12M6 15h8" stroke="#f4b63f" stroke-width="2" stroke-linecap="round"/></svg>', true)}
    </div>
    <div class="ss-cap">Share → <b>Cachew</b> puts it on the waiting list</div>
  </div>`, 'share-cancel');
};
ACTIONS['share-cancel'] = () => closeSheet();
ACTIONS['share-other'] = name => toast(`Only Cachew works in this demo, not ${name}.`);
ACTIONS['share-cachew'] = () => {
  closeSheet();
  go({ screen: 'share', shop: NAV.shop, product: NAV.product, hours: S.defaultWait, loading: true, name: '', price: '', back: { ...NAV } });
};

/* =====================================================================
 * 16 Into the waiting list (Cachew's own screen, opened by Share)
 * ===================================================================== */
let shareLoadTimer = 0;

SCREENS.share = n => {
  const shop = SHOPS[n.shop];
  const p = findProduct(n.shop, n.product);
  const thumb = n.loading
    ? '<span class="thumb skel" style="width:86px;height:86px;display:block"></span>'
    : `<span class="thumb" style="width:86px;height:86px">${artSvg(p.art, p.bg, p.fg)}</span>`;
  const hours = h => `<button type="button" class="tile${n.hours === h ? ' sel' : ''}" style="height:56px" data-act="wait|${h}" data-group="wait" data-val="${h}">${h}h</button>`;
  return `<div class="scr bg-night">
    <div class="body">
      ${gap(20)}
      <div class="label">Shared from ${esc(shop.name)}</div>
      ${gap(8)}
      <h1 class="h1">Into the waiting list</h1>
      ${gap(20)}
      <div class="card"><div style="display:flex;align-items:center;gap:14px">
        <span id="share-thumb">${thumb}</span>
        <div class="grow" style="min-width:0">
          ${n.loading ? '<div class="skel" id="name-skel" style="width:150px;height:20px;margin-bottom:-20px"></div>' : ''}
          <input class="field f-name" id="f-name" data-input="name" value="${esc(n.name)}" placeholder="${n.loading ? '' : 'e.g. Chunky knit sweater'}" autocomplete="off" enterkeyhint="next">
          ${gap(10)}
          <div style="display:flex;align-items:center;gap:2px"><span class="f-price">$</span>
            ${n.loading ? '<span class="skel" id="price-skel" style="width:80px;height:24px;display:block"></span>' : ''}
            <input class="field f-price" id="f-price" data-input="price" value="${esc(n.price)}" placeholder="Price (optional)" inputmode="decimal" autocomplete="off" enterkeyhint="done"${n.loading ? ' hidden' : ''}>
          </div>
        </div>
      </div></div>
      ${gap(20)}
      <div style="font-size:17px;font-weight:600;color:var(--text2)">Wait for</div>
      ${gap(10)}
      <div class="row">${RULES.WAIT_HOURS_OPTIONS.map(hours).join('')}</div>
      ${gap(12)}
      <div class="card"><p class="txt">Most late-night wants feel different after a day or two. If you still want it, it's yours.</p></div>
      ${gap(16)}
    </div>
    <div class="foot">${primaryBtn(`Wait ${n.hours} hours`, 'share-save', false, 'wait-btn')}</div>
  </div>`;
};

// Like the app, the card first shows a skeleton, then fills in from the product page.
AFTER.share = () => {
  if (!NAV.loading) return;
  clearTimeout(shareLoadTimer);
  const n = NAV;
  shareLoadTimer = setTimeout(() => {
    if (NAV !== n) return;
    const p = findProduct(n.shop, n.product);
    n.loading = false;
    if (!n.name) n.name = p.short || p.title;
    if (!n.price) n.price = String(p.price);
    $('#share-thumb').innerHTML = `<span class="thumb" style="width:86px;height:86px">${artSvg(p.art, p.bg, p.fg)}</span>`;
    const name = $('#f-name'), price = $('#f-price');
    name.value = n.name;
    name.placeholder = 'e.g. Chunky knit sweater';
    price.value = n.price;
    price.hidden = false;
    ['#name-skel', '#price-skel'].forEach(s => { const e = $(s); if (e) e.remove(); });
  }, 900);
};

INPUTS.name = v => { NAV.name = v; };
INPUTS.price = v => { NAV.price = v.replace(/[^\d.,\s]/g, ''); };
ACTIONS.wait = h => {
  NAV.hours = Number(h);
  pickTile('wait', h);
  $('#wait-btn').textContent = `Wait ${h} hours`;
};

function parsePrice(text) {
  const v = parseFloat(String(text).replace(/\s/g, '').replace(',', '.'));
  return v > 0 ? v : null;
}

ACTIONS['share-save'] = () => {
  const n = NAV;
  const shop = SHOPS[n.shop];
  const p = findProduct(n.shop, n.product);
  const item = {
    id: 'i-' + Date.now(), title: n.name.trim() || `Something from ${shop.name}`,
    price: n.loading ? p.price : parsePrice(n.price), shop: n.shop, product: n.product,
    addedAt: now(), waitH: n.hours, status: 'waiting',
  };
  const cashews = Game.addItem(item);
  go({ screen: 'reward', item, cashews, back: n.back });
};

/* =====================================================================
 * "Nice pause." (design-v2/06)
 * ===================================================================== */
SCREENS.reward = n => {
  const it = n.item;
  const streak = Game.streak();
  return `<div class="scr bg-night">
    <div class="body center">
      ${gap(28)}
      <div class="chip">${icon('cashew', 26)}+${n.cashews} cashews</div>
      ${gap(12)}
      ${penny('love2', 280, 'max-width:100%;width:min(280px,34cqh);height:min(280px,34cqh)')}
      ${gap(8)}
      <h1 class="h1" style="font-size:36px;line-height:42px">Nice pause.</h1>
      ${gap(10)}
      <p class="txt">${it.price != null ? `Penny's holding your ${money(it.price)} for ${it.waitH} hours.` : `Penny's holding it for ${it.waitH} hours.`}</p>
      ${gap(24)}
      <div class="card"><div style="display:flex;align-items:center;gap:12px">
        ${icon('flame', 24)}
        <span class="grow" style="font-size:17px;font-weight:700;color:var(--title)">${streak}-day streak</span>
        <span class="tag" style="font-size:16px;font-weight:700">+${n.cashews} ${icon('cashew', 20)} to the stash</span>
      </div></div>
      ${gap(16)}
    </div>
    <div class="foot">${primaryBtn(Game.isNight() ? 'Goodnight, Penny' : 'Thanks, Penny', 'reward-done')}</div>
  </div>`;
};

/** Back to the shop if the session is still running, otherwise the phone's home screen. */
ACTIONS['reward-done'] = () => {
  const back = NAV.back;
  if (back && S.session && S.session.shop === back.shop) {
    go(back);
  } else {
    goHome();
  }
};

/* =====================================================================
 * Phone buttons
 * ===================================================================== */
function goHome() {
  closeSheet();
  go({ screen: 'home' });
}

ACTIONS['sys:home'] = () => goHome();
ACTIONS['sys:recents'] = () => toast('Recent apps aren\'t part of this demo.');
ACTIONS['sys:back'] = () => {
  if (sheetOpen()) {
    if (!$('#sheet .checkin')) closeSheet();
    return; // the check-in sheet waits for an answer
  }
  switch (NAV.screen) {
    case 'pause':
      // Back on the pause goes to the phone's home screen, not into the shop.
      if (NAV.buying) { goHome(); break; }
      Game.logEntry({ at: NAV.openedAt, shop: NAV.shop, mood: NAV.mood, specific: NAV.specific, action: 'left', ms: 0 });
      goHome();
      break;
    case 'shop':
      if (NAV.product) {
        if (S.session && S.session.shop === NAV.shop) { S.session.lastProduct = null; saveState(); }
        go({ screen: 'shop', shop: NAV.shop, product: null });
      } else {
        goHome();
      }
      break;
    case 'share': go(NAV.back); break;
    case 'reward': ACTIONS['reward-done'](); break;
    case 'app': goHome(); break;
    case 'ob': obBack(); break;
    case 'shield': go(NAV.onboarding ? { screen: 'ob', step: 'shops' } : NAV.back || { screen: 'app', tab: 'den' }); break;
    case 'goal': case 'shops': go(NAV.back || { screen: 'app', tab: 'den' }); break;
    case 'lock': ACTIONS['lock-dismiss'](); break;
    case 'still': go({ screen: 'app', tab: 'waiting' }); break;
    case 'win': case 'bought': case 'heart': go({ screen: 'app', tab: 'den' }); break;
    case 'block': goHome(); break;
    default: break;
  }
};
