export const BRACKETS: Record<string, string> = {
  '[': 'bracket.l',
  ']': 'bracket.r',
  '{': 'brace.l',
  '}': 'brace.r',
  '(': 'paren.l',
  ')': 'paren.r',
  '|': 'bar.v',
  lfloor: 'floor.l',
  '⌊': 'floor.l',
  rfloor: 'floor.r',
  '⌋': 'floor.r',
  rceil: 'ceil.r',
  '⌉': 'ceil.r',
  lceil: 'ceil.l',
  '⌈': 'ceil.l',
};

export function areBracketsBalanced(input: string): boolean {
  // This stack will hold the opening brackets as they appear
  const stack: string[] = [];

  // A map from closing brackets to their corresponding opening bracket
  const bracketMap: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
  };

  // Brackets inside Typst string literals (e.g. `delim: "["`) are not structural
  let inString = false;

  // Check each character in the string
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    // Toggle string state on unescaped double quotes and skip their contents
    if (char === '"' && input[i - 1] !== '\\') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    // If it’s an opening bracket, push it to the stack
    if (char === '(' || char === '[' || char === '{') {
      stack.push(char);
    }
    // If it’s a closing bracket, verify the top of the stack
    else if (char === ')' || char === ']' || char === '}') {
      // If stack is empty or the top of the stack doesn't match the correct opening bracket, it’s unbalanced
      if (!stack.length || bracketMap[char] !== stack.pop()) {
        return false;
      }
    }
    // Ignore other characters
  }

  // If the stack is empty, every opening bracket had a matching closing bracket
  return stack.length === 0;
}
