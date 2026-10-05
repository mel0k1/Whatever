# Whatever

[![License](https://img.shields.io/badge/license-GPL--2.0--only-black?style=flat-square)](COPYING)
[![Build](https://github.com/mel0k1/Whatever/actions/workflows/build.yml/badge.svg?style=flat-square)](https://github.com/mel0k1/Whatever/actions/workflows/build.yml)
[![Platform](https://img.shields.io/badge/platform-cross--platform-black?style=flat-square)](docs/building-GTK.md)
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

Fork of upstream NetSurf (`a471a0d`). The upstream multi-frontend
layout is kept: GTK3, Windows, BeOS/Haiku, framebuffer, Qt and
RISC OS.

Works:

- GTK3 frontend with light and dark monochrome themes
  (`WHATEVER_THEME=dark`).
- Bundled monochrome icon theme for the GTK toolbar and menus.
- Monochrome browser assets: toolbar, throbber, banner, page-info,
  installer graphics.
- Monochrome internal pages: fetch errors, certificate and privacy
  prompts.
- Engine: dynamic JavaScript with XMLHttpRequest, fetch() and
  Promise, DOM selectors (querySelector, closest, matches), style
  and dataset APIs, DOMParser with true XML support, btoa/atob, a
  real getComputedStyle computed by the CSS engine including the
  box model (border/padding/margin widths), live page reflow after
  DOM changes, localStorage and sessionStorage, history, window
  scrolling (scrollTo, scrollBy, scrollIntoView), window geometry
  (innerWidth/innerHeight, scroll offsets), element geometry
  (offsetWidth, clientWidth, offsetLeft, offsetParent),
  getBoundingClientRect, elementFromPoint, NodeList iteration
  (forEach and for..of), CSS.escape, queueMicrotask, TextEncoder,
  TextDecoder, URLSearchParams, matchMedia evaluation
  (width/height, orientation, aspect-ratio, resolution) and
  popular ES2015 builtin methods (Object.assign,
  Array.from/find/flat, String startsWith/padStart,
  Number.isInteger and more).
- Windows cross-build in CI: a flat zip and an NSIS installer.
- GTK3 Linux build in CI.

Does not work yet:

- The JavaScript core is ES5.1: no arrow functions, classes,
  template literals, Map/Set or async/await, so complex SPA
  frameworks may still break.
- Web storage persists in the user profile and is per origin;
  sessionStorage lives only for the page session.
- No audio or video playback.
- Binaries are not Authenticode-signed: expect a SmartScreen
  warning. Build provenance is published as GitHub artifact
  attestations (`gh attestation verify`).
- The Windows frontend needs broader testing on real hardware.

## Design rules

- Two colors: black and white. Neutral grays only for disabled states.
- Square corners everywhere. No rounded rectangles.
- Flat surfaces. No gradients, shadows, glow or neon.
- No animations. State changes are instant.
- No decoration. If an element carries no information and accepts no input,
  it does not exist.
- The design covers the browser chrome only. Web content always keeps the
  site's own styles.

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

CI also cross-builds the Windows frontend with mingw64. The `windows`
workflow publishes `whatever-win64` (a flat zip with the exe,
resources and runtime DLLs) and `whatever-win64-setup.exe` (NSIS
installer).

## Roadmap

- Test the Windows build on real hardware.
- Extend the monochrome theme to the Qt, BeOS and RISC OS frontends.

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
компактности. Апстрим-мультиплатформенность сохранена: GTK3, Windows,
BeOS/Haiku, framebuffer, Qt и RISC OS.

Дизайн касается только оболочки браузера. Сторонние сайты всегда
рендерятся со своими стилями.

## Статус

**Работает:**

- GTK3-фронтенд со светлой и тёмной монохромными темами
  (`WHATEVER_THEME=dark`).
- Собственная монохромная тема иконок для тулбара и меню GTK.
- Монохромные ассеты браузера: тулбар, throbber, баннер,
  page-info, установщик.
- Монохромные внутренние страницы: ошибки загрузки,
  сертификат, приватность.
- Движок: динамический JavaScript с XMLHttpRequest, fetch()
  и Promise, DOM-селекторы (querySelector, closest, matches),
  API стилей и dataset, DOMParser с настоящей поддержкой XML,
  btoa/atob, настоящий getComputedStyle на движке CSS
  с боксовой моделью (ширины border/padding/margin),
  перерисовка страницы после DOM-изменений, localStorage
  и sessionStorage, history, прокрутка окна (scrollTo,
  scrollBy, scrollIntoView), геометрия окна (innerWidth/
  innerHeight, прокрутка), геометрия элементов
  (offsetWidth, clientWidth, offsetLeft, offsetParent),
  getBoundingClientRect, elementFromPoint, итерация NodeList
  (forEach и for..of), CSS.escape, queueMicrotask, TextEncoder,
  TextDecoder, URLSearchParams, вычисление matchMedia
  (ширина/высота, ориентация, aspect-ratio, resolution)
  и популярные встроенные методы ES2015
  (Object.assign, Array.from/find/flat, String startsWith/padStart,
  Number.isInteger и другие).
- Windows-сборка в CI: плоский zip и NSIS-установщик.
- Linux GTK3-сборка в CI.

**Пока нет:**

- Ядро JavaScript — ES5.1: нет стрелочных функций, классов,
  шаблонных строк, Map/Set и async/await, поэтому сложные
  SPA-фреймворки могут по-прежнему ломаться.
- Web storage сохраняется в профиле пользователя с разделением
  по origin; sessionStorage живёт только в рамках сессии.
- Воспроизведения аудио и видео.
- Подписи Authenticode — только GitHub artifact attestations
  и предупреждение SmartScreen при первом запуске.
- Обкатки Windows-фронтенда на реальном железе.

## Темы

По умолчанию светлая ч/б тема. Тёмная:

    WHATEVER_THEME=dark ./nsgtk3

## Сборка

Процесс сборки как у NetSurf (см. [docs/building-GTK.md](docs/building-GTK.md));
быстрый путь — bundle `netsurf-all` с
<https://download.netsurf-browser.org/netsurf/releases/source/>.

    make TARGET=gtk3 -j$(nproc)

CI также кросс-собирает Windows-версию через mingw64. Публикуются `whatever-win64` (плоский zip с exe, ресурсами и рантайм-DLL) и
`whatever-win64-setup.exe` (NSIS-установщик).

## Лицензия

GPLv2 (наследована от NetSurf), см. [COPYING](COPYING). Заслуги движка —
разработчикам NetSurf.
