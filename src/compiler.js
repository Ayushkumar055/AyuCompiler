const fs = require('fs');

const Lexer = require('./lexer');
const Parser = require('./parser');
const CodeGenerator = require('./codeGenerator');

class Compiler {

    constructor() {
        this.generator = new CodeGenerator();
    }

    compile(sourceCode) {

        // -------------------------
        // 1. LEXICAL ANALYSIS
        // -------------------------

        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();

        // -------------------------
        // 2. PARSING
        // -------------------------

        const parser = new Parser(tokens);
        const ast = parser.parse();

        // -------------------------
        // 3. CODE GENERATION
        // -------------------------

        const javascriptCode =
            this.generator.generate(ast);

        return {
            tokens,
            ast,
            javascriptCode
        };
    }

    compileFile(inputFile, outputFile) {

        const sourceCode =
            fs.readFileSync(inputFile, 'utf8');

        const result =
            this.compile(sourceCode);

        fs.writeFileSync(
            outputFile,
            result.javascriptCode
        );

        return result;
    }
}

module.exports = Compiler;