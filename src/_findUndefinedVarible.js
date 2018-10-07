/**
 * 处理模版字符串
 * babylon解析对象参考: https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md
 */
const babylon = require('babylon')
const traverse = require('babel-traverse').default

const analysisExecEnv = (scope, type) => {
  const paths = []
  if (!scope || !scope.block) {
    return []
  } else if (scope.block.type === 'Program') {
    return ['global']
  } else if (scope.block.type === 'FunctionDeclaration') {
    if (type === 'FunctionDeclaration' && scope.parent.block.id) {
      paths.push(scope.parent.block.id.name)
    } else if (type !== 'FunctionDeclaration'){
      paths.push(scope.block.id.name)
    }
  }
  return analysisExecEnv(scope.parent, type).concat(paths)
}

/**
 * 处理"xxx${bizData[].a[].abc}xxx"模版中带有需要填补索引的
 */
function traverseToAst (tplStr) {
  const ast = babylon.parse(tplStr)
  let envs = {}
  traverse(ast, {
    FunctionDeclaration(path) {

    },
    Identifier(path) {
      const type = path.parent.type
      const name = path.node.name
      if (type === 'VariableDeclarator' || type === 'FunctionDeclaration') {
        const execEnv = analysisExecEnv(path.scope, type, name).join('_')
        envs[execEnv] = envs[execEnv] ? envs[execEnv].concat(name) : [name]
      }
    }
  })

  envs = Object.keys(envs).map(envKey => {
    return {
      key: envKey,
      value: envKey.split('_').reduce((last, env) => {
        const item = !last.prefix ? env : last.prefix + '_' + env
        last.prefix = item
        last.vars = (last.vars || []).concat(envs[item])
        return last
      }, {}).vars
    }
  }).reduce((last, item) => {
    return Object.assign(last, {
      [item.key]: item.value
    })
  }, {})

  console.log(envs)

  traverse(ast, {
    Identifier(path) {
      const type = path.parent.type
      const name = path.node.name
      if (type === 'CallExpression' || type === 'ConditionalExpression' || type === 'TemplateLiteral' || type === 'BinaryExpression') {
        const execEnv = analysisExecEnv(path.scope).join('_')
        console.log(name, envs[execEnv].indexOf(name) > -1)
      }
    }
  })
  // console.log(envs)
}

const code = `
  const a = 1; 
  function fun1() {
    var b = 2
    function fun2() {
      var c = 3
      alert(xxx ? 1 : 2)
      function fun3() {
        const d = b + c   
        alert(d)   
      }
    }
  };
`

const code1 = 'var xxx = 1; var a = `${xxx}2`'

traverseToAst(code)
