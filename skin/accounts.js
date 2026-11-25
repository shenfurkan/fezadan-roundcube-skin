// @ts-check
// Add-account dialog. The real login page (CAPTCHA, request token, per-slot
// session) runs inside a same-origin iframe so every flow stays server-driven;
// cancel clicks the login page's own cancel form and follows it back.
(() => {
    /** @type {HTMLElement | null} */
    let modal = null;
    /** @type {HTMLIFrameElement | null} */
    let frame = null;
    /** @type {HTMLButtonElement | null} */
    let closeButton = null;

    const close = () => {
        // Delegate to the login page's cancel form: it resets the slot cookie
        // server-side and the frame lands on the mailbox. instanceof cannot be
        // used: the frame's elements belong to another JavaScript realm.
        const doc = frame?.contentDocument;
        const cancel = doc ? /** @type {HTMLButtonElement | null} */ (doc.querySelector('form.fezadan-login-cancel button')) : null;
        if (cancel) {
            cancel.click();
        }
        // Frame not ready yet: the dialog stays open; its own cancel button
        // appears once the login page has loaded.
    };

    /** @param {KeyboardEvent} event */
    const onKeydown = (event) => {
        if (event.key === 'Escape' && modal) {
            close();
        }
    };

    const onFrameLoad = () => {
        if (!frame || !frame.contentWindow) {
            return;
        }
        if (closeButton) {
            closeButton.disabled = false;
        }
        // Key events inside the frame never reach this document, so Escape
        // must also be heard in each document the frame loads.
        frame.contentDocument?.addEventListener('keydown', onKeydown);
        try {
            const url = new URL(frame.contentWindow.location.href);
            if (url.searchParams.get('_task') === 'mail' && modal) {
                // Signed in (or cancelled): follow the frame with the window.
                window.location.href = frame.contentWindow.location.href;
            }
        } catch (_) {
            // Not same-origin; ignore.
        }
    };

    /**
     * @param {HTMLFormElement} form the add-account form that was submitted
     */
    const open = (form) => {
        if (modal) {
            return;
        }
        const title = (form.querySelector('.fezadan-account-add')?.textContent || '')
            .replace(/^\s*\+\s*/, '').trim() || 'Add account';

        const backdrop = document.createElement('div');
        backdrop.className = 'fezadan-modal-backdrop';
        const dialog = document.createElement('div');
        dialog.className = 'fezadan-modal';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', title);

        const header = document.createElement('div');
        header.className = 'fezadan-modal-header';
        const heading = document.createElement('h2');
        heading.textContent = title;
        closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'fezadan-modal-close';
        closeButton.textContent = '\u00d7';
        closeButton.setAttribute('aria-label', title ? `Close ${title}` : 'Close');
        closeButton.disabled = true;
        closeButton.addEventListener('click', close);
        header.append(heading, closeButton);

        frame = document.createElement('iframe');
        frame.className = 'fezadan-modal-frame';
        frame.title = title;
        frame.addEventListener('load', onFrameLoad);
        frame.src = './?_task=login&_fezadan_embed=1';

        dialog.append(header, frame);
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);
        modal = backdrop;
        closeButton.focus();
    };

    document.addEventListener('submit', (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || !form.classList.contains('fezadan-account-add-form') || modal) {
            return;
        }
        event.preventDefault();
        const data = new FormData(form);
        data.set('_fezadan_modal', '1');
        fetch(form.action, { method: 'POST', body: data, credentials: 'same-origin' })
            .then((response) => response.json())
            .then(() => open(form))
            .catch(() => form.submit()); // No-dialog path stays available on failure.
    });

    document.addEventListener('keydown', onKeydown);
})();
