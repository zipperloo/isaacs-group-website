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
    const PARALLAX_X = 6;     // max background shift, px
    const PARALLAX_Y = 4;
    const UI_PARALLAX = 1.5;  // max lettering shift, px

    const root = document.documentElement;
    const stage = document.getElementById('stage');
    const img = document.getElementById('scene-img');
    const canvas = document.getElementById('fx');
    // The laptop screen has its own layer, so it appears with the picture rather than
    // waiting for the effects to fade in
    const screenCanvas = document.getElementById('screen');
    const sctx = screenCanvas.getContext('2d');
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
        { poly: [[612, 404], [700, 401], [760, 409], [860, 403], [940, 400], [940, 468], [840, 470], [760, 466], [700, 452], [640, 445], [612, 430]], amp: [1.0, 2.6], freq: 0.6, speed: 2.2 },
        { poly: [[1345, 352], [1520, 350], [1515, 420], [1440, 440], [1392, 470], [1385, 528], [1240, 530], [1240, 446], [1300, 440], [1362, 420]], amp: [1.2, 3.0], freq: 0.55, speed: 2.0 }
    ];

    // Heat haze over the flames
    const FLAMES = [
        { poly: [[128, 600], [206, 600], [206, 642], [128, 642]], amp: [1.0, 0.5], freq: 1.9, speed: 8 },
        { poly: [[0, 622], [42, 622], [42, 672], [0, 672]], amp: [1.0, 0.5], freq: 1.9, speed: 8.5 }
    ];

    // Firelight glows: x, y, radius, strength, seed
    const FIRE_GLOWS = [
        [166, 626, 48, 0.50, 1], [166, 652, 64, 0.22, 2],   // fireplace and its floor reflection
        [16, 650, 46, 0.50, 3],                              // fireplace on the far left
        [120, 630, 240, 0.09, 4],                            // warm wash over the corner of the room
        [533, 516, 11, 0.55, 5]                              // lantern on the desk
    ];

    // Steam from the coffee cup on the terrace
    const CUP = [457, 495];

    // Après-ski terrace: fire pit, and chalet windows lit by a fire inside (x, y, radius, strength, seed)
    const APRES_FIRE = [1525, 247];
    const APRES_GLOWS = [
        [1525, 247, 26, 0.35, 11],
        [1648, 216, 18, 0.22, 12], [1622, 212, 10, 0.2, 13]
    ];

    // Après-ski party, in the spirit of La Folie Douce: everything moves to one beat
    const PARTY = {
        bpm: 124,
        dancer: [1505, 249],                 // feet, left of the fire pit against the pale mountains
        dj: [1645, 237],                     // waist, silhouetted against the lit chalet window
        booth: [1633, 236, 24, 10],          // x, y, width, height
        festoon: [[1604, 198], [1499, 212]], // chalet eave to a pole by the dancer
        pole: [1499, 212, 248],
        beams: [[1641, 197, 0], [1613, 199, 2.3]],
        wash: [1585, 248],
        skyTop: 131                          // underside of the room's ceiling
    };

    // More party-goers: x, y (feet), jacket, trousers, hat (or null), dance style
    const DANCERS = [
        [1489, 252, [168, 138, 58], [30, 30, 38], [52, 46, 44], 'sway']
    ];
    // People painted into the crowd who throw their hands up now and then:
    // shoulder x (left, right), shoulder y, sleeve colour
    const CROWD_ARMS = [
        [1541, 1553, 221, [22, 24, 42]],
        [1560, 1574, 220, [188, 62, 22]],
        [1596, 1606, 221, [44, 22, 24]],
        [1611, 1625, 220, [26, 36, 60]]
    ];

    // A family of monkeys in the palm crowns on the outcrop beside the Thai huts:
    // x, y (where they sit), height, kind
    const MONKEYS = [
        [1278, 267.5, 7, 'adult'],
        [1283.5, 269, 4, 'baby'],
        [1252, 251.5, 6.5, 'adult'],
        [1289, 293, 5, 'hanging']
    ];

    // Tropical fish swim behind the divers, so the divers are cut out of the fish layer
    const DIVER_SHAPES = [
        [[1362, 680], [1380, 655], [1420, 655], [1445, 662], [1470, 668], [1475, 690], [1462, 705], [1455, 730], [1490, 738], [1495, 750], [1470, 752], [1440, 760], [1440, 790], [1420, 810], [1395, 805], [1385, 770], [1370, 745], [1360, 720]],
        [[1488, 742], [1500, 722], [1505, 700], [1530, 697], [1545, 705], [1575, 722], [1585, 740], [1560, 748], [1555, 775], [1580, 785], [1612, 800], [1600, 812], [1585, 830], [1570, 835], [1555, 812], [1540, 790], [1520, 780], [1505, 765]]
    ];
    // Mostly dark blue silhouettes like the distant fish painted in the tank, a few muted warm ones
    const FISH_COLOURS = [[28, 70, 120], [22, 58, 104], [36, 84, 132], [30, 66, 110], [150, 130, 70], [150, 100, 70]];

    // The laptop on the terrace desk shows the Medik8 home page (Crystal Retinal slide).
    // The four corners of the screen panel, measured from the picture: top-left, top-right,
    // bottom-right, bottom-left. The screen is slightly rotated and seen in perspective.
    const LAPTOP = [[838.5, 534], [920.5, 536], [912.5, 579.5], [832.5, 577.5]];
    // The post-it's four corners on the desk (top-left, top-right, bottom-right, bottom-left
    // of the note itself). It lies flat and turned, so it reads as a diamond-ish shape.
    const POSTIT = [[1115, 645.6], [1140, 646.9], [1125.5, 658], [1100, 654.6]];
    const laptopImg = new Image();
    laptopImg.src = 'assets/laptop-screen.jpg';

    // An Arabian oryx wandering a slow loop on the dunes: centre, radius across, radius in depth
    const ORYX_LOOP = { cx: 196, cy: 360, rx: 34, ry: 4.5 };

    // Porch lights on the Thai huts that switch on and off: x, y, reflection y on the water (or 0)
    const HUT_LIGHTS = [[1012, 423, 0], [1046, 377, 0], [1168, 392, 0], [1192, 430, 0], [1262, 420, 452], [1293, 412, 455]];

    // Lanterns on the backpackers' rickety bridge, which gutter very occasionally
    const BRIDGE_LANTERNS = [[1440, 489], [1546, 458], [1650, 488], [1652, 392]];

    // Sailboat in the bay: waterline points at bow and stern, and the bilge outlet
    const BOAT_WAKE = [[1402, 389], [1494, 389]];
    const BILGE = [1480, 384];
    const BOAT_WATERLINE = 390.5;

    // The stone wall at the far left edge, where a gecko climbs now and then. The image is
    // cropped here on most screens, so the route runs up the strip of wall that stays visible.
    // It appears from behind the potted plant's leaves and climbs out of the top of the frame.
    const GECKO_PATH = [[49, 292], [48, 240], [50, 160], [48.5, 80], [49, -20]];
    const GECKO_WALL_EDGE = 56;   // the wall's right-hand edge
    let geckoShift = 0;           // set in layout() to keep the gecko on the visible strip of wall

    // Sky region a distant plane can cross (the left-hand window)
    const PLANE_SKY = { left: 60, right: 930, top: 20, bottom: 90 };

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
        fire: sprite(255, 150, 60),
        steam: sprite(236, 238, 242),
        dim: sprite(30, 22, 30)
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

    // Swipe-to-explore: which slice of the picture is in view, 0 (left edge) to 1 (right edge)
    const pan = { base: 0.44, focal: 0.44, focalY: 0.5, vel: 0, velY: 0, lastY: 0, dragging: false, lastX: 0, lastT: 0, touched: false };
    let overflowX = 0;   // how much wider the picture is than the screen, px
    let overflowY = 0;   // and how much taller
    let stageScale = 1;

    // How much of the far-left wall is on screen, to keep the gecko on it. The slow breathing
    // zoom can push the edge a little further off screen at its peak, so allow for most of that.
    function updateGeckoShift() {
        const visibleLeft = (overflowX * pan.focal) / stageScale + IMG_W * 0.0075 + PARALLAX_X / stageScale;
        const geckoX = Math.max(GECKO_PATH[0][0] - 10, visibleLeft + 5);
        geckoShift = geckoX <= GECKO_WALL_EDGE - 3 ? geckoX - GECKO_PATH[0][0] : null;
    }

    function layout() {
        const vw = innerWidth;
        const vh = innerHeight;
        pan.base = vw <= 768 ? 0.42 : 0.44;
        if (!pan.touched) pan.focal = pan.base;
        const s = Math.max((vw + 2 * MARGIN) / IMG_W, (vh + 2 * MARGIN) / IMG_H);
        stageScale = s;
        const w = IMG_W * s;
        const h = IMG_H * s;
        overflowX = w - vw;
        overflowY = h - vh;
        updateGeckoShift();
        Object.assign(stage.style, {
            width: w + 'px',
            height: h + 'px',
            left: '0px',
            top: '0px',
            right: 'auto',
            bottom: 'auto',
            // Placed here too, so the picture is framed correctly even before the animation runs
            transform: `translate3d(${(-overflowX * pan.focal).toFixed(2)}px, ${(-overflowY * pan.focalY).toFixed(2)}px, 0)`
        });

        const newK = Math.min(2, Math.max(1, (w * (devicePixelRatio || 1)) / IMG_W));
        if (Math.abs(newK - k) > 0.05) {
            k = newK;
            canvas.width = Math.round(IMG_W * k);
            canvas.height = Math.round(IMG_H * k);
            screenCanvas.width = canvas.width;
            screenCanvas.height = canvas.height;
            buildDistortRegions();
            drawLaptop();
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

    /* ---------- steam ---------- */

    const steam = [];
    let nextPuff = 0;

    function updateSteam(t) {
        while (t >= nextPuff) {
            steam.push({
                born: nextPuff,
                life: 4.5 + Math.random() * 2,
                x: CUP[0] + (Math.random() - 0.5) * 5,
                vy: 7 + Math.random() * 4,
                seed: Math.random() * 100
            });
            nextPuff += 0.12 + Math.random() * 0.1;
        }
        for (let i = steam.length - 1; i >= 0; i--) {
            if (t - steam[i].born > steam[i].life) steam.splice(i, 1);
        }
    }

    function drawSteam(t) {
        ctx.globalCompositeOperation = 'screen';
        const breeze = (noise(t * 0.25) - 0.5) * 16;
        steam.forEach(p => {
            const age = t - p.born;
            const life = age / p.life;
            // Each wisp curls more, and drifts further with the breeze, the higher it rises
            const curl = (noise(p.seed + age * 0.9) - 0.5) * 18 + Math.sin(age * 1.7 + p.seed) * 3;
            const x = p.x + (curl + breeze) * life;
            const y = CUP[1] - age * p.vy * (1 - life * 0.35);
            const fadeIn = Math.min(1, life / 0.12);
            drawSprite(SPRITES.steam, x, y, 4 + life * 22, 0.28 * fadeIn * Math.pow(1 - life, 1.6));
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- lights ---------- */

    function drawLights(t) {
        ctx.globalCompositeOperation = 'lighter';

        // City lights glow steadily; now and then a single light goes dark, flares or flickers
        ctx.globalCompositeOperation = 'source-over';
        CITY_LIGHTS.forEach(([x, y], i) => {
            const d = cityDim(i, t);
            if (d > 0) drawSprite(SPRITES.dim, x, y, 5, 0.95 * d);
        });
        ctx.globalCompositeOperation = 'lighter';
        CITY_LIGHTS.forEach(([x, y, r, , b], i) => {
            const flare = cityFlare(i, t);
            const a = (0.35 + 0.65 * flare) * (1 - cityDim(i, t));
            drawSprite(r - b > 40 ? SPRITES.warm : SPRITES.white, x, y, 9 + flare * 8, a);
        });

        // Slow-blinking aircraft warning lights
        TOWER_LIGHTS.forEach(([x, y, phase]) => {
            const c = ((t + phase) % 2.4) / 2.4;
            drawSprite(SPRITES.red, x, y, 9, c < 0.4 ? Math.sin((c / 0.4) * Math.PI) : 0);
        });

        // Faint stars in the clearest gaps of the sky
        STARS.forEach(([x, y], i) => {
            const n = noise(t * (0.35 + hash(i + 3) * 0.5) + i * 3.1);
            drawSprite(SPRITES.white, x, y, 4, 0.3 + 0.7 * n * n);
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

        // Firelight, in the room and on the après-ski terrace
        FIRE_GLOWS.concat(APRES_GLOWS).forEach(([x, y, radius, strength, seed]) => {
            drawSprite(SPRITES.fire, x, y, radius * 2, strength * (0.45 + 0.75 * flicker(t, seed)));
        });

        drawEmbers(t);
        drawPartyLights(t);
        drawHutLights(t);
        drawPlane(t);
        drawLanterns(t);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    /* ---------- city light events ---------- */

    // Rather than every light shimmering at once, single lights change at random moments
    const cityEvents = CITY_LIGHTS.map(() => null);
    let nextCityEvent = 2;

    function updateCityEvents(t) {
        while (t >= nextCityEvent) {
            const i = Math.floor(Math.random() * CITY_LIGHTS.length);
            if (!cityEvents[i] || t > cityEvents[i].end) {
                const roll = Math.random();
                const type = roll < 0.55 ? 'dim' : roll < 0.85 ? 'flare' : 'flicker';
                const dur = type === 'dim' ? 3 + Math.random() * 8 : type === 'flare' ? 1.2 + Math.random() * 2 : 0.6 + Math.random() * 0.6;
                cityEvents[i] = { type, start: t, end: t + dur };
            }
            nextCityEvent += 0.4 - Math.log(1 - Math.random()) * 1.1;   // irregular gaps, usually 0.5-2.5s
        }
    }

    function envelope(ev, t, attack, release) {
        if (!ev || t < ev.start || t > ev.end) return 0;
        return Math.max(0, Math.min(1, (t - ev.start) / attack, (ev.end - t) / release));
    }

    function cityDim(i, t) {
        const ev = cityEvents[i];
        if (!ev) return 0;
        if (ev.type === 'dim') return envelope(ev, t, 0.6, 0.9);
        if (ev.type === 'flicker') return hash(Math.floor(t * 11) + i * 13) > 0.5 ? envelope(ev, t, 0.05, 0.05) : 0;
        return 0;
    }

    function cityFlare(i, t) {
        const ev = cityEvents[i];
        return ev && ev.type === 'flare' ? envelope(ev, t, 0.35, 0.8) : 0;
    }

    /* ---------- après-ski embers ---------- */

    const embers = [];
    let nextEmber = 1;

    function updateEmbers(t, dt) {
        while (t >= nextEmber) {
            embers.push({ x: APRES_FIRE[0] + (Math.random() - 0.5) * 6, y: APRES_FIRE[1] - 2, vy: -(12 + Math.random() * 14), born: t, life: 1 + Math.random() * 1.8, seed: Math.random() * 50 });
            nextEmber += 0.15 - Math.log(1 - Math.random()) * 0.45;
        }
        for (let i = embers.length - 1; i >= 0; i--) {
            const e = embers[i];
            e.y += e.vy * dt;
            e.vy *= 1 - 0.6 * dt;
            if (t - e.born > e.life) embers.splice(i, 1);
        }
    }

    function drawEmbers(t) {
        embers.forEach(e => {
            const age = t - e.born;
            const x = e.x + (noise(e.seed + age * 2) - 0.5) * 8 * (age / e.life);
            const a = (1 - age / e.life) * (0.5 + 0.5 * noise(e.seed + t * 12));
            drawSprite(SPRITES.fire, x, e.y, 2.4, 0.9 * a);
        });
    }

    /* ---------- après-ski party ---------- */

    const PARTY_COLOURS = [[255, 70, 200], [150, 90, 255], [60, 210, 255], [255, 175, 70]];
    const PARTY_SPRITES = PARTY_COLOURS.map(c => sprite(...c));

    function beat(t) { return t * PARTY.bpm / 60; }
    function beatPulse(t) { return Math.exp(-(beat(t) % 1) * 5); }   // 1 on the beat, decaying

    // Slowly cycling party colour: returns two sprites and the mix between them
    function partyColour(t, offset) {
        const c = (((t * 0.12 + offset) % PARTY_COLOURS.length) + PARTY_COLOURS.length) % PARTY_COLOURS.length;
        const i = Math.floor(c);
        return [PARTY_SPRITES[i], PARTY_SPRITES[(i + 1) % PARTY_SPRITES.length], c - i, PARTY_COLOURS[i]];
    }

    function drawMixed(t, offset, x, y, size, alpha) {
        const [a, b, f] = partyColour(t, offset);
        drawSprite(a, x, y, size, alpha * (1 - f));
        drawSprite(b, x, y, size, alpha * f);
    }

    // Champagne sprays from the dancer's bottle every so often
    const spray = [];
    let nextSpray = 9;
    let sprayUntil = 0;
    const bottleTip = { x: 0, y: 0 };

    function updateParty(t, dt) {
        if (t >= nextSpray) {
            sprayUntil = t + 0.7;
            nextSpray = t + 18 + Math.random() * 20;
        }
        if (t < sprayUntil) {
            for (let i = 0; i < 3; i++) {
                spray.push({
                    x: bottleTip.x, y: bottleTip.y,
                    vx: -8 + Math.random() * 30, vy: -(38 + Math.random() * 30),
                    born: t, life: 1.1 + Math.random() * 0.8, r: 0.35 + Math.random() * 0.45
                });
            }
        }
        for (let i = spray.length - 1; i >= 0; i--) {
            const p = spray[i];
            p.vy += 85 * dt;
            p.vx *= 1 - 0.8 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (t - p.born > p.life) spray.splice(i, 1);
        }
    }

    // Sky searchlights and the coloured wash on the snow (drawn with 'lighter')
    function drawPartyLights(t) {
        const pulse = beatPulse(t);

        ctx.save();
        ctx.beginPath();
        ctx.rect(1440, PARTY.skyTop, 232, 200 - PARTY.skyTop);
        ctx.clip();
        PARTY.beams.forEach(([x, y, seed]) => {
            const ang = -Math.PI / 2 + Math.sin(t * 0.32 + seed) * 0.95;
            const len = 90;
            const [, , , col] = partyColour(t, seed);
            const tx = x + Math.cos(ang) * len;
            const ty = y + Math.sin(ang) * len;
            const nx = -Math.sin(ang) * 7;
            const ny = Math.cos(ang) * 7;
            const grad = ctx.createLinearGradient(x, y, tx, ty);
            grad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.16 + 0.06 * pulse).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
            ctx.globalAlpha = 1;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - nx * 0.08, y - ny * 0.08);
            ctx.lineTo(x + nx * 0.08, y + ny * 0.08);
            ctx.lineTo(tx + nx, ty + ny);
            ctx.lineTo(tx - nx, ty - ny);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();

        // Coloured light pooling on the snow, pumping with the beat
        ctx.save();
        ctx.translate(PARTY.wash[0], PARTY.wash[1]);
        ctx.scale(1, 0.3);
        drawMixed(t, 1.3, 0, 0, 120, 0.1 + 0.14 * pulse);
        ctx.restore();

        // Festoon lights chasing along a sagging string
        const [[x0, y0], [x1, y1]] = PARTY.festoon;
        const n = 12;
        for (let i = 0; i <= n; i++) {
            const f = i / n;
            const x = x0 + (x1 - x0) * f;
            const y = y0 + (y1 - y0) * f + Math.sin(f * Math.PI) * 6;
            const chase = Math.exp(-(((beat(t) * 2 - i) % 4 + 4) % 4) * 1.6);
            const col = PARTY_SPRITES[i % PARTY_SPRITES.length];
            drawSprite(col, x, y, 4.5, 0.35 + 0.65 * chase);
            drawSprite(SPRITES.warm, x, y, 1.6, 0.6 + 0.4 * chase);
        }

        // DJ booth: LED strip and laptop glow
        const [bx, by, bw, bh] = PARTY.booth;
        for (let i = 0; i < 6; i++) {
            const on = ((Math.floor(beat(t) * 2) + i) % 6) < 2 ? 1 : 0.25;
            drawMixed(t, i * 0.6, bx + 2.5 + i * (bw - 5) / 5, by + bh - 2.5, 3.5, 0.8 * on);
        }
        drawSprite(SPRITES.white, PARTY.dj[0] - 3, by - 1.5, 6, 0.35);

        // Champagne spray catching the light
        spray.forEach(p => {
            const life = (t - p.born) / p.life;
            drawSprite(SPRITES.warm, p.x, p.y, 1.6 + p.r * 2, 0.75 * (1 - life) * (0.6 + 0.4 * hash(Math.floor(t * 20) + p.born)));
        });
    }

    // People: drawn as silhouettes, rim-lit by the fire and the party lights
    function drawParty(t) {
        const b = beat(t);
        const p = b % 1;
        const dip = (1 - Math.cos(p * Math.PI * 2)) / 2;   // knees bend on every beat
        const sway = Math.sin(b * Math.PI);                 // hips swing across two beats

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        /* Dancer with the champagne bottle */
        const tip = drawFigure(t, {
            x: PARTY.dancer[0], y: PARTY.dancer[1], phase: 0,
            jacket: [40, 58, 84], trousers: [26, 26, 34], hat: [140, 40, 42], bobble: true,
            arms: 'bottle'
        });
        bottleTip.x = tip.x;
        bottleTip.y = tip.y;

        /* Pole for the festoon lights */
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = 'rgb(30,26,26)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(PARTY.pole[0], PARTY.pole[1]);
        ctx.lineTo(PARTY.pole[0], PARTY.pole[2]);
        ctx.stroke();
        // and the string itself
        const [[x0, y0], [x1, y1]] = PARTY.festoon;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 12, x1, y1);
        ctx.stroke();

        /* DJ, behind the booth */
        const [jx, jy] = PARTY.dj;
        const nod = Math.max(0, Math.cos(p * Math.PI * 2)) * 0.9;
        const fistUp = (Math.floor(b) % 16) >= 12;          // a fist pump every few bars
        ctx.globalAlpha = 0.97;
        ctx.fillStyle = 'rgb(22,18,26)';
        ctx.strokeStyle = 'rgb(22,18,26)';
        // Torso and head
        ctx.beginPath();
        ctx.moveTo(jx - 4, jy - 9.5 + nod * 0.4);
        ctx.lineTo(jx + 4, jy - 9.5 + nod * 0.4);
        ctx.lineTo(jx + 3.4, jy + 1);
        ctx.lineTo(jx - 3.4, jy + 1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(jx, jy - 12.6 + nod, 2.4, 0, 6.283);
        ctx.fill();
        // Headphones
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(jx, jy - 12.6 + nod, 3, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
        // Arms: one on the decks, one working the mixer or punching the air
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(jx - 3.4, jy - 8);
        ctx.lineTo(jx - 6, jy - 2.5);
        ctx.lineTo(jx - 4 + Math.sin(t * 3) * 0.6, jy - 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(jx + 3.4, jy - 8);
        if (fistUp) {
            ctx.lineTo(jx + 6, jy - 13);
            ctx.lineTo(jx + 6.5, jy - 18.5 + Math.sin(p * Math.PI * 2) * 1.2);
        } else {
            ctx.lineTo(jx + 6, jy - 2.5);
            ctx.lineTo(jx + 3.5, jy - 0.5);
        }
        ctx.stroke();

        // Booth
        const [bx, by, bw, bh] = PARTY.booth;
        ctx.fillStyle = 'rgb(16,14,20)';
        ctx.fillRect(bx, by, bw, bh);
        // Laptop
        ctx.fillStyle = 'rgb(205,220,240)';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(jx - 5.5, by);
        ctx.lineTo(jx - 1.5, by);
        ctx.lineTo(jx - 2.2, by - 2.6);
        ctx.lineTo(jx - 6.2, by - 2.6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    /* ---------- more party-goers ---------- */

    function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

    function drawDancer([x, y, jacket, trousers, hat], i, t) {
        drawFigure(t, { x, y, phase: 0.37 * (i + 1), jacket, trousers, hat, arms: 'sway' });
    }

    // A person in winter clothes, drawn as soft filled shapes rather than lines, moving gently
    // to the beat. Returns the bottle tip (image coordinates) when holding one.
    function drawFigure(t, o) {
        const b = beat(t) + o.phase;
        const p = b % 1;
        const dip = (1 - Math.cos(p * Math.PI * 2)) / 2 * 0.7;   // a soft knee bounce
        const sway = Math.sin(b * Math.PI) * 0.6;                 // weight shifting side to side
        const hipX = sway * 0.7;
        const hipY = -15.5 + dip;
        const shX = hipX * 0.35;
        const shY = hipY - 10.5 + dip * 0.2;
        const fill = c => { ctx.fillStyle = rgb(c); ctx.fill(); };
        let tip = null;

        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.globalAlpha = 0.95;
        // Soften the edges a touch so the figure sits in the painting
        ctx.filter = `blur(${(0.35 * k).toFixed(2)}px)`;

        // Legs: tapered trousers, knees slightly bent, then boots
        [-1, 1].forEach(side => {
            const kx = hipX * 0.5 + side * (1.5 + dip * 0.4);
            const ky = hipY * 0.5;
            const fx = side * 1.8;
            ctx.beginPath();
            ctx.moveTo(hipX + side * 0.2, hipY);
            ctx.lineTo(hipX + side * 2.4, hipY);
            ctx.lineTo(kx + side * 1.1, ky);
            ctx.lineTo(fx + side * 0.8, -1.2);
            ctx.lineTo(fx - side * 0.8, -1.2);
            ctx.lineTo(kx - side * 0.9, ky);
            ctx.closePath();
            fill(o.trousers);
            ctx.beginPath();
            ctx.ellipse(fx + side * 0.3, -0.7, 1.3, 0.8, 0, 0, 6.283);
            fill([20, 18, 22]);
        });

        // Puffy ski jacket, wider at the shoulders and a little flared at the hem
        ctx.beginPath();
        ctx.moveTo(shX - 3.6, shY + 0.6);
        ctx.quadraticCurveTo(shX - 4.6, (shY + hipY) / 2, hipX - 3.4, hipY + 1.2);
        ctx.lineTo(hipX + 3.4, hipY + 1.2);
        ctx.quadraticCurveTo(shX + 4.6, (shY + hipY) / 2, shX + 3.6, shY + 0.6);
        ctx.quadraticCurveTo(shX, shY - 1, shX - 3.6, shY + 0.6);
        fill(o.jacket);

        // Arms as tapered sleeves with a glove at the end
        const sleeve = (sx, sy, ex, ey, hx, hy) => {
            ctx.strokeStyle = rgb(o.jacket);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2.3;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(hx, hy, 0.95, 0, 6.283);
            fill([24, 22, 26]);
        };
        const lift = Math.sin(p * Math.PI * 2) * 0.8;
        if (o.arms === 'bottle') {
            // Bottle held up, rising and falling a little on the beat; other hand by the chest
            const hx = shX + 4.6;
            const hy = shY - 9.5 + lift;
            sleeve(shX + 3, shY + 1, shX + 5.2, shY - 4 + lift * 0.5, hx, hy);
            sleeve(shX - 3, shY + 1, shX - 4.4, shY + 5, shX - 1.6, shY + 4.6 - lift * 0.3);
            const tx = hx + 1.6;
            const ty = hy - 4;
            ctx.strokeStyle = 'rgb(26,52,34)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hx - 0.4, hy + 1);
            ctx.lineTo(tx, ty);
            ctx.stroke();
            ctx.fillStyle = 'rgb(200,170,96)';
            ctx.beginPath();
            ctx.arc(tx, ty, 0.6, 0, 6.283);
            ctx.fill();
            tip = { x: o.x + tx, y: o.y + ty };
        } else {
            // Drink raised in one hand, swaying gently; the other arm loose at the side
            const w = Math.sin(b * Math.PI * 0.5) * 0.6;
            const gx = shX + 4.2 + w * 0.4;
            const gy = shY - 7.5 + lift * 0.6;
            sleeve(shX + 3, shY + 1, shX + 5.4, shY - 3 + lift * 0.3, gx, gy);
            sleeve(shX - 3, shY + 1, shX - 4.6, shY + 5, shX - 4.2 - w * 0.3, shY + 8.5);
            ctx.fillStyle = 'rgba(230,220,200,0.8)';
            ctx.fillRect(gx - 0.5, gy - 2.6, 1, 2);
        }

        // Head, hat and (for the main dancer) a bobble
        const hx = shX + sway * 0.25;
        const hy = shY - 3.2;
        ctx.beginPath();
        ctx.arc(hx, hy, 2.2, 0, 6.283);
        fill([46, 34, 28]);
        if (o.hat) {
            ctx.beginPath();
            ctx.arc(hx, hy - 0.7, 2.3, Math.PI, 0);
            ctx.lineTo(hx + 2.3, hy - 0.3);
            ctx.lineTo(hx - 2.3, hy - 0.3);
            fill(o.hat);
            if (o.bobble) {
                ctx.beginPath();
                ctx.arc(hx, hy - 3.3, 0.85, 0, 6.283);
                fill(o.hat);
            }
        }

        // Warm rim light from the fire pit on the right
        ctx.filter = 'none';
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = 'rgb(255,160,80)';
        ctx.lineWidth = 0.45;
        ctx.beginPath();
        ctx.moveTo(shX + 3.8, shY + 1);
        ctx.quadraticCurveTo(shX + 4.6, (shY + hipY) / 2, hipX + 3.4, hipY + 1);
        ctx.stroke();

        ctx.restore();
        return tip;
    }

    // Painted crowd members throw their hands up: each one for a couple of bars at a time
    const crowdState = CROWD_ARMS.map((_, i) => ({ start: -10, end: -10, next: 3 + i * 2.5 + hash(i + 900) * 4 }));

    function updateCrowd(t) {
        crowdState.forEach(s => {
            if (t >= s.next) {
                s.start = t;
                s.end = t + 3 + Math.random() * 5;
                s.next = s.end + 2 + Math.random() * 8;
            }
        });
    }

    function drawCrowd(t) {
        const p = beat(t) % 1;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.filter = `blur(${(0.35 * k).toFixed(2)}px)`;
        CROWD_ARMS.forEach(([lx, rx, sy, col], i) => {
            const s = crowdState[i];
            // Ease the arm up and down slowly rather than snapping
            const r = Math.max(0, Math.min(1, (t - s.start) / 0.9, (s.end - t) / 0.9));
            const raise = r * r * (3 - 2 * r);
            if (raise <= 0) return;
            const pump = Math.sin((p + i * 0.25) * Math.PI * 2) * 0.6;
            ctx.globalAlpha = 0.93;
            // Mostly one hand up; some people put both up
            const sides = i % 2 ? [[rx, 1]] : [[lx, -1], [rx, 1]];
            sides.forEach(([x, side]) => {
                const reach = raise * (7 + pump);
                const ex = x + side * 1.8;
                const ey = sy - reach * 0.5;
                const hx = x + side * 1.1;
                const hy = sy - reach;
                ctx.strokeStyle = rgb(col);
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(x, sy + 1);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(hx, hy);
                ctx.stroke();
                ctx.fillStyle = 'rgb(24,22,26)';
                ctx.beginPath();
                ctx.arc(hx, hy, 0.9, 0, 6.283);
                ctx.fill();
            });
        });
        ctx.restore();
    }

    /* ---------- monkeys ---------- */

    const monkeyState = MONKEYS.map((_, i) => ({ look: 0, lookAim: 0, nextLook: 1 + i * 1.7, scratch: -10, nextScratch: 5 + i * 4, shift: 0, shiftAim: 0 }));

    function updateMonkeys(t, dt) {
        monkeyState.forEach((s, i) => {
            if (t >= s.nextLook) {
                s.lookAim = (Math.random() - 0.5) * 2;
                s.nextLook = t + 1.5 + Math.random() * 5;
                // Now and then a monkey shuffles along its frond
                if (Math.random() < 0.25 && MONKEYS[i][3] !== 'hanging') s.shiftAim = (Math.random() - 0.5) * 2.5;
            }
            if (t >= s.nextScratch) {
                s.scratch = t;
                s.nextScratch = t + 6 + Math.random() * 12;
            }
            s.look += (s.lookAim - s.look) * Math.min(1, dt * 6);
            s.shift += (s.shiftAim - s.shift) * Math.min(1, dt * 1.5);
        });
    }

    function drawMonkeys(t) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const fur = 'rgb(44,34,28)';
        MONKEYS.forEach(([mx, my, h, kind], i) => {
            const s = monkeyState[i];
            const tail = Math.sin(t * 0.9 + i * 2) * h * 0.12;
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = fur;
            ctx.strokeStyle = fur;

            if (kind === 'hanging') {
                // Hangs from a frond tip by its arms, swinging gently
                const swing = Math.sin(t * 1.3) * 0.18 + s.look * 0.05;
                ctx.translate(mx, my);
                ctx.rotate(swing);
                ctx.lineWidth = h * 0.13;
                ctx.beginPath();
                ctx.moveTo(-h * 0.12, 0);
                ctx.lineTo(-h * 0.14, h * 0.45);
                ctx.moveTo(h * 0.12, 0);
                ctx.lineTo(h * 0.14, h * 0.45);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(s.look * h * 0.05, h * 0.55, h * 0.18, 0, 6.283);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, h * 0.95, h * 0.2, h * 0.33, 0, 0, 6.283);
                ctx.fill();
                ctx.lineWidth = h * 0.12;
                ctx.beginPath();
                ctx.moveTo(-h * 0.1, h * 1.2);
                ctx.lineTo(-h * 0.16 + Math.sin(t * 2) * h * 0.06, h * 1.55);
                ctx.moveTo(h * 0.1, h * 1.2);
                ctx.lineTo(h * 0.16 - Math.sin(t * 2) * h * 0.06, h * 1.55);
                ctx.stroke();
                ctx.lineWidth = h * 0.07;
                ctx.beginPath();
                ctx.moveTo(0, h * 1.25);
                ctx.quadraticCurveTo(h * 0.4, h * 1.7, h * 0.25 + tail, h * 2.1);
                ctx.stroke();
                ctx.restore();
                return;
            }

            ctx.translate(mx + s.shift, my);
            // Tail hanging down over the frond
            ctx.lineWidth = h * 0.08;
            ctx.beginPath();
            ctx.moveTo(-h * 0.15, -h * 0.05);
            ctx.quadraticCurveTo(-h * 0.35, h * 0.6, -h * 0.25 + tail, h * 1.2);
            ctx.stroke();
            // Body, hunched
            ctx.beginPath();
            ctx.ellipse(0, -h * 0.35, h * 0.27, h * 0.37, 0.12, 0, 6.283);
            ctx.fill();
            // Haunches
            ctx.beginPath();
            ctx.ellipse(h * 0.08, -h * 0.08, h * 0.3, h * 0.14, 0, 0, 6.283);
            ctx.fill();
            // Head turns to look around
            const hx = h * 0.1 + s.look * h * 0.07;
            ctx.beginPath();
            ctx.arc(hx, -h * 0.8, h * 0.2, 0, 6.283);
            ctx.fill();
            // A slightly paler face, turned the way it is looking
            if (kind === 'adult') {
                ctx.fillStyle = 'rgb(120,96,80)';
                ctx.globalAlpha = 0.55;
                ctx.beginPath();
                ctx.arc(hx + s.look * h * 0.06, -h * 0.78, h * 0.1, 0, 6.283);
                ctx.fill();
                ctx.globalAlpha = 0.95;
                ctx.fillStyle = fur;
            }
            // Arm: resting on the knee, or scratching its head now and then
            const sc = t - s.scratch;
            ctx.lineWidth = h * 0.11;
            ctx.beginPath();
            ctx.moveTo(h * 0.15, -h * 0.55);
            if (sc < 1.6) {
                const wob = Math.sin(sc * 18) * h * 0.04;
                ctx.lineTo(h * 0.35, -h * 0.8);
                ctx.lineTo(h * 0.2 + wob, -h * 0.98);
            } else {
                ctx.lineTo(h * 0.3, -h * 0.3);
                ctx.lineTo(h * 0.28, -h * 0.12);
            }
            ctx.stroke();
            ctx.restore();
        });
        ctx.restore();
    }

    /* ---------- tropical fish ---------- */

    const fishClip = new Path2D();
    TANK.forEach(([x, y], i) => (i ? fishClip.lineTo(x, y) : fishClip.moveTo(x, y)));
    fishClip.closePath();
    DIVER_SHAPES.forEach(poly => poly.forEach(([x, y], i) => (i ? fishClip.lineTo(x, y) : fishClip.moveTo(x, y))));

    const fish = [];
    let nextFish = 1;

    function spawnFish(t, anywhere) {
        const ltr = Math.random() < 0.5;
        const school = Math.random() < 0.3;
        const n = school ? 3 + Math.floor(Math.random() * 4) : 1;
        const y = 625 + Math.random() * 150;
        const col = school ? [32, 76, 124] : FISH_COLOURS[Math.floor(Math.random() * FISH_COLOURS.length)];
        const speed = (school ? 12 : 5 + Math.random() * 7) * (ltr ? 1 : -1);
        const startX = anywhere ? 1290 + Math.random() * 340 : (ltr ? 1250 : 1680);
        for (let i = 0; i < n; i++) {
            fish.push({
                x: startX - (ltr ? 1 : -1) * i * (5 + Math.random() * 4),
                y: y + (Math.random() - 0.5) * (school ? 9 : 0),
                vx: speed * (0.95 + Math.random() * 0.1),
                size: school ? 3 : 3.8 + Math.random() * 2.4,
                col, seed: Math.random() * 50, born: t
            });
        }
    }

    // A few fish are already swimming when the page opens
    for (let i = 0; i < 5; i++) spawnFish(0, true);

    function updateFish(t, dt) {
        if (t >= nextFish) {
            if (fish.length < 14) spawnFish(t);
            nextFish = t + 1.5 + Math.random() * 3;
        }
        for (let i = fish.length - 1; i >= 0; i--) {
            const f = fish[i];
            // Fish cruise, pause and dart rather than moving at a constant speed
            const pace = 0.6 + 0.8 * noise(t * 0.4 + f.seed);
            f.x += f.vx * pace * dt;
            f.y += Math.sin(t * 0.6 + f.seed) * 2 * dt;
            if (f.x < 1240 || f.x > 1690) fish.splice(i, 1);
        }
    }

    function drawFish(t) {
        ctx.save();
        ctx.clip(fishClip, 'evenodd');
        ctx.globalCompositeOperation = 'source-over';
        // Soft, out-of-focus fish in the background of the tank
        ctx.filter = `blur(${(0.8 * k).toFixed(2)}px)`;
        fish.forEach(f => {
            const dir = f.vx > 0 ? 1 : -1;
            const wag = Math.sin(t * 9 + f.seed) * 0.35;
            const s = f.size;
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.scale(dir, 1);
            // Faded, as if seen through deep water
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = rgb(f.col);
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s * 0.42, 0, 0, 6.283);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-s * 0.8, 0);
            ctx.lineTo(-s * 1.55, -s * (0.45 + wag * 0.3));
            ctx.lineTo(-s * 1.55, s * (0.45 - wag * 0.3));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();
    }

    /* ---------- laptop screen ---------- */

    // Projective map from the unit square onto a quad (so all four corners land exactly)
    function homography([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
        const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
        const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
        const den = dx1 * dy2 - dx2 * dy1;
        const g = (dx3 * dy2 - dx2 * dy3) / den;
        const h = (dx1 * dy3 - dx3 * dy1) / den;
        const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
        const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
        return (u, v) => {
            const w = g * u + h * v + 1;
            return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
        };
    }

    // Draw one triangle of the source image onto a destination triangle
    function drawTriangle(c, img, s0, s1, s2, d0, d1, d2) {
        // Grow the clip triangle very slightly so neighbouring pieces overlap without seams
        const cx = (d0[0] + d1[0] + d2[0]) / 3;
        const cy = (d0[1] + d1[1] + d2[1]) / 3;
        const grow = q => [q[0] + (q[0] - cx) * 0.04, q[1] + (q[1] - cy) * 0.04];
        const [e0, e1, e2] = [grow(d0), grow(d1), grow(d2)];
        c.save();
        c.beginPath();
        c.moveTo(e0[0], e0[1]);
        c.lineTo(e1[0], e1[1]);
        c.lineTo(e2[0], e2[1]);
        c.closePath();
        c.clip();
        const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]);
        const m11 = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den;
        const m12 = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
        const m21 = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den;
        const m22 = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
        c.transform(m11, m21, m12, m22, d0[0] - m11 * s0[0] - m12 * s0[1], d0[1] - m21 * s0[0] - m22 * s0[1]);
        c.drawImage(img, 0, 0);
        c.restore();
    }

    // The screen is static, so it is drawn once (and again only if the canvas is resized)
    function drawLaptop() {
        if (!k) return;
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
        sctx.setTransform(k, 0, 0, k, 0, 0);
        drawPostIt();
        if (!laptopImg.complete || !laptopImg.naturalWidth) return;
        const w = laptopImg.naturalWidth;
        const h = laptopImg.naturalHeight;
        const map = homography(LAPTOP);
        const N = 8;
        sctx.globalAlpha = 0.88;
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N;
                const s00 = [u0 * w, v0 * h], s10 = [u1 * w, v0 * h], s11 = [u1 * w, v1 * h], s01 = [u0 * w, v1 * h];
                const d00 = map(u0, v0), d10 = map(u1, v0), d11 = map(u1, v1), d01 = map(u0, v1);
                drawTriangle(sctx, laptopImg, s00, s10, s11, d00, d10, d11);
                drawTriangle(sctx, laptopImg, s00, s11, s01, d00, d11, d01);
            }
        }
        // A faint diagonal glare across the glass
        const [tl, , br] = [LAPTOP[0], LAPTOP[1], LAPTOP[2]];
        const g = sctx.createLinearGradient(tl[0], tl[1], br[0], br[1]);
        g.addColorStop(0.15, 'rgba(255,255,255,0)');
        g.addColorStop(0.35, 'rgba(220,230,255,0.07)');
        g.addColorStop(0.55, 'rgba(255,255,255,0)');
        sctx.globalAlpha = 1;
        sctx.fillStyle = g;
        sctx.beginPath();
        LAPTOP.forEach(([x, y], i) => (i ? sctx.lineTo(x, y) : sctx.moveTo(x, y)));
        sctx.closePath();
        sctx.fill();
    }
    laptopImg.addEventListener('load', drawLaptop);

    // A yellow post-it on the desk by the headphones, "NPD" in black marker. It lies flat on
    // the desk, so it is foreshortened, and it is turned a little off square.
    // The note is drawn flat on a small canvas, then warped onto its corners on the desk
    const postItTex = document.createElement('canvas');
    postItTex.width = postItTex.height = 96;
    function paintPostIt() {
        const c = postItTex;
        const x = c.getContext('2d');
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.clearRect(0, 0, 96, 96);
        const g = x.createLinearGradient(0, 0, 96, 96);
        g.addColorStop(0, 'rgb(218,194,88)');
        g.addColorStop(1, 'rgb(178,152,60)');
        x.fillStyle = g;
        x.beginPath();
        x.moveTo(0, 0);
        x.lineTo(96, 0);
        x.lineTo(96, 84);
        x.lineTo(84, 96);       // the bottom corner curls up slightly
        x.lineTo(0, 96);
        x.closePath();
        x.fill();
        x.fillStyle = 'rgba(120,96,30,0.6)';
        x.beginPath();
        x.moveTo(96, 84);
        x.lineTo(84, 96);
        x.lineTo(86, 86);
        x.closePath();
        x.fill();
        // Sticky strip along the top, very faintly darker
        x.fillStyle = 'rgba(150,120,40,0.18)';
        x.fillRect(0, 0, 96, 16);
        // "NPD" handwritten in black marker
        x.fillStyle = 'rgba(24,22,28,0.9)';
        x.font = '40px "Permanent Marker", "Segoe Print", cursive';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.translate(47, 54);
        x.rotate(-0.08);
        x.fillText('NPD', 0, 0);
    }
    paintPostIt();
    // Repaint once the handwriting font has loaded
    if (document.fonts && document.fonts.load) {
        document.fonts.load('40px "Permanent Marker"').then(() => { paintPostIt(); drawLaptop(); }).catch(() => {});
    }

    function drawPostIt() {
        // Soft contact shadow just below and right of the note
        sctx.save();
        sctx.globalAlpha = 0.3;
        sctx.fillStyle = 'rgb(10,8,8)';
        sctx.beginPath();
        POSTIT.forEach(([x, y], i) => (i ? sctx.lineTo(x + 0.6, y + 0.8) : sctx.moveTo(x + 0.6, y + 0.8)));
        sctx.closePath();
        sctx.fill();
        sctx.restore();

        const map = homography(POSTIT);
        const N = 4;
        const w = postItTex.width;
        sctx.save();
        sctx.globalAlpha = 0.95;
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N;
                const s00 = [u0 * w, v0 * w], s10 = [u1 * w, v0 * w], s11 = [u1 * w, v1 * w], s01 = [u0 * w, v1 * w];
                drawTriangle(sctx, postItTex, s00, s10, s11, map(u0, v0), map(u1, v0), map(u1, v1));
                drawTriangle(sctx, postItTex, s00, s11, s01, map(u0, v0), map(u1, v1), map(u0, v1));
            }
        }
        sctx.restore();
    }

    /* ---------- oryx ---------- */

    // It walks round the loop in one direction only, in short bouts with long pauses to graze,
    // so it turns gradually and never snaps from facing one way to the other.
    const oryx = { phi: Math.PI * 0.7, walking: false, until: 4, gait: 0, head: 0 };

    function updateOryx(t, dt) {
        const o = oryx;
        if (t >= o.until) {
            o.walking = !o.walking;
            o.until = t + (o.walking ? 5 + Math.random() * 9 : 7 + Math.random() * 16);
        }
        if (o.walking) {
            o.phi += (1.1 / ORYX_LOOP.rx) * dt;   // about 1px a second
            o.gait += dt * 5;
        }
        // Head comes up to walk and goes down to graze
        o.head += ((o.walking ? 0 : 1) - o.head) * Math.min(1, dt * 1.2);
    }

    function drawOryx(t) {
        const o = oryx;
        const { cx, cy, rx, ry } = ORYX_LOOP;
        const x = cx + Math.cos(o.phi) * rx;
        const y = cy + Math.sin(o.phi) * ry;
        const depth = 0.9 + 0.1 * (Math.sin(o.phi) + 1);   // a touch larger on the near side
        const side = -Math.sin(o.phi);                      // how side-on it is, and which way it faces
        const dir = side >= 0 ? 1 : -1;
        const ls = 0.3 + 0.7 * Math.abs(side);              // body foreshortens as it turns
        const h = 4 * depth;
        const bodyR = h * 0.8 * ls;
        const step = o.walking ? Math.sin(o.gait) : 0;

        ctx.save();
        ctx.translate(x, y);
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';

        // Legs, dark lower half like the real thing
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = 'rgb(70,52,44)';
        ctx.lineWidth = 0.5;
        [[-0.6, step], [-0.35, -step], [0.45, -step], [0.7, step]].forEach(([f, s]) => {
            ctx.beginPath();
            ctx.moveTo(f * bodyR, -h * 0.62);
            ctx.lineTo(f * bodyR + s * 0.5 * ls, 0);
            ctx.stroke();
        });

        // Pale body, warmed by the evening light
        ctx.fillStyle = 'rgb(214,190,160)';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.78, Math.max(bodyR, h * 0.32), h * 0.27, 0, 0, 6.283);
        ctx.fill();

        // Neck and head, lowered to graze
        const hx = dir * (bodyR + h * 0.25 * ls);
        const hy = -h * (1.15 - 0.75 * o.head);
        ctx.strokeStyle = 'rgb(214,190,160)';
        ctx.lineWidth = h * 0.18;
        ctx.beginPath();
        ctx.moveTo(dir * bodyR * 0.75, -h * 0.85);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        ctx.fillStyle = 'rgb(90,70,60)';   // the dark face markings
        ctx.beginPath();
        ctx.arc(hx, hy, h * 0.13, 0, 6.283);
        ctx.fill();

        // Long, straight, swept-back horns
        ctx.strokeStyle = 'rgb(60,48,44)';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(hx, hy - h * 0.08);
        ctx.lineTo(hx - dir * h * 0.35 * ls, hy - h * (0.95 - 0.25 * o.head));
        ctx.stroke();

        // Tail flick now and then
        const flick = Math.sin(t * 0.7) > 0.95 ? Math.sin(t * 25) * 0.3 : 0;
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.moveTo(-dir * bodyR, -h * 0.85);
        ctx.lineTo(-dir * (bodyR + 0.4 * ls) + flick, -h * 0.45);
        ctx.stroke();

        ctx.restore();
    }

    /* ---------- hut porch lights ---------- */

    const hutState = HUT_LIGHTS.map((_, i) => ({ on: hash(i + 400) > 0.5, since: -10, next: 2 + hash(i + 500) * 8 }));

    function updateHutLights(t) {
        hutState.forEach(s => {
            if (t >= s.next) {
                s.on = !s.on;
                s.since = t;
                // Lights stay on longer than they stay off
                s.next = t + (s.on ? 6 + Math.random() * 18 : 3 + Math.random() * 9);
            }
        });
    }

    function drawHutLights(t) {
        HUT_LIGHTS.forEach(([x, y, ry], i) => {
            const s = hutState[i];
            const ramp = Math.min(1, (t - s.since) / 0.8);
            const level = s.on ? ramp : 1 - ramp;
            // When off, darken the light painted into the picture so the change reads clearly
            if (level < 1) {
                ctx.globalCompositeOperation = 'source-over';
                drawSprite(SPRITES.dim, x, y, 9, 0.75 * (1 - level));
                ctx.globalCompositeOperation = 'lighter';
            }
            if (level <= 0) return;
            const a = level * (0.85 + 0.15 * noise(t * 3 + i * 9));
            drawSprite(SPRITES.warm, x, y, 14, a);
            drawSprite(SPRITES.fire, x, y, 40, 0.35 * a);
            if (ry) {
                // A soft reflection, stretched down the water
                ctx.globalAlpha = 0.4 * a;
                ctx.drawImage(SPRITES.warm, x - 2.5, ry - 10, 5, 22);
            }
        });
    }

    /* ---------- bridge lanterns ---------- */

    const lanternGusts = BRIDGE_LANTERNS.map((_, i) => ({ start: -10, end: -10, next: 4 + i * 3 + hash(i + 700) * 6 }));

    function updateLanterns(t) {
        lanternGusts.forEach(g => {
            if (t >= g.next) {
                g.start = t;
                g.end = t + 0.5 + Math.random() * 1.2;
                g.next = t + 6 + Math.random() * 12;
            }
        });
    }

    // How far a lantern has dipped right now, 0 (steady) to 1 (nearly out)
    function lanternDip(i, t) {
        const g = lanternGusts[i];
        if (t < g.start || t > g.end) return 0;
        return 0.35 + 0.65 * noise(t * 18 + i * 31);
    }

    function drawLanterns(t) {
        BRIDGE_LANTERNS.forEach(([x, y], i) => {
            const dip = lanternDip(i, t);
            if (dip > 0) {
                ctx.globalCompositeOperation = 'source-over';
                drawSprite(SPRITES.dim, x, y, 9, 0.6 * dip);
                ctx.globalCompositeOperation = 'lighter';
            }
            drawSprite(SPRITES.fire, x, y, 20, 0.22 * (1 - dip) * (0.85 + 0.15 * noise(t * 2 + i * 5)));
        });
    }

    /* ---------- sailboat ripples and bilge ---------- */

    const wakeRings = [];
    const bilgeDrops = [];
    const nextWake = BOAT_WAKE.map((_, i) => 1 + i * 1.3);
    let bilgeStart = 5;
    let bilgeEnd = 0;
    let nextDrop = 0;

    function updateBoat(t, dt) {
        BOAT_WAKE.forEach(([x, y], i) => {
            if (t >= nextWake[i]) {
                wakeRings.push({ x, y, born: t, life: 3.2, max: 20 });
                nextWake[i] = t + 2.2 + Math.random() * 1.8;
            }
        });

        // Every so often the bilge pump runs for a few seconds
        if (t >= bilgeStart) {
            bilgeEnd = t + 3 + Math.random() * 3;
            bilgeStart = t + 9 + Math.random() * 8;
        }
        if (t < bilgeEnd && t >= nextDrop) {
            bilgeDrops.push({ x: BILGE[0], y: BILGE[1], vx: 3 + Math.random() * 2, vy: Math.random() * 2 });
            nextDrop = t + 0.04 + Math.random() * 0.05;
        }
        for (let i = bilgeDrops.length - 1; i >= 0; i--) {
            const d = bilgeDrops[i];
            d.vy += 60 * dt;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            if (d.y >= BOAT_WATERLINE) {
                if (Math.random() < 0.25) wakeRings.push({ x: d.x, y: BOAT_WATERLINE, born: t, life: 1.4, max: 4 });
                bilgeDrops.splice(i, 1);
            }
        }
        for (let i = wakeRings.length - 1; i >= 0; i--) {
            if (t - wakeRings[i].born > wakeRings[i].life) wakeRings.splice(i, 1);
        }
    }

    function drawBoat(t) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgb(220,230,245)';
        ctx.lineWidth = 0.5;
        // Only the front half of each ring, so the ripples sit on the water in front of the hull
        wakeRings.forEach(r => {
            const life = (t - r.born) / r.life;
            const rx = 1.5 + life * r.max;
            ctx.globalAlpha = 0.75 * (1 - life);
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, rx, rx * 0.22, 0, 0, Math.PI);
            ctx.stroke();
        });
        ctx.fillStyle = 'rgb(225,235,245)';
        bilgeDrops.forEach(d => {
            ctx.globalAlpha = 0.6;
            ctx.fillRect(d.x - 0.25, d.y - 0.25, 0.5, 0.5);
        });
        ctx.globalAlpha = 1;
    }

    /* ---------- gecko ---------- */

    const gecko = { active: false, next: 8 };
    const geckoSegs = GECKO_PATH.slice(1).map((p, i) => Math.hypot(p[0] - GECKO_PATH[i][0], p[1] - GECKO_PATH[i][1]));
    const geckoLength = geckoSegs.reduce((a, b) => a + b, 0);

    // Position and heading at a distance along the trunk
    function geckoAt(s) {
        for (let i = 0; i < geckoSegs.length; i++) {
            if (s <= geckoSegs[i] || i === geckoSegs.length - 1) {
                const [x0, y0] = GECKO_PATH[i];
                const [x1, y1] = GECKO_PATH[i + 1];
                const f = Math.min(1, s / geckoSegs[i]);
                return { x: x0 + (x1 - x0) * f + geckoShift, y: y0 + (y1 - y0) * f, heading: Math.atan2(y1 - y0, x1 - x0) };
            }
            s -= geckoSegs[i];
        }
    }

    function updateGecko(t, dt) {
        const g = gecko;
        if (!g.active) {
            if (t >= g.next) {
                // Only climb when some of the wall is actually on screen
                if (geckoShift === null) { g.next = t + 10; return; }
                Object.assign(g, { active: true, s: 0, side: 0, sideAim: 0, moving: true, until: t + 1, phase: 0, fade: 0, turn: 0 });
            }
            return;
        }
        // Stop-start climbing: short dashes, then pauses, sometimes looking around
        if (t >= g.until) {
            g.moving = !g.moving;
            g.until = t + (g.moving ? 0.4 + Math.random() * 0.9 : 1 + Math.random() * 3.5);
            g.sideAim = (Math.random() - 0.5) * 4;
            g.turnAim = g.moving ? 0 : (Math.random() - 0.5) * 0.7;
        }
        if (g.moving) {
            g.s += 16 * dt;
            g.phase += dt * 16;
        }
        g.side += (g.sideAim - g.side) * Math.min(1, dt * 3);
        g.turn += ((g.turnAim || 0) - g.turn) * Math.min(1, dt * 5);

        const p = geckoAt(g.s);
        g.x = p.x + g.side;
        g.y = p.y;
        g.heading = p.heading + g.turn;
        // Emerge from the bushes at the bottom, disappear into the fronds at the top
        g.fade = Math.min(1, g.s / 20);
        if (g.s >= geckoLength) {
            g.active = false;
            g.next = t + 30 + Math.random() * 30;
        }
    }

    function drawGecko(t) {
        const g = gecko;
        if (!g.active || g.fade <= 0) return;
        const step = g.moving ? Math.sin(g.phase) : 0;
        const sway = g.moving ? Math.sin(g.phase * 0.5) * 1.4 : Math.sin(t * 0.8) * 0.5;

        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.heading + Math.PI / 2);   // the drawing below faces "up"
        ctx.scale(1.1, 1.1);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.8 * g.fade;
        ctx.fillStyle = 'rgb(96,84,74)';   // camouflaged: only a shade lighter than the stone
        ctx.strokeStyle = 'rgb(96,84,74)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Legs, moving in diagonal pairs
        ctx.lineWidth = 0.8;
        [[-1, -1, step], [1, -1, -step], [-1, 1, -step], [1, 1, step]].forEach(([side, end, s]) => {
            const sy = end * 2.6;
            const reach = end < 0 ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(side * 1.3, sy);
            ctx.lineTo(side * 3.1, sy + reach * 0.6 + s * 0.7);
            ctx.lineTo(side * 3.5, sy + reach * 2.3 + s * 1.4);
            ctx.stroke();
        });

        // Tail, body and head
        ctx.beginPath();
        ctx.moveTo(-1, 3.4);
        ctx.quadraticCurveTo(-0.5 + sway * 0.5, 9, sway, 14);
        ctx.quadraticCurveTo(0.5 + sway * 0.5, 9, 1, 3.4);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.7, 4.2, 0, 0, 6.283);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -5.5, 1.45, 2.1, 0, 0, 6.283);
        ctx.fill();

        // A faint warm rim from the fire below
        ctx.globalAlpha = 0.12 * g.fade;
        ctx.strokeStyle = 'rgb(255,170,100)';
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.7, 4.2, 0, 0.3, 2.6);
        ctx.stroke();

        ctx.restore();
    }

    /* ---------- distant plane ---------- */

    const plane = { active: false, next: 15 };

    function updatePlane(t) {
        const p = plane;
        if (!p.active && t >= p.next) {
            const ltr = Math.random() < 0.5;
            Object.assign(p, {
                active: true, born: t,
                x0: ltr ? PLANE_SKY.left : PLANE_SKY.right,
                x1: ltr ? PLANE_SKY.right : PLANE_SKY.left,
                y0: PLANE_SKY.top + Math.random() * (PLANE_SKY.bottom - PLANE_SKY.top),
                drift: (Math.random() - 0.5) * 20,
                dur: 45 + Math.random() * 20
            });
        }
        if (p.active && t - p.born > p.dur) {
            p.active = false;
            p.next = t + 40 + Math.random() * 40;
        }
    }

    function drawPlane(t) {
        const p = plane;
        if (!p.active) return;
        const k01 = (t - p.born) / p.dur;
        const x = p.x0 + (p.x1 - p.x0) * k01;
        const y = p.y0 + p.drift * k01;
        const edge = Math.min(1, k01 / 0.05, (1 - k01) / 0.05);
        const c = (t - p.born) % 1.3;
        drawSprite(SPRITES.white, x, y, 3.5, 0.7 * edge);
        if (c < 0.06 || (c > 0.18 && c < 0.24)) drawSprite(SPRITES.white, x, y, 5, 0.9 * edge);
        drawSprite(SPRITES.red, x + 1, y + 0.4, 3, (c > 0.6 && c < 0.9 ? 0.7 : 0.15) * edge);
    }

    /* ---------- parallax ---------- */

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let steered = false;

    /* ---------- swipe to explore (touch screens) ---------- */

    const panLimit = () => MARGIN / Math.max(1, overflowX);   // keep the overscan margin at each end

    // When the music starts, take one slow tour of the scene: centre, left, across to the
    // right, then back to centre. Any touch cancels it.
    let tour = null;
    addEventListener('isaacs:music', () => {
        if (overflowX < innerWidth * 0.3) return;
        const lo = panLimit(), hi = 1 - panLimit();
        const stops = [pan.focal, lo, hi, pan.base];
        const legs = stops.slice(1).map((f, i) => ({ from: stops[i], to: f, dur: 1.5 + Math.abs(f - stops[i]) * 14 }));
        tour = { legs, start: performance.now() / 1000 };
        pan.touched = true;   // no first-visit hint after this
        pan.vel = 0;
    });

    function runTour() {
        let el = performance.now() / 1000 - tour.start;
        for (const leg of tour.legs) {
            if (el < leg.dur) {
                const f = el / leg.dur;
                const e = f * f * (3 - 2 * f);
                pan.focal = leg.from + (leg.to - leg.from) * e;
                return;
            }
            el -= leg.dur;
        }
        tour = null;
    }

    function updatePan(t) {
        const lo = panLimit(), hi = 1 - panLimit();
        if (tour && !pan.dragging) {
            runTour();
            updateGeckoShift();
            return;
        }
        if (!pan.dragging) {
            if (!pan.touched && overflowX > innerWidth * 0.3 && t > 6 && t < 11) {
                // A one-off drift on phones to show there is more to see, then back
                const f = (t - 6) / 5;
                pan.focal = pan.base + Math.sin(f * Math.PI) * 0.16;
            } else {
                // Momentum after a swipe, easing to a stop and settling softly inside the edges
                pan.focal += pan.vel;
                pan.vel *= 0.93;
                if (pan.focal < lo) { pan.focal += (lo - pan.focal) * 0.2; pan.vel *= 0.5; }
                if (pan.focal > hi) { pan.focal += (hi - pan.focal) * 0.2; pan.vel *= 0.5; }
            }
            // Vertical, for when the screen is wider than the picture's shape (phone held sideways)
            const loY = MARGIN / Math.max(1, overflowY), hiY = 1 - loY;
            pan.focalY += pan.velY;
            pan.velY *= 0.93;
            if (pan.focalY < loY) { pan.focalY += (loY - pan.focalY) * 0.2; pan.velY *= 0.5; }
            if (pan.focalY > hiY) { pan.focalY += (hiY - pan.focalY) * 0.2; pan.velY *= 0.5; }
            updateGeckoShift();
        }
    }

    stage.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' || (overflowX < 40 && overflowY < 40)) return;
        pan.dragging = true;
        pan.touched = true;
        tour = null;
        pan.vel = 0;
        pan.velY = 0;
        pan.lastX = e.clientX;
        pan.lastY = e.clientY;
        pan.lastT = performance.now();
    });
    addEventListener('pointermove', e => {
        if (!pan.dragging) return;
        const now = performance.now();
        const d = -(e.clientX - pan.lastX) / overflowX;
        // A little resistance past the edges
        const lo = panLimit(), hi = 1 - panLimit();
        const out = pan.focal < lo || pan.focal > hi;
        pan.focal += out ? d * 0.35 : d;
        pan.vel = d / Math.max(1, (now - pan.lastT) / 16.7);
        if (overflowY > 2 * MARGIN) {
            const dy = -(e.clientY - pan.lastY) / overflowY;
            const outY = pan.focalY < 0 || pan.focalY > 1;
            pan.focalY += outY ? dy * 0.35 : dy;
            pan.velY = dy / Math.max(1, (now - pan.lastT) / 16.7);
        }
        pan.lastY = e.clientY;
        pan.lastX = e.clientX;
        pan.lastT = now;
    });
    const endDrag = () => { if (pan.dragging) { pan.dragging = false; pan.vel = Math.max(-0.04, Math.min(0.04, pan.vel)); pan.velY = Math.max(-0.04, Math.min(0.04, pan.velY)); } };
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);

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
        updatePan(t);
        const panPx = -overflowX * pan.focal;
        const panPy = -overflowY * pan.focalY;
        stage.style.transform = `translate3d(${(panPx - current.x * PARALLAX_X).toFixed(2)}px, ${(panPy - current.y * PARALLAX_Y).toFixed(2)}px, 0)`;
        ui.style.transform = `translate3d(${(-current.x * UI_PARALLAX).toFixed(2)}px, ${(-current.y * UI_PARALLAX).toFixed(2)}px, 0)`;
    }

    /* ---------- main loop ---------- */

    let start = 0;
    let last = 0;

    function frame(now) {
        // The first frame can be stamped fractionally before start; never let time run negative
        const t = Math.max(0, (now - start) / 1000);
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;

        applyParallax(t);
        updateBubbles(t, dt);
        updateSteam(t);
        updateCityEvents(t);
        updateEmbers(t, dt);
        updateHutLights(t);
        updateLanterns(t);
        updateBoat(t, dt);
        updateGecko(t, dt);
        updatePlane(t);
        updateParty(t, dt);
        updateCrowd(t);
        updateMonkeys(t, dt);
        updateFish(t, dt);
        updateOryx(t, dt);

        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.clearRect(0, 0, IMG_W, IMG_H);
        regions.forEach(r => drawDistort(r, t));
        drawBoat(t);
        drawFish(t);
        drawAquarium(t);
        drawMonkeys(t);
        drawOryx(t);
        drawSteam(t);
        drawGecko(t);
        drawParty(t);
        DANCERS.forEach((d, i) => drawDancer(d, i, t));
        drawCrowd(t);
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
