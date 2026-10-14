/* Steps 2 + 3 — Wood. Ported from the Campfire Wood study, split in two:
   Step 2 (collect): tap each glowing log hidden in the trees, under the bench and on the ground; it hops into the bubble.
   Step 3 (stack):   drag each log from the bubble into the ring of rocks. */
(() => {
const { el, $, tween, E, fx } = CF;
const S = CF.S;
const wildG = $('wildLogs'), bagG = $('bagLogs'), fireG = $('fireLogs'), dragG = $('drag'), pit = $('pit');
const bubbleArt = $('bubbleArt'), bubbleFront = $('bubbleFront');

const N = 6;
const tp = (T, x, y, r) => ({ x: T.x + x*T.k, y: T.y + y*T.k, r });
const SPOTS = [
  L => tp(L.treeL, 24, -200, 58),
  L => tp(L.treeL, -54, -168, -16),
  L => tp(L.treeR, -24, -246, -25),
  L => tp(L.bench, 4, 40, 4),
  L => ({ x: L.floorA.x, y: L.floorA.y, r: -9 }),
  L => ({ x: L.floorB.x, y: L.floorB.y, r: 14 }),
];
const BAG = [[34,36,-14],[66,38,12],[30,54,9],[70,56,-8],[38,72,-4],[62,72,6]];
const FIRE = [[-16,-2,-38],[16,-2,38],[0,6,0],[-9,-14,-62],[9,-14,62],[0,-22,90]];
const SC = { wild: .62, fire: .66, drag: .68 };
const bagScale = () => 2 * CF.L.bubble.r * .34 / 116;
const spotPos = i => SPOTS[i](CF.L);
const bagPos = s => { const b = CF.L.bubble; return { x: b.x + (BAG[s][0]-50)/50*b.r, y: b.y + (BAG[s][1]-50)/50*b.r, r: BAG[s][2] }; };
const firePos = k => ({ x: CF.L.fire.x + FIRE[k][0], y: CF.L.fire.y + FIRE[k][1], r: FIRE[k][2] });

const bubble = { s: .6, o: .3, sx: 1, sy: 1 };
let collected = 0, landed = 0, placed = 0, slots = Array(N).fill(null), drag = null;

function makeLog(i) {
  const g = el('g', { class: 'wlog', role: 'button', 'aria-label': 'Piece of wood', tabindex: '-1' }, wildG);
  el('ellipse', { class: 'whalo', rx: 90, ry: 54, fill: 'url(#g-glow)' }, g);
  el('rect', { x: -72, y: -28, width: 144, height: 56, fill: 'transparent' }, g);
  el('rect', { class: 'log', x: -58, y: -9, width: 116, height: 18, rx: 9 }, g);
  el('ellipse', { class: 'log-end', cx: 52, cy: 0, rx: 5, ry: 8 }, g);
  const lg = { i, g, x: 0, y: 0, rot: 0, s: SC.wild, lift: 0, sx: 1, sy: 1, wig: 0, hs: 1, as: 1, ph: i*1.3,
               state: 'wild', slot: -1, fslot: -1, moving: false, hover: false };
  g.addEventListener('pointerdown', e => down(lg, e));
  g.addEventListener('pointerenter', () => { lg.hover = true; if (lg.state === 'wild' && CF.step === 1) tween(lg, { hs: 1.08 }, 200, E.back); });
  g.addEventListener('pointerleave', () => { lg.hover = false; tween(lg, { hs: 1 }, 200); });
  g.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (lg.state === 'wild' && CF.step === 1) collect(lg);
    else if (lg.state === 'bagged' && CF.step === 2 && !drag) place(lg);
  });
  return lg;
}
const logs = Array.from({ length: N }, (_, i) => makeLog(i));

function layout() {
  logs.forEach(lg => {
    if (lg.moving || lg.state === 'dragging') return;
    const p = lg.state === 'bagged' ? bagPos(lg.slot) : lg.state === 'burning' ? firePos(lg.fslot) : spotPos(lg.i);
    lg.x = p.x; lg.y = p.y; lg.rot = p.r;
    if (lg.state === 'bagged') lg.s = bagScale();
  });
}
CF.onLayout(layout);

function move(lg, to, scale, dur, ease, arc, after) {
  lg.moving = true;
  const h = arc ? Math.min(Math.hypot(to.x - lg.x, to.y - lg.y) * .35, 140) : 0;
  tween(lg, { x: to.x, y: to.y, s: scale, rot: to.r }, dur, ease, {
    update: t => { lg.lift = Math.sin(Math.PI*t) * h; lg.as = arc ? 1 + .15*Math.sin(Math.PI*t) : 1; },
    done: () => { lg.lift = 0; lg.as = 1; lg.moving = false; after && after(); } });
}
const squish = (lg, d = 260, done) => CF.keys(lg, [{sx:1,sy:1},{sx:1.25,sy:.72},{sx:.86,sy:1.2},{sx:1,sy:1}], d, E.out, done);
const wiggle = lg => CF.keys(lg, [{wig:0},{wig:-11},{wig:9},{wig:-5},{wig:0}], 420);
const jiggleBubble = (d = 420, k = 1) => CF.keys(bubble, [{sx:1,sy:1},{sx:1+.07*k,sy:1-.07*k},{sx:1-.04*k,sy:1+.04*k},{sx:1,sy:1}], d);
const setTab = () => logs.forEach(lg => lg.g.setAttribute('tabindex',
  (CF.step === 1 && lg.state === 'wild') || (CF.step === 2 && lg.state === 'bagged') ? '0' : '-1'));

/* ---------- step 2: collect ---------- */
function collect(lg) {
  if (CF.step !== 1 || lg.state !== 'wild') return;
  lg.state = 'flying'; lg.g.classList.remove('wild');
  const slot = slots.indexOf(null);
  slots[slot] = lg; lg.slot = slot;
  collected++;
  fx.pulse(lg.x, lg.y, 90);
  if (bubble.s < 1) tween(bubble, { s: 1, o: 1 }, 700, E.back);
  lg.g.setAttribute('aria-label', 'Collected wood');
  setTab();
  squish(lg, 260, () => {
    bagG.appendChild(lg.g);
    move(lg, bagPos(slot), bagScale(), 720, E.inOut, true, () => {
      lg.state = 'bagged'; lg.g.classList.add('bagged');
      jiggleBubble(360);
      landed++;
      CF.progress.set(1, landed / N);
      if (landed === N) CF.later(completeCollect, 300);
    });
  });
}
function completeCollect() {
  const b = CF.L.bubble;
  fx.pulse(b.x, b.y, b.r * 2.6, 600);
  jiggleBubble(520, 1.6);
  CF.flow.complete(1);
}

/* ---------- step 3: stack ---------- */
function down(lg, e) {
  if (lg.state === 'wild') { if (CF.step === 1) { e.preventDefault(); collect(lg); } return; }
  if (lg.state !== 'bagged' || CF.step !== 2 || drag || lg.moving) return;
  e.preventDefault();
  lg.g.setPointerCapture(e.pointerId);
  const p = CF.toSvg(e);
  drag = { lg, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: lg.x - p.x, oy: lg.y - p.y, moved: false };
}
function overFire(x, y) {
  const f = CF.L.fire;
  return Math.hypot((x - f.x) / 125, (y - (f.y - 4)) / 72) < 1;
}
S.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const lg = drag.lg;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    drag.moved = true;
    lg.state = 'dragging';
    lg.g.classList.remove('bagged'); lg.g.classList.add('dragging');
    dragG.appendChild(lg.g);
    pit.classList.add('armed');
    tween(lg, { s: SC.drag }, 200, E.out);
    CF.keys(lg, [{sx:.75,sy:.75},{sx:1.12,sy:1.12},{sx:1,sy:1}], 240);
  }
  const p = CF.toSvg(e);
  lg.x = p.x + drag.ox; lg.y = p.y + drag.oy;
  pit.classList.toggle('hot', overFire(lg.x, lg.y));
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  pit.classList.remove('armed', 'hot');
  if (!d.moved) { wiggle(d.lg); return; }
  if (e.type === 'pointerup' && overFire(d.lg.x, d.lg.y)) place(d.lg);
  else back(d.lg);
}
S.addEventListener('pointerup', endDrag);
S.addEventListener('pointercancel', endDrag);

function place(lg) {
  slots[lg.slot] = null;
  const k = placed++;
  lg.fslot = k; lg.state = 'placing';
  lg.g.classList.remove('bagged', 'dragging');
  lg.g.setAttribute('aria-label', 'Wood in the fire');
  fireG.appendChild(lg.g);
  setTab();
  move(lg, firePos(k), SC.fire, 460, E.backSoft, false, () => {
    lg.state = 'burning';
    squish(lg, 300);
    CF.rocks.jiggle();
    fx.spark(CF.L.fire.x, CF.L.fire.y - 10, 4, 2.4);
    CF.progress.set(2, placed / N);
    if (placed === N) CF.later(completeStack, 250);
  });
}
function back(lg) {
  lg.state = 'returning';
  lg.g.classList.remove('dragging');
  bagG.appendChild(lg.g);
  move(lg, bagPos(lg.slot), bagScale(), 540, E.back, false, () => {
    lg.state = 'bagged'; lg.g.classList.add('bagged');
    wiggle(lg); jiggleBubble();
  });
}
function completeStack() {
  const b = CF.L.bubble, f = CF.L.fire;
  tween(bubble, { s: 1.4, o: 0 }, 350, E.out);
  fx.pulse(b.x, b.y, b.r * 2.6, 600);
  fx.pulse(f.x, f.y - 10, 260, 900);
  CF.flow.complete(2);
}

let last = 0;
CF.wood = {
  activateCollect() {
    logs.forEach(lg => { if (lg.state === 'wild') lg.g.classList.add('wild'); });
    setTab();
  },
  activateStack() { setTab(); },
  dragging: () => !!drag,
  lit(on) { fireG.classList.toggle('lit', on); pit.classList.toggle('lit', on); },
  burnDown() { fireG.classList.remove('lit'); fireG.classList.add('charred');
    pit.classList.remove('lit'); pit.classList.add('coals');
    logs.forEach(lg => tween(lg, { s: SC.fire * .9 }, 9000, E.inOut)); },
  reset() {
    drag = null; collected = landed = placed = 0; slots = Array(N).fill(null);
    pit.classList.remove('armed', 'hot', 'lit', 'coals');
    fireG.classList.remove('lit', 'charred');
    tween(bubble, { s: .6, o: .3, sx: 1, sy: 1 }, 500, E.out);
    logs.forEach((lg, i) => {
      lg.state = 'returning'; lg.slot = -1; lg.fslot = -1; lg.wig = 0; lg.sx = lg.sy = 1; lg.hs = 1;
      lg.g.classList.remove('wild', 'bagged', 'dragging');
      lg.g.setAttribute('aria-label', 'Piece of wood');
      dragG.appendChild(lg.g);
      CF.later(() => move(lg, spotPos(i), SC.wild, 640, E.inOut, true, () => {
        lg.state = 'wild'; wildG.appendChild(lg.g); squish(lg, 260);
      }), 120 + i*70);
    });
    setTab();
  },
  frame(now) {
    const dt = Math.min(64, now - (last || now)); last = now;
    for (const lg of logs) {
      let by = 0, br = 0;
      if (lg.state === 'bagged' && !CF.reduce) {   // bob inside the bubble
        lg.ph += dt * (2*Math.PI / (lg.hover && CF.step === 2 ? 1200 : 4800));
        by = Math.sin(lg.ph) * 4; br = Math.sin(lg.ph) * 2;
      }
      const k = lg.s * lg.hs * lg.as;
      lg.g.setAttribute('transform',
        `translate(${lg.x},${lg.y - lg.lift + by}) rotate(${lg.rot + lg.wig + br}) scale(${k*lg.sx},${k*lg.sy})`);
    }
    const b = CF.L.bubble, bs = b.r * bubble.s;
    const tr = `translate(${b.x},${b.y}) scale(${bs*bubble.sx},${bs*bubble.sy})`;
    bubbleArt.setAttribute('transform', tr); bubbleFront.setAttribute('transform', tr);
    bubbleArt.setAttribute('opacity', bubble.o); bubbleFront.setAttribute('opacity', bubble.o);
    $('sigPit').classList.toggle('on', CF.step === 2 && !drag);
  },
};
})();
