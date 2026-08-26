class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];

        this.keywords = {
            let: 'LET',
            print: 'PRINT',
            if: 'IF',
            else: 'ELSE',
            while: 'WHILE',
            for: 'FOR',
            in: 'IN',
            return: 'RETURN',
            fn: 'FUNCTION',
            true: 'BOOLEAN',
            false: 'BOOLEAN',
            break: 'BREAK',
            continue: 'CONTINUE',
            input: 'INPUT',
            inputNumber: 'INPUT_NUMBER'
        };
    }

    advance(count = 1) {
        for (let i = 0; i < count; i++) {
            if (this.input[this.position] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.position++;
        }
    }

    addToken(type, value, line = this.line, column = this.column) {
        this.tokens.push({
            type,
            value,
            line,
            column
        });
    }

    error(message, line = this.line, column = this.column) {
        const error = new Error(`${message} at line ${line}, column ${column}`);
        error.name = 'LexerError';
        error.line = line;
        error.column = column;
        throw error;
    }

    tokenize() {
        while (this.position < this.input.length) {
            const char = this.input[this.position];
            const tokenLine = this.line;
            const tokenColumn = this.column;

            // ==============================
            // WHITESPACE
            // ==============================
            if (/\s/.test(char)) {
                this.advance();
                continue;
            }

            // ==============================
            // COMMENTS (Single-line & Multi-line)
            // ==============================
            if (char === '/' && this.input[this.position + 1] === '/') {
                while (this.position < this.input.length && this.input[this.position] !== '\n') {
                    this.advance();
                }
                continue;
            }

            if (char === '/' && this.input[this.position + 1] === '*') {
                this.advance(2);
                while (
                    this.position < this.input.length &&
                    !(this.input[this.position] === '*' && this.input[this.position + 1] === '/')
                ) {
                    this.advance();
                }

                if (this.position >= this.input.length) {
                    this.error('Unterminated block comment', tokenLine, tokenColumn);
                }

                this.advance(2); // Skip closing '*/'
                continue;
            }

            // ==============================
            // NUMBERS
            // ==============================
            if (/[0-9]/.test(char)) {
                this.readNumber(tokenLine, tokenColumn);
                continue;
            }

            // ==============================
            // STRINGS
            // ==============================
            if (char === '"' || char === "'") {
                this.readString(tokenLine, tokenColumn);
                continue;
            }

            // ==============================
            // IDENTIFIERS / KEYWORDS
            // ==============================
            if (/[a-zA-Z_]/.test(char)) {
                this.readIdentifier(tokenLine, tokenColumn);
                continue;
            }

            // ==============================
            // TWO-CHARACTER OPERATORS
            // ==============================
            const twoChar = this.input.substring(this.position, this.position + 2);
            const twoCharMap = {
                '>=': { type: 'COMPARISON', val: '>=' },
                '<=': { type: 'COMPARISON', val: '<=' },
                '==': { type: 'COMPARISON', val: '==' },
                '!=': { type: 'COMPARISON', val: '!=' },
                '&&': { type: 'AND', val: '&&' },
                '||': { type: 'OR', val: '||' }
            };

            if (twoCharMap[twoChar]) {
                this.addToken(twoCharMap[twoChar].type, twoCharMap[twoChar].val, tokenLine, tokenColumn);
                this.advance(2);
                continue;
            }

            // ==============================
            // SINGLE-CHARACTER TOKENS
            // ==============================
            switch (char) {
                case '+':
                    this.addToken('PLUS', '+', tokenLine, tokenColumn);
                    break;
                case '-':
                    this.addToken('MINUS', '-', tokenLine, tokenColumn);
                    break;
                case '*':
                    this.addToken('MULTIPLY', '*', tokenLine, tokenColumn);
                    break;
                case '/':
                    this.addToken('DIVIDE', '/', tokenLine, tokenColumn);
                    break;
                case '%':
                    this.addToken('MODULO', '%', tokenLine, tokenColumn);
                    break;
                case '>':
                case '<':
                    this.addToken('COMPARISON', char, tokenLine, tokenColumn);
                    break;
                case '=':
                    this.addToken('EQUALS', '=', tokenLine, tokenColumn);
                    break;
                case '!':
                    this.addToken('NOT', '!', tokenLine, tokenColumn);
                    break;
                case '&':
                    this.addToken('BIT_AND', '&', tokenLine, tokenColumn);
                    break;
                case '|':
                    this.addToken('BIT_OR', '|', tokenLine, tokenColumn);
                    break;
                case '?':
                    this.addToken('QUESTION', '?', tokenLine, tokenColumn);
                    break;
                case ':':
                    this.addToken('COLON', ':', tokenLine, tokenColumn);
                    break;
                case '.':
                    this.addToken('DOT', '.', tokenLine, tokenColumn);
                    break;
                case ';':
                    this.addToken('SEMICOLON', ';', tokenLine, tokenColumn);
                    break;
                case '(':
                    this.addToken('LPAREN', '(', tokenLine, tokenColumn);
                    break;
                case ')':
                    this.addToken('RPAREN', ')', tokenLine, tokenColumn);
                    break;
                case '{':
                    this.addToken('LBRACE', '{', tokenLine, tokenColumn);
                    break;
                case '}':
                    this.addToken('RBRACE', '}', tokenLine, tokenColumn);
                    break;
                case '[':
                    this.addToken('LBRACKET', '[', tokenLine, tokenColumn);
                    break;
                case ']':
                    this.addToken('RBRACKET', ']', tokenLine, tokenColumn);
                    break;
                case ',':
                    this.addToken('COMMA', ',', tokenLine, tokenColumn);
                    break;
                default:
                    this.error(`Unexpected character '${char}'`, tokenLine, tokenColumn);
            }

            this.advance();
        }

        this.addToken('EOF', null, this.line, this.column);
        return this.tokens;
    }

    readNumber(line, column) {
        let number = '';
        let hasDecimal = false;

        while (this.position < this.input.length) {
            const char = this.input[this.position];

            if (/[0-9]/.test(char)) {
                number += char;
                this.advance();
            } else if (char === '.' && !hasDecimal && /[0-9]/.test(this.input[this.position + 1])) {
                hasDecimal = true;
                number += char;
                this.advance();
            } else {
                break;
            }
        }

        this.addToken('NUMBER', Number(number), line, column);
    }

    readString(line, column) {
        const quote = this.input[this.position];
        this.advance(); // Skip opening quote

        let string = '';

        while (this.position < this.input.length && this.input[this.position] !== quote) {
            if (this.input[this.position] === '\\') {
                this.advance(); // Skip backslash

                if (this.position >= this.input.length) {
                    this.error('Unterminated string after escape', line, column);
                }

                const escapeChar = this.input[this.position];
                const escapeMap = {
                    n: '\n',
                    t: '\t',
                    r: '\r',
                    '\\': '\\',
                    '"': '"',
                    "'": "'"
                };

                string += escapeMap[escapeChar] !== undefined ? escapeMap[escapeChar] : escapeChar;
                this.advance();
            } else {
                string += this.input[this.position];
                this.advance();
            }
        }

        if (this.position >= this.input.length) {
            this.error('Unterminated string', line, column);
        }

        this.advance(); // Skip closing quote
        this.addToken('STRING', string, line, column);
    }

    readIdentifier(line, column) {
        let identifier = '';

        while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
            identifier += this.input[this.position];
            this.advance();
        }

        const type = this.keywords[identifier] || 'IDENTIFIER';
        let value = identifier;

        if (identifier === 'true') value = true;
        if (identifier === 'false') value = false;

        this.addToken(type, value, line, column);
    }
}

module.exports = Lexer;