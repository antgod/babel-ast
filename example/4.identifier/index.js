const babelParser = require('@babel/parser')
const babel = require('babel-core')
const traverse = require('babel-traverse').default

const code = `function square(n) {
  var win = window
  return n * n
}`

const ast = babelParser.parse(code)

// const MyVisitor = {
//   Identifier() {
//     console.log("Called!")
//   }
// }

const MyVisitor = {
  Identifier: {
    enter() {
      console.log("Entered!")
    },
    exit() {
      console.log("Exited!")
    }
  }
}

traverse(ast, MyVisitor)
