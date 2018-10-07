const { reduce, pick, map, omit, values } = require('ant-util')
const babylon = require('babylon')
const traverse = require('babel-traverse').default

const SEP = '_'
const GLOBAL = 'global'
const DEFAULT_WINDOWS = ['window', 'alert', 'document', 'Math', 'location', 'history']

const NODE_TYPES = {
  PROGRAM: 'Program',
  FUNCTION_DECLARATION: 'FunctionDeclaration',
  FUNCTION_EXPRESSION: 'FunctionExpression',
  EXPRESSION_STATEMENT: 'ExpressionStatement',
  CALL_EXPRESSION: 'CallExpression',
  CONDITIONAL_EXPRESSION: 'ConditionalExpression',
  TEMPLATE_LITERAL: 'TemplateLiteral',
  BINARY_EXPRESSION: 'BinaryExpression',
  VARIABLE_DECLARATOR: 'VariableDeclarator'
}

const KIND_TYPES = {
  HOISTED: 'hoisted',
  LET: 'let',
  CONST: 'const',
}

const USEFUL_IDENTIFIER_COLUMNS = ['name', 'start', 'end']


const maps = (array) => array.reduce((last, item) => Object.assign(last, {[item]: item}), {})

const analysisExecEnv = (scope, path) => {
  const paths = []
  if (!scope || !scope.block) {
    return []
  } else if (scope.block.type === NODE_TYPES.PROGRAM) {
    return [GLOBAL]
  } else if (scope.block.type === NODE_TYPES.FUNCTION_DECLARATION) {
    paths.push(scope.block.id.name)
  } else if (scope.block.type === NODE_TYPES.FUNCTION_EXPRESSION) {
    // 函数定义
    if (path.parent.type === NODE_TYPES.VARIABLE_DECLARATOR && path.parent.id) {
      path.node.id = {
        name: path.parent.id.name
      }
      paths.push(path.parent.id.name)
    } 
    // 函数内部变量调用
    else {
      paths.push(scope.block.id.name)
    }
  }
  return analysisExecEnv(scope.parent, path).concat(paths)
}

const analysisHoisting = (binds) => {
  const filterIdentifier = (identifier, columns) => ({ [identifier.name]: pick(identifier, columns)})
  return reduce(binds, (last, bind) => {
    const { kind, identifier } = bind
    const hoisting = kind === KIND_TYPES.HOISTED ? filterIdentifier(identifier, USEFUL_IDENTIFIER_COLUMNS) : {}
    const vars = kind !== KIND_TYPES.HOISTED ? filterIdentifier(identifier, USEFUL_IDENTIFIER_COLUMNS) : {}
    return {
      hoisting: { ...last.hoisting, ...hoisting },
      vars: { ...last.vars, ...vars },
    }
  }, { hoisting: maps(DEFAULT_WINDOWS), vars: {} })
}

/*根据作用域叠加依赖
  比如
  ```
  const a = 1;
  function fun1() {
    const b = 2;
  }
  ```
*/
const accumuleEnvs = (envs) => {
  return map(envs, (_, envPath) => {
    return envPath.split(SEP).reduce((last, env) => {
      const unitePath = !last.unitePath ? env : `${last.unitePath}${SEP}${env}`
      last.unitePath = unitePath
      last.hoisting = Object.assign(last.hoisting, envs[unitePath].hoisting)
      last.vars = Object.assign(last.vars, envs[unitePath].vars)
      return last
    }, { hoisting: {}, vars: {}})
  })
}

function findUndefinedVarible (tplStr) {
  const ast = babylon.parse(tplStr)
  const envs = {}
  traverse(ast, {
    Program(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds)
      envs['global'] = classifyBinds
    },
    FunctionDeclaration(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds)
      const execEnv = analysisExecEnv(path.scope, path).join(SEP)
      envs[execEnv] = classifyBinds
    },
    FunctionExpression(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds)
      const execEnv = analysisExecEnv(path.scope, path).join(SEP)
      envs[execEnv] = classifyBinds
    },
    ArrowFunctionExpression(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds)
      const execEnv = analysisExecEnv(path.scope, path).join(SEP)
      envs[execEnv] = classifyBinds
    }
  })

  const accumuledEnvs = accumuleEnvs(envs)

  const undefinedVars = [] 
  traverse(ast, {
    Identifier(path) {
      const type = path.parent.type
      const { name, start } = path.node

      if (name === '')
      
      if (path.key === 'init' || values(omit(NODE_TYPES, ['FUNCTION_DECLARATION', 'FUNCTION_EXPRESSION', 'PROGRAM', 'VARIABLE_DECLARATOR'])).includes(type)) {
        debugger
        const execEnv = analysisExecEnv(path.scope, path).join(SEP)
        // console.log(execEnv)
        const accumuledEnv = accumuledEnvs[execEnv]
        if (accumuledEnv.hoisting[name]) {
          return
        } else if (accumuledEnv.vars[name]) {
          const { end } = accumuledEnv.vars[name]
          if (start > end ) {
            return 
          }
        }
        undefinedVars.push(name)
      }
    }
  })
  return undefinedVars
}

const code = `
  const a = 1; 
  const fun = function () {
    const f = 'xx'
    // 这里的f找不到fun名字，无法分析
    console.log(f)
  }
`
module.exports = {
  findUndefinedVarible, 
}
console.log(findUndefinedVarible(code))
