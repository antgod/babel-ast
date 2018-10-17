const { findUndefinedVarible } = require('../src/findUndefinedVarible')

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

  // code = `({a} = {b})`
  // expect(findUndefinedVarible(code)).toEqual(['b'])

  // code = `({a = c} = {b})`
  // expect(findUndefinedVarible(code)).toEqual(['b', 'c'])

  // code = `[obj.a, obj.b] = [0, 1]`
  // expect(findUndefinedVarible(code)).toEqual(['obj'])

  // code = `const c = 0; const a = {...b, c}`
  // expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `[a] = [b]`
  expect(findUndefinedVarible(code)).toEqual(['b'])

  code = `var a = 1, b = 2; a;`
  expect(findUndefinedVarible(code)).toEqual([])
})

test('函数内调用', () => {
  // pass

  // no-pass 
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
