var esprima = require('esprima');
const code = `function square(n) {
  return n * n
}`;
var ast = esprima.parse(code);
console.log(JSON.stringify(ast, null, 2))