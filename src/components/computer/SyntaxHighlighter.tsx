// Token-level syntax highlighting for code lines

export interface Token {
  text: string;
  type: "keyword" | "string" | "comment" | "number" | "tag" | "attribute" | "punctuation" | "variable" | "function" | "operator" | "plain";
}

const KEYWORDS = new Set([
  "import", "export", "from", "const", "let", "var", "function", "return",
  "if", "else", "for", "while", "class", "extends", "new", "this",
  "async", "await", "default", "typeof", "interface", "type", "enum",
  "true", "false", "null", "undefined", "void", "readonly",
  "public", "private", "protected", "static", "abstract",
]);

const HTML_TAGS = new Set([
  "html", "head", "body", "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "img", "ul", "ol", "li", "table", "tr", "td", "th", "form", "input",
  "button", "header", "footer", "main", "section", "nav", "meta", "link",
  "title", "script", "style", "DOCTYPE",
]);

export function tokenize(content: string): Token[] {
  if (!content || !content.trim()) return [{ text: content || "\u00A0", type: "plain" }];

  const tokens: Token[] = [];
  let i = 0;

  while (i < content.length) {
    // Comments (// or # for markdown)
    if (content[i] === "/" && content[i + 1] === "/") {
      tokens.push({ text: content.slice(i), type: "comment" });
      break;
    }

    // Markdown headings
    if (i === 0 && content.trimStart().startsWith("#") && !content.trimStart().startsWith("#!")) {
      const leadingSpaces = content.length - content.trimStart().length;
      if (leadingSpaces > 0) tokens.push({ text: content.slice(0, leadingSpaces), type: "plain" });
      const rest = content.trimStart();
      const hashMatch = rest.match(/^(#{1,6})\s/);
      if (hashMatch) {
        tokens.push({ text: hashMatch[1], type: "keyword" });
        tokens.push({ text: rest.slice(hashMatch[1].length), type: "tag" });
        break;
      }
    }

    // Strings
    if (content[i] === '"' || content[i] === "'" || content[i] === "`") {
      const quote = content[i];
      let j = i + 1;
      while (j < content.length && content[j] !== quote) {
        if (content[j] === "\\") j++;
        j++;
      }
      tokens.push({ text: content.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }

    // HTML tags
    if (content[i] === "<") {
      let j = i + 1;
      const isClosing = content[j] === "/";
      if (isClosing) j++;
      const tagStart = j;
      while (j < content.length && /[a-zA-Z0-9!-]/.test(content[j])) j++;
      const tagName = content.slice(tagStart, j);
      if (HTML_TAGS.has(tagName) || tagName.startsWith("!")) {
        // Find end of tag
        let k = j;
        while (k < content.length && content[k] !== ">") k++;
        tokens.push({ text: "<" + (isClosing ? "/" : ""), type: "punctuation" });
        tokens.push({ text: tagName, type: "tag" });
        // Parse attributes within the tag
        const attrStr = content.slice(j, k);
        if (attrStr) {
          const attrTokens = tokenizeAttributes(attrStr);
          tokens.push(...attrTokens);
        }
        if (k < content.length) tokens.push({ text: ">", type: "punctuation" });
        i = k + 1;
        continue;
      }
    }

    // Numbers
    if (/\d/.test(content[i]) && (i === 0 || /[\s,;:=(\[{+\-*/<>!&|]/.test(content[i - 1]))) {
      let j = i;
      while (j < content.length && /[\d.%]/.test(content[j])) j++;
      tokens.push({ text: content.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    // Words (keywords, variables, functions)
    if (/[a-zA-Z_$@]/.test(content[i])) {
      let j = i;
      while (j < content.length && /[a-zA-Z0-9_$@]/.test(content[j])) j++;
      const word = content.slice(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (j < content.length && content[j] === "(") {
        tokens.push({ text: word, type: "function" });
      } else {
        tokens.push({ text: word, type: "variable" });
      }
      i = j;
      continue;
    }

    // Operators
    if (/[=+\-*/<>!&|?:]/.test(content[i])) {
      let j = i;
      while (j < content.length && /[=+\-*/<>!&|?:]/.test(content[j])) j++;
      tokens.push({ text: content.slice(i, j), type: "operator" });
      i = j;
      continue;
    }

    // Punctuation
    if (/[{}()\[\];,.]/.test(content[i])) {
      tokens.push({ text: content[i], type: "punctuation" });
      i++;
      continue;
    }

    // Whitespace and other
    let j = i;
    while (j < content.length && !/[a-zA-Z0-9_$"'`</{(=+\-*/>!&|?:})\[\];,.\d#@\\]/.test(content[j])) j++;
    if (j === i) j = i + 1;
    tokens.push({ text: content.slice(i, j), type: "plain" });
    i = j;
  }

  return tokens;
}

function tokenizeAttributes(str: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '"' || str[i] === "'") {
      const q = str[i];
      let j = i + 1;
      while (j < str.length && str[j] !== q) j++;
      tokens.push({ text: str.slice(i, j + 1), type: "string" });
      i = j + 1;
      continue;
    }
    if (str[i] === "=") {
      tokens.push({ text: "=", type: "operator" });
      i++;
      continue;
    }
    if (/[a-zA-Z\-]/.test(str[i])) {
      let j = i;
      while (j < str.length && /[a-zA-Z0-9\-]/.test(str[j])) j++;
      tokens.push({ text: str.slice(i, j), type: "attribute" });
      i = j;
      continue;
    }
    tokens.push({ text: str[i], type: "plain" });
    i++;
  }
  return tokens;
}

const TOKEN_COLORS: Record<Token["type"], string> = {
  keyword: "text-[hsl(280_60%_70%)]",    // purple
  string: "text-[hsl(100_50%_60%)]",      // green
  comment: "text-[hsl(30_6%_40%)]",       // warm dim grey
  number: "text-[hsl(30_80%_65%)]",       // orange
  tag: "text-[hsl(355_65%_65%)]",         // red
  attribute: "text-[hsl(200_60%_65%)]",   // light blue
  punctuation: "text-muted-foreground",
  variable: "text-[hsl(200_50%_75%)]",    // sky blue
  function: "text-[hsl(50_70%_65%)]",     // yellow
  operator: "text-[hsl(180_40%_60%)]",    // teal
  plain: "text-foreground",
};

export function TokenizedLine({ content }: { content: string }) {
  const tokens = tokenize(content);
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={TOKEN_COLORS[token.type]}>{token.text}</span>
      ))}
    </>
  );
}
