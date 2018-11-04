const { projectMods } = require('../src/projectMods/index')

test('依赖分析', () => {
  expect(projectMods()).toEqual({
    "exist.js": {
      "absosulte": "/Users/lihongji/study/babel-ast/node_modules/exist.js",
      "nodeModule": true
    },
    "../constants/flow": {
      "absosulte": "/Users/lihongji/study/babel-ast/constants/flow",
      "nodeModule": false,
      "deps": {}
    },
    "./DeleteTask": {
      "absosulte": "/Users/lihongji/study/babel-ast/lib/DeleteTask",
      "nodeModule": false,
      "deps": {}
    },
    "./IgnoreTask": {
      "absosulte": "/Users/lihongji/study/babel-ast/lib/IgnoreTask",
      "nodeModule": false,
      "deps": {}
    },
    "./ConfirmTask": {
      "absosulte": "/Users/lihongji/study/babel-ast/lib/ConfirmTask",
      "nodeModule": false,
      "deps": {}
    },
    "./common/common": {
      "absosulte": "/Users/lihongji/study/babel-ast/lib/common/common",
      "nodeModule": false,
      "deps": {
        "./patch": {
          "absosulte": "/Users/lihongji/study/babel-ast/lib/common/patch",
          "nodeModule": false,
          "deps": {}
        },
        "../tracker/spm": {
          "absosulte": "/Users/lihongji/study/babel-ast/lib/tracker/spm",
          "nodeModule": false,
          "deps": {}
        }
      }
    },
    "debug": {
      "absosulte": "/Users/lihongji/study/babel-ast/node_modules/debug",
      "nodeModule": true
    },
    "chair": {
      "absosulte": "/Users/lihongji/study/babel-ast/node_modules/chair",
      "nodeModule": true
    }
  })
})

