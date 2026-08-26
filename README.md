# AyuCompile

AyuCompile is a lightweight programming language compiler built in JavaScript. It parses `.ayu` source files, generates an Abstract Syntax Tree (AST), and compiles them down to executable JavaScript (`.js`) run via Node.js.

---

## 📁 Project Structure

```text
AYUCOMPILE/
│
├── src/
│   ├── lexer.js          # Tokenizer & lexical analysis
│   ├── parser.js         # Recursive descent parser & AST generation
│   ├── codeGenerator.js  # AST-to-JavaScript code generator
│   └── index.js          # CLI compiler entrypoint
│
├── examples/
│   ├── hello.ayu         # General syntax & arithmetic
│   ├── functions.ayu     # User-defined functions & returns
│   ├── nested_if.ayu     # Nested conditionals
│   ├── nested_loops.ayu  # Loops & array iteration
│   ├── arrays.ayu        # Array operations & built-ins
│   ├── precedence.ayu    # Operator precedence verification
│   ├── input.ayu         # User console input
│   └── error.ayu         # Deliberate syntax error for diagnostics
│
├── test-all.ps1          # Automated test suite
├── package.json
└── README.md