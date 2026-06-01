---
'tex-to-typst': patch
---

Fix sized vertical-bar delimiters (`\left|`, `\bigl|`, `\lvert`/`\rvert`, etc.) failing with "Undefined left bracket" when used inside a `\frac`/`\dfrac` argument. Over-captured delimiter arguments are now normalized so only the delimiter is consumed.

- Add `\lvert`, `\rvert`, `\Vert`, `\lVert`, `\rVert` mappings and accept named bar/angle/floor/ceil delimiters in `\left`/`\right`.
- Fold `\left … matrix … \right` delimiters into the matrix: matching delimiters become `mat(delim: …)`, while mismatched delimiters wrap in `lr(…)` so each side scales with the matrix.
- Ignore brackets inside Typst string literals (e.g. `delim: "["`) when checking bracket balance.
