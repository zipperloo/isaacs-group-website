/*
 * Background music: "Space Waves" (Ben Elson), played through a hidden YouTube player.
 *
 * Sound is off until the visitor turns it on (browsers block audio without a click).
 * The player starts muted and stays silent until the track itself is playing, so any
 * YouTube advert that runs first is never heard. Then the volume fades up.
 */
(() => {
    const VIDEO_ID = 'VYkSgmw81TQ';
    const VOLUME = 60;          // 0-100
    const FADE_IN_MS = 3000;
    const FADE_OUT_MS = 800;

    const button = document.getElementById('sound-toggle');
    const label = document.getElementById('sound-label');

    let player = null;
    let apiRequested = false;
    let wanted = false;         // what the visitor has asked for
    let audible = false;        // whether the track is currently unmuted
    let poll = 0;
    let fade = 0;

    function setState(state) {
        button.dataset.state = state;
        button.setAttribute('aria-pressed', String(state !== 'off'));
        label.textContent = state === 'off' ? 'Sound off' : 'Sound on';
    }

    function loadApi() {
        if (apiRequested) return;
        apiRequested = true;
        window.onYouTubeIframeAPIReady = createPlayer;
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
    }

    function createPlayer() {
        player = new YT.Player('yt-player', {
            host: 'https://www.youtube-nocookie.com',
            videoId: VIDEO_ID,
            width: 200,
            height: 200,
            playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, loop: 1, playlist: VIDEO_ID, playsinline: 1, rel: 0 },
            events: {
                onReady: () => { if (wanted) start(); },
                onStateChange: e => {
                    if (e.data === YT.PlayerState.ENDED && wanted) {
                        player.seekTo(0);
                        player.playVideo();
                    }
                },
                onError: () => {
                    wanted = false;
                    setState('off');
                    label.textContent = 'Sound unavailable';
                    button.disabled = true;
                }
            }
        });
    }

    // Play muted, and only unmute once the track itself is running. During a YouTube
    // advert the track's own playback time stays at zero, so time moving forward on
    // the track means any advert is over.
    function start() {
        clearInterval(poll);
        player.mute();
        player.setVolume(0);
        player.playVideo();
        let lastTime = -1;
        poll = setInterval(() => {
            if (!wanted) { clearInterval(poll); return; }
            const playing = player.getPlayerState() === YT.PlayerState.PLAYING;
            const time = player.getCurrentTime();
            if (playing && player.getDuration() > 0 && time > 0.3 && lastTime >= 0 && time > lastTime) {
                clearInterval(poll);
                fadeIn();
            }
            lastTime = time;
        }, 400);
    }

    function fadeTo(target, ms, done) {
        cancelAnimationFrame(fade);
        const from = player.getVolume();
        const t0 = performance.now();
        const step = now => {
            const f = Math.min(1, (now - t0) / ms);
            player.setVolume(Math.round(from + (target - from) * f));
            if (f < 1) fade = requestAnimationFrame(step);
            else if (done) done();
        };
        fade = requestAnimationFrame(step);
    }

    function fadeIn() {
        player.setVolume(0);
        player.unMute();
        audible = true;
        setState('playing');
        dispatchEvent(new Event('isaacs:music'));   // the scene takes a tour when the music starts
        fadeTo(VOLUME, FADE_IN_MS);
    }

    function stop() {
        clearInterval(poll);
        if (!player || !player.pauseVideo) return;
        if (audible) {
            fadeTo(0, FADE_OUT_MS, () => { if (!wanted) player.pauseVideo(); });
        } else {
            player.pauseVideo();
        }
        audible = false;
    }

    button.addEventListener('click', () => {
        wanted = !wanted;
        if (wanted) {
            setState('waiting');
            if (player && player.playVideo) start();
            else loadApi();
        } else {
            setState('off');
            stop();
        }
    });

    // Pause while the tab is hidden, and pick up again when the visitor comes back
    document.addEventListener('visibilitychange', () => {
        if (!wanted || !player || !player.playVideo) return;
        if (document.hidden) {
            stop();
        } else {
            setState('waiting');
            start();
        }
    });
})();
