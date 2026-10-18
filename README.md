# ISAACS Family Office – Website

The single-page website for ISAACS Family Office ("A world of perspective"), served at [isaacs.group](https://isaacs.group).

The home page is a full-screen illustrated scene with the ISAACS logo, a tagline, a contact form and a **Day / Night** toggle. The toggle crossfades between the day and night backgrounds and swaps all the lettering between espresso (day) and ivory (night). The site remembers the visitor's last choice and starts in night mode the first time.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole site. HTML, CSS and JavaScript are all inline. |
| `assets/background-day.jpg`, `assets/background-night.jpg` | Full-screen backgrounds. The two images are aligned so they crossfade cleanly. |
| `assets/typography/` | Lettering as transparent PNGs, each in an `-ivory` (night) and `-espresso` (day) version: wordmark, "family office", tagline, contact, day, night and domain. |
| `favicon.ico` | Browser tab icon. |
| `logo.png` | Old yellow logo mark. Not used by the current site. |
| `CNAME` | Custom domain for GitHub Pages (`isaacs.group`). |
| `server.js` | Small Node.js static server for local preview only. |

### Brand colours

- Espresso `#4B382D` – lettering on the day background
- Ivory `#E2D8C9` – lettering on the night background

These are set as `--espresso` and `--ivory` at the top of the CSS in `index.html`.

### Updating images

The originals are 1672×941 PNGs. The backgrounds are saved as JPEG (quality 88) to keep the page fast to load (about 0.9 MB for both, instead of 5 MB). The wordmark is trimmed to its content and resized to 1200px wide. Its ivory version was made by recolouring the espresso original, because the source files only include an espresso wordmark. If you replace an image, keep the same file name, and give the day and night backgrounds the same size and framing.

## Running locally

Install Node.js, then run:

```sh
node server.js
```

Open http://localhost:8000. The contact form needs the page to be served over http(s), so don't open `index.html` directly from disk.

## Contact form

The **Contact** link opens a form that posts to [Formspree](https://formspree.io) (endpoint `https://formspree.io/f/mldqppyg`, set on the `<form>` tag's `action` attribute in `index.html`). Messages arrive at the email address linked to that Formspree form. The form shows a confirmation or error message without leaving the page.

## Deployment

The site is hosted on GitHub Pages from the `main` branch, at the custom domain in `CNAME`. Pushing to `main` publishes the changes.
