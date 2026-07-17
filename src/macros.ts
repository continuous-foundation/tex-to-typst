import type { IState, LatexNode } from './types.js';
import { BRACKETS } from './utils.js';
import { symbols } from './symbols.js';

function isEmptyNode(node?: LatexNode): boolean {
  if (!node?.content || node.content.length === 0) return true;
  return false;
}

export const typstStrings: Record<string, string | ((state: IState) => string)> = {
  ',': (state) =>
    state.data.inFunction && (state as any)._currentFunctions.slice(-1)[0] !== 'text'
      ? 'comma'
      : ',',
  '&': (state) => (state.data.inArray ? ',' : '&'),
  '/': '\\/',
  ';': '\\;',
  '~': 'med',
  '"': '\\"',
};

function createBrackets(scale: string): (state: IState, node: LatexNode) => string {
  return (state: IState, node: LatexNode) => {
    const args = node.args;
    node.args = [];
    const b = (args?.[0].content?.[0] as LatexNode).content as string;
    const typstB = BRACKETS[b];
    if (!typstB) throw new Error(`Undefined left bracket: ${b}`);
    return `#scale(x: ${scale}, y: ${scale})[$${typstB}$]`;
  };
}

function splitStrings(node: LatexNode) {
  if (
    node.args?.[0].content?.length === 1 &&
    (node.args?.[0].content as LatexNode[])[0].type === 'string'
  ) {
    node.args[0].content = ((node.args[0].content as LatexNode[])[0].content as string)
      .split('')
      .map((l) => ({ type: 'string', content: l }));
  }
}

/**
 * LaTeX names that take an argument and render as a Typst *function* of the same name
 * (e.g. `\overbrace{x}` -> `overbrace(x)`). The symbol table maps these to the bare
 * bracket glyph (e.g. `brace.t`), which is the wrong shape here, so we skip them and let
 * the name fall through unchanged.
 */
const ANNOTATION_MACROS = new Set([
  'overbrace',
  'underbrace',
  'overparen',
  'underparen',
  'overline',
  'underline',
]);

/**
 * Base LaTeX -> Typst macro mappings, generated from `symbols.html` (see `symbols.ts`).
 *
 * Keyed by the LaTeX name without its leading backslash (e.g. `langle`), mapping to the
 * canonical Typst (codex) name (e.g. `chevron.l`). Deprecated Typst names are skipped so
 * we never emit output the Typst compiler warns about. When several symbols share a LaTeX
 * name we prefer the entry whose Typst name matches the LaTeX name (e.g. `\top` -> `top`
 * rather than `tack.b`), otherwise the first one wins. These are overridden by the curated
 * `baseMacros` below, which take precedence for the handful of names we map differently.
 */
const symbolMacros: Record<string, string> = {};
for (const [typst, sym] of Object.entries(symbols)) {
  if (sym.deprecated) continue;
  const key = sym.latex.replace(/^\\/, '');
  if (!key || ANNOTATION_MACROS.has(key)) continue;
  const existing = symbolMacros[key];
  if (existing === undefined || (existing !== key && typst === key)) {
    symbolMacros[key] = typst;
  }
}

const baseMacros: Record<string, string | ((state: IState, node: LatexNode) => string)> = {
  $: '\\$',
  dfrac: 'frac',
  tfrac: 'frac',
  to: 'arrow.r',
  gets: 'arrow.l',
  infin: 'infinity', // This is a mathjax only thing, https://docs.mathjax.org/en/v2.7-latest/tex.html#i
  nonumber: '',
  sqrt: (state, node) => {
    if (isEmptyNode(node.args?.[0])) return 'sqrt';
    return 'root';
  },
  vec: 'arrow',
  check: 'caron',
  bar: 'macron',
  mathbf: 'bold',
  mathsf: 'sans',
  boldsymbol: 'bold',
  bf: 'bold',
  mathrm: 'upright',
  textrm: 'upright',
  rm: 'upright',
  mbox: (state, node) => {
    const arg = node.args?.[0] as LatexNode;
    node.args = [];
    state.openFunction('upright');
    state.openFunction('text');
    state.writeChildren(arg);
    state.closeFunction();
    state.closeFunction();
    return '';
  },
  mathcal: 'cal',
  mathfrak: 'frak',
  partial: 'diff',
  _: (state, node) => {
    splitStrings(node);
    return '_';
  },
  '^': (state, node) => {
    splitStrings(node);
    return '^';
  },
  big: createBrackets('120%'),
  bigl: createBrackets('120%'),
  bigr: createBrackets('120%'),
  Big: createBrackets('180%'),
  Bigl: createBrackets('180%'),
  Bigr: createBrackets('180%'),
  bigg: createBrackets('240%'),
  biggr: createBrackets('240%'),
  biggl: createBrackets('240%'),
  Bigg: createBrackets('300%'),
  Biggl: createBrackets('300%'),
  Biggr: createBrackets('300%'),
  left: (state, node) => {
    const args = node.args;
    node.args = [];
    const left = (args?.[0].content?.[0] as LatexNode).content;
    if (left === '(') return '(';
    if (left === '[') return '[';
    if (left === '{') return '{';
    if (left === '|') return '|';
    if (left === '.') return '';
    if (left === 'lbrack') return '[';
    if (left === 'vert' || left === 'lvert') return '|';
    if (left === 'Vert' || left === 'lVert') return 'bar.v.double';
    if (left === 'langle') return 'chevron.l';
    if (left === 'lfloor') return 'floor.l';
    if (left === 'lceil') return 'ceil.l';
    throw new Error(`Undefined left bracket: ${left}`);
  },
  lbrack: '[',
  right: (state, node) => {
    const args = node.args;
    node.args = [];
    const right = (args?.[0].content?.[0] as LatexNode).content;
    if (right === ')') return ')';
    if (right === ']') return ']';
    if (right === '}') return '}';
    if (right === '|') return '|';
    if (right === '.') return '';
    if (right === 'rbrack') return ']';
    if (right === 'vert' || right === 'rvert') return '|';
    if (right === 'Vert' || right === 'rVert') return 'bar.v.double';
    if (right === 'rangle') return 'chevron.r';
    if (right === 'rfloor') return 'floor.r';
    if (right === 'rceil') return 'ceil.r';
    throw new Error(`Undefined right bracket: ${right}`);
  },
  rbrack: ']',
  operatorname: (state, node) => {
    const text = node.args?.slice(-1)[0] as LatexNode;
    node.args = [{ type: 'macro', content: 'text', args: [text] }];
    return 'op';
  },
  mathop: 'op',
  '\\': (state, node) => {
    node.args = [];
    if (state.data.inArray) {
      state.data.previousMatRows = (state.data.previousMatRows ?? 0) + 1;
      if ((state as any)._value.slice(-1) === ']') state.addWhitespace();
      return ';';
    }
    return '\\\n';
  },
  cr: (state, node) => {
    node.args = [];
    if (state.data.inArray) {
      state.data.previousMatRows = (state.data.previousMatRows ?? 0) + 1;
      if ((state as any)._value.slice(-1) === ']') state.addWhitespace();
      return ';';
    }
    return '\\\n';
  },
  sim: 'tilde',
  simeq: 'tilde.eq',
  ne: '!=',
  hbar: 'planck.reduce',
  phi: 'phi.alt',
  varphi: 'phi.alt',
  varepsilon: 'epsilon',
  vartheta: 'theta.alt',
  varrho: 'rho.alt',
  varsigma: 'sigma.alt',
  emptyset: 'emptyset',
  setminus: 'backslash',
  ge: 'gt.eq',
  le: 'lt.eq',
  neq: 'eq.not',
  circ: 'compose',
  lvert: 'bar.v',
  rvert: 'bar.v',
  lVert: 'bar.v.double',
  rVert: 'bar.v.double',
  dot: 'dot',
  ddot: 'dot.double',
  dots: 'dots.h',
  ldots: 'dots.h',
  cdots: 'dots.h.c',
  cap: 'sect',
  widehat: 'hat',
  widetilde: 'tilde',
  // Spaces
  ',': 'thin',
  ':': 'med',
  ';': 'thick',
  '!': '#h(-1em)',
  quad: 'quad',
  qquad: 'wide',
  hspace: (state, node) => {
    const dimension = (node.args?.slice(-1)[0].content as LatexNode[])
      ?.map((n) => n.content ?? '')
      .join('');
    node.args = [];
    return `#h(${dimension})`;
  },
  implies: 'arrow.r.double.long',
  ' ': '" "',
  mathbb: (state, node) => {
    const arg = node.args?.[0];
    if (!arg) return '';
    const startPos = (state as any)._value.length;
    // Render the children normally
    state.writeChildren(arg);
    // Get what was just rendered
    const rendered = (state as any)._value.substring(startPos);
    // Remove it from state
    (state as any)._value = (state as any)._value.substring(0, startPos);
    // Double all single CAPITAL letters in the rendered output
    // Match isolated capital letters only (A-Z), not lowercase
    const doubled = rendered.replace(/\b([A-Z])\b/g, '$1$1');
    // Directly append the doubled version (don't use write() to avoid extra whitespace)
    (state as any)._value += doubled;
    node.args = [];
    return '';
  },
  mathscr: (state) => {
    state.useMacro(`#let scr(it) = text(features: ("ss01",), box($cal(it)$))`);
    return 'scr';
  },
  overset: (state, node) => {
    state.useMacro('#import "@preview/ouset:0.2.0": *');
    node.args = node.args?.reverse();
    return 'overset';
  },
  underset: (state, node) => {
    state.useMacro('#import "@preview/ouset:0.2.0": *');
    node.args = node.args?.reverse();
    return 'underset';
  },
  overrightarrow: (state, node) => {
    node.args?.push({ type: 'argument', content: [{ type: 'macro', content: 'arrow' }] });
    return 'accent';
  },
  overleftarrow: (state, node) => {
    node.args?.push({ type: 'argument', content: [{ type: 'macro', content: 'arrow.l' }] });
    return 'accent';
  },
  middle: (state) => {
    return `mat(delim: #("|", none), ${';'.repeat(state.data.previousMatRows ?? 1)})`;
  },
  stackrel: (state, node) => {
    const args = node.args?.reverse();
    node.args = [];
    state.writeChildren(args?.[0] as LatexNode);
    state.write('^');
    state.writeChildren(args?.[1] as LatexNode);
    return '';
  },
  lr: (state, node) => {
    // Built by `foldMatrixDelimiters`: content is [leftNode, matrixEnv, rightNode].
    // Delimiters are appended directly (not via `write`) so they sit tight against the
    // matrix and keep their literal form (e.g. `|`) instead of being spelled out.
    const content = (node.args?.[0]?.content as LatexNode[]) ?? [];
    const [leftNode, envNode, rightNode] = content;
    node.args = [];
    const left = typstMacros.left as (s: IState, n: LatexNode) => string;
    const right = typstMacros.right as (s: IState, n: LatexNode) => string;
    state.openFunction('lr');
    let leftLen = 0;
    if (leftNode) {
      const sym = left(state, leftNode);
      (state as any)._value += sym;
      leftLen = sym.length;
    }
    const posAfterLeft = (state as any)._value.length;
    if (envNode) state.writeChildren({ type: 'group', content: [envNode] });
    // Drop the whitespace the matrix's opening inserts so the left delimiter sits tight
    if (leftLen > 0 && (state as any)._value[posAfterLeft] === ' ') {
      (state as any)._value =
        (state as any)._value.slice(0, posAfterLeft) +
        (state as any)._value.slice(posAfterLeft + 1);
    }
    if (rightNode) (state as any)._value += right(state, rightNode);
    state.closeFunction();
    return '';
  },
  color: (state, node) => {
    const [fill, children] = node.args ?? [];
    const color = (fill.content?.[0] as LatexNode)?.content as string;
    node.args = [];
    state.openFunction(`#text(fill: ${color})`, { openToken: '[$', closeToken: '$]' });
    state.writeChildren(children as LatexNode);
    state.closeFunction();
    return '';
  },
};

/**
 * The full macro table: generated symbol mappings augmented with the curated `baseMacros`.
 * `baseMacros` is spread last so hand-tuned entries win over the generated defaults.
 */
export const typstMacros: Record<string, string | ((state: IState, node: LatexNode) => string)> = {
  ...symbolMacros,
  ...baseMacros,
};

const matrixEnv = (delim?: string) => (state: IState, node: LatexNode) => {
  state.data.inArray = true;
  state.data.previousMatRows = 0;
  state.openFunction('mat');
  // `matDelim` is set when a surrounding `\left`/`\right` delimiter has been folded in.
  const override = node.matDelim as string | null | undefined;
  const resolved = override === undefined ? delim : override;
  state.write(`delim: ${resolved ? `"${resolved}"` : '#none'},`);
  state.writeChildren(node);
  state.closeFunction();
  state.data.inArray = false;
};

export const typstEnvs: Record<string, (state: IState, node: LatexNode) => void> = {
  array: matrixEnv(),
  matrix: matrixEnv(),
  pmatrix: matrixEnv('('),
  bmatrix: matrixEnv('['),
  Bmatrix: matrixEnv('{'),
  vmatrix: matrixEnv('|'),
  aligned(state, node) {
    state.writeChildren(node);
  },
  ['aligned*'](state, node) {
    state.writeChildren(node);
  },
};
