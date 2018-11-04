const NODE_TYPES = {
  PROGRAM: 'Program',
  VARIABLE_DECLARATOR: 'VariableDeclarator',  // const a = 1
  OBJECT_PROPERTY: 'ObjectProperty',          // { a }
  MEMBER_EXPRESSION: 'MemberExpression',      // obj.x

  CALL_EXPRESSION: 'CallExpression',          // a()  
  EXPRESSION_STATEMENT: 'ExpressionStatement',// 任意行表达式
  CONDITIONAL_EXPRESSION: 'ConditionalExpression', // const ax = true ? 1 : 2
  TEMPLATE_LITERAL: 'TemplateLiteral',        // const ay = `${x}`
  BINARY_EXPRESSION: 'BinaryExpression',      // a + b
  ASSIGNMENT_EXPRESSION: 'AssignmentExpression',  // c = k
  SPREAD_ELEMENT: 'SpreadElement',            // [...args]
  ARRAY_EXPRESSION: 'ArrayExpression',        // [a]
  NEW_EXPRESSION: 'NewExpression',            // new
  RETURN_STATEMENT: 'ReturnStatement',        // return xxx
  // UNARY_EXPRESSION: 'UnaryExpression',     // typeof
  // ARRAY_PATTERN: 'ArrayPattern',           // var [a]
}

const SPEC_TYPES = ['VARIABLE_DECLARATOR', 'OBJECT_PROPERTY', 'MEMBER_EXPRESSION']

const USEFUL_IDENTIFIER_COLUMNS = ['name', 'start', 'end']

const KIND_TYPES = {
  HOISTED: 'hoisted',
  LET: 'let',
  CONST: 'const',
}

const DEFAULT_BROWER = ['window', 'alert', 'document', 'Math', 'location', 'history', 'console', 
  'URLSearchParams', 'Intl', 'IntersectionObserver', 'Credential', 'requestIdleCallback', 'customElements', 'PromiseRejectionEvent',
  'Object', 'Function', 'String', 'Number', 'Array',
  'typeof', 'isNaN', 
  'toString', 'hasOwnProperty','eval'
]

const DEFAULT_NODE = ['require', 'module', 'exports']
const DEFAULT_PLUGINS = ['objectRestSpread']
const DEFAULT_SOURCE_TYPE = 'module'

module.exports = {
  NODE_TYPES,
  USEFUL_IDENTIFIER_COLUMNS,
  KIND_TYPES,
  DEFAULT_BROWER,
  DEFAULT_NODE,
  SPEC_TYPES,
  DEFAULT_PLUGINS,
  DEFAULT_SOURCE_TYPE,
}