/*!
 * Daggerheart: Distances
 * 2025 https://github.com/brunocalado
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3.
 */
export const MODULE_ID = "daggerheart-distances";

export const CLEAR_ALL_MODE_KEY = 'clearAllMode';

export const PALETTES = {
    "default": {
        label: "DHD.palettes.trafficLight",
        colors: {
            ring1: "#ff0000",
            ring2: "#ffa500",
            ring3: "#ffff00",
            ring4: "#90ee90"
        }
    },
    "option2": {
        label: "DHD.palettes.inverseTrafficLight",
        colors: {
            ring1: "#90ee90",
            ring2: "#ffff00",
            ring3: "#ffa500",
            ring4: "#ff0000"
        }
    },
    "option3": {
        label: "DHD.palettes.synthwave",
        colors: {
            ring1: "#ff00ff", // Magenta
            ring2: "#bd00ff", // Electric Purple
            ring3: "#00aaff", // Dodger Blue
            ring4: "#00ffff"  // Cyan
        }
    },
    "option4": {
        label: "DHD.palettes.trueFire",
        colors: {
            ring1: "#ff0000", // Pure Red
            ring2: "#ff4500", // Orange Red
            ring3: "#ffa500", // Orange
            ring4: "#ffcc00"  // Golden Yellow
        }
    }
};

// `id` matches the Daggerheart system's range ids (CONFIG.DH.GENERAL.range) so the public API
// speaks the same vocabulary as the system's own `isWithinRange`.
export const DEFAULTS = {
    ranges: {
        ring1: { id: "melee",     distance: 5,  label: "DHD.ranges.melee" },
        ring2: { id: "veryClose", distance: 15, label: "DHD.ranges.veryClose" },
        ring3: { id: "close",     distance: 30, label: "DHD.ranges.close" },
        ring4: { id: "far",       distance: 60, label: "DHD.ranges.far" }
    }
};
