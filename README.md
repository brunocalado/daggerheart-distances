# Daggerheart: Distances

A visual and intuitive utility for the **Daggerheart** system in Foundry VTT. It automatically displays distance rings (Melee, Very Close, Close, Far) around tokens and calculates distances between characters instantly, helping players and GMs visualize combat ranges without needing to measure manually.

<video src="https://github.com/user-attachments/assets/c6e6a905-9cd4-4666-b742-9719f91a0a7b" 
       controls 
       width="720"
       autoplay 
       loop 
       muted></video>

## 🌟 Key Features

### 📏 For Everyone (Players & GM)

* **Visual Range Rings:** Instantly see the 4 main range bands of Daggerheart:

  * **Melee:** 5 ft.

  * **Very Close:** 15 ft.

  * **Close:** 30 ft.

  * **Far:** 60 ft.

* **Smart Hover:** Hover your mouse over any token to see exactly how far it is from your character. No ruler needed!

* **Easy Toggle:** Turn the rings on or off quickly using a button in the Token HUD or a keyboard shortcut.

### 🎨 Customization

* **Beautiful Themes:** Choose from pre-made color palettes like "Traffic Light", "Neon Cyberpunk", or "Warm Sunset".

* **Visual Styles:** Configure the rings to have solid, dotted, or dashed lines, and adjust their thickness.

* **Immersive Effects:** Enable animated gradient fills that pulse gently, or keep it simple with static colors.

## 🚀 Installation

Install via the Foundry VTT Module browser or use this manifest link:

* *https://raw.githubusercontent.com/brunocalado/daggerheart-fear-tracker/main/module.json*

## ⚙️ How to Use

### Toggling Rings

You have three easy ways to show or hide the range rings around a token:

1. **Token HUD:** Right-click a token to open the HUD, then click the **Circle** icon (<i class="fas fa-circle-dot"></i>).

2. **Keyboard Shortcut:** Select a token and press **`R`** (default) to toggle the rings on/off instantly.

<p align="center"><img width="600" src="docs/preview.webp"></p>

3. You can also use a macro `DHDistances.Toggle()`;

### Configuration

Go to the **Module Settings** tab in Foundry VTT to customize the look and feel:

<p align="center"><img width="400" src="docs/settings.webp"></p>

## 📜 Changelog

You can read the full history of changes in the [CHANGELOG](CHANGELOG.md).

## ⚖️ Credits and License

* **Code License:** [LICENSE](LICENSE).

* This module is a fork from [this](https://github.com/fsergler/foundry_combat_distances) 

**Disclaimer:** This module is an independent creation and is not affiliated with Darrington Press.