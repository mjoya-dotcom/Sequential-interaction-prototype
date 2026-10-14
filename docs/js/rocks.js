/* Step 1 — Rocks. Ported from the Campfire Rocks study:
   drag each rock from the glowing pile into a slot around the pit. */
(() => {
const { el, $, tween, E, M, reduce, fx } = CF;
const S = CF.S;
const slotsG = $('slots'), rocksG = $('rocks'), pileGlow = $('pileGlow');

const SLOT_OFF = [[-84,-40],[84,-40],[-90,36],[90,36]];
const PILE_OFF = [[-38,-12],[30,-20],[-8,18],[46,14]];
const slotPos = s => ({ x: CF.L.fire.x + SLOT_OFF[s][0], y: CF.L.fire.y + SLOT_OFF[s][1] });

const slotEls = SLOT_OFF.map(([x, y]) => {
  const g = el('g', { transform: `translate(${x},${y})` }, slotsG);
  const e = el('ellipse', { class: 'slot', rx: 30, ry: 20, cy: 4 }, g);
  return { g, e, s: 1, filled: false };
});

const ROCK_D = [
 "M-28,6 C-30,-10 -14,-21 3,-20 C20,-19 30,-7 28,8 C26,18 11,21 -4,20 C-19,19 -27,15 -28,6Z",
 "M-24,9 C-27,-6 -16,-18 -1,-19 C15,-20 27,-10 27,4 C27,15 15,21 0,21 C-13,21 -22,17 -24,9Z",
 "M-30,8 C-29,-4 -18,-15 -2,-16 C16,-17 31,-8 30,6 C29,17 14,20 -2,20 C-18,20 -31,17 -30,8Z",
 "M-23,7 C-25,-9 -10,-21 5,-19 C19,-17 26,-5 24,9 C22,18 9,21 -4,20 C-16,19 -22,15 -23,7Z"];
const rocks = ROCK_D.map((d, i) => {
  const g = el('g', {}, rocksG);
  const sh = el('ellipse', { class: 'shadow', rx: 26, ry: 7 }, g);
  const body = el('g', { class: 'rk-body' }, g);
  el('path', { class: 'rk', d }, body);
  el('path', { class: 'hl', d: 'M-14,-10 C-8,-15 4,-16 10,-13' }, body);
  const r = { i, g, sh, body, x: 0, y: 0, lift: 0, rot: 0, sx: 1, sy: 1, slot: -1, drag: false, moving: false,
              tx: 0, ty: 0, px: 0, ox: 0, oy: 0, home: { x: 0, y: 0 } };
  body.addEventListener('pointerdown', e => grab(r, e));
  body.addEventListener('pointerenter', () => { if (idle(r)) tween(r, { lift: 6 }, 220, E.back); });
  body.addEventListener('pointerleave', () => { if (idle(r)) tween(r, { lift: 0 }, 260, E.out); });
  return r;
});
const idle = r => CF.step === 0 && !r.drag && !r.moving && r.slot < 0;

function layout() {
  const L = CF.L;
  pileGlow.setAttribute('cx', L.pile.x); pileGlow.setAttribute('cy', L.pile.y);
  rocks.forEach((r, i) => {
    r.home = { x: L.pile.x + PILE_OFF[i][0], y: L.pile.y + PILE_OFF[i][1] };
    if (!r.drag && !r.moving) { const p = r.slot >= 0 ? slotPos(r.slot) : r.home; r.x = p.x; r.y = p.y; }
  });
}
CF.onLayout(layout);

/* ---------- interaction ---------- */
let active = null, hot = -1;

function grab(r, e) {
  if (CF.step !== 0 || r.slot >= 0 || r.moving || active) return;
  e.preventDefault();
  r.body.setPointerCapture(e.pointerId);
  active = r; r.drag = true; r.body.classList.add('dragging');
  rocksG.appendChild(r.g);
  const p = CF.toSvg(e); r.ox = r.x - p.x; r.oy = r.y - p.y; r.tx = r.x; r.ty = r.y; r.px = r.x;
  // On contact: squash, then spring up off the ground
  tween(r, { sx: 1.16, sy: 0.8 }, 90, E.out, { done: () =>
    tween(r, { sx: 0.94, sy: 1.1, lift: 26 }, 240, E.back, { done: () =>
      tween(r, { sx: 1, sy: 1 }, 380, E.elastic) }) });
  slotsG.classList.add('show');
}
S.addEventListener('pointermove', e => {
  if (!active) return;
  const p = CF.toSvg(e); active.tx = p.x + active.ox; active.ty = p.y + active.oy;
  let best = -1, bd = 95;
  slotEls.forEach((s, i) => { if (s.filled) return; const sp = slotPos(i);
    const d = Math.hypot(active.tx - sp.x, active.ty - sp.y); if (d < bd) { bd = d; best = i; } });
  if (best !== hot) {
    if (hot >= 0) tween(slotEls[hot], { s: 1 }, 300, E.out);
    if (best >= 0) tween(slotEls[best], { s: 1.22 }, 420, E.elastic);
    hot = best;
  }
});
function release() {
  if (!active) return;
  const r = active; active = null; r.drag = false; r.body.classList.remove('dragging');
  slotsG.classList.remove('show');
  if (hot >= 0) { const s = hot; tween(slotEls[s], { s: 1 }, 200); hot = -1; place(r, s); }
  else goHome(r);
}
S.addEventListener('pointerup', release);
S.addEventListener('pointercancel', release);

function arc(r, to, dur, height, ease, after) {
  r.moving = true;
  const l0 = r.lift;
  tween(r, { x: to.x, y: to.y }, dur, ease, {
    update: t => { r.lift = l0*(1-t) + Math.sin(Math.PI*t)*height; },
    done: () => { r.lift = 0; r.moving = false; after && after(); } });
}
function land(r, k = 1) {
  tween(r, { sx: 1 + .3*k, sy: 1 - .3*k }, 80, E.out, { done: () => tween(r, { sx: 1, sy: 1 }, 650, E.elastic) });
}
function place(r, s) {
  r.slot = s; slotEls[s].filled = true;
  r.body.classList.add('placed');
  tween(r, { rot: 0 }, 500, E.out);
  arc(r, slotPos(s), 460, 42, E.inOut, () => {
    land(r);
    fx.puff(SLOT_OFF[s][0], SLOT_OFF[s][1]);
    const n = slotEls.filter(x => x.filled).length;
    CF.progress.set(0, n / 4);
    if (n === 4) CF.later(complete, 260);
  });
}
function goHome(r) {
  // Incorrect input: float back with a little head-shake on landing
  tween(r, { rot: r.rot > 0 ? -12 : 12 }, 300, E.out);
  arc(r, r.home, 560, 70, E.out, () => {
    land(r, .6);
    CF.shake(r, 'rot', 9);
    pileGlow.style.animationDuration = '.6s';
    CF.later(() => pileGlow.style.animationDuration = '', 1300);
  });
}

function hop(r, ease, h = 14, upDur = 160, downDur = 420) {
  tween(r, { lift: h }, upDur, E.out, { done: () => tween(r, { lift: 0 }, downDur, ease, { done: () => land(r, .4) }) });
}
function complete() {
  pileGlow.classList.add('off');
  rocks.forEach((r, i) => CF.later(() => hop(r, E.back), 220 + i*90));
  CF.later(() => CF.flow.complete(0), 700);
}

CF.rocks = {
  activate() { pileGlow.classList.remove('off'); },
  // Completion wave when the fire catches (Matches study)
  hopWave() { rocks.forEach((r, i) => CF.later(() => hop(r, E.bounce, 16, 170, 520), 180 + i*90)); },
  // Wood landing in the pit jiggles the ring (Wood study's fire squash)
  jiggle() { rocks.forEach(r => CF.keys(r, [{sx:1,sy:1},{sx:1.05,sy:.9},{sx:.98,sy:1.04},{sx:1,sy:1}], 380)); },
  reset() {
    active = null; hot = -1;
    slotsG.classList.remove('show');
    pileGlow.classList.add('off'); pileGlow.style.animationDuration = '';
    slotEls.forEach(s => { s.filled = false; s.s = 1; });
    rocks.forEach((r, i) => {
      r.drag = false; r.slot = -1; r.body.classList.remove('placed', 'dragging');
      r.sx = r.sy = 1;
      CF.later(() => { tween(r, { rot: 0 }, 400); arc(r, r.home, 560, 60, E.inOut, () => land(r, .5)); }, i*70);
    });
  },
  frame(now) {
    for (const r of rocks) {
      if (r.drag) { // flowy follow: lag + lean into motion
        r.x += (r.tx - r.x) * 0.28; r.y += (r.ty - r.y) * 0.28;
        const vx = r.x - r.px; r.px = r.x;
        const lean = Math.max(-28, Math.min(28, vx * 2.2));
        r.rot += (lean - r.rot) * 0.18;
        if (!reduce) r.lift = 26 + Math.sin(now/180) * 3;
      }
      r.body.setAttribute('transform', `translate(${r.x},${r.y - r.lift + 18}) rotate(${r.rot}) scale(${r.sx},${r.sy}) translate(0,-18)`);
      const k = Math.max(0.45, 1 - r.lift/90);
      r.sh.setAttribute('cx', r.x); r.sh.setAttribute('cy', r.y + 18);
      r.sh.setAttribute('rx', 26*k*r.sx); r.sh.setAttribute('opacity', k);
    }
    slotEls.forEach(s => s.e.setAttribute('transform', `scale(${s.s})`));
  },
};
})();
