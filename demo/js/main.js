/* Boot: layout (full screen or a framed phone), the demo panel, clicks and the clock. */
'use strict';

/* ---------- Layout ---------- */
const FRAME_W = 390 + 24, FRAME_H = 844 + 24, PANEL_W = 300, PANEL_GAP = 40;

function layout() {
  const bannerH = $('#banner').offsetHeight;
  document.documentElement.style.setProperty('--banner-h', bannerH + 'px');
  const w = window.innerWidth, h = window.innerHeight - bannerH;
  const framed = w >= 700 && h >= 520;
  document.body.classList.toggle('framed', framed);
  document.body.classList.toggle('full', !framed);
  const dev = $('#device');
  if (framed) {
    const withPanel = w >= FRAME_W * 0.6 + PANEL_W + PANEL_GAP + 40;
    $('#panel').style.display = withPanel ? '' : 'none';
    const scale = Math.min(1, (h - 32) / FRAME_H, (w - (withPanel ? PANEL_W + PANEL_GAP : 0) - 32) / FRAME_W);
    dev.style.transform = `scale(${scale})`;
    dev.style.margin = `${-(1 - scale) * FRAME_H / 2}px ${-(1 - scale) * FRAME_W / 2}px`;
  } else {
    dev.style.transform = '';
    dev.style.margin = '';
  }
}

/* ---------- Demo controls: the side panel on wide screens, the "Demo" button on phones ---------- */
function demoControls() {
  return `
    <button type="button" class="demo-btn" data-act="demo-reset">↺ <span>Reset demo<small>Start over with the sample waiting list</small></span></button>`;
}

function renderPanel() {
  $('#panel').innerHTML = `
    <h2>Cachew, in your browser</h2>
    <p>Tap a shop on the phone. Cachew pauses it for 10 seconds, Penny asks two questions, and you pick a plan.</p>
    <p>Time runs faster here: a 10-minute shop visit takes 20 seconds.</p>
    ${demoControls()}`;
  $('#fab-menu').innerHTML = demoControls();
}

ACTIONS['demo-reset'] = () => {
  closeFab();
  resetState();
  closeSheet();
  go({ screen: 'home' });
  toast('Demo reset');
};

function closeFab() {
  $('#fab-menu').hidden = true;
  $('#fab').setAttribute('aria-expanded', 'false');
}

$('#fab').addEventListener('click', e => {
  e.stopPropagation();
  const menu = $('#fab-menu');
  menu.hidden = !menu.hidden;
  $('#fab').setAttribute('aria-expanded', String(!menu.hidden));
});

/* ---------- Clicks and typing ---------- */
document.addEventListener('click', e => {
  if (!$('#fab-menu').hidden && !e.target.closest('#fab-menu')) closeFab();
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || !el.dataset.act) return;
  const act = el.dataset.act;
  const i = act.indexOf('|');
  const name = i < 0 ? act : act.slice(0, i);
  const arg = i < 0 ? undefined : act.slice(i + 1);
  const fn = ACTIONS[name];
  if (fn) { e.preventDefault(); fn(arg, el); }
});

document.addEventListener('input', e => {
  const fn = INPUTS[e.target.dataset && e.target.dataset.input];
  if (fn) fn(e.target.value);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'f-name') { e.preventDefault(); $('#f-price').focus(); }
  else if (e.key === 'Enter' && e.target.id === 'f-price') { e.preventDefault(); e.target.blur(); }
});

/* ---------- Clock ---------- */
let lastMinute = '';
function tick() {
  tickPause();
  tickSession();
  tickDeal();
  const t = hhmm(now());
  if (t !== lastMinute) {
    lastMinute = t;
    $('#sb-time').textContent = t;
    const ln = $('#ln-time');
    if (ln) ln.textContent = t;
  }
}

/* ---------- Boot ---------- */
window.addEventListener('resize', layout);
layout();
renderPanel();
// A session that ended while the page was closed is simply over.
if (S.session && Date.now() >= S.session.endsAt) { S.session = null; saveState(); }
go({ screen: 'home' }, false);
setInterval(tick, 200);
