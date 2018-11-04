
const util = require('ant-util')
const babel = require('@babel/parser')
const traverse = require('@babel/traverse').default
const types = require('babel-types')
const { NODE_TYPES, USEFUL_IDENTIFIER_COLUMNS, KIND_TYPES } = require('../constant')

const { reduce, pick } = util
const maps = (array) => array.reduce((last, item) => Object.assign(last, {[item]: item}), {})
const anonymous = 'anonymous'

const analysisHoisting = (binds, defaults) => {
  const filterIdentifier = (identifier, columns) => ({ [identifier.name]: pick(identifier, columns)})
  return reduce(binds, (last, bind) => {
    const { kind, identifier } = bind
    const hoisting = kind === KIND_TYPES.HOISTED ? filterIdentifier(identifier, USEFUL_IDENTIFIER_COLUMNS) : {}
    const vars = kind !== KIND_TYPES.HOISTED ? filterIdentifier(identifier, USEFUL_IDENTIFIER_COLUMNS) : {}
    return {
      hoisting: { ...last.hoisting, ...hoisting },
      vars: { ...last.vars, ...vars },
    }
  }, { hoisting: maps(defaults), vars: {} })
}

const analysisExecEnv = (scope, path, classifyBinds) => {
  const paths = []
  const functionType = scope.block.type
  if (!scope || !scope.block) {
    return []
  } else if (functionType === FUNCTION_TYPES.PROGRAM) {
    return [FUNCTION_TYPES.PROGRAM]
  } else if (functionType === FUNCTION_TYPES.FUNCTION_DECLARATION) {
    paths.push(scope.block.id.name)
  } else if (types.FUNCTION_TYPES.includes(functionType)) {
    const parentType = path.parent.type
    // 函数定义
    if (parentType === NODE_TYPES.VARIABLE_DECLARATOR     // const a = () => {}
      || parentType === NODE_TYPES.CALL_EXPRESSION        // [].map(() => {}), (function(){})()
      || parentType === NODE_TYPES.ASSIGNMENT_EXPRESSION  // obj.abc = key => {}
      ) {
 
      paths.push(name)
    } 
  }
  return analysisExecEnv(scope.parent, path, classifyBinds, true).concat(paths)
}

const collectDep = (ast, { defaults }) => {
  const envs = []
  const iterator = (path) => {
    const binds = path.scope.bindings
    const classifyBinds = analysisHoisting(binds, defaults)
    envs.push([path.scope.block, classifyBinds])
  }
  traverse(ast, reduce(FUNCTION_TYPES, (last, value) => Object.assign(last, { [value]: iterator })), {})
  return envs
}

module.exports = collectDep
