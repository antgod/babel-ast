const babelParser = require('@babel/parser')
const babel = require('babel-core');
const traverse = require('babel-traverse').default

const code = `function square(n) {
  return n * n
}`;


const ast = babelParser.parse(code);

let paramName = 'n';
const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    param.name = "x";
    paramName = param.name;
  },

  Identifier(path) {
    if (path.node.name === paramName) {
      path.node.name = "x";
    }
  }
};

traverse(ast, MyVisitor);

const { code: c } = babel.transformFromAst(ast);
console.log(c)