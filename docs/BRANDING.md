# Branding

The neutral skin is the default. A brand is a directory under `branding/` that mirrors `skin/`; `scripts/apply-branding.sh <name>` copies it over `skin/`. Keep the `skin/` paths and the `fezadan` file and class names when you rebrand. Roundcube templates, the stylesheet name and existing deployment scripts reference them.

## Name and metadata

- `skin/meta.json`: `name` is the skin label Roundcube shows in settings, `author` and `license` describe the package.
- `skin/manifest.json`: `name`, `short_name`, `description`, `id` and the icon URLs.
- The product name on the login page and in the menu comes from Roundcube: set `$config['product_name']` in `config/config.inc.php`. Both templates render `<roundcube:object name="productname" />`.
- `skin/templates/includes/layout.html`: `apple-mobile-web-app-title` and the `?v=mail-skin-N` cache-busting query.
- `skin/pwa.js`: the console warning contains the product name used by the script.

## Logo and icons

`skin/images/logo.svg` is a 24x24 envelope drawn with strokes. It uses `currentColor`, so `skin/styles/fezadan.css` and `skin/watermark.html` can mask it with the surrounding text colour. Keep it a single flat mark; no background, gradients or shadows.

The raster set is generated from the same mark:

| File | Size | Notes |
| --- | --- | --- |
| `skin/images/icon-192.png` | 192x192 | PWA icon, purpose `any` |
| `skin/images/icon-512.png` | 512x512 | PWA icon, purpose `any` |
| `skin/images/icon-maskable-512.png` | 512x512 | purpose `maskable`, mark inside the central 80% |
| `skin/images/apple-touch-icon.png` | 180x180 | linked from `layout.html` |
| `skin/images/favicon.ico` | 16, 32, 48 px | PNG entries in an ICO container |

The default icons use a `#1f1f1f` tile and a light mark. Keep the tile if the logo is light, otherwise the icon disappears on light browser chrome. `manifest.json` and `layout.html` both carry the asset URLs.

## Login

`skin/templates/login.html` has no credit line. The original Fezadan page had an anchor with `class="fezadan-credit"` after the `plugin.fezadan_login_extra` hook; its styles remain in `fezadan.css` if you want to add one. The hooks `plugin.fezadan_captcha` and `plugin.fezadan_login_extra` are optional; they render nothing when their plugins are absent.

## Colours

Theme colours are custom properties in `skin/styles/fezadan.css`, inside `@media screen`. Light values sit in `:root`, dark values in `:root.dark-mode`. The ones most brands change:

| Variable | Role |
| --- | --- |
| `--fm-bg` | list and dialog surface |
| `--fm-side` | menu and sidebar |
| `--fm-content` | reading pane |
| `--fm-text` | primary text |
| `--fm-muted` | secondary text and icons |
| `--fm-border` | separators and outlines |
| `--fm-primary` | primary button background |
| `--fm-primary-text` | primary button text |
| `--fm-accent` | links |
| `--fm-selected` | selected row or tab |
| `--fm-focus` | focus ring |

Keep the contrast between text and surface readable in both themes. The logo and PNG icons carry their own colours and do not follow these variables.

## Overlays

`branding/fezadan/` mirrors `skin/` and contains only the branded files: `images/logo.png` (the original mark, renamed from `fezadan.png`), `images/logo.svg`, the original PNG icons and `favicon.ico`, `meta.json`, `manifest.json`, `templates/login.html`, `templates/includes/layout.html`, `watermark.html` and `pwa.js`.

The original stylesheet masks `images/fezadan.png`. The overlay's `images/logo.svg` wraps that PNG as an embedded data URI so the unchanged CSS mask keeps working after the overlay is applied. Its `watermark.html` points at `logo.png` directly. If you add another overlay, ship every file it changes; the apply script copies over the neutral tree and never merges.
