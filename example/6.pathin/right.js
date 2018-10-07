const babelParser = require('@babel/parser')
const babel = require('babel-core');
const traverse = require('babel-traverse').default

const code = `function square(n) {
  return n * n
}`;


const ast = babelParser.parse(code);

let paramName = 'n';

const updateParamNameVisitor = {
  Identifier(path) {
    if (path.node.name === this.paramName) {
      path.node.name = "x";
    }
  }
};

const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    const paramName = param.name;
    param.name = "x";

    path.traverse(updateParamNameVisitor, { paramName });

  },

};

traverse(ast, MyVisitor);

const { code: c } = babel.transformFromAst(ast);
console.log(c)