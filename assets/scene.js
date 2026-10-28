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
    // The painted Halloween version of the scene, loaded only once the light switch is on
    // The daytime painting, shown when the light switch on the column is on
    const dayImg = document.getElementById('scene-day');
    let dayOn = false;   // light switch: on = daylight, off = night (the default)
    let day = 0;         // 0 night .. 1 day (2-second fade)
    function loadDay() {
        if (!dayImg.getAttribute('src')) {
            dayImg.addEventListener('load', applyImages);
            dayImg.src = 'assets/background-day.jpg?v=111';
        }
    }
    // Which painting is showing: night by default, day when the light switch is on, and a scene
    // painting (night only) on top
    function applyImages() {
        const dayReady = dayImg.complete && dayImg.naturalWidth;
        dayImg.classList.toggle('on', dayOn && !!dayReady);
        hwImg.classList.toggle('on', chaosOn);
        xmImg.classList.toggle('on', xmasOn);
        document.documentElement.classList.toggle('daytime', dayOn);
        document.documentElement.classList.toggle('light', dayOn);
    }
    const hwImg = document.getElementById('scene-hw');
    function loadHalloween() { if (!hwImg.getAttribute('src')) hwImg.src = 'assets/background-halloween.jpg?v=83'; }
    // ...and the painted Christmas version
    const xmImg = document.getElementById('scene-xmas');
    function loadChristmas() { if (!xmImg.getAttribute('src')) xmImg.src = 'assets/background-christmas.jpg?v=83'; }
    // The laptop screen has its own layer, so it appears with the picture rather than
    // waiting for the effects to fade in
    const screenCanvas = document.getElementById('screen');
    const sctx = screenCanvas.getContext('2d');
    // The static layer (climbers, switches, desk buttons, laptop screen) only covers the box they
    // sit in, rather than the whole picture: x, y, w, h in picture pixels
    const STATIC_BOX = [455, 280, 645, 390];
    Object.assign(screenCanvas.style, {
        left: (100 * STATIC_BOX[0] / IMG_W) + '%', top: (100 * STATIC_BOX[1] / IMG_H) + '%',
        width: (100 * STATIC_BOX[2] / IMG_W) + '%', height: (100 * STATIC_BOX[3] / IMG_H) + '%'
    });
    let sk = 0;   // static-layer pixels per picture pixel
    const ui = document.getElementById('ui');
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Phones and tablets get a lighter render: lower canvas resolution, 30 frames a second,
    // no live blur, and nothing drawn outside the part of the picture on screen
    const LITE = matchMedia('(pointer: coarse)').matches || innerWidth <= 900;
    // The part of the picture currently on screen, in image coordinates (with a margin)
    const view = { x0: 0, x1: IMG_W, y0: 0, y1: IMG_H };
    const inView = (x0, x1) => x1 >= view.x0 && x0 <= view.x1;

    // Bright lights detected in the skyline and far shore: x, y, r, g, b
    const CITY_LIGHTS = [[330,338,255,255,255],[325,336,255,255,255],[584,337,255,255,254],[301,283,254,255,255],[419,329,253,255,255],[319,336,253,255,255],[480,312,253,255,254],[467,335,255,255,243],[442,331,253,255,248],[569,301,251,255,248],[195,344,255,255,231],[388,333,255,255,223],[247,339,255,255,222],[767,333,253,255,227],[379,335,252,255,228],[229,342,255,255,219],[480,305,255,255,218],[844,340,248,255,238],[471,329,253,255,220],[589,336,253,255,219],[722,340,254,255,209],[237,344,255,255,206],[754,335,253,255,209],[760,335,253,255,195],[187,344,255,253,206],[362,332,254,255,173],[652,340,255,252,194],[550,337,250,254,184],[376,331,252,251,206],[322,332,253,253,183],[429,324,255,251,190],[412,333,252,250,204],[659,335,255,248,211],[613,337,252,251,178],[546,341,255,255,115],[618,335,254,251,146],[630,342,255,248,153],[484,332,255,241,193],[448,335,252,247,142],[838,340,255,249,112],[407,338,255,246,128],[302,308,248,239,201],[203,341,255,237,173],[487,328,255,235,186],[702,345,255,246,51],[657,341,255,232,181],[573,311,233,230,222],[344,345,247,227,189],[784,340,255,232,94],[448,330,255,227,128],[569,323,255,222,143],[476,337,233,222,204],[368,333,250,229,80],[665,341,255,219,158],[599,342,255,230,37],[257,340,254,217,157],[454,332,255,221,108],[413,343,240,216,176],[500,337,255,216,128],[211,341,255,214,136],[262,336,255,218,84],[446,345,242,215,150],[272,333,252,209,167],[611,342,255,220,41],[576,317,255,215,86],[358,336,240,207,150],[767,317,236,207,159],[247,344,254,205,119],[505,337,255,204,118],[672,341,248,202,154],[516,343,255,208,67],[621,341,254,205,78],[402,332,255,198,133],[493,333,255,198,128],[460,336,255,200,97],[687,317,225,200,174],[521,340,255,199,85],[425,333,255,195,111],[614,312,255,199,71],[512,337,246,201,74],[580,314,242,201,77],[394,333,255,192,110],[782,346,247,196,93],[450,341,238,194,126],[793,338,254,192,90],[527,340,255,190,83],[750,342,254,190,82],[766,346,255,187,96],[176,345,231,186,171],[430,347,221,191,118],[623,313,250,186,75],[389,341,199,189,189],[756,322,255,182,90],[366,338,230,188,104],[587,316,227,194,46],[274,339,248,181,110],[219,292,252,182,87],[607,334,255,181,83],[348,338,255,178,103],[825,330,255,177,109],[330,347,246,178,114],[590,342,246,188,7],[854,305,230,176,167],[755,346,255,177,58],[762,301,225,179,124],[381,344,234,178,106],[769,288,231,175,140],[592,315,236,185,23],[614,307,215,184,81],[641,346,139,193,208],[1336,351,255,255,255],[1432,347,254,255,255],[1378,348,253,255,249],[1330,350,255,255,230],[1409,347,254,255,229],[1509,351,255,254,214],[1486,350,250,250,223],[1464,349,249,250,155],[1420,350,255,240,174],[1442,350,255,228,95],[1346,346,255,216,158],[1515,351,251,208,168],[1312,352,251,205,188],[1495,350,255,201,128]];

    // The darkest gaps in the night sky
    const STARS = [[426,42],[169,141],[191,97],[133,26],[166,65],[231,78],[200,150],[349,50],[389,22],[250,129],[443,93],[165,27],[371,125],[118,122],[318,77],[364,76],[99,41],[199,4],[305,139],[266,95],[340,106],[123,75],[320,30],[492,55],[157,94],[261,61],[527,70],[207,45],[414,82],[96,89],[487,109],[403,121],[335,144],[466,73]];

    // Aircraft warning lights on the tallest towers: x, y, phase
    const TOWER_LIGHTS = [[221, 244, 0], [762, 234, 0.8], [594, 236, 1.6]];

    // Water, as polygons; ripple amplitude (px) grows towards the viewer
    const WATER = [
        { poly: [[612, 404], [700, 401], [760, 409], [860, 403], [922, 401], [922, 468], [840, 470], [760, 466], [700, 452], [640, 445], [612, 430]], amp: [0.6, 1.6], freq: 0.6, speed: 2.2 },
        { poly: [[1345, 352], [1520, 350], [1515, 420], [1440, 440], [1392, 470], [1385, 528], [1240, 530], [1240, 446], [1300, 440], [1362, 420]], amp: [0.7, 1.8], freq: 0.55, speed: 2.0 }
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
    // Small pieces cut from the original painting (assets/scene-patches.png): the centre hut
    // windows and lanterns with their lights on (painted out in the current picture so they
    // can switch on and off), and the bare rock behind the two climbers (laid over them at
    // partial strength to mute their bright jackets). x, y, w, h in the picture; ax in the atlas.
    const HUT_PATCHES = [
        [1188, 370, 15, 16, 0], [1019, 374, 26, 24, 17], [1160, 380, 14, 11, 45], [1125, 404, 15, 13, 61],
        [1144, 406, 18, 11, 78], [1164, 410, 26, 25, 98], [1193, 416, 14, 21, 126], [1134, 424, 30, 28, 142],
        [1179, 440, 27, 11, 174]
    ];
    let eggsOn = false;
    let chaosOn = false;  // the red button on the desk
    const SCENE_PLATE = { x: 878, y: 650 };   // a two-rocker module set into the desk's front face
    const RED_BUTTON = { x: 868, y: 649 };   // the Halloween button, beside the Christmas one on the desk's front edge
    let rainOn = false;   // the weather switch on the desk lamp's cord
    let xmasOn = false;   // the Christmas button on the front edge of the desk
    let xmas = 0;         // 0 normal .. 1 Christmas (2-second fade)
    const XMAS_BUTTON = { x: 878, y: 650 };
    const WEATHER_BUTTON = { x: 888, y: 651 };   // the third rocker, for the rain   // its neighbour on the front edge
    const RAIN_SWITCH = { x: 470, y: 613 };   // an inline switch on the desk lamp's cord
    const CLIMBER_PATCH = [871, 289, 44, 40, 203];
    const CLIMBER_MUTE = 0.55;   // how much of the bare rock shows through the climbers
    const patchImg = new Image();
    patchImg.src = 'assets/scene-patches.png?v=83';

    const laptopImg = new Image();
    laptopImg.src = 'assets/laptop-screen.jpg?v=83';

    // An Arabian oryx wandering a slow loop on the dunes: centre, radius across, radius in depth
    const ORYX_LOOP = { cx: 184, cy: 369, rx: 24, ry: 3 };

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

    let spriteK = 1;   // a group fade for sprites, e.g. night lights fading out by day
    function drawSprite(s, x, y, size, alpha) {
        alpha *= spriteK;
        if (alpha <= 0.002 || x + size < view.x0 || x - size > view.x1) return;
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
        // nudge it onto the visible strip of wall where there is one; otherwise it keeps to its usual line
        geckoShift = geckoX <= GECKO_WALL_EDGE - 3 ? geckoX - GECKO_PATH[0][0] : 0;
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

        // The effects are soft glows and small details, so their layer is drawn at a modest
        // resolution; the static layer (switches, laptop) is small, so it stays sharp
        const newK = Math.min(LITE ? 1.1 : 1.25, Math.max(1, (w * (devicePixelRatio || 1)) / IMG_W));
        const newSK = Math.min(2, Math.max(1, (w * (devicePixelRatio || 1)) / IMG_W));
        if (Math.abs(newK - k) > 0.05 || Math.abs(newSK - sk) > 0.05) {
            k = newK;
            sk = newSK;
            canvas.width = Math.round(IMG_W * k);
            canvas.height = Math.round(IMG_H * k);
            screenCanvas.width = Math.round(STATIC_BOX[2] * sk);
            screenCanvas.height = Math.round(STATIC_BOX[3] * sk);
            buildDistortRegions();
            drawLaptop();
        }
    }

    /* ---------- water ripple and heat haze ---------- */

    // Each region is redrawn from the source image one row at a time with a small
    // horizontal offset, then masked with a feathered copy of its polygon.
    let regions = [];

    function buildDistortRegions() {
        regions = WATER.concat(FLAMES).map((def, ri) => {
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

            return { ...def, water: ri < WATER.length, bx, by, bw, bh, mask, work, wctx: work.getContext('2d') };
        });
    }

    function drawDistort(r, t) {
        if (!inView(r.bx, r.bx + r.bw)) return;
        const w = r.wctx;
        // The water is copied from whichever painting is showing; during a fade the two are
        // blended row by row, so the ripple changes as smoothly as the picture underneath
        const night = chaos > 0.5 && hwImg.complete && hwImg.naturalWidth ? hwImg : xmas > 0.5 && xmImg.complete && xmImg.naturalWidth ? xmImg : img;
        const layers = day <= 0 || !dayImg.naturalWidth ? [[night, 1]] : day >= 1 ? [[dayImg, 1]] : [[night, 1], [dayImg, day]];
        w.globalCompositeOperation = 'source-over';
        w.clearRect(0, 0, r.work.width, r.work.height);
        layers.forEach(([src, alpha]) => {
            w.globalAlpha = alpha;
            const step = r.freq < 1 ? 2 : 1;   // long, gentle waves are drawn in 2-pixel strips (half the work, same look)
            for (let y = r.by; y < r.by + r.bh; y += step) {
                const depth = (y - r.by) / r.bh;
                const amp = r.amp[0] + (r.amp[1] - r.amp[0]) * depth;
                const dx = amp * (0.6 * Math.sin(y * r.freq + t * r.speed) + 0.4 * Math.sin(y * r.freq * 0.37 - t * r.speed * 0.66 + 1.7));
                w.drawImage(src, r.bx, y, r.bw, step, dx * k, (y - r.by) * k, r.bw * k, step * k);
            }
        });
        w.globalAlpha = 1;
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

        // Bubbles: a faint rim, a hint of fill and a small highlight. At Halloween they turn a
        // ghostly green; at Christmas they become tiny snowflakes as they rise.
        const ge = chaos * chaos * (3 - 2 * chaos), se = xmas * xmas * (3 - 2 * xmas);
        const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * ge)).join(',');
        const rim = `rgb(${mix([225, 245, 255], [170, 255, 185])})`, fill = `rgb(${mix([210, 240, 255], [150, 255, 170])})`;
        ctx.lineWidth = 0.45;
        bubbles.forEach(b => {
            if (b.delay > 0) return;
            const x = b.x + b.drift + Math.sin(t * b.wf + b.wp) * b.wob;
            const fade = Math.min(1, (b.y - TANK_SURFACE) / 18);
            const bf = fade * (1 - se);
            if (bf > 0) {
                ctx.beginPath();
                ctx.arc(x, b.y, b.r, 0, 6.283);
                ctx.globalAlpha = (0.5 + 0.2 * ge) * bf;
                ctx.strokeStyle = rim;
                ctx.stroke();
                ctx.globalAlpha = (0.08 + 0.1 * ge) * bf;
                ctx.fillStyle = fill;
                ctx.fill();
                ctx.globalAlpha = 0.65 * bf;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, 6.283);
                ctx.fill();
            }
            if (se > 0) {
                const r = Math.max(1.1, b.r * 1.4), spin = t * 0.6 + b.wp;
                ctx.globalAlpha = 0.85 * fade * se;
                ctx.strokeStyle = 'rgb(240,250,255)';
                ctx.beginPath();
                for (let j = 0; j < 3; j++) {
                    const a = spin + j * Math.PI / 3, cx = Math.cos(a) * r, cy = Math.sin(a) * r;
                    ctx.moveTo(x - cx, b.y - cy);
                    ctx.lineTo(x + cx, b.y + cy);
                }
                ctx.stroke();
            }
        });
        ctx.globalAlpha = 1;

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
        const nk = 1 - day;   // night-only lights fade out in daylight
        spriteK = nk;

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

        // Navigation lights on the space station (always night up there)
        spriteK = 1;
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
        spriteK = 1 - 0.5 * day;   // the room's fires still flicker by day, just less strongly
        FIRE_GLOWS.forEach(([x, y, radius, strength, seed]) => {
            drawSprite(SPRITES.fire, x, y, radius * 2, strength * (0.45 + 0.75 * flicker(t, seed)));
        });
        spriteK = nk;
        APRES_GLOWS.forEach(([x, y, radius, strength, seed]) => {
            drawSprite(SPRITES.fire, x, y, radius * 2, strength * (0.45 + 0.75 * flicker(t, seed)));
        });

        drawEmbers(t);
        if (day < 0.5) drawPartyLights(t);
        drawHutLights(t);
        drawPlane(t);
        drawLanterns(t);
        spriteK = 1;
        if (day > 0) drawDaytime(t);

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
        if (!inView(1440, IMG_W)) return;
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
        if (!LITE) ctx.filter = `blur(${(0.35 * k).toFixed(2)}px)`;

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
        if (!LITE) ctx.filter = `blur(${(0.35 * k).toFixed(2)}px)`;
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
        if (!LITE) ctx.filter = `blur(${(0.8 * k).toFixed(2)}px)`;
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
        sctx.globalAlpha = 1;   // the laptop fade below must not carry over to the buttons
        sctx.setTransform(sk, 0, 0, sk, -STATIC_BOX[0] * sk, -STATIC_BOX[1] * sk);
        drawClimbers();
        drawSwitch();
        drawRedButton();
        drawRainSwitch();
        drawXmasButton();
        if (!laptopImg.complete || !laptopImg.naturalWidth) return;
        const w = laptopImg.naturalWidth;
        const h = laptopImg.naturalHeight;
        const map = homography(LAPTOP);
        const N = 8;
        sctx.globalAlpha = 0.88 * (1 - Math.max(chaos, xmas));
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
        sctx.globalAlpha = 1 - Math.max(chaos, xmas);
        sctx.fillStyle = g;
        sctx.beginPath();
        LAPTOP.forEach(([x, y], i) => (i ? sctx.lineTo(x, y) : sctx.moveTo(x, y)));
        sctx.closePath();
        sctx.fill();
    }
    laptopImg.addEventListener('load', drawLaptop);
    patchImg.addEventListener('load', drawLaptop);

    function drawPatch(c, [x, y, w, h, ax], alpha) {
        if (!patchImg.complete || !patchImg.naturalWidth || alpha <= 0) return;
        c.globalAlpha = alpha;
        c.drawImage(patchImg, ax, 0, w, h, x, y, w, h);
        c.globalAlpha = 1;
    }

    // Static, on the instant layer: the climbers are muted from the first moment
    // A small brushed-dark switch plate with a rocker; when on, a thin blue LED strip glows
    function drawSwitch() {
        const { x, y, w, h } = SWITCH;
        const c = sctx;
        c.save();
        // plate, very slightly lighter than the black column, with a fine edge highlight
        c.globalAlpha = 0.95;
        c.fillStyle = 'rgb(26,24,26)';
        c.beginPath();
        c.roundRect(x - w / 2, y - h / 2, w, h, 0.8);
        c.fill();
        c.strokeStyle = 'rgba(200,190,175,0.22)';
        c.lineWidth = 0.35;
        c.stroke();
        // rocker
        const on = dayOn;   // the light switch is now day / night
        const rw = w * 0.42, rh = h * 0.5;
        const g = c.createLinearGradient(0, y - rh / 2, 0, y + rh / 2);
        g.addColorStop(0, on ? 'rgb(30,28,30)' : 'rgb(58,54,56)');
        g.addColorStop(1, on ? 'rgb(58,54,56)' : 'rgb(30,28,30)');
        c.fillStyle = g;
        c.beginPath();
        c.roundRect(x - rw / 2, y - rh / 2, rw, rh, 0.5);
        c.fill();
        // LED strip under the rocker
        const ly = y + h / 2 - 2.1;
        if (on) {
            c.globalAlpha = 0.55;
            const glow = c.createRadialGradient(x, ly, 0, x, ly, 7);
            glow.addColorStop(0, 'rgba(70,150,255,0.9)');
            glow.addColorStop(1, 'rgba(70,150,255,0)');
            c.fillStyle = glow;
            c.fillRect(x - 7, ly - 7, 14, 14);
            c.globalAlpha = 1;
            c.fillStyle = 'rgb(150,205,255)';
        } else {
            c.globalAlpha = 0.8;
            c.fillStyle = 'rgb(20,30,44)';
        }
        c.fillRect(x - w * 0.3, ly - 0.35, w * 0.6, 0.7);
        c.restore();
    }

    // The Halloween button: brass-rimmed, with a muted orange cap that glows when on
    function drawRedButton() {
        drawScenePlate();   // the Halloween and Christmas rockers share one plate
    }

    // An inline rocker switch on the desk lamp's cord, lying on the desk top
    function drawRainSwitch() {
        const { x, y } = RAIN_SWITCH;
        const c = sctx;
        const on = eggsOn;   // the lamp switch is the secret master switch
        c.save();
        // the cord: out of the switch, curling back to the brass lamp, and away to the edge
        c.strokeStyle = 'rgba(16,14,14,0.9)';
        c.lineWidth = 0.7;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x + 4, y - 0.4);
        c.bezierCurveTo(x + 14, y - 1.5, x + 30, y - 6, 523, 594);
        c.moveTo(x - 4, y + 0.4);
        c.bezierCurveTo(x - 12, y + 1.5, x - 26, y + 2, 425, 619);
        c.stroke();
        // shadow
        c.globalAlpha = 0.45;
        c.fillStyle = 'rgb(6,5,5)';
        c.beginPath();
        c.ellipse(x + 0.5, y + 1.2, 4.6, 1.4, -0.08, 0, 6.283);
        c.fill();
        // body: a small rounded oblong in dark bakelite
        c.globalAlpha = 1;
        const g = c.createLinearGradient(0, y - 1.6, 0, y + 1.6);
        g.addColorStop(0, 'rgb(58,54,52)');
        g.addColorStop(1, 'rgb(22,20,20)');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(x, y, 4.2, 1.6, -0.08, 0, 6.283);
        c.fill();
        // the rocker, pressed down on one side or the other, with a faint highlight
        c.fillStyle = 'rgb(30,28,28)';
        c.beginPath();
        c.ellipse(x + (on ? 0.9 : -0.9), y - 0.5, 1.9, 0.7, -0.08, 0, 6.283);
        c.fill();
        c.fillStyle = 'rgba(210,200,185,0.35)';
        c.beginPath();
        c.ellipse(x + (on ? -0.6 : 0.6), y - 0.9, 1.1, 0.3, -0.08, 0, 6.283);
        c.fill();
        // a tiny warm indicator when on
        if (on) {
            const glow = c.createRadialGradient(x + 2.4, y - 0.4, 0, x + 2.4, y - 0.4, 3);
            glow.addColorStop(0, 'rgba(255,190,120,0.9)');
            glow.addColorStop(1, 'rgba(255,190,120,0)');
            c.fillStyle = glow;
            c.fillRect(x - 0.6, y - 3.4, 6, 6);
        }
        c.restore();
    }

    function drawXmasButton() {}   // drawn as part of the shared plate

    // One slim plate set into the desk's front face holding two small rocker switches, each with
    // a thin LED strip beneath it (orange for Halloween, red for Christmas). It is drawn in the
    // desk's own perspective: top and bottom follow the slope of the desk edge (about 1px down
    // for every 10px across) while the sides stay vertical, so it sits flush in the face.
    function drawScenePlate() {
        const c = sctx;
        const { x, y } = SCENE_PLATE;
        c.save();
        c.transform(1, 0.1, 0, 1, x, y);   // shear to match the desk
        // recess shadow and a dark satin plate with a fine bronze edge
        c.fillStyle = 'rgba(0,0,0,0.55)';
        c.fillRect(-15.6, -4.4, 31.2, 9.2);
        const plate = c.createLinearGradient(0, -4, 0, 4);
        plate.addColorStop(0, 'rgb(40,36,34)');
        plate.addColorStop(1, 'rgb(22,20,20)');
        c.fillStyle = plate;
        c.fillRect(-15, -4, 30, 8);
        c.strokeStyle = 'rgba(160,130,90,0.4)';
        c.lineWidth = 0.3;
        c.strokeRect(-15, -4, 30, 8);
        [[-10, chaosOn, '255,140,40'], [0, xmasOn, '255,60,50'], [10, rainOn, '70,150,255']].forEach(([cx, on, col]) => {
            // the rocker: pressed in at the bottom when on, at the top when off
            const g = c.createLinearGradient(0, -3, 0, 1.6);
            g.addColorStop(0, on ? 'rgb(30,28,28)' : 'rgb(62,58,56)');
            g.addColorStop(1, on ? 'rgb(60,56,54)' : 'rgb(28,26,26)');
            c.fillStyle = g;
            c.fillRect(cx - 3, -3, 6, 4.6);
            c.strokeStyle = 'rgba(0,0,0,0.6)';
            c.lineWidth = 0.25;
            c.strokeRect(cx - 3, -3, 6, 4.6);
            // the LED strip below it
            if (on) {
                const glow = c.createRadialGradient(cx, 2.8, 0, cx, 2.8, 6);
                glow.addColorStop(0, `rgba(${col},0.45)`);
                glow.addColorStop(1, `rgba(${col},0)`);
                c.fillStyle = glow;
                c.fillRect(cx - 6, -3.2, 12, 12);
            }
            c.fillStyle = on ? `rgb(${col})` : `rgba(${col},0.18)`;
            c.fillRect(cx - 2.4, 2.4, 4.8, 0.7);
        });
        c.restore();
    }

    function drawClimbers() {
        drawPatch(sctx, CLIMBER_PATCH, CLIMBER_MUTE * (1 - Math.max(chaos, xmas, day)));
    }

    // Centre hut lights switching on and off at random; most start off
    const hutPatchState = HUT_PATCHES.map((_, i) => ({ on: hash(i + 1300) > 0.7, since: -10, next: 2 + hash(i + 1400) * 10 }));

    function updateHutPatches(t) {
        hutPatchState.forEach(s => {
            if (t >= s.next) {
                s.on = !s.on;
                s.since = t;
                s.next = t + (s.on ? 8 + Math.random() * 20 : 5 + Math.random() * 15);
            }
        });
    }

    function drawHutPatches(t) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        HUT_PATCHES.forEach((patch, i) => {
            const s = hutPatchState[i];
            const ramp = Math.min(1, (t - s.since) / 1.2);
            let level = s.on ? ramp : 1 - ramp;
            // A brief flicker as a light comes on
            if (s.on && t - s.since < 0.5) level *= 0.6 + 0.4 * hash(Math.floor(t * 20) + i);
            drawPatch(ctx, patch, level * (1 - Math.max(chaos, xmas, day)));
        });
        ctx.restore();
    }

    // A yellow post-it on the desk by the headphones, "NPD" in black marker. It lies flat on
    // the desk, so it is foreshortened, and it is turned a little off square.

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
            o.phi += (0.9 / ORYX_LOOP.rx) * dt;   // about 1px a second
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
        const side = -Math.sin(o.phi);                // how side-on it is, and which way it faces
        const dir = side >= 0 ? 1 : -1;
        const ls = 0.35 + 0.65 * Math.abs(side);      // the body foreshortens as it turns
        const u = 1.15 + 0.08 * Math.sin(o.phi);      // size unit, a touch larger on the near side
        const step = o.walking ? Math.sin(o.gait) : 0;
        const graze = o.head;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(dir * ls * u, u);                   // the drawing below faces right, 1 unit ≈ 1px
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const coat = 'rgb(236,228,214)';
        const dark = 'rgb(58,46,42)';

        // Soft shadow on the sand
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = 'rgb(90,50,30)';
        ctx.beginPath();
        ctx.ellipse(0, 0.2, 4.2, 0.6, 0, 0, 6.283);
        ctx.fill();

        // Legs: slim, white above with the oryx's dark band at the knee, pale below
        const legs = [[-2.6, step], [-1.9, -step], [2.2, -step], [2.8, step]];
        legs.forEach(([lx, sw], i) => {
            const far = i % 2 === 1;
            ctx.globalAlpha = far ? 0.75 : 0.95;
            ctx.strokeStyle = coat;
            ctx.lineWidth = 0.55;
            ctx.beginPath();
            ctx.moveTo(lx, -3.6);
            ctx.lineTo(lx + sw * 0.35, -1.9);
            ctx.lineTo(lx + sw * 0.6, 0);
            ctx.stroke();
            ctx.strokeStyle = dark;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(lx + sw * 0.25, -2.6);
            ctx.lineTo(lx + sw * 0.4, -1.7);
            ctx.stroke();
        });

        // Body: deep chest, level back, rounded rump
        ctx.globalAlpha = 0.97;
        ctx.fillStyle = coat;
        ctx.beginPath();
        ctx.moveTo(-3.4, -5.4);                       // rump top
        ctx.quadraticCurveTo(0, -5.9, 2.6, -5.6);     // back to withers
        ctx.quadraticCurveTo(3.6, -5.3, 3.6, -4.2);   // shoulder
        ctx.quadraticCurveTo(3.4, -3.1, 2.4, -3.0);   // chest
        ctx.quadraticCurveTo(0, -3.3, -2.6, -3.2);    // belly
        ctx.quadraticCurveTo(-3.9, -3.4, -3.9, -4.4); // thigh
        ctx.quadraticCurveTo(-3.9, -5.2, -3.4, -5.4);
        ctx.fill();
        // A faint dark flank stripe, as on a real oryx
        ctx.strokeStyle = 'rgba(70,56,50,0.45)';
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.moveTo(-2.8, -3.35);
        ctx.quadraticCurveTo(0, -3.55, 2.3, -3.2);
        ctx.stroke();

        // Neck and head, lowered to graze
        const hx = 4.5 + 0.6 * graze;
        const hy = -6.6 + 4.6 * graze;
        ctx.strokeStyle = coat;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(2.8, -5.0);
        ctx.quadraticCurveTo(3.8, -6.2 + 3 * graze, hx, hy);
        ctx.stroke();
        // Head: long and narrow, with the dark face mask
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(0.35 + 0.55 * graze);
        ctx.fillStyle = coat;
        ctx.beginPath();
        ctx.ellipse(0.7, 0, 1.25, 0.6, 0, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(1.0, 0.1, 0.75, 0.38, 0, 0, 6.283);
        ctx.fill();
        // Long, straight horns swept back from the crown: the oryx's signature, as a pair
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = 'rgb(34,28,26)';
        ctx.lineWidth = 0.32;
        [[-0.1, 0], [0.25, 0.25]].forEach(([ox, spread]) => {
            ctx.beginPath();
            ctx.moveTo(ox, -0.45);
            ctx.lineTo(ox - 5.2, -2.6 - spread);
            ctx.stroke();
        });
        ctx.restore();

        // Tail with a dark tuft, flicking now and then
        const flick = Math.sin(t * 0.7) > 0.95 ? Math.sin(t * 25) * 0.4 : 0;
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = coat;
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.moveTo(-3.6, -5.0);
        ctx.quadraticCurveTo(-4.2 + flick, -4.3, -4.1 + flick, -3.3);
        ctx.stroke();
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(-4.1 + flick, -3.2, 0.25, 0.45, 0, 0, 6.283);
        ctx.fill();

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

    const gecko = { active: false, next: 3, route: GECKO_PATH };
    function routeLength(route) {
        let len = 0;
        for (let i = 1; i < route.length; i++) len += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
        return len;
    }

    // Position and heading at a distance along the current route
    function geckoAt(s) {
        const route = gecko.route;
        const shift = route === GECKO_PATH ? geckoShift || 0 : 0;
        for (let i = 1; i < route.length; i++) {
            const [x0, y0] = route[i - 1];
            const [x1, y1] = route[i];
            const seg = Math.hypot(x1 - x0, y1 - y0);
            if (s <= seg || i === route.length - 1) {
                const f = Math.min(1, s / seg);
                return { x: x0 + (x1 - x0) * f + shift, y: y0 + (y1 - y0) * f, heading: Math.atan2(y1 - y0, x1 - x0) };
            }
            s -= seg;
        }
    }

    function updateGecko(t, dt) {
        const g = gecko;
        if (!g.active) {
            if (t >= g.next) {
                // Always the stone wall on the far left, even where it is cropped off screen
                g.route = GECKO_PATH;
                g.length = routeLength(g.route);
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
        if (g.s >= g.length) {
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
        ctx.scale(1.6, 1.6);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.8 * g.fade;
        // Camouflaged: only a shade lighter than whatever it is climbing
        const skin = 'rgb(138,122,104)';
        ctx.fillStyle = skin;
        ctx.strokeStyle = skin;
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
        const legs = stops.slice(1).map((f, i) => ({ from: stops[i], to: f, dur: 3 + Math.abs(f - stops[i]) * 30 }));
        tour = { legs, start: performance.now() / 1000 };
        pan.touched = true;   // no first-visit hint after this
        pan.vel = 0;
    });

    function runTour() {
        let el = performance.now() / 1000 - tour.start;
        for (const leg of tour.legs) {
            if (el < leg.dur) {
                const f = el / leg.dur;
                const e = (1 - Math.cos(f * Math.PI)) / 2;   // gentle sine ease in and out
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

    /* ---------- the weather switch: rain, then new life ---------- */

    // Flick the switch: drizzle, harder rain, a downpour with thunder, then the rain eases,
    // the sun breaks through with a rainbow and the desert turns green, trees grow and life
    // arrives. It stays in bloom until the switch is flicked off, then fades back to normal.
    const weather = { start: null, t: 0, off: 0, rain: 0, cloud: 0, sun: 0, grow: 0, flash: 0, nextBolt: 0 };

    // Where rain is visible: outside the windows, not inside the room or over the man
    const OUTSIDE = (() => {
        const path = new Path2D();
        path.rect(0, 0, 940, 560);
        path.rect(1130, 100, 542, 450);
        const man = new Path2D();
        return path;
    })();
    const MAN = [690, 470, 840, 560];

    // The desert that turns green (the sand only, above the terrace wall)
    const DESERT = pathFrom([[92, 350], [430, 348], [430, 470], [335, 470], [335, 428], [92, 428]]);
    const GRASS = Array.from({ length: 220 }, (_, i) => [92 + hash(i * 1.9) * 338, 352 + hash(i * 5.3) * 118, hash(i * 2.7)]);
    const FLOWERS = Array.from({ length: 50 }, (_, i) => [100 + hash(i * 8.1) * 320, 360 + hash(i * 3.9) * 64, i % 4]);
    const FLOWER_COLOURS = ['rgb(230,200,90)', 'rgb(220,120,150)', 'rgb(240,240,230)', 'rgb(170,140,220)'];
    const birds = [];
    let nextBird = 4;

    // The desert recoloured to grassland: sandy pixels become green, keeping the dune shading,
    // with soft edges. Made once from the painting, then faded in as the land comes to life.
    const GREEN_BOX = [90, 344, 342, 128];   // x, y, w, h
    let greenDesert = null;
    let greenFor = null;
    function makeGreenDesert(base) {
        const [bx, by, bw, bh] = GREEN_BOX;
        const c = document.createElement('canvas');
        c.width = bw; c.height = bh;
        const x = c.getContext('2d');
        x.drawImage(base, bx, by, bw, bh, 0, 0, bw, bh);
        let d;
        try { d = x.getImageData(0, 0, bw, bh); } catch (e) { return null; }
        const m = document.createElement('canvas');
        m.width = bw; m.height = bh;
        const mx = m.getContext('2d');
        mx.translate(-bx, -by);
        mx.filter = 'blur(3px)';
        mx.fill(DESERT);
        const mask = mx.getImageData(0, 0, bw, bh).data;
        const px = d.data;
        for (let i = 0; i < px.length; i += 4) {
            const r = px[i], g = px[i + 1], b = px[i + 2];
            const Ls = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
            const sandy = Math.max(0, Math.min(1, (r - b - 40) / 90)) * Math.max(0, Math.min(1, (Ls - 0.38) / 0.15));   // light, warm sand only (not the palms)
            const L = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
            const nr = 58 * L + 22, ng = 108 * L + 34, nb = 44 * L + 16;   // deep, natural grass green
            const k = sandy;
            px[i] = r + (nr - r) * k;
            px[i + 1] = g + (ng - g) * k;
            px[i + 2] = b + (nb - b) * k;
            px[i + 3] = mask[i + 3] * 0.9 * sandy;
        }
        x.putImageData(d, 0, 0);
        return c;
    }

    const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

    function updateWeather(t, dt) {
        const w = weather;
        if (rainOn) {
            if (w.start === null) w.start = t;
            w.t = t - w.start;
            w.off = Math.max(0, w.off - dt / 2);
        } else {
            w.off = Math.min(1, w.off + dt / 5);   // fade back to normal
        }
        const fade = rainOn ? 1 : 1 - w.off;
        const T = w.t;
        // drizzle at once, harder by 5s, a downpour 8-18s, easing off by 26s, then new life
        const rain = T < 4 ? 0.3 * ramp(T, 0, 1.5) : T < 8 ? 0.3 + 0.35 * ramp(T, 4, 8) : T < 18 ? 0.65 + 0.35 * ramp(T, 8, 11) : 1 - ramp(T, 18, 26);
        w.rain = rain * fade;
        w.cloud = Math.min(1, ramp(T, 0, 5) * (1 - ramp(T, 22, 30))) * fade;
        w.sun = ramp(T, 24, 32) * fade;
        w.grow = ramp(T, 26, 48) * fade;
        if (!rainOn && w.off >= 1) { w.t = 0; w.start = null; }
        // thunder in the downpour
        if (w.rain > 0.85 && t >= w.nextBolt) { w.flash = 1; w.nextBolt = t + 4 + Math.random() * 7; }
        w.flash = Math.max(0, w.flash - dt * 3);
        // birds once the sun is out
        // birds come and go all the time, more of them once the rain has cleared
        if (t >= nextBird && birds.length < 10 && w.rain < 0.3) {
            const ltr = Math.random() < 0.5;
            const n = 1 + Math.floor(Math.random() * 4);
            const y = 40 + Math.random() * 200;
            for (let i = 0; i < n; i++) birds.push({ x: ltr ? -10 - i * 14 : IMG_W + 10 + i * 14, y: y + (Math.random() - 0.5) * 20, vx: (ltr ? 1 : -1) * (25 + Math.random() * 15), ph: Math.random() * 6, s: 2 + Math.random() * 1.5 });
            nextBird = t + (w.sun > 0.6 || day > 0.5 ? 3 + Math.random() * 5 : 8 + Math.random() * 12);
        }
        for (let i = birds.length - 1; i >= 0; i--) {
            const b = birds[i];
            b.x += b.vx * dt;
            b.y += Math.sin(t * 0.8 + b.ph) * 3 * dt;
            if (b.x < -40 || b.x > IMG_W + 40) birds.splice(i, 1);
        }
    }

    function drawWeather(t) {
        const w = weather;
        if (w.rain <= 0 && w.cloud <= 0 && w.sun <= 0 && w.grow <= 0 && !birds.length) return;
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // Storm clouds: a cool, grey darkening, heaviest in the sky
        if (w.cloud > 0) {
            const g = ctx.createLinearGradient(0, 0, 0, IMG_H);
            g.addColorStop(0, `rgba(40,48,62,${(0.6 * w.cloud).toFixed(3)})`);
            g.addColorStop(0.45, `rgba(40,48,62,${(0.35 * w.cloud).toFixed(3)})`);
            g.addColorStop(1, `rgba(20,24,32,${(0.25 * w.cloud).toFixed(3)})`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, IMG_W, IMG_H);
        }

        // The desert greening, grass and flowers, and new trees
        if (w.grow > 0) {
            const base = day > 0.5 && dayImg.naturalWidth ? dayImg : img;
            if (!greenDesert || greenFor !== base) { greenDesert = makeGreenDesert(base); greenFor = base; }
            if (greenDesert) {
                ctx.globalAlpha = 0.6 * w.grow;   // a mild, natural greening
                ctx.drawImage(greenDesert, GREEN_BOX[0], GREEN_BOX[1]);
            }
            ctx.save();
            ctx.clip(DESERT);
            GRASS.forEach(([x, y, r]) => {
                const g = ramp(w.grow, r * 0.6, r * 0.6 + 0.3);
                if (g <= 0) return;
                const h = (1.2 + r * 2.2) * g * (0.6 + (y - 350) / 120);
                const sway = Math.sin(t * 1.5 + x * 0.3) * 0.4;
                ctx.globalAlpha = 0.45;
                ctx.strokeStyle = r > 0.5 ? 'rgb(66,104,48)' : 'rgb(88,128,58)';
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + sway, y - h);
                ctx.stroke();
            });
            FLOWERS.forEach(([x, y, c], i) => {
                const g = ramp(w.grow, 0.55 + hash(i) * 0.3, 0.9 + hash(i) * 0.1);
                if (g <= 0) return;
                ctx.globalAlpha = 0.6 * g;
                ctx.fillStyle = FLOWER_COLOURS[c];
                ctx.beginPath();
                ctx.arc(x, y - 1.5, 0.8, 0, 6.283);
                ctx.fill();
            });
            ctx.restore();
        }

        // Rain: three depths of streaks, from fine distant rain over the landscape to a few nearer
        // drops, plus mist that softens the far view. Each drop starts somewhere new on every
        // fall, so the pattern never repeats and the motion reads clearly downward.
        if (w.rain > 0.01) {
            ctx.save();
            ctx.clip(OUTSIDE);
            ctx.beginPath();
            ctx.rect(MAN[0], MAN[1], MAN[2] - MAN[0], MAN[3] - MAN[1]);
            ctx.rect(0, 430, 470, 130);       // the covered terrace
            ctx.rect(0, 0, IMG_W, IMG_H);
            ctx.clip('evenodd');

            // mist: distance fades into grey rain
            const mist = ctx.createLinearGradient(0, 200, 0, 520);
            mist.addColorStop(0, `rgba(150,160,175,${(0.05 * w.rain).toFixed(3)})`);
            mist.addColorStop(0.45, `rgba(150,160,175,${(0.32 * w.rain).toFixed(3)})`);
            mist.addColorStop(1, `rgba(150,160,175,${(0.08 * w.rain).toFixed(3)})`);
            ctx.globalAlpha = 1;
            ctx.fillStyle = mist;
            ctx.fillRect(0, 200, IMG_W, 330);

            const LAYERS = [
                { n: LITE ? 400 : 1200, len: 5, speed: 260, w: 0.4, a: 0.34, y0: 150, y1: 560 },   // far
                { n: LITE ? 180 : 420, len: 9, speed: 420, w: 0.55, a: 0.38, y0: 0, y1: 560 },      // middle
                { n: LITE ? 35 : 80, len: 16, speed: 700, w: 0.75, a: 0.28, y0: 0, y1: 560 }       // near
            ];
            ctx.strokeStyle = 'rgb(200,210,225)';
            LAYERS.forEach((L, li) => {
                const n = Math.round(L.n * w.rain);
                const len = L.len * (0.8 + 0.6 * w.rain);
                const span = L.y1 - L.y0;
                ctx.lineWidth = L.w;
                ctx.globalAlpha = L.a * (0.5 + 0.5 * w.rain);
                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                    const sp = L.speed * (0.8 + 0.4 * hash(i * 2.9 + li));
                    const fall = (t * sp / span + hash(i * 4.7 + li * 31)) ;
                    const cyc = Math.floor(fall);
                    const f = fall - cyc;
                    const x = hash(i * 1.3 + cyc * 7.1 + li * 13) * IMG_W - f * span * 0.12;
                    const y = L.y0 + f * span;
                    if (x < view.x0 || x > view.x1) continue;
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + len * 0.12, y - len);
                }
                ctx.stroke();
            });
            ctx.restore();
        // little rings where drops hit the lake and the bay
            ctx.save();
            ctx.globalAlpha = 0.35 * w.rain;
            ctx.strokeStyle = 'rgb(200,215,235)';
            ctx.lineWidth = 0.4;
            const rings = Math.round(40 * w.rain);
            for (let i = 0; i < rings; i++) {
                const cyc = (t * 1.3 + hash(i * 9.1)) % 1;
                const seed = Math.floor(t * 1.3 + hash(i * 9.1)) * 13 + i;
                const lake = hash(seed) < 0.5;
                const x = lake ? 620 + hash(seed * 2.1) * 300 : 1250 + hash(seed * 2.1) * 260;
                const y = lake ? 410 + hash(seed * 3.7) * 55 : 360 + hash(seed * 3.7) * 150;
                ctx.beginPath();
                ctx.ellipse(x, y, 1 + cyc * 4, (1 + cyc * 4) * 0.3, 0, 0, 6.283);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Lightning
        if (w.flash > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.3 * w.flash * (Math.random() < 0.7 ? 1 : 0.4);
            ctx.fillStyle = 'rgb(200,210,255)';
            ctx.fillRect(0, 0, IMG_W, 560);
        }

        // Birds, only seen through the windows
        ctx.save();
        ctx.clip(OUTSIDE);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = 'rgb(30,26,26)';
        ctx.lineWidth = 0.6;
        birds.forEach(b => {
            if (b.x < view.x0 || b.x > view.x1) return;
            const f = Math.sin(t * 9 + b.ph) * b.s * 0.6;
            ctx.beginPath();
            ctx.moveTo(b.x - b.s, b.y - f);
            ctx.quadraticCurveTo(b.x - b.s * 0.4, b.y - f * 0.3 - 0.4, b.x, b.y);
            ctx.quadraticCurveTo(b.x + b.s * 0.4, b.y - f * 0.3 - 0.4, b.x + b.s, b.y - f);
            ctx.stroke();
        });
        ctx.restore();
        ctx.restore();
    }

    /* ---------- the red button: Halloween ---------- */

    // Pressing the button turns the evening eerie at once: a cold moonlit grade, a soft full
    // moon, tiny bats high up, mist lying on the water and faint lantern glows by the huts.
    // Only the storm clouds take their time, rolling in slowly across the top of the sky.
    let chaos = 0;           // 0 normal, 1 eerie (switches instantly)
    let spookSince = 0;      // when it was switched on, for the slow clouds

    const MOON = [640, 110, 52];
    const LANTERNS = [[1205, 452], [1150, 458], [1560, 508], [1622, 515], [1020, 425], [1258, 424]];
    const SKY_CLOUDS = Array.from({ length: 14 }, (_, i) => ({
        y: 20 + hash(i * 3.3) * 200, start: -260 - hash(i * 5.7) * 900, r: 90 + hash(i * 2.1) * 110, sp: 9 + hash(i * 7.9) * 6
    }));
    const WATER_MIST = Array.from({ length: 28 }, (_, i) => ({
        lake: i % 2 === 0, x: hash(i * 4.1), y: hash(i * 6.3), r: 30 + hash(i * 1.7) * 40, sp: 3 + hash(i * 8.3) * 4
    }));
    const bats = [];
    let nextBat = 0;
    // A witch on a broomstick: a small silhouette that crosses in front of the moon now and then
    const witch = { active: false, next: 0 };   // every Halloween effect starts the moment it is switched on

    // Sky lanterns drifting slowly up from the huts and the bay
    // Lights dancing far off over the water and hills, each in its own wandering loop
    const skyLanterns = Array.from({ length: 40 }, (_, i) => {
        const far = i % 2 === 0;
        return {
            cx: far ? 1300 + hash(i * 3.1) * 260 : 620 + hash(i * 3.1) * 300,
            cy: far ? 300 + hash(i * 5.3) * 70 : 360 + hash(i * 5.3) * 60,
            r: 4 + hash(i * 7.7) * 10, w1: 0.25 + hash(i * 2.9) * 0.5, w2: 0.6 + hash(i * 4.1) * 0.9, ph: hash(i * 6.2) * 6.28
        };
    });
    // Drifting smoke and haze, low over the land
    // Banks of pale fog, grouped so there are clear gaps between them
    const HAZE = Array.from({ length: 60 }, (_, i) => {
        const bank = i % 6;
        return { x: bank * 320 + hash(i * 4.4) * 180, y: 300 + hash(i * 6.6) * 260, r: 80 + hash(i * 1.9) * 110, sp: 3 + (bank % 3) * 2.5 };
    });
    // Low ground fog creeping across the terrace and the floor of the room
    const GROUND_FOG = Array.from({ length: 22 }, (_, i) => ({ x: hash(i * 2.2) * IMG_W, y: 560 + hash(i * 3.9) * 360, r: 120 + hash(i * 5.5) * 140, sp: 2 + hash(i * 7.1) * 4 }));
    // A swarm of bats that gathers and wheels around now and then
    const swarm = { active: false, next: 0, born: 0, cx: 0, cy: 0, bats: [] };
    let flash = 0, nextFlash = 0;
    // A skull on the bar top above the aquarium
    const SKULL = [1188, 549, 6];
    // Faint cobwebs strung between the columns and frames: anchor A, anchor B, sag
    const WEBS2 = [[[1040, 118], [1132, 108], 18], [[938, 40], [1040, 52], 14], [[1132, 560], [1235, 548], 12]];

    const cloudSprite = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(18,16,30,1)');
        g.addColorStop(0.55, 'rgba(22,20,36,0.6)');
        g.addColorStop(1, 'rgba(22,20,36,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
        return c;
    })();
    const mistSprite = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(180,190,205,1)');
        g.addColorStop(0.6, 'rgba(180,190,205,0.3)');
        g.addColorStop(1, 'rgba(180,190,205,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
        return c;
    })();

    function updateChaos(t, dt) {
        if (chaosOn && chaos === 0) spookSince = t;
        const before = chaos;
        chaos = chaosOn ? Math.min(1, chaos + dt / 2) : Math.max(0, chaos - dt / 2);   // 2-second fade, like the painting
        if (chaos !== before) drawLaptop();   // the laptop screen and climber overlays fade with it
        if (!chaosOn) { if (chaos === 0) { bats.length = 0; witch.active = false; witch.next = 0; swarm.active = false; swarm.next = 0; nextFlash = 0; } return; }
        // a swarm forms, wheels around for a while, then scatters
        const sw = swarm;
        if (!sw.active && t - spookSince >= sw.next) {
            const spots = [[533, 120], [900, 250], [1400, 200], [300, 200]];
            const [cx, cy] = spots[Math.floor(Math.random() * spots.length)];
            Object.assign(sw, { active: true, born: t, cx, cy, life: 14 + Math.random() * 8,
                bats: Array.from({ length: LITE ? 45 : 90 }, () => ({ a: Math.random() * 6.283, r: 20 + Math.random() * 90, w: (0.6 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1), h: 0.35 + Math.random() * 0.4, ph: Math.random() * 6, s: 1.5 + Math.random() * 1.2 })) });
        }
        if (sw.active && t - sw.born > sw.life) { sw.active = false; sw.next = t - spookSince + 10 + Math.random() * 10; }
        if (t - spookSince >= nextFlash) { flash = 1; nextFlash = t - spookSince + 9 + Math.random() * 14; }
        flash = Math.max(0, flash - dt * 2.2);
        if (!witch.active && t - spookSince >= witch.next) Object.assign(witch, { active: true, born: t, dur: 9 });
        if (witch.active && t - witch.born > witch.dur) { witch.active = false; witch.next = t - spookSince + 14 + Math.random() * 14; }
        if (t >= nextBat && bats.length < 70) {
            const ltr = Math.random() < 0.5;
            const n = 3 + Math.floor(Math.random() * 6);
            const y = 30 + Math.random() * 200;
            for (let i = 0; i < n; i++) bats.push({ x: ltr ? -10 - i * 10 : IMG_W + 10 + i * 10, y: y + (Math.random() - 0.5) * 24, vx: (ltr ? 1 : -1) * (35 + Math.random() * 20), ph: Math.random() * 6, s: 1.1 + Math.random() * 0.7 });
            nextBat = t + 0.25 + Math.random() * 0.6;
        }
        for (let i = bats.length - 1; i >= 0; i--) {
            const b = bats[i];
            b.x += b.vx * dt;
            b.y += Math.sin(t * 3 + b.ph) * 14 * dt;
            if (b.x < -40 || b.x > IMG_W + 40) bats.splice(i, 1);
        }
    }

        // Bonfire night on the apres-ski terrace when it is Halloween
    // Things that move on top of the painted Halloween scene
    const HW_MOON = [533, 97, 31];
    const HW_GLOWS = [   // pumpkins and fires painted into the Halloween scene: x, y, size
        [1568, 226, 34], [1579, 244, 14], [1555, 246, 13], [1618, 253, 12], [1531, 478, 14], [1624, 512, 16],
        [1147, 492, 12], [1461, 498, 13], [1535, 548, 16], [158, 550, 16], [128, 560, 13], [300, 566, 18],
        [318, 562, 12], [1024, 585, 18], [1000, 590, 14], [1074, 594, 14], [283, 620, 15], [123, 805, 18],
        [100, 826, 15], [512, 527, 9]];
    const HW_WEBS = [[940, 0, 1060, 90], [1120, 0, 1240, 110], [0, 150, 60, 420], [398, 628, 470, 730], [990, 660, 1120, 810], [222, 556, 290, 612]];
    const shark = { x: 1180, dir: 1 };

    function drawChaos(t) {
        if (!chaos) return;
        const e = chaos * chaos * (3 - 2 * chaos);
        ctx.save();

        // A skeleton half-buried on the seabed, pale and out of focus, with a bubble now and then
        if (inView(1250, 1400)) {
            ctx.save();
            ctx.clip(fishClip, 'evenodd');
            if (!LITE) ctx.filter = `blur(${(0.7 * k).toFixed(2)}px)`;
            ctx.translate(1336, 782);
            ctx.scale(1.7, 1.7);
            ctx.rotate(-0.12);
            ctx.globalAlpha = 0.8 * e;
            ctx.fillStyle = 'rgb(214,218,206)';
            ctx.strokeStyle = 'rgb(214,218,206)';
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.ellipse(-16, -2, 3.4, 2.9, -0.2, 0, 6.283); ctx.fill();          // skull
            ctx.fillStyle = 'rgba(20,40,60,0.9)';
            ctx.beginPath(); ctx.arc(-17.4, -2.6, 0.75, 0, 6.283); ctx.arc(-15.2, -2.9, 0.75, 0, 6.283); ctx.fill();
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(-12.5, -1); ctx.lineTo(2, 0.5); ctx.stroke();               // spine
            ctx.lineWidth = 0.55;
            for (let r = 0; r < 5; r++) {                                                             // ribs
                const x = -10 + r * 1.8;
                ctx.beginPath(); ctx.ellipse(x, -0.6, 0.9, 2.6 - r * 0.25, 0.1, 0.4, 5.9); ctx.stroke();
            }
            ctx.beginPath(); ctx.moveTo(2, 0.5); ctx.lineTo(9, -1.5); ctx.lineTo(14, 1); ctx.moveTo(2, 0.5); ctx.lineTo(8, 2.5); ctx.lineTo(13, 3.2); ctx.stroke();   // legs
            ctx.beginPath(); ctx.moveTo(-10, -1.5); ctx.lineTo(-6, -5.5); ctx.lineTo(-2.5, -4.2); ctx.stroke();   // an arm reaching up
            ctx.restore();
            const bph = (t * 0.25) % 1;
            if (bph < 0.6) {
                ctx.save();
                ctx.clip(fishClip, 'evenodd');
                ctx.globalAlpha = 0.5 * e * (1 - bph / 0.6);
                ctx.strokeStyle = 'rgb(225,245,255)';
                ctx.lineWidth = 0.4;
                ctx.beginPath(); ctx.arc(1320 + Math.sin(t * 3) * 1.5, 778 - bph * 120, 1.2, 0, 6.283); ctx.stroke();
                ctx.restore();
            }
        }

        // A shark gliding slowly through the back of the tank, behind the divers
        if (inView(1250, IMG_W)) {
            const sdt = Math.min(0.1, t - (shark.t || t));   // swims by time, whatever the redraw rate
            shark.t = t;
            shark.x += shark.dir * 21 * sdt;
            if (shark.x > 1720) shark.dir = -1;
            if (shark.x < 1200) shark.dir = 1;
            const sx = shark.x, sy = 650 + Math.sin(t * 0.3) * 8, sw = 46;
            const tail = Math.sin(t * 2.4) * 0.25;
            ctx.save();
            ctx.clip(fishClip, 'evenodd');
            if (!LITE) ctx.filter = `blur(${(1.4 * k).toFixed(2)}px)`;
            ctx.translate(sx, sy);
            ctx.scale(shark.dir, 1);
            ctx.globalAlpha = 0.5 * e;
            ctx.fillStyle = 'rgb(22,46,74)';
            ctx.beginPath();
            ctx.moveTo(sw * 0.55, 0);                                              // snout
            ctx.quadraticCurveTo(sw * 0.3, -sw * 0.14, 0, -sw * 0.13);
            ctx.lineTo(-sw * 0.05, -sw * 0.32);                                    // dorsal fin
            ctx.lineTo(-sw * 0.16, -sw * 0.12);
            ctx.quadraticCurveTo(-sw * 0.4, -sw * 0.08, -sw * 0.5, -sw * 0.03);
            ctx.lineTo(-sw * 0.72, -sw * (0.2 + tail));                            // tail
            ctx.lineTo(-sw * 0.62, 0);
            ctx.lineTo(-sw * 0.72, sw * (0.14 - tail));
            ctx.lineTo(-sw * 0.5, sw * 0.03);
            ctx.quadraticCurveTo(-sw * 0.1, sw * 0.12, sw * 0.05, sw * 0.1);
            ctx.lineTo(-sw * 0.02, sw * 0.24);                                     // pectoral fin
            ctx.lineTo(sw * 0.14, sw * 0.09);
            ctx.quadraticCurveTo(sw * 0.4, sw * 0.08, sw * 0.55, 0);
            ctx.fill();
            ctx.restore();
        }

        drawGhostDivers(t, e);

        ctx.save();
        ctx.clip(OUTSIDE);

        // The moon shimmering: a halo that breathes slowly
        const [mx, my, mr] = HW_MOON;
        if (inView(mx - 150, mx + 150)) {
            ctx.globalCompositeOperation = 'lighter';
            const pulse = 0.8 + 0.2 * noise(t * 0.6);
            const halo = ctx.createRadialGradient(mx, my, mr * 0.9, mx, my, mr * 4.5);
            halo.addColorStop(0, `rgba(210,215,235,${(0.22 * e * pulse).toFixed(3)})`);
            halo.addColorStop(1, 'rgba(210,215,235,0)');
            ctx.fillStyle = halo;
            ctx.fillRect(mx - mr * 4.5, my - mr * 4.5, mr * 9, mr * 9);
        }

        // Mist drifting through the air, in banks with gaps between them
        ctx.globalCompositeOperation = 'source-over';
        HAZE.forEach(h => {
            const x = ((h.x + t * h.sp) % (IMG_W + 400)) - 200;
            ctx.save();
            ctx.translate(x, h.y);
            ctx.scale(1, 0.32);
            drawSprite(mistSprite, 0, 0, h.r * 2, 0.3 * e);
            ctx.restore();
        });

        // Fog moving on the lake and the bay
        WATER.forEach(({ poly }, wi) => {
            const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            if (!inView(x0, x1)) return;
            ctx.save();
            ctx.clip(pathFrom(poly));
            WATER_MIST.filter(m => m.lake === (wi === 0)).forEach(m => {
                const x = x0 + ((m.x * (x1 - x0) + t * m.sp) % (x1 - x0 + 80)) - 40;
                const y = y0 + m.y * (y1 - y0);
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(1, 0.35);
                drawSprite(mistSprite, 0, 0, m.r * 2, 0.4 * e);
                ctx.restore();
            });
            ctx.restore();
        });

        // The witch, crossing the moon now and then
        if (witch.active) {
            const f = (t - witch.born) / witch.dur;
            const wx = mx - 260 + f * 520;
            const wy = my + 18 - Math.sin(f * Math.PI) * 30 + Math.sin(t * 2.2) * 1.2;
            ctx.save();
            ctx.translate(wx, wy);
            ctx.rotate(-0.08 + Math.sin(t * 1.6) * 0.04);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.92 * e * Math.min(1, f / 0.08, (1 - f) / 0.08);
            ctx.fillStyle = 'rgb(10,8,12)';
            ctx.strokeStyle = 'rgb(10,8,12)';
            ctx.lineCap = 'round';
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(-9, 1.2); ctx.lineTo(7, -0.4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-9, 1.2); ctx.lineTo(-13.5, -0.6); ctx.lineTo(-14, 2.4); ctx.lineTo(-13, 3.6); ctx.closePath(); ctx.fill();
            const flap = Math.sin(t * 5) * 0.8;
            ctx.beginPath();
            ctx.moveTo(-3.5, 0.8); ctx.quadraticCurveTo(-2.5, -4.5, 0.8, -5.2);
            ctx.lineTo(1.6, 0.2); ctx.quadraticCurveTo(-4, 1, -8.5 + flap, -1.8 + flap * 0.6);
            ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.arc(1.4, -5.6, 1.1, 0, 6.283); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-0.6, -6.1); ctx.lineTo(3.4, -6.5); ctx.lineTo(0.4, -10.2); ctx.closePath(); ctx.fill();
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(-0.5, 0.4); ctx.lineTo(0.6, 3.2); ctx.lineTo(2, 3.4); ctx.stroke();
            ctx.restore();
        }

        // Distant lightning: the sky blinks pale for a moment
        if (flash > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.22 * flash * e * (Math.random() < 0.6 ? 1 : 0.3);
            ctx.fillStyle = 'rgb(190,200,235)';
            ctx.fillRect(0, 0, IMG_W, 330);
        }

        // Bats
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.85 * e;
        ctx.fillStyle = 'rgb(12,10,16)';
        // the swarm wheeling around its centre, gathering in and scattering out
        if (swarm.active) {
            const age = t - swarm.born, life = swarm.life;
            const gather = Math.min(1, age / 2.5) * Math.min(1, (life - age) / 2.5);
            swarm.bats.forEach(b => {
                const ang = b.a + t * b.w;
                const rr = b.r * (0.4 + 0.6 * gather) + (1 - gather) * 300;
                const bx = swarm.cx + Math.cos(ang) * rr + Math.sin(t * 2 + b.ph) * 6;
                const by = swarm.cy + Math.sin(ang) * rr * b.h + Math.cos(t * 3 + b.ph) * 4;
                if (bx < view.x0 || bx > view.x1) return;
                const f = Math.sin(t * 18 + b.ph), s2 = b.s;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.quadraticCurveTo(bx - s2 * 0.6, by - s2 * 0.8 * f, bx - s2 * 1.6, by - s2 * 0.3 * f);
                ctx.lineTo(bx - s2 * 0.3, by + s2 * 0.3);
                ctx.lineTo(bx + s2 * 0.3, by + s2 * 0.3);
                ctx.lineTo(bx + s2 * 1.6, by - s2 * 0.3 * f);
                ctx.quadraticCurveTo(bx + s2 * 0.6, by - s2 * 0.8 * f, bx, by);
                ctx.fill();
            });
        }
        bats.forEach(b => {
            if (b.x < view.x0 || b.x > view.x1) return;
            const f = Math.sin(t * 16 + b.ph);
            const s2 = b.s;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.quadraticCurveTo(b.x - s2 * 0.6, b.y - s2 * 0.8 * f, b.x - s2 * 1.6, b.y - s2 * 0.3 * f);
            ctx.lineTo(b.x - s2 * 0.3, b.y + s2 * 0.3);
            ctx.lineTo(b.x + s2 * 0.3, b.y + s2 * 0.3);
            ctx.lineTo(b.x + s2 * 1.6, b.y - s2 * 0.3 * f);
            ctx.quadraticCurveTo(b.x + s2 * 0.6, b.y - s2 * 0.8 * f, b.x, b.y);
            ctx.fill();
        });
        ctx.restore();

        // Ground fog creeping across the terrace and the floor
        ctx.globalCompositeOperation = 'source-over';
        GROUND_FOG.forEach(g => {
            const x = ((g.x + t * g.sp) % (IMG_W + 400)) - 200;
            ctx.save();
            ctx.translate(x, g.y);
            ctx.scale(1, 0.22);
            drawSprite(mistSprite, 0, 0, g.r * 2, 0.22 * e);
            ctx.restore();
        });

        // The pumpkins and fires flickering
        ctx.globalCompositeOperation = 'lighter';
        HW_GLOWS.forEach(([x, y, r], i) => {
            const fl = flicker(t * 1.2, i + 120);
            drawSprite(SPRITES.fire, x, y, r * 3, 0.22 * e * (0.5 + fl));
            drawSprite(SPRITES.warm, x, y, r * 0.8, 0.18 * e * fl);
        });

        // Light catching the cobwebs: a soft glint drifting slowly across each
        HW_WEBS.forEach(([x0, y0, x1, y1], i) => {
            const f = (t * 0.06 + hash(i * 3.7)) % 1;
            const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * (0.5 + 0.5 * Math.sin(f * 6.28 + i));
            drawSprite(SPRITES.white, x, y, 14, 0.12 * e * Math.sin(f * Math.PI));
        });
        ctx.restore();
    }

    /* ---------- the Christmas button ---------- */

    // The picture fades to the painted Christmas scene, and on top of it: snow falling at
    // several depths, the fairy lights twinkling, snowballs splatting on the glass now and
    // then, and Santa's sleigh and reindeer crossing the sky.
    const XMAS_LIGHTS = [[875,4],[966,5],[913,6],[1141,8],[904,9],[856,12],[1136,13],[985,14],[981,20],[969,24],[928,26],[975,32],[994,33],[1145,33],[1162,37],[988,41],[993,45],[1021,45],[1159,45],[1009,46],[980,48],[1001,51],[1160,55],[1177,57],[1015,58],[1024,58],[1044,59],[1183,59],[1009,63],[1034,63],[1027,69],[1187,69],[1053,70],[1170,71],[1033,75],[1178,76],[1046,80],[1192,81],[1202,82],[1653,84],[30,88],[44,88],[1184,89],[1646,90],[1200,92],[1664,92],[13,94],[56,94],[1638,96],[20,97],[35,98],[1588,99],[8,101],[1239,102],[55,103],[1200,103],[61,106],[1254,106],[4,108],[1566,108],[1597,108],[1644,108],[50,110],[1237,110],[21,111],[1277,111],[1308,111],[41,112],[1258,112],[1231,113],[1318,113],[1331,113],[1362,115],[1579,115],[1347,117],[1312,118],[1341,118],[1566,118],[4,120],[16,120],[1243,120],[1406,120],[1526,120],[1382,121],[1549,122],[1308,123],[1400,123],[1359,124],[1419,124],[1559,124],[1372,125],[1515,125],[1499,126],[1529,126],[8,127],[1440,127],[1426,129],[1386,130],[1472,130],[1488,131],[1507,131],[68,132],[8,133],[71,140],[1486,140],[1475,141],[68,146],[4,148],[10,148],[58,148],[73,155],[6,158],[60,159],[16,161],[2,163],[67,165],[25,169],[55,169],[18,170],[68,171],[1594,175],[12,177],[63,178],[28,180],[5,181],[1590,181],[21,185],[1597,185],[1669,185],[67,187],[1642,188],[1602,189],[18,192],[1594,192],[1659,192],[1651,193],[30,194],[1586,194],[59,195],[1636,195],[5,196],[1601,197],[1620,197],[1600,203],[23,204],[1591,205],[51,206],[1600,210],[1590,212],[1608,214],[1581,217],[1595,219],[50,276],[31,278],[59,285],[72,294],[25,303],[41,305],[58,310],[30,311]];
    const sleigh = { active: false, next: 0 };   // every Christmas effect starts the moment it is switched on
    const splats = [];
    let nextSplat = 0, xmasSince = 0;
    const FLAKE_LAYERS = [
        { n: LITE ? 380 : 1000, r: 0.9, speed: 18, a: 0.75, y0: 0, y1: 560 },   // far
        { n: LITE ? 140 : 340, r: 1.5, speed: 30, a: 0.85, y0: 0, y1: 560 },     // middle
        { n: LITE ? 30 : 70, r: 2.6, speed: 50, a: 0.75, y0: 0, y1: 560 }       // near, soft
    ];

    function updateXmas(t, dt) {
        const before = xmas;
        if (xmasOn && xmas === 0) xmasSince = t;
        xmas = xmasOn ? Math.min(1, xmas + dt / 2) : Math.max(0, xmas - dt / 2);
        if (xmas !== before) drawLaptop();
        if (!xmasOn) { if (xmas === 0) { splats.length = 0; sleigh.active = false; sleigh.next = 0; nextSplat = 0; } return; }
        if (!sleigh.active && t - xmasSince >= sleigh.next) Object.assign(sleigh, { active: true, born: t, dur: 14, ltr: Math.random() < 0.5, y: 70 + Math.random() * 90 });
        if (sleigh.active && t - sleigh.born > sleigh.dur) { sleigh.active = false; sleigh.next = t - xmasSince + 18 + Math.random() * 16; }
        if (t - xmasSince >= nextSplat && splats.length < 4) {
            const left = Math.random() < 0.6;
            splats.push({ x: left ? 120 + Math.random() * 760 : 1150 + Math.random() * 480, y: left ? 120 + Math.random() * 360 : 130 + Math.random() * 330, born: t, life: 7, r: 5 + Math.random() * 4, seed: Math.random() * 50 });
            nextSplat = t - xmasSince + 4 + Math.random() * 6;
        }
        for (let i = splats.length - 1; i >= 0; i--) if (t - splats[i].born > splats[i].life) splats.splice(i, 1);
    }

    function drawXmas(t) {
        if (!xmas) return;
        const e = xmas * xmas * (3 - 2 * xmas);
        ctx.save();

        // Santa hats on the two divers
        if (inView(1420, 1560)) DIVER_HATS.forEach(h => drawSantaHat(h, t, e));

        // Fairy lights twinkling on the tree, the garlands and the huts
        ctx.globalCompositeOperation = 'lighter';
        XMAS_LIGHTS.forEach(([x, y], i) => {
            if (x < view.x0 || x > view.x1) return;
            const n = noise(t * (0.8 + hash(i) * 1.6) + i * 5.3);
            drawSprite(hash(i * 2.7) > 0.7 ? SPRITES.white : SPRITES.warm, x, y, 5 + n * 4, e * 0.55 * n * n);
        });


        ctx.save();
        ctx.clip(OUTSIDE);

        // Snow falling outside at three depths, each flake drifting on its own sway
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgb(240,244,250)';
        FLAKE_LAYERS.forEach((L, li) => {
            const span = L.y1 - L.y0;
            ctx.globalAlpha = L.a * e;
            ctx.beginPath();
            for (let i = 0; i < L.n; i++) {
                const sp = L.speed * (0.7 + 0.6 * hash(i * 2.9 + li));
                const fall = t * sp / span + hash(i * 4.7 + li * 31);
                const cyc = Math.floor(fall), f = fall - cyc;
                const x = hash(i * 1.3 + cyc * 7.1 + li * 13) * IMG_W + Math.sin(t * (0.6 + hash(i) * 0.8) + i) * (3 + li * 3) + f * 20;
                const y = L.y0 + f * span;
                if (x < view.x0 || x > view.x1) continue;
                const r = L.r * (0.7 + 0.6 * hash(i * 9.1 + li));
                ctx.moveTo(x + r, y);
                ctx.arc(x, y, r, 0, 6.283);
            }
            ctx.fill();
        });

        // Santa's sleigh and reindeer crossing the sky, with Rudolph's nose glowing
        if (sleigh.active) {
            const f = (t - sleigh.born) / sleigh.dur;
            const dir = sleigh.ltr ? 1 : -1;
            const x = sleigh.ltr ? -60 + f * (IMG_W + 120) : IMG_W + 60 - f * (IMG_W + 120);
            const y = sleigh.y - Math.sin(f * Math.PI) * 30;
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(dir, 1);
            ctx.globalAlpha = 0.9 * e;
            ctx.fillStyle = 'rgb(12,10,14)';
            ctx.strokeStyle = 'rgb(12,10,14)';
            ctx.lineCap = 'round';
            // sleigh with Santa
            ctx.beginPath();
            ctx.moveTo(-6, 0); ctx.lineTo(5, 0); ctx.quadraticCurveTo(7, 0, 7, -2); ctx.lineTo(6, -4); ctx.lineTo(-3, -4); ctx.quadraticCurveTo(-6, -4, -6, -1.5); ctx.closePath(); ctx.fill();
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(-7, 1.4); ctx.lineTo(7.5, 1.4); ctx.quadraticCurveTo(9.5, 1.4, 9.2, -0.4); ctx.stroke();
            ctx.beginPath(); ctx.arc(-1, -6, 2.3, 0, 6.283); ctx.fill();          // Santa
            ctx.beginPath(); ctx.arc(-4.2, -4.6, 2, 0, 6.283); ctx.fill();        // sack
            // reins and four reindeer, legs galloping
            const gal = Math.sin(t * 9);
            ctx.lineWidth = 0.35;
            ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(46, -5); ctx.stroke();
            for (let r = 0; r < 4; r++) {
                const rx = 14 + r * 9, ry = -5 - Math.sin(t * 4 + r) * 0.8;
                ctx.beginPath(); ctx.ellipse(rx, ry, 3, 1.3, -0.05, 0, 6.283); ctx.fill();         // body
                ctx.lineWidth = 0.6;
                ctx.beginPath(); ctx.moveTo(rx + 2.4, ry - 0.6); ctx.lineTo(rx + 3.6, ry - 3); ctx.stroke();   // neck
                ctx.beginPath(); ctx.ellipse(rx + 4.1, ry - 3.2, 1, 0.6, 0.2, 0, 6.283); ctx.fill();         // head
                ctx.lineWidth = 0.3;
                ctx.beginPath(); ctx.moveTo(rx + 3.7, ry - 3.7); ctx.lineTo(rx + 3, ry - 5.6); ctx.lineTo(rx + 2.2, ry - 6); ctx.moveTo(rx + 3.2, ry - 5); ctx.lineTo(rx + 4, ry - 5.8); ctx.stroke();   // antlers
                ctx.lineWidth = 0.45;
                ctx.beginPath();
                ctx.moveTo(rx + 2, ry + 0.8); ctx.lineTo(rx + 2.8 + gal, ry + 3);
                ctx.moveTo(rx - 2, ry + 0.8); ctx.lineTo(rx - 2.8 - gal, ry + 3);
                ctx.stroke();
            }
            ctx.restore();
            ctx.globalCompositeOperation = 'lighter';
            drawSprite(SPRITES.red, x + dir * 46.1, y - 8.2 - Math.sin(t * 4 + 3) * 0.8, 6, 0.9 * e);
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();

        // Snowballs splatting on the window glass, then slowly sliding and melting away
        splats.forEach(sp => {
            const age = t - sp.born, f = age / sp.life;
            const a = e * Math.min(1, age / 0.05) * (1 - Math.pow(f, 2));
            const y = sp.y + Math.pow(f, 1.5) * 22;
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.75 * a;
            ctx.fillStyle = 'rgb(236,240,246)';
            ctx.beginPath();
            for (let k2 = 0; k2 < 14; k2++) {
                const ang = (k2 / 14) * 6.283;
                const rr = sp.r * (0.65 + 0.5 * hash(sp.seed + k2));
                const px = sp.x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.9;
                k2 ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            // flecks thrown out by the impact, and a melt trickle
            for (let k2 = 0; k2 < 8; k2++) {
                const ang = hash(sp.seed * 3 + k2) * 6.283, d = sp.r * (1.3 + hash(sp.seed + k2 * 7) * 1.2);
                ctx.beginPath(); ctx.arc(sp.x + Math.cos(ang) * d, y + Math.sin(ang) * d, 0.5 + hash(k2 + sp.seed) * 0.8, 0, 6.283); ctx.fill();
            }
            ctx.globalAlpha = 0.4 * a;
            ctx.fillRect(sp.x - 0.6, y, 1.2, Math.pow(f, 1.2) * 26);
        });
        ctx.restore();
    }

    /* ---------- the two divers' own moments ---------- */

    // Measured from the painting (the divers sit in the same place in every version of it).
    // The man faces right, the girl faces left; they hold hands between them.
    const DIVER_EYES = [[1459, 690, -1], [1515, 716, 1]];   // x, y, which way the far eye sits
    // Santa hats: band centre, band width, body height, tilt, and which way the tip trails
    const DIVER_HATS = [
        { x: 1456, y: 680, w: 31, H: 19, a: 0.05, dir: -1 },
        { x: 1524, y: 708.5, w: 32, H: 15, a: 0.03, dir: 1, bend: 2.2, lean: 0.8 }   // hugging her head, swept back as she swims
    ];
    // Bones for the X-ray: skull (x, y, rx, ry), jaw, spine, shoulders, pelvis and limbs, in picture pixels
    const DIVER_BONES = [
        { skull: [1454, 684, 9, 10.5], jaw: [[1448, 692], [1457, 699], [1463, 695]], spine: [[1446, 698], [1437, 712], [1428, 735], [1419, 766]],
          shoulders: [[1428, 708], [1447, 709]], pelvis: [1419, 767, 7, 4], w: 1.6,
          limbs: [[[1446, 710], [1462, 735], [1477, 744], [1483, 747]], [[1428, 711], [1419, 744], [1424, 756], [1431, 763]],
                  [[1418, 767], [1398, 784], [1404, 806]], [[1421, 768], [1412, 790], [1418, 810]]] },
        { skull: [1520, 712, 8, 9], jaw: [[1512, 717], [1514, 723], [1521, 723]], spine: [[1525, 722], [1527, 735], [1535, 755], [1546, 773]],
          shoulders: [[1513, 731], [1533, 732]], pelvis: [1546, 775, 6, 3.5], w: 1.3,
          limbs: [[[1513, 731], [1499, 742], [1488, 746]], [[1533, 732], [1538, 752], [1540, 771]],
                  [[1547, 776], [1562, 788], [1574, 786]], [[1544, 778], [1552, 795], [1560, 808]]] }
    ];
    let filmReadyAt = -1;   // when the X-ray film was first available, so it fades in rather than popping

    // The X-ray film: the divers cut from the Halloween painting with soft edges and turned into a
    // cool, high-contrast negative, so dark wetsuits glow and the water behind them goes dark.
    // Built once, the first time it is needed.
    const XRAY_BOX = [1350, 645, 1620, 840];
    let xrayCanvas = null;
    function xrayFilm() {
        if (xrayCanvas) return xrayCanvas;
        if (!hwImg.complete || !hwImg.naturalWidth) return null;
        const S = 2, [x0, y0, x1, y1] = XRAY_BOX, W = (x1 - x0) * S, H = (y1 - y0) * S;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        // a feathered mask of the two divers (the shadow of a shape drawn off-canvas)
        g.save();
        g.shadowColor = '#fff';
        g.shadowBlur = 7 * S;
        g.shadowOffsetX = 10000;
        g.translate(-10000, 0);
        g.scale(S, S);
        g.translate(-x0, -y0);
        g.fillStyle = '#fff';
        DIVER_SHAPES.forEach(poly => g.fill(pathFrom(poly)));
        g.restore();
        const mask = g.getImageData(0, 0, W, H).data;
        g.clearRect(0, 0, W, H);
        const sx = hwImg.naturalWidth / IMG_W;
        g.drawImage(hwImg, x0 * sx, y0 * sx, (x1 - x0) * sx, (y1 - y0) * sx, 0, 0, W, H);
        const im = g.getImageData(0, 0, W, H), d = im.data;
        for (let i = 0; i < d.length; i += 4) {
            const L = 0.3 * d[i] + 0.55 * d[i + 1] + 0.15 * d[i + 2];
            let v = (255 - L - 55) * 1.6;
            v = Math.max(0, Math.min(255, v));
            // the bright open water around them drops out, so only the divers turn to film
            const water = Math.max(0, Math.min(1, (d[i + 2] - d[i] - 110) / 60)) * Math.max(0, Math.min(1, (L - 95) / 40));
            d[i] = v * 0.58; d[i + 1] = v * 0.72; d[i + 2] = Math.min(255, v * 0.84 + 16);   // kept below white, so the bones read brighter
            d[i + 3] = mask[i + 3] * (1 - water);
        }
        g.putImageData(im, 0, 0);
        g.save();
        g.scale(S, S);
        g.translate(-x0, -y0);
        paintBones(g, S);
        g.restore();
        xrayCanvas = c;
        return c;
    }

    // Halloween: the divers become X-ray skeletons, fading in with the painting, with a red glow in their eyes
    // The skeletons, painted once onto the X-ray film (c is scaled to picture pixels; S is its scale)
    function paintBones(c, S) {
        c.save();
        c.globalCompositeOperation = 'screen';
        c.globalAlpha = 0.9;
        c.filter = `blur(${(0.45 * S).toFixed(2)}px)`;
        c.shadowColor = 'rgba(170,230,255,0.8)';
        c.shadowBlur = 3 * S;
        c.lineCap = c.lineJoin = 'round';
        const bone = 'rgba(232,248,255,0.9)';
        const line = pts => { c.beginPath(); pts.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
        const knobs = (pts, r) => pts.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); });
        DIVER_BONES.forEach((B, bi) => {
            const f = bi === 0 ? 1 : -1;   // which way the face points
            const w = B.w;
            c.strokeStyle = c.fillStyle = bone;
            // limbs: slim shafts with rounded joints
            c.lineWidth = w * 0.8;
            B.limbs.forEach(L => { line(L); knobs(L.slice(1, -1), w * 0.75); });
            line(B.shoulders);
            // spine: a chain of small vertebrae
            const S = B.spine;
            for (let s = 0; s < S.length - 1; s++) {
                const [x0, y0] = S[s], [x1, y1] = S[s + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (w * 2.4)));
                for (let v = 0; v < n; v++) { const u = v / n; c.beginPath(); c.arc(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, w * 0.62, 0, 6.283); c.fill(); }
            }
            // ribs: seen from the side, curving forward and down from the spine
            c.lineWidth = w * 0.42;
            for (let r = 0; r < 6; r++) {
                const u = 0.1 + r * 0.14, [p0, p1] = [S[1], S[2]];
                const px = p0[0] + (p1[0] - p0[0]) * u * 1.6, py = p0[1] + (p1[1] - p0[1]) * u * 1.6;
                const len = w * (7.5 - r * 0.5);
                c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + f * len * 0.6, py - w * 1.2, px + f * len, py + w * 1.8); c.stroke();
            }
            // pelvis
            const [qx, qy, qrx, qry] = B.pelvis;
            c.lineWidth = w * 0.7;
            c.beginPath(); c.ellipse(qx, qy, qrx, qry, -0.4, 0.2, 5.9); c.stroke();
            // skull in profile: brighter at the rim like bone on film, with the eye socket,
            // the nose and a row of teeth on the jaw
            const [sx, sy, rx, ry] = B.skull;
            const sg = c.createRadialGradient(sx, sy, 0, sx, sy, Math.max(rx, ry));
            sg.addColorStop(0, 'rgba(200,232,248,0.04)');
            sg.addColorStop(0.7, 'rgba(225,246,255,0.3)');
            sg.addColorStop(0.9, 'rgba(240,252,255,0.85)');
            sg.addColorStop(1, 'rgba(240,252,255,0.2)');
            c.fillStyle = sg;
            c.beginPath(); c.ellipse(sx, sy, rx, ry, f * 0.15, 0, 6.283); c.fill();
            c.lineWidth = w * 0.7;
            c.strokeStyle = bone;
            c.beginPath(); c.moveTo(B.jaw[0][0], B.jaw[0][1]); c.quadraticCurveTo(B.jaw[1][0], B.jaw[1][1] + 1, B.jaw[2][0], B.jaw[2][1]); c.stroke();
            c.lineWidth = 0.4;
            for (let q = 0; q < 5; q++) { const tx = sx + f * (rx * 0.25 + q * 1.1), ty = sy + ry * 0.62; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty + 1.6); c.stroke(); }
            c.save();
            c.globalCompositeOperation = 'source-over';
            c.shadowBlur = 0;
            c.fillStyle = 'rgba(10,26,44,0.75)';
            const [ex, ey] = DIVER_EYES[bi];
            c.fillStyle = 'rgba(8,20,36,0.85)';
            c.beginPath(); c.ellipse(ex - f * 0.6, ey - 0.2, 2.7, 3.1, f * 0.2, 0, 6.283); c.fill();           // eye socket
            c.beginPath(); c.moveTo(ex + f * 1.2, ey + 3); c.lineTo(ex + f * 2.6, ey + 5.6); c.lineTo(ex + f * 0.6, ey + 5.4); c.closePath(); c.fill();   // nose
            c.restore();
        });
        c.restore();
    }

    function drawGhostDivers(t, e) {
        if (!inView(1380, 1620)) return;
        ctx.save();
        // the divers as an X-ray negative of the painting, skeletons and all (prepared once)
        const film = xrayFilm();
        if (film) {
            if (filmReadyAt < 0) filmReadyAt = t;
            ctx.globalAlpha = e * Math.min(1, (t - filmReadyAt) / 1.2);
            ctx.drawImage(film, XRAY_BOX[0], XRAY_BOX[1], XRAY_BOX[2] - XRAY_BOX[0], XRAY_BOX[3] - XRAY_BOX[1]);
            ctx.globalAlpha = 1;
        }
        DIVER_EYES.forEach(([x, y, far], i) => {
            const pulse = 0.6 + 0.4 * noise(t * 0.7 + i * 9);
            [[0, 0, 1], [far * 2.3, -0.3, 0.45]].forEach(([dx, dy, s]) => {
                const ex = x - far * 0.6 + dx, ey = y - 0.2 + dy;   // in the skull's eye socket
                const halo = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5);
                halo.addColorStop(0, `rgba(255,70,40,${(0.45 * e * pulse * s).toFixed(3)})`);
                halo.addColorStop(1, 'rgba(255,70,40,0)');
                ctx.fillStyle = halo;
                ctx.fillRect(ex - 5, ey - 5, 10, 10);
                ctx.globalAlpha = e * pulse * s;
                ctx.fillStyle = 'rgb(255,150,110)';
                ctx.beginPath(); ctx.arc(ex, ey, 0.75, 0, 6.283); ctx.fill();
                ctx.globalAlpha = 1;
            });
        });
        ctx.restore();
    }

    // Christmas: a small Santa hat on each diver, tinted by the water, its tip drifting in the current
    function paintSantaHat(ctx, h, S) {
        const { w, H, dir } = h, hw = w / 2, f = -dir, bend = h.bend || 0, lean = h.lean || 0;   // lean: the crown swept back   // f: the side the face is on; bend: the band follows the head's curve
        const sway = 0;
        ctx.save();
        ctx.filter = `blur(${(0.35 * S).toFixed(2)}px)`;
        const tipX = -f * (hw + w * (0.2 + lean * 0.25)), tipY = H * (0.02 + lean * 0.08 + sway);   // the tip droops down behind the head
        // the body: up from the brow to the crown, then flopping back to the tip
        const body = new Path2D();
        body.moveTo(f * hw, 0);
        const crownX = -f * (hw * 0.2 + lean * w * 0.3);
        body.quadraticCurveTo(f * hw * (0.8 - lean * 0.5), -H * (1.0 - lean * 0.15), crownX, -H * (1.02 - lean * 0.12));
        body.quadraticCurveTo(-f * (hw + w * (0.32 + lean * 0.12)), -H * (0.95 - lean * 0.3), tipX, tipY);
        body.quadraticCurveTo(-f * hw * 0.9, -H * 0.42, -f * hw, 0);
        body.quadraticCurveTo(0, -bend * 2, f * hw, 0);   // the brim follows the band's curve
        body.closePath();
        const g = ctx.createLinearGradient(f * hw, -H, -f * hw, 0);
        g.addColorStop(0, 'rgb(158,44,80)');     // red, muted and cooled by the water
        g.addColorStop(0.55, 'rgb(122,30,70)');
        g.addColorStop(1, 'rgb(72,18,56)');
        ctx.fillStyle = g;
        ctx.fill(body);
        // a soft highlight where the surface light catches the crown
        ctx.save();
        ctx.clip(body);
        const hl = ctx.createRadialGradient(0, -H * 0.85, 0, 0, -H * 0.85, w * 0.45);
        hl.addColorStop(0, 'rgba(150,215,255,0.3)');   // blue light from the surface
        hl.addColorStop(1, 'rgba(150,215,255,0)');
        ctx.fillStyle = hl;
        ctx.fillRect(-w, -H * 1.5, w * 2, H * 1.5);
        ctx.restore();
        // the furry band and the pom-pom, faintly blue from the water
        const bh = Math.max(3, H * 0.24);
        const band = ctx.createLinearGradient(0, -bh * 0.6, 0, bh * 0.6);
        band.addColorStop(0, 'rgb(214,234,244)');
        band.addColorStop(1, 'rgb(150,188,210)');
        ctx.fillStyle = band;
        ctx.beginPath();
        ctx.moveTo(-hw - 1, -bh * 0.5);
        const arc = i => -bend * Math.sin(Math.PI * i / 6);
        for (let i = 0; i <= 6; i++) ctx.lineTo(-hw - 1 + (w + 2) * i / 6, arc(i) - bh * 0.5 - (i % 2) * 0.5);
        ctx.lineTo(hw + 1, bh * 0.55);
        for (let i = 6; i >= 0; i--) ctx.lineTo(-hw - 1 + (w + 2) * i / 6, arc(i) + bh * 0.55 + (i % 2) * 0.5);
        ctx.closePath();
        ctx.fill();
        const pr = w * 0.13;
        const pom = ctx.createRadialGradient(tipX - pr * 0.3, tipY - pr * 0.3, 0, tipX, tipY, pr);
        pom.addColorStop(0, 'rgb(222,240,248)');
        pom.addColorStop(1, 'rgb(140,180,204)');
        ctx.fillStyle = pom;
        ctx.beginPath(); ctx.arc(tipX, tipY, pr, 0, 6.283); ctx.fill();
        ctx.restore();
    }

    // Each hat is painted once into its own small image; every frame it is simply placed on the
    // diver's head, rocking very slightly as if in the current
    const hatSprites = new Map();
    function hatSprite(h) {
        if (hatSprites.has(h)) return hatSprites.get(h);
        const S = 4, left = h.w * 1.25, top = h.H * 1.45, W = h.w * 2.5, H = h.H * 2.5;
        const c = document.createElement('canvas');
        c.width = Math.ceil(W * S); c.height = Math.ceil(H * S);
        const g = c.getContext('2d');
        g.scale(S, S);
        g.translate(left, top);
        paintSantaHat(g, h, S);
        const s = { c, left, top, W, H };
        hatSprites.set(h, s);
        return s;
    }
    function drawSantaHat(h, t, e) {
        const s = hatSprite(h);
        const rock = Math.sin(t * 0.8 + h.x * 0.1) * 0.035 + Math.sin(t * 1.9 + h.x) * 0.012;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.a + rock);
        ctx.globalAlpha = e;
        ctx.drawImage(s.c, -s.left, -s.top, s.W, s.H);
        ctx.restore();
    }

    // Daytime: now and then a sea turtle swims up to the girl, circles her and drifts away.
    // It swims behind the divers, like the fish, so she hides it as it passes.
    const turtle = { active: false, next: 6, born: 0, x: 1700, y: 716, heading: Math.PI, flip: -1 };
    const TURTLE_RING = { cx: 1527, cy: 722, rx: 56, ry: 16 };
    function turtleAt(age) {
        const R = TURTLE_RING, smooth = u => u * u * (3 - 2 * u);
        if (age < 7) {   // in from the right-hand edge of the tank
            const u = smooth(age / 7);
            return [1700 + (R.cx + R.rx - 1700) * u, 712 + (R.cy - 712) * u, 1];
        }
        if (age < 19) {  // once and a bit around her, going over the top first
            const th = -2.4 * Math.PI * smooth((age - 7) / 12);
            return [R.cx + R.rx * Math.cos(th), R.cy + R.ry * Math.sin(th), Math.sin(th) < 0 ? 0.86 : 1];
        }
        const u = smooth(Math.min(1, (age - 19) / 9));   // then away, up and out to the right
        const sx = R.cx + R.rx * Math.cos(-0.4 * Math.PI), sy = R.cy + R.ry * Math.sin(-0.4 * Math.PI);
        return [sx + (1710 - sx) * u, sy + (650 - sy) * u, 0.86 + 0.14 * u];
    }
    function updateTurtle(t, dt) {
        if (day === 0) { turtle.active = false; turtle.next = t + 6; return; }   // first visit 6 s after the lights come up
        if (!turtle.active && day === 1 && t >= turtle.next) Object.assign(turtle, { active: true, born: t });
        if (!turtle.active) return;
        const age = t - turtle.born;
        if (age > 28) { turtle.active = false; turtle.next = t + 35 + Math.random() * 25; return; }
        const [x, y, s] = turtleAt(age);
        const vx = x - turtle.x, vy = y - turtle.y;
        if (Math.hypot(vx, vy) > 0.02) {
            const want = Math.atan2(vy, vx);
            let d = want - turtle.heading;
            d = Math.atan2(Math.sin(d), Math.cos(d));
            turtle.heading += d * Math.min(1, dt * 2.5);   // turns gently rather than snapping
        }
        Object.assign(turtle, { x, y, s });
    }
    function drawTurtle(t) {
        if (!turtle.active || !day) return;
        const e = day * day * (3 - 2 * day);
        const age = t - turtle.born;
        const fade = Math.min(1, age / 1.5, (28 - age) / 1.5);
        const L = 34 * turtle.s;   // shell length in picture pixels
        const dir = Math.cos(turtle.heading) >= 0 ? 1 : -1;
        const tilt = Math.max(-0.45, Math.min(0.45, Math.atan2(Math.sin(turtle.heading), Math.abs(Math.cos(turtle.heading)))));
        const stroke = Math.sin(t * 1.6);   // slow, rowing flipper strokes
        const SKIN = 'rgb(86,108,92)', SKIN_FAR = 'rgb(60,82,78)', EDGE = 'rgba(186,196,158,0.55)';
        ctx.save();
        ctx.clip(fishClip, 'evenodd');
        ctx.globalAlpha = 0.95 * e * fade;
        ctx.translate(turtle.x, turtle.y);
        ctx.scale(dir, 1);
        ctx.rotate(tilt);
        // a long, wing-like flipper with a pale leading edge
        const flipper = (rx, ry, ang, len, col, edge) => {
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(ang);
            const f = new Path2D();
            f.moveTo(0, -len * 0.1);
            f.bezierCurveTo(-len * 0.35, -len * 0.16, -len * 0.75, -len * 0.06, -len, len * 0.1);
            f.bezierCurveTo(-len * 0.7, len * 0.14, -len * 0.3, len * 0.2, 0, len * 0.12);
            f.closePath();
            ctx.fillStyle = col;
            ctx.fill(f);
            if (edge) {
                ctx.strokeStyle = edge;
                ctx.lineWidth = 0.6;
                ctx.beginPath(); ctx.moveTo(0, -len * 0.1); ctx.bezierCurveTo(-len * 0.35, -len * 0.16, -len * 0.75, -len * 0.06, -len, len * 0.1); ctx.stroke();
            }
            ctx.restore();
        };
        // far flippers first, darker, behind the shell
        flipper(L * 0.2, L * 0.02, 0.45 - stroke * 0.55, L * 0.72, SKIN_FAR);
        flipper(-L * 0.38, L * 0.05, 0.3 + stroke * 0.2, L * 0.3, SKIN_FAR);
        // neck and head, with a darker beak and a small eye
        ctx.fillStyle = SKIN;
        ctx.beginPath(); ctx.moveTo(L * 0.36, -L * 0.1); ctx.quadraticCurveTo(L * 0.5, -L * 0.13, L * 0.56, -L * 0.08); ctx.lineTo(L * 0.56, L * 0.06); ctx.quadraticCurveTo(L * 0.46, L * 0.08, L * 0.36, L * 0.06); ctx.closePath(); ctx.fill();
        const hg = ctx.createLinearGradient(0, -L * 0.14, 0, L * 0.1);
        hg.addColorStop(0, 'rgb(134,150,122)');
        hg.addColorStop(1, 'rgb(92,116,100)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.ellipse(L * 0.64, -L * 0.03, L * 0.15, L * 0.105, -0.12, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgb(62,78,66)';
        ctx.beginPath(); ctx.ellipse(L * 0.76, -L * 0.01, L * 0.045, L * 0.04, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgb(20,30,28)';
        ctx.beginPath(); ctx.arc(L * 0.68, -L * 0.06, Math.max(0.5, L * 0.022), 0, 6.283); ctx.fill();
        // the shell: a low dome over a flatter underside
        const shell = new Path2D();
        shell.moveTo(-L * 0.5, L * 0.04);
        shell.bezierCurveTo(-L * 0.44, -L * 0.32, L * 0.3, -L * 0.36, L * 0.46, 0);
        shell.quadraticCurveTo(L * 0.05, L * 0.15, -L * 0.5, L * 0.04);
        const sg = ctx.createLinearGradient(0, -L * 0.32, 0, L * 0.12);
        sg.addColorStop(0, 'rgb(142,140,96)');
        sg.addColorStop(0.5, 'rgb(98,102,72)');
        sg.addColorStop(1, 'rgb(60,72,58)');
        ctx.fillStyle = sg;
        ctx.fill(shell);
        // scutes: a row of large plates along the top and smaller ones round the rim
        ctx.save();
        ctx.clip(shell);
        ctx.strokeStyle = 'rgba(52,54,36,0.6)';
        ctx.lineWidth = 0.55;
        [[-0.26, -0.18], [-0.02, -0.22], [0.22, -0.17]].forEach(([u, v]) => {
            ctx.beginPath(); ctx.ellipse(L * u, L * v, L * 0.13, L * 0.09, 0, 0, 6.283); ctx.stroke();
        });
        ctx.beginPath(); ctx.moveTo(-L * 0.48, -L * 0.04); ctx.quadraticCurveTo(0, -L * 0.1, L * 0.44, -L * 0.03); ctx.stroke();
        for (let s = 0; s < 7; s++) { const u = -0.42 + s * 0.13; ctx.beginPath(); ctx.moveTo(L * u, -L * 0.06); ctx.lineTo(L * (u - 0.02), L * 0.06); ctx.stroke(); }
        // light from the surface catching the top of the shell
        const hl = ctx.createRadialGradient(-L * 0.05, -L * 0.3, 0, -L * 0.05, -L * 0.3, L * 0.4);
        hl.addColorStop(0, 'rgba(200,235,240,0.35)');
        hl.addColorStop(1, 'rgba(200,235,240,0)');
        ctx.fillStyle = hl;
        ctx.fillRect(-L, -L, L * 2, L);
        ctx.restore();
        // the pale edge of the underside
        ctx.strokeStyle = EDGE;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-L * 0.46, L * 0.05); ctx.quadraticCurveTo(L * 0.05, L * 0.15, L * 0.44, L * 0.01); ctx.stroke();
        // near flippers on top: the long front one rowing, the small back one steering
        flipper(L * 0.16, L * 0.08, 0.35 + stroke * 0.6, L * 0.78, SKIN, EDGE);
        flipper(-L * 0.4, L * 0.09, 0.45 - stroke * 0.2, L * 0.32, SKIN, EDGE);
        ctx.restore();
    }

    /* ---------- daytime ---------- */

    function updateDay(dt) {
        const target = dayOn && dayImg.naturalWidth ? 1 : 0;
        const before = day;
        day = target ? Math.min(1, day + dt / 2) : Math.max(0, day - dt / 2);
        if (day !== before) drawLaptop();   // the climber overlay fades with the light
    }

    // Sunlight glinting on the water, and soft wisps of cloud drifting across the sky
    const WISPS = Array.from({ length: 10 }, (_, i) => ({ x: hash(i * 3.7) * IMG_W, y: 30 + hash(i * 5.1) * 170, r: 60 + hash(i * 2.3) * 70, sp: 3 + hash(i * 6.7) * 4 }));
    function drawDaytime(t) {
        const e = day * day * (3 - 2 * day);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        WATER.forEach(({ poly }, wi) => {
            const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            if (!inView(x0, x1)) return;
            ctx.save();
            ctx.clip(pathFrom(poly));
            for (let i = 0; i < 90; i++) {
                const x = x0 + hash(i * 1.7 + wi * 50) * (x1 - x0);
                const y = y0 + hash(i * 3.3 + wi * 50) * (y1 - y0);
                const n = noise(t * (1.5 + hash(i) * 2) + i * 4.1 + wi * 9);
                drawSprite(SPRITES.white, x, y, 2 + 2 * ((y - y0) / (y1 - y0)), 0.9 * e * Math.pow(n, 6));
            }
            ctx.restore();
        });
        ctx.save();
        ctx.clip(OUTSIDE);
        ctx.globalCompositeOperation = 'source-over';
        WISPS.forEach(w => {
            const x = ((w.x + t * w.sp) % (IMG_W + 300)) - 150;
            ctx.save();
            ctx.translate(x, w.y);
            ctx.scale(1, 0.3);
            drawSprite(mistSprite, 0, 0, w.r * 2, 0.16 * e);
            ctx.restore();
        });
        ctx.restore();
        ctx.restore();
    }

    /* ---------- easter eggs ---------- */

    // Hidden words. Rest the pointer on certain things for a moment (or tap them on a touch
    // screen) and a small note fades in beside the object. Boxes are x0, y0, x1, y1 in the
    // picture; the gecko's follows the gecko.
    const AVENOIR = 'the desire that memory could flow backward, not to change events but to experience – with experience.';
    const EGGS = [
        { boxes: [[108, 800, 148, 838]], word: 'Sonder', def: 'the realization that everybody around you is living a life just as complex as yours, in which you are just a bit part.' },
        { boxes: [[1575, 400, 1608, 520]], word: 'Onism', def: 'the awareness of how little of the world you’ll experience, there is only so much time for curious minds.' },
        { boxes: [[1498, 220, 1512, 250]], word: 'Avenoir', def: AVENOIR },
        { boxes: [[1510, 705, 1545, 760]], word: 'Patroagon', def: 'a father’s quiet, persistent dread about the future when he contemplates no longer being around to protect or guide his children.' },
        { boxes: [[1120, 643, 1140, 655]], word: 'Liberosis', def: 'the desire to care less about things.' },
        { boxes: [[145, 615, 190, 640]], word: 'Chrysalism', def: 'the amniotic tranquility of being indoors during a thunderstorm.' },
        { boxes: [[755, 240, 769, 330]], word: 'Anecdoche', def: 'a conversation in which everyone is talking, but nobody is listening.' },
        { boxes: [[1440, 35, 1495, 80]], word: 'Ellipsism', def: 'a sadness that you’ll never be able to know how history will turn out.' },
        { boxes: [[420, 470, 446, 520]], word: 'Symphoric', pos: 'adj.', def: 'the quiet comfort of existing together without needing to speak - moving around the same room in an unspoken choreography where presence alone is enough, and silence feels shared rather than empty.' },
        { boxes: [[728, 478, 770, 545]], word: 'Suerza', def: 'a sense of quiet amazement and gratitude that you exist at all, realizing your life is the culmination of an unbroken chain of ancestors, parents, and reproductive chance stretching back across generations.' },
        { gecko: true, word: 'Exulansis', def: 'the tendency to give up trying to talk about an experience because people are unable to relate to it.' },
        { boxes: [[600, 461, 610, 472], [541, 481, 550, 492], [626, 485, 635, 496], [669, 488, 678, 500]], word: 'Anemoia', def: 'a feeling of nostalgia for a time or a place that you have never personally known or experienced.' }
    ];
    const DWELL_MS = 1100;   // how long the pointer must rest on an object

    // The words only appear once the little light switch on the column in front of the desk
    // has been flicked on. It is off every time the page loads.
    const SWITCH = { x: 1078, y: 468, w: 9, h: 14 };   // centre and size in the picture

    const egg = document.createElement('div');
    egg.className = 'egg';
    egg.setAttribute('role', 'tooltip');
    egg.setAttribute('aria-live', 'polite');
    document.body.appendChild(egg);
    let eggShown = null;
    let eggTimer = 0;
    let dwell = { e: null, timer: 0 };

    // Screen position to picture position, following the parallax, panning and breathing zoom
    function toImage(cx, cy) {
        const r = canvas.getBoundingClientRect();
        return [((cx - r.left) / r.width) * IMG_W, ((cy - r.top) / r.height) * IMG_H];
    }

    // The object's box on screen right now
    function boxOnScreen(e, box) {
        const r = canvas.getBoundingClientRect();
        const sx = r.width / IMG_W, sy = r.height / IMG_H;
        if (e.gecko) box = [gecko.x - 10, gecko.y - 12, gecko.x + 10, gecko.y + 12];
        return { l: r.left + box[0] * sx, t: r.top + box[1] * sy, r: r.left + box[2] * sx, b: r.top + box[3] * sy };
    }

    function onSwitch(cx, cy) {
        const [x, y] = toImage(cx, cy);
        return Math.abs(x - SWITCH.x) <= SWITCH.w / 2 + 2 && Math.abs(y - SWITCH.y) <= SWITCH.h / 2 + 2;
    }

    function onRedButton(cx, cy) {
        const [x, y] = toImage(cx, cy);
        return Math.abs(x - RED_BUTTON.x) <= 4.5 && Math.abs(y - RED_BUTTON.y) <= 5;
    }

    function onWeatherButton(cx, cy) {
        const [x, y] = toImage(cx, cy);
        return Math.abs(x - WEATHER_BUTTON.x) <= 4.5 && Math.abs(y - WEATHER_BUTTON.y) <= 5;
    }

    function toggleDay() {
        dayOn = !dayOn;
        if (dayOn) {
            loadDay();
            if (eggsOn) toggleSwitch();   // the scenes are night-only, so daylight turns the lamp switch off
        }
        applyImages();
        drawLaptop();
    }

    function onRainSwitch(cx, cy) {
        const [x, y] = toImage(cx, cy);
        return Math.abs(x - RAIN_SWITCH.x) <= 6 && Math.abs(y - RAIN_SWITCH.y) <= 4;
    }

    // Only one scene at a time, and none at all unless the light switch is on
    function setScene(name) {
        chaosOn = name === 'halloween';
        rainOn = name === 'rain';
        xmasOn = name === 'christmas';
        if (rainOn) weather.start = null;   // starts on the next frame
        if (chaosOn) loadHalloween();
        if (xmasOn) loadChristmas();
        applyImages();
        drawLaptop();
    }

    function toggleRain() {
        if (!rainOn && !eggsOn) return;
        setScene(rainOn ? null : 'rain');
    }

    function toggleXmas() {
        if (!xmasOn && !eggsOn) return;
        setScene(xmasOn ? null : 'christmas');
    }

    function onXmasButton(cx, cy) {
        const [x, y] = toImage(cx, cy);
        return Math.abs(x - XMAS_BUTTON.x) <= 4.5 && Math.abs(y - XMAS_BUTTON.y) <= 5;
    }

    function toggleChaos() {
        // A double safeguard: the button only arms while the word light switch is on
        if (!chaosOn && !eggsOn) return;
        setScene(chaosOn ? null : 'halloween');
    }

    function toggleSwitch() {
        if (!eggsOn && dayOn) return;   // the lamp switch only goes on at night
        eggsOn = !eggsOn;
        if (eggsOn) { loadHalloween(); loadChristmas(); }
        if (!eggsOn) { clearTimeout(dwell.timer); dwell.e = null; hideEgg(0); setScene(null); }
        drawLaptop();   // the switch lives on the static layer
    }

    function eggAt(cx, cy) {
        if (!eggsOn) return null;
        const [x, y] = toImage(cx, cy);
        for (const e of EGGS) {
            if (e.gecko) {
                if (gecko.active && gecko.fade > 0.4 && Math.hypot(x - gecko.x, y - gecko.y) < 14) return { e, box: null };
                continue;
            }
            const box = e.boxes.find(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
            if (box) return { e, box };
        }
        return null;
    }

    // Place the note beside the object (not the pointer), so it stays put once it appears
    function showEgg(hit) {
        clearTimeout(eggTimer);
        if (eggShown !== hit.e) {
            egg.innerHTML = hit.e.thought ? `<p class="egg-thought">“${hit.e.thought}”</p>` : `<p class="egg-head"><span class="egg-word">${hit.e.word}</span><span class="egg-pos">${hit.e.pos || 'n.'}</span></p><p class="egg-def">${hit.e.def}</p>`;
            eggShown = hit.e;
        }
        const o = boxOnScreen(hit.e, hit.box);
        const pad = 12, gap = 10;
        const w = egg.offsetWidth, h = egg.offsetHeight;
        let x = o.r + gap;
        if (x + w > innerWidth - pad) x = o.l - w - gap;
        let y = (o.t + o.b) / 2 - h / 2;
        x = Math.max(pad, Math.min(innerWidth - w - pad, x));
        y = Math.max(pad, Math.min(innerHeight - h - pad, y));
        egg.style.left = Math.round(x) + 'px';
        egg.style.top = Math.round(y) + 'px';
        egg.classList.add('show');
    }

    function hideEgg(delay) {
        clearTimeout(eggTimer);
        eggTimer = setTimeout(() => {
            egg.classList.remove('show');
            eggShown = null;
        }, delay || 0);
    }

    const dialogOpen = () => document.querySelector('dialog[open]');

    stage.addEventListener('click', e => {
        if (e.pointerType !== 'mouse' && e.pointerType !== '') return;
        if (onSwitch(e.clientX, e.clientY)) toggleDay();
        else if (onRainSwitch(e.clientX, e.clientY)) toggleSwitch();
        else if (onRedButton(e.clientX, e.clientY)) toggleChaos();
        else if (onXmasButton(e.clientX, e.clientY)) toggleXmas();
        else if (onWeatherButton(e.clientX, e.clientY)) toggleRain();
    });

    // Mouse: only after resting on an object for a moment
    addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const hit = dialogOpen() || e.target.closest('button') ? null : eggAt(e.clientX, e.clientY);
        const id = hit ? hit.e : null;
        if (id !== dwell.e) {
            clearTimeout(dwell.timer);
            dwell.e = id;
            if (hit) dwell.timer = setTimeout(() => showEgg(hit), DWELL_MS);
        }
        if (!hit && eggShown) hideEgg(400);
        else if (hit && eggShown === hit.e) clearTimeout(eggTimer);
    });

    // Touch: a tap (not a swipe) shows the word; it fades by itself after a while
    let tapStart = null;
    stage.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse') return;
        tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    addEventListener('pointermove', e => {
        if (tapStart && e.pointerType !== 'mouse' && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) > 10) {
            tapStart = null;
            if (eggShown) hideEgg(0);
        }
    });
    addEventListener('pointerup', e => {
        if (!tapStart || e.pointerType === 'mouse') return;
        const quick = performance.now() - tapStart.t < 450;
        tapStart = null;
        if (!quick || dialogOpen()) return;
        if (onSwitch(e.clientX, e.clientY)) { toggleDay(); return; }
        if (onRainSwitch(e.clientX, e.clientY)) { toggleSwitch(); return; }
        if (onRedButton(e.clientX, e.clientY)) { toggleChaos(); return; }
        if (onXmasButton(e.clientX, e.clientY)) { toggleXmas(); return; }
        if (onWeatherButton(e.clientX, e.clientY)) { toggleRain(); return; }
        const hit = eggAt(e.clientX, e.clientY);
        if (hit) {
            showEgg(hit);
            hideEgg(7000);
        } else if (eggShown) {
            hideEgg(0);
        }
    });

    /* ---------- main loop ---------- */

    let start = 0;
    let last = 0;
    let lastDraw = 0;

    function frame(now) {
        // The first frame can be stamped fractionally before start; never let time run negative
        const t = Math.max(0, (now - start) / 1000);
        applyParallax(t);

        // The picture itself moves every frame (so swipes stay smooth); on phones the effects
        // are updated and redrawn 30 times a second, plenty for slow ambient motion
        if (now - lastDraw < 30) { requestAnimationFrame(frame); return; }
        lastDraw = now;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;

        updateBubbles(t, dt);
        updateSteam(t);
        updateCityEvents(t);
        updateEmbers(t, dt);
        updateHutLights(t);
        updateHutPatches(t);
        updateLanterns(t);
        updateBoat(t, dt);
        updateGecko(t, dt);
        updatePlane(t);
        updateParty(t, dt);
        updateCrowd(t);
        updateMonkeys(t, dt);
        updateFish(t, dt);
        updateOryx(t, dt);
        updateChaos(t, dt);
        updateWeather(t, dt);
        updateXmas(t, dt);
        updateDay(dt);
        updateTurtle(t, dt);

        // Work out which part of the picture is on screen
        const m = 40;
        view.x0 = (overflowX * pan.focal) / stageScale - m;
        view.x1 = view.x0 + innerWidth / stageScale + 2 * m;

        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.clearRect(0, 0, IMG_W, IMG_H);
        regions.forEach(r => drawDistort(r, t));
        if (inView(1015, 1210)) drawHutPatches(t);
        if (inView(1380, 1520)) drawBoat(t);
        if (inView(1250, IMG_W)) { drawFish(t); drawTurtle(t); drawAquarium(t); }
        if (inView(1240, 1300)) drawMonkeys(t);
        if (inView(140, 230)) drawOryx(t);
        if (inView(430, 490)) drawSteam(t);
        if (inView(0, 70)) drawGecko(t);
        if (inView(1440, IMG_W)) {
            drawParty(t);
            DANCERS.forEach((d, i) => drawDancer(d, i, t));
            drawCrowd(t);
        }
        drawLights(t);
        drawWeather(t);
        drawXmas(t);
        drawChaos(t);

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
