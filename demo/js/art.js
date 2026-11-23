/* Fake shops for the demo: their tiles on the home screen, catalogs and simple product drawings. */
'use strict';

// Tile colors and letters are the app's data/ShopApps.kt.
const SHOPS = {
  shein: { name: 'Shein', letter: 'S', color: '#141826', domain: 'shein.com', head: '#ffffff', headText: '#111', logo: 'SHEIN', tabs: ['For You', 'Women', 'Sale', 'Home'] },
  amazon: { name: 'Amazon', letter: 'A', color: '#F59E0B', domain: 'amazon.com', head: '#232f3e', headText: '#fff', logo: 'amazon', tabs: ['Deals', 'Home', 'Tech', 'Beauty'] },
  temu: { name: 'Temu', letter: 'T', color: '#F97316', domain: 'temu.com', head: '#fb7701', headText: '#fff', logo: 'TEMU', tabs: ['Recommended', 'Lightning', 'Home', 'Beauty'] },
};

// Drawings in a 100×100 box: [path(s), extra details]. Kept simple, like the mockups.
const SHAPES = {
  sweater: '<path d="M30 22 42 16Q50 23 58 16L70 22 84 40 73 47 68 41V84H32V41L27 47 16 40Z"/><path d="M32 60H68M32 68H68M32 76H68" stroke="rgba(255,255,255,.18)" stroke-width="2.5"/>',
  dress: '<path d="M42 12H58L59 30 74 86H26L41 30Z"/><path d="M41 30H59" stroke="rgba(255,255,255,.25)" stroke-width="2"/>',
  cardigan: '<path d="M30 20 42 15 50 30 58 15 70 20 84 70 75 73 68 44V82H32V44L25 73 16 70Z"/><path d="M50 30V82" stroke="rgba(255,255,255,.3)" stroke-width="2"/><circle cx="54" cy="44" r="1.8" fill="rgba(255,255,255,.5)"/><circle cx="54" cy="56" r="1.8" fill="rgba(255,255,255,.5)"/><circle cx="54" cy="68" r="1.8" fill="rgba(255,255,255,.5)"/>',
  skirt: '<path d="M33 30H67L79 78H21Z"/><path d="M33 36H67" stroke="rgba(255,255,255,.3)" stroke-width="2"/><path d="M50 36V78" stroke="rgba(255,255,255,.18)" stroke-width="2"/>',
  tank: '<path d="M39 14H44Q50 26 56 14H61L63 34 69 84H31L37 34Z"/>',
  loafers: '<path d="M14 64Q15 50 32 51L54 55Q76 57 84 67V73H14Z"/><path d="M14 73H84" stroke="rgba(0,0,0,.35)" stroke-width="5"/><path d="M40 55Q48 60 58 57" stroke="rgba(255,255,255,.35)" stroke-width="2.5" fill="none"/>',
  sneakers: '<path d="M12 66Q12 50 26 48L40 47Q52 56 66 57Q84 59 88 68V74H12Z"/><path d="M12 74H88" stroke="#fff" stroke-width="5"/><path d="M38 52 46 49M43 56 51 53M48 60 56 57" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>',
  gloss: '<rect x="30" y="38" width="16" height="44" rx="5"/><rect x="33" y="18" width="10" height="21" rx="3" fill="rgba(0,0,0,.35)"/><rect x="54" y="44" width="16" height="38" rx="5" opacity=".75"/><rect x="57" y="27" width="10" height="18" rx="3" fill="rgba(0,0,0,.35)"/>',
  phonecase: '<rect x="30" y="12" width="40" height="76" rx="10"/><rect x="36" y="18" width="14" height="18" rx="5" fill="rgba(0,0,0,.3)"/><circle cx="43" cy="23" r="3" fill="rgba(255,255,255,.4)"/><circle cx="43" cy="31" r="3" fill="rgba(255,255,255,.4)"/>',
  lamp: '<path d="M30 30H60L68 48H22Z"/><path d="M45 48 58 66" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="40" y="76" width="34" height="7" rx="3.5"/><path d="M58 66 57 77" stroke="currentColor" stroke-width="4"/>',
  headphones: '<path d="M22 60V50a28 28 0 0 1 56 0V60" fill="none" stroke="currentColor" stroke-width="6"/><rect x="16" y="56" width="16" height="26" rx="7"/><rect x="68" y="56" width="16" height="26" rx="7"/>',
  mug: '<path d="M26 34H64V74Q64 82 56 82H34Q26 82 26 74Z"/><path d="M64 44Q78 44 78 56T64 68" fill="none" stroke="currentColor" stroke-width="6"/>',
  tote: '<path d="M24 42H76L80 86H20Z"/><path d="M38 42V34a12 12 0 0 1 24 0V42" fill="none" stroke="currentColor" stroke-width="4"/>',
  fan: '<circle cx="50" cy="40" r="24" fill="none" stroke="currentColor" stroke-width="4"/><path d="M50 40C42 24 58 24 50 40ZM50 40C66 36 62 52 50 40ZM50 40C40 54 32 40 50 40Z"/><path d="M50 64V82M38 84H62" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>',
  organizer: '<rect x="18" y="42" width="64" height="36" rx="6"/><path d="M40 42V78M60 42V78" stroke="rgba(255,255,255,.3)" stroke-width="2"/><rect x="24" y="28" width="10" height="16" rx="3" opacity=".7"/><rect x="45" y="22" width="10" height="22" rx="3" opacity=".7"/><rect x="66" y="30" width="8" height="14" rx="3" opacity=".7"/>',
};

function artSvg(kind, bg, fg) {
  const [a, b] = bg;
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#${id})"/>
    <g transform="translate(14 14) scale(.72)" fill="${fg}" color="${fg}">${SHAPES[kind] || ''}</g></svg>`;
}

// Catalogs. Shein's second card is the sweater from design-v2/05.
const CATALOG = {
  shein: [
    { id: 'p-dress', title: 'Satin slip dress', price: 19.99, art: 'dress', bg: ['#f6d6e3', '#e7b5c9'], fg: '#b9577d' },
    { id: 'p-sweater', title: 'Chunky knit sweater · Cream', short: 'Chunky knit sweater', price: 64, was: 89, art: 'sweater', bg: ['#e8dcc4', '#b9a684'], fg: '#1f1f24' },
    { id: 'p-skirt', title: 'Denim mini skirt', price: 12.99, art: 'skirt', bg: ['#dbe6f4', '#b7cbe6'], fg: '#4c6f9c' },
    { id: 'p-cardigan', title: 'Cropped cardigan', price: 24.99, art: 'cardigan', bg: ['#dff0e4', '#b9dcc5'], fg: '#4d8a64' },
    { id: 'p-tank', title: 'Ribbed tank set', price: 15.99, art: 'tank', bg: ['#ece2f6', '#d2c0ea'], fg: '#7d5ba8' },
    { id: 'p-loafers', title: 'Platform loafers', price: 31.99, art: 'loafers', bg: ['#f7e2d6', '#e9bfa6'], fg: '#3b2a22' },
  ],
  amazon: [
    { id: 'p-headphones', title: 'Wireless headphones', price: 59.99, was: 79.99, art: 'headphones', bg: ['#e3e7ee', '#c4ccd9'], fg: '#2a3240' },
    { id: 'p-amz-lamp', title: 'LED desk lamp', price: 31, art: 'lamp', bg: ['#fdf0cf', '#f3d68c'], fg: '#7a5a12' },
    { id: 'p-mug', title: 'Ceramic mug set', price: 18.5, art: 'mug', bg: ['#f1e6dc', '#dcc5b0'], fg: '#8a5a3c' },
    { id: 'p-amz-case', title: 'Clear phone case', price: 12.99, art: 'phonecase', bg: ['#dff3ec', '#b4e0cf'], fg: '#2f8a69' },
    { id: 'p-tote', title: 'Canvas tote bag', price: 16.99, art: 'tote', bg: ['#efe9dd', '#d7ccb5'], fg: '#6b5d43' },
    { id: 'p-amz-sneakers', title: 'Running sneakers', price: 89, art: 'sneakers', bg: ['#dfe1fb', '#b3b8f5'], fg: '#4f57c9' },
  ],
  temu: [
    { id: 'p-fan', title: 'Mini desk fan', price: 9.49, was: 21.99, art: 'fan', bg: ['#e2f1fb', '#b8dcf3'], fg: '#2f7bb0' },
    { id: 'p-gloss', title: 'Lip gloss set · 6 pcs', short: 'Lip gloss set', price: 7.98, art: 'gloss', bg: ['#fbe0ea', '#f2b2c8'], fg: '#c2306a' },
    { id: 'p-organizer', title: 'Desk organizer', price: 11.29, art: 'organizer', bg: ['#e8f3df', '#c6e2b0'], fg: '#4f8a2c' },
    { id: 'p-temu-tote', title: 'Mesh beach bag', price: 6.99, art: 'tote', bg: ['#fff1d6', '#fbd99a'], fg: '#b57a12' },
    { id: 'p-temu-lamp', title: 'Moon night lamp', price: 13.49, art: 'lamp', bg: ['#ece6fb', '#cdc1f3'], fg: '#5b46a8' },
    { id: 'p-temu-loafers', title: 'Fluffy slippers', price: 8.99, art: 'loafers', bg: ['#f9e6e0', '#efc3b5'], fg: '#a2513a' },
  ],
};

// Art for seeded waiting-list items (they were "shared" before the demo started).
const ITEM_ART = {
  sneakers: { bg: ['#9fa6ff', '#6e78f0'], fg: '#eef0ff' },
  gloss: { bg: ['#f6a6c8', '#e2508d'], fg: '#fff0f6' },
  phonecase: { bg: ['#8fe0c0', '#2fa57b'], fg: '#eafff6' },
  lamp: { bg: ['#fbd56b', '#e79a20'], fg: '#fff8e6' },
};

function findProduct(shop, id) { return (CATALOG[shop] || []).find(p => p.id === id); }

/** Thumbnail of a waiting-list item: its product drawing, or a colored square with a letter. */
function itemArt(item) {
  if (item.product) {
    const p = findProduct(item.shop, item.product);
    if (p) return artSvg(p.art, p.bg, p.fg);
  }
  const a = ITEM_ART[item.art];
  if (a) return artSvg(item.art, a.bg, a.fg);
  const shop = SHOPS[item.shop];
  return `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="${shop ? shop.color : '#8B5CF6'}"/><text x="50" y="64" text-anchor="middle" font-size="44" font-weight="800" fill="#fff" font-family="Inter, sans-serif">${(item.title || '?').charAt(0).toUpperCase()}</text></svg>`;
}
