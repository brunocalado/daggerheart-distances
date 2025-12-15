class CombatDistances {
    static ID = 'daggerheart-distances';
    static _tickerFunc = null; 
    
    // Local storage of which tokens are active ONLY for this client
    static _activeTokens = new Set();

    // Color Palette Configurations
    static PALETTES = {
        "default": {
            label: "Option 1 (Traffic Light)",
            colors: {
                ring1: "#ff0000", // Red
                ring2: "#ffa500", // Orange
                ring3: "#ffff00", // Yellow
                ring4: "#90ee90"  // Light green
            }
        },
        "option2": {
            label: "Option 2 (Inverse Traffic Light)",
            colors: {
                ring1: "#90ee90", // Light green
                ring2: "#ffff00", // Yellow
                ring3: "#ffa500", // Orange
                ring4: "#ff0000"  // Red
            }
        },
        "option3": {
            label: "Option 3 (Neon Cyberpunk)",
            colors: {
                ring1: "#ff0055", // Neon Pink
                ring2: "#ffcc00", // Electric Amber
                ring3: "#00ff99", // Matrix Green
                ring4: "#00ccff"  // Laser Blue
            }
        },
        "option4": {
            label: "Option 4 (Warm Sunset)",
            colors: {
                ring1: "#785ef0", // Intense Purple
                ring2: "#dc267f", // Fuchsia
                ring3: "#fe6100", // Burnt Orange
                ring4: "#ffb000"  // Gold/Yellow
            }
        }
    };

    // Static Configuration
    static DEFAULTS = {
        ranges: {
            ring1: {
                distance: 5,
                label: "Melee"
            },
            ring2: {
                distance: 15,
                label: "Very Close"
            },
            ring3: {
                distance: 30,
                label: "Close"
            },
            ring4: {
                distance: 60,
                label: "Far"
            }
        }
    };

    static initialize() {
        this.registerSettings();
        this.registerKeybindings();

        // Main Token Logic Hooks
        Hooks.on('renderTokenHUD', this.onRenderTokenHUD.bind(this));
        Hooks.on('deleteToken', this.onDeleteToken.bind(this));
        Hooks.on('hoverToken', this.onHoverToken.bind(this));
        Hooks.on('updateToken', this.onUpdateToken.bind(this)); 

        // Canvas Lifecycle Hooks
        Hooks.on('canvasReady', this.startTicker.bind(this));
        Hooks.on('canvasTearDown', this.stopTicker.bind(this));
        
        // Fallback: ensures update on Pan even if the ticker misses a frame
        Hooks.on('canvasPan', this.onCanvasPan.bind(this));

        // Global API for Macros
        window.DHDistances = this;
    }

    // --- Public API ---

    /**
     * Toggles the rings for the selected tokens.
     * Can be called via macro: DHDistances.Toggle()
     */
    static Toggle() {
        const tokens = canvas.tokens.controlled;
        if (tokens.length === 0) {
            ui.notifications.warn("Daggerheart Distances: Select a token first.");
            return;
        }

        tokens.forEach(token => {
            if (this.hasRings(token.id)) {
                this.removeRings(token.id);
            } else {
                this.createRings(token);
            }
        });

        // Visually update the HUD if it is open for one of the changed tokens
        if (canvas.tokens.hud.rendered && tokens.some(t => t.id === canvas.tokens.hud.object?.id)) {
            canvas.tokens.hud.render();
        }
    }

    static registerSettings() {
        const paletteChoices = Object.keys(this.PALETTES).reduce((choices, key) => {
            choices[key] = this.PALETTES[key].label;
            return choices;
        }, {});

        game.settings.register(this.ID, 'textSize', {
            name: 'Text Size',
            hint: 'Choose the size of the text labels.',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                "small": "Small",
                "normal": "Normal",
                "large": "Large"
            },
            default: "normal",
            onChange: () => this.refreshAll()
        });

        game.settings.register(this.ID, 'colorPalette', {
            name: 'Color Palette',
            hint: 'Choose the color theme for the distance rings.',
            scope: 'client',
            config: true,
            type: String,
            choices: paletteChoices,
            default: "default",
            onChange: () => this.refreshAll()
        });

        game.settings.register(this.ID, 'lineStyle', {
            name: 'Line Style',
            hint: 'Choose the line style for the distance rings.',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                "solid": "Solid",
                "dotted": "Dotted",
                "dashed": "Dashed"
            },
            default: "solid",
            onChange: () => this.refreshAll()
        });

        game.settings.register(this.ID, 'lineThickness', {
            name: 'Line Thickness',
            hint: 'Adjust the thickness of the distance rings.',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                "2px": "Normal",
                "5px": "Large",
                "8px": "Extra Large",
                "12px": "Massive"
            },
            default: "2px",
            onChange: () => this.refreshAll()
        });

        game.settings.register(this.ID, 'fillStyle', {
            name: 'Gradient Fill Style',
            hint: 'Choose the style of the gradient fill.',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                "static": "Static",
                "animated-normal": "Animated - Normal",
                "animated-light": "Animated - Light",
                "none": "None"
            },
            default: "animated-light",
            onChange: () => this.refreshAll()
        });
    }

    static registerKeybindings() {
        game.keybindings.register(this.ID, "toggleRings", {
            name: "Toggle Combat Distances",
            hint: "Toggle the distance rings for the selected token(s). Default: R",
            editable: [
                { key: "KeyR" }
            ],
            onDown: () => {
                this.Toggle();
                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
    }

    // --- Ticker Management ---

    static startTicker() {
        this.stopTicker(); 
        
        this._tickerFunc = this.onTicker.bind(this);
        canvas.app.ticker.add(this._tickerFunc);
        
        this.refreshAll();
    }

    static stopTicker() {
        if (this._tickerFunc) {
            canvas.app.ticker.remove(this._tickerFunc);
            this._tickerFunc = null;
        }
        const container = document.getElementById('combat-distances-container');
        if (container) container.innerHTML = '';
        
        // Optional: Clear the Set when changing scenes if you want to reset everything
        // this._activeTokens.clear();
    }

    static onTicker() {
        if (!canvas || !canvas.ready || !canvas.tokens) return;

        const rings = document.getElementsByClassName('range-ring');
        const hoverLabels = document.getElementsByClassName('combat-distance-hover-label');

        if (rings.length === 0 && hoverLabels.length === 0) return;

        for (let ring of rings) {
            const tokenId = ring.dataset.tokenId;
            const token = canvas.tokens.get(tokenId);
            const dist = parseFloat(ring.dataset.rangeDistance);
            
            if (token && dist && token.visible) {
                this.updateRingPositionAndSize(ring, token, dist);
            } else {
                ring.style.display = 'none'; 
            }
        }

        for (let label of hoverLabels) {
            const tokenId = label.dataset.hoverTokenId;
            const token = canvas.tokens.get(tokenId);
            if (token && token.visible) {
                this.updateHoverLabelPosition(label, token);
            } else {
                label.style.display = 'none';
            }
        }
    }

    // --- Coordinate Helpers ---

    static getWorldToScreen(point) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return {x: 0, y: 0};
        return canvas.stage.worldTransform.apply(point);
    }

    // --- Event Handlers ---

    static onCanvasPan(canvas, position) {
        this.onTicker();
    }

    static onHoverToken(token, hovered) {
        if (!hovered) {
            this.removeHoverLabel(token.id);
            return;
        }

        const controlled = canvas.tokens.controlled;
        if (controlled.length !== 1) return;

        const sourceToken = controlled[0];
        if (sourceToken.id === token.id) return;

        let distance = 0;
        try {
            const measurement = canvas.grid.measurePath([sourceToken.center, token.center]);
            distance = measurement.distance;
        } catch (e) {
            return;
        }

        const labelText = this.getDistanceLabel(distance);
        this.createHoverLabel(token, labelText, distance);
    }

    static getDistanceLabel(distance) {
        const ranges = Object.values(this.DEFAULTS.ranges).sort((a, b) => a.distance - b.distance);
        for (const range of ranges) {
            if (distance <= range.distance) {
                return range.label;
            }
        }
        return "Very Far";
    }

    static createHoverLabel(token, text, distance) {
        this.removeHoverLabel(token.id);

        const container = this.getContainer();
        const textSize = game.settings.get(this.ID, 'textSize');
        
        const label = document.createElement('div');
        label.classList.add('combat-distance-hover-label', `text-${textSize}`);
        label.dataset.hoverTokenId = token.id;
        
        label.innerHTML = `<span class="category">${text}</span><span class="dist">(${Math.round(distance)}')</span>`;
        
        container.appendChild(label);
        this.updateHoverLabelPosition(label, token);
    }

    static updateHoverLabelPosition(labelElement, token) {
        if (!labelElement || !token) return;

        const worldPos = { x: token.center.x, y: token.y };
        const screenPos = this.getWorldToScreen(worldPos);

        labelElement.style.left = `${screenPos.x}px`;
        labelElement.style.top = `${screenPos.y}px`;
        labelElement.style.display = ''; 
    }

    static removeHoverLabel(tokenId) {
        const labels = document.querySelectorAll(`.combat-distance-hover-label[data-hover-token-id="${tokenId}"]`);
        labels.forEach(label => label.remove());
    }

    static getContainer() {
        let container = document.getElementById('combat-distances-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'combat-distances-container';
            document.body.appendChild(container);
        }
        return container;
    }

    static createRings(token) {
        this.removeRings(token.id);
        
        const currentRanges = this.ranges;
        const lineStyle = game.settings.get(this.ID, 'lineStyle');
        const lineThickness = game.settings.get(this.ID, 'lineThickness');
        const fillStyle = game.settings.get(this.ID, 'fillStyle');
        const paletteKey = game.settings.get(this.ID, 'colorPalette');
        const textSize = game.settings.get(this.ID, 'textSize');
        
        const currentPalette = this.PALETTES[paletteKey] || this.PALETTES['default'];
        const container = this.getContainer();
        
        Object.entries(currentRanges).forEach(([rangeKey, rangeData]) => {
            const ring = document.createElement('div');
            ring.dataset.tokenId = token.id;
            ring.dataset.rangeDistance = rangeData.distance; 
            ring.classList.add('range-ring', rangeKey);
            
            ring.style.borderStyle = lineStyle;
            ring.style.borderWidth = lineThickness;
            
            let color = currentPalette.colors[rangeKey] || '#000000';
            let r, g, b;
            if (color.startsWith('#')) {
                r = parseInt(color.slice(1, 3), 16);
                g = parseInt(color.slice(3, 5), 16);
                b = parseInt(color.slice(5, 7), 16);
            } else { r=0; g=0; b=0; }

            ring.style.borderColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

            if (fillStyle !== 'none') {
                ring.style.setProperty('--ring-r', r);
                ring.style.setProperty('--ring-g', g);
                ring.style.setProperty('--ring-b', b);
                ring.classList.add(fillStyle);
            } else {
                ring.style.background = 'transparent';
            }

            const label = document.createElement('div');
            label.classList.add('range-label', `text-${textSize}`);
            const distVal = parseFloat(rangeData.distance) || 0;
            const formattedDistance = Number.isInteger(distVal) ? distVal : distVal.toFixed(1);
            
            label.innerHTML = `<span class="category">${rangeData.label}</span> <span class="dist">(${formattedDistance}')</span>`;
            
            ring.appendChild(label);
            container.appendChild(ring);
            
            this.updateRingPositionAndSize(ring, token, rangeData.distance);
        });

        // Tracks token in local Set
        this._activeTokens.add(token.id);
    }

    static updateRingPositionAndSize(ring, token, baseDistance) {
        const center = token.center;
        const screenPos = this.getWorldToScreen(center);
        const gridDist = baseDistance / canvas.scene.grid.distance;
        const worldDiameter = gridDist * 2 * canvas.grid.size;
        const screenDiameter = worldDiameter * canvas.stage.scale.x;

        ring.style.width = `${screenDiameter}px`;
        ring.style.height = `${screenDiameter}px`;
        ring.style.left = `${screenPos.x}px`;
        ring.style.top = `${screenPos.y}px`;
        ring.style.display = ''; 
    }

    static refreshAll() {
        if (canvas && canvas.tokens) {
            canvas.tokens.placeables.forEach(token => {
                if (this.hasRings(token.id)) {
                    this.removeRings(token.id);
                    this.createRings(token);
                }
            });
        }
    }

    static get ranges() {
        return this.DEFAULTS.ranges;
    }

    static onRenderTokenHUD(hud, html, tokenData) {
        const button = $(`
            <div class="control-icon" title="Toggle Combat Distances">
                <i class="fas fa-circle-dot"></i>
            </div>
        `);

        const token = canvas.tokens.get(tokenData._id);
        if (!token) return;
        
        // Check local Set
        if (this.hasRings(token.id)) {
            button.addClass('active');
        }

        button.click(async (event) => {
            event.preventDefault();
            this.Toggle();
        });

        $(html).find('div.left').append(button);
    }

    static removeRings(tokenId) {
        const rings = document.querySelectorAll(`.range-ring[data-token-id="${tokenId}"]`);
        rings.forEach(ring => ring.remove());
        
        // Remove from local Set
        this._activeTokens.delete(tokenId);
    }

    static hasRings(tokenId) {
        // Check against local Set
        return this._activeTokens.has(tokenId);
    }

    static onUpdateToken(tokenDocument, changes) {
        // Ticker handles position updates.
        // We only need to ensure that if the ID is still in the Set, it continues to be processed.
    }

    static onDeleteToken(tokenDocument) {
        this.removeRings(tokenDocument.id);
        this.removeHoverLabel(tokenDocument.id);
        // Extra cleanup guarantee
        this._activeTokens.delete(tokenDocument.id);
    }
}

Hooks.once('init', () => {
    CombatDistances.initialize();
});