# Daggerheart: Distances

Daggerheart: Distances draws the four range rings of Daggerheart around a token (Melee 5 ft, Very Close 15 ft, Close 30 ft, Far 60 ft) and colors every other token by the ring it is in. Select your token and hover another to see its range and distance, or show the rings to every player at once.

<video src="https://github.com/user-attachments/assets/c6e6a905-9cd4-4666-b742-9719f91a0a7b" 
       controls 
       width="720"
       autoplay 
       loop 
       muted></video>

[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-Donate-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mestredigital) [![More Modules](https://img.shields.io/badge/Foundry%20VTT-More%20Modules-red?style=for-the-badge&logo=gamepad)](https://mestredigital.online/pages/projetos-en)

> Leia em [Português do Brasil](docs/README-PTBR.md)

## What it shows

When rings are on, every token inside them glows with the color of the smallest ring it is in. Tokens beyond Far stay as they are.

<p align="center"><img width="700" src="docs/highlighting.webp" alt="Tokens around a character glowing with the color of the ring they are in"></p>

Select your token and hover another one. A label above it shows the range (Melee to Very Far) and the distance in feet. You don't need the rings on for this.

The rings start at the edge of the token, so a large creature's Melee reaches farther from its center than a small one's. A target counts as inside a ring when enough of its body is inside: 10% by default, set in **Grid Coverage Threshold**. Tiny and Small tokens are measured by their real size.

<p align="center"><img width="700" src="docs/threshold.webp" alt="How much of a token must be inside the ring for it to count as in range"></p>

<p align="center"><img width="700" src="docs/sizes.webp" alt="Rings drawn around tokens of different sizes"></p>

While you drag a token, its rings follow the preview, so you can test a position before dropping it.

The rings always use 5, 15, 30 and 60 ft. They do not follow range distances changed in the Daggerheart settings.

When the GM loads the world, the module sets Daggerheart's **Show Token Distance on Highlight** to **Never**, because its hover label replaces the system's one.

## Showing the rings

<p align="center"><img width="600" src="docs/preview.webp" alt="Range rings around a token, with the Token HUD button"></p>

Right-click a token and click the circle icon in the Token HUD, or use a shortcut:

| Shortcut | Action |
|---|---|
| `R` | Turn rings on or off for the hovered or selected tokens, just for you |
| `Shift+R` | Show the rings to all players (GM only) |
| `M` | Rings from the center of the selected tokens |
| `Shift+Delete` | Remove all rings |
| Hold `Shift+H` | Hover Mode (GM) while the keys are held |
| Hold `Shift+B` | Hover Mode (Broadcast) while the keys are held |

All shortcuts can be changed in **Configure Controls**.

**Operation Mode**, in the module settings, decides what makes rings appear:

| Mode | What happens |
|---|---|
| Manual (default) | Rings appear only with `R` or the HUD button |
| Hover Mode (GM) | Rings appear on the token the GM hovers, only on the GM's screen |
| Hover Mode (Broadcast) | Each token the GM hovers shows its rings to all players |

The hold keys switch the mode only while held, so in Manual you can hold `Shift+B` to show a few threats to the table and release it to go back.

## Showing rings to the players

The GM can show a token's rings on every player's screen. They disappear after 7 seconds, or the time set in **Broadcast Duration**. Use `Shift+R`, Hover Mode (Broadcast), or `toggle({ remote: true })` from the API. A player pressing `Shift+R` does nothing.

`Shift+Delete` removes only the GM's rings by default. Set **Clear All Mode** to All Players to remove them from every screen.

## Measuring from a group

Select several tokens and press `M`. The rings are drawn from the center of the group, at the average elevation. With one token selected, `M` works like `R`.

<p align="center"><img width="700" src="docs/massmeasurement.webp" alt="Rings drawn from the center of a group of selected tokens"></p>

## Elevation

**Calculation Mode** decides whether height counts:

- Auto (3D): the difference in elevation is added to the distance. This is the default.
- Flat (2D): elevation is ignored.
- Both: ranges use 3D, and the hover label shows the 3D and the 2D distance.

## Settings

<p align="center"><img width="600" src="docs/settings.webp" alt="The module settings"></p>

These are in the module settings and only the GM can change them:

| Setting | Default |
|---|---|
| Operation Mode | Manual |
| Clear All Mode (GM) | GM Only |
| Broadcast Duration (Seconds) | 7 |
| Grid Coverage Threshold | 0.10 |
| Calculation Mode | Auto (3D) |

Each player sets the look of their own rings in **Open Visual Settings**:

| Setting | Options |
|---|---|
| Color Palette | Traffic Light (default), Inverse Traffic Light, Synthwave, True Fire |
| Line Style | Solid (default), Dotted, Dashed |
| Line Thickness | Normal (default), Large, Extra Large, Massive |
| Gradient Fill Style | Static, Animated - Normal, Animated - Light (default), None |
| Text Size | Small, Normal (default), Large |
| Target Highlighting | On (default) or off |

## Macros and API

Everything the shortcuts do can also run from a macro. The module has no macro compendium: create a script macro with the call you want from [docs/API.md](docs/API.md), for example rings with elevation ignored, or a Clear All that reaches every player.

The same page shows how other modules can ask which range one token is from another, with the same measurement the rings use.

## Installation

Install it from the Foundry VTT module browser, or use this manifest link:

```js
https://github.com/brunocalado/daggerheart-distances/releases/latest/download/module.json
```

It needs Foundry VTT v14 and the Daggerheart system 2.2.6 or later.

## Translations

To translate the module into your language:

1. Download the English file: [languages/en.json](https://github.com/brunocalado/daggerheart-distances/blob/main/languages/en.json)
2. Translate the values and keep the keys unchanged.
3. Send the file in [GitHub Issues](https://github.com/brunocalado/daggerheart-distances/issues) and say which language it is.

## Changelog

The full history of changes is in the [CHANGELOG](CHANGELOG.md).

## ⚖️ Credits and License

* **Code License:** [LICENSE](LICENSE).

* This module is a fork from [this](https://github.com/fsergler/foundry_combat_distances) 

**Disclaimer:** This module is an independent creation and is not affiliated with Darrington Press.

# 🧰 My Daggerheart Modules

| Module | Description |
| :--- | :--- |
| 💀 [**Adversary Manager**](https://github.com/brunocalado/daggerheart-advmanager) | Scale adversaries instantly and build balanced encounters. |
| 🖼️ [**Art Mapper**](https://github.com/brunocalado/dh-assets) | Automatically assigns artwork to system compendiums, actors, tokens, and custom module content — keeping your visuals organized and up to date. |
| 🐉 [**Colossus**](https://github.com/brunocalado/dh-colossus) | Manage massive multi-part boss encounters with independent HP per part and a single shared stress pool. |
| 📦 [**Containers**](https://github.com/brunocalado/dh-containers) | Group inventory items into collapsible containers — pouches, chests, backpacks — to declutter character sheets. |
| 💥 [**Critical**](https://github.com/brunocalado/daggerheart-critical) | Animated criticals. |
| 💠 [**Custom Stat Tracker**](https://github.com/brunocalado/dh-new-stat-tracker) | Add custom trackers to actors. |
| ☠️ [**Death Moves**](https://github.com/brunocalado/daggerheart-death-moves) | Enhances the Death Move moment with a dramatic interface and full automation. |
| 📏 [**Distances**](https://github.com/brunocalado/daggerheart-distances) | Visualizes combat ranges with customizable rings and hover calculations. |
| 📦 [**Extra Content**](https://github.com/brunocalado/daggerheart-extra-content) | Homebrew content pack. |
| 😱 [**Fear Tracker**](https://github.com/brunocalado/daggerheart-fear-tracker) | Adds an animated slider bar with configurable fear tokens to the UI. |
| 🧟 [**Horde**](https://github.com/brunocalado/dh-horde) | Explode single horde tokens into dozens of individual tokens and manage their movement and stats automatically. |
| 🎁 [**Mystery Box**](https://github.com/brunocalado/dh-mystery-box) | Introduces mystery box mechanics for random loot and surprises. |
| ⚡ [**Quick Actions**](https://github.com/brunocalado/daggerheart-quickactions) | Quick access to common mechanics like Falling Damage, Downtime, etc. |
| 📜 [**Quick Rules**](https://github.com/brunocalado/daggerheart-quickrules) | Fast and accessible reference guide for the core rules. |
| 🤖 [**Resource Macros**](https://github.com/brunocalado/daggerheart-fear-macros) | Automatically executes macros when the Fear, Hope, Stress, HP, or Armor resources change. |
| 🎲 [**Stats**](https://github.com/brunocalado/daggerheart-stats) | Tracks dice rolls from GM and Players. |
| 🧠 [**Stats Toolbox**](https://github.com/brunocalado/dh-statblock-importer) | Import actors using a statblock. |
| 🛒 [**Store**](https://github.com/brunocalado/daggerheart-store) | A dynamic, interactive, and fully configurable in-game store. |
| 🔍 [**Unidentified**](https://github.com/brunocalado/dh-unidentified) | Obfuscates item names and descriptions until they are identified by the players. |
| 🌌 [**Void**](https://github.com/brunocalado/the-void-unofficial) | Unofficial module that brings The Void playtesting content — experimental classes, subclasses, ancestries, communities, adversaries, loot, weapons, and more. |

# 🗺️ Adventures

| Adventure | Description |
| :--- | :--- |
| ✨ [**I Wish**](https://github.com/brunocalado/i-wish-daggerheart-adventure) | A wealthy merchant is cursed; one final expedition may be the only hope. |
| 💣 [**Suicide Squad**](https://github.com/brunocalado/suicide-squad-daggerheart-adventure) | Criminals forced to serve a ruthless master in a land on the brink of war. |
