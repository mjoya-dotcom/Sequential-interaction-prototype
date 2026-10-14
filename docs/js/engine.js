/* Motion engine shared by every step: the tween + easing system from the
   Rocks and Matches studies, keyframe helpers that stand in for the Wood
   study's Web Animations, and tracked timers so Reset can cancel anything. */
(() => {
const CF = window.CF = {};
CF.NS = 'http://www.w3.org/2000/svg';
CF.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
CF.M = CF.reduce ? 0.35 : 1;   // duration multiplier
CF.F = CF.reduce ? 0.25 : 1;   // flame motion multiplier
CF.$ = id => document.getElementById(id);
CF.el = (tag, a, p) => { const n = document.createElementNS(CF.NS, tag);
  for (const k in a) n.setAttribute(k, a[k]); if (p) p.appendChild(n); return n; };

const E = CF.E = {
  lin: t => t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2,
  back: t => { const c = 1.9; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); },
  backSoft: t => { const c = 1.1; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); },
  elastic: t => t === 0 || t === 1 ? t : Math.pow(2,-10*t)*Math.sin((t*10-.75)*(2*Math.PI/3)) + 1,
  bounce: t => { const n=7.5625,d=2.75; if(t<1/d) return n*t*t; if(t<2/d) return n*(t-=1.5/d)*t+.75;
    if(t<2.5/d) return n*(t-=2.25/d)*t+.9375; return n*(t-=2.625/d)*t+.984375; },
};

let tweens = [];
CF.tween = (o, to, dur, ease = E.out, opts = {}) => {
  const keys = Object.keys(to);
  tweens = tweens.filter(w => !(w.o === o && w.keys.some(k => keys.includes(k))));
  const from = {}; keys.forEach(k => from[k] = o[k]);
  const w = { o, keys, from, to, dur: Math.max(1, dur*CF.M), t0: performance.now() + (opts.delay||0)*CF.M,
              ease, done: opts.done, update: opts.update };
  tweens.push(w); return w;
};
CF.stopTweens = () => { tweens = []; };
CF.stepTweens = now => {
  const fin = [];
  for (const w of tweens) {
    if (now < w.t0) continue;
    const t = Math.min(1, (now - w.t0) / w.dur), e = w.ease(t);
    for (const k of w.keys) w.o[k] = w.from[k] + (w.to[k] - w.from[k]) * e;
    if (w.update) w.update(t, e);
    if (t >= 1) fin.push(w);
  }
  if (fin.length) { tweens = tweens.filter(w => !fin.includes(w)); fin.forEach(w => w.done && w.done()); }
};

// Evenly spaced keyframes (Wood study's squish / wiggle / jiggle)
CF.keys = (o, frames, dur, ease = E.out, done) => {
  const ks = Object.keys(frames[0]), id = '__k' + ks.join('');
  const d = o[id] || (o[id] = { v: 0 }); d.v = 0;
  const n = frames.length - 1;
  return CF.tween(d, { v: 1 }, dur, E.lin, { done, update: t => {
    const p = Math.max(0, Math.min(n, ease(t) * n)), i = Math.min(n - 1, Math.floor(p)), f = p - i;
    ks.forEach(k => o[k] = frames[i][k] + (frames[i+1][k] - frames[i][k]) * f);
  } });
};
// "No" head-shake (Rocks + Matches studies)
CF.shake = (o, key, amp, dur = 520) => {
  const id = '__sh' + key, d = o[id] || (o[id] = { v: 0 }); d.v = 0;
  CF.tween(d, { v: 1 }, dur, E.lin, { update: t => { o[key] = Math.sin(t*Math.PI*4) * amp * (1-t); } });
};

// Timers that Reset can cancel. raw = don't scale by reduced motion.
const timers = new Set();
CF.later = (fn, ms, raw) => { const id = setTimeout(() => { timers.delete(id); fn(); }, raw ? ms : ms * CF.M);
  timers.add(id); return id; };
CF.clearLater = () => { timers.forEach(clearTimeout); timers.clear(); };
})();
