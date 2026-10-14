/* Sequence controller: one linear path, Rocks → Collect wood → Stack wood → Match.
   The next step unlocks only after the current one succeeds. Also owns the
   progress dots, the dusk that deepens with each step, Reset and the render loop. */
(() => {
const { el, $, tween, E } = CF;
const S = CF.S;

/* ---------- progress: one dot per step, filling as the step advances ---------- */
const progG = $('progress');
const dots = [0, 1, 2, 3].map(i => {
  const cx = (i - 1.5) * 22;
  const c = el('circle', { class: 'dot', r: 5, cx, cy: 0 }, progG);
  const f = el('circle', { class: 'dot-fill', r: 5, cx, cy: 0 }, progG);
  return { c, f, cx, p: 0, s: 1 };
});
CF.progress = {
  set(i, frac) { tween(dots[i], { p: frac }, 300, E.out); },
  done(i) { const d = dots[i]; d.c.classList.add('on'); d.p = 1; d.s = .2; tween(d, { s: 1 }, 700, E.elastic);
    progG.setAttribute('aria-valuenow', i + 1); },
  current(i) { dots.forEach((d, k) => d.c.classList.toggle('cur', k === i)); },
  reset() { dots.forEach(d => { d.c.classList.remove('on', 'cur'); tween(d, { p: 0 }, 400, E.out); d.s = 1; });
    progG.setAttribute('aria-valuenow', 0); },
  frame() { dots.forEach(d => d.f.setAttribute('transform',
    `translate(${d.cx},0) scale(${Math.max(0, d.p * d.s)}) translate(${-d.cx},0)`)); },
};

/* ---------- dusk ---------- */
const DUSK = [0, .14, .26, .38, .52, .64];   // after each completed step; last = burnt down
CF.dusk = { d: 0, light: 0 };
const duskEl = $('dusk'), hole = $('duskHole');

/* ---------- steps ---------- */
const STATUS = [
  'Step 1 of 4: drag the four rocks from the pile into a ring around the fire pit.',
  'Step 2 of 4: find the six glowing pieces of wood and tap each one to collect it.',
  'Step 3 of 4: drag each piece of wood from the bubble into the ring of rocks.',
  'Step 4 of 4: pick up the match, rub its head across the striker on the matchbox until it lights, then touch it to the wood.',
  'The fire is lit.',
];
const ACTIVATE = [
  () => CF.rocks.activate(),
  () => CF.wood.activateCollect(),
  () => CF.wood.activateStack(),
  () => CF.match.activate(),
  () => CF.later(() => { CF.match.burnDown(); tween(CF.dusk, { d: DUSK[5] }, 9000, E.inOut);
    $('status').textContent = 'The fire has burned down to embers. Press Reset to build it again.'; }, 20000, true),
];
CF.step = -1;
function start(i) {
  CF.step = i; S.dataset.step = i;
  CF.progress.current(i);
  $('status').textContent = STATUS[i];
  ACTIVATE[i]();
}
CF.flow = {
  complete(i) {
    if (CF.step !== i) return;
    CF.step = -1; S.dataset.step = '-';
    CF.progress.done(i);
    tween(CF.dusk, { d: DUSK[i + 1] }, 1200, E.inOut);
    if (i === 3) start(4); else CF.later(() => start(i + 1), 650);
  },
};

function reset() {
  CF.stopTweens(); CF.clearLater(); CF.fx.clear();
  CF.step = -1; S.dataset.step = '-';
  CF.rocks.reset(); CF.wood.reset(); CF.match.reset(); CF.progress.reset();
  tween(CF.dusk, { d: 0, light: 0 }, 900, E.inOut);
  $('status').textContent = '';
  CF.later(() => start(0), 1000);
}
$('reset').addEventListener('click', reset);

/* ---------- render loop ---------- */
function frame(now) {
  CF.stepTweens(now);
  const t = now / 1000;
  CF.rocks.frame(now); CF.wood.frame(now); CF.match.frame(now);
  CF.fx.frame(t); CF.progress.frame();
  const L = CF.L, li = CF.dusk.light;
  duskEl.setAttribute('opacity', Math.min(1, CF.dusk.d * L.duskK));
  hole.setAttribute('cx', L.fire.x); hole.setAttribute('cy', L.fire.y - 30);
  hole.setAttribute('r', (150 + 190 * li) * (1 + .03 * CF.F * Math.sin(t * 7)));
  hole.setAttribute('opacity', Math.min(1, li));
  requestAnimationFrame(frame);
}

CF.startLayout();
requestAnimationFrame(frame);
start(0);
})();
