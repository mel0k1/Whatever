# GUI design rules

The interface is monochrome and utilitarian. If an element does not carry
information or accept input, it should not exist.

## Scope

The rules cover the browser chrome only: windows, toolbar, menus, dialogs
and internal pages such as the welcome screen. Web content is never
restyled: third-party sites render with their own stylesheets, and Whatever
imposes no stylesheet of its own on them.

## Color

| Role               | Light                            | Dark                             |
|--------------------|----------------------------------|----------------------------------|
| Background         | `#ffffff`                        | `#000000`                        |
| Text               | `#000000`                        | `#ffffff`                        |
| Border / divider   | `#000000`                        | `#ffffff`                        |
| Hover / active     | inverted (black bg, white fg)    | inverted (white bg, black fg)    |
| Disabled           | `#777777`                        | `#888888`                        |

No other colors. Gradients are not used at all.

## Shape

- `border-radius: 0` on every widget.
- 1px solid borders on interactive elements.
- No shadows, no glow.

## Motion

No animations and no transitions. Hover, focus and state changes apply
instantly.

## Implementation

GTK3 frontend: `frontends/gtk/res/whatever.css` (light) and
`frontends/gtk/res/whatever-dark.css` (dark). The stylesheet is loaded at
startup by a GTK style provider (`nsgtk_apply_theme()` in
`frontends/gtk/gui.c`); `WHATEVER_THEME=dark` selects the dark one. Upstream
theme resources are not modified: the provider overrides them at application
priority.

## Non-goals

- No content styling. Sites keep their own styles.
- No icon themes, no theming engine, no user-facing theme settings.
- No per-widget exceptions; if a widget looks wrong in monochrome, the widget
  is fixed, not the rule.
