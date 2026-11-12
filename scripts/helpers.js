/*!
 * Daggerheart: Distances
 * 2025 https://github.com/brunocalado
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3.
 */
import { MODULE_ID, DEFAULTS } from './constants.js';

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
function findMatchedRange(targetPoints, sortedRanges, sourceCenter, sourceRadiusPx, use3D, verticalDistancePx, threshold, lineBufferPx = 2) {
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
 * Points are spread over the real footprint in pixels, not over whole grid squares: Daggerheart
 * sizes like Tiny (0.5) and Small (0.8) would otherwise be sampled as a full square, with most
 * points off the token. Integer sizes get exactly `resolution` points per square, as before.
 * @param {Token} token
 * @returns {{x: number, y: number}[]}
 */
export function getTokenSamplePoints(token) {
    if (!token) return [];
    const grid = canvas.scene.grid.size;
    const resolution = 4;
    const { x, y } = token.document;
    const widthPx = token.document.width * grid;
    const heightPx = token.document.height * grid;

    // At least `resolution` points per axis so small tokens still get a fair coverage reading.
    const cols = Math.max(resolution, Math.round(widthPx / (grid / resolution)));
    const rows = Math.max(resolution, Math.round(heightPx / (grid / resolution)));
    const stepX = widthPx / cols;
    const stepY = heightPx / rows;

    const points = [];
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            points.push({ x: x + stepX * (i + 0.5), y: y + stepY * (j + 0.5) });
        }
    }
    return points;
}

// Rings ascending by distance, each carrying its ring key (ring1..ring4) for palette lookup.
const SORTED_RANGES = Object.entries(DEFAULTS.ranges)
    .map(([key, range]) => ({ key, ...range }))
    .sort((a, b) => a.distance - b.distance);

/**
 * Decides which ring a target falls in when measured from a source circle.
 * The single range decision shared by the target highlight, the hover label and the public API,
 * so the three can never disagree. Callers resolve where the source is (live, preview, document)
 * and whether elevation counts; this function only measures.
 * @param {object} source
 * @param {{x: number, y: number}} source.center - world-space center of the source
 * @param {number} source.elevation
 * @param {number} source.sizeSquares - largest side of the source, in grid squares
 * @param {Token} target
 * @param {boolean} use3D - whether elevation difference counts towards distance
 * @returns {{key: string, id: string, distance: number, label: string}|null} null beyond the outermost ring
 */
export function measureRange(source, target, use3D) {
    const grid = canvas.scene.grid;
    const sourceRadiusPx = (source.sizeSquares * grid.size) / 2;
    const verticalDistance = Math.abs(source.elevation - (target.document.elevation || 0));
    const verticalDistancePx = verticalDistance * (grid.size / grid.distance);
    const threshold = game.settings.get(MODULE_ID, 'coverageThreshold');

    return findMatchedRange(getTokenSamplePoints(target), SORTED_RANGES, source.center, sourceRadiusPx, use3D, verticalDistancePx, threshold);
}
