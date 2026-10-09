# Daggerheart: Distances API

Everything the module exposes lives in one object:

```js
const api = game.modules.get("daggerheart-distances").api;
```

It is set during the `init` hook. The range functions read the canvas, so call them once the scene is ready (any time after `canvasReady`, which covers macros and chat or roll hooks).

## Range measurement

These functions give other modules the same answer the target highlight shows. When Distances colors a token as Close, `getRange` returns `"close"` for it. The highlight, the hover label and the API all call the same internal function.

### `getRange(source, target)`

Returns the smallest range band the target fits in, measured from the source.

- `source`, `target`: `Token` placeables on the current scene (`canvas.tokens.get(id)`, `token.object`, `game.user.targets`). Anything else throws a `TypeError`.
- Returns one of `"melee"`, `"veryClose"`, `"close"`, `"far"` or `"veryFar"`. These are the Daggerheart system's range ids. `"veryFar"` means beyond Far.

```js
const range = api.getRange(caster, target); // "close"
```

### `isWithinRange(source, target, rangeId)`

Returns `true` when the target is at `rangeId` or closer. A target at `"veryClose"` is within `"close"`. Every target is within `"veryFar"`, as in the system. An unknown `rangeId` throws a `RangeError`.

```js
const enemies = canvas.tokens.placeables.filter(t =>
  t.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE
  && api.isWithinRange(caster, t, "close"));
```

### How it measures

- The source is a circle around its center. Its radius is the ring distance plus half the source's largest side, the same size the rings are drawn at.
- The target is checked by coverage: it is in a ring when the share of its footprint inside that ring reaches the world's coverage threshold setting.
- Elevation counts unless the world's calculation mode setting is Flat (2D).
- Positions come from the token documents, so a token that is still animating is measured where it is going.

A few things differ from the rings on screen:

- The API always uses the world's calculation mode. A ring toggled with its own mode (`api.toggle({ mode: '2d' })`) changes only that ring's highlight.
- It works whether or not any rings are showing.
- Hidden tokens are measured too. The highlight skips them, but a GM resolving an effect still needs their range.
- The ring drag preview is ignored.
- When source and target are the same token, the result is `"melee"`.

The measurement is not symmetric. `getRange(a, b)` uses the size of `a` for the circle and the footprint of `b` for coverage, so `getRange(b, a)` can give a different band when the two tokens differ in size.

### Falling back to the system

Distances is optional. When it is not active, use the system's own check:

```js
const dhd = game.modules.get("daggerheart-distances");
const inClose = dhd?.active
  ? dhd.api.isWithinRange(caster, target, "close")
  : caster.isWithinRange(target, "close");
```

## Rings

The same functions the keybindings use.

| Function | What it does |
|---|---|
| `toggle(options)` | Toggles rings on the hovered token, or on the selected tokens. |
| `massMeasurement(options)` | Rings from the center of the selected tokens. With one token selected it acts like `toggle`. |
| `clearAll({ scope })` | Removes every ring for the calling user. |

Options:

- `mode` (`toggle` and `massMeasurement`): `'2d'`, `'3d'` or `'both'`. Overrides the world calculation mode for these rings only.
- `remote: true` (`toggle` only): broadcasts the rings to every connected player for the broadcast duration. GM only; ignored for players.

`clearAll` takes `scope: 'all'` (GM only) to clear the rings of every connected player, or `scope: 'self'` to clear only the caller's. Without it, the Clear All Mode setting decides.

```js
api.toggle({ remote: true, mode: '2d' });
api.clearAll({ scope: 'all' });
```
