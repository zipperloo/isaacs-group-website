# ISAACS Family Office – Website

The single-page website for ISAACS Family Office ("A world of perspective"), served at [isaacs.group](https://isaacs.group).

The home page is a full-screen illustrated night scene with the ISAACS logo, the tagline and a link to the contact form, all in ivory.

The scene is subtly animated (see `assets/scene.js`):

- **Entrance:** fades up from black while the scene settles from a slight zoom, then the lettering appears in turn.
- **Depth:** gentle parallax that follows the mouse (or the tilt of a phone, where the browser allows it), and a very slow "breathing" zoom.
- **Living details:** city lights that glow steadily while single lights go dark, flare or flicker at random moments; blinking aircraft warning lights on the tallest towers; faint twinkling stars; rippling water; flickering firelight with heat haze; the desk lantern; steam from the coffee cup on the terrace; navigation lights on the space station; and divers' bubbles, light shafts and drifting particles in the aquarium.
- **Occasional moments:** the après-ski fire pit glows and throws up embers; porch lights on the Thai huts switch on and off; the lanterns on the backpackers' bridge gutter now and then; the sailboat sends out small ripples and its bilge pump runs from time to time; a gecko climbs the stone wall at the far left edge every minute or two; and a distant plane crosses the sky every couple of minutes.

The occasional moments run on random timers, so the scene looks a little different each time.

Visitors who have "reduce motion" turned on in their device settings see the still image only.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The page, its styles and the contact form script. |
| `assets/scene.js` | The scene animation: layout, parallax and the canvas effects. |
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

**If the background picture changes, the effects in `assets/scene.js` must be re-mapped.** Every effect is placed using pixel coordinates in the 1672×941 image: the city light and star positions (detected from the image's brightest lights and darkest sky), and the outlines or positions of the water, flames, aquarium, divers, coffee cup, après-ski fire, hut lights, bridge lanterns, sailboat and the gecko's route.

## Running locally

Install Node.js, then run:

```sh
node server.js
```

Open http://localhost:8000. The contact form needs the page to be served over http(s), so don't open `index.html` directly from disk.

## Contact form

The **Contact** link opens a form addressed to Helen, Executive Assistant to the Family Office. It posts to [Formspree](https://formspree.io) (endpoint `https://formspree.io/f/mldqppyg`, set on the `<form>` tag's `action` attribute in `index.html`). Messages arrive at the email address linked to that Formspree form. The form shows a confirmation or error message without leaving the page.

## Deployment

The site is hosted on GitHub Pages from the `main` branch, at the custom domain in `CNAME`. Pushing to `main` publishes the changes.
