# ISAACS Family Office – Website

The single-page website for ISAACS Family Office ("A world of perspective"), served at [isaacs.group](https://isaacs.group).

The home page is a full-screen illustrated night scene with the ISAACS logo, the tagline and a link to the contact form, all in ivory.

The scene is subtly animated (see `assets/scene.js`):

- **Entrance:** fades up from black while the scene settles from a slight zoom, then the lettering appears in turn.
- **Depth:** gentle parallax that follows the mouse (or the tilt of a phone, where the browser allows it), and a very slow "breathing" zoom.
- **Living details:** city lights that glow steadily while single lights go dark, flare or flicker at random moments; blinking aircraft warning lights on the tallest towers; faint twinkling stars; rippling water; flickering firelight with heat haze; the desk lantern; steam from the coffee cup on the terrace; navigation lights on the space station; and divers' bubbles, light shafts, drifting particles and faded tropical fish swimming behind the divers in the aquarium.
- **Wildlife:** a family of monkeys in the palm crowns beside the Thai huts, looking around, scratching and swinging; an Arabian oryx slowly walking a loop on the dunes and stopping to graze (one lap takes about five minutes).
- **Après-ski party** (in the spirit of La Folie Douce), all moving to one 124 BPM beat: a DJ behind a booth with chasing LEDs, silhouetted against the chalet window; a dancer in a red bobble hat with a champagne bottle that sprays every so often; a second dancer with a drink; people in the painted crowd slowly raising a hand; festoon lights chasing along a string; searchlights sweeping the sky; and coloured light pumping on the snow.
- **Occasional moments:** the après-ski fire pit glows and throws up embers; porch lights on the Thai huts switch on and off; the lanterns on the backpackers' bridge gutter now and then; the sailboat sends out small ripples and its bilge pump runs from time to time; a gecko climbs the stone wall at the far left edge every minute or so (only on screens wide enough to show that wall, such as 16:9 monitors); and a distant plane crosses the sky every couple of minutes.

The occasional moments run on random timers. There are enough of them that something small is always changing somewhere, but never everything at once.

Visitors who have "reduce motion" turned on in their device settings see the still image only.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The page, its styles and the contact form script. |
| `assets/scene.js` | The scene animation: layout, parallax and the canvas effects. |
| `assets/sound.js` | The sound toggle and background music. |
| `assets/audio/ambient.mp3` | Background music (see Music below). |
| `assets/laptop-screen.jpg` | The Medik8 home page (Crystal Retinal slide), pre-muted, shown on the terrace laptop. |
| `assets/background-night.jpg` | Full-screen background. |
| `assets/typography/` | Ivory lettering as transparent PNGs: wordmark, "family office" and contact. The tagline "A World of Perspective" is live text instead, set in Source Sans 3 ExtraLight (the supplied artwork's typeface at a lighter weight, to match the wordmark). |
| `favicon.ico` | Browser tab icon. |
| `logo.png` | Old yellow logo mark. Not used by the current site. |
| `CNAME` | Custom domain for GitHub Pages (`isaacs.group`). |
| `server.js` | Small Node.js static server for local preview only. |

### Brand colours

- Ivory `#E2D8C9` – all lettering
- Espresso `#4B382D` – contact form panel

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

The **Sound** toggle (bottom right) plays "Exploration Theme" by Cleyton Kauffman, an ambient synth and piano track that loops seamlessly. It is released under CC0 (public domain), so no licence fee or credit is needed, though credit is appreciated: *Music by Cleyton Kauffman – https://soundcloud.com/cleytonkauffman*. Source: https://opengameart.org/content/exploration-theme

The file is hosted on the site and only downloads when a visitor first turns sound on. Sound always starts off, because browsers block audio until the visitor clicks. To change the track, replace `assets/audio/ambient.mp3`, keeping the same name.

## Laptop screen

The laptop on the terrace desk shows a screenshot of the medik8.com home page on its Crystal Retinal slide ("Gift An Icon"). It was captured on 18 October 2026, so it won't update when Medik8 changes their site. The image is darkened, desaturated and slightly softened so it sits naturally in the scene. To refresh it, replace `assets/laptop-screen.jpg` with a new 320×167 image.

## Contact form

The **Contact** link opens a form addressed to Helen, Executive Assistant to the Family Office. It posts to [Formspree](https://formspree.io) (endpoint `https://formspree.io/f/mldqppyg`, set on the `<form>` tag's `action` attribute in `index.html`). Messages arrive at the email address linked to that Formspree form. The form shows a confirmation or error message without leaving the page.

## Deployment

The site is hosted on GitHub Pages from the `main` branch, at the custom domain in `CNAME`. Pushing to `main` publishes the changes.
