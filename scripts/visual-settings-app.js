import { MODULE_ID, PALETTES } from './constants.js';

// Wired by registration.js via initVisualSettingsApp() before the menu is registered.
let _refreshAll = null;

/**
 * Wires the refresh callback invoked after visual settings are saved.
 * Must be called before game.settings.registerMenu so _refreshAll is set by submit time.
 * @param {Function} fn
 */
export function initVisualSettingsApp(fn) {
    _refreshAll = fn;
}

/**
 * Custom settings dialog for visual appearance options.
 * Opened via the settings menu button registered with game.settings.registerMenu.
 * Lifecycle: rendered via HandlebarsApplicationMixin, submitted via AppV2 form handler.
 */
class VisualSettingsApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: 'dhd-visual-settings',
        classes: ['daggerheart-distances'],
        tag: 'form',
        form: {
            // Arrow wrapper defers evaluation until after class definition
            handler: (...args) => VisualSettingsApp._onSubmit(...args),
            closeOnSubmit: true
        },
        window: {
            title: 'Daggerheart Distances — Visual Settings'
        },
        position: {
            width: 480,
            height: 'auto'
        }
    };

    static PARTS = {
        form: {
            template: 'modules/daggerheart-distances/templates/visual-settings.hbs'
        }
    };

    /**
     * Populates the template context with current setting values and available choices.
     * Triggered by the AppV2 render lifecycle.
     * @param {object} options
     * @returns {Promise<object>}
     */
    async _prepareContext(options) {
        const id = MODULE_ID;
        return {
            textSize: {
                value: game.settings.get(id, 'textSize'),
                choices: { small: 'Small', normal: 'Normal', large: 'Large' }
            },
            colorPalette: {
                value: game.settings.get(id, 'colorPalette'),
                choices: Object.keys(PALETTES).reduce((acc, key) => {
                    acc[key] = PALETTES[key].label;
                    return acc;
                }, {})
            },
            lineStyle: {
                value: game.settings.get(id, 'lineStyle'),
                choices: { solid: 'Solid', dotted: 'Dotted', dashed: 'Dashed' }
            },
            lineThickness: {
                value: game.settings.get(id, 'lineThickness'),
                choices: { '2px': 'Normal', '5px': 'Large', '8px': 'Extra Large', '12px': 'Massive' }
            },
            fillStyle: {
                value: game.settings.get(id, 'fillStyle'),
                choices: {
                    'static': 'Static',
                    'animated-normal': 'Animated - Normal',
                    'animated-light': 'Animated - Light',
                    'none': 'None'
                }
            },
            targetHighlighting: game.settings.get(id, 'targetHighlighting')
        };
    }

    /**
     * Persists all visual settings and triggers a canvas refresh.
     * Checkbox coercion is explicit: unchecked boxes are absent from FormDataExtended.
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {FormDataExtended} formData
     */
    static async _onSubmit(event, form, formData) {
        const id = MODULE_ID;
        const data = formData.object;
        await game.settings.set(id, 'textSize',           data.textSize);
        await game.settings.set(id, 'colorPalette',       data.colorPalette);
        await game.settings.set(id, 'lineStyle',          data.lineStyle);
        await game.settings.set(id, 'lineThickness',      data.lineThickness);
        await game.settings.set(id, 'fillStyle',          data.fillStyle);
        await game.settings.set(id, 'targetHighlighting', data.targetHighlighting === 'true' || data.targetHighlighting === true);
        _refreshAll?.();
    }
}

export { VisualSettingsApp };
