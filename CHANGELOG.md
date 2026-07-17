# tex-to-typst

## 0.0.21

### Patch Changes

- [#38](https://github.com/continuous-foundation/tex-to-typst/pull/38) [`0652cb8`](https://github.com/continuous-foundation/tex-to-typst/commit/0652cb81b701bcb64bace7250f5a198d8ba8f437) Thanks [@rowanc1](https://github.com/rowanc1)! - Replace deprecated `angle.l`/`angle.r` output with `chevron.l`/`chevron.r` for `\langle`, `\rangle`, and `\left\langle`/`\right\rangle`.

- [#40](https://github.com/continuous-foundation/tex-to-typst/pull/40) [`d1645fd`](https://github.com/continuous-foundation/tex-to-typst/commit/d1645fda70bdd8550e7e13db568069c66decd484) Thanks [@rowanc1](https://github.com/rowanc1)! - Add a generated `src/symbols.ts` table (built from `scripts/symbols.html` via `bun run generate:symbols`) that augments `typstMacros` with hundreds of additional LaTeX-to-Typst symbol mappings. Curated mappings continue to take precedence over the generated defaults, and deprecated Typst names are skipped.

## 0.0.20

### Patch Changes

- [#35](https://github.com/continuous-foundation/tex-to-typst/pull/35) [`c303e8b`](https://github.com/continuous-foundation/tex-to-typst/commit/c303e8b671293175c3684a7150027708ec813288) Thanks [@rowanc1](https://github.com/rowanc1)! - Fix sized vertical-bar delimiters (`\left|`, `\bigl|`, `\lvert`/`\rvert`, etc.) failing with "Undefined left bracket" when used inside a `\frac`/`\dfrac` argument. Over-captured delimiter arguments are now normalized so only the delimiter is consumed.
  - Add `\lvert`, `\rvert`, `\Vert`, `\lVert`, `\rVert` mappings and accept named bar/angle/floor/ceil delimiters in `\left`/`\right`.
  - Fold `\left … matrix … \right` delimiters into the matrix: matching delimiters become `mat(delim: …)`, while mismatched delimiters wrap in `lr(…)` so each side scales with the matrix.
  - Ignore brackets inside Typst string literals (e.g. `delim: "["`) when checking bracket balance.
