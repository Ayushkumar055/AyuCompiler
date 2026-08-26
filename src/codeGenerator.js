class CodeGenerator {
    generate(node) {
        if (!node) return '';

        switch (node.type) {
            // ==========================================
            // PROGRAM
            // ==========================================
            case 'Program':
                return node.body
                    .map(statement => this.generate(statement))
                    .join('\n');

            // ==========================================
            // VARIABLE DECLARATION
            // ==========================================
            case 'VariableDeclaration':
                return `let ${node.name} = ${this.generate(node.value)};`;

            // ==========================================
            // ASSIGNMENT (Identifiers & Member Targets)
            // ==========================================
            case 'Assignment': {
                let targetStr = '';
                if (node.target) {
                    targetStr = typeof node.target === 'object' ? this.generate(node.target) : node.target;
                } else if (node.name) {
                    targetStr = node.name;
                }
                return `${targetStr} = ${this.generate(node.value)};`;
            }

            // ==========================================
            // ARRAY / MEMBER ASSIGNMENT
            // ==========================================
            case 'ArrayAssignment':
                return `${this.generate(node.target)} = ${this.generate(node.value)};`;

            // ==========================================
            // PRINT
            // ==========================================
            case 'PrintStatement':
                return `console.log(${this.generate(node.expression)});`;

            // ==========================================
            // EXPRESSION STATEMENT
            // ==========================================
            case 'ExpressionStatement':
                return `${this.generate(node.expression)};`;

            // ==========================================
            // FUNCTION DECLARATION
            // ==========================================
            case 'FunctionDeclaration': {
                const parameters = (node.parameters || []).join(', ');
                const body = (node.body || [])
                    .map(statement => this.generate(statement))
                    .join('\n');

                return `function ${node.name}(${parameters}) {\n${body}\n}`;
            }

            // ==========================================
            // RETURN
            // ==========================================
            case 'ReturnStatement':
                return node.value ? `return ${this.generate(node.value)};` : 'return;';

            // ==========================================
            // FUNCTION CALL
            // ==========================================
            case 'CallExpression': {
                let functionName = node.name;

                if (!functionName && node.callee) {
                    if (typeof node.callee === 'string') {
                        functionName = node.callee;
                    } else if (node.callee.name) {
                        functionName = node.callee.name;
                    } else if (node.callee.type) {
                        functionName = this.generate(node.callee);
                    }
                }

                if (!functionName) {
                    throw new Error('Function name missing in CallExpression');
                }

                const argumentsList = node.arguments || [];

                // Standard Builtins
                if (functionName === 'length') {
                    if (argumentsList.length !== 1) {
                        throw new Error('length() expects exactly one argument');
                    }
                    return `(${this.generate(argumentsList[0])}).length`;
                }

                if (functionName === 'upper') {
                    if (argumentsList.length !== 1) {
                        throw new Error('upper() expects exactly one argument');
                    }
                    return `String(${this.generate(argumentsList[0])}).toUpperCase()`;
                }

                if (functionName === 'lower') {
                    if (argumentsList.length !== 1) {
                        throw new Error('lower() expects exactly one argument');
                    }
                    return `String(${this.generate(argumentsList[0])}).toLowerCase()`;
                }

                if (functionName === 'contains') {
                    if (argumentsList.length !== 2) {
                        throw new Error('contains() expects exactly two arguments');
                    }
                    return `(${this.generate(argumentsList[0])}).includes(${this.generate(argumentsList[1])})`;
                }

                if (functionName === 'indexOf') {
                    if (argumentsList.length !== 2) {
                        throw new Error('indexOf() expects exactly two arguments');
                    }
                    return `(${this.generate(argumentsList[0])}).indexOf(${this.generate(argumentsList[1])})`;
                }

                if (functionName === 'push') {
                    if (argumentsList.length !== 2) {
                        throw new Error('push() expects exactly two arguments');
                    }
                    return `(${this.generate(argumentsList[0])}).push(${this.generate(argumentsList[1])})`;
                }

                if (functionName === 'pop') {
                    if (argumentsList.length !== 1) {
                        throw new Error('pop() expects exactly one argument');
                    }
                    return `(${this.generate(argumentsList[0])}).pop()`;
                }

                const args = argumentsList
                    .map(argument => this.generate(argument))
                    .join(', ');

                return `${functionName}(${args})`;
            }

            // ==========================================
            // INPUT
            // ==========================================
            case 'InputExpression':
                return `require('readline-sync').question(${node.prompt ? this.generate(node.prompt) : "''"})`;

            case 'InputNumberExpression':
                return `Number(require('readline-sync').question(${node.prompt ? this.generate(node.prompt) : "''"}))`;

            // ==========================================
            // IF STATEMENT
            // ==========================================
            case 'IfStatement': {
                const condition = this.generate(node.condition);
                const consequent = (node.consequent || [])
                    .map(statement => this.generate(statement))
                    .join('\n');

                let code = `if (${condition}) {\n${consequent}\n}`;

                if (node.alternate) {
                    if (
                        Array.isArray(node.alternate) &&
                        node.alternate.length === 1 &&
                        node.alternate[0].type === 'IfStatement'
                    ) {
                        code += ` else ${this.generate(node.alternate[0])}`;
                    } else if (Array.isArray(node.alternate)) {
                        const alternate = node.alternate
                            .map(statement => this.generate(statement))
                            .join('\n');
                        code += ` else {\n${alternate}\n}`;
                    } else {
                        code += ` else {\n${this.generate(node.alternate)}\n}`;
                    }
                }

                return code;
            }

            // ==========================================
            // WHILE LOOP
            // ==========================================
            case 'WhileStatement': {
                const condition = this.generate(node.condition);
                const body = (node.body || [])
                    .map(statement => this.generate(statement))
                    .join('\n');

                return `while (${condition}) {\n${body}\n}`;
            }

            // ==========================================
            // FOR LOOP
            // ==========================================
            case 'ForStatement': {
                const initialization = `let ${node.variable} = ${this.generate(node.start)}`;
                const condition = this.generate(node.condition);
                let update = this.generate(node.update);
                update = update.replace(/;+$/, ''); // Strip trailing semicolon

                const body = (node.body || [])
                    .map(statement => this.generate(statement))
                    .join('\n');

                return `for (${initialization}; ${condition}; ${update}) {\n${body}\n}`;
            }

            // ==========================================
            // FOR EACH LOOP
            // ==========================================
            case 'ForEachStatement': {
                const iterable = this.generate(node.iterable);
                const body = (node.body || [])
                    .map(statement => this.generate(statement))
                    .join('\n');

                return `for (const ${node.variable} of ${iterable}) {\n${body}\n}`;
            }

            // ==========================================
            // BREAK & CONTINUE
            // ==========================================
            case 'BreakStatement':
                return 'break;';

            case 'ContinueStatement':
                return 'continue;';

            // ==========================================
            // EXPRESSIONS & LITERALS
            // ==========================================
            case 'BinaryExpression':
                return `(${this.generate(node.left)} ${node.operator} ${this.generate(node.right)})`;

            case 'UnaryExpression':
                return `(${node.operator}${this.generate(node.argument)})`;

            case 'ConditionalExpression':
                return `(${this.generate(node.condition)} ? ${this.generate(node.consequent)} : ${this.generate(node.alternate)})`;

            case 'NumberLiteral':
            case 'BooleanLiteral':
                return String(node.value);

            case 'StringLiteral':
                return JSON.stringify(node.value);

            case 'Identifier':
                return node.name;

            case 'ArrayExpression': {
                const elements = (node.elements || [])
                    .map(element => this.generate(element))
                    .join(', ');
                return `[${elements}]`;
            }

            case 'MemberExpression': {
                const object = this.generate(node.object);
                if (node.computed === false) {
                    const propName = node.property.name ? node.property.name : this.generate(node.property);
                    return `${object}.${propName}`;
                }
                const property = this.generate(node.property);
                return `${object}[${property}]`;
            }

            default:
                throw new Error(`Unknown AST node type: ${node.type}`);
        }
    }
}

module.exports = CodeGenerator;