const { undef } = require('../../src/undef')
const { code } = require('./data')

// 匿名函数
const code1 = `
function a () {
  Object.keys([]).forEach(key => {
    
    c
    const b = key
    function abc() {
      
    }
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

const code2 = `var {c:e} = {a: b}; `
const code3 = 'var a = b'

const code4 = 'function myFunc(...foo) {  return foo;}'
const code5 = `var console; [1,2,3].forEach(obj => { 
  consolex.log(obj1);
});`
const code6 = `function foo() {var {c:e} = {a: 1}; var [a, b=4] = [1, 2]; return {a, b, c: d}; }`

console.log(undef(code))
console.log(undef(code1))
console.log(undef(code2))
console.log(undef(code3))
console.log(undef(code4))
console.log(undef(code5))
console.log(undef(code6))