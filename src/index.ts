import { unified } from 'unified';
import {
  unifiedLatexFromString,
  unifiedLatexAstComplier,
} from '@unified-latex/unified-latex-util-parse';
import {
  unifiedLatexAttachMacroArguments,
  gobbleArguments,
} from '@unified-latex/unified-latex-util-arguments';
import { typstEnvs, typstMacros, typstStrings } from './macros.js';
import type { IState, LatexNode, StateData } from './types.js';
import { areBracketsBalanced, BRACKETS } from './utils.js';

export function parseLatex(value: string) {
  const file = unified()
    .use(unifiedLatexFromString, { mode: 'math' })
    .use(unifiedLatexAstComplier)
    .use(unifiedLatexAttachMacroArguments, {
      macros: {
        vec: { signature: 'm' },
        boldsymbol: { signature: 'm' },
        left: { signature: 'm' },
        right: { signature: 'm' },
        big: { signature: 'm' },
        bigr: { signature: 'm' },
        bigl: { signature: 'm' },
        Big: { signature: 'm' },
        Bigr: { signature: 'm' },
        Bigl: { signature: 'm' },
        bigg: { signature: 'm' },
        biggr: { signature: 'm' },
        biggl: { signature: 'm' },
        Bigg: { signature: 'm' },
        Biggr: { signature: 'm' },
        Biggl: { signature: 'm' },
        dot: { signature: 'm' },
        ddot: { signature: 'm' },
        hat: { signature: 'm' },
        tilde: { signature: 'm' },
        check: { signature: 'm' },
        bar: { signature: 'm' },
        widehat: { signature: 'm' },
        widetilde: { signature: 'm' },
        overset: { signature: 'm m' },
        underset: { signature: 'm m' },
        overbrace: { signature: 'm' },
        overline: { signature: 'm' },
        overparen: { signature: 'm' },
        underbrace: { signature: 'm' },
        underline: { signature: 'm' },
        underparen: { signature: 'm' },
        overrightarrow: { signature: 'm' },
        overleftarrow: { signature: 'm' },
        stackrel: { signature: 'm m' },
        mathop: { signature: 'm' },
        bf: { signature: 'm' },
        textstyle: { signature: 'm' },
        // color: { signature: 'm m' }, // This doesn't work, changing it below manually
      },
    })
    .processSync({ value });
  const content = (file.result as any).content;
  const tree = { type: 'math', content };
  return tree;
}

export * from './macros.js';

export function walkLatex(node: LatexNode) {
  delete node.position;
  if (Array.isArray(node.content)) {
    const content = (node.content as LatexNode[]).map((n) => walkLatex(n)) as LatexNode[];
    let skip = 0;
    const parsed = content.reduce((list, next, i, array) => {
      if (skip > 0) {
        skip -= 1;
        return list;
      }
      if (next.type === 'string' && (next.content === '_' || next.content === '^')) {
        const { args, nodesRemoved } = gobbleArguments(array.slice(i + 1), 'm');
        next.type = 'macro';
        next.args = args;
        skip += nodesRemoved;
      }
      if (next.type === 'macro' && next.content === 'color') {
        // Unsure why this is necessary, but the color macro override doesn't seem to work
        const { args, nodesRemoved } = gobbleArguments(array.slice(i + 1), 'm');
        next.type = 'macro';
        // For some reason there is a blank arg at the start
        next.args = [...(next.args?.slice(1) ?? []), ...args];
        skip += nodesRemoved;
      }
      if (next.type === 'macro' && next.content === 'textstyle') {
        next.content = 'text';
      }
      if (
        next.type === 'macro' &&
        (next.content === 'overbrace' || next.content === 'underbrace')
      ) {
        const { args, nodesRemoved } = gobbleArguments(array.slice(i + 1), 'm');
        if (
          args[0].content.length === 1 &&
          args[0].content[0].type === 'macro' &&
          ((args[0].content[0].content === '^' && next.content === 'overbrace') ||
            (args[0].content[0].content === '_' && next.content === 'underbrace'))
        ) {
          next.args = [...(next.args ?? []), ...args[0].content[0].args];
          skip += nodesRemoved;
        }
        if (
          args[0].content.length === 1 &&
          args[0].content[0].type === 'string' &&
          ((args[0].content[0].content === '^' && next.content === 'overbrace') ||
            (args[0].content[0].content === '_' && next.content === 'underbrace'))
        ) {
          // need to get another argument, the _/^ was treated as a string, not an arg
          const { args: doubleArgs, nodesRemoved: doubleNodesRemoved } = gobbleArguments(
            array.slice(i + 1),
            'm m',
          );
          next.args = [...(next.args ?? []), doubleArgs[1]];
          skip += doubleNodesRemoved;
        }
      }
      if (next.type === 'macro' && next.content === 'middle' && array[i + 1]?.content === '|') {
        skip += 1;
      }
      if (
        next.type === 'group' &&
        (next.content as LatexNode[])?.find?.((n) => n.type === 'macro' && n.content === 'over')
      ) {
        // Change {a \over b} to \frac{a}{b}
        const children = next.content as LatexNode[];
        next.type = 'macro';
        next.content = 'frac';
        const index = children.findIndex((n) => n.type === 'macro' && n.content === 'over');
        next.args = [
          { type: 'argument', content: children.slice(0, index) },
          { type: 'argument', content: children.slice(index + 1) },
        ];
      }
      list.push(next);
      return list;
    }, [] as LatexNode[]);
    node.content = parsed;
    return { ...node, content: parsed };
  }
  if (Array.isArray(node.args)) {
    const args = (node.args as LatexNode[]).map((n) => walkLatex(n)) as LatexNode[];
    node.args = args;
    return { ...node, args };
  }
  return node;
}

class State implements IState {
  _value: string;
  data: StateData;

  constructor(opts?: { writeOutBrackets?: boolean }) {
    this._value = '';
    this.data = { writeOutBrackets: opts?.writeOutBrackets ?? false };
  }

  get value() {
    return this._value;
  }

  useMacro(macro: string) {
    if (!this.data.macros) this.data.macros = new Set();
    this.data.macros.add(macro);
  }

  addWhitespace() {
    const lastChar = this.value.slice(-1);
    if (!this._value) return;
    if (lastChar.match(/^(["\s_^{(-])$/)) return;
    const lastTwoChar = this.value.slice(-2);
    if (!this._value || lastTwoChar === ')[' || lastTwoChar === '[$') return; // e.g. `#text(fill: red)[V]
    this._value += ' ';
  }

  _scriptsSimplified = false;

  write(str?: string) {
    if (!str) return;
    if (Object.keys(BRACKETS).includes(str) && this.data.inFunction && this.data.writeOutBrackets) {
      this.addWhitespace();
      this._value += BRACKETS[str];
      return;
    }
    // This is a bit verbose, but the statements are much easier to read
    if (this._scriptsSimplified && str === '(') {
      this.addWhitespace();
    } else if (str.match(/^([})_^.,;!])$/) || str === '\\"') {
      // Ignore!
    } else {
      this.addWhitespace();
    }
    this._scriptsSimplified = false;
    this._value += str;
  }

  writeChildren(node: LatexNode) {
    if (!Array.isArray(node?.content)) return;
    node.content?.forEach((n) => {
      writeTypst(n, this);
    });
  }

  _simplify?: boolean;
  _lastFunction?: number;
  _closeToken: string[] = [];
  _currentFunctions: string[] = [];

  get _currentFunction() {
    return this._currentFunctions.slice(-1)[0];
  }

  get _functionCount() {
    return this._currentFunctions.length;
  }

  openFunction(
    command: string,
    { openToken, closeToken }: { openToken?: string; closeToken?: string } = {},
  ) {
    if (command === 'text') {
      this.addWhitespace();
    } else {
      this.write(command);
    }
    this._currentFunctions.push(command);
    this.data.inFunction = true;
    this._simplify = command === '_' || command === '^';
    this._lastFunction = this._value.length;
    this._value += openToken ?? (command === 'text' ? '"' : '(');
    this._closeToken.push(closeToken ?? (command === 'text' ? '"' : ')'));
  }

  closeFunction() {
    this._value += this._closeToken.pop() || ')';
    this._currentFunctions.pop();
    this.data.inFunction = this._functionCount >= 1;
    if (!this._simplify) return;
    // We will attempt to change `x_(i)` into `x_i`
    const simple = this._value.slice(this._lastFunction);
    if (simple.match(/^\([a-zA-Z0-9]*\)$/)) {
      this._value = this._value.slice(0, this._lastFunction) + simple.slice(1, -1);
      this._scriptsSimplified = true;
    }
  }
}

function convert(state: IState, node: LatexNode) {
  if (node.type === 'macro' && typeof node.content === 'string') {
    const result = typstMacros[node.content];
    const converted = typeof result === 'function' ? result(state, node) : result;
    return converted ?? node.content;
  }
  return '';
}

function convertText(state: IState, text: string): string {
  const result = typstStrings[text];
  if (typeof result === 'function') return result(state) || text;
  return result || text;
}

export function writeTypst(node: LatexNode, state: IState = new State()) {
  if (node.type === 'whitespace') {
    // We are controlling whitespace in the renderer
    return state;
  } else if (node.type === 'string') {
    // Values can come in as multiple characters
    const val = node.content as string;
    if ((state as any)._currentFunction === 'text') {
      state.write(convertText(state, val));
    } else {
      val.split('').forEach((v) => {
        state.write(convertText(state, v));
      });
    }
  } else if (node.type === 'environment' && Array.isArray(node.content)) {
    const env = typstEnvs[node.env];
    env?.(state, node);
  } else if (Array.isArray(node.content)) {
    // If the node is a group after a sub/super script, ensure it is wrapped in parenthesis
    const wrapChildren = state.value.match(/([_^])$/) && node.type === 'group';
    if (wrapChildren) state.openFunction('');
    state.writeChildren(node);
    if (wrapChildren) state.closeFunction();
  } else if (node.type === 'macro' && Array.isArray(node.args)) {
    const converted = convert(state, node);
    if (node.args.length === 0) {
      state.write(converted);
      return state;
    }
    state.openFunction(converted);
    node.args
      .filter((n) => {
        if (Array.isArray(n.content) && n.content.length === 0) return false;
        return true;
      })
      .forEach((n, i) => {
        if (i !== 0) state.write(',');
        writeTypst(n, state);
      });
    state.closeFunction();
  } else if (node.type === 'macro' && typeof node.content === 'string') {
    const converted = convert(state, node);
    state.write(converted ?? node.content);
  }
  return state;
}

function postProcess(typst: string) {
  return (
    typst
      .replace(/^(_|\^)/, '""$1')
      // Turn `"SR"= 1` into `"SR" = 1`
      .replace(/"([^"]*)"=/g, '"$1" =')
      // Replace numbers like "2 7" into "27"
      .replace(/(\d+)(?:\s+)(?=\d)/g, '$1')
  );
}

export function texToTypst(
  value: string,
  options?: { writeOutBrackets?: boolean },
): { value: string; macros?: Set<string> } {
  const tree = parseLatex(value);
  walkLatex(tree);
  const state = writeTypst(tree, new State({ writeOutBrackets: options?.writeOutBrackets }));
  const typstValue = postProcess(state.value);
  if (options?.writeOutBrackets || areBracketsBalanced(typstValue)) {
    return { value: typstValue, macros: state.data.macros };
  }
  // This could be improved to a single pass if we have an intermediate AST for writing typst
  // However, we are just writing this out twice at the moment if we find unbalanced brackets.
  return texToTypst(value, { writeOutBrackets: true });
}
