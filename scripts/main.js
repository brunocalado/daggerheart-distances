class CombatDistances {
    static ID = 'daggerheart-distances';
    static _tickerFunc = null; // Armazena a referência da função para poder remover depois
    
    // Configurações de Paletas de Cores
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
                ring1: "#ff0055", // Rosa Neon
                ring2: "#ffcc00", // Âmbar elétrico
                ring3: "#00ff99", // Verde Matrix
                ring4: "#00ccff"  // Azul Laser
            }
        },
        "option4": {
            label: "Option 4 (Warm Sunset)",
            colors: {
                ring1: "#785ef0", // Roxo intenso
                ring2: "#dc267f", // Fúcsia
                ring3: "#fe6100", // Laranja queimado
                ring4: "#ffb000"  // Dourado/Amarelo
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

        // Hooks principais de Lógica de Token
        Hooks.on('renderTokenHUD', this.onRenderTokenHUD.bind(this));
        Hooks.on('deleteToken', this.onDeleteToken.bind(this));
        Hooks.on('hoverToken', this.onHoverToken.bind(this));
        Hooks.on('updateToken', this.onUpdateToken.bind(this)); // Reintroduzido para garantir dados

        // Hooks de Ciclo de Vida do Canvas (CRÍTICO PARA O TICKER)
        Hooks.on('canvasReady', this.startTicker.bind(this));
        Hooks.on('canvasTearDown', this.stopTicker.bind(this));
        
        // Fallback: garante atualização no Pan mesmo se o ticker falhar um frame
        Hooks.on('canvasPan', this.onCanvasPan.bind(this));
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
                "animated": "Animated",
                "none": "None"
            },
            default: "animated",
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
                const tokens = canvas.tokens.controlled;
                if (tokens.length === 0) return false;

                tokens.forEach(token => {
                    if (this.hasRings(token.id)) {
                        this.removeRings(token.id);
                    } else {
                        this.createRings(token);
                    }
                });

                // Updates HUD if active for one of the tokens
                if (canvas.tokens.hud.rendered && tokens.some(t => t.id === canvas.tokens.hud.object?.id)) {
                    canvas.tokens.hud.render();
                }

                return true;
            },
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });
    }

    // --- Ticker Management (Correção de "Deslizamento") ---

    static startTicker() {
        // Garante que não adicionamos duplicado
        this.stopTicker(); 
        
        this._tickerFunc = this.onTicker.bind(this);
        canvas.app.ticker.add(this._tickerFunc);
        
        // Força um refresh ao iniciar a cena
        this.refreshAll();
    }

    static stopTicker() {
        if (this._tickerFunc) {
            canvas.app.ticker.remove(this._tickerFunc);
            this._tickerFunc = null;
        }
        // Limpa elementos visuais ao sair da cena
        const container = document.getElementById('combat-distances-container');
        if (container) container.innerHTML = '';
    }

    // Loop executado a cada frame (60fps)
    static onTicker() {
        // Se o canvas não estiver pronto, aborta
        if (!canvas || !canvas.ready || !canvas.tokens) return;

        const rings = document.getElementsByClassName('range-ring');
        const hoverLabels = document.getElementsByClassName('combat-distance-hover-label');

        // Otimização: Se não tem nada na tela, não faz cálculos
        if (rings.length === 0 && hoverLabels.length === 0) return;

        // Atualiza Anéis
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

        // Atualiza Hover Labels
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

    // --- Helpers de Coordenadas ---

    static getWorldToScreen(point) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return {x: 0, y: 0};
        return canvas.stage.worldTransform.apply(point);
    }

    // --- Event Handlers ---

    static onCanvasPan(canvas, position) {
        // Força atualização imediata ao pan/zoom, caso o ticker perca um frame
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

        token.document.setFlag(this.ID, 'hasRings', true);
    }

    static updateRingPositionAndSize(ring, token, baseDistance) {
        // Cálculo Robusto de Posição
        const center = token.center;
        const screenPos = this.getWorldToScreen(center);

        // Cálculo Robusto de Tamanho (Escala)
        const gridDist = baseDistance / canvas.scene.grid.distance;
        const worldDiameter = gridDist * 2 * canvas.grid.size;
        
        // A escala deve considerar o zoom atual do stage
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
        
        if (this.hasRings(token.id)) {
            button.addClass('active');
        }

        button.click(async (event) => {
            event.preventDefault();
            
            if (this.hasRings(token.id)) {
                this.removeRings(token.id);
                button.removeClass('active');
            } else {
                this.createRings(token);
                button.addClass('active');
            }
        });

        $(html).find('div.left').append(button);
    }

    static removeRings(tokenId) {
        const token = canvas.tokens.get(tokenId);
        const rings = document.querySelectorAll(`.range-ring[data-token-id="${tokenId}"]`);
        rings.forEach(ring => ring.remove());
        
        if (token) {
            token.document.setFlag(this.ID, 'hasRings', false);
        }
    }

    static hasRings(tokenId) {
        const token = canvas.tokens.get(tokenId);
        return token?.document?.getFlag(this.ID, 'hasRings') ?? false;
    }

    static onUpdateToken(tokenDocument, changes) {
        // Redundância: garante que se o token mudar, a gente atualiza
        const token = canvas.tokens.get(tokenDocument.id);
        if (token && this.hasRings(token.id)) {
            // Não precisa recriar, o ticker vai pegar a nova posição no próximo frame
            // Mas se mudar o tamanho do grid ou algo estrutural, createRings seria melhor.
            // Para movimento simples, o ticker cuida.
        }
    }

    static onDeleteToken(tokenDocument) {
        this.removeRings(tokenDocument.id);
        this.removeHoverLabel(tokenDocument.id);
    }
}

Hooks.once('init', () => {
    CombatDistances.initialize();
});