/* Particles + one-shot effects: sparks, embers, smoke (Matches), dust puff (Rocks), pulse rings (Wood/Matches). */
(() => {
const { el, $, tween, E } = CF;
const sparks = [], embers = [];

CF.fx = {
  spark(x, y, n, spd = 3) {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI/2 + (Math.random() - .5) * 2.4, v = spd * (0.5 + Math.random());
      sparks.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: 1, r: 1.5 + Math.random()*2.2,
                    n: el('circle', { class: 'spark' }, $('sparks')) });
    }
  },
  // pit-local coordinates (the #embers layer is translated to the fire)
  ember(x, y, size = 2.6, rate = 0.012) {
    embers.push({ x, y, vy: -(0.8 + Math.random()*1.1), ph: Math.random()*6, life: 1, size, rate,
                  n: el('circle', { class: 'ember' }, $('embers')) });
  },
  get emberCount() { return embers.length; },
  // flattened ring (Matches)
  ring(x, y, r0, parent) {
    const e = el('ellipse', { class: 'ring', cx: x, cy: y }, parent), o = { k: 0 };
    tween(o, { k: 1 }, 560, E.out, { update: (t, v) => { const r = r0 + v*r0*1.4;
      e.setAttribute('rx', r); e.setAttribute('ry', r*.45); e.setAttribute('opacity', .7*(1-v)); }, done: () => e.remove() });
  },
  // round expanding ring (Wood)
  pulse(x, y, size, dur = 520) {
    const e = el('circle', { class: 'ring', cx: x, cy: y }, $('fxWorld')), o = { k: 0 };
    tween(o, { k: 1 }, dur, E.out, { update: (t, v) => { e.setAttribute('r', size/2 * (.2 + .8*v));
      e.setAttribute('opacity', 1 - v); }, done: () => e.remove() });
  },
  // dust puff on landing (Rocks), pit-local
  puff(x, y) {
    const e = el('ellipse', { class: 'puff', cx: x, cy: y + 12, rx: 24, ry: 8, opacity: .6 }, $('pitFx')), o = { k: 0 };
    tween(o, { k: 1 }, 520, E.out, { update: (t, v) => { e.setAttribute('rx', 24 + v*22); e.setAttribute('ry', 8 + v*7);
      e.setAttribute('opacity', .6*(1-v)); }, done: () => e.remove() });
  },
  smoke(x, y) {
    for (let k = 0; k < 2; k++) {
      const p = el('path', { class: 'smoke' }, $('smoke')), o = { k: 0 }, off = k ? 12 : -10;
      tween(o, { k: 1 }, 1400, E.out, { update: (t, v) => {
        let d = ''; for (let i = 0; i <= 12; i++) { const s = i/12, yy = y - s*70*v - 10*v;
          const xx = x + off + Math.sin(s*6 + v*5 + k)*10*s; d += (i ? ' L' : 'M') + xx.toFixed(1) + ',' + yy.toFixed(1); }
        p.setAttribute('d', d); p.setAttribute('opacity', .8*(1-v)); }, done: () => p.remove() });
    }
  },
  frame(t) {
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i]; e.y += e.vy; e.life -= e.rate;
      e.n.setAttribute('cx', e.x + Math.sin(t*3 + e.ph + e.y*0.04) * 10); e.n.setAttribute('cy', e.y);
      e.n.setAttribute('r', Math.max(0, e.size * e.life)); e.n.setAttribute('opacity', Math.max(0, e.life));
      if (e.life <= 0) { e.n.remove(); embers.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.16; s.vx *= 0.97; s.life -= 0.035;
      s.n.setAttribute('cx', s.x); s.n.setAttribute('cy', s.y); s.n.setAttribute('r', Math.max(0, s.r * s.life));
      if (s.life <= 0) { s.n.remove(); sparks.splice(i, 1); }
    }
  },
  clear() {
    sparks.splice(0).forEach(s => s.n.remove()); embers.splice(0).forEach(e => e.n.remove());
    ['smoke', 'pitFx', 'fxWorld', 'lightFx'].forEach(id => $(id).innerHTML = '');
  },
};
})();
