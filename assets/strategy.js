/*
 * Gentle movement for the Strategy page's golden-hour scene. Positions are in the
 * background image's own pixels (1672 x 941), so they stay on the right part of the
 * picture at any screen size.
 */
(() => {
    const IMG_W = 1672;
    const IMG_H = 941;
    const MARGIN = 14;

    const root = document.documentElement;
    const stage = document.getElementById('stage');
    const img = document.getElementById('scene-img');
    const canvas = document.getElementById('fx');
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LITE = matchMedia('(pointer: coarse)').matches || innerWidth <= 900;

    // The river, and the family standing in front of it (left out of the ripple)
    const RIVER = [[335, 792], [362, 760], [460, 742], [560, 730], [620, 712], [660, 690], [690, 665], [800, 662],
        [850, 668], [930, 680], [1010, 695], [1060, 712], [1120, 725], [1220, 738], [1320, 742], [1392, 750],
        [1300, 756], [1130, 761], [1040, 768], [900, 776], [780, 790], [640, 800], [520, 806], [420, 806]];
    const FAMILY = [1122, 645, 1268, 792];
    const DESERT = [1405, 588, 1568, 668];   // shimmering heat haze over the dunes
    const SUN = [1522, 535];

    /* ---------- helpers ---------- */
    function hash(n) { n = Math.sin(n * 127.1) * 43758.5453; return n - Math.floor(n); }
    function noise(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; }
    function sprite(r, g, b) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d');
        const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
        grad.addColorStop(0.25, `rgba(${r},${g},${b},0.55)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        x.fillStyle = grad;
        x.fillRect(0, 0, 64, 64);
        return c;
    }
    const GLINT = sprite(255, 244, 220);
    const SUNGLOW = sprite(255, 220, 150);
    const WISP = sprite(255, 236, 214);
    const path = poly => { const p = new Path2D(); poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    const riverPath = path(RIVER);
    function dot(s, x, y, size, a) {
        if (a <= 0.003) return;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(s, x - size / 2, y - size / 2, size, size);
    }

    /* ---------- layout and parallax ---------- */
    let k = 0, overflowX = 0, scale = 1;
    function layout() {
        const vw = innerWidth, vh = innerHeight;
        scale = Math.max((vw + 2 * MARGIN) / IMG_W, (vh + 2 * MARGIN) / IMG_H);
        const w = IMG_W * scale, h = IMG_H * scale;
        overflowX = w - vw;
        Object.assign(stage.style, { width: w + 'px', height: h + 'px', left: (vw - w) * 0.5 + 'px', top: (vh - h) * 0.5 + 'px', right: 'auto', bottom: 'auto' });
        const nk = Math.min(LITE ? 1.3 : 2, Math.max(1, (w * (devicePixelRatio || 1)) / IMG_W));
        if (Math.abs(nk - k) > 0.05) {
            k = nk;
            canvas.width = Math.round(IMG_W * k);
            canvas.height = Math.round(IMG_H * k);
            buildRegions();
        }
    }
    const target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
    let steered = false;
    addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        steered = true;
        target.x = (e.clientX / innerWidth) * 2 - 1;
        target.y = (e.clientY / innerHeight) * 2 - 1;
    });

    /* ---------- ripple and heat haze ---------- */
    let regions = [];
    function buildRegions() {
        const defs = [
            { poly: RIVER, amp: [0.5, 1.4], freq: 0.7, speed: 1.6, cut: FAMILY },
            { poly: [[DESERT[0], DESERT[1]], [DESERT[2], DESERT[1]], [DESERT[2], DESERT[3]], [DESERT[0], DESERT[3]]], amp: [0.7, 0.4], freq: 1.8, speed: 4.5 }
        ];
        regions = defs.map(def => {
            const xs = def.poly.map(p => p[0]), ys = def.poly.map(p => p[1]);
            const bx = Math.min(...xs) - 4, by = Math.min(...ys) - 4;
            const bw = Math.max(...xs) + 4 - bx, bh = Math.max(...ys) + 4 - by;
            const mask = document.createElement('canvas');
            mask.width = Math.ceil(bw * k); mask.height = Math.ceil(bh * k);
            const m = mask.getContext('2d');
            const off = 10000;
            m.setTransform(k, 0, 0, k, -(bx + off) * k, -by * k);
            m.shadowColor = '#000'; m.shadowBlur = 4 * k; m.shadowOffsetX = off * k;
            m.fill(path(def.poly));
            if (def.cut) {
                m.globalCompositeOperation = 'destination-out';
                m.fillRect(def.cut[0] + off, def.cut[1], def.cut[2] - def.cut[0], def.cut[3] - def.cut[1]);
            }
            const work = document.createElement('canvas');
            work.width = mask.width; work.height = mask.height;
            return { ...def, bx, by, bw, bh, mask, work, wctx: work.getContext('2d') };
        });
    }
    function drawRegion(r, t) {
        const w = r.wctx;
        w.globalCompositeOperation = 'source-over';
        w.clearRect(0, 0, r.work.width, r.work.height);
        for (let y = r.by; y < r.by + r.bh; y++) {
            const depth = (y - r.by) / r.bh;
            const amp = r.amp[0] + (r.amp[1] - r.amp[0]) * depth;
            const dx = amp * (0.6 * Math.sin(y * r.freq + t * r.speed) + 0.4 * Math.sin(y * r.freq * 0.37 - t * r.speed * 0.66 + 1.7));
            w.drawImage(img, r.bx, y, r.bw, 1, dx * k, (y - r.by) * k, r.bw * k, k);
        }
        w.globalCompositeOperation = 'destination-in';
        w.drawImage(r.mask, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(r.work, r.bx, r.by, r.bw, r.bh);
    }

    /* ---------- the living details ---------- */
    const WISPS = Array.from({ length: 12 }, (_, i) => ({ x: hash(i * 3.7) * IMG_W, y: 40 + hash(i * 5.1) * 420, r: 70 + hash(i * 2.3) * 110, sp: 2 + hash(i * 6.7) * 3 }));
    const MOTES = Array.from({ length: LITE ? 30 : 70 }, (_, i) => ({ x: 900 + hash(i * 1.9) * 760, y: 560 + hash(i * 4.3) * 360, r: 0.8 + hash(i * 7.1) * 1.4, ph: hash(i * 2.2) * 6.28, sp: 2 + hash(i * 8.8) * 4 }));
    const birds = [];
    let nextBird = 2;
    const boats = [   // a couple of small craft moving slowly along the river: path y at the river, start x, speed
        { x: 420, y: 781, sp: 3.2, s: 1 }, { x: 980, y: 709, sp: -2.4, s: 0.8 }, { x: 760, y: 676, sp: 1.6, s: 0.55 }
    ];

    function update(t, dt) {
        if (t >= nextBird && birds.length < 10) {
            const ltr = Math.random() < 0.5, n = 1 + Math.floor(Math.random() * 5), y = 80 + Math.random() * 300;
            for (let i = 0; i < n; i++) birds.push({ x: ltr ? -10 - i * 14 : IMG_W + 10 + i * 14, y: y + (Math.random() - 0.5) * 24, vx: (ltr ? 1 : -1) * (22 + Math.random() * 14), ph: Math.random() * 6, s: 2 + Math.random() * 1.5 });
            nextBird = t + 4 + Math.random() * 7;
        }
        for (let i = birds.length - 1; i >= 0; i--) {
            const b = birds[i];
            b.x += b.vx * dt;
            b.y += Math.sin(t * 0.8 + b.ph) * 3 * dt;
            if (b.x < -40 || b.x > IMG_W + 40) birds.splice(i, 1);
        }
        boats.forEach(b => {
            b.x += b.sp * dt;
            if (b.x > 1000 && b.y > 770) b.x = 380;
            if (b.x < 860 && b.y > 700 && b.y < 720) b.x = 1100;
            if (b.x > 880 && b.y < 690) b.x = 700;
        });
    }

    function draw(t) {
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.clearRect(0, 0, IMG_W, IMG_H);
        ctx.globalCompositeOperation = 'source-over';
        regions.forEach(r => drawRegion(r, t));

        // Small boats drifting along the river, each with a pale wake
        ctx.save();
        ctx.clip(riverPath);
        boats.forEach(b => {
            const dir = Math.sign(b.sp), s = b.s;
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = 'rgb(250,240,225)';
            ctx.lineWidth = 0.6 * s;
            ctx.beginPath();
            ctx.moveTo(b.x - dir * 2 * s, b.y + 1 * s);
            ctx.lineTo(b.x - dir * 16 * s, b.y + 2.2 * s);
            ctx.moveTo(b.x - dir * 2 * s, b.y + 1 * s);
            ctx.lineTo(b.x - dir * 14 * s, b.y - 0.4 * s);
            ctx.stroke();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = 'rgb(240,232,220)';
            ctx.beginPath();
            ctx.moveTo(b.x - 5 * s, b.y); ctx.lineTo(b.x + 5 * s, b.y); ctx.lineTo(b.x + 3.5 * s, b.y + 1.6 * s); ctx.lineTo(b.x - 4 * s, b.y + 1.6 * s);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgb(90,80,74)';
            ctx.fillRect(b.x - 2 * s, b.y - 1.8 * s, 3.2 * s, 1.8 * s);
        });
        ctx.restore();

        // Sunlight glinting on the river, brightest toward the sun
        ctx.save();
        ctx.clip(riverPath);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < (LITE ? 60 : 130); i++) {
            const x = 340 + hash(i * 1.7) * 1060, y = 662 + hash(i * 3.3) * 145;
            const n = noise(t * (1.4 + hash(i) * 2) + i * 4.1);
            dot(GLINT, x, y, 2.4 + 2 * hash(i * 9), 0.95 * Math.pow(n, 5) * (0.5 + 0.5 * (x / 1400)));
        }
        ctx.restore();

        // The low sun breathing softly, with a faint flare
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 0.75 + 0.25 * noise(t * 0.35);
        dot(SUNGLOW, SUN[0], SUN[1], 260, 0.22 * pulse);
        dot(SUNGLOW, SUN[0], SUN[1], 70, 0.35 * pulse);
        dot(SUNGLOW, SUN[0] - 260, SUN[1] + 120, 26, 0.08 * pulse);
        dot(SUNGLOW, SUN[0] - 420, SUN[1] + 190, 14, 0.06 * pulse);

        // Fine golden wisps of cloud drifting across the sky
        ctx.globalCompositeOperation = 'source-over';
        WISPS.forEach(w => {
            const x = ((w.x + t * w.sp) % (IMG_W + 400)) - 200;
            ctx.save();
            ctx.translate(x, w.y);
            ctx.scale(1, 0.28);
            dot(WISP, 0, 0, w.r * 2, 0.16);
            ctx.restore();
        });

        // Birds
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = 'rgb(70,56,48)';
        ctx.lineWidth = 0.6;
        birds.forEach(b => {
            const f = Math.sin(t * 9 + b.ph) * b.s * 0.6;
            ctx.beginPath();
            ctx.moveTo(b.x - b.s, b.y - f);
            ctx.quadraticCurveTo(b.x - b.s * 0.4, b.y - f * 0.3 - 0.4, b.x, b.y);
            ctx.quadraticCurveTo(b.x + b.s * 0.4, b.y - f * 0.3 - 0.4, b.x + b.s, b.y - f);
            ctx.stroke();
        });

        // Dust motes floating in the warm light over the terrace
        ctx.globalCompositeOperation = 'lighter';
        MOTES.forEach((m, i) => {
            const x = m.x + Math.sin(t * 0.2 + m.ph) * 14 + t * m.sp * 0.3 % 40;
            const y = m.y + Math.cos(t * 0.17 + m.ph * 2) * 10;
            dot(GLINT, x, y, m.r * 3, 0.35 * (0.4 + 0.6 * noise(t * 0.6 + i)));
        });
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    /* ---------- loop ---------- */
    let start = 0, last = 0, lastDraw = 0;
    function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const tx = steered ? target.x : Math.sin(t * 0.07) * 0.35;
        const ty = steered ? target.y : Math.sin(t * 0.05 + 1) * 0.25;
        current.x += (tx - current.x) * 0.04;
        current.y += (ty - current.y) * 0.04;
        stage.style.transform = `translate3d(${(-current.x * 6).toFixed(2)}px, ${(-current.y * 4).toFixed(2)}px, 0)`;
        if (LITE && now - lastDraw < 30) { requestAnimationFrame(frame); return; }
        lastDraw = now;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        update(t, dt);
        draw(t);
        requestAnimationFrame(frame);
    }

    layout();
    addEventListener('resize', layout);
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
        root.classList.remove('loading');
        if (reduceMotion) return;
        start = last = performance.now();
        requestAnimationFrame(frame);
    });
    setTimeout(() => root.classList.remove('loading'), 3000);
})();
