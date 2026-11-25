# Mail skin for Roundcube

An Elastic child skin for Roundcube 1.7.4. Dark is the default; Elastic's light/dark switch and `colorMode` cookie keep working.

Roundcube still owns mail, contacts, settings, the password plugin, dialogs and responsive navigation. The skin overrides the layout include, task menu, pagination, login and the empty preview. Three small React islands (`@mui/material`) draw the reading-pane actions, the compose send button and the wide-screen content toolbar; they call the native Roundcube commands. Their source is `ui-src/main.tsx`, compiled to `skin/material.js`.

The default branding is neutral: the product name is "Mail" and the logo is a simple envelope. The Fezadan overlay in `branding/fezadan/` restores the original brand. The skin directory, stylesheet and CSS classes keep the `fezadan` names so existing deployment tooling and templates continue to work.

## Requirements

- Roundcube 1.7.4 with the `elastic` skin installed. This skin extends Elastic and does not patch its files.
- PHP 8.0 or newer for `skin/inbox.php`. Templates, CSS and JavaScript need nothing else.
- Node.js only for development. The compiled `skin/material.js` is committed, so the mail server does not run npm.

## Install

Copy the runtime skin into Roundcube:

```bash
cp -R skin /path/to/roundcube/skins/fezadan
```

Then enable it in `config/config.inc.php`:

```php
$config['skin'] = 'fezadan';
```

Optional settings:

```php
$config['product_name'] = 'Mail';
$config['blankpage_url'] = 'skins/fezadan/watermark.html';
```

`blankpage_url` uses the skin's empty reading-pane frame. Without it Roundcube shows the Elastic blank page.

## Branding

The neutral default ships a plain envelope logo and the name "Mail". To apply the Fezadan brand:

```bash
scripts/apply-branding.sh fezadan
```

The script copies `branding/fezadan/` over `skin/`. That overlay replaces the logo and icons, `meta.json`, `manifest.json`, login, layout, watermark and `pwa.js`. `docs/BRANDING.md` lists the files, icon sizes and CSS variables, and explains how to add another overlay.

## Optional plugins

`fezadan_litecaptcha` and `fezadan_vault` are not part of this repository. Without them the native login, one account and the mail UI work; the captcha field, account switcher and PWA worker endpoint are unavailable. `docs/OPTIONAL-PLUGINS.md` covers the details and how to remove the optional script tags.

## Development

```bash
npm install
npm run build      # ui-src/main.tsx -> skin/material.js
npm run typecheck  # TypeScript for the React source, JS check for skin/
```

Commit the rebuilt `skin/material.js` with source changes. Bump the `?v=mail-skin-N` query in `skin/templates/includes/layout.html` and the icon URLs in `skin/manifest.json` when a browser asset changes.

## License

CC BY-SA 3.0. The skin is a derivative of Roundcube Elastic, copyright The Roundcube Dev Team / Aleksander Machniak. The adapted Skiff UI icons are MIT (`skin/LICENSE.skiff`). Inter is under the SIL Open Font License (`skin/fonts/OFL.txt`). See `LICENSE` and `NOTICE`.
