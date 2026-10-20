# ISAACS Family Office – Website

The single-page website for ISAACS Family Office ("A world of perspective"), served at [isaacs.group](https://isaacs.group).

The home page is a full-screen illustrated night scene with the ISAACS logo, the tagline and a link to the contact form, all in ivory.

The scene is subtly animated (see `assets/scene.js`):

- **Entrance:** fades up from black while the scene settles from a slight zoom, then the lettering appears in turn.
- **Depth:** gentle parallax that follows the mouse (or the tilt of a phone, where the browser allows it), and a very slow "breathing" zoom.
- **Living details:** city lights that glow steadily while single lights go dark, flare or flicker at random moments; blinking aircraft warning lights on the tallest towers; faint twinkling stars; rippling water; flickering firelight with heat haze; the desk lantern; steam from the coffee cup on the terrace; navigation lights on the space station; and divers' bubbles, light shafts, drifting particles and faded tropical fish swimming behind the divers in the aquarium.
- **Wildlife:** a family of monkeys in the palm crowns beside the Thai huts, looking around, scratching and swinging; an Arabian oryx slowly walking a loop on the dunes and stopping to graze (one lap takes about five minutes).
- **Après-ski party** (in the spirit of La Folie Douce), all moving to one 124 BPM beat: a DJ behind a booth with chasing LEDs, silhouetted against the chalet window; a dancer in a red bobble hat with a champagne bottle that sprays every so often; a second dancer with a drink; people in the painted crowd slowly raising a hand; festoon lights chasing along a string; searchlights sweeping the sky; and coloured light pumping on the snow.
- **Occasional moments:** the après-ski fire pit glows and throws up embers; porch lights on the Thai huts switch on and off; the lanterns on the backpackers' bridge gutter now and then; the sailboat sends out small ripples and its bilge pump runs from time to time; a gecko climbs the stone wall at the far left edge about once a minute (on narrower screens that wall is cropped off, so it has to be found by swiping or on a wide screen), starting a few seconds after the page opens; and a distant plane crosses the sky every couple of minutes.

The occasional moments run on random timers. There are enough of them that something small is always changing somewhere, but never everything at once.

On touch screens, visitors can **swipe to explore** the whole picture (left and right on phones held upright, and up and down too when held sideways). The logo, tagline and buttons stay fixed while the scene slides underneath. On first visit the view drifts once to hint that there is more to see, and when a visitor turns the music on it takes one slow tour (centre, left, right, back to centre). Touching the screen stops the tour.

**The Halloween switch:** the left rocker on the small two-switch plate set into the front face of the desk, just right of the man’s chair (a thin orange LED strip lights beneath it when on). As a safeguard it only works while the light switch on the column is on. Pressing it glows orange and, over 2 seconds, fades the picture to the painted Halloween version (`assets/background-halloween.jpg`), which is only downloaded once the light switch is turned on. On top of it: the moon shimmers, a witch on a broomstick crosses it now and then, swarms of bats gather and wheel around, distant lightning flickers, thick mist drifts through the air in banks with ground fog creeping across the terrace and floor, fog moves on the water, a shark glides through the back of the aquarium past a skeleton on the seabed, the pumpkins and fires flicker and light catches the cobwebs. Pressing it again fades back over 2 seconds.

**The weather switch:** the small inline switch on the desk lamp’s cord, on the desk top at the left. Clicking it starts a drizzle at once, which builds to a downpour within about 10 seconds (rain falls at three depths across the landscape, with mist in the distance and rings on the water), then eases off; the desert turns gently green with grass and flowers. It stays like that until the switch is clicked off, then fades back to normal. Birds also fly past now and then at all times, more often after the rain.

**The Christmas button:** a small flush button with a dark bronze bezel and a deep red enamel centre, set into the front face of the desk, just right of the man’s chair, next to the orange Halloween button. Pressing it fades the picture to the painted Christmas version (`assets/background-christmas.jpg`, downloaded only once the light switch is on), with snow falling at three depths, the fairy lights twinkling, snowballs splatting on the window glass and slowly sliding away, and Santa’s sleigh and reindeer crossing the sky with Rudolph’s nose glowing. Pressing it again fades back.

**Scene rules:** the Halloween button, the weather switch and the Christmas button all only work while the light switch is on. Only one scene runs at a time: starting one stops any other, and turning the light switch off stops them all. The buttons themselves always stay in place and show whether their scene is on.

**Easter eggs:** these only work once the small light switch on the black column in front of the desk has been clicked or tapped on (a thin blue LED lights up). It is off every time the page loads. Then resting the pointer on certain people and objects for about a second (or tapping them on touch screens) fades in a small note with a word from *The Dictionary of Obscure Sorrows*: the whisky glass (Sonder), backpacker (Onism), the après-ski dancer (Avenoir), the child diver (Patroagon), the woman on the terrace (Symphoric), the NPD post-it (Liberosis), the fireplace (Chrysalism), the tall triangular tower (Anecdoche), the satellite (Ellipsism), the gecko (Exulansis) and any of the cricketers (Anemoia). The man at the desk shows Suerza. The targets are deliberately small. The words and hotspots are in the `EGGS` list in `assets/scene.js`.

Visitors who have "reduce motion" turned on in their device settings see the still image only.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The page, its styles and the contact form script. |
| `assets/scene.js` | The scene animation: layout, parallax and the canvas effects. |
| `assets/sound.js` | The sound toggle and background music. |
| `assets/scene-patches.png` | Small pieces of the earlier painting: the centre hut lights (switched on and off by the animation) and the bare rock used to mute the two climbers. Must be regenerated if those parts of the painting change. |
| `assets/laptop-screen.jpg` | The Medik8 home page (Crystal Retinal slide), pre-muted, shown on the terrace laptop. |
| `assets/background-night.jpg` | Full-screen background. |
| `assets/background-christmas.jpg` | The painted Christmas version of the background, pixel-aligned with it. |
| `assets/background-halloween.jpg` | The painted Halloween version of the background, pixel-aligned with it. |
| `assets/typography/` | Ivory lettering as transparent PNGs: wordmark, "family office" and contact. The tagline "A World of Perspective" is live text instead, set in Source Sans 3 ExtraLight (the supplied artwork's typeface at a lighter weight, to match the wordmark). |
| `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-512.png` | Site icons: the A from the ISAACS wordmark in ivory on navy. |
| `logo.png` | Old yellow logo mark. Not used by the current site. |
| `CNAME` | Custom domain for GitHub Pages (`isaacs.group`). |
| `server.js` | Small Node.js static server for local preview only. |

### Brand colours

- Ivory `#E2D8C9` – all lettering
- Navy `#132038` – contact form panel (with the ISAACS wordmark)

These are set as `--espresso` and `--ivory` at the top of the CSS in `index.html`.

### Updating images

The originals are 1672×941 PNGs. The background is saved as JPEG (quality 88) to keep the page fast to load (about 0.4 MB instead of 2.5 MB). The wordmark is trimmed to its content and resized to 1200px wide. Its ivory version was made by recolouring the espresso original, because the source files only include an espresso wordmark. If you replace an image, keep the same file name. The day background and the espresso lettering were removed with the day/night toggle; they're still in the git history if you need them.

**If the background picture changes, the effects in `assets/scene.js` must be re-mapped.** Every effect is placed using pixel coordinates in the 1672×941 image: the city light and star positions (detected from the image's brightest lights and darkest sky), and the outlines or positions of the water, flames, aquarium, divers, coffee cup, après-ski fire and party, hut lights, bridge lanterns, sailboat, monkeys, divers, oryx loop, laptop screen corners and the gecko's route.

## Running locally

Install Node.js, then run:

```sh
node server.js
```

Open http://localhost:8000. The contact form needs the page to be served over http(s), so don't open `index.html` directly from disk.

## Music

The **Sound** toggle (bottom right) plays "Space Waves" by Ben Elson through a hidden YouTube player (video `VYkSgmw81TQ`, loaded from youtube-nocookie.com only when the visitor first turns sound on). Sound always starts off, because browsers block audio until the visitor clicks. The player starts muted and only fades the volume up once the track itself is playing, so a YouTube advert is never heard. To change the track, edit `VIDEO_ID` in `assets/sound.js`.

Note: YouTube's terms don't allow hiding the player for audio-only use, and a commercial track on a business site normally needs a licence. If YouTube blocks the embed, the toggle shows "Sound unavailable". A royalty-free fallback is "Outer Space Loop" (CC0): https://opengameart.org/content/outer-space-loop

## Laptop screen

The laptop on the terrace desk shows a screenshot of the medik8.com home page on its Crystal Retinal slide ("Gift An Icon"). It was captured on 18 October 2026, so it won't update when Medik8 changes their site. The image is darkened, desaturated and slightly softened so it sits naturally in the scene. To refresh it, replace `assets/laptop-screen.jpg` with a new 384×202 image.

## Contact form

The **Contact** link opens a form addressed to Helen Molyneux, Executive Assistant to the Principal. It posts to [Formspree](https://formspree.io) (endpoint `https://formspree.io/f/xnpjrnja`, set on the `<form>` tag's `action` attribute in `index.html`). Messages arrive at hello@isaacs.group. The form shows a confirmation or error message without leaving the page.

## Deployment

The site is hosted on GitHub Pages from the `main` branch, at the custom domain in `CNAME`. Pushing to `main` publishes the changes.
