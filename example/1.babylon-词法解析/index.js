const babelParser = require('@babel/parser')
const code = `function square(n) {
  return n * n
}`;

var a = 1
const astParse = babelParser.parse(code, {
//  plugins: [
//    // enable jsx and flow syntaxconst { Button } = require(a)
//    "jsx",
//    "flow"
//  ]
});


const astParseExpression = babelParser.parseExpression(code, {
//  plugins: [
//    "jsx",
//    "es2015"
//  ]
});

// parse 是词法分析，parseExpression是语法分析
console.log(astParse,astParseExpression)
