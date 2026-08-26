const fs = require('fs');

const Lexer = require('./lexer');
const Parser = require('./parser');
const CodeGenerator = require('./codeGenerator');

const inputFile = process.argv[2];

if (!inputFile) {
    console.log(`
❌ AyuCompile Error
--------------------------------
No input file provided.

Usage:
node src/index.js examples/hello.ayu
`);

    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.log(`
❌ AyuCompile Error
--------------------------------
File not found:
${inputFile}

Please check the file name and path.
`);

    process.exit(1);
}

try {

    // READ SOURCE CODE
    const sourceCode = fs.readFileSync(
        inputFile,
        'utf8'
    );

    // LEXER
    const lexer = new Lexer(sourceCode);
    const tokens = lexer.tokenize();

    // PARSER
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // CODE GENERATOR
    const generator = new CodeGenerator();
    const outputCode = generator.generate(ast);

    // OUTPUT FILE
    const outputFile = inputFile.replace(
        /\.ayu$/,
        '.js'
    );

    fs.writeFileSync(
        outputFile,
        outputCode,
        'utf8'
    );

    console.log(`
✅ AyuCompile: Compilation successful!
📄 Input:  ${inputFile}
⚙️ Output: ${outputFile}
`);

} catch (error) {

    console.log(`
❌ AyuCompile Compilation Error
--------------------------------
${error.message}
`);

    if (
        error.line !== undefined &&
        error.column !== undefined
    ) {
        console.log(
            `📍 Location: Line ${error.line}, Column ${error.column}`
        );
    }

    if (error.name) {
        console.log(
            `🔎 Type: ${error.name}`
        );
    }

    console.log('');

    process.exit(1);
}