# Design notes

## Surfaces

Dark is the starting theme. Light has its own token values and is fully supported. Both come from one token set in `skin/styles/fezadan.css`: light values in `:root`, dark values in `:root.dark-mode`.

| Token | Light | Dark |
| --- | --- | --- |
| `--fm-bg` | `#ffffff` | `#1f1f1f` |
| `--fm-side` | `#f5f5f5` | `#171717` |
| `--fm-content` | `#fafafa` | `#1c1c1c` |
| `--fm-text` | `#202020` | `#efefef` |
| `--fm-muted` | `#656565` | `#989898` |
| `--fm-border` | `#e4e4e4` | `#353535` |
| `--fm-primary` | `#202020` | `#efefef` |
| `--fm-accent` | `#202020` | `#efefef` |

The accent is plain ink. Selected list rows use `--fm-row-selected` (`#1b5fc7`) with white text in both themes. Status and warning colours come from Roundcube's native classes.

## Type

Inter Variable is served from `skin/fonts/` (SIL OFL). The stack falls back to `system-ui, sans-serif`; message bodies keep their sender-provided fonts. The scale is 11, 12, 13, 14, 16, 21 and 28 px with 20 and 22 px line heights. The root is 14 px, which the MUI islands reuse through `htmlFontSize`.

## Spacing and shape

One 4 px scale: 4, 8, 12, 16, 24, 32 (`--fm-space-1` to `--fm-space-6`). Radii are 6, 8 and 12 px. Separators are 1 px `--fm-border`; there are no drop shadows on chrome surfaces.

## Layout

Above 1200 px the menu and folders share one sidebar, the list and reader sit side by side, and splitters are hidden for that grid. Narrower layouts keep Elastic's native panel navigation and floating compose button. Headers are 56 px. List rows are one line while the pane is wide enough and stack on phones. The reader toolbar is icon-only and starts at the left edge so plugin actions are not clipped.

## Behaviour

- Buttons and menus call native Roundcube commands. The React islands forward clicks; they do not reimplement sending, drafts or message actions.
- No fake progress, staged status text or simulated loading. A disabled control means the command is unavailable.
- `prefers-reduced-motion` disables the MUI ripple.
- Remote images stay blocked by default. The warning explains the tracking risk; the native action loads them for the open message only.
- Empty and error states use plain sentences, not console or cyber styling.
- The skin does not invert or rewrite message HTML.
