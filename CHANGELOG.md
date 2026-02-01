# 0.0.8
- Auto disable system distance 

# 0.0.7
- Target Highlighting: Valid targets within range rings now glow with the ring's color.
- Ghost Preview: Range rings now follow the token preview while dragging to test positions.
- Mass Measurement: Select multiple tokens and use the macro DHDistances.MassMeasurement() to generate distance rings from the center of the group (bounding box center).

# 0.0.6
Features & Improvements
Smart Distance Detection: Major overhaul to distance calculation. The system now uses an "Edge-to-Edge" method that accurately accounts for token size.

Coverage Threshold: Added a new setting to define the specific percentage of a token that must be inside a ring to count as "in range" (e.g., 10% coverage).

Elevation Support: Distance calculations now account for token elevation/height (3D distance).

New Palettes: Added two new color themes: Synthwave and True Fire.

Macro Updates
The Toggle function now supports specific calculation modes:
```js
DHDistances.Toggle({mode: '2d'}); // Calculates distance ignoring elevation.
```
```js
DHDistances.Toggle({mode: '3d'}); // Calculates distance accounting for elevation.
```
```js
DHDistances.Toggle({mode: 'both'}); // Shows both 3D and 2D distances.
```

# 0.0.5
- light animation

# 0.0.4
- fix for button
- DHDistances.Toggle()