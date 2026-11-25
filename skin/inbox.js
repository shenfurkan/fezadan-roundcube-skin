// @ts-check
// Native commands and DOM nodes only. Never cache message text or inject HTML.
(() => {
    /** @typedef {{action?: string, uid?: string, mailbox?: string, msglist_layout?: string, archive_folder?: string}} MailEnv */
    /** @typedef {{env: MailEnv, addEventListener: (name: string, callback: (...args: any[]) => void) => void, add_message_row: (...args: any[]) => unknown, html_identifier: (value: string, encode: boolean) => string, command: (name: string, props?: unknown, element?: HTMLElement) => unknown, gettext: (name: string) => string, commands: Record<string, boolean>, mark_message: (flag: string, uid?: string) => unknown, delete_messages: (event: Event | null, uid?: string) => unknown, selection_post_data: (data?: Record<string, unknown>) => Record<string, unknown>, with_selected_messages: (command: string, post_data?: unknown, lock?: unknown, action?: string) => unknown, show_contentframe: (show: boolean) => unknown}} Mail */
    const mail = /** @type {Window & {rcmail?: Mail}} */ (window).rcmail;
    if (!mail) return;

    /** @param {string} name @param {string} fallback */
    const label = (name, fallback) => mail.gettext(name) || fallback;

    /**
     * @param {HTMLElement} parent
     * @param {string} className
     * @param {string} actionLabel
     * @param {() => void} run
     */
    const addAction = (parent, className, actionLabel, run) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fezadan-row-action ' + className;
        button.title = actionLabel;
        button.setAttribute('aria-label', actionLabel);
        button.tabIndex = -1;
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            run();
        });
        parent.append(button);
    };

    /** @param {string} uid @returns {HTMLElement} */
    const rowActions = uid => {
        const actions = document.createElement('span');
        actions.className = 'fezadan-row-actions skip-on-drag';
        actions.setAttribute('role', 'group');
        actions.setAttribute('aria-label', 'Message actions');
        // A row is selectable on mousedown; an action must not also select or
        // open it, and Space/Enter on a button must not reach the list handler.
        actions.addEventListener('mousedown', event => event.stopPropagation());
        actions.addEventListener('keydown', event => event.stopPropagation());

        if (mail.env.archive_folder) {
            addAction(actions, 'act-archive', 'Archive', () => {
                const post_data = mail.selection_post_data({ _uid: uid });
                if (!post_data._uid) return;
                mail.with_selected_messages('move', post_data, null, 'plugin.move2archive');
                if (mail.env.uid && String(mail.env.uid) === uid) mail.show_contentframe(false);
            });
        }

        /**
         * One slot holds both states of a toggle, so the group never grows when
         * a message is read, flagged or deleted.
         * @param {[string, string, string, string]} on
         * @param {[string, string, string, string]} off
         */
        const slot = (on, off) => {
            const wrapper = document.createElement('span');
            wrapper.className = 'fezadan-row-action-slot';
            for (const [className, name, fallback, flag] of [on, off]) {
                addAction(wrapper, className, label(name, fallback), () => mail.mark_message(flag, uid));
            }
            actions.append(wrapper);
        };

        slot(['act-read', 'markasread', 'Mark as read', 'read'], ['act-unread', 'markasunread', 'Mark as unread', 'unread']);
        slot(['act-flag', 'markasflagged', 'Flag', 'flagged'], ['act-unflag', 'markasunflagged', 'Unflag', 'unflagged']);
        slot(['act-delete', 'deletemessage', 'Delete', 'delete'], ['act-undelete', 'undeletemessage', 'Undelete', 'undelete']);
        return actions;
    };

    /** @param {string} raw */
    const compactDate = raw => {
        const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
        if (!match) return raw;
        const [, year, month, day, time] = match;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        const now = new Date();
        if (parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth() && parsed.getDate() === now.getDate()) {
            return time;
        }
        if (parsed.getFullYear() === now.getFullYear()) {
            return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return `${day}.${month}.${year.slice(-2)}`;
    };

    // A custom column is transported by Roundcube but is not added to its saved
    // column preferences. Keep subjects/flags/thread expanders untouched.
    const addRow = mail.add_message_row;
    mail.add_message_row = function (...args) {
        const result = addRow.apply(this, args);
        if (result === false) return result; // Native duplicate/folder guard owns the row.
        document.getElementById('messagelist')?.setAttribute('data-fezadan-layout', mail.env.msglist_layout || '');
        const [uid, cols] = args;
        const messageUid = String(uid);
        const row = document.getElementById('rcmrow' + mail.html_identifier(messageUid, true));
        if (row?.querySelector('td.flags > span.attachment > span')) {
            row.classList.add('fezadan-has-attachment');
        }
        const dateEl = row?.querySelector('td.subject span.date');
        if (dateEl && dateEl.textContent) {
            const full = dateEl.textContent.trim();
            const short = compactDate(full);
            if (short !== full) {
                dateEl.setAttribute('title', full);
                dateEl.textContent = short;
            }
        }
        const subject = row?.querySelector('td.subject');
        if (subject && typeof cols?.fezadan_snippet === 'string' && cols.fezadan_snippet) {
            const snippet = document.createElement('span');
            snippet.className = 'fezadan-snippet skip-on-drag';
            snippet.textContent = cols.fezadan_snippet;
            snippet.title = cols.fezadan_snippet;
            subject.append(snippet);
        }
        if (subject) subject.append(rowActions(messageUid));
        return result;
    };

    mail.addEventListener('init', () => {
        // Keep expanded thread replies indented past the 16px row padding.
        if (mail.env) /** @type {any} */ (mail.env).thread_padding = '28px';

        // Elastic toggles this menu item's class on list updates, but leaves its
        // initial aria-disabled=true behind. Keep the actual native state and
        // the state announced to keyboard/screen-reader users in agreement.
        const syncSelection = () => {
            const toggle = document.getElementById('list-toggle-button');
            toggle?.setAttribute('aria-disabled', String(toggle.classList.contains('disabled')));
        };
        syncSelection();
        mail.addEventListener('listupdate', syncSelection);

        // A second click on the open message returns to the list, as Gmail and
        // Proton do; the native link would only reload the same preview.
        document.getElementById('messagelist')?.addEventListener('click', event => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest('.fezadan-row-actions, .selection, input, button, .attachment, .threads')) return;
            if (!target.closest('tr.selected')) return;
            event.preventDefault();
            event.stopPropagation();
            mail.command('close');
        }, true);

        // Icon-only chrome keeps its tooltip and gains an explicit name. The
        // search filter control is "Options" upstream, which says nothing.
        document.querySelectorAll('#messagelist-header a[title], .searchbar a[title], #layout-sidebar .header a[title]').forEach(control => {
            if (!(control instanceof HTMLElement)) return;
            const title = control.title.trim();
            if (title && !control.getAttribute('aria-label')) control.setAttribute('aria-label', title);
        });
        const searchOptions = document.querySelector('.searchbar a.options[data-target="searchmenu"]');
        if (searchOptions instanceof HTMLElement) {
            searchOptions.title = 'Search options';
            searchOptions.setAttribute('aria-label', 'Search options');
        }
        const listOptions = document.getElementById('listmenulink');
        if (listOptions) {
            listOptions.title = 'List options';
            listOptions.setAttribute('aria-label', 'List options');
        }
        // Mobile header buttons have no title; their hidden .inner text alone
        // is not a dependable accessible name once the icon-only layout applies.
        for (const [selector, name] of [
            ['.task-menu-button', 'Menu'],
            ['.back-sidebar-button', 'Folders'],
            ['.toolbar-menu-button', 'List actions'],
            ['.toolbar-list-button', 'List actions'],
            ['.back-list-button', 'Back to message list'],
        ]) {
            const control = document.querySelector(selector);
            if (!(control instanceof HTMLElement)) continue;
            if (!control.title) control.title = name;
            if (!control.getAttribute('aria-label')) control.setAttribute('aria-label', name);
        }
        document.getElementById('mailboxlist')?.setAttribute('aria-label', 'Folders');

        // The action group is one tab stop per row, not one per button: entering
        // a row enables its buttons, leaving it puts them back out of the way.
        const list = document.getElementById('messagelist');
        if (list) {
            /** @param {Element} row @param {boolean} enabled */
            const enableRowActions = (row, enabled) => {
                row.querySelectorAll('.fezadan-row-actions button').forEach(button => {
                    if (button instanceof HTMLButtonElement) button.tabIndex = enabled ? 0 : -1;
                });
            };
            list.addEventListener('focusin', event => {
                const row = event.target instanceof Element ? event.target.closest('tr') : null;
                if (row) enableRowActions(row, true);
            });
            list.addEventListener('focusout', event => {
                const row = event.target instanceof Element ? event.target.closest('tr') : null;
                if (!row) return;
                requestAnimationFrame(() => {
                    if (!row.contains(document.activeElement)) enableRowActions(row, false);
                });
            });
        }

        const pageNumber = document.querySelector('#layout-list > .pagenav input[type="number"]');
        if (pageNumber instanceof HTMLInputElement) {
            pageNumber.addEventListener('keydown', event => {
                if (event.isComposing) return;
                // Core submits Enter via change; Elastic's generic popover
                // handler then toggles it open again. Use that same native
                // change path once, before either Enter handler can run.
                if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    pageNumber.dispatchEvent(new Event('change', { bubbles: true }));
                }
                // Keep core's page-picker arrows, but not a second number-input
                // increment/decrement from the browser's default handling.
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault();
            }, true);
        }

        const messageBody = document.getElementById('messagebody');
        if (messageBody && mail.env.uid) {
            const actions = document.createElement('nav');
            actions.className = 'fezadan-reading-actions';
            actions.setAttribute('aria-label', mail.gettext('reply'));
            for (const [command, name] of [['reply', 'reply'], ['reply-all', 'replyall'], ['forward', 'forward']]) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn ' + (command === 'reply' ? 'btn-primary' : 'btn-secondary');
                button.textContent = mail.gettext(name);
                button.addEventListener('click', () => mail.command(command, '', button));
                actions.append(button);
            }
            // The reading actions belong above the message, next to the header.
            messageBody.before(actions);
        }

        const shortcuts = [
            ['↑ / ↓', 'Move focus between messages'],
            ['Space', 'Select the focused message'],
            ['Enter', 'Open the focused message'],
            ['Delete', 'Delete selected messages'],
            ['/', 'Search'],
            ['C', 'New message'],
            ['?', 'Show this help'],
            ['Esc', 'Close a menu or dialog'],
        ];
        const dialog = document.createElement('dialog');
        dialog.className = 'fezadan-shortcuts';
        dialog.setAttribute('aria-labelledby', 'fezadan-shortcuts-title');
        const head = document.createElement('div');
        head.className = 'fezadan-shortcuts-head';
        const title = document.createElement('h2');
        title.id = 'fezadan-shortcuts-title';
        title.textContent = 'Keyboard shortcuts';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'fezadan-shortcuts-close';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '×';
        close.addEventListener('click', () => dialog.close());
        head.append(title, close);
        const rows = document.createElement('dl');
        for (const [key, description] of shortcuts) {
            const term = document.createElement('dt');
            term.textContent = key;
            const detail = document.createElement('dd');
            detail.textContent = description;
            rows.append(term, detail);
        }
        dialog.append(head, rows);
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
        // The message list keeps a document-level key handler that cancels
        // Escape while it believes it still has focus; close here first.
        dialog.addEventListener('keydown', event => {
            event.stopPropagation();
            if (event.key === 'Escape') {
                event.preventDefault();
                dialog.close();
            }
        });
        document.body.append(dialog);

        const search = document.getElementById('mailsearchform');
        const content = document.getElementById('messagelist-content');
        if (content && search instanceof HTMLInputElement) {
            const hint = document.createElement('span');
            hint.className = 'voice';
            hint.textContent = mail.gettext('fezadankeyboardhint');
            hint.id = 'fezadan-keyboard-hint';
            search.setAttribute('aria-describedby', hint.id);
            search.setAttribute('aria-keyshortcuts', '/');
            search.title = hint.textContent;
            search.after(hint);
            document.addEventListener('keydown', event => {
                if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing
                    || document.querySelector('dialog[open], .ui-dialog, .popover.show')) return;
                // Shift is only meaningful here for "?", which lives on Shift+/.
                if (event.shiftKey && event.key !== '?') return;
                const target = event.target;
                if (target instanceof Element && target.closest('input, textarea, select, button, [contenteditable="true"], [role="textbox"]')) return;
                // Single-character shortcuts only while the list has focus:
                // never hijack page-wide keys, assistive input or speech typing.
                if (!(target instanceof Element) || !target.closest('#messagelist-content')) return;
                if (event.key === '/') {
                    event.preventDefault();
                    search.focus();
                } else if (event.key.toLowerCase() === 'c' && mail.commands.compose) {
                    event.preventDefault();
                    mail.command('compose');
                } else if (event.key === '?') {
                    event.preventDefault();
                    dialog.showModal();
                }
            });
            document.querySelector('#taskmenu a.compose')?.setAttribute('aria-keyshortcuts', 'c');
        }

        const layout = document.getElementById('layout');
        const listPane = document.getElementById('layout-list');
        if (layout && listPane && document.body.classList.contains('task-mail') && document.body.classList.contains('action-none')) {
            const storageKey = 'fezadan_mail_list_width';
            const minWidth = 320;
            const clampWidth = (/** @type {number} */ px) => {
                const maxWidth = Math.max(minWidth, layout.clientWidth - 216 - 360);
                return Math.round(Math.min(maxWidth, Math.max(minWidth, px)));
            };
            const applyWidth = (/** @type {number | null} */ px) => {
                if (px === null || !Number.isFinite(px)) {
                    layout.style.removeProperty('--fm-list-width');
                } else {
                    layout.style.setProperty('--fm-list-width', clampWidth(px) + 'px');
                }
            };
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) applyWidth(Number(saved));
            } catch { /* Ignore storage restrictions. */ }

            const resizer = document.createElement('div');
            resizer.className = 'fezadan-list-resizer';
            resizer.setAttribute('role', 'separator');
            resizer.setAttribute('aria-orientation', 'vertical');
            resizer.title = 'Drag to resize or double-click to reset';
            listPane.append(resizer);

            let startX = 0;
            let startWidth = 0;
            let layoutWidth = 0;
            let pendingX = 0;
            let rafId = 0;
            const applyFast = (/** @type {number} */ px) => {
                const maxWidth = Math.max(minWidth, layoutWidth - 216 - 360);
                const clamped = Math.round(Math.min(maxWidth, Math.max(minWidth, px)));
                layout.style.setProperty('--fm-list-width', clamped + 'px');
            };
            /** @param {PointerEvent} event */
            const onMove = event => {
                pendingX = event.clientX;
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    rafId = 0;
                    applyFast(startWidth + (pendingX - startX));
                });
            };
            const onUp = () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = 0;
                    applyFast(startWidth + (pendingX - startX));
                }
                document.body.classList.remove('fezadan-resizing');
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                window.removeEventListener('pointercancel', onUp);
                try {
                    const current = layout.style.getPropertyValue('--fm-list-width');
                    if (current) localStorage.setItem(storageKey, String(parseInt(current, 10)));
                } catch { /* Ignore storage restrictions. */ }
            };
            resizer.addEventListener('pointerdown', event => {
                if (event.button !== 0 || window.innerWidth <= 1200) return;
                event.preventDefault();
                startX = event.clientX;
                pendingX = event.clientX;
                layoutWidth = layout.clientWidth;
                startWidth = listPane.getBoundingClientRect().width;
                document.body.classList.add('fezadan-resizing');
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
                window.addEventListener('pointercancel', onUp);
            });
            resizer.addEventListener('dblclick', () => {
                applyWidth(null);
                try { localStorage.removeItem(storageKey); } catch { /* Ignore storage restrictions. */ }
            });
        }
    });
})();
