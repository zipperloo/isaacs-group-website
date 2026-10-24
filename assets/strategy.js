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
    const nightImg = document.getElementById('scene-night');
    const breaker = document.getElementById('breaker');
    let nightOn = false;   // the breaker: up = day (the default), down = night
    let night = 0;         // 0 day .. 1 night (2-second fade)
    const canvas = document.getElementById('fx');
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LITE = matchMedia('(pointer: coarse)').matches || innerWidth <= 900;

    // The river, and the family standing in front of it (left out of the ripple)
    const RIVER = [[335, 792], [362, 760], [460, 742], [560, 730], [620, 712], [660, 690], [690, 665], [800, 662],
        [850, 668], [930, 680], [1010, 695], [1060, 712], [1120, 725], [1220, 738], [1320, 742], [1392, 750],
        [1300, 756], [1130, 761], [1040, 768], [900, 776], [780, 790], [640, 800], [520, 806], [420, 806]];
    const FAMILY = [1122, 645, 1268, 792];
    const BURJ_AL_ARAB = [952, 592, 1018, 708];   // stands in the water, so kept out of the ripple
    // The glass balustrade in front of the river: its top rail (a line sloping gently up to the
    // right) and its vertical posts, all kept out of the ripple so they stay straight
    const railY = x => 763 - (x - 300) * 0.033;
    const POSTS = [371, 645, 905, 975];
    // Riverside roads and promenades, as polylines: cars drive along the roads, people stroll the paths
    const ROADS = [
        [[345, 758], [450, 742], [560, 728], [622, 708], [664, 684]],
        [[1022, 700], [1070, 710], [1118, 721]]
    ];
    const PATHS = [
        [[360, 753], [460, 738], [560, 724], [618, 705]],
        [[1026, 704], [1080, 714], [1114, 722]]
    ];
    const DESERT = [1405, 588, 1568, 668];   // shimmering heat haze over the dunes
    const SUN = [1522, 535];
    const BREAKER_AT = [1622, 470];   // on the marble wall at the right of the picture, about light-switch height
    // Night: city lights detected in the night painting, and the tallest towers' aircraft lights
    const CITY = [[1519,744],[1405,656],[1513,702],[398,734],[1048,638],[1056,651],[913,653],[68,655],[605,729],[1512,744],[812,656],[1346,661],[722,698],[302,704],[414,732],[1529,743],[1523,755],[605,701],[566,716],[522,722],[395,742],[1346,650],[1226,653],[793,654],[1432,657],[1073,684],[1072,703],[1477,704],[556,705],[595,711],[1078,716],[524,745],[645,652],[870,665],[1493,703],[617,704],[595,728],[1119,642],[41,654],[243,657],[1397,659],[1015,692],[647,694],[1531,701],[1041,705],[484,725],[305,620],[247,637],[1056,638],[1174,654],[1356,655],[1195,659],[1250,718],[375,689],[426,730],[568,736],[1432,740],[1537,742],[239,623],[744,650],[963,688],[132,689],[326,698],[888,650],[922,653],[235,695],[654,696],[1234,707],[1041,717],[871,749],[105,625],[825,655],[1140,656],[237,661],[962,675],[526,685],[1041,691],[321,703],[588,734],[350,747],[1059,534],[293,667],[48,691],[287,692],[1294,726],[606,748],[655,650],[776,653],[1012,664],[206,703],[1115,703],[586,704],[448,731],[1529,519],[1529,529],[1359,603],[155,665],[801,676],[278,737],[429,759],[1051,536],[472,556],[311,630],[69,634],[152,637],[911,670],[1015,683],[406,688],[1078,725],[561,734],[1442,739],[1508,759],[857,619],[230,629],[633,636],[1371,651],[931,653],[1131,657],[362,691],[337,749],[525,752],[1056,631],[1185,654],[1278,654],[1185,661],[266,665],[211,666],[1007,691],[298,694],[1452,743],[1520,521],[635,653],[156,682],[1346,722],[1040,727],[21,737],[360,624],[412,682],[914,699],[653,715],[1501,750],[396,640],[902,651],[535,655],[1249,657],[1417,660],[221,695],[214,700],[1161,741],[1547,741],[1355,564],[1086,579],[236,611],[702,619],[645,626],[264,630],[451,631],[1244,645],[595,657],[227,699],[1086,705],[1453,728],[14,622],[527,645],[509,646],[1104,646],[156,657],[1378,659],[260,670],[787,670]];
    const TOWER_TOPS = [[1345, 383, 0], [365, 471, 0.7], [1056, 568, 1.3], [1130, 571, 0.4], [1228, 575, 1.9], [1262, 585, 1.1], [958, 586, 1.6]];

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
    const WARM = sprite(255, 214, 150);
    const RED = sprite(255, 50, 40);
    const WHITE = sprite(235, 240, 255);
    const path = poly => { const p = new Path2D(); poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    const riverPath = path(RIVER);
    function dot(s, x, y, size, a) {
        if (a <= 0.003) return;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(s, x - size / 2, y - size / 2, size, size);
    }

    /* ---------- layout and parallax ---------- */
    let k = 0, overflowX = 0, overflowY = 0, scale = 1;
    // Swipe to explore (touch screens), exactly as on the home page: which slice is in view
    const pan = { base: 0.5, focal: 0.5, focalY: 0.5, vel: 0, velY: 0, dragging: false, lastX: 0, lastY: 0, lastT: 0, touched: false };
    function layout() {
        const vw = innerWidth, vh = innerHeight;
        scale = Math.max((vw + 2 * MARGIN) / IMG_W, (vh + 2 * MARGIN) / IMG_H);
        const w = IMG_W * scale, h = IMG_H * scale;
        overflowX = w - vw;
        overflowY = h - vh;
        pan.base = vw <= 768 ? 0.62 : 0.5;   // phones start on the river and the family
        if (!pan.touched) pan.focal = pan.base;
        Object.assign(stage.style, { width: w + 'px', height: h + 'px', left: '0px', top: '0px', right: 'auto', bottom: 'auto' });
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
            { poly: RIVER, amp: [0.7, 1.8], freq: 0.7, speed: 1.7, cut: FAMILY, rail: true },
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
                m.shadowBlur = 0;
                m.shadowOffsetX = 0;
                m.setTransform(k, 0, 0, k, -bx * k, -by * k);
                m.fillRect(def.cut[0], def.cut[1], def.cut[2] - def.cut[0], def.cut[3] - def.cut[1]);
                if (def.rail) m.fillRect(BURJ_AL_ARAB[0], BURJ_AL_ARAB[1], BURJ_AL_ARAB[2] - BURJ_AL_ARAB[0], BURJ_AL_ARAB[3] - BURJ_AL_ARAB[1]);
                if (def.rail) {
                    // no ripple anywhere near the glass balustrade: only the far river moves
                    m.beginPath();
                    m.moveTo(200, railY(200) - 16);
                    m.lineTo(1500, railY(1500) - 16);
                    m.lineTo(1500, 950);
                    m.lineTo(200, 950);
                    m.closePath();
                    m.fill();
                }
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
        // copy from whichever painting is showing, blending the two during the fade
        const nReady = nightImg.complete && nightImg.naturalWidth;
        const layers = night <= 0 || !nReady ? [[img, 1]] : night >= 1 ? [[nightImg, 1]] : [[img, 1], [nightImg, night]];
        layers.forEach(([src, alpha]) => {
            w.globalAlpha = alpha;
            for (let y = r.by; y < r.by + r.bh; y++) {
                const depth = (y - r.by) / r.bh;
                const amp = r.amp[0] + (r.amp[1] - r.amp[0]) * depth;
                const dx = amp * (0.6 * Math.sin(y * r.freq + t * r.speed) + 0.4 * Math.sin(y * r.freq * 0.37 - t * r.speed * 0.66 + 1.7));
                w.drawImage(src, r.bx, y, r.bw, 1, dx * k, (y - r.by) * k, r.bw * k, k);
            }
        });
        w.globalAlpha = 1;
        w.globalCompositeOperation = 'destination-in';
        w.drawImage(r.mask, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(r.work, r.bx, r.by, r.bw, r.bh);
    }

    /* ---------- the living details ---------- */
    const WISPS = Array.from({ length: 12 }, (_, i) => ({ x: hash(i * 3.7) * IMG_W, y: 40 + hash(i * 5.1) * 420, r: 70 + hash(i * 2.3) * 110, sp: 2 + hash(i * 6.7) * 3 }));
    const MOTES = Array.from({ length: LITE ? 30 : 70 }, (_, i) => ({ x: 900 + hash(i * 1.9) * 760, y: 560 + hash(i * 4.3) * 360, r: 0.8 + hash(i * 7.1) * 1.4, ph: hash(i * 2.2) * 6.28, sp: 2 + hash(i * 8.8) * 4 }));
    const birds = [];
    let nextBird = 1;
    // a point a fraction f of the way along a polyline
    function along(line, f) {
        const segs = [];
        let total = 0;
        for (let i = 1; i < line.length; i++) { const d = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]); segs.push(d); total += d; }
        let d = f * total;
        for (let i = 0; i < segs.length; i++) {
            if (d <= segs[i]) { const q = d / segs[i]; return [line[i][0] + (line[i + 1][0] - line[i][0]) * q, line[i][1] + (line[i + 1][1] - line[i][1]) * q]; }
            d -= segs[i];
        }
        return line[line.length - 1];
    }
    // cars: which road, position along it, speed (either way), and a muted colour
    const CAR_COLOURS = ['rgb(52,48,46)', 'rgb(70,66,62)', 'rgb(96,90,84)', 'rgb(40,44,52)', 'rgb(110,96,84)'];
    const cars = Array.from({ length: 9 }, (_, i) => ({ road: i % 2, f: hash(i * 3.1), v: (0.012 + hash(i * 5.7) * 0.012) * (i % 3 ? 1 : -1), col: CAR_COLOURS[i % CAR_COLOURS.length], lane: i % 3 ? 0.6 : -0.6 }));
    // people strolling: which path, position, slow speed, and a step phase
    const walkers = Array.from({ length: 16 }, (_, i) => ({ path: i % 2, f: hash(i * 2.3), v: (0.0015 + hash(i * 6.1) * 0.002) * (hash(i * 9.3) > 0.5 ? 1 : -1), ph: hash(i * 4.4) * 6, h: 2.4 + hash(i * 7.7) * 0.6, col: hash(i * 8.1) > 0.5 ? 'rgb(48,40,36)' : 'rgb(78,70,64)' }));
    const boats = [   // a couple of small craft moving slowly along the river: path y at the river, start x, speed
        { x: 420, y: 781, sp: 5, s: 1.5 }, { x: 980, y: 722, sp: -4, s: 1.2 }, { x: 760, y: 676, sp: 2.6, s: 0.85 }
    ];

    function update(t, dt) {
        if (t >= nextBird && birds.length < 26) {
            // mostly small, distant flocks low over the city; now and then one or two nearer
            const far = Math.random() < 0.75;
            const ltr = Math.random() < 0.5, n = far ? 3 + Math.floor(Math.random() * 6) : 1 + Math.floor(Math.random() * 2);
            const y = far ? 420 + Math.random() * 160 : 120 + Math.random() * 260;
            for (let i = 0; i < n; i++) birds.push({ x: ltr ? -10 - i * 9 : IMG_W + 10 + i * 9, y: y + (Math.random() - 0.5) * (far ? 14 : 24), vx: (ltr ? 1 : -1) * (far ? 10 + Math.random() * 6 : 24 + Math.random() * 12), ph: Math.random() * 6, s: far ? 1.3 + Math.random() * 0.6 : 2.4 + Math.random() * 1.4, far });
            nextBird = t + 1.5 + Math.random() * 3;
        }
        cars.forEach(c => { c.f += c.v * dt; if (c.f > 1) c.f -= 1; if (c.f < 0) c.f += 1; });
        walkers.forEach(w => { w.f += w.v * dt; if (w.f > 1 || w.f < 0) w.v = -w.v; });
        for (let i = birds.length - 1; i >= 0; i--) {
            const b = birds[i];
            b.x += b.vx * dt;
            b.y += Math.sin(t * 0.8 + b.ph) * 3 * dt;
            if (b.x < -40 || b.x > IMG_W + 40) birds.splice(i, 1);
        }
        boats.forEach(b => {
            b.x += b.sp * dt;
            if (b.x > 1000 && b.y > 770) b.x = 380;
            if (b.x < 860 && b.y > 700 && b.y < 730) b.x = 1100;
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
            if (night > 0) {
                ctx.globalCompositeOperation = 'lighter';
                dot(WARM, b.x - 0.4 * s, b.y - 1 * s, 5 * s, 0.8 * night);
                ctx.globalCompositeOperation = 'source-over';
            }
        });
        ctx.restore();

        // Sunlight glinting on the river, brightest toward the sun
        ctx.save();
        ctx.clip(riverPath);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < (LITE ? 60 : 130); i++) {
            const x = 340 + hash(i * 1.7) * 1060, y = 662 + hash(i * 3.3) * 145;
            const n = noise(t * (1.4 + hash(i) * 2) + i * 4.1);
            dot(night > 0.5 ? WARM : GLINT, x, y, 3 + 2.5 * hash(i * 9), Math.pow(n, 4) * (0.6 + 0.4 * (x / 1400)) * (1 - 0.5 * night));
        }
        ctx.restore();

        // The low sun breathing softly, with a faint flare
        ctx.globalCompositeOperation = 'lighter';
        const pulse = (0.75 + 0.25 * noise(t * 0.35)) * (1 - night);
        dot(SUNGLOW, SUN[0], SUN[1], 260, 0.22 * pulse);
        dot(SUNGLOW, SUN[0], SUN[1], 70, 0.35 * pulse);
        dot(SUNGLOW, SUN[0] - 260, SUN[1] + 120, 26, 0.08 * pulse);
        dot(SUNGLOW, SUN[0] - 420, SUN[1] + 190, 14, 0.06 * pulse);
        // ...and by night a soft halo around the moon
        dot(WHITE, 1525, 527, 120, 0.12 * night * (0.85 + 0.15 * noise(t * 0.4)));

        // Fine golden wisps of cloud drifting across the sky
        ctx.globalCompositeOperation = 'source-over';
        WISPS.forEach(w => {
            const x = ((w.x + t * w.sp) % (IMG_W + 400)) - 200;
            ctx.save();
            ctx.translate(x, w.y);
            ctx.scale(1, 0.28);
            dot(WISP, 0, 0, w.r * 2, 0.22 * (1 - 0.7 * night));
            ctx.restore();
        });

        // Cars along the riverside roads: small, dark and muted, with a faint glint of sun on glass
        ctx.globalCompositeOperation = 'source-over';
        cars.forEach(c => {
            const [x, y] = along(ROADS[c.road], c.f);
            const [x2, y2] = along(ROADS[c.road], Math.min(1, c.f + 0.01));
            const a = Math.atan2(y2 - y, x2 - x);
            const sz = 1.1 + (y - 660) / 110;   // nearer roads, slightly bigger cars
            ctx.save();
            ctx.translate(x, y + c.lane);
            ctx.rotate(a);
            ctx.globalAlpha = 0.85 * (1 - night);
            ctx.fillStyle = c.col;
            ctx.fillRect(-1.6 * sz, -0.7 * sz, 3.2 * sz, 1.4 * sz);
            ctx.globalAlpha = 0.5 * (1 - night);
            ctx.fillStyle = 'rgb(255,236,200)';
            ctx.fillRect(-0.4 * sz, -0.7 * sz, 0.9 * sz, 0.4 * sz);
            ctx.restore();
            if (night > 0) {
                // by night just headlights and tail lights
                const dir = Math.sign(c.v), ca = Math.cos(a) * dir, sa = Math.sin(a) * dir;
                ctx.globalCompositeOperation = 'lighter';
                dot(WARM, x + ca * 1.8 * sz, y + c.lane + sa * 1.8 * sz, 3.2 * sz, 0.9 * night);
                dot(RED, x - ca * 1.8 * sz, y + c.lane - sa * 1.8 * sz, 2.4 * sz, 0.7 * night);
                ctx.globalCompositeOperation = 'source-over';
            }
        });

        // People strolling along the embankments: tiny upright figures with a gentle bob
        walkers.forEach(w => {
            const [x, y] = along(PATHS[w.path], w.f);
            const bob = Math.abs(Math.sin(t * 3 + w.ph)) * 0.25;
            const h = w.h * (1.05 + (y - 660) / 120);
            ctx.globalAlpha = 0.85 * (1 - 0.6 * night);
            ctx.fillStyle = w.col;
            ctx.fillRect(x - 0.5, y - h - bob, 1, h);
            ctx.beginPath();
            ctx.arc(x, y - h - bob - 0.5, 0.6, 0, 6.283);
            ctx.fill();
        });

        // Birds
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = 'rgb(70,56,48)';
        ctx.lineWidth = 0.6;
        birds.forEach(b => {
            ctx.globalAlpha = (b.far ? 0.7 : 0.8) * (1 - 0.85 * night);
            ctx.lineWidth = b.far ? 0.55 : 0.7;
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
            dot(GLINT, x, y, m.r * 3, 0.35 * (0.4 + 0.6 * noise(t * 0.6 + i)) * (1 - night));
        });
        if (night > 0) drawNight(t);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    // City lights twinkling, red aircraft warning lights on the tallest towers, and a plane
    // crossing high over the scene now and then
    const plane = { born: -100, dur: 40, next: 6, ltr: true, y: 120 };
    function drawNight(t) {
        const e = night * night * (3 - 2 * night);
        ctx.globalCompositeOperation = 'lighter';
        CITY.forEach(([x, y], i) => {
            const n = noise(t * (0.5 + hash(i) * 1.2) + i * 5.3);
            const blink = hash(Math.floor(t * 0.4 + i * 3.1) * 7 + i) > 0.97 ? 0 : 1;   // the odd light switching off for a moment
            dot(WARM, x, y, 4 + n * 3, e * (0.18 + 0.4 * n * n) * blink);
        });
        TOWER_TOPS.forEach(([x, y, ph]) => {
            const c = ((t + ph) % 2.2) / 2.2;
            dot(RED, x, y, 7, e * (c < 0.35 ? Math.sin((c / 0.35) * Math.PI) : 0.06));
        });
        if (t >= plane.next && t - plane.born > plane.dur) {
            Object.assign(plane, { born: t, dur: 38 + Math.random() * 14, ltr: Math.random() < 0.5, y: 70 + Math.random() * 160 });
            plane.next = t + plane.dur + 15 + Math.random() * 25;
        }
        const f = (t - plane.born) / plane.dur;
        if (f >= 0 && f <= 1) {
            const x = plane.ltr ? -30 + f * (IMG_W + 60) : IMG_W + 30 - f * (IMG_W + 60);
            const y = plane.y + f * 30;
            const edge = Math.min(1, f / 0.04, (1 - f) / 0.04);
            const c = (t - plane.born) % 1.2;
            dot(WHITE, x, y, 2.4, 0.6 * e * edge);                                           // steady navigation light
            if (c < 0.06 || (c > 0.18 && c < 0.24)) dot(WHITE, x, y, 7, 0.95 * e * edge);   // double white strobe
            dot(RED, x + (plane.ltr ? -1.6 : 1.6), y + 0.4, 4, (c > 0.6 && c < 0.85 ? 0.8 : 0.1) * e * edge);   // red beacon
        }
    }

    /* ---------- day / night breaker ---------- */
    function placeBreaker() {
        const r = canvas.getBoundingClientRect();
        // fixed to its spot on the wall: it moves with the picture and slides off screen with it
        const x = r.left + (BREAKER_AT[0] / IMG_W) * r.width;
        const y = r.top + (BREAKER_AT[1] / IMG_H) * r.height;
        const w = breaker.offsetWidth, h = breaker.offsetHeight;
        // The wall recedes to the left: its marble joints rise slightly to the right above eye level
        // and the face is foreshortened, so the plate is narrowed and sheared to match
        breaker.style.transform = `translate(${(x - w * 0.41).toFixed(1)}px, ${(y - h / 2).toFixed(1)}px) matrix(0.82, -0.07, 0, 1, 0, 0)`;
    }
    breaker.addEventListener('click', () => {
        nightOn = !nightOn;
        if (nightOn && !nightImg.getAttribute('src')) nightImg.src = nightImg.dataset.src;
        breaker.setAttribute('aria-pressed', String(nightOn));
        breaker.setAttribute('aria-label', nightOn ? 'Switch to day' : 'Switch to night');
        nightImg.classList.toggle('on', nightOn);
        root.classList.toggle('night', nightOn);
    });
    nightImg.addEventListener('load', () => nightImg.classList.toggle('on', nightOn));

    /* ---------- swipe to explore ---------- */
    const panLimit = () => MARGIN / Math.max(1, overflowX);
    function updatePan(t) {
        if (pan.dragging) return;
        const lo = panLimit(), hi = 1 - panLimit();
        if (!pan.touched && overflowX > innerWidth * 0.3 && t > 6 && t < 11) {
            // a one-off drift on phones to show there is more to see, then back
            pan.focal = pan.base + Math.sin(((t - 6) / 5) * Math.PI) * -0.16;
        } else {
            pan.focal += pan.vel;
            pan.vel *= 0.93;
            if (pan.focal < lo) { pan.focal += (lo - pan.focal) * 0.2; pan.vel *= 0.5; }
            if (pan.focal > hi) { pan.focal += (hi - pan.focal) * 0.2; pan.vel *= 0.5; }
        }
        const loY = MARGIN / Math.max(1, overflowY), hiY = 1 - loY;
        pan.focalY += pan.velY;
        pan.velY *= 0.93;
        if (pan.focalY < loY) { pan.focalY += (loY - pan.focalY) * 0.2; pan.velY *= 0.5; }
        if (pan.focalY > hiY) { pan.focalY += (hiY - pan.focalY) * 0.2; pan.velY *= 0.5; }
    }
    stage.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' || (overflowX < 40 && overflowY < 40)) return;
        Object.assign(pan, { dragging: true, touched: true, vel: 0, velY: 0, lastX: e.clientX, lastY: e.clientY, lastT: performance.now() });
    });
    addEventListener('pointermove', e => {
        if (!pan.dragging) return;
        const now = performance.now(), frames = Math.max(1, (now - pan.lastT) / 16.7);
        const d = -(e.clientX - pan.lastX) / Math.max(1, overflowX);
        const lo = panLimit(), hi = 1 - panLimit();
        pan.focal += pan.focal < lo || pan.focal > hi ? d * 0.35 : d;
        pan.vel = d / frames;
        if (overflowY > 2 * MARGIN) {
            const dy = -(e.clientY - pan.lastY) / overflowY;
            pan.focalY += pan.focalY < 0 || pan.focalY > 1 ? dy * 0.35 : dy;
            pan.velY = dy / frames;
        }
        pan.lastX = e.clientX; pan.lastY = e.clientY; pan.lastT = now;
    });
    const endDrag = () => {
        if (!pan.dragging) return;
        pan.dragging = false;
        pan.vel = Math.max(-0.04, Math.min(0.04, pan.vel));
        pan.velY = Math.max(-0.04, Math.min(0.04, pan.velY));
    };
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);

    /* ---------- loop ---------- */
    let start = 0, last = 0, lastDraw = 0;
    function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const tx = steered ? target.x : Math.sin(t * 0.07) * 0.35;
        const ty = steered ? target.y : Math.sin(t * 0.05 + 1) * 0.25;
        current.x += (tx - current.x) * 0.04;
        current.y += (ty - current.y) * 0.04;
        updatePan(t);
        stage.style.transform = `translate3d(${(-overflowX * pan.focal - current.x * 6).toFixed(2)}px, ${(-overflowY * pan.focalY - current.y * 4).toFixed(2)}px, 0)`;
        placeBreaker();   // every frame, so it never lags behind the picture
        if (LITE && now - lastDraw < 30) { requestAnimationFrame(frame); return; }
        lastDraw = now;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        night = nightOn && nightImg.naturalWidth ? Math.min(1, night + dt / 2) : Math.max(0, night - dt / 2);
        update(t, dt);
        draw(t);
        requestAnimationFrame(frame);
    }

    layout();
    addEventListener('resize', () => { layout(); placeBreaker(); });
    placeBreaker();
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
        root.classList.remove('loading');
        if (reduceMotion) return;
        start = last = performance.now();
        requestAnimationFrame(frame);
    });
    setTimeout(() => root.classList.remove('loading'), 3000);
})();
