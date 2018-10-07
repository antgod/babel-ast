const babelParser = require('@babel/parser')
const babel = require('babel-core');
const traverse = require('babel-traverse').default

const code = `function square(n) {
  return n * n
}`;

const ast = babelParser.parse(code);

traverse(ast, {
  enter(path) {
    if (
      path.node.type === "Identifier" &&
      path.node.name === "n"
    ) {
      path.node.name = "x";
    }
  }
});

const { code: c } = babel.transformFromAst(ast, "", {});
console.log(c)