---
"tex-to-typst": patch
---

Add a generated `src/symbols.ts` table (built from `scripts/symbols.html` via `bun run generate:symbols`) that augments `typstMacros` with hundreds of additional LaTeX-to-Typst symbol mappings. Curated mappings continue to take precedence over the generated defaults, and deprecated Typst names are skipped.
