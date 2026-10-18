/*
 * Background music: "Exploration Theme" by Cleyton Kauffman (CC0, public domain),
 * hosted on the site as assets/audio/ambient.mp3. It loops seamlessly.
 *
 * Sound is off until the visitor turns it on (browsers block audio without a click).
 * The file only downloads on that first click, then fades in and out gently.
 */
(() => {
    const SRC = 'assets/audio/ambient.mp3';
    const VOLUME = 0.55;        // 0-1
    const FADE_IN_MS = 2500;
    const FADE_OUT_MS = 800;

    const button = document.getElementById('sound-toggle');
    const label = document.getElementById('sound-label');

    let audio = null;
    let wanted = false;
    let fade = 0;

    function setState(state) {
        button.dataset.state = state;
        button.setAttribute('aria-pressed', String(state !== 'off'));
        label.textContent = state === 'off' ? 'Sound off' : 'Sound on';
    }

    function fadeTo(target, ms, done) {
        cancelAnimationFrame(fade);
        const from = audio.volume;
        const t0 = performance.now();
        const step = now => {
            const f = Math.min(1, (now - t0) / ms);
            audio.volume = from + (target - from) * f;
            if (f < 1) fade = requestAnimationFrame(step);
            else if (done) done();
        };
        fade = requestAnimationFrame(step);
    }

    function play() {
        if (!audio) {
            audio = new Audio(SRC);
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = 0;
            audio.addEventListener('playing', () => { if (wanted) setState('playing'); });
            audio.addEventListener('waiting', () => { if (wanted) setState('waiting'); });
        }
        setState('waiting');
        audio.volume = 0;
        audio.play().then(() => fadeTo(VOLUME, FADE_IN_MS)).catch(() => {
            wanted = false;
            setState('off');
        });
    }

    function pause() {
        if (!audio) return;
        fadeTo(0, FADE_OUT_MS, () => { if (!wanted) audio.pause(); });
    }

    button.addEventListener('click', () => {
        wanted = !wanted;
        if (wanted) {
            play();
        } else {
            setState('off');
            pause();
        }
    });

    // Pause while the tab is hidden, and pick up again when the visitor comes back
    document.addEventListener('visibilitychange', () => {
        if (!wanted || !audio) return;
        if (document.hidden) pause();
        else play();
    });
})();
