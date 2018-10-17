const { reduce, pick, map, omit, values } = require('ant-util')
const babel = require('@babel/parser')
const traverse = require('@babel/traverse').default

const SEP = '_'
const GLOBAL = 'global'
const DEFAULT_WINDOWS = ['window', 'alert', 'document', 'Math', 'location', 'history', 'typeof']

const NODE_TYPES = {
  PROGRAM: 'Program',
  FUNCTION_DECLARATION: 'FunctionDeclaration',
  FUNCTION_EXPRESSION: 'FunctionExpression',
  EXPRESSION_STATEMENT: 'ExpressionStatement',
  CALL_EXPRESSION: 'CallExpression',
  CONDITIONAL_EXPRESSION: 'ConditionalExpression',
  TEMPLATE_LITERAL: 'TemplateLiteral',
  BINARY_EXPRESSION: 'BinaryExpression',
  VARIABLE_DECLARATOR: 'VariableDeclarator',
  ASSIGNMENT_EXPRESSION: 'AssignmentExpression',
  UNARY_EXPRESSION: 'UnaryExpression',
  // ARRAY_PATTERN: 'ArrayPattern',
  ARRAY_EXPRESSION: 'ArrayExpression',
  OBJECT_PROPERTY: 'ObjectProperty',
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
    if (path.parent.type === NODE_TYPES.VARIABLE_DECLARATOR) {
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
  const res = analysisExecEnv(scope.parent, path).concat(paths)
  return res
}

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

function findUndefinedVarible (code, {
  defaults = DEFAULT_WINDOWS,
} = {}) {
  const ast = babel.parse(code, {
    sourceType: "module",
    plugins: [
      "jsx",
      "flow"
    ]
  })
  const envs = {}
  traverse(ast, {
    Program(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds, defaults)
      envs['global'] = classifyBinds
    },
    FunctionDeclaration(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds, defaults)
      const execEnv = analysisExecEnv(path.scope, path).join(SEP)
      envs[execEnv] = classifyBinds
    },
    FunctionExpression(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds, defaults)
      const execEnv = analysisExecEnv(path.scope, path).join(SEP)
      envs[execEnv] = classifyBinds
    },
    ArrowFunctionExpression(path) {
      const binds = path.scope.bindings
      const classifyBinds = analysisHoisting(binds, defaults)
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
      // if (name ==='b') {
      //   debugger
      //   console.log('type :', type);
      // }
      if (path.key === 'init' || values(omit(NODE_TYPES, ['FUNCTION_DECLARATION', 'FUNCTION_EXPRESSION', 'PROGRAM', 'VARIABLE_DECLARATOR'])).includes(type)) {
        const execEnv = analysisExecEnv(path.scope, path).join(SEP)
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

// const code = `({} = {b})`

// console.log(findUndefinedVarible(code))

module.exports = {
  findUndefinedVarible,
  DEFAULT_WINDOWS, 
}

