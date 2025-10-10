import type { IState, LatexNode } from './types.js';
import { BRACKETS } from './utils.js';

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

export const typstMacros: Record<string, string | ((state: IState, node: LatexNode) => string)> = {
  $: '\\$',
  dfrac: 'frac',
  tfrac: 'frac',
  cdot: 'dot.op',
  to: 'arrow.r',
  rightarrow: 'arrow.r',
  Rightarrow: 'arrow.r.double',
  leftarrow: 'arrow.l',
  Leftarrow: 'arrow.l.double',
  leftrightarrow: 'arrow.l.r',
  Leftrightarrow: 'arrow.l.r.double',
  gets: 'arrow.l',
  rightharpoonup: 'harpoon.rt',
  rightharpoondown: 'harpoon.rb',
  rightleftharpoons: 'harpoons.rtlb',
  leftharpoonup: 'harpoon.lt',
  leftharpoondown: 'harpoon.lb',
  leftrightharpoons: 'harpoons.ltrb',
  infin: 'infinity', // This is a mathjax only thing, https://docs.mathjax.org/en/v2.7-latest/tex.html#i
  infty: 'infinity', // oo
  nonumber: '',
  int: 'integral',
  iint: 'integral.double',
  iiint: 'integral.triple',
  oint: 'integral.cont',
  oiint: 'integral.surf',
  oiiint: 'integral.vol',
  sqrt: (state, node) => {
    if (isEmptyNode(node.args?.[0])) return 'sqrt';
    return 'root';
  },
  vec: 'arrow',
  check: 'caron',
  bar: 'macron',
  mathbf: 'bold',
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
  pm: 'plus.minus',
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
  cong: 'tilde.equiv',
  simeq: 'tilde.eq',
  ne: '!=',
  phi: 'phi.alt',
  varphi: 'phi.alt',
  varepsilon: 'epsilon',
  propto: 'prop',
  mapsto: 'mapsto',
  equiv: 'equiv',
  nabla: 'nabla',
  emptyset: 'emptyset',
  varnothing: 'emptyset',
  setminus: 'backslash',
  doteq: 'dot(eq)',
  ge: 'gt.eq',
  geq: 'gt.eq',
  geqslant: 'gt.eq.slant',
  gg: 'gt.double',
  le: 'lt.eq',
  leq: 'lt.eq',
  leqslant: 'lt.eq.slant',
  ll: 'lt.double',
  approx: 'approx',
  neq: 'eq.not',
  otimes: 'times.circle',
  odot: 'dot.circle',
  oplus: 'plus.circle',
  ominus: 'minus.circle',
  circ: 'compose',
  vert: 'bar.v',
  dot: 'dot',
  ddot: 'dot.double',
  dots: 'dots.h',
  ldots: 'dots.h',
  vdots: 'dots.v',
  ddots: 'dots.down',
  subseteq: 'subset.eq',
  cdots: 'dots.h.c',
  cap: 'sect',
  cup: 'union',
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
  wedge: 'and',
  sum: 'sum',
  prod: 'product',
  lfloor: 'floor.l',
  rfloor: 'floor.r',
  langle: 'angle.l',
  rangle: 'angle.r',
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

const matrixEnv = (delim?: string) => (state: IState, node: LatexNode) => {
  state.data.inArray = true;
  state.data.previousMatRows = 0;
  state.openFunction('mat');
  state.write(`delim: ${delim ? `"${delim}"` : '#none'},`);
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
