// Real MUI islands for Roundcube chrome. Roundcube keeps the mail commands,
// labels and disabled state; React only owns the container it is given.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, IconButton, SvgIcon, ThemeProvider, createTheme, type Theme } from '@mui/material';

type Mail = {
    addEventListener: (name: string, callback: () => void) => void;
    command: (name: string, props?: unknown, element?: HTMLElement) => unknown;
    gettext: (name: string) => string;
    commands?: Record<string, boolean>;
};

const ACTIONS = [
    ['reply', 'reply', 'contained'],
    ['reply-all', 'replyall', 'outlined'],
    ['forward', 'forward', 'outlined'],
] as const;

const mail = (window as unknown as { rcmail?: Mail }).rcmail;
// The ripple is decoration; respect the OS motion preference.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readTheme(dark: boolean): Theme {
    const style = getComputedStyle(document.documentElement);
    const token = (name: string) => style.getPropertyValue(name).trim();
    return createTheme({
        palette: {
            mode: dark ? 'dark' : 'light',
            primary: { main: token('--fm-accent') },
            background: { default: token('--fm-bg'), paper: token('--fm-side') },
            text: { primary: token('--fm-text'), secondary: token('--fm-muted') },
            divider: token('--fm-border'),
        },
        // Roundcube sets a 14px root; keep MUI's rem scale on the same base.
        typography: { fontFamily: 'Inter, system-ui, sans-serif', htmlFontSize: 14 },
        shape: { borderRadius: 10 },
        components: {
            MuiButton: {
                styleOverrides: { root: { textTransform: 'none', fontWeight: 500, fontSize: '1rem' } },
            },
        },
    });
}

function ReadingActions({ api }: { api: Mail }) {
    const enabled = () => ACTIONS.map(([command]) => api.commands?.[command] !== false);
    const [state, setState] = useState(enabled);
    useEffect(() => {
        api.addEventListener('enable-command', () => setState(enabled()));
    }, []);

    return (
        <>
            {ACTIONS.map(([command, label, variant], index) => (
                <Button key={command} variant={variant} size="large" disabled={!state[index]}
                    disableRipple={reduceMotion}
                    onClick={event => { api.command(command, '', event.currentTarget); }}>
                    {api.gettext(label)}
                </Button>
            ))}
        </>
    );
}

function Root({ children }: { children: ReactNode }) {
    const isDark = () => document.documentElement.classList.contains('dark-mode');
    const [dark, setDark] = useState(isDark);
    useEffect(() => {
        const observer = new MutationObserver(() => setDark(isDark()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    const theme = useMemo(() => readTheme(dark), [dark]);
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

function mount(): void {
    const actions = document.querySelector<HTMLElement>('.fezadan-reading-actions');
    if (!mail || !actions || actions.dataset.mui === 'true') return;
    actions.dataset.mui = 'true';
    actions.replaceChildren();
    createRoot(actions).render(<Root><ReadingActions api={mail} /></Root>);
}

// Compose keeps its native send button as the only handler; the MUI button is
// the visible label and forwards the click, so drafts, uploads and plugins are
// untouched and the native control still works when this bundle fails.
// Material "send" glyph in a MUI SvgIcon; no icon-font or icon package needed.
const SendIcon = () => <SvgIcon fontSize="small"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" /></SvgIcon>;

function ComposeSend({ api, native, compact }: { api: Mail; native: HTMLElement; compact?: boolean }) {
    const label = native.textContent?.trim() || '';
    const [enabled, setEnabled] = useState(() => api.commands?.send !== false);
    useEffect(() => {
        api.addEventListener('enable-command', () => setEnabled(api.commands?.send !== false));
    }, []);
    // Elastic's phone footer stacks a small icon over a short label. The cell
    // layout lives in fezadan.css so this stays a plain MUI button.
    return (
        <Button variant={compact ? 'text' : 'contained'} size={compact ? 'small' : 'large'}
            disabled={!enabled} disableRipple={reduceMotion}
            className="fezadan-send-button" startIcon={<SendIcon />} onClick={() => native.click()}>
            {label}
        </Button>
    );
}

function mountCompose(): void {
    const targets: [string, boolean][] = [
        ['#compose-content button.send', false],
        ['.footer.menu a.send', true],
    ];
    for (const [selector, compact] of targets) {
        for (const native of document.querySelectorAll<HTMLElement>(selector)) {
            if (!mail || native.dataset.mui === 'true') continue;
            native.dataset.mui = 'true';
            const host = document.createElement('span');
            host.className = 'fezadan-send-host';
            native.before(host);
            createRoot(host).render(<Root><ComposeSend api={mail} native={native} compact={compact} /></Root>);
        }
    }
}

// Material glyph paths (same data as @mui/icons-material), used only where a
// toolbar control is replaced. Unknown controls keep Elastic's native button.
const TOOL_ICONS: Record<string, string> = {
    'reply-all': 'M7 8V5l-7 7 7 7v-3l-4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11',
    reply: 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11',
    forward: 'M12 8V4l8 8-8 8v-4H4V8z',
    delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
    print: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3m-3 11H8v-5h8zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-1-9H6v4h12z',
    markmessage: 'm14 6-1-2H5v17h2v-7h5l1 2h7V6zm4 8h-4l-1-2H7V6h5l1 2h5z',
    more: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2',
    prev: 'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z',
    next: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
};

function iconFor(native: Element): string | undefined {
    for (const [name, d] of Object.entries(TOOL_ICONS)) {
        if (native.classList.contains(name)) return d;
    }
    return undefined;
}

function ToolbarButton({ native, d }: { native: HTMLElement; d: string }) {
    const [disabled, setDisabled] = useState(native.classList.contains('disabled'));
    useEffect(() => {
        // Elastic toggles .disabled on the native node; keep the MUI face in sync.
        const observer = new MutationObserver(() => setDisabled(native.classList.contains('disabled')));
        observer.observe(native, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    const label = native.getAttribute('title') || native.textContent?.trim() || '';
    return (
        <IconButton size="small" className="fezadan-tool-button" disabled={disabled}
            disableRipple={reduceMotion} title={label} aria-label={label}>
            <SvgIcon fontSize="small" viewBox="0 0 24 24"><path d={d} /></SvgIcon>
        </IconButton>
    );
}

function mountToolbar(): void {
    // Elastic moves these buttons into a popup list at init; the originals are
    // reused on wide screens, so a single mount covers the inline toolbar.
    for (const native of document.querySelectorAll<HTMLElement>(
        '#toolbar-menu > li > a, #toolbar-list-menu > li > a')) {
        if (!mail || native.dataset.mui === 'true' || native.classList.contains('dropdown')) continue;
        const d = iconFor(native);
        if (!d) continue;
        native.dataset.mui = 'true';
        const host = document.createElement('span');
        host.className = 'fezadan-tool-host';
        native.before(host);
        createRoot(host).render(<Root><ToolbarButton native={native} d={d} /></Root>);
    }
}

if (mail) {
    mail.addEventListener('init', () => {
        mount();
        mountCompose();
        mountToolbar();
    });
    // The preview frame can finish init before this deferred script runs.
    mount();
    mountCompose();
    mountToolbar();
}

// Popover clones copy the rendered DOM, so forward clicks at document level to
// the native control that follows the host instead of binding each button.
document.addEventListener('click', event => {
    const host = (event.target as Element | null)?.closest?.('.fezadan-tool-host');
    const native = host?.nextElementSibling;
    if (host && native instanceof HTMLElement) {
        event.preventDefault();
        native.click();
    }
}, true);
