const types = require('babel-types')

Object.keys(types).forEach(key => {
  const type = types[key]
  
  if (Array.isArray(type) ) {
    console.log(key)
    
  }
})

// console.log('FUNCTION_TYPES :', types.FUNCTION_TYPES);
// console.log('FUNCTIONPARENT_TYPES :', types.FUNCTIONPARENT_TYPES);