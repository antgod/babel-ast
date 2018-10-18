const { findUndefinedVarible, DEFAULT_NODE } = require('../src/findUndefinedVarible')

let code

test('直接调用', () => {
  // no - pass
  code = `var a = 1, b = 2; a;`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `a = 1;`
  expect(findUndefinedVarible(code)).toEqual(['a'])

  code = `var a = b;`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `window;`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `require('a');`

  expect(findUndefinedVarible(code)).toEqual(['require'])

  code = `[a] = [b]`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `({a} = {b})`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `({a = c} = {b})`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `[obj.a] = [0, 1]`
  expect(findUndefinedVarible(code)).toEqual(['obj'])

  code = `const c = 0; const a = {...b, c}`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `[a] = [b]`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  // pass
  code = `var a = 1, b = 2; a;`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `function f() { b; }`
  expect(findUndefinedVarible(code, { defaults: ['b']})).toEqual([])

  code = `function a(){}  a();`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `function f(b) { b; }`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `b++;`
  expect(findUndefinedVarible(code, { defaults: ['b']})).toEqual([])

  code = `window`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `require('a')`
  expect(findUndefinedVarible(code, { defaults: DEFAULT_NODE })).toEqual([])

  code = `Object; isNaN();`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `toString; hasOwnProperty;`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `function evilEval(stuffToEval) { var ultimateAnswer; ultimateAnswer = 42; eval(stuffToEval); }`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `typeof a`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `typeof (a)`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var b = typeof a`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `typeof a === 'undefined'`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `Array = 1`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var toString = 1;`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var {bacon, ...others} = stuff; console.log(others)`
  expect(findUndefinedVarible(code)).toEqual(['stuff'])

  code = `var a; [a] = [0];`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var a; ({a} = {});`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var a; ({b: a} = {});`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var obj; [obj.a, obj.b] = [0, 1];`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `import Warning from '../lib/warning'; var warn = new Warning('text');`
  expect(findUndefinedVarible(code, { defaults: DEFAULT_NODE })).toEqual([])

  code = `import * as Warning from '../lib/warning'; var warn = new Warning('text');`
  expect(findUndefinedVarible(code, { defaults: DEFAULT_NODE })).toEqual([])

  code = `var React, App, a=1; React.render(<App attr={a} />);`
  expect(findUndefinedVarible(code, { plugins: ['jsx'] })).toEqual([])

  code = `class A { constructor() { new.target; } }`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `var Foo; class Bar extends Foo { constructor() { super();  }}`
  expect(findUndefinedVarible(code)).toEqual([])
})

test('函数内调用', () => {
  // pass
  code = `var console; [1,2,3].forEach(obj => {\n  console.log(obj);\n});`
  expect(findUndefinedVarible(code)).toEqual([])

  code = `function myFunc(...foo) {  return foo1;}`
  expect(findUndefinedVarible(code)).toEqual(['foo1'])

  code = `function foo() { var [a, b=4] = [1, 2]; return {a, b}; }`
  expect(findUndefinedVarible(code)).toEqual([])

  // no-pass 
  code = `var console; [1,2,3].forEach(obj => { consolex.log(obj1); })`
  expect(findUndefinedVarible(code)).toEqual(['consolex', 'obj1'])
  code = `const fun = function () { const f = 'xx'; k; f; }`
  expect(findUndefinedVarible(code)).toEqual(['k'])
  code = 'function f() { b; }'
  expect(findUndefinedVarible(code)).toEqual(['b'])
})

test('函数嵌套内调用', () => {
  const code = `
    const a = 1; 
    const fun = function () {
      const f = 'xx'
      // 这里的f找不到fun名字，无法分析
      k
    }

    const funx = () => {
      const k = 'xx'
      // 这里的f找不到fun名字，无法分析
      console.log(k)
    }

    function fun1() {
      var x = b //取值居然是
      alert(y ? 1: 2)
      var b = 2
      function fun2() {
        var c = 3
        alert(xxx ? 1 : 2)
        function fun3() {
          const d = b + c   
          console.log(d)
          fun2(n)   
        }
      }
    }
  `
  expect(findUndefinedVarible(code)).toEqual([
    'k',
    'b',
    'y',
    'xxx',
    'n'
  ])
})
