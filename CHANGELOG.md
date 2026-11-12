# Unreleased

- [Breaking][Changed] Requires Daggerheart 2.12.8 or later
- [Fixed] The system's own token distance tooltip is now turned off for players too, not only the GM, so it no longer overlaps the module's hover label

# 0.3.0

- [Added] Public API in `game.modules.get("daggerheart-distances").api`: `getRange(source, target)` and `isWithinRange(source, target, rangeId)` give other modules the same range the target highlight shows, using the Daggerheart system's range ids (`melee`, `veryClose`, `close`, `far`, `veryFar`). See [docs/API.md](https://github.com/brunocalado/daggerheart-distances/blob/main/docs/API.md)
- [Changed] The target highlight, the hover label and the API share one range decision, so they always agree
- [Changed] **Breaking:** `window.DHDistances` is gone. Macros now call `game.modules.get("daggerheart-distances").api` with `toggle()`, `massMeasurement()` and `clearAll()` (lower camelCase)
- [Fixed] Tokens with fractional sizes (Daggerheart's Tiny 0.5 and Small 0.8 by default) were measured as a full grid square, so their range depended on which side of the source they stood; they are now measured by their real size
- [Removed] The Distances Macros compendium. Create a script macro with the calls in [docs/API.md](https://github.com/brunocalado/daggerheart-distances/blob/main/docs/API.md) instead
- [Changed] Releases are now built by a GitHub workflow and published to foundryvtt.com; the manifest points at the latest GitHub release
- [Changed] README and PT-BR README rewritten for the current module, with every setting and its default

# 0.2.7

- [Fixed] Token HUD button icon was off-center: the button is a `<div>` (not a `<button>`), so it never matched Foundry's core `.control-icon` centering rule (`display: flex; align-items: center; justify-content: center`); now set explicitly on `.dhd-hud-button`

# 0.2.6

- Br type translation fixed

# 0.2.5

- RU translation: https://github.com/brunocalado/daggerheart-distances/issues/5

# 0.2.4

- [Fixed] HUD button styles (border, cursor, active state) were not applied for non-English locales because the CSS selector matched the hardcoded English title string; button now carries a dedicated `dhd-hud-button` class used as the selector
- [Changed] Extracted the coverage-based range-matching loop into `findMatchedRange()` in `scripts/helpers.js`; eliminates duplicated logic between `updateTargetHighlights()` and `onHoverToken()`
- [Removed] Dead method `CombatDistances.getDistanceLabel()` — was never called


# 0.2.3

- [Changed] Full i18n pass: all user-facing strings are now localized via the translation files (`languages/en.json`, `languages/pt-BR.json`)
  - Settings names, hints, and choice labels in Module Settings and Configure Controls
  - Visual Settings dialog title, field labels, hints, and "Save Changes" button
  - Token HUD button tooltip
  - Warning notifications for mass measurement and toggle with no token selected
  - Color palette names in the palette dropdown
- [Changed] Translation keys that existed but were unused (`DHD.settings.operationMode.*`, `DHD.settings.clearAllMode.*`, `DHD.keybindings.clearAll.*`) are now correctly wired in `registration.js`

# 0.2.2

- [Changed] **Operation Mode** is now a GM-only world setting (`restricted: true`); non-GM players no longer see it in Module Settings
- [Changed] **Grid Coverage Threshold** is now a GM-only world setting; the GM defines it once for the whole table instead of each player setting their own value
- [Changed] **Calculation Mode** is now a GM-only world setting; ensures all players use the same elevation calculation method

# 0.2.1

- [Added] `ClearAll()` method: removes all active distance rings at once, locally for the calling user
- [Added] Keybinding `Shift+Delete` to trigger `ClearAll()` (reassignable in Foundry's Configure Controls)
- [Added] Public macro API: `DHDistances.ClearAll()` — removes all rings for the user who calls it
- [Added] GM setting **Clear All Mode**: choose whether `ClearAll()` affects only the GM or all connected players (Module Settings → Clear All Mode)
- [Added] Macro arg for explicit scope override: `DHDistances.clearAll({ scope: 'all' })` broadcasts to all players regardless of setting; `DHDistances.clearAll({ scope: 'self' })` limits to the GM only — arg takes precedence over the setting

# 0.2.0

- v14 only
- [Changed] Introduced `scripts/constants.js` with `MODULE_ID` constant; all internal references to the module id now import this constant instead of using string literals
- [Changed] CSS split into `styles/base.css` (canvas overlay) and `styles/visual-settings-app.css` (settings dialog) — one file per concern
- [Changed] All CSS rules scoped under `.daggerheart-distances` to prevent style leaks into Foundry core
- [Changed] Hardcoded colors in CSS replaced with Foundry core variables (`--color-text-primary`, `--color-text-secondary`, `--color-border`) and module-level custom properties (`--dhd-label-bg`, `--dhd-category-color`, etc.)
- [Changed] `PALETTES` and `DEFAULTS` moved from `CombatDistances` static properties to named exports in `scripts/constants.js`
- [Changed] `VisualSettingsApp` extracted from `main.js` into `scripts/visual-settings-app.js`; refresh callback wired via `initVisualSettingsApp()` to avoid circular imports
- [Changed] `registerSettings()` and `registerKeybindings()` extracted from `CombatDistances` into `scripts/registration.js` as standalone exported functions
- [Changed] Pure utility functions (`getWorldToScreen`, `formatDistance`, `getTokenSamplePoints`) extracted from `CombatDistances` into `scripts/helpers.js`

# 0.1.7

- [Fixed] CSS leaking into Foundry UI: added `isolation: isolate` to the overlay container to prevent `mix-blend-mode` on token highlights from visually corrupting the sidebar and other UI elements
- [Fixed] `overflow: hidden` on the overlay container prevents off-screen rings from adding scrollbars that displaced the hotbar
- [Fixed] Overlay container now attaches to the canvas wrapper (`#board` parent) instead of `document.body`, scoping it below Foundry's `#interface` layer
- [Fixed] Removed jQuery dependency from `onRenderTokenHUD`; replaced with native DOM APIs per V13 standards

# 0.1.6

- [Changed] Six visual settings (Text Size, Color Palette, Line Style, Line Thickness, Gradient Fill Style, Target Highlighting) moved out of the default settings list into a dedicated "Visual Settings" dialog opened via a palette button

# 0.1.5

- https://github.com/brunocalado/daggerheart-distances/issues/3
- [Added] Operation Mode setting: Manual (default), Hover Mode (GM), and Hover Mode (Broadcast)
- [Added] Hover Mode (GM): hovering a token as GM auto-shows rings locally, removed on mouse-out
- [Added] Hover Mode (Broadcast): hovering a token as GM broadcasts rings to all players (uses existing broadcast timer)
- [Added] Transient keybindings Shift+H and Shift+B to temporarily override the active Operation Mode while held
- [Changed] `_activeTokens` entries now carry a `pinned` flag to distinguish manually-activated rings (persistent) from hover-triggered rings (ephemeral)
- [Added] Localization keys for Operation Mode setting (en, pt-BR)


# 0.1.4
- [Fixed] Tokens beyond the Far ring (60 ft) now correctly display "Very Far" instead of "Far"
- [Added] `DHD.ranges.veryFar` localization key (en, pt-BR)

# 0.1.3
- supports translation
- bug fix: no longer distorts art

# 0.1.2
- removed warning for deprecated code

# 0.1.1
- You can now broadcast the rings to all clients. Use Shift + R or DHDistances.Toggle({remote: true});

# 0.1.0
- bug fix: document.lockRotation will be take into account

# 0.0.9
- Auto disable system distance works for non gm
- Highlighting you take in account the token art
- if a non gm select multiple tokens it will be able to see hover distance 
- non GM can just hover the mouse of a token without permission and trigger the rings

# 0.0.8
- Auto disable system distance 

# 0.0.7
- Target Highlighting: Valid targets within range rings now glow with the ring's color.
- Ghost Preview: Range rings now follow the token preview while dragging to test positions.
- Mass Measurement: Select multiple tokens and use the macro DHDistances.MassMeasurement() to generate distance rings from the center of the group (bounding box center).

# 0.0.6
Features & Improvements
Smart Distance Detection: Major overhaul to distance calculation. The system now uses an "Edge-to-Edge" method that accurately accounts for token size.

Coverage Threshold: Added a new setting to define the specific percentage of a token that must be inside a ring to count as "in range" (e.g., 10% coverage).

Elevation Support: Distance calculations now account for token elevation/height (3D distance).

New Palettes: Added two new color themes: Synthwave and True Fire.

Macro Updates
The Toggle function now supports specific calculation modes:
```js
DHDistances.Toggle({mode: '2d'}); // Calculates distance ignoring elevation.
```
```js
DHDistances.Toggle({mode: '3d'}); // Calculates distance accounting for elevation.
```
```js
DHDistances.Toggle({mode: 'both'}); // Shows both 3D and 2D distances.
```

# 0.0.5
- light animation

# 0.0.4
- fix for button
- DHDistances.Toggle()