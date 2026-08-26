class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    currentToken() {
        return this.tokens[this.position] || { type: 'EOF', line: 0, column: 0 };
    }

    peekToken(offset = 1) {
        const index = this.position + offset;
        return index < this.tokens.length ? this.tokens[index] : { type: 'EOF', line: 0, column: 0 };
    }

    error(message) {
        const token = this.currentToken();
        const error = new Error(
            `${message} at line ${token.line || 0}, column ${token.column || 0}`
        );

        error.name = 'ParserError';
        error.line = token.line;
        error.column = token.column;
        error.tokenType = token.type;
        error.tokenValue = token.value;

        throw error;
    }

    eat(type) {
        const token = this.currentToken();

        if (token.type !== type) {
            this.error(`Expected ${type}, but found ${token.type}`);
        }

        this.position++;
        return token;
    }

    // ==========================================
    // PROGRAM
    // ==========================================

    parse() {
        const body = [];

        while (this.currentToken().type !== 'EOF') {
            body.push(this.parseStatement());
        }

        return {
            type: 'Program',
            body
        };
    }

    // ==========================================
    // STATEMENT
    // ==========================================

    parseStatement() {
        const token = this.currentToken();

        switch (token.type) {
            case 'LET':
                return this.parseVariableDeclaration();

            case 'PRINT':
                return this.parsePrintStatement();

            case 'IF':
                return this.parseIfStatement();

            case 'WHILE':
                return this.parseWhileStatement();

            case 'FOR':
                return this.parseForStatement();

            case 'FUNCTION':
                return this.parseFunctionDeclaration();

            case 'RETURN':
                return this.parseReturnStatement();

            case 'BREAK':
                this.eat('BREAK');
                this.eat('SEMICOLON');
                return { type: 'BreakStatement' };

            case 'CONTINUE':
                this.eat('CONTINUE');
                this.eat('SEMICOLON');
                return { type: 'ContinueStatement' };

            default:
                return this.parseExpressionOrAssignmentStatement();
        }
    }

    parseExpressionOrAssignmentStatement() {
        const expr = this.parseExpression();

        if (this.currentToken().type === 'EQUALS') {
            this.eat('EQUALS');

            if (expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
                this.error('Invalid left-hand side in assignment');
            }

            const value = this.parseExpression();
            this.eat('SEMICOLON');

            return {
                type: 'Assignment',
                target: expr,
                value
            };
        }

        this.eat('SEMICOLON');
        return {
            type: 'ExpressionStatement',
            expression: expr
        };
    }

    // ==========================================
    // DECLARATIONS & STATEMENTS
    // ==========================================

    parseVariableDeclaration() {
        this.eat('LET');
        const name = this.eat('IDENTIFIER');
        this.eat('EQUALS');
        const value = this.parseExpression();
        this.eat('SEMICOLON');

        return {
            type: 'VariableDeclaration',
            name: name.value,
            value
        };
    }

    parsePrintStatement() {
        this.eat('PRINT');
        const expression = this.parseExpression();
        this.eat('SEMICOLON');

        return {
            type: 'PrintStatement',
            expression
        };
    }

    parseIfStatement() {
        this.eat('IF');
        const condition = this.parseExpression();
        this.eat('LBRACE');

        const consequent = [];
        while (this.currentToken().type !== 'RBRACE' && this.currentToken().type !== 'EOF') {
            consequent.push(this.parseStatement());
        }

        if (this.currentToken().type === 'EOF') {
            this.error("Expected '}' before end of file");
        }
        this.eat('RBRACE');

        let alternate = null;
        if (this.currentToken().type === 'ELSE') {
            this.eat('ELSE');

            if (this.currentToken().type === 'IF') {
                alternate = [this.parseIfStatement()];
            } else {
                this.eat('LBRACE');
                alternate = [];
                while (this.currentToken().type !== 'RBRACE' && this.currentToken().type !== 'EOF') {
                    alternate.push(this.parseStatement());
                }

                if (this.currentToken().type === 'EOF') {
                    this.error("Expected '}' before end of file");
                }
                this.eat('RBRACE');
            }
        }

        return {
            type: 'IfStatement',
            condition,
            consequent,
            alternate
        };
    }

    parseWhileStatement() {
        this.eat('WHILE');
        const condition = this.parseExpression();
        this.eat('LBRACE');

        const body = [];
        while (this.currentToken().type !== 'RBRACE' && this.currentToken().type !== 'EOF') {
            body.push(this.parseStatement());
        }

        if (this.currentToken().type === 'EOF') {
            this.error("Expected '}' before end of file");
        }
        this.eat('RBRACE');

        return {
            type: 'WhileStatement',
            condition,
            body
        };
    }

    parseForStatement() {
        this.eat('FOR');
        const variable = this.eat('IDENTIFIER');

        if (this.currentToken().type === 'IN') {
            this.eat('IN');
            const iterable = this.parseExpression();
            this.eat('LBRACE');

            const body = [];
            while (this.currentToken().type !== 'RBRACE' && this.currentToken().type !== 'EOF') {
                body.push(this.parseStatement());
            }

            if (this.currentToken().type === 'EOF') {
                this.error("Expected '}' before end of file");
            }
            this.eat('RBRACE');

            return {
                type: 'ForEachStatement',
                variable: variable.value,
                iterable,
                body
            };
        }

        this.eat('EQUALS');
        const start = this.parseExpression();
        this.eat('SEMICOLON');
        const condition = this.parseExpression();
        this.eat('SEMICOLON');
        const update = this.parseForUpdate();

        this.eat('LBRACE');
        const body = [];
        while (this.currentToken().type !== 'RBRACE' && this.currentToken().type !== 'EOF') {
            body.push(this.parseStatement());
        }

        if (this.currentToken().type === 'EOF') {
            this.error("Expected '}' before end of file");
        }
        this.eat('RBRACE');

        return {
            type: 'ForStatement',
            variable: variable.value,
            start,
            condition,
            update,
            body
        };
    }

    parseForUpdate() {
        if (this.currentToken().type === 'IDENTIFIER' && this.peekToken().type === 'EQUALS') {
            const name = this.eat('IDENTIFIER');
            this.eat('EQUALS');
            const value = this.parseExpression();

            return {
                type: 'Assignment',
                target: { type: 'Identifier', name: name.value },
                value
            };
        }

        return this.parseExpression();
    }

    parseFunctionDeclaration() {
        this.eat('FUNCTION');
        const name = this.eat('IDENTIFIER');
        this.eat('LPAREN');

        const parameters = [];
        if (this.currentToken().type !== 'RPAREN') {
            parameters.push(this.eat('IDENTIFIER').value);
            while (this.currentToken().type === 'COMMA') {
                this.eat('COMMA');
                parameters.push(this.eat('IDENTIFIER').value);
            }
        }
        this.eat('RPAREN');

        this.eat('LBRACE');
        const body = [];
        while (this.currentToken().type !== 'RBRACE' && this.currentToken().type !== 'EOF') {
            body.push(this.parseStatement());
        }

        if (this.currentToken().type === 'EOF') {
            this.error("Expected '}' before end of file");
        }
        this.eat('RBRACE');

        return {
            type: 'FunctionDeclaration',
            name: name.value,
            parameters,
            body
        };
    }

    parseReturnStatement() {
        this.eat('RETURN');
        const value = this.currentToken().type === 'SEMICOLON' ? null : this.parseExpression();
        this.eat('SEMICOLON');

        return {
            type: 'ReturnStatement',
            value
        };
    }

    // ==========================================
    // EXPRESSION HIERARCHY
    // ==========================================

    parseExpression() {
        return this.parseTernary();
    }

    parseTernary() {
        const condition = this.parseLogicalOr();

        if (this.currentToken().type === 'QUESTION') {
            this.eat('QUESTION');
            const consequent = this.parseTernary();
            this.eat('COLON');
            const alternate = this.parseTernary();

            return {
                type: 'ConditionalExpression',
                condition,
                consequent,
                alternate
            };
        }

        return condition;
    }

    parseLogicalOr() {
        let left = this.parseLogicalAnd();

        while (this.currentToken().type === 'OR') {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseLogicalAnd();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseLogicalAnd() {
        let left = this.parseBitwiseOr();

        while (this.currentToken().type === 'AND') {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseBitwiseOr();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseBitwiseOr() {
        let left = this.parseBitwiseAnd();

        while (this.currentToken().type === 'BIT_OR') {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseBitwiseAnd();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseBitwiseAnd() {
        let left = this.parseComparison();

        while (this.currentToken().type === 'BIT_AND') {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseComparison();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseComparison() {
        let left = this.parseAdditive();

        while (this.currentToken().type === 'COMPARISON') {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseAdditive();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseAdditive() {
        let left = this.parseTerm();

        while (this.currentToken().type === 'PLUS' || this.currentToken().type === 'MINUS') {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseTerm();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseTerm() {
        let left = this.parseUnary();

        while (
            this.currentToken().type === 'MULTIPLY' ||
            this.currentToken().type === 'DIVIDE' ||
            this.currentToken().type === 'MODULO'
        ) {
            const operator = this.currentToken();
            this.position++;
            const right = this.parseUnary();
            left = {
                type: 'BinaryExpression',
                operator: operator.value,
                left,
                right
            };
        }

        return left;
    }

    parseUnary() {
        if (this.currentToken().type === 'NOT' || this.currentToken().type === 'MINUS') {
            const operator = this.currentToken();
            this.position++;
            return {
                type: 'UnaryExpression',
                operator: operator.value,
                argument: this.parseUnary()
            };
        }

        return this.parsePrimary();
    }

    // ==========================================
    // PRIMARY & POSTFIX (CALLS / MEMBERS)
    // ==========================================

    parsePrimary() {
        const token = this.currentToken();
        let expr;

        switch (token.type) {
            case 'NUMBER':
                this.position++;
                expr = { type: 'NumberLiteral', value: token.value };
                break;

            case 'STRING':
                this.position++;
                expr = { type: 'StringLiteral', value: token.value };
                break;

            case 'BOOLEAN':
                this.position++;
                expr = { type: 'BooleanLiteral', value: token.value };
                break;

            case 'IDENTIFIER':
                this.position++;
                expr = { type: 'Identifier', name: token.value };
                break;

            case 'LBRACKET':
                expr = this.parseArrayExpression();
                break;

            case 'LPAREN':
                this.eat('LPAREN');
                expr = this.parseExpression();
                this.eat('RPAREN');
                break;

            case 'INPUT':
            case 'INPUT_NUMBER': {
                const fnType = token.type === 'INPUT' ? 'InputExpression' : 'InputNumberExpression';
                this.eat(token.type);
                this.eat('LPAREN');
                const prompt = this.currentToken().type !== 'RPAREN' ? this.parseExpression() : null;
                this.eat('RPAREN');
                expr = { type: fnType, prompt };
                break;
            }

            default:
                this.error(`Expected expression, but found ${token.type}`);
        }

        // Postfix chaining (calls, member access, index lookups)
        while (
            this.currentToken().type === 'LPAREN' ||
            this.currentToken().type === 'LBRACKET' ||
            this.currentToken().type === 'DOT'
        ) {
            if (this.currentToken().type === 'LPAREN') {
                this.eat('LPAREN');
                const args = [];
                if (this.currentToken().type !== 'RPAREN') {
                    args.push(this.parseExpression());
                    while (this.currentToken().type === 'COMMA') {
                        this.eat('COMMA');
                        args.push(this.parseExpression());
                    }
                }
                this.eat('RPAREN');
                expr = {
                    type: 'CallExpression',
                    callee: expr,
                    arguments: args
                };
            } else if (this.currentToken().type === 'LBRACKET') {
                this.eat('LBRACKET');
                const index = this.parseExpression();
                this.eat('RBRACKET');
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: index,
                    computed: true
                };
            } else if (this.currentToken().type === 'DOT') {
                this.eat('DOT');
                const prop = this.eat('IDENTIFIER');
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', name: prop.value },
                    computed: false
                };
            }
        }

        return expr;
    }

    parseArrayExpression() {
        this.eat('LBRACKET');
        const elements = [];

        if (this.currentToken().type !== 'RBRACKET') {
            elements.push(this.parseExpression());
            while (this.currentToken().type === 'COMMA') {
                this.eat('COMMA');
                elements.push(this.parseExpression());
            }
        }

        this.eat('RBRACKET');
        return {
            type: 'ArrayExpression',
            elements
        };
    }
}

module.exports = Parser;