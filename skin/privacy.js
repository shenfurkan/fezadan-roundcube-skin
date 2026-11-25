// @ts-check
// Presentation only: Roundcube still sanitizes HTML and handles load-remote.
(() => {
    const banner = document.getElementById('remote-objects-message');
    const copy = document.getElementById('fezadan-remote-copy');
    if (!banner || !(copy instanceof HTMLTemplateElement)) return;

    const text = banner.querySelector(':scope > span:not(.boxbuttons)');
    const allow = banner.querySelector('a[href="#loadremote"]');
    if (text) {
        text.classList.add('fezadan-remote-copy');
        text.replaceChildren(copy.content.cloneNode(true));
    }
    if (allow) {
        allow.textContent = copy.dataset.allow || allow.textContent;
        allow.classList.add('btn', 'btn-secondary');
    }
    banner.setAttribute('role', 'status');
})();
