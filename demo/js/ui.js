/* Small building blocks shared by every screen (the app's ui/components). */
'use strict';

const $ = sel => document.querySelector(sel);

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function icon(name, size = 20) {
  return `<img class="ico" src="assets/icons/${name}.svg" width="${size}" height="${size}" alt="">`;
}

function penny(pose, size, extra = '') {
  return `<img class="penny" src="assets/penny/${pose}.png" style="width:${size}px;height:${size}px;${extra}" alt="">`;
}

/** Colored square with a letter (the app's TileIconBox). */
function letterTile(shopKey, size = 24) {
  const s = SHOPS[shopKey];
  return `<span class="letter" style="width:${size}px;height:${size}px;border-radius:${size * 0.28}px;background:${s.color};font-size:${size * 0.5}px">${s.letter}</span>`;
}

function primaryBtn(text, act, disabled = false, id = '') {
  return `<button type="button" class="btn"${id ? ` id="${id}"` : ''} data-act="${act}"${disabled ? ' disabled' : ''}>${esc(text)}</button>`;
}

function secondaryBtn(text, act, trailing = '', centered = false, disabled = false) {
  return `<button type="button" class="btn2${centered ? ' centered' : ''}" data-act="${act}"${disabled ? ' disabled' : ''}><span>${esc(text)}</span>${trailing}</button>`;
}

function textBtn(text, act) {
  return `<button type="button" class="text-btn" data-act="${act}">${esc(text)}</button>`;
}

function gap(px) { return `<div class="sp" style="height:${px}px"></div>`; }

function cashewTag(n, after = '', size = 18) {
  return `<span class="tag">+${n} ${icon('cashew', size)}${after ? ' ' + esc(after) : ''}</span>`;
}

/* ---------- Toast (Android-style) ---------- */
let toastTimer = 0;
function toast(text, ms = 2600) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

/* ---------- Bottom sheets on top of everything (check-in, share menu) ---------- */
function openSheet(html, onScrim) {
  const el = $('#sheet');
  el.innerHTML = `<div class="scrim" data-act="${onScrim || ''}"></div>${html}`;
  el.classList.add('on');
  if (typeof renderOverlays === 'function') renderOverlays();
}
function closeSheet() {
  const el = $('#sheet');
  if (!el.classList.contains('on')) return;
  el.innerHTML = '';
  el.classList.remove('on');
  if (typeof renderOverlays === 'function') renderOverlays();
}
function sheetOpen() { return $('#sheet').classList.contains('on'); }
