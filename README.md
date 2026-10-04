# Whatever

[![License](https://img.shields.io/badge/license-GPL--2.0--only-black?style=flat-square)](COPYING)
[![Build](https://github.com/mel0k1/Whatever/actions/workflows/build.yml/badge.svg?style=flat-square)](https://github.com/mel0k1/Whatever/actions/workflows/build.yml)
[![Platform](https://img.shields.io/badge/platform-Linux%20GTK3-black?style=flat-square)](docs/building-GTK.md)
[![Language](https://img.shields.io/badge/language-C-black?style=flat-square)]()
[![Status](https://img.shields.io/badge/status-alpha-black?style=flat-square)]()

A minimalist web browser based on [NetSurf](https://www.netsurf-browser.org/).

Whatever is a fork of NetSurf with a stripped-down monochrome interface: flat
surfaces, square corners, two colors, no decoration. The rendering core —
NetSurf's own lightweight HTML and CSS engine — is kept intact. Work is
concentrated on the GUI and on keeping the browser small.

## Why

Most modern browsers are heavy and visually noisy. NetSurf is neither, and
its own engine keeps it small and auditable. Whatever builds on that: a
serious, quiet interface with nothing to distract.

## Status

Early development. The tree is the upstream NetSurf import
(upstream commit `a471a0d`) with the first interface changes applied.

## Design rules

- Two colors: black and white. Neutral grays only for disabled states.
- Square corners everywhere. No rounded rectangles.
- Flat surfaces. No gradients, shadows, glow or neon.
- No animations. State changes are instant.
- No decoration. If an element carries no information and accepts no input,
  it does not exist.

Full rules: [docs/DESIGN.md](docs/DESIGN.md).

## Themes

The GTK3 frontend ships two monochrome stylesheets. Light is the default:

    ./nsgtk3

Dark variant:

    WHATEVER_THEME=dark ./nsgtk3

## Build

Whatever follows the NetSurf build process. The core support libraries
(libcss, libdom, libhubbub, libnsgif, ...) are separate projects; the
quickest route is the `netsurf-all` source bundle from
<https://download.netsurf-browser.org/netsurf/releases/source/>.
Upstream build documentation: [docs/building-GTK.md](docs/building-GTK.md).

    make TARGET=gtk3 -j$(nproc)

## Roadmap

- Slim default toolbar and menu set.
- Monochrome stylesheet for content rendering.
- Native Windows build (frontends/windows).
- Replace installer banner and throbber assets.

## Contributing

- Commits are short and single-topic: `topic: what changed`.
- No comments in code except where the logic is genuinely non-obvious,
  and then one short line.

## License

GPLv2, inherited from NetSurf. See [COPYING](COPYING). NetSurf remains
the upstream project; all credit for the engine belongs to the NetSurf
developers.

---

# Whatever (RU)

Минималистичный веб-браузер на базе NetSurf.

Форк NetSurf со строгим монохромным интерфейсом: плоские поверхности, прямые
углы, два цвета, никакого декора. Движок отрисовки — лёгкий HTML/CSS-движок
NetSurf — сохранён без изменений, работа сосредоточена на интерфейсе и
компактности.

## Темы

По умолчанию светлая ч/б тема. Тёмная:

    WHATEVER_THEME=dark ./nsgtk3

## Сборка

Процесс сборки как у NetSurf (см. [docs/building-GTK.md](docs/building-GTK.md));
быстрый путь — bundle `netsurf-all` с
<https://download.netsurf-browser.org/netsurf/releases/source/>.

    make TARGET=gtk3 -j$(nproc)

## Правила проекта

- Коммиты короткие и односложные: `topic: что изменилось`.
- Без комментариев в коде, кроме действительно неочевидных мест — и там
  одна короткая строка.

## Лицензия

GPLv2 (наследована от NetSurf), см. [COPYING](COPYING). Заслуги движка —
разработчикам NetSurf.
