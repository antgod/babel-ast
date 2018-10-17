const babelParser = require('@babel/parser')
const babel = require('babel-core')
const code = `const { a } = {}`
const ast = babelParser.parse(code, {
  plugins: [
    // enable jsx and flow syntax
    "jsx",
  ]
});


const { code: c } = babel.transformFromAst(ast, "", {});
console.log(c)

