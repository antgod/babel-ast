const babel = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { values, omit, pick, filter, keys } = require('ant-util') 
const { NODE_TYPES, DEFAULT_BROWER, DEFAULT_NODE, SPEC_TYPES, KIND_TYPES, DEFAULT_PLUGINS, DEFAULT_SOURCE_TYPE } = require('../common/constant')

const analysisBindVars = (scope, path, start) => {
  if (!scope) {
    return []
  }
  const bingingVars = keys(filter(scope.bindings, binging => {
    return binging.kind === KIND_TYPES.HOISTED || binging.kind !== KIND_TYPES.HOISTED && binging.path.node.start < start
  }))

  return analysisBindVars(scope.parent, path, start).concat(bingingVars)
}

const computeSpec = (type, path) => {
  if (values(pick(NODE_TYPES, SPEC_TYPES)).includes(type)) {
    if (
      // a = b;检测b
      type === NODE_TYPES.VARIABLE_DECLARATOR && path.key === 'init' || 
      // var {c: e} = {a: b};检测b
      type === NODE_TYPES.OBJECT_PROPERTY && path.key === 'value' && path.parentPath.parent.type === 'ObjectExpression' ||
      // obj[x];检测x
      type === NODE_TYPES.MEMBER_EXPRESSION && path.key === 'object') {
        return true
    }
  }
  return false
}

function undef(code, {
  defaults = DEFAULT_BROWER,
  sourceType = DEFAULT_SOURCE_TYPE,
  plugins = DEFAULT_PLUGINS,
} = {}) {
  const ast = babel.parse(code, {
    sourceType,
    plugins,
  })
  const undefinedVars = [] 
  traverse(ast, {
    Identifier(path) {
      const type = path.parent.type
      const node = path.node
      const { name } = node
      const common = values(omit(NODE_TYPES, SPEC_TYPES))
      const commonFilter = common.includes(type)

      const specFilter = computeSpec(type, path)
      if (commonFilter || specFilter) {
        if (!defaults.includes(name)) {
          const bindVars = analysisBindVars(path.scope, path, path.node.start, defaults)
          if (!bindVars.includes(name)) {
            undefinedVars.push(name)
          }
        }
      }
    }
  })
  return undefinedVars
}

module.exports = {
  undef,
  DEFAULT_BROWER,
  DEFAULT_NODE,
}
