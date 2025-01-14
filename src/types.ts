export type Pos = { offset?: number; line?: number; column?: number };
export type Position = { start?: Pos; end?: Pos };
export type LatexNode = {
  type: string;
  content?: string | LatexNode[];
  args?: LatexNode[];
  position?: Position;
} & Record<string, any>;

export type StateData = {
  /**
   * In the `writeTypst` function, we first try writing
   * in simple mode with just the brackets/braces/parens
   * then check to see if the output string is balanced
   *
   * If so, then we return that, if not, we run the
   * `writeTypst` function again with this flag to ensure
   * brackets in a function will be written out.
   *
   * This ensures that the simple outputs like `e_(f (x))`
   * Stay simple, but `e_(f[x) g_(,y])` will spell out the
   * brackets that are content.
   */
  writeOutBrackets?: boolean;
  inFunction?: boolean;
  inArray?: boolean;
  previousMatRows?: number;
  macros?: Set<string>;
};
export interface IState {
  readonly value: string;
  data: StateData;
  write(str: string | undefined): void;
  writeChildren(node: LatexNode): void;
  addWhitespace(): void;
  openFunction(command: string, opts?: { openToken?: string; closeToken?: string }): void;
  closeFunction(): void;
  useMacro(macro: string): void;
}
