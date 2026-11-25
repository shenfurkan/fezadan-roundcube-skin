// @ts-check
// The watermark is a static, same-origin document, not a Roundcube template.
(() => {
    let cookies = '';
    try { cookies = document.cookie; } catch (_) {}
    const root = document.documentElement;
    const parentRoot = window.frameElement ? window.parent.document.documentElement : null;
    const syncTheme = () => root.classList.toggle('dark-mode', parentRoot
        ? parentRoot.classList.contains('dark-mode')
        : !/(?:^|;\s*)colorMode=light(?:;|$)/.test(cookies));
    syncTheme();
    if (parentRoot) {
        const observer = new MutationObserver(syncTheme);
        observer.observe(parentRoot, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
    }
    const frameId = window.frameElement?.id;
    const context = frameId === 'contact-frame' ? 'contacts'
        : frameId === 'preferences-frame' ? 'settings' : 'mail';
    // The mail UI is English-only, like the rest of the interface.
    const labels = { mail: 'Select a message to read', contacts: 'Select a contact', settings: 'Select a setting' };
    root.lang = 'en';
    document.addEventListener('DOMContentLoaded', () => {
        document.body.dataset.context = context;
        const label = document.getElementById('empty-label');
        if (label) label.textContent = labels[context];
    }, { once: true });
})();
