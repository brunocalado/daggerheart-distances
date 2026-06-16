import { MODULE_ID, PALETTES } from './constants.js';
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
        name: game.i18n.localize('DHD.settings.visualSettingsMenu.name'),
        label: game.i18n.localize('DHD.settings.visualSettingsMenu.label'),
        hint: game.i18n.localize('DHD.settings.visualSettingsMenu.hint'),
        icon: 'fas fa-palette',
        type: VisualSettingsApp,
        restricted: false
    });

    game.settings.register(MODULE_ID, 'operationMode', {
        name: game.i18n.localize('DHD.settings.operationMode.name'),
        hint: game.i18n.localize('DHD.settings.operationMode.hint'),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'manual':           game.i18n.localize('DHD.settings.operationMode.choice.manual'),
            'hover-gm':         game.i18n.localize('DHD.settings.operationMode.choice.hoverGM'),
            'hover-broadcast':  game.i18n.localize('DHD.settings.operationMode.choice.hoverBroadcast')
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

    game.settings.register(MODULE_ID, 'broadcastDuration', {
        name: game.i18n.localize('DHD.settings.broadcastDuration.name'),
        hint: game.i18n.localize('DHD.settings.broadcastDuration.hint'),
        scope: 'world',
        config: true,
        type: Number,
        default: 7,
        range: { min: 1, max: 30, step: 1 }
    });
    // ---------------------------------------------

    game.settings.register(MODULE_ID, 'coverageThreshold', {
        name: game.i18n.localize('DHD.settings.coverageThreshold.name'),
        hint: game.i18n.localize('DHD.settings.coverageThreshold.hint'),
        scope: 'client',
        config: true,
        type: Number,
        range: { min: 0.01, max: 1.0, step: 0.01 },
        default: 0.10,
        onChange: () => { }
    });

    game.settings.register(MODULE_ID, 'calculationMode', {
        name: game.i18n.localize('DHD.settings.calculationMode.name'),
        hint: game.i18n.localize('DHD.settings.calculationMode.hint'),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            "auto": game.i18n.localize('DHD.settings.calculationMode.choice.auto'),
            "flat": game.i18n.localize('DHD.settings.calculationMode.choice.flat'),
            "both": game.i18n.localize('DHD.settings.calculationMode.choice.both')
        },
        default: "auto",
        onChange: () => { }
    });

    game.settings.register(MODULE_ID, 'textSize', {
        name: game.i18n.localize('DHD.settings.textSize.name'),
        hint: game.i18n.localize('DHD.settings.textSize.hint'),
        scope: 'client',
        config: false,
        type: String,
        choices: { 
            "small": game.i18n.localize('DHD.settings.textSize.choice.small'), 
            "normal": game.i18n.localize('DHD.settings.textSize.choice.normal'), 
            "large": game.i18n.localize('DHD.settings.textSize.choice.large') 
        },
        default: "normal",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'colorPalette', {
        name: game.i18n.localize('DHD.settings.colorPalette.name'),
        hint: game.i18n.localize('DHD.settings.colorPalette.hint'),
        scope: 'client',
        config: false,
        type: String,
        choices: paletteChoices,
        default: "default",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'lineStyle', {
        name: game.i18n.localize('DHD.settings.lineStyle.name'),
        hint: game.i18n.localize('DHD.settings.lineStyle.hint'),
        scope: 'client',
        config: false,
        type: String,
        choices: { 
            "solid": game.i18n.localize('DHD.settings.lineStyle.choice.solid'), 
            "dotted": game.i18n.localize('DHD.settings.lineStyle.choice.dotted'), 
            "dashed": game.i18n.localize('DHD.settings.lineStyle.choice.dashed') 
        },
        default: "solid",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'lineThickness', {
        name: game.i18n.localize('DHD.settings.lineThickness.name'),
        hint: game.i18n.localize('DHD.settings.lineThickness.hint'),
        scope: 'client',
        config: false,
        type: String,
        choices: { 
            "2px": game.i18n.localize('DHD.settings.lineThickness.choice.normal'), 
            "5px": game.i18n.localize('DHD.settings.lineThickness.choice.large'), 
            "8px": game.i18n.localize('DHD.settings.lineThickness.choice.extraLarge'), 
            "12px": game.i18n.localize('DHD.settings.lineThickness.choice.massive') 
        },
        default: "2px",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'fillStyle', {
        name: game.i18n.localize('DHD.settings.fillStyle.name'),
        hint: game.i18n.localize('DHD.settings.fillStyle.hint'),
        scope: 'client',
        config: false,
        type: String,
        choices: {
            "static": game.i18n.localize('DHD.settings.fillStyle.choice.static'),
            "animated-normal": game.i18n.localize('DHD.settings.fillStyle.choice.animatedNormal'),
            "animated-light": game.i18n.localize('DHD.settings.fillStyle.choice.animatedLight'),
            "none": game.i18n.localize('DHD.settings.fillStyle.choice.none')
        },
        default: "animated-light",
        onChange: () => CombatDistances.refreshAll()
    });

    game.settings.register(MODULE_ID, 'targetHighlighting', {
        name: game.i18n.localize('DHD.settings.targetHighlighting.name'),
        hint: game.i18n.localize('DHD.settings.targetHighlighting.hint'),
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
        name: game.i18n.localize('DHD.keybindings.toggleRings.name'),
        hint: game.i18n.localize('DHD.keybindings.toggleRings.hint'),
        editable: [{ key: "KeyR" }],
        onDown: () => { CombatDistances.Toggle({ remote: false }); return true; },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    // Corrected deprecation warning for V13: using namespaced KeyboardManager
    game.keybindings.register(MODULE_ID, "broadcastRings", {
        name: game.i18n.localize('DHD.keybindings.broadcastRings.name'),
        hint: game.i18n.localize('DHD.keybindings.broadcastRings.hint'),
        editable: [{ key: "KeyR", modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.SHIFT] }],
        onDown: () => {
            CombatDistances.Toggle({ remote: true });
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, "massMeasurement", {
        name: game.i18n.localize('DHD.keybindings.massMeasurement.name'),
        hint: game.i18n.localize('DHD.keybindings.massMeasurement.hint'),
        editable: [{ key: "KeyM" }],
        onDown: () => {
            CombatDistances.MassMeasurement();
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });

    game.keybindings.register(MODULE_ID, 'transientHoverGM', {
        name: game.i18n.localize('DHD.keybindings.transientHoverGM.name'),
        hint: game.i18n.localize('DHD.keybindings.transientHoverGM.hint'),
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

    game.keybindings.register(MODULE_ID, 'transientHoverBroadcast', {
        name: game.i18n.localize('DHD.keybindings.transientHoverBroadcast.name'),
        hint: game.i18n.localize('DHD.keybindings.transientHoverBroadcast.hint'),
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

    game.keybindings.register(MODULE_ID, 'clearAll', {
        name: game.i18n.localize('DHD.keybindings.clearAll.name'),
        hint: game.i18n.localize('DHD.keybindings.clearAll.hint'),
        editable: [{ key: 'KeyC', modifiers: [foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.CONTROL,
                                              foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS.ALT] }],
        onDown: () => {
            CombatDistances.clearAll();
            return true;
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });
}
