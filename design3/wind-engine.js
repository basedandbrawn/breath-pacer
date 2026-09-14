/* Wind Bender — pacer + wind field renderer.
   Implements SPEC §4-6 (session model), §11 (frame-state contract) and a
   2D-canvas realisation of §13's fallback renderer, extended with the
   phase characters defined in the motion spec. No audio (prototype). */
(function () {
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  const MODES = {
    drive: { key: 'drive', name: 'DRIVE', rest: 120, reps: 10,
      seq: [['in', 3, 'LOWER'], ['hold', 1, 'HOLD'], ['out', 2, 'LIFT']],
      note: 'Air in on the way down, then push. Squats, presses, hinges.' },
    squeeze: { key: 'squeeze', name: 'SQUEEZE', rest: 90, reps: 12,
      seq: [['out', 1, 'LIFT'], ['empty', 2, 'HOLD'], ['in', 3, 'LOWER']],
      note: 'Breathe out into the top and stay there. Rows, flies, curls.' },
    stretch: { key: 'stretch', name: 'STRETCH', rest: 90, reps: 10,
      seq: [['in', 3, 'LOWER'], ['hold', 2, 'HOLD'], ['out', 2, 'LIFT']],
      note: 'Long pause at the bottom, air in, soft. Flies, pullovers.' },
    heavy: { key: 'heavy', name: 'HEAVY', rest: 180, reps: 5,
      seq: [['in', 2, 'HOLD'], ['hold', 2, 'LOWER'], ['hold', 1, 'LIFT'], ['out', 1, 'HOLD']],
      note: 'One held breath for the whole rep. Five reps or fewer.' }
  };

  const PATTERNS = {
    '478': { key: '478', name: 'SETTLE', corner: 'long way out', cycle: 19,
      seq: [['in', 4], ['hold', 7], ['out', 8]], fields: [['in', 4], ['hold', 7], ['out', 8]] },
    coh: { key: 'coh', name: 'EVEN', corner: 'same in, same out', cycle: 11,
      seq: [['in', 5.5], ['out', 5.5]], fields: [['in', 5.5], ['out', 5.5]] }
  };

  function trimTo(arr, total) {
    let acc = 0, out = [];
    for (const s of arr) {
      if (acc + s.dur > total) { const r = total - acc; if (r > 0.001) out.push(Object.assign({}, s, { dur: r })); break; }
      out.push(s); acc += s.dur;
    }
    if (out.length > 1 && out[out.length - 1].dur < 0.4) out.pop();
    return out;
  }

  function coherentSteps(seconds, set, sets) {
    const n = Math.ceil(seconds / 11) * 2 + 2, a = [];
    for (let i = 0; i < n; i++) a.push({ k: i % 2 ? 'out' : 'in', dur: 5.5, stage: 'rest', set, sets, rep: 0, mv: 'REST' });
    return trimTo(a, seconds);
  }

  function buildLift(modeKey, reps, sets) {
    const m = MODES[modeKey] || MODES.drive, steps = [];
    for (let s = 1; s <= sets; s++) {
      steps.push({ k: 'getset', dur: 3, stage: 'getset', set: s, sets, rep: 0, reps, mv: 'READY' });
      for (let r = 1; r <= reps; r++)
        for (const [k, dur, mv] of m.seq) if (dur > 0) steps.push({ k, dur, stage: 'set', set: s, sets, rep: r, reps, mv });
      if (s < sets) for (const st of coherentSteps(m.rest, s, sets)) steps.push(Object.assign({ reps }, st));
    }
    steps.push({ k: 'done', dur: 1e9, stage: 'done', set: 0, sets, rep: 0, reps, mv: 'DONE' });
    return steps;
  }

  function buildBreathe(patKey, cycles) {
    const p = PATTERNS[patKey] || PATTERNS['478'], steps = [];
    for (let r = 1; r <= cycles; r++)
      for (const [k, dur] of p.seq) steps.push({ k, dur, stage: 'set', set: 1, sets: 1, rep: r, reps: cycles, mv: '' });
    steps.push({ k: 'done', dur: 1e9, stage: 'done', set: 0, sets: 1, rep: 0, reps: cycles, mv: 'DONE' });
    return steps;
  }

  const IDLE = [{ k: 'idle', dur: 1e9, stage: 'idle', set: 0, sets: 0, rep: 0, reps: 0, mv: '' }];

  class Pacer {
    constructor() {
      this.steps = IDLE; this.i = 0; this.t0 = this.now(); this.turb = 0;
      this.lift = true; this.dimMode = 1; this.tap = null; this.pin = null;
      this.mirror = null; this.tapOn = false; this.bellyOn = false; this.flash = -9;
    }
    now() { return performance.now() / 1000; }
    load(steps, opts) {
      this.steps = steps; this.i = 0; this.t0 = this.now();
      this.lift = !(opts && opts.breathe); this.dimMode = opts && opts.breathe ? 0.72 : 1;
    }
    idle() { this.steps = IDLE; this.i = 0; this.t0 = this.now(); }
    advance() {
      let g = 0;
      while (this.i < this.steps.length - 1 && this.now() >= this.t0 + this.steps[this.i].dur && g++ < 400) {
        this.t0 += this.steps[this.i].dur; this.i++;
      }
    }
    seek(test) {
      for (let j = 0; j < this.steps.length; j++) if (test(this.steps[j], j)) { this.i = j; this.t0 = this.now(); return true; }
      return false;
    }
    poke(x, y, k) { this.tap = { x, y, k: k == null ? 1 : k, t: this.now() }; this.flash = this.now(); }
    hold(x, y) { this.pin = { x, y }; }
    release() { this.pin = null; }
    scatter(miss) { this.turb = Math.min(1, this.turb + miss * 0.5); }
    frame() {
      this.advance();
      const t = this.now(), s = this.steps[this.i];
      const dur = s.dur, into = clamp(t - this.t0, 0, dur === 1e9 ? 1e9 : dur);
      const prog = dur > 0 && dur < 1e8 ? clamp(into / dur, 0, 1) : 0;
      this.turb *= Math.pow(0.88, Math.min(0.25, t - (this._lt || t))); this._lt = t;
      const st = {
        phase: s.k, stage: s.stage, prog, into, dur, mv: s.mv,
        set: s.set, sets: s.sets, rep: s.rep, reps: s.reps,
        fill: 0, flow: 0, gust: 0, amp: 0.14, still: false, pulse: 0,
        turb: this.turb, temp: 0.15, dim: this.dimMode, rim: 0,
        tapX: 0, tapY: 0, tapK: 0, pinX: 0, pinY: 0, pinK: 0,
        idle: s.k === 'idle', lift: this.lift, mirrorK: 0
      };
      const sp = Math.max(0, Math.sin(prog * Math.PI));
      const bell = Math.pow(sp, 0.7) * clamp(2.2 / Math.max(0.35, dur), 1, 1.8);
      if (s.k === 'idle') {
        st.fill = 0.28 + 0.12 * Math.sin(t * 0.35); st.amp = 0.2; st.flow = 0.04 * Math.sin(t * 0.35);
      } else if (s.k === 'done') {
        st.flow = -0.9 * Math.exp(-into / 2.5); st.gust = Math.exp(-into / 0.6);
        st.fill = 0.6 * Math.exp(-into / 3); st.amp = 0.5 * Math.exp(-into / 2);
      } else {
        if (s.k === 'in') { st.fill = eio(prog); st.flow = bell; }
        else if (s.k === 'out') { st.fill = 1 - eio(prog); st.flow = -bell; }
        else if (s.k === 'hold') { st.fill = 1; st.still = true; }
        else if (s.k === 'empty') { st.fill = 0; st.still = true; }
        else if (s.k === 'getset') { st.fill = 0.15 * (1 - prog); }
        if (s.stage === 'rest') st.flow *= 0.45;
        if (s.k === 'in' || s.k === 'out') st.gust = Math.exp(-into / 0.3);
        st.amp = st.still ? 0.2 : Math.max(0.12, Math.min(1, bell) * 0.75);
        if (s.k === 'getset') st.amp = 0.1 + 0.35 * prog;
        if (st.still && into >= 1) st.pulse = Math.exp(-(into % 1) / 0.12);
        st.amp += 0.12 * st.pulse;
        st.temp = s.stage === 'rest' ? 0.5 : s.reps > 1 && s.rep ? (s.rep - 1) / (s.reps - 1) : 0.15;
      }
      if (this.mirror && this.mirror.conf > 0.35) {
        const m = this.mirror;
        st.fill = m.fill; st.flow = m.flow; st.amp = Math.max(0.15, Math.abs(m.flow) * 0.8);
        st.mirrorK = m.conf; st.still = false;
      }
      if (this.tap) {
        const age = t - this.tap.t;
        if (age < 0.9) { st.tapX = this.tap.x; st.tapY = this.tap.y; st.tapK = this.tap.k * Math.exp(-age / 0.2); }
        else this.tap = null;
      }
      if (this.pin) { st.pinX = this.pin.x; st.pinY = this.pin.y; st.pinK = 1; }
      st.rim = 0.09 * st.fill + 0.16 * st.pulse + (st.still ? 0.04 : 0);
      st.flash = Math.max(0, 1 - (t - this.flash) / 0.35);
      return st;
    }
    /* SPEC §12 — what the run screen says, with the audited vocabulary */
    words(st) {
      const brk = { in: 'breathe in', out: 'breathe out', hold: 'hold it in', empty: 'still going out', getset: 'breathe in' };
      let head = st.mv || '', line = brk[st.phase] || '';
      if (!this.lift) { head = st.phase === 'in' ? 'IN' : st.phase === 'out' ? 'OUT' : st.phase === 'hold' ? 'HOLD' : st.phase === 'empty' ? 'OUT' : head; line = ''; }
      if (st.stage === 'rest') { head = 'REST'; line = st.phase === 'in' ? 'breathe in' : 'breathe out'; }
      if (st.phase === 'getset') head = 'READY';
      if (st.phase === 'done') { head = 'DONE'; line = ''; }
      let count = '1';
      if (st.stage === 'rest') {
        let rem = st.dur - st.into;
        for (let j = this.i + 1; j < this.steps.length && this.steps[j].stage === 'rest'; j++) rem += this.steps[j].dur;
        const m = Math.floor(rem / 60), sec = Math.max(0, Math.floor(rem % 60));
        count = m + ':' + String(sec).padStart(2, '0');
      } else if (st.phase === 'done') count = '';
      else count = String(Math.max(1, Math.min(Math.ceil(st.dur - st.into), Math.ceil(st.dur))));
      let meta = '';
      if (st.phase === 'done') meta = 'SESSION COMPLETE';
      else if (st.stage === 'rest') meta = 'REST \u00b7 SET ' + st.set + '/' + st.sets;
      else if (this.lift) meta = 'SET ' + st.set + '/' + st.sets + (st.rep ? ' \u00b7 REP ' + st.rep + '/' + st.reps : ' \u00b7 COUNT-IN');
      else meta = 'BREATH ' + st.rep + '/' + st.reps + (this.tapOn ? ' \u00b7 TAP' : '') + (this.bellyOn ? ' \u00b7 BELLY' : '');
      return { head, line, count, meta };
    }
    rail(st) {
      const segs = [];
      if (st.stage === 'set' && st.rep) {
        let j = this.i; while (j > 0 && this.steps[j - 1].stage === 'set' && this.steps[j - 1].rep === st.rep) j--;
        let k = j; while (k < this.steps.length && this.steps[k].stage === 'set' && this.steps[k].rep === st.rep) k++;
        const total = this.steps.slice(j, k).reduce((a, s) => a + s.dur, 0);
        for (let q = j; q < k; q++) segs.push({ w: this.steps[q].dur / total, f: q < this.i ? 1 : q === this.i ? st.prog : 0, k: this.steps[q].k });
      }
      return segs;
    }
  }

  /* ---------------- wind field (2D ribbons + luminance field) ---------------- */
  function attach(canvas, getState, opts) {
    opts = opts || {};
    const P = Object.assign({
      lines: 64, count: 0, density: 1, cx: 0.5, cy: 0.46,
      ground: '#0b0e11', inhale: '190,215,232', exhale: '120,138,178', ink: '235,240,244',
      gain: 1, overlay: null, maskEl: null, maskDraw: null, glow: 1, punch: true, avoid: false
    }, opts);
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let ps = [], last = performance.now() / 1000, raf = 0, live = true, t = 0, dtL = 1 / 60;
    let fb = null, fctx = null;
    let mask = null, mctx = null, maskKey = '', mdata = null;
    let hue = 1;
    const sprites = [];
    const nums = s => s.split(',').map(Number);
    const gRGB = (function (h) {
      const m = /^#?([0-9a-f]{6})$/i.exec(h);
      if (!m) return '11,15,19';
      const n = parseInt(m[1], 16);
      return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    })(P.ground);

    /* one soft volumetric puff, pre-tinted — density comes from stacking hundreds of these */
    function sprite(col) {
      const S = 64, c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d'), r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      r.addColorStop(0, 'rgba(' + col + ',0.9)');
      r.addColorStop(0.22, 'rgba(' + col + ',0.42)');
      r.addColorStop(0.46, 'rgba(' + col + ',0.15)');
      r.addColorStop(0.72, 'rgba(' + col + ',0.035)');
      r.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = r; g.fillRect(0, 0, S, S);
      return c;
    }
    (function () {
      const a = nums(P.exhale), b = nums(P.inhale);
      for (let i = 0; i < 10; i++) {
        const k = i / 9;
        sprites.push(sprite([0, 1, 2].map(j => Math.round(a[j] + (b[j] - a[j]) * k)).join(',')));
      }
    })();

    function size() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(40, r.width); H = Math.max(40, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!fb) { fb = document.createElement('canvas'); fctx = fb.getContext('2d'); }
      fb.width = Math.max(2, Math.round(W * 0.5)); fb.height = Math.max(2, Math.round(H * 0.5));
      fctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
      if (!mask) { mask = document.createElement('canvas'); mctx = mask.getContext('2d'); }
      mask.width = Math.max(2, Math.round(W / 2)); mask.height = Math.max(2, Math.round(H / 2));
      maskKey = '';
      seed();
    }
    function place(p, st) {
      const a = Math.random() * Math.PI * 2, R = Math.max(W, H) * 0.5;
      const outward = !st || st.flow >= 0;
      const r = (outward ? 0.55 + Math.random() * 0.65 : 0.02 + Math.random() * 0.45) * R;
      p.x = W * P.cx + Math.cos(a) * r; p.y = H * P.cy + Math.sin(a) * r;
      p.vx = p.vy = 0;
      p.max = 2.6 + Math.random() * 4.2; p.life = p.max * Math.random();
    }
    function seed() {
      const n = Math.max(90, Math.min(1100, Math.round((P.count || P.lines * 6) * P.density)));
      ps = [];
      for (let i = 0; i < n; i++) {
        const p = { x: 0, y: 0, vx: 0, vy: 0, s: 0.45 + Math.pow(Math.random(), 1.6) * 1.5, b: 0.5 + Math.random() * 1.1, max: 1, life: 1 };
        place(p, null);
        ps.push(p);
      }
    }
    /* DOM rect in engine CSS px relative to the canvas — survives a zoomed page */
    function rectOf(el) {
      const cr = canvas.getBoundingClientRect();
      const z = cr.width > 0 && W > 0 ? cr.width / W : 1;
      const r = el.getBoundingClientRect();
      return { left: (r.left - cr.left) / z, top: (r.top - cr.top) / z, width: r.width / z, height: r.height / z };
    }
    function buildMask() {
      if (P.maskDraw) {
        const spec = P.maskDraw(rectOf);
        if (spec) {
        const key = spec.key + '|' + Math.round(W) + '|' + Math.round(H);
        if (key === maskKey) return;
        maskKey = key;
        mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mask.width, mask.height);
        mctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
        mctx.strokeStyle = '#fff'; mctx.fillStyle = '#fff';
        spec.draw(mctx, W, H);
        try { mdata = mctx.getImageData(0, 0, mask.width, mask.height).data; } catch (e) { mdata = null; }
        return;
        }
      }
      if (!P.maskEl) { if (maskKey !== 'none') { maskKey = 'none'; mdata = null; } return; }
      const el = P.maskEl();
      if (!el) { maskKey = 'none'; mdata = null; return; }
      const cs = getComputedStyle(el), r = rectOf(el);
      const key = el.textContent + '|' + cs.font + '|' + Math.round(r.left) + '|' + Math.round(r.top) + '|' + W;
      if (key === maskKey) return;
      maskKey = key;
      mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mask.width, mask.height);
      mctx.scale(0.5, 0.5);
      mctx.font = cs.fontWeight + ' ' + cs.fontSize + '/' + cs.lineHeight + ' ' + cs.fontFamily;
      try { mctx.letterSpacing = cs.letterSpacing; } catch (e) {}
      mctx.textBaseline = 'top'; mctx.fillStyle = '#fff';
      mctx.fillText(el.textContent, r.left, r.top + parseFloat(cs.fontSize) * 0.05);
      try { mdata = mctx.getImageData(0, 0, mask.width, mask.height).data; } catch (e) { mdata = null; }
    }
    function maskAt(x, y) {
      if (!mdata) return 0;
      const mx = (x / 2) | 0, my = (y / 2) | 0;
      if (mx < 0 || my < 0 || mx >= mask.width || my >= mask.height) return 0;
      return mdata[(my * mask.width + mx) * 4 + 3] / 255;
    }
    const pot = (x, y) => Math.sin(x * 1.7 + Math.cos(y * 1.1)) + Math.sin(y * 2.3 - Math.cos(x * 0.8) * 1.3);

    function force(x, y, st, out) {
      const cx = W * P.cx, cy = H * P.cy, R = Math.max(W, H) * 0.55;
      let dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) + 0.001;
      const ux = dx / r, uy = dy / r, rn = r / R;
      const fall = Math.exp(-rn * rn * 0.85);
      const mag = st.flow * (0.6 + 0.9 * st.amp) * (1 + 1.2 * st.gust) * P.gain;
      let rad = -mag * fall * 300;
      let spin = (st.flow >= 0 ? 1 : -1) * (0.22 + 0.6 * st.amp) * fall * 180 * (st.still ? 0.3 : 1) * P.gain;
      if (st.still) { spin = (st.phase === 'empty' ? -1 : 1) * (0.12 + 0.2 * st.fill) * fall * 90; }
      if (st.phase === 'getset') { rad = -(0.35 + 0.5 * st.prog) * fall * 150; spin += fall * 40; }
      const ring = st.pulse * (st.phase === 'empty' ? -26 : 90) * Math.exp(-Math.pow((r - R * (0.3 + 0.1 * st.fill)) / (R * 0.17), 2));
      const e = 0.9, s0 = 0.0055, tt = t * 0.05;
      const cu = (pot(x * s0, (y + e) * s0 + tt) - pot(x * s0, (y - e) * s0 + tt)) / (2 * e);
      const cv = -(pot((x + e) * s0, y * s0 + tt) - pot((x - e) * s0, y * s0 + tt)) / (2 * e);
      const wisp = (26 + 34 * st.amp + 90 * st.turb) * (st.still ? 0.6 : 1);
      const amb = fall * (26 + 34 * st.fill);
      let fx = ux * (rad + ring) - uy * (spin + amb) + cu * wisp;
      let fy = uy * (rad + ring) + ux * (spin + amb) + cv * wisp;
      if (st.phase === 'empty') fy += 34 + 40 * (1 - st.prog);
      if (st.tapK > 0) {
        const tx = x - st.tapX, ty = y - st.tapY, td = Math.hypot(tx, ty) + 1;
        const g = st.tapK * 2600 * Math.exp(-(td * td) / (2 * 70 * 70)) / td;
        fx += tx * g; fy += ty * g;
      }
      if (st.pinK > 0) {
        const px = x - st.pinX, py = y - st.pinY, pd = Math.hypot(px, py) + 1;
        const g = 900 * Math.exp(-(pd * pd) / (2 * 90 * 90)) / pd;
        fx -= px * g * 0.5; fy -= py * g * 0.5;
      }
      out[0] = isFinite(fx) ? fx : 0; out[1] = isFinite(fy) ? fy : 0;
    }

    const F = [0, 0];
    const hasMask = () => !!(P.maskEl || P.maskDraw);
    function step(dt, st) {
      const drag = Math.pow(0.5, dt / 0.5), R = Math.max(W, H), m = 0.26 * R;
      for (const p of ps) {
        force(p.x, p.y, st, F);
        p.vx = (p.vx + F[0] * dt * p.s) * drag;
        p.vy = (p.vy + F[1] * dt * p.s) * drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (P.avoid && mdata) {
          const a = maskAt(p.x, p.y);
          if (a > 0.45) {
            const gx = maskAt(p.x + 5, p.y) - maskAt(p.x - 5, p.y);
            const gy = maskAt(p.x, p.y + 5) - maskAt(p.x, p.y - 5);
            const gl = Math.hypot(gx, gy) + 0.001;
            const nx = -gx / gl, ny = -gy / gl;
            p.x += nx * 4 * a; p.y += ny * 4 * a;
            p.vx = p.vx * 0.55 + nx * 18 * a; p.vy = p.vy * 0.55 + ny * 18 * a;
          }
        }
        p.life -= dt;
        if (p.life <= 0 || p.x < -m || p.x > W + m || p.y < -m || p.y > H + m || !isFinite(p.x) || !isFinite(p.y)) place(p, st);
      }
    }

    function draw(st) {
      /* the hue is a tide, not a switch: ~600 ms to cross between indigo and cyan */
      const target = st.flow >= 0 ? 1 : 0;
      hue += (target - hue) * Math.min(1, dtL * 3.2);
      const ea = nums(P.exhale), eb = nums(P.inhale);
      const col = [0, 1, 2].map(j => Math.round(ea[j] + (eb[j] - ea[j]) * hue)).join(',');
      const si = Math.max(0, Math.min(9, Math.round(hue * 9)));

      /* cloud buffer: fade toward transparent, then stack soft puffs additively */
      const fade = 1 - Math.pow(0.5, dtL / (st.still ? 0.62 : 0.34));
      fctx.globalCompositeOperation = 'destination-out';
      fctx.fillStyle = 'rgba(0,0,0,' + fade.toFixed(4) + ')';
      fctx.fillRect(0, 0, W, H);
      fctx.globalCompositeOperation = 'lighter';
      const spr = sprites[si];
      const R0 = (11 + 13 * st.fill + 11 * st.amp) * (st.still ? 1.15 : 1);
      const lift = (0.016 + 0.034 * st.amp + 0.013 * st.fill) * st.dim;
      for (const p of ps) {
        const k = Math.min(1, p.life / 0.7) * Math.min(1, (p.max - p.life) / 0.7);
        if (k <= 0.01) continue;
        const r = R0 * p.s;
        fctx.globalAlpha = Math.min(0.5, lift * p.b * k);
        fctx.drawImage(spr, p.x - r, p.y - r, r * 2, r * 2);
      }
      fctx.globalAlpha = 1;
      /* the letterforms are cut straight out of the cloud — soft-edged, because the
         punch is a half-res shape scaled up, so it reads as air parting, not a sticker */
      if (P.punch && mdata) {
        fctx.globalCompositeOperation = 'destination-out';
        fctx.drawImage(mask, 0, 0, W, H);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = P.ground; ctx.fillRect(0, 0, W, H);
      const cx = W * P.cx, cy = H * P.cy, R = Math.max(W, H);
      if (P.glow) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.34 + 0.4 * st.fill + 0.12 * st.amp));
        g.addColorStop(0, 'rgba(' + col + ',' + (0.055 + 0.2 * st.fill * st.dim + 0.05 * st.pulse) * P.glow + ')');
        g.addColorStop(0.55, 'rgba(' + col + ',' + (0.02 + 0.06 * st.fill) * P.glow + ')');
        g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.92;
      ctx.drawImage(fb, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (st.rim > 0.001) {
        const v = ctx.createRadialGradient(cx, cy, R * 0.25, cx, cy, R * 0.72);
        v.addColorStop(0, 'rgba(' + col + ',0)');
        v.addColorStop(1, 'rgba(' + col + ',' + Math.min(0.4, st.rim * 1.5 * st.dim) + ')');
        ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      }
      if (st.mirrorK > 0.35) {
        ctx.strokeStyle = 'rgba(' + P.ink + ',' + 0.1 * st.mirrorK + ')';
        ctx.lineWidth = 1; ctx.beginPath();
        ctx.arc(cx, cy, R * (0.18 + 0.16 * st.fill), 0, Math.PI * 2); ctx.stroke();
      }
      if (st.flash > 0) { ctx.fillStyle = 'rgba(' + P.ink + ',' + 0.05 * st.flash + ')'; ctx.fillRect(0, 0, W, H); }
      if (P.overlay) P.overlay(ctx, W, H, st, P);
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      const n = performance.now() / 1000;
      let dt = Math.min(0.1, n - last); last = n;
      if (!live) return;
      dt = Math.min(dt, 1 / 20); t = n; dtL = dt;
      const st = getState();
      if (P.maskEl || P.maskDraw) buildMask();
      step(dt, st); draw(st);
    }

    const ro = new ResizeObserver(() => size());
    ro.observe(canvas);
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(e => { live = e[0].isIntersecting; }, { rootMargin: '120px' });
      io.observe(canvas);
    }
    size(); loop();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { maskKey = ''; if (P.overlay && P.overlay.invalidate) P.overlay.invalidate(); });
    return { stop() { cancelAnimationFrame(raf); ro.disconnect(); if (io) io.disconnect(); }, reseed: seed, opts: P };
  }

  /* overlay: the name cut out of a slab — wind is visible only inside the letters */
  function cutOverlay(spec) {
    let buf = null, bctx = null, lay = null, lctx = null, fit = null, fitKey = '';
    function prep(c, W, H, dpr) {
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    }
    const fn = function (ctx, W, H, st, P) {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      if (!buf) { buf = document.createElement('canvas'); bctx = buf.getContext('2d'); lay = document.createElement('canvas'); lctx = lay.getContext('2d'); }
      prep(buf, W, H, dpr); prep(lay, W, H, dpr);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const top = spec.top(H);
      if (fitKey !== W + '|' + spec.lines[0].font) {
        fitKey = W + '|' + spec.lines[0].font; fit = 1;
        bctx.save();
        spec.lines.forEach(ln => {
          bctx.font = ln.font;
          try { bctx.letterSpacing = ln.ls || '0px'; } catch (e) {}
          const w = bctx.measureText(ln.text).width;
          const avail = W - spec.pad * 2;
          if (w > avail) fit = Math.min(fit, avail / w);
        });
        bctx.restore();
      }
      const letters = c => {
        spec.lines.forEach(ln => {
          const m = /^(\d+)\s+(\d+(?:\.\d+)?)px\s+(.*)$/.exec(ln.font);
          c.font = m ? m[1] + ' ' + (parseFloat(m[2]) * fit).toFixed(1) + 'px ' + m[3] : ln.font;
          try { c.letterSpacing = (parseFloat(ln.ls || '0') * fit).toFixed(1) + 'px'; } catch (e) {}
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(ln.text, W / 2, top + ln.y * fit);
        });
      };
      /* bright air, kept only inside the letterforms */
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, W, H);
      const col = st.flow >= 0 ? P.inhale : P.exhale;
      const g = lctx.createLinearGradient(0, top, 0, top + spec.h);
      g.addColorStop(0, 'rgba(' + col + ',' + (0.44 + 0.42 * st.fill) + ')');
      g.addColorStop(1, 'rgba(' + P.ink + ',' + (0.16 + 0.3 * st.fill) + ')');
      lctx.fillStyle = g; lctx.fillRect(0, top, W, spec.h);
      lctx.globalCompositeOperation = 'destination-in';
      lctx.fillStyle = '#fff'; letters(lctx);
      /* the slab, with the name punched out of it */
      bctx.globalCompositeOperation = 'source-over';
      bctx.clearRect(0, 0, W, H);
      bctx.fillStyle = spec.slab; bctx.fillRect(0, top, W, spec.h);
      bctx.fillStyle = 'rgba(232,238,243,.1)'; bctx.fillRect(0, top, W, 1); bctx.fillRect(0, top + spec.h - 1, W, 1);
      bctx.globalCompositeOperation = 'destination-out';
      bctx.fillStyle = '#000'; letters(bctx);
      ctx.drawImage(lay, 0, 0, W, H);
      ctx.drawImage(buf, 0, 0, W, H);
    };
    fn.invalidate = () => { fitKey = ''; };
    return fn;
  }

  window.WB = { MODES, PATTERNS, Pacer, buildLift, buildBreathe, attach, cutOverlay, clamp, eio };
})();
