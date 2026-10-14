/* Scene layout: one SVG coordinate system for every step.
   Landscape and portrait arrangements, like the studies. */
(() => {
const { el, $ } = CF;
const S = CF.S = $('scene'), wrap = $('wrap');

// Trees: flat versions of the Wood study's hiding spots. Local origin = base of trunk.
function tree(g) {
  el('ellipse', { class: 'shadow', cx: 0, cy: 0, rx: 64, ry: 8 }, g);
  el('rect', { class: 'trunk', x: -12, y: -184, width: 24, height: 186, rx: 10 }, g);
  [[-55,-180,48],[55,-185,50],[0,-215,72],[-12,-275,48],[32,-262,40]]
    .forEach(([cx, cy, r]) => el('circle', { class: 'canopy', cx, cy, r }, g));
  el('path', { class: 'canopy-hl', d: 'M-44,-262 C-36,-284 -14,-298 8,-296' }, g);
}
tree($('treeL')); tree($('treeR'));

const LANDSCAPE = {
  W: 860, H: 520,
  fire: { x: 430, y: 360 }, pile: { x: 215, y: 440 },
  treeL: { x: 100, y: 470, k: .9 }, treeR: { x: 772, y: 470, k: .9 },
  bench: { x: 665, y: 440, k: 1 }, bubble: { x: 430, y: 150, r: 64 },
  floorA: { x: 322, y: 488 }, floorB: { x: 505, y: 498 }, progress: { x: 430, y: 30 },
};
const PORTRAIT = {
  W: 440, H: 760,
  fire: { x: 220, y: 430 }, pile: { x: 108, y: 652 },
  treeL: { x: 70, y: 330, k: .62 }, treeR: { x: 370, y: 330, k: .62 },
  bench: { x: 305, y: 652, k: .74 }, bubble: { x: 220, y: 156, r: 56 },
  floorA: { x: 62, y: 522 }, floorB: { x: 378, y: 540 }, progress: { x: 220, y: 30 },
};

const L = CF.L = {};
const subs = [];
CF.onLayout = fn => subs.push(fn);

function layout() {
  const r = wrap.clientWidth / Math.max(1, wrap.clientHeight);
  Object.assign(L, JSON.parse(JSON.stringify(r < 0.95 ? PORTRAIT : LANDSCAPE)));
  S.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`);
  const at = (id, p, k = 1) => $(id).setAttribute('transform', `translate(${p.x},${p.y})` + (k !== 1 ? ` scale(${k})` : ''));
  at('treeL', L.treeL, L.treeL.k); at('treeR', L.treeR, L.treeR.k);
  at('bench', L.bench, L.bench.k);
  at('pit', L.fire); at('light', L.fire);
  at('progress', L.progress);
  L.duskK = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dusk-k')) || 1;
  subs.forEach(fn => fn());
}
CF.layout = layout;

CF.toSvg = e => { const p = S.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(S.getScreenCTM().inverse()); };

CF.startLayout = () => {
  layout();
  new ResizeObserver(layout).observe(wrap);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', layout);
};
})();
