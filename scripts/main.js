class CombatDistances {
    static ID = 'daggerheart-distances';
    static _tickerFunc = null; 
    
    // Key: Token ID, Value: { mode: string|null }
    static _activeTokens = new Map();

    static PALETTES = {
        "default": {
            label: "Traffic Light",
            colors: {
                ring1: "#ff0000",
                ring2: "#ffa500",
                ring3: "#ffff00",
                ring4: "#90ee90"
            }
        },
        "option2": {
            label: "Inverse Traffic Light",
            colors: {
                ring1: "#90ee90",
                ring2: "#ffff00",
                ring3: "#ffa500",
                ring4: "#ff0000"
            }
        },
        "option3": {
            label: "Synthwave",
            colors: {
                ring1: "#ff00ff", // Magenta
                ring2: "#bd00ff", // Electric Purple
                ring3: "#00aaff", // Dodger Blue
                ring4: "#00ffff"  // Cyan
            }
        },
        "option4": {
            label: "True Fire",
            colors: {
                ring1: "#ff0000", // Pure Red
                ring2: "#ff4500", // Orange Red
                ring3: "#ffa500", // Orange
                ring4: "#ffcc00"  // Golden Yellow
            }
        }
    };

    static DEFAULTS = {
        ranges: {
            ring1: { distance: 5, label: "Melee" },
            ring2: { distance: 15, label: "Very Close" },
            ring3: { distance: 30, label: "Close" },
            ring4: { distance: 60, label: "Far" }
        }
    };

    static initialize() {
        this.registerSettings();
        this.registerKeybindings();

        Hooks.on('renderTokenHUD', this.onRenderTokenHUD.bind(this));
        Hooks.on('deleteToken', this.onDeleteToken.bind(this));
        Hooks.on('hoverToken', this.onHoverToken.bind(this));
        Hooks.on('updateToken', this.onUpdateToken.bind(this)); 

        Hooks.on('canvasReady', this.startTicker.bind(this));
        Hooks.on('canvasTearDown', this.stopTicker.bind(this));
        Hooks.on('canvasPan', this.onCanvasPan.bind(this));

        window.DHDistances = this;
    }

    // --- Public API ---

    static Toggle(options = {}) {
        const tokens = canvas.tokens.controlled;
        if (tokens.length === 0) {
            ui.notifications.warn("Daggerheart Distances: Select a token first.");
            return;
        }

        tokens.forEach(token => {
            if (this.hasRings(token.id)) {
                this.removeRings(token.id);
            } else {
                this.createRings(token, options);
            }
        });

        if (canvas.tokens.hud.rendered && tokens.some(t => t.id === canvas.tokens.hud.object?.id)) {
            canvas.tokens.hud.render();
        }
    }

    static registerSettings() {
        const paletteChoices = Object.keys(this.PALETTES).reduce((choices, key) => {
            choices[key] = this.PALETTES[key].label;
            return choices;
        }, {});

        game.settings.register(this.ID, 'coverageThreshold', {
            name: 'Grid Coverage Threshold',
            hint: 'How much of the token must be inside the range to count? (0.01 = just touching, 0.5 = 50% coverage).',
            scope: 'client',
            config: true,
            type: Number,
            range: { min: 0.01, max: 1.0, step: 0.01 },
            default: 0.10,
            onChange: () => { }
        });

        game.settings.register(this.ID, 'calculationMode', {
            name: 'Calculation Mode',
            hint: 'Choose how elevation affects distance measurement.',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                "auto": "Auto (3D - Default)",
                "flat": "Flat (2D Only - Ignore Height)",
                "both": "Both (Show 3D & 2D)"
            },
            default: "auto",
            onChange: () => { }
        });

        game.settings.register(this.ID, 'textSize', {
            name: 'Text Size',
            hint: 'Choose the size of the text labels.',
            scope: 'client',
            config: true,
            type: String,
            choices: { "small": "Small", "normal": "Normal", "large": "Large" },
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
            choices: { "solid": "Solid", "dotted": "Dotted", "dashed": "Dashed" },
            default: "solid",
            onChange: () => this.refreshAll()
        });

        game.settings.register(this.ID, 'lineThickness', {
            name: 'Line Thickness',
            hint: 'Adjust the thickness of the distance rings.',
            scope: 'client',
            config: true,
            type: String,
            choices: { "2px": "Normal", "5px": "Large", "8px": "Extra Large", "12px": "Massive" },
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

        // --- MOVED TO LAST: Target Highlighting ---
        game.settings.register(this.ID, 'targetHighlighting', {
            name: 'Target Highlighting',
            hint: 'Highlight tokens that are inside your range rings with the corresponding color.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: () => {
                const highlights = document.querySelectorAll('.dhd-highlight-ring');
                highlights.forEach(h => h.remove());
            }
        });
    }

    static registerKeybindings() {
        game.keybindings.register(this.ID, "toggleRings", {
            name: "Toggle Combat Distances",
            hint: "Toggle the distance rings for the selected token(s). Default: R",
            editable: [{ key: "KeyR" }],
            onDown: () => { this.Toggle(); return true; },
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
    }

    static onTicker() {
        if (!canvas || !canvas.ready || !canvas.tokens) return;

        const rings = document.getElementsByClassName('dhd-range-ring');
        const hoverLabels = document.getElementsByClassName('dhd-hover-label');

        if (rings.length === 0) {
            const highlights = document.getElementsByClassName('dhd-highlight-ring');
            while(highlights.length > 0){
                highlights[0].remove();
            }
        }

        if (rings.length === 0 && hoverLabels.length === 0) return;

        const doHighlight = game.settings.get(this.ID, 'targetHighlighting');
        
        const tokensHighlightedThisFrame = new Set();
        const processedSourceIds = new Set();

        for (let ring of rings) {
            const tokenId = ring.dataset.tokenId;
            const token = canvas.tokens.get(tokenId);
            
            // --- GHOST MOVEMENT PREVIEW FIX ---
            let effectiveCenter = token ? token.center : {x:0, y:0};
            let sourceElevation = token ? (token.document.elevation || 0) : 0;
            let isDragging = false;
            
            if (token) {
                // 1. Try standard property
                let preview = token.preview;

                // 2. Fallback: Look in canvas.tokens.preview container
                if (!preview && canvas.tokens.preview?.children) {
                    preview = canvas.tokens.preview.children.find(c => c._original?.id === tokenId);
                }

                if (preview) {
                    effectiveCenter = preview.center;
                    // Use preview elevation if available (for modules that change height during drag)
                    sourceElevation = preview.document.elevation !== undefined ? preview.document.elevation : sourceElevation;
                    isDragging = true;
                }
            }

            const dist = parseFloat(ring.dataset.rangeDistance);
            
            // Allow display if dragging, even if original is hidden (common in Foundry)
            // Or if token is normally visible
            if (token && dist && (token.visible || isDragging)) {
                this.updateRingPositionAndSize(ring, token, dist, effectiveCenter);
                
                if (doHighlight && !processedSourceIds.has(tokenId)) {
                    this.updateTargetHighlights(token, effectiveCenter, tokensHighlightedThisFrame, sourceElevation);
                    processedSourceIds.add(tokenId);
                }
            } else {
                ring.style.display = 'none'; 
            }
        }

        const existingHighlights = document.getElementsByClassName('dhd-highlight-ring');
        for (let hl of existingHighlights) {
            if (!tokensHighlightedThisFrame.has(hl.dataset.targetId)) {
                hl.remove();
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

    /**
     * Logic to highlight targets inside rings
     */
    static updateTargetHighlights(sourceToken, sourceCenter, activeSet, sourceElevationOverride = null) {
        const potentialTargets = canvas.tokens.placeables;
        const ranges = this.DEFAULTS.ranges;
        const threshold = game.settings.get(this.ID, 'coverageThreshold');
        let calcMode = game.settings.get(this.ID, 'calculationMode');
        
        if (this._activeTokens.has(sourceToken.id)) {
            const activeData = this._activeTokens.get(sourceToken.id);
            if (activeData && activeData.mode) calcMode = activeData.mode;
        }
        const use3D = (calcMode !== 'flat');
        const paletteKey = game.settings.get(this.ID, 'colorPalette');
        const currentPalette = this.PALETTES[paletteKey] || this.PALETTES['default'];

        const sourceDimSquares = Math.max(sourceToken.document.width, sourceToken.document.height);
        const sourceRadiusPx = (sourceDimSquares * canvas.scene.grid.size) / 2;
        const lineBufferPx = 2;

        const sourceElevation = sourceElevationOverride !== null ? sourceElevationOverride : (sourceToken.document.elevation || 0);

        for (const target of potentialTargets) {
            if (target.id === sourceToken.id) continue;
            if (!target.visible) continue;

            const targetPoints = this.getTokenSamplePoints(target);
            
            const targetElevation = target.document.elevation || 0;
            const verticalDistance = Math.abs(sourceElevation - targetElevation);
            const verticalDistancePx = verticalDistance * (canvas.scene.grid.size / canvas.scene.grid.distance);

            let matchedRangeKey = null;

            // Sort ranges by distance, check smallest first.
            const rangesWithKeys = Object.entries(ranges).map(([k, v]) => ({key: k, ...v}))
                .sort((a,b) => a.distance - b.distance);

            for (const range of rangesWithKeys) {
                const rangePx = (range.distance / canvas.scene.grid.distance) * canvas.scene.grid.size;
                const visualRingRadiusPx = rangePx + sourceRadiusPx + lineBufferPx;

                let pointsInside = 0;
                for (let pTarget of targetPoints) {
                    let distPx = Math.hypot(pTarget.x - sourceCenter.x, pTarget.y - sourceCenter.y);
                    if (use3D && verticalDistancePx > 0) {
                        distPx = Math.sqrt(Math.pow(distPx, 2) + Math.pow(verticalDistancePx, 2));
                    }
                    if (distPx <= visualRingRadiusPx) pointsInside++;
                }

                if ((pointsInside / targetPoints.length) >= threshold) {
                    matchedRangeKey = range.key;
                    break; 
                }
            }

            if (matchedRangeKey) {
                const color = currentPalette.colors[matchedRangeKey] || '#ffffff';
                this.drawHighlight(target, color);
                activeSet.add(target.id);
            }
        }
    }

    static drawHighlight(token, colorStr) {
        let hl = document.querySelector(`.dhd-highlight-ring[data-target-id="${token.id}"]`);
        const container = this.getContainer();
        
        if (!hl) {
            hl = document.createElement('div');
            hl.classList.add('dhd-highlight-ring');
            hl.dataset.targetId = token.id;
            container.appendChild(hl);
        }

        let r=0, g=0, b=0;
        if (colorStr.startsWith('#')) {
            r = parseInt(colorStr.slice(1, 3), 16);
            g = parseInt(colorStr.slice(3, 5), 16);
            b = parseInt(colorStr.slice(5, 7), 16);
        }

        hl.style.setProperty('--hl-r', r);
        hl.style.setProperty('--hl-g', g);
        hl.style.setProperty('--hl-b', b);
        
        const screenPos = this.getWorldToScreen(token.center);
        const tokenW = token.document.width * canvas.grid.size * canvas.stage.scale.x;
        const tokenH = token.document.height * canvas.grid.size * canvas.stage.scale.y;
        const size = Math.max(tokenW, tokenH); 

        hl.style.width = `${size}px`;
        hl.style.height = `${size}px`;
        hl.style.left = `${screenPos.x}px`;
        hl.style.top = `${screenPos.y}px`;
        
        hl.style.display = '';
    }

    // --- Coordinate Helpers ---

    static getWorldToScreen(point) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return {x: 0, y: 0};
        return canvas.stage.worldTransform.apply(point);
    }

    static formatDistance(value) {
        return Number.isInteger(value) ? value : value.toFixed(1);
    }

    static getTokenSamplePoints(token) {
        if (!token) return [];
        const grid = canvas.scene.grid.size;
        const resolution = 4; // 4x4 sample points per grid square
        const step = grid / resolution;
        const offset = step / 2;

        const startX = token.document.x; 
        const startY = token.document.y; 
        const widthSquares = token.document.width; 
        const heightSquares = token.document.height; 
        
        const points = [];
        for (let gx = 0; gx < widthSquares; gx++) {
            for (let gy = 0; gy < heightSquares; gy++) {
                const cellX = startX + (gx * grid);
                const cellY = startY + (gy * grid);
                for (let sx = 0; sx < resolution; sx++) {
                    for (let sy = 0; sy < resolution; sy++) {
                        points.push({
                            x: cellX + (sx * step) + offset,
                            y: cellY + (sy * step) + offset
                        });
                    }
                }
            }
        }
        return points;
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

        // --- GHOST MOVEMENT SUPPORT FOR HOVER ---
        let sourceCenter = sourceToken.center;
        
        // 1. Try standard preview
        let preview = sourceToken.preview;
        // 2. Fallback
        if (!preview && canvas.tokens.preview?.children) {
            preview = canvas.tokens.preview.children.find(c => c._original?.id === sourceToken.id);
        }

        let sourceElevation = sourceToken.document.elevation || 0;

        if (preview) {
            sourceCenter = preview.center;
            sourceElevation = preview.document.elevation !== undefined ? preview.document.elevation : sourceElevation;
        }

        // --- Setup ---
        const threshold = game.settings.get(this.ID, 'coverageThreshold'); 
        let calcMode = game.settings.get(this.ID, 'calculationMode');
        if (this._activeTokens.has(sourceToken.id)) {
            const activeData = this._activeTokens.get(sourceToken.id);
            if (activeData && activeData.mode) {
                calcMode = activeData.mode;
            }
        }
        const use3D = (calcMode !== 'flat');

        // const sourceElevation = sourceToken.document.elevation || 0; // REPLACED BY ABOVE LOGIC
        const targetElevation = token.document.elevation || 0;
        const verticalDistance = Math.abs(sourceElevation - targetElevation);
        const verticalDistancePx = verticalDistance * (canvas.scene.grid.size / canvas.scene.grid.distance);

        let finalDistDisplay = Infinity;
        let finalDist3DDisplay = Infinity;
        let matchedLabel = "Very Far";

        // --- HIGH RESOLUTION VISUAL COVERAGE LOGIC (EDGE TO EDGE) ---
        const sourceDimSquares = Math.max(sourceToken.document.width, sourceToken.document.height);
        const sourceRadiusPx = (sourceDimSquares * canvas.scene.grid.size) / 2;
        
        const targetPoints = this.getTokenSamplePoints(token);
        const sortedRanges = Object.values(this.DEFAULTS.ranges).sort((a, b) => a.distance - b.distance);
        const lineBufferPx = 2; 

        for (const range of sortedRanges) {
            const rangePx = (range.distance / canvas.scene.grid.distance) * canvas.scene.grid.size;
            const visualRingRadiusPx = rangePx + sourceRadiusPx + lineBufferPx;

            let pointsInside = 0;
            for (let pTarget of targetPoints) {
                let distPx = Math.hypot(pTarget.x - sourceCenter.x, pTarget.y - sourceCenter.y);
                if (use3D && verticalDistancePx > 0) {
                    distPx = Math.sqrt(Math.pow(distPx, 2) + Math.pow(verticalDistancePx, 2));
                }
                if (distPx <= visualRingRadiusPx) pointsInside++;
            }

            const ratio = pointsInside / targetPoints.length;
            if (ratio >= threshold) {
                matchedLabel = range.label;
                break;
            }
        }

        // --- Calculate display number (Visual Approximation) ---
        let minPointDistPx = Infinity;
        for (let pTarget of targetPoints) {
            const d = Math.hypot(pTarget.x - sourceCenter.x, pTarget.y - sourceCenter.y);
            if (d < minPointDistPx) minPointDistPx = d;
        }
        
        let distDisplayPx = Math.max(0, minPointDistPx - sourceRadiusPx);
        let d2d = (distDisplayPx / canvas.scene.grid.size) * canvas.scene.grid.distance;
        let d3d = d2d;

        if (use3D && verticalDistance > 0) {
            d3d = Math.sqrt(Math.pow(d2d, 2) + Math.pow(verticalDistance, 2));
        }

        finalDistDisplay = d2d;
        finalDist3DDisplay = d3d;

        if (finalDistDisplay === Infinity) return;

        // --- DISPLAY FORMATTING ---
        let displayString = "";

        if (calcMode === "flat") {
            displayString = `(${this.formatDistance(finalDistDisplay)})`;
        } 
        else if (calcMode === "both") {
            if (verticalDistance > 0) {
                displayString = `(${this.formatDistance(finalDist3DDisplay)} | 2D: ${this.formatDistance(finalDistDisplay)})`;
            } else {
                displayString = `(${this.formatDistance(finalDist3DDisplay)})`;
            }
        } 
        else { // Auto
            displayString = `(${this.formatDistance(finalDist3DDisplay)})`;
        }

        this.createHoverLabel(token, matchedLabel, displayString);
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

    static createHoverLabel(token, text, distanceDisplayString) {
        this.removeHoverLabel(token.id);

        const container = this.getContainer();
        const textSize = game.settings.get(this.ID, 'textSize');
        
        const label = document.createElement('div');
        label.classList.add('dhd-hover-label', `text-${textSize}`);
        label.dataset.hoverTokenId = token.id;
        
        label.innerHTML = `<span class="category">${text}</span><span class="dist">${distanceDisplayString}</span>`;
        
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
        const labels = document.querySelectorAll(`.dhd-hover-label[data-hover-token-id="${tokenId}"]`);
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

    static createRings(token, options = {}) {
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
            ring.classList.add('dhd-range-ring', rangeKey);
            
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
            label.classList.add('dhd-range-label', `text-${textSize}`);
            
            const formattedDistance = this.formatDistance(parseFloat(rangeData.distance));
            
            label.innerHTML = `<span class="category">${rangeData.label}</span> <span class="dist">(${formattedDistance})</span>`;
            
            ring.appendChild(label);
            container.appendChild(ring);
            
            this.updateRingPositionAndSize(ring, token, rangeData.distance, token.center);
        });

        let storedMode = null;
        if (options.mode) {
            const m = options.mode.toLowerCase();
            if (m === '2d') storedMode = 'flat';
            else if (m === '3d') storedMode = 'auto';
            else if (m === 'both') storedMode = 'both';
            else storedMode = m; 
        }

        this._activeTokens.set(token.id, { mode: storedMode });
    }

    /**
     * Updates ring visual size and position.
     * UPDATED: Accepts 'customCenter' for Ghost Movement support.
     */
    static updateRingPositionAndSize(ring, token, baseDistance, customCenter = null) {
        const center = customCenter || token.center;
        const screenPos = this.getWorldToScreen(center);
        
        // Edge to Edge logic is default:
        // Diameter offset = Max Dimension (Width or Height)
        const diameterOffset = Math.max(token.document.width, token.document.height) * canvas.scene.grid.distance;

        const gridDist = (baseDistance * 2 + diameterOffset) / canvas.scene.grid.distance;
        const worldDiameter = gridDist * canvas.grid.size;
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
                    const existingData = this._activeTokens.get(token.id);
                    this.createRings(token, { mode: existingData?.mode });
                }
            });
        }
    }

    static get ranges() { return this.DEFAULTS.ranges; }

    static onRenderTokenHUD(hud, html, tokenData) {
        const button = $(`
            <div class="control-icon" title="Toggle Combat Distances">
                <i class="fas fa-circle-dot"></i>
            </div>
        `);

        const token = canvas.tokens.get(tokenData._id);
        if (!token) return;
        
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
        const rings = document.querySelectorAll(`.dhd-range-ring[data-token-id="${tokenId}"]`);
        rings.forEach(ring => ring.remove());
        
        const highlights = document.getElementsByClassName('dhd-highlight-ring');
        while(highlights.length > 0) {
            highlights[0].remove();
        }

        this._activeTokens.delete(tokenId);
    }

    static hasRings(tokenId) {
        return this._activeTokens.has(tokenId);
    }

    static onUpdateToken(tokenDocument, changes) { }

    static onDeleteToken(tokenDocument) {
        this.removeRings(tokenDocument.id);
        this.removeHoverLabel(tokenDocument.id);
        this._activeTokens.delete(tokenDocument.id);
    }
}

Hooks.once('init', () => {
    CombatDistances.initialize();
});