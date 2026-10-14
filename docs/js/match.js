/* Step 4 — Match. Ported from the Campfire Matches study:
   pick up the match, rub its head across the striker until it catches,
   then touch it to the wood. Also owns the campfire flame and the burn-down ending. */
(() => {
const { el, $, tween, E, reduce, F, fx } = CF;
const S = CF.S;
const matchEl = $('match');

/* ---------- ribbon flame: layered, wavy outlines ---------- */
function flameD(h, w, t, seed, sway) {
  const N = 22, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const v = i / N, y = -h * v;
    const c = sway * v * (Math.sin(t*3.1 + v*4 + seed) + 0.35*Math.sin(t*7.3 + v*9 + seed*2));
    const prof = w * Math.pow(1 - v, 0.85) * Math.min(1, 0.45 + v*2.6);
    const ripple = 1 + 0.1*Math.sin(t*11 + v*12 + seed);
    L.push([c - prof/2*ripple, y]); R.push([c + prof/2*(2 - ripple), y]);
  }
  const pts = L.concat(R.reverse());
  return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + 'Z';
}

/* ---------- state ---------- */
const m = { x: 0, y: 0, lift: 0, base: 0, lean: 0, sx: 1, sy: 1, op: 1, px: 0, py: 0, tx: 0, ty: 0, ox: 0, oy: 0,
            held: false, moving: false, gone: false, lit: false, fl: 0, rub: 0, hx: 0, hy: 0 };
const bx = { j: 0, s: 1 };       // matchbox jiggle
const logsW = { r: 0 };          // logs "no" wobble
const fireS = { s: 0, h: 0 };    // campfire flame scale + halo
let box = { x: 0, y: 0 }, home = { x: 0, y: 0 }, lastNo = 0, coals = false;

function layout() {
  const b = CF.L.bench;
  box = { x: b.x + 58*b.k, y: b.y - 21 };
  home = { x: b.x - 22*b.k, y: b.y - 6 };
  $('sigMatch').setAttribute('transform', `translate(${home.x - 18},${home.y})`);
  $('sigStrike').setAttribute('transform', `translate(${box.x},${box.y + 4})`);
  if (!m.held && !m.moving && !m.gone) { m.x = home.x; m.y = home.y; }
}
CF.onLayout(layout);

/* ---------- interaction ---------- */
const canTouch = () => CF.step === 3 && !m.moving && !m.gone;
matchEl.addEventListener('pointerdown', e => {
  if (!canTouch()) return;
  e.preventDefault(); matchEl.setPointerCapture(e.pointerId);
  m.held = true; matchEl.classList.add('held');
  const p = CF.toSvg(e); m.ox = m.x - p.x; m.oy = m.y - p.y; m.tx = m.x; m.ty = m.y; m.px = m.x; m.py = m.y;
  // On contact: pop + squash, tip head up
  tween(m, { sx: 1.18, sy: 0.75 }, 90, E.out, { done: () => tween(m, { sx: 1, sy: 1 }, 600, E.elastic) });
  tween(m, { lift: 16 }, 320, E.back);
  tween(m, { base: -32 }, 520, E.elastic);
});
matchEl.addEventListener('pointerenter', () => { if (canTouch() && !m.held) tween(m, { lift: 6 }, 240, E.back); });
matchEl.addEventListener('pointerleave', () => { if (canTouch() && !m.held) tween(m, { lift: 0 }, 260); });
S.addEventListener('pointermove', e => {
  if (!m.held) return;
  const p = CF.toSvg(e); m.tx = p.x + m.ox; m.ty = p.y + m.oy;
});
function release() {
  if (!m.held) return;
  m.held = false; matchEl.classList.remove('held');
  sendHome();
}
S.addEventListener('pointerup', release);
S.addEventListener('pointercancel', release);

function sendHome() {
  // Incorrect input: bounce back to the bench, wiggle "no"
  m.moving = true;
  const l0 = m.lift;
  tween(m, { base: 0 }, 520, E.out);
  tween(m, { x: home.x, y: home.y }, 560, E.out, {
    update: t => { m.lift = l0*(1-t) + Math.sin(Math.PI*t)*60; },
    done: () => {
      m.lift = 0; m.moving = false;
      tween(m, { sx: 1.22, sy: 0.78 }, 80, E.out, { done: () => tween(m, { sx: 1, sy: 1 }, 600, E.elastic) });
      CF.shake(m, 'lean', 10);
    } });
}

function ignite() {
  m.lit = true; m.rub = 0;
  tween(m, { fl: 1 }, 700, E.elastic);
  fx.spark(m.hx, m.hy, 16, 4.5);
  tween(bx, { s: 1.15 }, 90, E.out, { done: () => tween(bx, { s: 1 }, 600, E.elastic) });
  CF.progress.set(3, .5);
}

function lightFire() {
  m.held = false; m.gone = true; matchEl.classList.remove('held'); matchEl.classList.add('gone');
  const f = CF.L.fire, tx = f.x, ty = f.y - 14;
  CF.flow.complete(3);
  tween(m, { x: tx + 46*Math.cos(m.base*Math.PI/180), y: ty + 46*Math.sin(m.base*Math.PI/180), lift: 0 }, 280, E.inOut, {
    done: () => {
      tween(m, { op: 0, sx: .6, sy: .6, fl: 0 }, 320, E.out);
      fx.smoke(tx, ty - 10);
      tween(fireS, { s: 1 }, 1300, E.elastic);
      tween(fireS, { h: 1 }, 900, E.out);
      tween(CF.dusk, { light: 1 }, 1100, E.out);
      CF.wood.lit(true);
      fx.ring(0, 4, 50, $('lightFx'));
      fx.spark(tx, ty - 20, 22, 5);
      CF.rocks.hopWave();
    } });
}

/* ---------- ending: the fire burns down to embers ---------- */
function burnDown() {
  coals = true;
  tween(fireS, { s: 0 }, 9000, E.inOut);
  tween(fireS, { h: .3 }, 9000, E.inOut);
  tween(CF.dusk, { light: .4 }, 9000, E.inOut);
  CF.wood.burnDown();
  const f = CF.L.fire;
  const wisp = () => { fx.smoke(f.x + (Math.random() - .5) * 30, f.y - 16); CF.later(wisp, 2800 + Math.random()*1800, true); };
  CF.later(wisp, 6000, true);
}

/* Signifier: the match hops on the bench when it becomes active (Matches study entrance) */
function activate() {
  m.moving = true;
  tween(m, { lift: 110, base: -60 }, 300, E.out, { done: () => {
    tween(m, { base: 0 }, 900, E.elastic);
    tween(m, { lift: 0 }, 760, E.bounce, { done: () => { m.moving = false;
      tween(m, { sx: 1.2, sy: .8 }, 70, E.out, { done: () => tween(m, { sx: 1, sy: 1 }, 500, E.elastic) }); } });
  } });
}

function reset() {
  coals = false; lastNo = 0;
  Object.assign(m, { held: false, gone: false, lit: false, rub: 0, lean: 0 });
  matchEl.classList.remove('held', 'gone');
  bx.s = 1; bx.j = 0; logsW.r = 0;
  tween(fireS, { s: 0, h: 0 }, 280, E.out);
  m.moving = true;
  tween(m, { x: home.x, y: home.y, lift: 0, base: 0, fl: 0, op: 1, sx: 1, sy: 1 }, 600, E.inOut,
    { done: () => { m.moving = false; } });
}

/* ---------- frame ---------- */
const bigP = [...$('bigFlame').children], smallP = [...$('matchFlame').children];
function frame(now) {
  const t = now / 1000, f = CF.L.fire;

  if (m.held) {
    m.x += (m.tx - m.x) * 0.3; m.y += (m.ty - m.y) * 0.3;
    const vx = m.x - m.px; m.px = m.x; m.py = m.y;
    const target = Math.max(-28, Math.min(28, vx * 2));
    m.lean += (target - m.lean) * 0.2;
    if (!reduce) m.lift = 16 + Math.sin(t*5.5) * 3;
  }
  const rot = (m.base + m.lean) * Math.PI / 180;
  const hxp = m.hx, hyp = m.hy;
  m.hx = m.x - 46*Math.cos(rot); m.hy = m.y - m.lift - 46*Math.sin(rot);

  if (m.held && CF.step === 3) {
    if (!m.lit) {
      // During: head rubbing across the striker throws sparks
      const inStrike = m.hx > box.x - 52 && m.hx < box.x + 52 && m.hy > box.y - 16 && m.hy < box.y + 26;
      const d = Math.hypot(m.hx - hxp, m.hy - hyp);
      if (inStrike && d > 0.6) {
        m.rub += d;
        if (Math.random() < Math.min(1, d / 6)) fx.spark(m.hx, m.hy, 1 + (d > 8 ? 2 : 0), 2.4);
        bx.j = Math.min(3, d * 0.4);
        if (m.rub > 110) ignite();
      } else { m.rub *= 0.985; bx.j *= 0.8; }
    } else bx.j *= 0.8;
    // Contact with the fire
    const fd = Math.hypot(m.hx - f.x, m.hy - (f.y - 8));
    if (fd < 70) {
      if (m.lit) lightFire();
      else if (now - lastNo > 900) { lastNo = now; CF.shake(logsW, 'r', 5, 500); }
    }
  } else bx.j *= 0.8;

  // match
  matchEl.setAttribute('transform', `translate(${m.x},${m.y - m.lift}) rotate(${m.base + m.lean}) scale(${m.sx},${m.sy})`);
  matchEl.setAttribute('opacity', m.op);
  $('matchFlame').setAttribute('transform', `translate(-50,-2) rotate(${-(m.base + m.lean)}) scale(${m.fl})`);
  if (m.fl > 0.001) { smallP[0].setAttribute('d', flameD(30, 17, t*1.6*F, 1, 4*F)); smallP[1].setAttribute('d', flameD(15, 8, t*1.9*F, 2, 2*F)); }

  // matchbox jiggle
  const jx = (Math.random() - .5) * bx.j, jy = (Math.random() - .5) * bx.j;
  $('boxWrap').setAttribute('transform', `translate(${box.x + jx},${box.y + jy}) scale(${bx.s})`);

  // logs wobble around the pit centre
  $('fireLogsWrap').setAttribute('transform', `rotate(${logsW.r} ${f.x} ${f.y})`);

  // campfire flame (layered ribbons)
  if (fireS.s > 0.001) {
    const s = fireS.s;
    bigP[0].setAttribute('d', flameD(150*s, 96*s, t*F, 0, 14*F*s));
    bigP[1].setAttribute('d', flameD(112*s, 66*s, t*1.2*F, 1.7, 10*F*s));
    bigP[2].setAttribute('d', flameD(70*s, 36*s, t*1.45*F, 3.1, 6*F*s));
    if (!reduce && Math.random() < 0.18 * s && fx.emberCount < 18) fx.ember((Math.random()-.5)*40, -30);
  } else bigP.forEach(p => p.setAttribute('d', ''));
  // glowing coals keep shedding the odd ember
  if (coals && !reduce && Math.random() < 0.035 && fx.emberCount < 8) fx.ember((Math.random()-.5)*50, -4, 1.8, 0.016);
  $('halo').setAttribute('opacity', fireS.h * (0.85 + 0.15*F*Math.sin(t*7)));

  // signifiers
  $('sigMatch').classList.toggle('on', CF.step === 3 && !m.held && !m.moving && !m.gone);
  $('sigStrike').classList.toggle('on', CF.step === 3 && m.held && !m.lit);
  $('sigFire').classList.toggle('on', CF.step === 3 && m.lit && !m.gone);
}

CF.match = { activate, reset, frame, burnDown };
})();
