// @ts-check
// Progressive disclosure only. Roundcube owns recipients, drafts, attachments
// and sending; keep its original nodes, IDs, listeners and form values.
(() => {
    const mail = /** @type {Window & {rcmail?: {env: {compose_mode?: string}, addEventListener: (name: string, callback: () => void) => void}}} */ (window).rcmail;
    if (!mail) return;
    mail.addEventListener('init', () => queueMicrotask(() => {
        const copy = document.getElementById('fezadan-compose-copy');
        const form = document.querySelector('#compose-content > form');
        if (!copy || !form) return;

        const heading = document.createElement('h2');
        heading.className = 'fezadan-compose-heading';
        const mode = mail.env.compose_mode;
        heading.textContent = (mode === 'reply' ? copy.dataset.reply : mode === 'forward' ? copy.dataset.forward
            : mode === 'draft' || mode === 'edit' ? copy.dataset.edit : copy.dataset.heading) || '';
        form.prepend(heading);
        const headerTitle = document.querySelector('#layout-content > .header > .header-title');
        if (headerTitle) headerTitle.textContent = heading.textContent;

        /** @param {Element | null} node @param {string | undefined} title @param {string} className */
        const disclose = (node, title, className) => {
            if (!node || !node.parentElement) return null;
            const details = document.createElement('details');
            details.className = className;
            const summary = document.createElement('summary');
            summary.textContent = title || '';
            node.before(details);
            details.append(summary, node);
            return details;
        };
        disclose(document.getElementById('compose-options'), copy.dataset.options, 'fezadan-compose-options');

        // Elastic has already turned the toolbar into its responsive native menu.
        // Move only secondary actions; save/attach/send remain where Elastic put them.
        const extras = [...document.querySelectorAll('#toolbar-menu > li')].filter(item =>
            item.querySelector('a.signature, a.responses, a.spellcheck, a.encrypt'));
        if (extras.length) {
            const list = document.createElement('ul');
            list.className = 'menu listing iconized';
            form.querySelector('#composebodycontainer')?.before(list);
            list.append(...extras);
            disclose(list, copy.dataset.tools, 'fezadan-compose-tools');
        }
        document.querySelectorAll('a.draft span.inner').forEach(label => {
            label.textContent = copy.dataset.draft || label.textContent;
        });
        const recipients = document.querySelector('#compose_to a[data-popup="headers-menu"]');
        if (recipients) {
            recipients.classList.add('fezadan-recipient-options');
            recipients.setAttribute('title', copy.dataset.recipients || 'Cc / Bcc');
            const label = document.createElement('span');
            label.textContent = copy.dataset.recipients || 'Cc / Bcc';
            recipients.append(label);
        }
    }));
})();
