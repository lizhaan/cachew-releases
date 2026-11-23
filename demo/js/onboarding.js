/* First-run onboarding (design-v2/onboarding, the app's OnboardingScreens.kt):
 * Welcome → facts → About you → quiz (2 questions) → result → Meet Penny → How it works
 * → pick shops → night shield → savings goal → Den.
 * The app's "Set up Cachew" step (Android permissions) has nothing to do in a browser, so it's left out. */
'use strict';

const OB_STEPS = ['welcome', 'facts', 'about', 'quiz1', 'quiz2', 'result', 'penny', 'how', 'shops'];

ACTIONS['open-cachew'] = () => {
  if (!S.onboarded) startOnboarding();
  else go({ screen: 'app', tab: 'den' });
};
function startOnboarding() { go({ screen: 'ob', step: 'welcome' }); }
ACTIONS['me-intro'] = () => { S.onboarded = false; saveState(); startOnboarding(); };

function obNext() {
  const i = OB_STEPS.indexOf(NAV.step);
  if (i < OB_STEPS.length - 1) go({ screen: 'ob', step: OB_STEPS[i + 1] });
  else go({ screen: 'shield', onboarding: true });
}
function obBack() {
  const i = OB_STEPS.indexOf(NAV.step);
  if (i <= 0) goHome();
  else go({ screen: 'ob', step: OB_STEPS[i - 1] });
}
ACTIONS['ob-next'] = () => obNext();

function obProgress(done) {
  let h = '<div class="obprog">';
  for (let i = 0; i < 4; i++) h += `<i class="${i < done ? 'on' : ''}"></i>`;
  return h + '</div>';
}

/** Common layout: scrollable content and the main button pinned at the bottom. */
function obLayout(content, button, act = 'ob-next', enabled = true, secondary = '') {
  return `<div class="scr bg-day">
    <div class="body">${content}</div>
    <div class="foot" style="padding-bottom:${secondary ? 0 : 16}px">${gap(12)}${primaryBtn(button, act, !enabled, 'ob-btn')}${secondary}</div>
  </div>`;
}

const OB = {};
SCREENS.ob = n => OB[n.step](n);

/* ---- 01 Welcome ---- */
OB.welcome = () => obLayout(`<div class="center">
    ${gap(48)}
    ${penny('big_curl', 280, 'width:min(280px,34cqh);height:min(280px,34cqh)')}
    ${gap(16)}
    <h1 class="h1" style="font-size:48px;line-height:54px;font-weight:900">Cachew</h1>
    <p style="margin:0;font-size:19px;font-weight:700;color:var(--purple-text)">Saved is earned.</p>
    ${gap(14)}
    <p class="txt" style="font-size:16px">A 10-second pause before shopping apps. For anyone who sometimes buys on impulse.</p>
  </div>`, 'Start · 1-minute quiz');

/* ---- 02 Facts ---- */
const FACTS = [
  ['92%', 'of US shoppers have bought something on impulse', 'Capital One Shopping Research'],
  ['22%', 'of Americans say impulse buys seriously hit their finances in the past year', 'NerdWallet survey'],
  ['57%', 'fewer app openings after 6 weeks with a short pause before the app', 'PNAS study, 2023'],
];
OB.facts = () => obLayout(`${gap(20)}
    <div style="display:flex;align-items:center;gap:8px"><h1 class="h1 grow">Impulse buys happen to almost everyone</h1>${penny('love', 96)}</div>
    ${gap(10)}
    <p class="txt">Shops are designed to make you tap “buy”. It's not a flaw in you. Quick rewards are just hard to resist.</p>
    ${gap(16)}
    ${FACTS.map(([n, t, s]) => `<div class="card" style="display:flex;align-items:center;margin-bottom:12px">
      <span style="width:72px;flex:none;font-size:22px;font-weight:800;color:var(--gold)">${n}</span>
      <div><div style="font-size:15px;font-weight:700;line-height:21px;color:var(--title)">${t}</div><div class="txt" style="font-size:12px;line-height:17px">${s}</div></div>
    </div>`).join('')}
    <div class="card sel center">
      <div style="font-size:17px;font-weight:700;color:var(--title)">The good news: a pause works.</div>
      <p class="txt" style="font-size:14px;line-height:20px">Penny will pause with you, cheer every win and never judge.</p>
    </div>${gap(8)}`, 'Let\'s do it together');

/* ---- 03 About you (optional, stays on the phone) ---- */
const ABOUT = [
  ['age', 'Age', ['18–24', '25–34', '35–44', '45+'], false],
  ['gender', 'Gender', ['Woman', 'Man', 'Non-binary', 'Prefer not to say'], false],
  ['category', 'Where do you shop on impulse most?', ['Clothes', 'Beauty', 'Home', 'Gadgets', 'Food delivery'], true],
  ['source', 'How did you find Cachew?', ['TikTok', 'Instagram', 'Reddit', 'Friend', 'App store'], false],
];
OB.about = () => {
  const p = S.profile || {};
  return obLayout(`${gap(16)}${obProgress(1)}${gap(20)}
    <div class="label">A bit about you</div>${gap(6)}
    <h1 class="h1">So Penny knows you a little</h1>
    <p class="txt" style="font-size:14px">Optional. Stays on your phone.</p>
    ${ABOUT.map(([key, title, opts]) => `${gap(18)}<div style="font-size:16px;font-weight:700;color:var(--title)">${title}</div>${gap(8)}
      <div class="chips">${opts.map(o => `<button type="button" class="ochip${(p[key] || []).includes(o) ? ' sel' : ''}" data-act="about|${key}|${o}">${o}</button>`).join('')}</div>`).join('')}
    ${gap(12)}`, 'Continue', 'ob-next', true, textBtn('Skip', 'ob-next'));
};
ACTIONS.about = arg => {
  const [key, val] = arg.split('|');
  const multi = ABOUT.find(a => a[0] === key)[3];
  S.profile = S.profile || {};
  const cur = S.profile[key] || [];
  // Multi-choice: tap adds or removes; single choice: tap replaces.
  S.profile[key] = multi ? (cur.includes(val) ? cur.filter(v => v !== val) : cur.concat(val)) : [val];
  saveState();
  rerenderKeepScroll();
};

/** Redraw the screen after a tap without jumping back to the top. */
function rerenderKeepScroll() {
  const body = $('#screen .body');
  const scroll = body ? body.scrollTop : 0;
  render(false);
  const after = $('#screen .body');
  if (after) after.scrollTop = scroll;
}

/* ---- 04/05 Quiz ---- */
const QUIZ = {
  quiz1: { key: 'when', n: 1, q: 'When do impulse buys usually happen?', ids: ['late_night', 'bored', 'hard_day', 'payday'], labels: ['Late at night', 'When I\'m bored', 'After a hard day', 'Right after payday'] },
  quiz2: { key: 'spend', n: 2, q: 'Roughly how much goes to things you regret, per month?', ids: ['under_50', '50_150', '150_300', 'over_300'], labels: ['Under $50', '$50 – $150', '$150 – $300', 'More than $300'] },
};
const SPEND_PER_MONTH = { under_50: 25, '50_150': 100, '150_300': 225, over_300: 350 };

function quizStep(n) {
  const q = QUIZ[n.step];
  const picked = (S.profile || {})[q.key];
  return obLayout(`${gap(16)}${obProgress(q.n)}${gap(20)}
    <div class="label">Question ${q.n} of 2</div>${gap(6)}
    <h1 class="h1">${q.q}</h1>${gap(20)}
    ${q.ids.map((id, i) => `<button type="button" class="card${picked === id ? ' sel' : ''}" style="display:flex;align-items:center;margin-bottom:12px" data-act="quiz|${q.key}|${id}">
      <span class="grow" style="font-size:17px;font-weight:700;color:var(--title)">${q.labels[i]}</span>
      <span class="radio${picked === id ? ' on' : ''}">${picked === id ? '✓' : ''}</span></button>`).join('')}`,
  'Next', 'ob-next', !!picked);
}
OB.quiz1 = quizStep;
OB.quiz2 = quizStep;
ACTIONS.quiz = arg => {
  const [key, id] = arg.split('|');
  S.profile = S.profile || {};
  S.profile[key] = id;
  saveState();
  render(false);
};

/* ---- 06 Result ---- */
OB.result = () => {
  const p = S.profile || {};
  const yearly = (SPEND_PER_MONTH[p.spend] || 100) * 12;
  const whenIdx = Math.max(0, QUIZ.quiz1.ids.indexOf(p.when));
  const peak = { bored: 1, hard_day: 2, payday: 0 }[p.when] ?? 3;
  const hours = ['9 AM', '1 PM', '6 PM', '11 PM', '2 AM'];
  const low = [0.22, 0.3, 0.38, 0.33, 0.3];
  const mostly = ['Mostly late at night.', 'Mostly when you\'re bored.', 'Mostly after a hard day.', 'Mostly right after payday.'][whenIdx];
  return obLayout(`${gap(24)}
    <div class="label">Your result</div>${gap(6)}
    <h1 class="h1">Impulse buys cost you about <span style="color:var(--purple-light)">${money(yearly)}</span> a year</h1>
    ${gap(8)}<p class="txt">${mostly} That's the window Cachew will guard.</p>${gap(20)}
    <div class="card"><div class="hours">${hours.map((h, i) => `<div><span><i class="${i === peak ? 'peak' : ''}" style="height:${(i === peak ? 1 : low[i]) * 100}%"></i></span><b>${h}</b></div>`).join('')}</div></div>`,
  'Let\'s keep it');
};

/* ---- 07 Meet Penny ---- */
OB.penny = () => {
  const row = (ic, t, b) => `<div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:12px">${icon(ic, 24)}
    <div><div style="font-size:17px;font-weight:700;color:var(--title)">${t}</div><p class="txt" style="font-size:14px;line-height:20px">${b}</p></div></div>`;
  return obLayout(`<div class="center">${gap(24)}${penny('wave', 220, 'width:min(220px,27cqh);height:min(220px,27cqh)')}${gap(8)}
      <h1 class="h1" style="font-size:34px;line-height:40px">Meet Penny</h1>${gap(6)}
      <p class="txt">Every thing you save and every dollar you keep adds cashews to her winter stash.</p></div>${gap(20)}
    ${row('flame', 'Streaks', 'Days in a row without an impulse buy')}
    ${row('cashew', 'Cashews', 'Every dollar you keep fills Penny\'s winter stash')}
    ${row('heart', '3 hearts a month', 'For the times you really can\'t wait')}`, 'Hi, Penny');
};

/* ---- 08 How it works ---- */
OB.how = () => {
  const steps = [
    ['You open a shop', 'Penny steps in for 10 seconds. Breathe.'],
    ['Penny asks 2 quick questions', 'How you feel, and why you came. Then you pick a plan.'],
    ['Like something? Share it to Cachew', `It waits ${S.defaultWait} hours instead of going to the cart.`],
    ['Let it go, keep the money', 'Every $1 you keep = 1 cashew for Penny\'s winter stash.'],
  ];
  return obLayout(`${gap(20)}
    <div style="display:flex;align-items:center"><div class="grow"><div class="label">How it works</div>${gap(6)}<h1 class="h1">One pause. That's it.</h1></div>${penny('wave', 100)}</div>
    ${gap(18)}
    ${steps.map(([t, b], i) => `<div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
      <span class="stepno">${i + 1}</span><div><div style="font-size:16px;font-weight:700;color:var(--title)">${t}</div><p class="txt" style="font-size:14px;line-height:20px">${b}</p></div></div>`).join('')}
    <div class="card" style="display:flex;align-items:center;gap:10px">${icon('heart', 20)}<span class="grow" style="font-weight:700;color:var(--title)">Can't wait? Use a heart</span><span class="txt" style="font-size:14px">3 / month</span></div>
    ${gap(8)}`, 'Got it');
};

/* ---- 09 Pick shops (also Me → Shops with a pause) ---- */
// The app's recommended shops (data/ShopApps.kt). Only Shein, Amazon and Temu are "installed" on the demo phone.
const ALL_SHOPS = [
  ['amazon', 'Amazon', 'A', '#F59E0B'], ['shein', 'Shein', 'S', '#141826'], ['temu', 'Temu', 'T', '#F97316'],
  ['sephora', 'Sephora', 'S', '#222838'], ['etsy', 'Etsy', 'E', '#EA580C'], ['ebay', 'eBay', 'e', '#2563EB'],
  ['walmart', 'Walmart', 'W', '#0284C7'], ['zara', 'Zara', 'Z', '#3A4150'], ['rozetka', 'Rozetka', 'R', '#00A046'],
  ['prom', 'Prom', 'P', '#6C2BD9'], ['olx', 'OLX', 'O', '#0E5E66'],
];

OB.shops = () => shopsScreen(true);
SCREENS.shops = () => shopsScreen(false);
ACTIONS['me-shops'] = () => go({ screen: 'shops', back: { ...NAV } });

function shopsScreen(onboarding) {
  const sel = S.shops || [];
  const locked = Game.isNight();
  const tile = ([k, name, letter, color]) => {
    const installed = !!SHOPS[k];
    const on = sel.includes(k);
    const fade = !installed && !on ? 'opacity:.45' : '';
    return `<button type="button" class="tile shoptile${on ? ' sel' : ''}" data-act="pick-shop|${k}">
      <span class="letter" style="width:44px;height:44px;border-radius:12px;background:${color};font-size:20px;${fade}">${letter}</span>
      <span style="font-size:15px;line-height:19px;${fade}">${name}</span>${installed ? '' : '<small>not installed</small>'}</button>`;
  };
  const n = sel.length;
  return `<div class="scr bg-day">
    <div class="body">
      ${gap(16)}${onboarding ? obProgress(3) + gap(28) : gap(12)}
      <h1 class="h1">Where do impulse buys find you?</h1>${gap(10)}
      <p class="txt">Cachew only steps in on these apps.</p>
      ${locked ? `${gap(10)}<p style="margin:0;font-weight:600;color:var(--purple-text)">🔒 Night shield: until ${RULES.NIGHT_TO} you can add shops, not remove them.</p>` : ''}
      ${gap(20)}
      <div class="shopgrid">${ALL_SHOPS.map(tile).join('')}
        <button type="button" class="tile shoptile" data-act="other-app"><span class="letter" style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,.18);color:var(--purple-text);font-size:26px;font-weight:700">+</span><span style="font-size:15px">Other app</span></button>
      </div>${gap(16)}
    </div>
    <div class="foot" style="padding-top:12px">${primaryBtn(n ? `Continue · ${n} app${n === 1 ? '' : 's'}` : 'Pick at least one app', onboarding ? 'ob-next' : 'shops-done', !n)}</div>
  </div>`;
}

ACTIONS['pick-shop'] = k => {
  const sel = S.shops || [];
  if (sel.includes(k)) {
    if (Game.isNight()) { toast(`Night shield: until ${RULES.NIGHT_TO} you can add shops, not remove them.`, 3200); return; }
    S.shops = sel.filter(x => x !== k);
  } else {
    S.shops = sel.concat(k);
  }
  saveState();
  rerenderKeepScroll();
};
ACTIONS['other-app'] = () => toast('In the app this lists every app on your phone. The demo phone only has these shops.', 3500);
ACTIONS['shops-done'] = () => go(NAV.back || { screen: 'app', tab: 'me' });
