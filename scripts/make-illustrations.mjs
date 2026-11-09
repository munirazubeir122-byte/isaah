// Draws one linocut-style illustration per story and exports it for the web.
//
// Why illustrations instead of photos: a drawing of a place or an object can
// never reveal a real person's face, body, tattoo, clothing or location, and
// it does not carry the glossy "AI photo" look. Every scene here shows only
// landscapes and objects from the testimony, never people.
//
// The look comes from flat ink layers (like carved blocks printed one colour
// at a time), gouge marks, slightly wobbly edges and paper grain.
//
// Run with:  npm.cmd run illustrations
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../public/images');
const W = 1600;
const H = 1000;
const WIDTHS = { lg: 1400, sm: 720 };

// ---------- small drawing toolkit ----------

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => n.toFixed(1);

/** A hill or ridge line across the full width, filled down to the bottom. */
function ridge(r, y0, amp, { waves = 3, rough = 6, step = 16, x0 = 0, x1 = W, bottom = H } = {}) {
  const ph = [r() * 6, r() * 6, r() * 6];
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) {
    const y =
      y0 +
      amp * Math.sin((x / W) * Math.PI * waves * 0.5 + ph[0]) +
      amp * 0.45 * Math.sin((x / W) * Math.PI * waves * 1.7 + ph[1]) +
      amp * 0.2 * Math.sin((x / W) * Math.PI * waves * 4.3 + ph[2]) +
      (r() - 0.5) * rough;
    pts.push([Math.min(x, x1), y]);
  }
  return `M${x0},${bottom} ` + pts.map(([x, y]) => `L${f(x)},${f(y)}`).join(' ') + ` L${x1},${bottom} Z`;
}

/** Short horizontal gouge strokes, the way a lino cutter leaves marks. */
let clipId = 0;
function gouges(r, opts) {
  if (!opts.clip) return gougePath(r, opts);
  const [x, y, w, h] = opts.clip;
  const id = `c${clipId++}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${gougePath(r, opts)}</g>`;
}

function gougePath(r, { y0, y1, x0 = 0, x1 = W, gap = 14, len = [30, 140], wave = 3, color, width = 3, opacity = 0.5 }) {
  let d = '';
  for (let y = y0; y < y1; y += gap * (0.7 + r() * 0.6)) {
    let x = x0 - r() * 80;
    while (x < x1) {
      const L = len[0] + r() * (len[1] - len[0]);
      const yy = y + (r() - 0.5) * 4;
      d += `M${f(x)},${f(yy)} q${f(L / 2)},${f((r() - 0.5) * wave * 2)} ${f(L)},${f((r() - 0.5) * wave)} `;
      x += L + 10 + r() * 60;
    }
  }
  return `<path d="${d}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" fill="none" opacity="${opacity}"/>`;
}

/** Points along a curved, tapering leaf, returned as a closed polygon. */
function leaf(x, y, angle, length, width, droop, r, serrate = 0) {
  const left = [];
  const right = [];
  const n = 18;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x + dx * length * t;
    const py = y + dy * length * t + droop * t * t;
    // direction of the curve at t, for the perpendicular
    const tx = dx * length;
    const ty = dy * length + 2 * droop * t;
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    let w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.3);
    if (serrate && i % 2) w *= 1 + serrate * (0.6 + r() * 0.8);
    left.push([px + nx * w, py + ny * w]);
    right.push([px - nx * w * 0.6, py - ny * w * 0.6]);
  }
  const pts = [...left, ...right.reverse()];
  return 'M' + pts.map(([a, b]) => `${f(a)},${f(b)}`).join(' L') + ' Z';
}

function palm(r, x, y, h, color, lean = 0.15) {
  const topX = x + h * lean;
  const topY = y - h;
  let s = `<path d="M${x},${y} Q${f(x + h * lean * 0.2)},${f(y - h * 0.5)} ${f(topX)},${f(topY)}" stroke="${color}" stroke-width="${f(h * 0.045)}" fill="none" stroke-linecap="round"/>`;
  const fronds = 9;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI + (i / (fronds - 1)) * Math.PI + (r() - 0.5) * 0.3;
    const len = h * (0.38 + r() * 0.18);
    s += `<path d="${leaf(topX, topY, a, len, h * 0.035, h * (0.12 + r() * 0.12), r, 1.4)}" fill="${color}"/>`;
  }
  return s;
}

function acacia(r, x, y, s, color) {
  let d = '';
  // trunk splitting into a few branches
  const trunkTop = y - s * 0.45;
  d += `M${x},${y} L${f(x + s * 0.02)},${f(trunkTop)} `;
  for (let i = 0; i < 4; i++) {
    const ex = x + (i - 1.5) * s * 0.28 + (r() - 0.5) * s * 0.1;
    const ey = y - s * (0.75 + r() * 0.08);
    d += `M${f(x + s * 0.02)},${f(trunkTop)} Q${f((x + ex) / 2)},${f(trunkTop - s * 0.05)} ${f(ex)},${f(ey)} `;
  }
  let out = `<path d="${d}" stroke="${color}" stroke-width="${f(s * 0.035)}" fill="none" stroke-linecap="round"/>`;
  // flat umbrella canopy built from overlapping lumps
  const cy = y - s * 0.82;
  for (let i = 0; i < 9; i++) {
    const cx = x + (i / 8 - 0.5) * s * 1.25;
    const ry = s * (0.06 + r() * 0.05);
    const rx = s * (0.14 + r() * 0.08);
    out += `<ellipse cx="${f(cx)}" cy="${f(cy + (r() - 0.6) * s * 0.06)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}"/>`;
  }
  return out;
}

/** A rounded rainforest crown made of overlapping lumps. */
function crown(r, x, y, s, color, trunk = true) {
  let out = trunk
    ? `<path d="M${x},${y} L${f(x + (r() - 0.5) * s * 0.1)},${f(y - s * 0.7)}" stroke="${color}" stroke-width="${f(s * 0.06)}"/>`
    : '';
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * s * 0.28;
    out += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y - s * 0.75 + Math.sin(a) * d * 0.6)}" r="${f(s * (0.16 + r() * 0.12))}" fill="${color}"/>`;
  }
  return out;
}

function mangrove(r, x, y, s, color) {
  let roots = '';
  const base = y - s * 0.35;
  for (let i = 0; i < 7; i++) {
    const ex = x + (i - 3) * s * 0.11 + (r() - 0.5) * s * 0.05;
    roots += `M${f(x + (r() - 0.5) * s * 0.04)},${f(base)} Q${f((x + ex) / 2 + (ex - x) * 0.4)},${f(base - s * 0.02)} ${f(ex)},${f(y)} `;
  }
  let out = `<path d="${roots}" stroke="${color}" stroke-width="${f(s * 0.022)}" fill="none" stroke-linecap="round"/>`;
  out += `<path d="M${x},${f(base)} L${f(x + s * 0.02)},${f(y - s * 0.7)}" stroke="${color}" stroke-width="${f(s * 0.04)}"/>`;
  for (let i = 0; i < 10; i++) {
    out += `<ellipse cx="${f(x + (r() - 0.5) * s * 0.9)}" cy="${f(y - s * (0.72 + r() * 0.2))}" rx="${f(s * (0.12 + r() * 0.1))}" ry="${f(s * (0.07 + r() * 0.05))}" fill="${color}"/>`;
  }
  return out;
}

/** The SVG wrapper: ink-edge wobble filter so nothing looks machine-perfect. */
function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <filter id="ink" x="-2%" y="-2%" width="104%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs>
<g filter="url(#ink)">${body}</g>
</svg>`;
}

// ---------- the four scenes ----------

// ep-01 Cabo Delgado: dusk on the Nampula coast. A beached fishing boat and a
// mended net drying on poles (where the narrator works now); faint smoke over
// the far coast for the villages that burned.
function coast() {
  const r = rng(101);
  const ink = '#14201b';
  let b = '';
  // banded dusk sky
  const bands = ['#f0c27a', '#e7a75c', '#d98848', '#c46a3a'];
  bands.forEach((c, i) => (b += `<rect x="0" y="${i * 120}" width="${W}" height="${H}" fill="${c}"/>`));
  b += gouges(r, { y0: 20, y1: 470, color: '#f6d9a0', opacity: 0.35, gap: 22 });
  b += `<circle cx="1120" cy="430" r="88" fill="#f7e2b2"/>`;
  // distant smoke columns
  for (const sx of [300, 360, 1420]) {
    let d = '';
    for (let i = 0; i < 9; i++) {
      d += `<ellipse cx="${f(sx + Math.sin(i * 0.9) * 22 + i * 9)}" cy="${f(470 - i * 34)}" rx="${f(18 + i * 5)}" ry="${f(12 + i * 3)}" fill="#8d6a55" opacity="${f(0.55 - i * 0.05)}"/>`;
    }
    b += d;
  }
  // far headland and sea
  b += `<path d="${ridge(r, 480, 14, { waves: 2, x1: 700 })}" fill="#6b5a4c"/>`;
  b += `<path d="${ridge(r, 488, 10, { waves: 2, x0: 1250 })}" fill="#6b5a4c"/>`;
  b += `<rect x="0" y="500" width="${W}" height="${H}" fill="#1f3b3a"/>`;
  b += gouges(r, { y0: 512, y1: 650, color: '#e7a75c', opacity: 0.55, gap: 12, len: [20, 90], width: 2.5 });
  b += gouges(r, { y0: 520, y1: 640, x0: 1000, x1: 1250, color: '#f7e2b2', opacity: 0.8, gap: 9, len: [20, 70] });
  // beach
  b += `<path d="${ridge(r, 690, 26, { waves: 1.2 })}" fill="#c99a5b"/>`;
  b += gouges(r, { y0: 720, y1: H, color: '#a87d45', opacity: 0.7, gap: 16, len: [40, 160] });
  // palms
  b += palm(r, 120, 760, 470, ink, 0.12);
  b += palm(r, 250, 735, 340, ink, -0.08);
  b += palm(r, 1500, 770, 420, ink, -0.14);
  // a fishing net drying over a rope between two leaning poles: it hangs in
  // uneven folds, its bottom edge ragged, with cork floats along the top
  const p1 = [770, 860];
  const p2 = [1230, 850];
  const t1 = [748, 560];
  const t2 = [1256, 590];
  b += `<path d="M${p1[0]},${p1[1]} L${t1[0]},${t1[1]} M${p2[0]},${p2[1]} L${t2[0]},${t2[1]}" stroke="${ink}" stroke-width="13" stroke-linecap="round"/>`;
  const rope = (t) => [t1[0] + (t2[0] - t1[0]) * t, t1[1] + (t2[1] - t1[1]) * t + Math.sin(Math.PI * t) * 90];
  const strands = 34;
  const drop = [];
  for (let i = 0; i <= strands; i++) drop.push(120 + Math.sin(i * 0.55) * 45 + Math.sin(i * 1.9) * 20 + r() * 25);
  let net = '';
  for (let i = 0; i <= strands; i++) {
    const [x, y] = rope(i / strands);
    net += `M${f(x)},${f(y)} q${f((r() - 0.5) * 14)},${f(drop[i] / 2)} ${f((r() - 0.5) * 10)},${f(drop[i])} `;
  }
  for (let k = 1; k <= 7; k++) {
    let started = false;
    for (let i = 0; i <= strands; i++) {
      const [x, y] = rope(i / strands);
      const dy = k * 19;
      if (dy > drop[i]) { started = false; continue; }
      net += `${started ? 'L' : 'M'}${f(x + (r() - 0.5) * 4)},${f(y + dy + (r() - 0.5) * 5)} `;
      started = true;
    }
  }
  b += `<path d="${net}" stroke="${ink}" stroke-width="2.2" fill="none" opacity="0.85"/>`;
  let ropeD = `M${t1[0]},${t1[1]} `;
  for (let i = 1; i <= 20; i++) { const [x, y] = rope(i / 20); ropeD += `L${f(x)},${f(y)} `; }
  b += `<path d="${ropeD}" stroke="${ink}" stroke-width="6" fill="none"/>`;
  for (let i = 2; i < strands; i += 4) {
    const [x, y] = rope(i / strands);
    b += `<ellipse cx="${f(x)}" cy="${f(y + 4)}" rx="11" ry="8" fill="#c46a3a"/>`;
  }
  // a heap of net piled on the sand under it
  b += `<path d="M880,880 Q900,830 960,838 Q1010,815 1060,840 Q1120,835 1130,880 Z" fill="${ink}" opacity="0.92"/>`;
  b += `<ellipse cx="630" cy="962" rx="320" ry="16" fill="#7e5c33" opacity="0.6"/>`;
  // beached boat
  b += `<path d="M330,880 Q360,950 520,960 L820,955 Q900,940 930,880 Z" fill="${ink}"/>`;
  b += `<path d="M350,885 L915,880" stroke="#c46a3a" stroke-width="7"/>`;
  b += `<path d="M600,880 L612,650" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`;
  b += gouges(r, { y0: 965, y1: H, color: '#7e5c33', opacity: 0.6, gap: 10 });
  return svg(b);
}

// ep-02 Eastleigh to the Shabelle: the road out of the city. The skyline
// shrinks behind a lone minibus heading into dry bush; a schoolbook lies open
// on the verge, the university plan left behind.
function road() {
  const r = rng(202);
  const ink = '#1d1a16';
  let b = '';
  ['#efe4c6', '#ead6a8', '#e2c287'].forEach((c, i) => (b += `<rect x="0" y="${i * 150}" width="${W}" height="${H}" fill="${c}"/>`));
  b += `<circle cx="1230" cy="250" r="120" fill="#d4af37"/>`;
  b += gouges(r, { y0: 40, y1: 520, color: '#f7efd8', opacity: 0.6, gap: 26 });
  // city skyline far left, hazy
  let city = '';
  let x = 30;
  while (x < 520) {
    const w = 28 + r() * 46;
    const h = 40 + r() * 120 * (1 - x / 640);
    city += `<rect x="${f(x)}" y="${f(540 - h)}" width="${f(w)}" height="${f(h + 10)}" fill="#b49d78"/>`;
    if (r() > 0.7) city += `<rect x="${f(x + w / 2 - 2)}" y="${f(540 - h - 30)}" width="4" height="30" fill="#b49d78"/>`;
    x += w + 2 + r() * 8;
  }
  b += city;
  // land layers
  b += `<path d="${ridge(r, 540, 6, { waves: 1 })}" fill="#c99b5e"/>`;
  b += `<path d="${ridge(r, 600, 12, { waves: 1.5 })}" fill="#b9864a"/>`;
  b += gouges(r, { y0: 620, y1: H, color: '#9a6b37', opacity: 0.7, gap: 15, len: [30, 120] });
  // road in perspective to a vanishing point
  const vx = 640;
  const vy = 548;
  b += `<path d="M${vx - 6},${vy} L${vx + 6},${vy} L1180,${H} L120,${H} Z" fill="#4a3b2c"/>`;
  b += `<path d="M${vx},${vy} L650,${H}" stroke="#e2c287" stroke-width="10" stroke-dasharray="40 60" opacity="0.9"/>`;
  b += gouges(r, { y0: 700, y1: H, x0: 250, x1: 1050, color: '#2c231a', opacity: 0.45, gap: 18, len: [20, 70] });
  // minibus, small, on the road
  b += `<g transform="translate(700,610)">
    <rect x="-46" y="-34" width="92" height="40" rx="10" fill="${ink}"/>
    <rect x="-38" y="-27" width="18" height="12" fill="#e2c287"/><rect x="-16" y="-27" width="18" height="12" fill="#e2c287"/><rect x="6" y="-27" width="18" height="12" fill="#e2c287"/>
    <circle cx="-26" cy="8" r="8" fill="${ink}"/><circle cx="26" cy="8" r="8" fill="${ink}"/>
    <path d="M-40,16 Q0,24 46,14" stroke="#d4af37" stroke-width="3" fill="none" opacity="0.6"/>
  </g>`;
  // dust trail
  for (let i = 0; i < 7; i++) {
    b += `<ellipse cx="${f(680 - i * 4)}" cy="${f(600 - i * 14)}" rx="${f(26 + i * 8)}" ry="${f(10 + i * 3)}" fill="#e2c287" opacity="${f(0.5 - i * 0.06)}"/>`;
  }
  // acacias
  b += acacia(r, 1080, 600, 260, ink);
  b += acacia(r, 1420, 640, 380, ink);
  b += acacia(r, 230, 590, 150, ink);
  // open book on the verge, front right
  b += `<g transform="translate(1290,900) rotate(-8)">
    <path d="M-160,0 Q-80,-30 0,-8 Q80,-30 160,0 L160,40 Q80,12 0,34 Q-80,12 -160,40 Z" fill="#f2ead6"/>
    <path d="M0,-8 L0,34" stroke="${ink}" stroke-width="4"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M-140,${f(6 + i * 6)} Q-80,${f(-14 + i * 6)} -20,${f(2 + i * 6)} M20,${f(2 + i * 6)} Q80,${f(-14 + i * 6)} 140,${f(6 + i * 6)}" stroke="#8a7a60" stroke-width="2" fill="none"/>`).join('')}
    <path d="M-160,40 Q-80,12 0,34 Q80,12 160,40 L160,52 Q80,26 0,46 Q-80,26 -160,52 Z" fill="${ink}"/>
  </g>`;
  // dry grass tufts
  let grass = '';
  for (let i = 0; i < 70; i++) {
    const gx = r() * W;
    const gy = 640 + r() * 360;
    if (gx > 180 + (gy - 548) * -0.9 + 300 && gx < 1100 + (gy - 548) * 0.6 - 300) continue; // keep off the road
    const s = 10 + (gy - 600) * 0.08;
    for (let k = 0; k < 5; k++) grass += `M${f(gx)},${f(gy)} l${f((k - 2) * s * 0.4 + (r() - 0.5) * 4)},${f(-s * (0.8 + r()))} `;
  }
  b += `<path d="${grass}" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  return svg(b);
}

// ep-03 Beni forests: misty mountain ridges under thick forest, and in front a
// dying camp fire with a dented cooking pot and an empty tin cup.
function forest() {
  const r = rng(303);
  let b = '';
  ['#d7ddcb', '#c9d3bf', '#bccab2'].forEach((c, i) => (b += `<rect x="0" y="${i * 140}" width="${W}" height="${H}" fill="${c}"/>`));
  b += gouges(r, { y0: 30, y1: 400, color: '#eef1e6', opacity: 0.6, gap: 24 });
  const layers = [
    [300, 60, '#9fb29a'],
    [400, 50, '#7d977c'],
    [500, 44, '#5b7a5f'],
    [610, 36, '#3c5a45'],
  ];
  layers.forEach(([y, amp, c], i) => {
    b += `<path d="${ridge(r, y, amp, { waves: 2.5 + i })}" fill="${c}"/>`;
    // tree crowns along each ridge for forest texture
    for (let x = -20; x < W + 40; x += 26 + i * 10) {
      const yy = y + amp * 0.2 + (r() - 0.5) * amp;
      b += `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(14 + i * 7 + r() * 8)}" fill="${c}"/>`;
    }
    // mist band
    b += `<rect x="0" y="${y + 40}" width="${W}" height="${30 + i * 6}" fill="#e3e8db" opacity="${0.35 - i * 0.06}"/>`;
  });
  // foreground forest floor
  b += `<path d="${ridge(r, 760, 20, { waves: 1.4 })}" fill="#1c2e23"/>`;
  b += gouges(r, { y0: 780, y1: H, color: '#3c5a45', opacity: 0.8, gap: 14, len: [30, 110] });
  // big foreground trees framing the scene
  b += crown(r, 90, 900, 700, '#0f1c15');
  b += crown(r, 1540, 920, 760, '#0f1c15');
  b += `<rect x="60" y="300" width="60" height="700" fill="#0f1c15"/><rect x="1500" y="260" width="70" height="740" fill="#0f1c15"/>`;
  // broad leaves in the foreground corners
  for (let i = 0; i < 8; i++) {
    b += `<path d="${leaf(0, 980 - i * 30, -0.9 + i * 0.18, 220 + r() * 80, 34, 60, r)}" fill="#0b1510"/>`;
    b += `<path d="${leaf(W, 990 - i * 28, Math.PI + 0.9 - i * 0.18, 220 + r() * 80, 34, 60, r)}" fill="#0b1510"/>`;
  }
  // camp fire
  const cx = 800;
  const cy = 870;
  b += `<ellipse cx="${cx}" cy="${cy + 20}" rx="190" ry="34" fill="#e0a43a" opacity="0.18"/>`;
  b += `<path d="M${cx - 120},${cy + 22} L${cx + 110},${cy - 6} M${cx - 110},${cy - 4} L${cx + 120},${cy + 24}" stroke="#2a1d14" stroke-width="22" stroke-linecap="round"/>`;
  b += `<path d="M${cx - 60},${cy} Q${cx - 70},${cy - 70} ${cx - 10},${cy - 140} Q${cx - 5},${cy - 80} ${cx + 30},${cy - 100} Q${cx + 60},${cy - 40} ${cx + 50},${cy} Z" fill="#d9822b"/>`;
  b += `<path d="M${cx - 30},${cy} Q${cx - 34},${cy - 50} ${cx},${cy - 92} Q${cx + 10},${cy - 50} ${cx + 28},${cy} Z" fill="#f2c45a"/>`;
  // smoke
  for (let i = 0; i < 8; i++) {
    b += `<ellipse cx="${f(cx + 10 + Math.sin(i) * 26 + i * 6)}" cy="${f(cy - 170 - i * 46)}" rx="${f(20 + i * 7)}" ry="${f(14 + i * 4)}" fill="#c9d3bf" opacity="${f(0.45 - i * 0.05)}"/>`;
  }
  // dented pot and tin cup
  b += `<path d="M${cx + 190},${cy + 30} L${cx + 200},${cy - 40} L${cx + 330},${cy - 40} L${cx + 338},${cy + 30} Q${cx + 265},${cy + 52} ${cx + 190},${cy + 30} Z" fill="#2a2f2b"/>`;
  b += `<path d="M${cx + 196},${cy - 40} L${cx + 334},${cy - 40}" stroke="#7f8a83" stroke-width="6"/>`;
  b += `<path d="M${cx + 260},${cy - 12} q12,10 26,-2" stroke="#7f8a83" stroke-width="3" fill="none"/>`;
  b += `<g transform="translate(${cx - 300},${cy + 18}) rotate(80)">
    <path d="M-30,-34 L30,-34 L26,30 L-26,30 Z" fill="#6f7a73"/>
    <ellipse cx="0" cy="-34" rx="30" ry="8" fill="#a8b2ab"/>
    <path d="M30,-20 q24,4 22,22 q-2,14 -24,14" stroke="#6f7a73" stroke-width="7" fill="none"/>
  </g>`;
  return svg(b);
}

// ep-04 Tanga coastline: night in the mangroves. A small boat with a single
// lantern waits among the roots, its light on the black water.
function mangroves() {
  const r = rng(404);
  let b = '';
  ['#0e1d2c', '#13263a', '#183049'].forEach((c, i) => (b += `<rect x="0" y="${i * 150}" width="${W}" height="${H}" fill="${c}"/>`));
  // stars
  for (let i = 0; i < 90; i++) {
    b += `<circle cx="${f(r() * W)}" cy="${f(r() * 430)}" r="${f(0.8 + r() * 2.2)}" fill="#e9e1c8" opacity="${f(0.4 + r() * 0.6)}"/>`;
  }
  // crescent moon
  b += `<circle cx="1010" cy="150" r="66" fill="#efe3c2"/><circle cx="1040" cy="132" r="60" fill="#0e1d2c"/>`;
  b += gouges(r, { y0: 30, y1: 430, color: '#244061', opacity: 0.55, gap: 24 });
  // far mangrove line
  b += `<path d="${ridge(r, 520, 18, { waves: 4, rough: 14, step: 10 })}" fill="#0a1a19"/>`;
  // water
  b += `<rect x="0" y="560" width="${W}" height="${H}" fill="#0b1724"/>`;
  b += gouges(r, { y0: 575, y1: H, color: '#1f3a55', opacity: 0.8, gap: 13, len: [30, 140], width: 2.5 });
  // moon reflection
  b += gouges(r, { y0: 580, y1: 800, x0: 950, x1: 1090, color: '#efe3c2', opacity: 0.55, gap: 11, len: [16, 60] });
  // mangroves both sides
  const ink = '#050e0c';
  b += mangrove(r, 120, 700, 620, ink);
  b += mangrove(r, 330, 660, 430, ink);
  b += mangrove(r, 1450, 720, 640, ink);
  b += mangrove(r, 1250, 640, 300, ink);
  // boat with lantern
  const bx = 760;
  const by = 760;
  b += `<ellipse cx="${bx}" cy="${by + 40}" rx="280" ry="40" fill="#f2b84b" opacity="0.12"/>`;
  b += gouges(r, { y0: by + 30, y1: by + 140, x0: bx - 120, x1: bx + 140, color: '#f2b84b', opacity: 0.55, gap: 12, len: [14, 50] });
  b += `<path d="M${bx - 230},${by - 10} Q${bx - 200},${by + 40} ${bx - 80},${by + 44} L${bx + 150},${by + 40} Q${bx + 230},${by + 20} ${bx + 250},${by - 24} Z" fill="${ink}"/>`;
  b += `<path d="M${bx - 222},${by - 8} L${bx + 246},${by - 22}" stroke="#1f3a55" stroke-width="5"/>`;
  b += `<path d="M${bx + 60},${by - 18} L${bx + 70},${by - 150}" stroke="${ink}" stroke-width="7"/>`;
  b += `<path d="M${bx + 70},${by - 150} q30,0 30,24" stroke="${ink}" stroke-width="4" fill="none"/>`;
  b += `<circle cx="${bx + 100}" cy="${by - 108}" r="60" fill="#f2b84b" opacity="0.18"/>`;
  b += `<rect x="${bx + 88}" y="${by - 126}" width="24" height="34" rx="5" fill="#f2b84b"/>`;
  b += `<path d="M${bx + 86},${by - 126} L${bx + 114},${by - 126} M${bx + 86},${by - 92} L${bx + 114},${by - 92}" stroke="${ink}" stroke-width="4"/>`;
  // a pole stuck in the mud
  b += `<path d="M${bx - 320},${by + 120} L${bx - 270},${by - 260}" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>`;
  return svg(b);
}

// ---------- site-wide scenes (dark, subject kept right of centre because the
// pages lay a dark gradient over the left side for the headline text) ----------

/** Wooden table top with carved grain, from y to the bottom. */
function table(r, y, top = '#3b2a1c', grain = '#5a4128') {
  return (
    `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${top}"/>` +
    `<rect x="0" y="${y}" width="${W}" height="14" fill="${grain}"/>` +
    gouges(r, { y0: y + 30, y1: H, color: grain, opacity: 0.75, gap: 15, len: [60, 260], wave: 4 })
  );
}

function wall(r, base = '#121c17', line = '#1b4332') {
  let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="${base}"/>`;
  s += gouges(r, { y0: 20, y1: H, color: line, opacity: 0.5, gap: 30, len: [80, 260] });
  return s;
}

function notebook(x, y, rot, ink, page = '#e9e2cc', lines = '#8f8771') {
  let rows = '';
  for (let i = 0; i < 7; i++) {
    const yy = -50 + i * 14;
    const w1 = 90 + ((i * 37) % 50);
    const w2 = 80 + ((i * 53) % 60);
    rows += `M-${w1 + 20},${yy} l${w1},-2 M24,${yy - 2} l${w2},2 `;
  }
  return `<g transform="translate(${x},${y}) rotate(${rot})">
    <path d="M-190,-70 L0,-62 L190,-70 L196,50 L0,58 L-196,50 Z" fill="${ink}"/>
    <path d="M-180,-64 L0,-56 L180,-64 L184,40 L0,48 L-184,40 Z" fill="${page}"/>
    <path d="M0,-56 L0,48" stroke="${lines}" stroke-width="3"/>
    <path d="${rows}" stroke="${lines}" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
}

// Home hero: the interview table. A field recorder with its red light on,
// headphones and a notebook. Objects only, no hands.
function recorder() {
  const r = rng(505);
  const ink = '#0a0f0d';
  let b = wall(r);
  // warm lamp light from the upper right
  b += `<path d="M1600,0 L1250,0 L620,1000 L1600,1000 Z" fill="#d4af37" opacity="0.07"/>`;
  b += `<ellipse cx="1080" cy="760" rx="520" ry="150" fill="#d4af37" opacity="0.08"/>`;
  b += table(r, 640);
  // shadows
  b += `<ellipse cx="1080" cy="790" rx="150" ry="22" fill="${ink}" opacity="0.6"/>`;
  b += `<ellipse cx="700" cy="880" rx="210" ry="26" fill="${ink}" opacity="0.5"/>`;
  // recorder body
  b += `<rect x="985" y="420" width="190" height="370" rx="22" fill="#1a1f1c"/>`;
  b += `<rect x="985" y="420" width="190" height="370" rx="22" fill="none" stroke="#3a443e" stroke-width="5"/>`;
  b += `<rect x="1010" y="470" width="140" height="80" rx="6" fill="#a3b18a"/>`;
  let wave = 'M1020,512 ';
  for (let i = 0; i < 26; i++) wave += `L${1022 + i * 5},${f(512 + (r() - 0.5) * (8 + (i % 7) * 4))} `;
  b += `<path d="${wave}" stroke="#1b4332" stroke-width="3" fill="none"/>`;
  b += `<circle cx="1080" cy="640" r="34" fill="#2b332e" stroke="#4a564f" stroke-width="4"/>`;
  b += `<circle cx="1080" cy="640" r="12" fill="#b7094c"/>`;
  b += `<circle cx="1080" cy="640" r="26" fill="#b7094c" opacity="0.25"/>`;
  for (const [bx, by] of [[1025, 590], [1135, 590], [1025, 700], [1135, 700]]) b += `<rect x="${bx - 14}" y="${by - 9}" width="28" height="18" rx="5" fill="#2b332e"/>`;
  b += `<rect x="1035" y="740" width="90" height="10" rx="5" fill="#2b332e"/>`;
  // crossed microphone capsules on top
  for (const a of [-28, 28]) {
    b += `<g transform="translate(1080,420) rotate(${a})">
      <rect x="-34" y="-150" width="68" height="150" rx="30" fill="#2b332e" stroke="#4a564f" stroke-width="4"/>
      <path d="M-24,-130 L24,-130 M-26,-112 L26,-112 M-26,-94 L26,-94 M-26,-76 L26,-76 M-24,-58 L24,-58" stroke="#59665e" stroke-width="3"/>
    </g>`;
  }
  b += `<rect x="1040" y="400" width="80" height="30" rx="8" fill="#1a1f1c"/>`;
  // headphones lying flat
  b += `<path d="M560,860 Q560,700 700,690 Q840,700 840,860" stroke="#1a1f1c" stroke-width="26" fill="none" stroke-linecap="round"/>`;
  b += `<path d="M560,860 Q560,700 700,690 Q840,700 840,860" stroke="#3a443e" stroke-width="6" fill="none" opacity="0.8"/>`;
  b += `<ellipse cx="560" cy="870" rx="62" ry="40" fill="#1a1f1c"/><ellipse cx="840" cy="870" rx="62" ry="40" fill="#1a1f1c"/>`;
  b += `<ellipse cx="560" cy="862" rx="40" ry="24" fill="#2b332e"/><ellipse cx="840" cy="862" rx="40" ry="24" fill="#2b332e"/>`;
  // cable from headphones to the recorder
  b += `<path d="M840,890 Q920,960 1000,900 Q1060,850 1080,790" stroke="#1a1f1c" stroke-width="7" fill="none"/>`;
  // notebook and pencil
  b += notebook(1370, 880, -6, ink);
  b += `<path d="M1220,965 L1450,925" stroke="#d4af37" stroke-width="12" stroke-linecap="round"/><path d="M1450,925 L1474,921" stroke="#2b332e" stroke-width="8" stroke-linecap="round"/>`;
  return svg(b);
}

// About page: the writing desk at night. A window with a crescent moon, an
// oil lamp and the notebook where testimonies are written up.
function desk() {
  const r = rng(606);
  const ink = '#0a0f0d';
  let b = wall(r, '#0f1814', '#1a2e24');
  // window
  b += `<rect x="900" y="110" width="440" height="400" fill="#13263a"/>`;
  for (let i = 0; i < 30; i++) b += `<circle cx="${f(910 + r() * 420)}" cy="${f(120 + r() * 380)}" r="${f(1 + r() * 2)}" fill="#e9e1c8" opacity="${f(0.4 + r() * 0.6)}"/>`;
  b += `<circle cx="1210" cy="220" r="48" fill="#efe3c2"/><circle cx="1232" cy="206" r="44" fill="#13263a"/>`;
  b += gouges(r, { y0: 130, y1: 500, x0: 900, x1: 1340, color: '#244061', opacity: 0.5, gap: 22, len: [30, 90], clip: [900, 110, 440, 400] });
  b += `<path d="M1120,110 L1120,510 M900,310 L1340,310" stroke="#2a2016" stroke-width="18"/>`;
  b += `<rect x="900" y="110" width="440" height="400" fill="none" stroke="#2a2016" stroke-width="26"/>`;
  b += `<rect x="870" y="505" width="500" height="24" fill="#3b2a1c"/>`;
  // lamp glow
  b += `<circle cx="700" cy="560" r="330" fill="#d4af37" opacity="0.07"/>`;
  b += `<circle cx="700" cy="560" r="190" fill="#f2b84b" opacity="0.09"/>`;
  b += table(r, 690, '#33251a', '#4d3823');
  b += `<ellipse cx="700" cy="720" rx="380" ry="60" fill="#f2b84b" opacity="0.08"/>`;
  // oil lamp
  b += `<ellipse cx="700" cy="770" rx="110" ry="20" fill="${ink}" opacity="0.6"/>`;
  b += `<path d="M610,760 Q600,700 650,690 L750,690 Q800,700 790,760 Z" fill="#7a5a2a"/>`;
  b += `<path d="M640,690 L760,690 L745,670 L655,670 Z" fill="#5a4128"/>`;
  b += `<path d="M655,670 Q620,580 660,500 Q700,470 740,500 Q780,580 745,670 Z" fill="#f2d28a" opacity="0.35"/>`;
  b += `<path d="M655,670 Q620,580 660,500 Q700,470 740,500 Q780,580 745,670" stroke="#e9e1c8" stroke-width="4" fill="none" opacity="0.6"/>`;
  b += `<path d="M700,640 Q680,600 700,560 Q720,600 700,640 Z" fill="#f2c45a"/>`;
  b += `<path d="M700,630 Q692,605 700,585 Q708,605 700,630 Z" fill="#fff2c4"/>`;
  b += `<rect x="690" y="480" width="20" height="24" fill="#5a4128"/>`;
  // notebook and pen, the cup of tea
  b += notebook(1080, 860, 4, ink, '#e9e2cc', '#8f8771');
  b += `<path d="M960,930 L1180,960" stroke="#1a1f1c" stroke-width="10" stroke-linecap="round"/>`;
  b += `<ellipse cx="1420" cy="830" rx="70" ry="14" fill="${ink}" opacity="0.6"/>`;
  b += `<path d="M1365,740 L1475,740 L1465,825 Q1420,840 1375,825 Z" fill="#a3b18a"/>`;
  b += `<ellipse cx="1420" cy="740" rx="55" ry="12" fill="#5a3e22"/>`;
  b += `<path d="M1475,758 q34,4 30,30 q-4,22 -36,18" stroke="#a3b18a" stroke-width="9" fill="none"/>`;
  for (const sx of [1405, 1435]) b += `<path d="M${sx},720 q-14,-30 0,-60 q14,-30 0,-60" stroke="#c8d6ce" stroke-width="4" fill="none" opacity="0.35"/>`;
  return svg(b);
}

// Share-your-story band: dawn after leaving the forest. A footpath runs out of
// the dark trees towards a village with lit windows.
function homeward() {
  const r = rng(707);
  let b = '';
  ['#132a22', '#1b4332', '#2d6a4f', '#6f8a5a', '#c9a14a', '#e3bf66'].forEach((c, i) => (b += `<rect x="0" y="${i * 80}" width="${W}" height="${H}" fill="${c}"/>`));
  b += gouges(r, { y0: 20, y1: 470, color: '#a3b18a', opacity: 0.25, gap: 24 });
  b += `<circle cx="1260" cy="520" r="110" fill="#f6dc92"/>`;
  b += `<path d="${ridge(r, 520, 24, { waves: 2 })}" fill="#4a5f45"/>`;
  b += `<path d="${ridge(r, 580, 20, { waves: 2.6 })}" fill="#2f4a3a"/>`;
  b += `<path d="${ridge(r, 660, 16, { waves: 1.4 })}" fill="#1f3529"/>`;
  b += gouges(r, { y0: 690, y1: H, color: '#2d6a4f', opacity: 0.5, gap: 16, len: [30, 120] });
  // the path, widening towards the viewer
  b += `<path d="M1080,640 Q1000,700 860,740 Q620,800 640,880 Q660,950 520,1000 L760,1000 Q820,940 800,880 Q800,820 960,770 Q1080,720 1120,642 Z" fill="#b9864a"/>`;
  b += gouges(r, { y0: 760, y1: H, x0: 560, x1: 900, color: '#8a6234', opacity: 0.5, gap: 18, len: [14, 50] });
  // village: round huts and square houses with lit windows
  const ink = '#0d1611';
  const huts = [[1040, 640, 70], [1150, 632, 90], [1290, 640, 76], [1420, 646, 100], [1540, 640, 70]];
  huts.forEach(([x, y, s], i) => {
    if (i % 2) {
      b += `<rect x="${x - s * 0.6}" y="${y - s * 0.7}" width="${s * 1.2}" height="${s * 0.7}" fill="${ink}"/>`;
      b += `<path d="M${x - s * 0.72},${y - s * 0.66} L${x},${y - s * 1.1} L${x + s * 0.72},${y - s * 0.66} Z" fill="${ink}"/>`;
    } else {
      b += `<rect x="${x - s * 0.5}" y="${y - s * 0.6}" width="${s}" height="${s * 0.6}" rx="${s * 0.1}" fill="${ink}"/>`;
      b += `<path d="M${x - s * 0.66},${y - s * 0.56} L${x},${y - s * 1.2} L${x + s * 0.66},${y - s * 0.56} Z" fill="${ink}"/>`;
    }
    b += `<rect x="${x - s * 0.12}" y="${y - s * 0.42}" width="${s * 0.22}" height="${s * 0.2}" fill="#f2b84b"/>`;
  });
  // a curl of cooking smoke from the village
  for (let i = 0; i < 7; i++) b += `<ellipse cx="${f(1150 + Math.sin(i) * 14 + i * 8)}" cy="${f(520 - i * 30)}" rx="${f(12 + i * 5)}" ry="${f(8 + i * 3)}" fill="#c8d6ce" opacity="${f(0.4 - i * 0.05)}"/>`;
  // dark forest edge on the left, behind the headline
  for (let x = -40; x < 620; x += 70) b += crown(r, x, 760 + r() * 40, 360 + r() * 260, '#08110c');
  b += `<path d="M0,1000 L0,700 L520,720 Q600,760 560,850 Q520,930 470,1000 Z" fill="#08110c"/>`;
  return svg(b);
}

// Contact page: a door left open, warm light spilling across the floor. A
// safe place to talk.
function door() {
  const r = rng(808);
  let b = wall(r, '#101914', '#1b2e24');
  // floor
  b += `<rect x="0" y="780" width="${W}" height="220" fill="#21170f"/>`;
  b += gouges(r, { y0: 800, y1: H, color: '#3b2a1c', opacity: 0.8, gap: 18, len: [80, 300] });
  // the lit room through the doorway
  const dx = 980;
  const dw = 300;
  const top = 200;
  b += `<rect x="${dx}" y="${top}" width="${dw}" height="${780 - top}" fill="#f2c26a"/>`;
  b += `<rect x="${dx}" y="${top}" width="${dw}" height="${780 - top}" fill="#d4af37" opacity="0.35"/>`;
  b += gouges(r, { y0: top + 20, y1: 760, x0: dx, x1: dx + dw, color: '#fbe2a6', opacity: 0.6, gap: 22, len: [30, 90], clip: [dx, top, dw, 780 - top] });
  // a chair inside, waiting
  b += `<path d="M${dx + 170},640 L${dx + 170},780 M${dx + 250},640 L${dx + 250},780 M${dx + 170},640 L${dx + 250},640 M${dx + 245},640 L${dx + 245},500" stroke="#5a4128" stroke-width="12" stroke-linecap="round"/>`;
  b += `<rect x="${dx + 160}" y="628" width="100" height="16" fill="#5a4128"/>`;
  // light spilling out across the floor
  b += `<path d="M${dx},780 L${dx + dw},780 L${dx + dw + 260},1000 L${dx - 420},1000 Z" fill="#f2c26a" opacity="0.28"/>`;
  b += gouges(r, { y0: 800, y1: H, x0: dx - 300, x1: dx + dw + 200, color: '#f2c26a', opacity: 0.3, gap: 18, len: [40, 160] });
  // frame and the door swung inwards
  b += `<rect x="${dx - 24}" y="${top - 24}" width="${dw + 48}" height="${780 - top + 24}" fill="none" stroke="#3b2a1c" stroke-width="24"/>`;
  b += `<path d="M${dx},${top} L${dx + 120},${top + 40} L${dx + 120},740 L${dx},780 Z" fill="#4d3823"/>`;
  b += `<path d="M${dx + 20},${top + 40} L${dx + 100},${top + 66} L${dx + 100},440 L${dx + 20},430 Z M${dx + 20},480 L${dx + 100},486 L${dx + 100},720 L${dx + 20},740 Z" fill="none" stroke="#3b2a1c" stroke-width="6"/>`;
  b += `<circle cx="${dx + 106}" cy="490" r="8" fill="#d4af37"/>`;
  // a plant by the door
  b += `<path d="M1390,780 L1400,700 L1480,700 L1490,780 Z" fill="#5a4128"/>`;
  for (let i = 0; i < 7; i++) b += `<path d="${leaf(1440, 700, -Math.PI / 2 + (i - 3) * 0.32, 150 + r() * 60, 18, (i - 3) * 14, r)}" fill="#1b4332"/>`;
  return svg(b);
}

const SCENES = {
  'story-coast': coast,
  'story-road': road,
  'story-forest': forest,
  'story-mangroves': mangroves,
  'scene-recorder': recorder,
  'scene-desk': desk,
  'scene-homeward': homeward,
  'scene-door': door,
};

// ---------- render ----------

/** Fine paper grain, so the ink layers read as printed rather than digital. */
async function grain(seed) {
  const r = rng(seed);
  const px = Buffer.alloc(W * H);
  for (let i = 0; i < px.length; i++) px[i] = 128 + Math.round((r() - 0.5) * 70);
  return sharp(px, { raw: { width: W, height: H, channels: 1 } }).blur(0.5).png().toBuffer();
}

await mkdir(OUT, { recursive: true });
const previewDir = process.argv[2];
let seed = 1;
for (const [name, draw] of Object.entries(SCENES)) {
  const base = await sharp(Buffer.from(draw()))
    .composite([{ input: await grain(seed++), blend: 'soft-light' }])
    .png()
    .toBuffer();
  if (previewDir) await writeFile(path.join(previewDir, `${name}.png`), base);
  for (const [suffix, w] of Object.entries(WIDTHS)) {
    const out = path.join(OUT, `${name}-${suffix}.webp`);
    const info = await sharp(base)
      .resize({ width: w })
      .webp({ quality: suffix === 'sm' ? 64 : 72 })
      .toFile(out);
    console.log(`${path.basename(out)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
