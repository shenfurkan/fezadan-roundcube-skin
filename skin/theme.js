// @ts-check
// Set the default before Elastic initializes. Explicit light/dark choices survive.
(() => {
    const root = document.documentElement;
    let dark = true;
    try {
        const preference = document.cookie.match(/(?:^|;\s*)colorMode=(dark|light)(?:;|$)/);
        dark = !preference || preference[1] === 'dark';
        if (!preference) {
            document.cookie = 'colorMode=dark; Path=/; SameSite=Lax'
                + (location.protocol === 'https:' ? '; Secure' : '');
        }
    } catch (_) {
        // Browsers denying cookies can still render the default dark surface.
    }
    root.classList.toggle('dark-mode', dark);

    const updateChrome = () => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', root.classList.contains('dark-mode') ? '#1f1f1f' : '#ffffff');
        }
    };
    updateChrome();
    new MutationObserver(updateChrome).observe(root, { attributes: true, attributeFilter: ['class'] });
})();
