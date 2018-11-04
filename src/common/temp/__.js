const babel = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { values, omit, pick } = require('ant-util') 
const { NODE_TYPES, FUNCTION_TYPES, DEFAULT_BROWER, DEFAULT_NODE, SPEC_TYPES } = require('../constant')
const collectDep = require('./collectDep')

const DEFAULT_PLUGINS = ['objectRestSpread']
const DEFAULT_SOURCE_TYPE = 'module'

const analysisExecEnv = (scope, path) => {
  const paths = []
  const functionType = scope.block.type
  if (!scope || !scope.block) {
    return []
  } else if (functionType === NODE_TYPES.PROGRAM) {
    return [FUNCTION_TYPES.PROGRAM]
  } else if (functionType === FUNCTION_TYPES.FUNCTION_DECLARATION || functionType === FUNCTION_TYPES.ARROW_FUNCTION_EXPRESSION || functionType === NODE_TYPES.FUNCTION_DECLARATION) {
    paths.push(scope.block)
  }
  return analysisExecEnv(scope.parent, path).concat(paths)
}

function deepEqual(a1, a2) {
  if (a1 === a2) return true;
  if ((!a1 && a2) || (a1 && ! a2)) return false
  if (a1.length !== a2.length) return false
  for (var i = 0, n = a1.length; i < n; i++) {
      if (a1[i] !== a2[i]) return false
  }
  return true
}

const findEnv = (envs, scope) => {
  return envs.find(env => {
    return env[0] === scope.block
  }) 
}

const analysisUndef = (envVars, undefinedVars, { start, name }) => {
  if (envVars.hoisting[name]) {
    return
  } else if (envVars.vars[name]) {
    const { end } = envVars.vars[name]
    if (start > end ) {
      return 
    }
  }
  undefinedVars.push(name)
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
  const envs = collectDep(ast, { defaults })
  const undefinedVars = [] 
  traverse(ast, {
    Identifier(path) {
      const type = path.parent.type
      const node = path.node
      const common = values(omit(NODE_TYPES, SPEC_TYPES))
      const commonFilter = common.includes(type)

      const specFilter = computeSpec(type, path)
      if (commonFilter || specFilter) {

        
        // const execEnv = analysisExecEnv(path.scope, path)
        if (node.name === 'col') {
          debugger
        }
        
        const accumuledEnv = findEnv(envs, path.scope)

        console.log(accumuledEnv, node.name)
        
        const [_, envVars] = accumuledEnv
        console.log(envVars)
        // // if (!envVars) {
        // //   debugger
        // // }
        // analysisUndef(envVars, undefinedVars, node)
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

// 匿名函数
const code = `
function a () {
  Object.keys([]).forEach(key => {
    const b = key
    c
  })
  
  Object.keys([]).forEach(function(key) {
    const c = key
  })
  
  const c = []
  c.abc = key => {
    const b = key
    d
  }
  
  const x = key => {
  
  }
  
  (function(){})()
}  
`
const code1 = `function foo() {var {c:e} = {a: 1}; var [a, b=4] = [1, 2]; return {a, b, c: d}; }`
const code2 = `var {c:e} = {a: b}; `
const code3 = 'var a = b'

const code4 = 'function myFunc(...foo) {  return foo;}'
const code5 = `var console; [1,2,3].forEach(obj => { 
  consolex.log(obj1);
});`

// console.log(undef(code))
// console.log(undef(code1))
// console.log(undef(code2))
// console.log(undef(code3))
// console.log(undef(code4))
// console.log(undef(code5))