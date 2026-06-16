import { MODULE_ID, PALETTES, DEFAULTS } from './constants.js';
import { getWorldToScreen, formatDistance, getTokenSamplePoints } from './helpers.js';
import { registerSettings, registerKeybindings } from './registration.js';

class CombatDistances {
    static MASS_ID = 'dhd-mass-center'; // Constant ID for the center point
    static _tickerFunc = null;

    // Key: Token ID, Value: { mode: string|null, timerId: number|null }
    static _activeTokens = new Map();

    // Stores the "Virtual Token" for mass measurement
    static _massToken = null;

    // Transient override set by held keybindings (Shift+H, Shift+B). Null = use setting.
    static _transientMode = null;

    static initialize() {
        registerSettings(this);
        registerKeybindings(this);

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

    /**
     * Calculates the center of the Bounding Box of selected tokens and creates rings from there.
     */
    static MassMeasurement(options = {}) {
        const tokens = canvas.tokens.controlled;
        if (tokens.length === 0) {
            ui.notifications.warn("Daggerheart Distances: Select tokens to measure from.");
            return;
        }

        // Feature: If only 1 token is selected, treat as normal Toggle
        if (tokens.length === 1) {
            return this.Toggle(options);
        }

        // Toggle logic: If mass rings exist, remove them.
        if (this.hasRings(this.MASS_ID)) {
            this.removeRings(this.MASS_ID);
            return;
        }

        // Calculate Bounding Box Center
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        let sumEl = 0;

        tokens.forEach(t => {
            const x = t.center.x;
            const y = t.center.y;

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            sumEl += (t.document.elevation || 0);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const avgElevation = sumEl / tokens.length;

        // Create a "Mock Token" object
        this._massToken = {
            id: this.MASS_ID,
            center: { x: centerX, y: centerY },
            document: {
                x: centerX,
                y: centerY,
                elevation: avgElevation,
                width: 0,
                height: 0
            },
            visible: true
        };

        this.createRings(this._massToken, options);
    }

    /**
     * Toggles rings on tokens.
     * @param {Object} options
     * @param {boolean} options.remote - If true, broadcasts the toggle to all clients (GM only).
     */
    static async Toggle(options = {}) {
        // --- STEP 2: The Method Toggle (Trigger Logic) ---
        const remote = options.remote || false;

        // 1. Identify Target Tokens
        // Priority: Hovered Token -> Selected Tokens
        const hoverToken = canvas.tokens.hover;
        const tokens = hoverToken ? [hoverToken] : canvas.tokens.controlled;

        if (tokens.length === 0) {
            ui.notifications.warn("Daggerheart Distances: Select or hover over a token first.");
            return;
        }

        // 2. Handle Remote Broadcast (GM Only)
        if (remote) {
            if (!game.user.isGM) {
                // Silently fail if user is not GM
                return;
            }

            const payload = {
                triggerId: foundry.utils.randomID(),
                sceneId: canvas.scene.id,
                tokenIds: tokens.map(t => t.id),
                timestamp: Date.now()
            };

            // Update the setting to trigger the listener on all clients (including self)
            await game.settings.set(MODULE_ID, 'broadcastState', payload);
            return;
        }

        // 3. Handle Local Toggle (Standard Behavior)
        tokens.forEach(token => {
            if (this.hasRings(token.id)) {
                this.removeRings(token.id);
            } else {
                this.createRings(token, { ...options, pinned: true });
            }
        });

        // Update HUD if needed
        if (canvas.tokens.hud.rendered && tokens.some(t => t.id === canvas.tokens.hud.object?.id)) {
            canvas.tokens.hud.render();
        }
    }

    /**
     * Clears all active distance rings from all tokens on the scene.
     * Public API method accessible via DHDistances.clearAll()
     */
    static clearAll() {
        // Iterate over all active tokens and remove their rings
        const tokenIds = Array.from(this._activeTokens.keys());
        tokenIds.forEach(tokenId => {
            this.removeRings(tokenId);
        });

        // Optional feedback
        if (tokenIds.length > 0) {
            ui.notifications.info(`Daggerheart Distances: Cleared ${tokenIds.length} distance ring(s).`);
        }
    }

    // --- Internal Logic for Broadcast ---

    /**
     * STEP 3: The Listener
     * Handles changes to the 'broadcastState' setting.
     */
    static _handleBroadcastChange(data) {
        // Validation: Scene must match
        if (data.sceneId !== canvas.scene.id) return;

        // Anti-Stale: Check timestamp (ignore if older than 10 seconds)
        const now = Date.now();
        if (now - data.timestamp > 10000) return;

        // Retrieve tokens
        const tokens = [];
        for (const id of data.tokenIds) {
            const token = canvas.tokens.get(id);
            if (token) tokens.push(token);
        }

        if (tokens.length > 0) {
            this._applyLocalToggle(tokens);
        }
    }

    /**
     * STEP 4: Visual Application
     * Applies rings locally with a timer.
     */
    static _applyLocalToggle(tokens) {
        // Ensure ticker is running
        if (!this._tickerFunc) this.startTicker();

        const duration = game.settings.get(MODULE_ID, 'broadcastDuration') * 1000; // Convert to ms

        tokens.forEach(token => {
            // Reset: Remove existing rings to refresh visual state
            if (this.hasRings(token.id)) {
                this.removeRings(token.id);
            }

            // Create new rings
            this.createRings(token);

            // Set timer to remove
            const timerId = setTimeout(() => {
                this.removeRings(token.id);
            }, duration);

            // Store timerId so we can cancel it if needed (in removeRings)
            const activeData = this._activeTokens.get(token.id);
            if (activeData) {
                activeData.timerId = timerId;
            }
        });

        // Force frame render immediately
        this.onTicker();
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
        // Reset transient mode in case canvas reloads while a key is physically held
        this._transientMode = null;
        // Remove the container entirely so getContainer() re-attaches it to the correct
        // parent after the canvas is rebuilt. Clearing innerHTML alone leaves the element
        // anchored to a stale parent, which displaces Foundry's hotbar and sidebar.
        const container = document.getElementById('combat-distances-container');
        if (container) container.remove();
    }

    static onTicker() {
        try {
            if (!canvas || !canvas.ready || !canvas.tokens) return;

            const rings = document.getElementsByClassName('dhd-range-ring');
            const hoverLabels = document.getElementsByClassName('dhd-hover-label');

            if (rings.length === 0) {
                const highlights = document.getElementsByClassName('dhd-highlight-ring');
                while (highlights.length > 0) {
                    highlights[0].remove();
                }
            }

            if (rings.length === 0 && hoverLabels.length === 0) return;

            const doHighlight = game.settings.get(MODULE_ID, 'targetHighlighting');

            const tokensHighlightedThisFrame = new Set();
            const processedSourceIds = new Set();

            for (let ring of rings) {
                const tokenId = ring.dataset.tokenId;

                let token = null;
                if (tokenId === this.MASS_ID) {
                    token = this._massToken;
                } else {
                    token = canvas.tokens.get(tokenId);
                }

                // --- GHOST MOVEMENT PREVIEW FIX ---
                let effectiveCenter = token ? token.center : { x: 0, y: 0 };
                let sourceElevation = token ? (token.document.elevation || 0) : 0;
                let isDragging = false;

                if (token && tokenId !== this.MASS_ID) {
                    let preview = token.preview;
                    if (!preview && canvas.tokens.preview?.children) {
                        preview = canvas.tokens.preview.children.find(c => c._original?.id === tokenId);
                    }
                    if (preview) {
                        effectiveCenter = preview.center;
                        sourceElevation = preview.document.elevation !== undefined ? preview.document.elevation : sourceElevation;
                        isDragging = true;
                    }
                }

                const dist = parseFloat(ring.dataset.rangeDistance);

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
                let token = (tokenId === this.MASS_ID) ? this._massToken : canvas.tokens.get(tokenId);

                if (token && token.visible) {
                    this.updateHoverLabelPosition(label, token);
                } else {
                    label.style.display = 'none';
                }
            }
        } catch (err) {
            console.warn("Daggerheart Distances | Ticker Error:", err);
        }
    }

    static updateTargetHighlights(sourceToken, sourceCenter, activeSet, sourceElevationOverride = null) {
        const potentialTargets = canvas.tokens.placeables;
        const ranges = DEFAULTS.ranges;
        const threshold = game.settings.get(MODULE_ID, 'coverageThreshold');
        let calcMode = game.settings.get(MODULE_ID, 'calculationMode');

        if (this._activeTokens.has(sourceToken.id)) {
            const activeData = this._activeTokens.get(sourceToken.id);
            if (activeData && activeData.mode) calcMode = activeData.mode;
        }
        const use3D = (calcMode !== 'flat');
        const paletteKey = game.settings.get(MODULE_ID, 'colorPalette');
        const currentPalette = PALETTES[paletteKey] || PALETTES['default'];

        const sW = sourceToken.document.width || 0;
        const sH = sourceToken.document.height || 0;
        const sourceDimSquares = Math.max(sW, sH);

        const sourceRadiusPx = (sourceDimSquares * canvas.scene.grid.size) / 2;
        const lineBufferPx = 2;

        const sourceElevation = sourceElevationOverride !== null ? sourceElevationOverride : (sourceToken.document.elevation || 0);

        for (const target of potentialTargets) {
            if (target.id === sourceToken.id) continue;
            if (!target.visible) continue;

            const targetPoints = getTokenSamplePoints(target);

            const targetElevation = target.document.elevation || 0;
            const verticalDistance = Math.abs(sourceElevation - targetElevation);
            const verticalDistancePx = verticalDistance * (canvas.scene.grid.size / canvas.scene.grid.distance);

            let matchedRangeKey = null;

            const rangesWithKeys = Object.entries(ranges).map(([k, v]) => ({ key: k, ...v }))
                .sort((a, b) => a.distance - b.distance);

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
            hl = document.createElement('img');
            hl.classList.add('dhd-highlight-ring');
            hl.dataset.targetId = token.id;
            // Safer access to texture src
            hl.src = token.document.texture?.src || "";

            // --- FIXES: Aspect Ratio & Click Through ---
            hl.style.pointerEvents = "none";
            hl.style.objectFit = "contain";

            container.appendChild(hl);
        }

        let r = 0, g = 0, b = 0;
        if (colorStr.startsWith('#')) {
            r = parseInt(colorStr.slice(1, 3), 16);
            g = parseInt(colorStr.slice(3, 5), 16);
            b = parseInt(colorStr.slice(5, 7), 16);
        }

        hl.style.setProperty('--hl-r', r);
        hl.style.setProperty('--hl-g', g);
        hl.style.setProperty('--hl-b', b);

        const screenPos = getWorldToScreen(token.center);

        // Safer access to texture scale
        const scaleX = token.document.texture?.scaleX || 1;
        const scaleY = token.document.texture?.scaleY || 1;

        const tokenW = token.document.width * canvas.grid.size * canvas.stage.scale.x * Math.abs(scaleX);
        const tokenH = token.document.height * canvas.grid.size * canvas.stage.scale.y * Math.abs(scaleY);

        hl.style.width = `${tokenW}px`;
        hl.style.height = `${tokenH}px`;
        hl.style.left = `${screenPos.x}px`;
        hl.style.top = `${screenPos.y}px`;

        // --- FIX: Respect lockRotation ---
        let rotation = token.document.rotation || 0;
        if (token.document.lockRotation) {
            rotation = 0;
        }

        // --- NEW FIX: Mirroring (Negative Scale) ---
        // If scale is negative, flip the highlight element too
        const flipX = scaleX < 0 ? -1 : 1;
        const flipY = scaleY < 0 ? -1 : 1;

        hl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${flipX}, ${flipY})`;

        hl.style.display = '';
    }

    // --- Event Handlers ---

    static onCanvasPan(canvas, position) {
        this.onTicker();
    }

    static onHoverToken(token, hovered) {
        // --- HOVER MODE RING LOGIC ---
        // Resolve effective mode: transient key override takes priority over setting
        const effectiveMode = this._transientMode || game.settings.get(MODULE_ID, 'operationMode');

        if (effectiveMode !== 'manual' && game.user.isGM) {
            if (hovered) {
                if (effectiveMode === 'hover-gm') {
                    // Only create rings if none exist (don't overwrite pinned rings from R key)
                    if (!this.hasRings(token.id)) {
                        this.createRings(token, { pinned: false });
                    }
                } else if (effectiveMode === 'hover-broadcast') {
                    // Use the existing broadcast mechanism (timed, visible to all players)
                    this.Toggle({ remote: true, _sourceTokenId: token.id });
                }
            } else {
                // Mouse left the token
                if (effectiveMode === 'hover-gm') {
                    const activeData = this._activeTokens.get(token.id);
                    // Only remove if these rings were created by hover (not pinned by R key)
                    if (activeData && activeData.pinned === false) {
                        this.removeRings(token.id);
                    }
                }
                // hover-broadcast: intentionally no removal here.
                // The broadcast timer (broadcastDuration setting) handles expiry on all clients.
            }
        }

        // --- HOVER LABEL LOGIC ---
        try {
            if (!hovered) {
                this.removeHoverLabel(token.id);
                return;
            }

            const controlled = canvas.tokens.controlled;

            // --- FIX: Allow loose selection. If multiple are selected, use the first one. ---
            if (controlled.length === 0) return;

            const sourceToken = controlled[0];
            if (sourceToken.id === token.id) return;

            // --- GHOST MOVEMENT SUPPORT FOR HOVER ---
            let sourceCenter = sourceToken.center;

            // 1. Try standard preview
            let preview = sourceToken.preview;

            // 2. Fallback with Safe Access
            // Some players might not have access to _original or children array might be tricky
            if (!preview && canvas.tokens.preview?.children) {
                preview = canvas.tokens.preview.children.find(c => c._original?.id === sourceToken.id);
            }

            let sourceElevation = sourceToken.document.elevation || 0;

            if (preview) {
                sourceCenter = preview.center;
                sourceElevation = preview.document.elevation !== undefined ? preview.document.elevation : sourceElevation;
            }

            // --- Setup ---
            const threshold = game.settings.get(MODULE_ID, 'coverageThreshold');
            let calcMode = game.settings.get(MODULE_ID, 'calculationMode');
            if (this._activeTokens.has(sourceToken.id)) {
                const activeData = this._activeTokens.get(sourceToken.id);
                if (activeData && activeData.mode) {
                    calcMode = activeData.mode;
                }
            }
            const use3D = (calcMode !== 'flat');

            const targetElevation = token.document.elevation || 0;
            const verticalDistance = Math.abs(sourceElevation - targetElevation);
            // Safety check for NaN
            const safeVertDist = isNaN(verticalDistance) ? 0 : verticalDistance;
            const verticalDistancePx = safeVertDist * (canvas.scene.grid.size / canvas.scene.grid.distance);

            let finalDistDisplay = Infinity;
            let finalDist3DDisplay = Infinity;

            // Default to 'Very Far' if outside all defined ranges
            let matchedLabel = "DHD.ranges.veryFar";

            const sourceDimSquares = Math.max(sourceToken.document.width, sourceToken.document.height);
            const sourceRadiusPx = (sourceDimSquares * canvas.scene.grid.size) / 2;

            const targetPoints = getTokenSamplePoints(token);
            const sortedRanges = Object.values(DEFAULTS.ranges).sort((a, b) => a.distance - b.distance);
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

            let minPointDistPx = Infinity;
            for (let pTarget of targetPoints) {
                const d = Math.hypot(pTarget.x - sourceCenter.x, pTarget.y - sourceCenter.y);
                if (d < minPointDistPx) minPointDistPx = d;
            }

            let distDisplayPx = Math.max(0, minPointDistPx - sourceRadiusPx);
            let d2d = (distDisplayPx / canvas.scene.grid.size) * canvas.scene.grid.distance;
            let d3d = d2d;

            if (use3D && safeVertDist > 0) {
                d3d = Math.sqrt(Math.pow(d2d, 2) + Math.pow(safeVertDist, 2));
            }

            finalDistDisplay = d2d;
            finalDist3DDisplay = d3d;

            if (finalDistDisplay === Infinity) return;

            let displayString = "";

            if (calcMode === "flat") {
                displayString = `(${formatDistance(finalDistDisplay)})`;
            }
            else if (calcMode === "both") {
                if (safeVertDist > 0) {
                    displayString = `(${formatDistance(finalDist3DDisplay)} | 2D: ${formatDistance(finalDistDisplay)})`;
                } else {
                    displayString = `(${formatDistance(finalDist3DDisplay)})`;
                }
            }
            else { // Auto
                displayString = `(${formatDistance(finalDist3DDisplay)})`;
            }

            this.createHoverLabel(token, matchedLabel, displayString);
        } catch (err) {
            console.error("Daggerheart Distances | Hover Calculation Error:", err);
        }
    }

    static getDistanceLabel(distance) {
        const ranges = Object.values(DEFAULTS.ranges).sort((a, b) => a.distance - b.distance);
        for (const range of ranges) {
            if (distance <= range.distance) {
                return range.label;
            }
        }
        return "DHD.ranges.veryFar";
    }

    static createHoverLabel(token, text, distanceDisplayString) {
        this.removeHoverLabel(token.id);

        const container = this.getContainer();
        const textSize = game.settings.get(MODULE_ID, 'textSize');

        const label = document.createElement('div');
        label.classList.add('dhd-hover-label', `text-${textSize}`);
        label.dataset.hoverTokenId = token.id;

        // --- LOCALIZATION UPDATE: Apply game.i18n.localize here ---
        label.innerHTML = `<span class="category">${game.i18n.localize(text)}</span><span class="dist">${distanceDisplayString}</span>`;

        container.appendChild(label);
        this.updateHoverLabelPosition(label, token);
    }

    static updateHoverLabelPosition(labelElement, token) {
        if (!labelElement || !token) return;

        const worldPos = { x: token.center.x, y: token.y };
        const screenPos = getWorldToScreen(worldPos);

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
            container.classList.add(MODULE_ID);
            // Attach to #board's parent (the canvas wrapper) so the overlay is scoped
            // to the canvas area, staying below Foundry's #interface layer (sidebar, hotbar).
            // Falls back to document.body if the canvas wrapper is unavailable.
            const parent = canvas.app?.view?.parentElement ?? document.body;
            parent.appendChild(container);
        }
        return container;
    }

    static createRings(token, options = {}) {
        // NOTE: Does not call removeRings directly to avoid recursion issues in logic,
        // but assumes caller has cleaned up if necessary.

        if (token.id === this.MASS_ID) {
            this._massToken = token;
        }

        const currentRanges = this.ranges;
        const lineStyle = game.settings.get(MODULE_ID, 'lineStyle');
        const lineThickness = game.settings.get(MODULE_ID, 'lineThickness');
        const fillStyle = game.settings.get(MODULE_ID, 'fillStyle');
        const paletteKey = game.settings.get(MODULE_ID, 'colorPalette');
        const textSize = game.settings.get(MODULE_ID, 'textSize');
        const currentPalette = PALETTES[paletteKey] || PALETTES['default'];
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
            } else { r = 0; g = 0; b = 0; }

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

            const formattedDistance = formatDistance(parseFloat(rangeData.distance));

            // --- LOCALIZATION UPDATE: Apply game.i18n.localize here ---
            label.innerHTML = `<span class="category">${game.i18n.localize(rangeData.label)}</span> <span class="dist">(${formattedDistance})</span>`;

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

        // Store active state (preserving existing timerId if somehow this was a refresh without clear)
        const existing = this._activeTokens.get(token.id) || {};
        // pinned: true = manually activated (R key / HUD button), persists after hover-out
        // pinned: false = activated by hover mode, removed on mouse-out
        const pinned = options.pinned !== false; // default true
        this._activeTokens.set(token.id, { ...existing, mode: storedMode, pinned });
    }

    static updateRingPositionAndSize(ring, token, baseDistance, customCenter = null) {
        const center = customCenter || token.center;
        const screenPos = getWorldToScreen(center);

        const tW = (token.document && token.document.width) || 0;
        const tH = (token.document && token.document.height) || 0;
        const diameterOffset = Math.max(tW, tH) * canvas.scene.grid.distance;

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
                    // Remove first to clean DOM, then recreate
                    this.removeRings(token.id);
                    this.createRings(token, { mode: existingData?.mode });
                }
            });
        }
    }

    static get ranges() { return DEFAULTS.ranges; }

    static onRenderTokenHUD(hud, html, tokenData) {
        const token = canvas.tokens.get(tokenData._id);
        if (!token) return;

        const button = document.createElement('div');
        button.classList.add('control-icon');
        button.title = 'Toggle Combat Distances';
        button.innerHTML = '<i class="fas fa-circle-dot"></i>';

        if (this.hasRings(token.id)) {
            button.classList.add('active');
        }

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            this.Toggle();
        });

        // V13: html may be HTMLElement (AppV2) or a jQuery wrapper (legacy HUD).
        const root = html instanceof HTMLElement ? html : html[0];
        root?.querySelector('div.left')?.appendChild(button);
    }

    static removeRings(tokenId) {
        // --- CLEANUP TIMERS ---
        // Crucial for Broadcast: If a token has a pending removal timer, we must clear it
        // to prevent it from removing future rings (e.g. if GM broadcasts again quickly).
        const activeData = this._activeTokens.get(tokenId);
        if (activeData && activeData.timerId) {
            clearTimeout(activeData.timerId);
            activeData.timerId = null;
        }

        const rings = document.querySelectorAll(`.dhd-range-ring[data-token-id="${tokenId}"]`);
        rings.forEach(ring => ring.remove());

        const highlights = document.getElementsByClassName('dhd-highlight-ring');
        while (highlights.length > 0) {
            highlights[0].remove();
        }

        this._activeTokens.delete(tokenId);

        if (tokenId === this.MASS_ID) {
            this._massToken = null;
        }
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

Hooks.once("ready", async () => {
    if (!game.user.isGM || !CONFIG.DH) return;

    try {
        const key = CONFIG.DH.SETTINGS.gameSettings.appearance;
        const rawSettings = game.settings.get(CONFIG.DH.id, key);
        const currentSettings = (typeof rawSettings.toObject === 'function')
            ? rawSettings.toObject()
            : { ...rawSettings };

        if (currentSettings.showTokenDistance !== "never") {
            await game.settings.set(CONFIG.DH.id, key, {
                ...currentSettings,
                showTokenDistance: "never"
            });
            console.log("Combat Distances | Configuração forçada para 'never'.");
        }

    } catch (err) {
        console.warn("Combat Distances | Falha ao aplicar configuração:", err);
    }
});
