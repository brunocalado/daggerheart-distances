/*!
 * Daggerheart: Distances
 * 2025 https://github.com/brunocalado
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3.
 */
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
        name: 'DHD.settings.visualSettingsMenu.name',
        label: 'DHD.settings.visualSettingsMenu.label',
        hint: 'DHD.settings.visualSettingsMenu.hint',
        icon: 'fas fa-palette',
        type: VisualSettingsApp,
        restricted: false
    });

    game.settings.register(MODULE_ID, 'operationMode', {
        name: 'DHD.settings.operationMode.name',
        hint: 'DHD.settings.operationMode.hint',
        scope: 'world',
        config: true,
        restricted: true,
        type: String,
        choices: {
            'manual':           'DHD.settings.operationMode.manual',
            'hover-gm':         'DHD.settings.operationMode.hoverGM',
            'hover-broadcast':  'DHD.settings.operationMode.hoverBroadcast'
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
        name: 'DHD.settings.clearAllMode.name',
        hint: 'DHD.settings.clearAllMode.hint',
        scope: 'world',
        config: true,
        restricted: true,
        type: String,
        choices: {
            'self': 'DHD.settings.clearAllMode.self',
            'all': 'DHD.settings.clearAllMode.all'
        },
        default: 'self'
    });

    game.settings.register(MODULE_ID, 'broadcastDuration', {
        name: 'DHD.settings.broadcastDuration.name',
        hint: 'DHD.settings.broadcastDuration.hint',
        scope: 'world',
        config: true,
        type: Number,
        default: 7,
        range: { min: 1, max: 30, step: 1 }
    });
    // ---------------------------------------------

    game.settings.register(MODULE_ID, 'coverageThreshold', {
        name: 'DHD.settings.coverageThreshold.name',
        hint: 'DHD.settings.coverageThreshold.hint',
        scope: 'world',
        config: true,
        restricted: true,
        type: Number,
        range: { min: 0.01, max: 1.0, step: 0.01 },
        default: 0.10,
        onChange: () => { }
    });

    game.settings.register(MODULE_ID, 'calculationMode', {
        name: 'DHD.settings.calculationMode.name',
        hint: 'DHD.settings.calculationMode.hint',
        scope: 'world',
        config: true,
        restricted: true,
        type: String,
        choices: {
            "auto": "DHD.settings.calculationMode.auto",
            "flat": "DHD.settings.calculationMode.flat",
            "both": "DHD.settings.calculationMode.both"
        },
        default: "auto",
        onChange: () => { }
    });

    game.settings.register(MODULE_ID, 'textSize', {
        name: 'DHD.settings.textSize.name',
        hint: 'DHD.settings.textSize.hint',
        scope: 'client',
        config: false,
        type: String,
        choices: {
            "small": "DHD.settings.textSize.small",
            "normal": "DHD.settings.textSize.normal",
            "large": "DHD.settings.textSize.large"
        },
        default: "normal",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'colorPalette', {
        name: 'DHD.settings.colorPalette.name',
        hint: 'DHD.settings.colorPalette.hint',
        scope: 'client',
        config: false,
        type: String,
        choices: paletteChoices,
        default: "default",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'lineStyle', {
        name: 'DHD.settings.lineStyle.name',
        hint: 'DHD.settings.lineStyle.hint',
        scope: 'client',
        config: false,
        type: String,
        choices: {
            "solid": "DHD.settings.lineStyle.solid",
            "dotted": "DHD.settings.lineStyle.dotted",
            "dashed": "DHD.settings.lineStyle.dashed"
        },
        default: "solid",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'lineThickness', {
        name: 'DHD.settings.lineThickness.name',
        hint: 'DHD.settings.lineThickness.hint',
        scope: 'client',
        config: false,
        type: String,
        choices: {
            "2px": "DHD.settings.lineThickness.normal",
            "5px": "DHD.settings.lineThickness.large",
            "8px": "DHD.settings.lineThickness.extraLarge",
            "12px": "DHD.settings.lineThickness.massive"
        },
        default: "2px",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'fillStyle', {
        name: 'DHD.settings.fillStyle.name',
        hint: 'DHD.settings.fillStyle.hint',
        scope: 'client',
        config: false,
        type: String,
        choices: {
            "static": "DHD.settings.fillStyle.static",
            "animated-normal": "DHD.settings.fillStyle.animatedNormal",
            "animated-light": "DHD.settings.fillStyle.animatedLight",
            "none": "DHD.settings.fillStyle.none"
        },
        default: "animated-light",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'targetHighlighting', {
        name: 'DHD.settings.targetHighlighting.name',
        hint: 'DHD.settings.targetHighlighting.hint',
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
        name: "DHD.keybindings.toggleRings.name",
        hint: "DHD.keybindings.toggleRings.hint",
        editable: [{ key: "KeyR" }],
        onDown: () => { CombatDistances.toggle({ remote: false }); return true; },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    // Corrected deprecation warning for V13: using namespaced KeyboardManager
    game.keybindings.register(MODULE_ID, "broadcastRings", {
        name: "DHD.keybindings.broadcastRings.name",
        hint: "DHD.keybindings.broadcastRings.hint",
        editable: [{ key: "KeyR", modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances.toggle({ remote: true });
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, "massMeasurement", {
        name: "DHD.keybindings.massMeasurement.name",
        hint: "DHD.keybindings.massMeasurement.hint",
        editable: [{ key: "KeyM" }],
        onDown: () => {
            CombatDistances.massMeasurement();
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, 'transientHoverGM', {
        name: 'DHD.keybindings.transientHoverGM.name',
        hint: 'DHD.keybindings.transientHoverGM.hint',
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
        name: 'DHD.keybindings.clearAll.name',
        hint: 'DHD.keybindings.clearAll.hint',
        editable: [{ key: 'Delete', modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances.clearAll();
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, 'transientHoverBroadcast', {
        name: 'DHD.keybindings.transientHoverBroadcast.name',
        hint: 'DHD.keybindings.transientHoverBroadcast.hint',
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
