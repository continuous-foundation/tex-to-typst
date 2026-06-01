# tex-to-typst

## 0.0.20

### Patch Changes

- [#35](https://github.com/continuous-foundation/tex-to-typst/pull/35) [`c303e8b`](https://github.com/continuous-foundation/tex-to-typst/commit/c303e8b671293175c3684a7150027708ec813288) Thanks [@rowanc1](https://github.com/rowanc1)! - Fix sized vertical-bar delimiters (`\left|`, `\bigl|`, `\lvert`/`\rvert`, etc.) failing with "Undefined left bracket" when used inside a `\frac`/`\dfrac` argument. Over-captured delimiter arguments are now normalized so only the delimiter is consumed.
  - Add `\lvert`, `\rvert`, `\Vert`, `\lVert`, `\rVert` mappings and accept named bar/angle/floor/ceil delimiters in `\left`/`\right`.
  - Fold `\left … matrix … \right` delimiters into the matrix: matching delimiters become `mat(delim: …)`, while mismatched delimiters wrap in `lr(…)` so each side scales with the matrix.
  - Ignore brackets inside Typst string literals (e.g. `delim: "["`) when checking bracket balance.
