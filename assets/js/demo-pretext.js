import { prepare, layout } from './vendor/pretext.js';

const canvas   = document.getElementById('demoCanvas');
const ctx      = canvas.getContext('2d');
const subtitle = document.getElementById('demoSubtitle');
const metrics  = document.getElementById('demoMetrics');
const replay   = document.getElementById('replayBtn');

const W = Math.min(window.innerWidth * 0.86, 500);
const H = 360;
canvas.width  = W;
canvas.height = H;

const fontSize   = Math.min(W, H) * 0.72;
const fontString = `900 ${fontSize}px Arial Black, Arial, sans-serif`;

let rafId = null;
let mouse = { x: -999, y: -999 };

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

async function initDemo() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  subtitle.classList.remove('visible');
  metrics.classList.remove('visible');
  ctx.clearRect(0, 0, W, H);

  await document.fonts.load(fontString, 'P');

  const handle   = prepare('P', fontString);
  const ptResult = layout(handle, W, fontSize * 1.2);
  const offsetY  = Math.max(0, (H - ptResult.height) / 2);

  metrics.textContent =
    `pretext.js  →  height: ${Math.round(ptResult.height)}px · lines: ${ptResult.lineCount} · centreY: ${Math.round(offsetY)}px`;

  const off    = document.createElement('canvas');
  off.width    = W;
  off.height   = H;
  const offCtx = off.getContext('2d');

  offCtx.fillStyle    = '#ffffff';
  offCtx.font         = fontString;
  offCtx.textAlign    = 'center';
  offCtx.textBaseline = 'top';
  offCtx.fillText('P', W / 2, offsetY);

  const { data } = offCtx.getImageData(0, 0, W, H);
  const targets  = [];
  const STEP     = 10;

  for (let y = 0; y < H; y += STEP)
    for (let x = 0; x < W; x += STEP)
      if (data[((y * W + x) * 4) + 3] > 120)
        targets.push({ x, y });

  if (targets.length === 0) {
    ctx.fillStyle    = '#6366f1';
    ctx.font         = '16px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('font not ready — click Replay', W / 2, H / 2);
    return;
  }

  targets.sort(() => Math.random() - 0.5);

  const GS      = STEP * 1.4;
  const MAX_DEL = 1500;

  const particles = targets.map(t => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * 5,
    vy: (Math.random() - 0.5) * 5,
    tx: t.x, ty: t.y,
    delay:    Math.random() * MAX_DEL,
    settled:  false,
    alpha:    0,
    bobPhase: Math.random() * Math.PI * 2,
    bobSpeed: 0.7 + Math.random() * 0.8,
    bobAmp:   1.5 + Math.random() * 2.0,
  }));

  const sparkles = Array.from({ length: 45 }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    r:     0.6 + Math.random() * 2.2,
    phase: Math.random() * Math.PI * 2,
    speed: 0.12 + Math.random() * 0.55,
  }));

  let glowPulse  = 0;
  let allSettled = false;
  const START    = performance.now();

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const elapsed   = now - START;
    const t         = elapsed / 1000;
    let   unsettled = 0;

    for (const s of sparkles) {
      s.phase += 0.018 * s.speed;
      ctx.globalAlpha = (Math.sin(s.phase) * 0.5 + 0.5) * 0.55;
      ctx.fillStyle   = '#6366f1';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font         = `${GS}px serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    for (const p of particles) {
      if (elapsed < p.delay) { unsettled++; continue; }

      const mdx   = p.x - mouse.x;
      const mdy   = p.y - mouse.y;
      const mdist = Math.hypot(mdx, mdy);
      const REPEL = 72;
      if (mdist < REPEL && mdist > 0) {
        const force = (REPEL - mdist) / REPEL * 5.5;
        p.vx += (mdx / mdist) * force;
        p.vy += (mdy / mdist) * force;
        p.settled = false;
      }

      if (!p.settled) {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        if (Math.hypot(dx, dy) < 1.5 && mdist >= REPEL) {
          p.x = p.tx; p.y = p.ty; p.settled = true;
        } else {
          p.vx = p.vx * 0.80 + dx * 0.09;
          p.vy = p.vy * 0.80 + dy * 0.09;
          p.x += p.vx;
          p.y += p.vy;
          unsettled++;
        }
        p.alpha = Math.min(1, p.alpha + 0.08);
      }

      const bobY = p.settled ? Math.sin(t * p.bobSpeed + p.bobPhase) * p.bobAmp : 0;
      ctx.globalAlpha = p.alpha;
      ctx.fillText('👻', p.x - GS / 2, p.y - GS / 2 + bobY);
    }

    ctx.globalAlpha = 1;

    if (unsettled === 0 && !allSettled) {
      allSettled = true;
      subtitle.classList.add('visible');
      metrics.classList.add('visible');
    }

    if (allSettled) {
      glowPulse += 0.02;
      const pulse = 0.13 + 0.07 * Math.sin(glowPulse);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const gr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.54);
      gr.addColorStop(0,   `rgba(99,102,241,${pulse})`);
      gr.addColorStop(0.5, `rgba(34,211,162,${pulse * 0.35})`);
      gr.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);
}

async function safeInit() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle    = 'rgba(99,102,241,0.5)';
  ctx.font         = '14px Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('loading…', W / 2, H / 2);
  try {
    await initDemo();
  } catch (err) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle    = '#f87171';
    ctx.font         = '13px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('error: ' + err.message, W / 2, H / 2);
    console.error('demo error:', err);
  }
}

replay.addEventListener('click', safeInit);
document.fonts.ready.then(safeInit);
