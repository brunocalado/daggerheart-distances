/**
 * Converts a world-space point to screen-space coordinates using the canvas stage transform.
 * @param {{x: number, y: number}} point
 * @returns {{x: number, y: number}}
 */
export function getWorldToScreen(point) {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return { x: 0, y: 0 };
    return canvas.stage.worldTransform.apply(point);
}

/**
 * Formats a distance value, omitting the decimal when it is a whole number.
 * @param {number} value
 * @returns {number|string}
 */
export function formatDistance(value) {
    return Number.isInteger(value) ? value : value.toFixed(1);
}

/**
 * Returns a dense grid of sample points covering the token's footprint.
 * Used for coverage-based range checks so large tokens are assessed fairly.
 * @param {Token} token
 * @returns {{x: number, y: number}[]}
 */
export function getTokenSamplePoints(token) {
    if (!token) return [];
    const grid = canvas.scene.grid.size;
    const resolution = 4;
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
