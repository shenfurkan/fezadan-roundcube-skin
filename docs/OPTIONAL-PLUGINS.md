# Optional plugins

The skin runs on its own. Two plugins from the private Fezadan deployment are not included.

## fezadan_litecaptcha

Not included. It adds the login verification field and the server-side LiteCaptcha check.

Without it:

- Native Roundcube username/password login works, and one account works normally.
- The `<roundcube:object name="plugin.fezadan_captcha" />` hook renders nothing. `skin/captcha.js` returns early, so the password field and submit button stay enabled. The script disables them only when the plugin's `#fezadan-captcha` markup is present.
- The account switcher from `plugin.fezadan_login_extra` is missing. `accounts.js` finds no account rows and stops.
- `skin/pwa.js` registers the worker at `/index.php?_task=login&_action=plugin.fezadan-worker`. Without the plugin that URL returns 404; the script catches the rejection and logs a console warning. The mail UI is unaffected.
- `skin/inbox.php` is a read-only listing helper, but the plugin is what hooks it into message listing. Without the plugin no snippets appear; `inbox.js` still adds its row actions.

To remove the captcha integration, delete the two object hooks from `skin/templates/login.html`:

```html
<roundcube:object name="plugin.fezadan_captcha" />
<roundcube:object name="plugin.fezadan_login_extra" />
```

and the login block from `skin/templates/includes/layout.html`:

```html
<roundcube:if condition="env:task == 'login'" />
<script src="/captcha.js" defer></script>
</roundcube:if>
```

`captcha.js` is harmless without the plugin; removing it only saves one request.

## fezadan_vault

A retired stub. The mail client does not use it, and nothing needs to be installed or removed.

## Optional scripts

`skin/templates/includes/layout.html` loads three more integration scripts. Each `<script>` sits in its own `<roundcube:if>` block; delete the tag and its wrapper if you do not want the feature.

- `/pwa.js`: registers the service worker for standalone installation. Safe to remove; the manifest and icons are independent.
- `/accounts.js`: the multi-account switcher and its dialog. Without it the sidebar shows the active mailbox and no switcher.
- `/inbox.js`: row actions and the snippet presentation for the message list. Without it the list falls back to Elastic's native rows. With no listing plugin, snippets are simply absent.

`skin/sw.js` belongs to the PWA path. It only serves a no-store network fetch for top-level navigation and never caches mail, attachments or credentials. It does nothing unless `pwa.js` registers it.
