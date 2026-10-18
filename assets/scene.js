/*
 * Living-scene effects for the ISAACS home page.
 *
 * The background image and a canvas of effects sit together on a "stage" sized to
 * cover the viewport. Every effect position below is in the background image's own
 * pixel coordinates (1672 x 941), so effects stay on the right part of the picture
 * at any screen size and while the parallax moves.
 */
(() => {
    const IMG_W = 1672;
    const IMG_H = 941;
    const MARGIN = 18;        // overscan so parallax never reveals an edge
    const PARALLAX_X = 12;    // max background shift, px
    const PARALLAX_Y = 8;
    const UI_PARALLAX = 3;    // max lettering shift, px

    const root = document.documentElement;
    const stage = document.getElementById('stage');
    const img = document.getElementById('scene-img');
    const canvas = document.getElementById('fx');
    const ui = document.getElementById('ui');
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Bright lights detected in the skyline and far shore: x, y, r, g, b
    const CITY_LIGHTS = [[330,338,255,255,255],[325,336,255,255,255],[584,337,255,255,254],[301,283,254,255,255],[419,329,253,255,255],[319,336,253,255,255],[480,312,253,255,254],[467,335,255,255,243],[442,331,253,255,248],[569,301,251,255,248],[195,344,255,255,231],[388,333,255,255,223],[247,339,255,255,222],[767,333,253,255,227],[379,335,252,255,228],[229,342,255,255,219],[480,305,255,255,218],[844,340,248,255,238],[471,329,253,255,220],[589,336,253,255,219],[722,340,254,255,209],[237,344,255,255,206],[754,335,253,255,209],[760,335,253,255,195],[187,344,255,253,206],[362,332,254,255,173],[652,340,255,252,194],[550,337,250,254,184],[376,331,252,251,206],[322,332,253,253,183],[429,324,255,251,190],[412,333,252,250,204],[659,335,255,248,211],[613,337,252,251,178],[546,341,255,255,115],[618,335,254,251,146],[630,342,255,248,153],[484,332,255,241,193],[448,335,252,247,142],[838,340,255,249,112],[407,338,255,246,128],[302,308,248,239,201],[203,341,255,237,173],[487,328,255,235,186],[702,345,255,246,51],[657,341,255,232,181],[573,311,233,230,222],[344,345,247,227,189],[784,340,255,232,94],[448,330,255,227,128],[569,323,255,222,143],[476,337,233,222,204],[368,333,250,229,80],[665,341,255,219,158],[599,342,255,230,37],[257,340,254,217,157],[454,332,255,221,108],[413,343,240,216,176],[500,337,255,216,128],[211,341,255,214,136],[262,336,255,218,84],[446,345,242,215,150],[272,333,252,209,167],[611,342,255,220,41],[576,317,255,215,86],[358,336,240,207,150],[767,317,236,207,159],[247,344,254,205,119],[505,337,255,204,118],[672,341,248,202,154],[516,343,255,208,67],[621,341,254,205,78],[402,332,255,198,133],[493,333,255,198,128],[460,336,255,200,97],[687,317,225,200,174],[521,340,255,199,85],[425,333,255,195,111],[614,312,255,199,71],[512,337,246,201,74],[580,314,242,201,77],[394,333,255,192,110],[782,346,247,196,93],[450,341,238,194,126],[793,338,254,192,90],[527,340,255,190,83],[750,342,254,190,82],[766,346,255,187,96],[176,345,231,186,171],[430,347,221,191,118],[623,313,250,186,75],[389,341,199,189,189],[756,322,255,182,90],[366,338,230,188,104],[587,316,227,194,46],[274,339,248,181,110],[219,292,252,182,87],[607,334,255,181,83],[348,338,255,178,103],[825,330,255,177,109],[330,347,246,178,114],[590,342,246,188,7],[854,305,230,176,167],[755,346,255,177,58],[762,301,225,179,124],[381,344,234,178,106],[769,288,231,175,140],[592,315,236,185,23],[614,307,215,184,81],[641,346,139,193,208],[1336,351,255,255,255],[1432,347,254,255,255],[1378,348,253,255,249],[1330,350,255,255,230],[1409,347,254,255,229],[1509,351,255,254,214],[1486,350,250,250,223],[1464,349,249,250,155],[1420,350,255,240,174],[1442,350,255,228,95],[1346,346,255,216,158],[1515,351,251,208,168],[1312,352,251,205,188],[1495,350,255,201,128]];

    // The darkest gaps in the night sky
    const STARS = [[426,42],[169,141],[191,97],[133,26],[166,65],[231,78],[200,150],[349,50],[389,22],[250,129],[443,93],[165,27],[371,125],[118,122],[318,77],[364,76],[99,41],[199,4],[305,139],[266,95],[340,106],[123,75],[320,30],[492,55],[157,94],[261,61],[527,70],[207,45],[414,82],[96,89],[487,109],[403,121],[335,144],[466,73]];

    // Aircraft warning lights on the tallest towers: x, y, phase
    const TOWER_LIGHTS = [[221, 244, 0], [762, 234, 0.8], [594, 236, 1.6]];

    // Water, as polygons; ripple amplitude (px) grows towards the viewer
    const WATER = [
        { poly: [[612, 404], [700, 401], [760, 409], [860, 403], [940, 400], [940, 468], [840, 470], [760, 466], [700, 452], [640, 445], [612, 430]], amp: [0.35, 1.0], freq: 0.85, speed: 1.7 },
        { poly: [[1345, 352], [1520, 350], [1515, 420], [1440, 440], [1392, 470], [1385, 528], [1240, 530], [1240, 446], [1300, 440], [1362, 420]], amp: [0.4, 1.3], freq: 0.8, speed: 1.5 }
    ];

    // Heat haze over the flames
    const FLAMES = [
        { poly: [[128, 606], [206, 606], [206, 642], [128, 642]], amp: [0.6, 0.35], freq: 1.9, speed: 7 },
        { poly: [[0, 628], [42, 628], [42, 672], [0, 672]], amp: [0.6, 0.35], freq: 1.9, speed: 7.5 }
    ];

    // Firelight glows: x, y, radius, strength, seed
    const FIRE_GLOWS = [
        [166, 626, 46, 0.30, 1], [166, 652, 60, 0.12, 2],   // fireplace and its floor reflection
        [16, 650, 44, 0.30, 3],                              // fireplace on the far left
        [120, 630, 230, 0.05, 4],                            // warm wash over the corner of the room
        [533, 516, 9, 0.35, 5]                               // lantern on the desk
    ];

    // Aquarium
    const TANK = [[1256, 585], [1672, 600], [1672, 872], [1560, 852], [1420, 820], [1256, 792]];
    const TANK_SURFACE = 592;
    const DIVERS = [[1459, 688], [1506, 727]];              // regulator positions
    const RAYS = [[1438, 0], [1528, 1.7], [1600, 3.1], [1350, 4.4]];

    // Space-station navigation lights: x, y, sprite, pattern
    const NAV_LIGHTS = [[1431, 18, 'red', 'pulse'], [1594, 74, 'white', 'strobe']];

    /* ---------- helpers ---------- */

    function hash(n) {
        n = Math.sin(n * 127.1) * 43758.5453;
        return n - Math.floor(n);
    }

    // Smooth 1D value noise, 0..1
    function noise(x) {
        const i = Math.floor(x);
        const f = x - i;
        const u = f * f * (3 - 2 * f);
        return hash(i) * (1 - u) + hash(i + 1) * u;
    }

    function flicker(t, seed) {
        return 0.6 * noise(t * 4 + seed * 17) + 0.3 * noise(t * 9 + seed * 31) + 0.1 * noise(t * 19 + seed * 53);
    }

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

    const SPRITES = {
        warm: sprite(255, 214, 160),
        white: sprite(240, 244, 255),
        red: sprite(255, 60, 40),
        fire: sprite(255, 150, 60)
    };

    function drawSprite(s, x, y, size, alpha) {
        if (alpha <= 0.002) return;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.drawImage(s, x - size / 2, y - size / 2, size, size);
    }

    function pathFrom(poly) {
        const p = new Path2D();
        poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
        p.closePath();
        return p;
    }

    /* ---------- layout ---------- */

    let k = 0; // canvas pixels per image pixel

    function layout() {
        const vw = innerWidth;
        const vh = innerHeight;
        const focalX = vw <= 768 ? 0.42 : 0.44;
        const s = Math.max((vw + 2 * MARGIN) / IMG_W, (vh + 2 * MARGIN) / IMG_H);
        const w = IMG_W * s;
        const h = IMG_H * s;
        Object.assign(stage.style, {
            width: w + 'px',
            height: h + 'px',
            left: (vw - w) * focalX + 'px',
            top: (vh - h) * 0.5 + 'px',
            right: 'auto',
            bottom: 'auto'
        });

        const newK = Math.min(2, Math.max(1, (w * (devicePixelRatio || 1)) / IMG_W));
        if (Math.abs(newK - k) > 0.05) {
            k = newK;
            canvas.width = Math.round(IMG_W * k);
            canvas.height = Math.round(IMG_H * k);
            buildDistortRegions();
        }
    }

    /* ---------- water ripple and heat haze ---------- */

    // Each region is redrawn from the source image one row at a time with a small
    // horizontal offset, then masked with a feathered copy of its polygon.
    let regions = [];

    function buildDistortRegions() {
        regions = WATER.concat(FLAMES).map(def => {
            const xs = def.poly.map(p => p[0]);
            const ys = def.poly.map(p => p[1]);
            const pad = 4;
            const bx = Math.max(0, Math.min(...xs) - pad);
            const by = Math.max(0, Math.min(...ys) - pad);
            const bw = Math.min(IMG_W, Math.max(...xs) + pad) - bx;
            const bh = Math.min(IMG_H, Math.max(...ys) + pad) - by;

            const mask = document.createElement('canvas');
            mask.width = Math.ceil(bw * k);
            mask.height = Math.ceil(bh * k);
            const m = mask.getContext('2d');
            // Feather the edge using the blurred shadow of an off-canvas copy (works in every browser)
            const off = 10000;
            m.setTransform(k, 0, 0, k, -(bx + off) * k, -by * k);
            m.shadowColor = '#000';
            m.shadowBlur = 3 * k;
            m.shadowOffsetX = off * k;
            m.fill(pathFrom(def.poly));

            const work = document.createElement('canvas');
            work.width = mask.width;
            work.height = mask.height;

            return { ...def, bx, by, bw, bh, mask, work, wctx: work.getContext('2d') };
        });
    }

    function drawDistort(r, t) {
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

    /* ---------- aquarium ---------- */

    const tankPath = pathFrom(TANK);
    const bubbles = [];
    const nextExhale = DIVERS.map((_, i) => 1.5 + i * 1.9);
    const specks = Array.from({ length: 28 }, (_, i) => ({
        x: 1270 + hash(i + 1) * 400,
        y: 600 + hash(i + 50) * 220,
        r: 0.35 + hash(i + 99) * 0.45,
        a: 0.12 + hash(i + 150) * 0.22,
        p: hash(i + 200) * 10
    }));

    function exhale(x, y) {
        const n = 8 + Math.floor(Math.random() * 7);
        for (let i = 0; i < n; i++) {
            bubbles.push({
                x: x + (Math.random() - 0.5) * 3,
                y: y + (Math.random() - 0.5) * 2,
                r: 0.6 + Math.pow(Math.random(), 2) * 2.2,
                vy: -(10 + Math.random() * 8),
                delay: Math.random() * 0.7,
                wob: 1 + Math.random() * 2,
                wf: 2 + Math.random() * 2.5,
                wp: Math.random() * 6.28,
                drift: 0
            });
        }
    }

    function updateBubbles(t, dt) {
        DIVERS.forEach(([x, y], i) => {
            if (t >= nextExhale[i]) {
                exhale(x, y);
                nextExhale[i] = t + 3.6 + Math.random() * 2.4;
            }
        });
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const b = bubbles[i];
            if (b.delay > 0) { b.delay -= dt; continue; }
            b.vy = Math.max(b.vy - 22 * dt, -48);      // buoyancy: bubbles speed up as they rise
            b.y += b.vy * dt;
            b.r *= 1 + 0.04 * dt;                      // and grow slightly as the pressure drops
            b.drift += (Math.random() - 0.5) * 6 * dt;
            if (b.y < TANK_SURFACE) bubbles.splice(i, 1);
        }
    }

    function drawAquarium(t) {
        ctx.save();
        ctx.clip(tankPath);

        // Shifting light shafts from the surface
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 1;
        RAYS.forEach(([x, seed]) => {
            const top = x + (noise(t * 0.15 + seed) - 0.5) * 14;
            const a = 0.03 + 0.06 * noise(t * 0.35 + seed * 3);
            const grad = ctx.createLinearGradient(0, TANK_SURFACE, 0, 820);
            grad.addColorStop(0, `rgba(205,240,255,${a.toFixed(3)})`);
            grad.addColorStop(1, 'rgba(205,240,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(top - 7, TANK_SURFACE);
            ctx.lineTo(top + 7, TANK_SURFACE);
            ctx.lineTo(top + 70, 820);
            ctx.lineTo(top + 10, 820);
            ctx.closePath();
            ctx.fill();
        });

        // Particles suspended in the water
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgb(215,240,255)';
        specks.forEach(s => {
            ctx.globalAlpha = s.a * (0.6 + 0.4 * noise(t * 0.5 + s.p));
            ctx.beginPath();
            ctx.arc(s.x + Math.sin(t * 0.13 + s.p) * 6, s.y + Math.sin(t * 0.09 + s.p * 2) * 4, s.r, 0, 6.283);
            ctx.fill();
        });

        // Bubbles: a faint rim, a hint of fill and a small highlight
        ctx.lineWidth = 0.45;
        bubbles.forEach(b => {
            if (b.delay > 0) return;
            const x = b.x + b.drift + Math.sin(t * b.wf + b.wp) * b.wob;
            const fade = Math.min(1, (b.y - TANK_SURFACE) / 18);
            ctx.beginPath();
            ctx.arc(x, b.y, b.r, 0, 6.283);
            ctx.globalAlpha = 0.5 * fade;
            ctx.strokeStyle = 'rgb(225,245,255)';
            ctx.stroke();
            ctx.globalAlpha = 0.08 * fade;
            ctx.fillStyle = 'rgb(210,240,255)';
            ctx.fill();
            ctx.globalAlpha = 0.65 * fade;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, 6.283);
            ctx.fill();
        });

        ctx.restore();
    }

    /* ---------- lights ---------- */

    function drawLights(t) {
        ctx.globalCompositeOperation = 'lighter';

        // Distant city lights shimmer through the atmosphere
        CITY_LIGHTS.forEach(([x, y, r, , b], i) => {
            const n = noise(t * (0.8 + hash(i) * 1.6) + i * 7.3);
            drawSprite(r - b > 40 ? SPRITES.warm : SPRITES.white, x, y, 5, 0.06 + 0.42 * n * n * n);
        });

        // Slow-blinking aircraft warning lights
        TOWER_LIGHTS.forEach(([x, y, phase]) => {
            const c = ((t + phase) % 2.4) / 2.4;
            drawSprite(SPRITES.red, x, y, 6, c < 0.4 ? 0.75 * Math.sin((c / 0.4) * Math.PI) : 0);
        });

        // Faint stars in the clearest gaps of the sky
        STARS.forEach(([x, y], i) => {
            const n = noise(t * (0.25 + hash(i + 3) * 0.4) + i * 3.1);
            drawSprite(SPRITES.white, x, y, 2.6, 0.12 + 0.4 * n * n);
        });

        // Navigation lights on the space station
        NAV_LIGHTS.forEach(([x, y, colour, pattern]) => {
            let a;
            if (pattern === 'pulse') {
                const c = (t % 3) / 3;
                a = c < 0.35 ? Math.sin((c / 0.35) * Math.PI) : 0;
            } else {
                const c = t % 4.5;
                a = c < 0.08 || (c > 0.28 && c < 0.36) ? 1 : 0;
            }
            drawSprite(SPRITES[colour], x, y, 5, 0.8 * a);
        });

        // Firelight
        FIRE_GLOWS.forEach(([x, y, radius, strength, seed]) => {
            drawSprite(SPRITES.fire, x, y, radius * 2, strength * (0.45 + 0.75 * flicker(t, seed)));
        });

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    /* ---------- parallax ---------- */

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let steered = false;

    addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        steered = true;
        target.x = (e.clientX / innerWidth) * 2 - 1;
        target.y = (e.clientY / innerHeight) * 2 - 1;
    });

    addEventListener('deviceorientation', e => {
        if (e.gamma == null || e.beta == null) return;
        steered = true;
        target.x = Math.max(-1, Math.min(1, e.gamma / 25));
        target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    });

    function applyParallax(t) {
        // With no pointer or tilt, drift very slowly on its own
        const tx = steered ? target.x : Math.sin(t * 0.07) * 0.35;
        const ty = steered ? target.y : Math.sin(t * 0.05 + 1) * 0.25;
        current.x += (tx - current.x) * 0.04;
        current.y += (ty - current.y) * 0.04;
        stage.style.transform = `translate3d(${(-current.x * PARALLAX_X).toFixed(2)}px, ${(-current.y * PARALLAX_Y).toFixed(2)}px, 0)`;
        ui.style.transform = `translate3d(${(-current.x * UI_PARALLAX).toFixed(2)}px, ${(-current.y * UI_PARALLAX).toFixed(2)}px, 0)`;
    }

    /* ---------- main loop ---------- */

    let start = 0;
    let last = 0;

    function frame(now) {
        const t = (now - start) / 1000;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        applyParallax(t);
        updateBubbles(t, dt);

        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.clearRect(0, 0, IMG_W, IMG_H);
        regions.forEach(r => drawDistort(r, t));
        drawAquarium(t);
        drawLights(t);

        // Effects ease in once the entrance has settled
        canvas.style.opacity = Math.min(1, Math.max(0, (t - 0.8) / 3)).toFixed(3);

        requestAnimationFrame(frame);
    }

    function reveal() {
        root.classList.remove('loading');
    }

    layout();
    addEventListener('resize', layout);

    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
        reveal();
        if (reduceMotion) return;
        start = last = performance.now();
        requestAnimationFrame(frame);
    });
    // Never leave the page behind the curtain if the image is slow
    setTimeout(reveal, 3000);
})();
