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
 * Finds the first range whose coverage threshold is met by the target sample points.
 * Sorted ranges must be ordered ascending by distance; returns the matched range object or null.
 * @param {{x:number,y:number}[]} targetPoints
 * @param {Array<{distance:number}>} sortedRanges
 * @param {{x:number,y:number}} sourceCenter
 * @param {number} sourceRadiusPx
 * @param {boolean} use3D
 * @param {number} verticalDistancePx
 * @param {number} threshold - fraction 0..1
 * @param {number} [lineBufferPx=2]
 * @returns {object|null}
 */
export function findMatchedRange(targetPoints, sortedRanges, sourceCenter, sourceRadiusPx, use3D, verticalDistancePx, threshold, lineBufferPx = 2) {
    for (const range of sortedRanges) {
        const rangePx = (range.distance / canvas.scene.grid.distance) * canvas.scene.grid.size;
        const visualRingRadiusPx = rangePx + sourceRadiusPx + lineBufferPx;

        let pointsInside = 0;
        for (const p of targetPoints) {
            let distPx = Math.hypot(p.x - sourceCenter.x, p.y - sourceCenter.y);
            if (use3D && verticalDistancePx > 0) {
                distPx = Math.sqrt(distPx ** 2 + verticalDistancePx ** 2);
            }
            if (distPx <= visualRingRadiusPx) pointsInside++;
        }

        if ((pointsInside / targetPoints.length) >= threshold) return range;
    }
    return null;
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
