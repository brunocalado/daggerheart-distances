import { MODULE_ID, PALETTES, CLEAR_ALL_MODE_KEY } from './constants.js';
import { VisualSettingsApp, initVisualSettingsApp } from './visual-settings-app.js';

/**
 * Registers all module settings with Foundry's settings registry.
 * Called from CombatDistances.initialize() during the init hook.
 * @param {typeof CombatDistances} CombatDistances
 */
export function registerSettings(CombatDistances) {
    // Wire the refresh callback before registerMenu so _onSubmit can call it.
    initVisualSettingsApp(() => CombatDistances.refreshAll());

    const paletteChoices = Object.keys(PALETTES).reduce((choices, key) => {
        choices[key] = PALETTES[key].label;
        return choices;
    }, {});

    game.settings.registerMenu(MODULE_ID, 'visualSettingsMenu', {
        name: 'Visual Settings',
        label: 'Open Visual Settings',
        hint: 'Configure the appearance of the distance rings: colors, lines, effects, and labels.',
        icon: 'fas fa-palette',
        type: VisualSettingsApp,
        restricted: false
    });

    game.settings.register(MODULE_ID, 'operationMode', {
        name: 'Operation Mode',
        hint: 'Choose how distance rings are triggered.',
        scope: 'world',
        config: true,
        restricted: true,
        type: String,
        choices: {
            'manual':           'Manual',
            'hover-gm':         'Hover Mode (GM)',
            'hover-broadcast':  'Hover Mode (Broadcast)'
        },
        default: 'manual',
        onChange: () => {}
    });

    // --- STEP 1: Synchronization Configuration ---
    game.settings.register(MODULE_ID, 'broadcastState', {
        scope: 'world',
        config: false, // Hidden setting acting as data channel
        type: Object,
        default: {},
        onChange: (data) => CombatDistances._handleBroadcastChange(data)
    });

    game.settings.register(MODULE_ID, CLEAR_ALL_MODE_KEY, {
        name: 'Clear All Mode (GM)',
        hint: 'When the GM uses Clear All (Shift+Delete), should it remove rings only for the GM or for all connected players?',
        scope: 'world',
        config: true,
        restricted: true,
        type: String,
        choices: {
            'self': 'GM Only',
            'all': 'All Players'
        },
        default: 'self'
    });

    game.settings.register(MODULE_ID, 'broadcastDuration', {
        name: 'Broadcast Duration (Seconds)',
        hint: 'How long the rings remain visible when broadcasted by the GM.',
        scope: 'world',
        config: true,
        type: Number,
        default: 7,
        range: { min: 1, max: 30, step: 1 }
    });
    // ---------------------------------------------

    game.settings.register(MODULE_ID, 'coverageThreshold', {
        name: 'Grid Coverage Threshold',
        hint: 'How much of the token must be inside the range to count? (0.01 = just touching, 0.5 = 50% coverage).',
        scope: 'world',
        config: true,
        restricted: true,
        type: Number,
        range: { min: 0.01, max: 1.0, step: 0.01 },
        default: 0.10,
        onChange: () => { }
    });

    game.settings.register(MODULE_ID, 'calculationMode', {
        name: 'Calculation Mode',
        hint: 'Choose how elevation affects distance measurement.',
        scope: 'world',
        config: true,
        restricted: true,
        type: String,
        choices: {
            "auto": "Auto (3D - Default)",
            "flat": "Flat (2D Only - Ignore Height)",
            "both": "Both (Show 3D & 2D)"
        },
        default: "auto",
        onChange: () => { }
    });

    game.settings.register(MODULE_ID, 'textSize', {
        name: 'Text Size',
        hint: 'Choose the size of the text labels.',
        scope: 'client',
        config: false,
        type: String,
        choices: { "small": "Small", "normal": "Normal", "large": "Large" },
        default: "normal",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'colorPalette', {
        name: 'Color Palette',
        hint: 'Choose the color theme for the distance rings.',
        scope: 'client',
        config: false,
        type: String,
        choices: paletteChoices,
        default: "default",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'lineStyle', {
        name: 'Line Style',
        hint: 'Choose the line style for the distance rings.',
        scope: 'client',
        config: false,
        type: String,
        choices: { "solid": "Solid", "dotted": "Dotted", "dashed": "Dashed" },
        default: "solid",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'lineThickness', {
        name: 'Line Thickness',
        hint: 'Adjust the thickness of the distance rings.',
        scope: 'client',
        config: false,
        type: String,
        choices: { "2px": "Normal", "5px": "Large", "8px": "Extra Large", "12px": "Massive" },
        default: "2px",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'fillStyle', {
        name: 'Gradient Fill Style',
        hint: 'Choose the style of the gradient fill.',
        scope: 'client',
        config: false,
        type: String,
        choices: {
            "static": "Static",
            "animated-normal": "Animated - Normal",
            "animated-light": "Animated - Light",
            "none": "None"
        },
        default: "animated-light",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'targetHighlighting', {
        name: 'Target Highlighting',
        hint: 'Highlight tokens that are inside your range rings with the corresponding color.',
        scope: 'client',
        config: false,
        type: Boolean,
        default: true,
        onChange: () => {
            const highlights = document.querySelectorAll('.dhd-highlight-ring');
            highlights.forEach(h => h.remove());
        }
    });
}

/**
 * Registers all module keybindings with Foundry's keybinding registry.
 * Called from CombatDistances.initialize() during the init hook.
 * @param {typeof CombatDistances} CombatDistances
 */
export function registerKeybindings(CombatDistances) {
    game.keybindings.register(MODULE_ID, "toggleRings", {
        name: "Toggle Combat Distances",
        hint: "Toggle the distance rings for the selected token(s). Default: R",
        editable: [{ key: "KeyR" }],
        onDown: () => { CombatDistances.Toggle({ remote: false }); return true; },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    // Corrected deprecation warning for V13: using namespaced KeyboardManager
    game.keybindings.register(MODULE_ID, "broadcastRings", {
        name: "Broadcast Rings (GM Only)",
        hint: "Shows rings to ALL players for a short duration. Default: Shift+R",
        editable: [{ key: "KeyR", modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances.Toggle({ remote: true });
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, "massMeasurement", {
        name: "Mass Measurement",
        hint: "Toggle mass measurement from the center of selected tokens. Default: M",
        editable: [{ key: "KeyM" }],
        onDown: () => {
            CombatDistances.MassMeasurement();
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, 'transientHoverGM', {
        name: 'Temporary Hover Mode (GM)',
        hint: 'While held, activates Hover Mode (GM) regardless of the Operation Mode setting. Default: Shift+H',
        editable: [{ key: 'KeyH', modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances._transientMode = 'hover-gm';
            return true;
        },
        onUp: () => {
            CombatDistances._transientMode = null;
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, 'clearAll', {
        name: 'Clear All Rings',
        hint: 'Remove all active distance rings at once. Default: Shift+Delete',
        editable: [{ key: 'Delete', modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances.ClearAll();
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, 'transientHoverBroadcast', {
        name: 'Temporary Hover Mode (Broadcast)',
        hint: 'While held, activates Hover Mode (Broadcast) regardless of the Operation Mode setting. Default: Shift+B',
        editable: [{ key: 'KeyB', modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances._transientMode = 'hover-broadcast';
            return true;
        },
        onUp: () => {
            CombatDistances._transientMode = null;
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });
}
