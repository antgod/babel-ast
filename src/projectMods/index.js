const path = require('path')
const fs = require('fs')
const babel = require('@babel/parser')
const traverse = require('@babel/traverse').default
const types = require('babel-types')
const { DEFAULT_PLUGINS, DEFAULT_SOURCE_TYPE } = require('../common/constant')

const { assign } = Object
const REQUIRE = 'require'
const NODE_MODULES = 'node_modules'
const js = 'js'

const analyseEntry = (absoluteProject, { entry = '' }) => {
  if (entry) {
    return path.resolve(absoluteProject, entry)
  }
  const pkg = require(`${absoluteProject}/package.json`)
  const main = pkg.main
  return path.resolve(absoluteProject, main)
}

const isRelative = (dep) => {
  return dep.indexOf('./') > -1
}

const traverseProject = (absoluteEntry, absoluteProject) => {
  let code = ''
  try {
    code = fs.readFileSync(`${absoluteEntry}.${js}`)
  } catch(e) {
    console.error(`${absoluteEntry}文件不存在`)
  } 
  const deps = fileMods(code.toString())
  return deps.reduce((last, dep) => 
    assign(last, { [dep]: isRelative(dep) ? {
      absosulte: path.resolve(path.dirname(absoluteEntry), dep),
      nodeModule: false,
      deps: traverseProject(path.resolve(path.dirname(absoluteEntry), dep), absoluteProject),
    } : {
      absosulte: path.resolve(absoluteProject, NODE_MODULES, dep),
      nodeModule: true,
    }}), 
  {})
}

const projectMods = (options = { project: '' }) => {
  const absoluteProject = path.resolve(process.cwd(), options.project)
  const absoluteEntry = analyseEntry(absoluteProject, options)
  return traverseProject(absoluteEntry, absoluteProject)
}

function fileMods (code, { sourceType = DEFAULT_SOURCE_TYPE, plugins = DEFAULT_PLUGINS } = {}) {
  const ast = babel.parse(code, {
    sourceType,
  plugins})
  const dependencies = []
  traverse(ast, {
    Literal(path) {
      const parentNode = path.parent
      if (types.isImportDeclaration(parentNode)) {
        dependencies.push(path.node.value)
      }

      if (types.isCallExpression(parentNode) && parentNode.callee.name === REQUIRE) {
        dependencies.push(path.node.value)
      }
    }
  })
  return dependencies
}

module.exports = {
  projectMods
}
