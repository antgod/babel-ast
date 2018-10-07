Babel 的三个主要处理步骤分别是： 解析（parse），转换（transform），生成（generate）。.

## 解析

解析步骤接收代码并输出 AST。 这个步骤分为两个阶段：词法分析（Lexical Analysis） 和 语法分析（Syntactic Analysis）。.

### 词法分析

词法分析阶段把字符串形式的代码转换为 令牌（tokens） 流。.

你可以把令牌看作是一个扁平的语法片段数组：

```json
// n * n;
[
  { type: { ... }, value: "n", start: 0, end: 1, loc: { ... } },
  { type: { ... }, value: "*", start: 2, end: 3, loc: { ... } },
  { type: { ... }, value: "n", start: 4, end: 5, loc: { ... } },
  ...
]
```

每一个 type 有一组属性来描述该令牌：

```javascript
{
  type: {
    label: 'name',
    keyword: undefined,
    beforeExpr: false,
    startsExpr: true,
    rightAssociative: false,
    isLoop: false,
    isAssign: false,
    prefix: false,
    postfix: false,
    binop: null,
    updateContext: null
  },
  ...
}
```

和 AST 节点一样它们也有 start，end，loc 属性。.

### 语法分析

语法分析阶段会把一个令牌流转换成 AST 的形式。 这个阶段会使用令牌中的信息把它们转换成一个 AST 的表述结构，这样更易于后续的操作。

## 转换

转换步骤接收 AST 并对其进行遍历，在此过程中对节点进行添加、更新及移除等操作。 这是 Babel 或是其他编译器中最复杂的过程 同时也是插件将要介入工作的部分，这将是本手册的主要内容， 因此让我们慢慢来。

## 生成

代码生成步骤把最终（经过一系列转换之后）的 AST转换成字符串形式的代码，同时创建源码映射（source maps）。.

代码生成其实很简单：深度优先遍历整个 AST，然后构建可以表示转换后代码的字符串。

### 遍历

想要转换 AST 你需要进行递归的树形遍历。

比方说我们有一个 FunctionDeclaration 类型。它有几个属性：id，params，和 body，每一个都有一些内嵌节点。

```
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  params: [{
    type: "Identifier",
    name: "n"
  }],
  body: {
    type: "BlockStatement",
    body: [{
      type: "ReturnStatement",
      argument: {
        type: "BinaryExpression",
        operator: "*",
        left: {
          type: "Identifier",
          name: "n"
        },
        right: {
          type: "Identifier",
          name: "n"
        }
      }
    }]
  }
}
```

于是我们从 FunctionDeclaration 开始并且我们知道它的内部属性（即：id，params，body），所以我们依次访问每一个属性及它们的子节点。

接着我们来到 id，它是一个 Identifier。Identifier 没有任何子节点属性，所以我们继续。

之后是 params，由于它是一个数组节点所以我们访问其中的每一个，它们都是 Identifier 类型的单一节点，然后我们继续。

此时我们来到了 body，这是一个 BlockStatement 并且也有一个 body节点，而且也是一个数组节点，我们继续访问其中的每一个。

这里唯一的一个属性是 ReturnStatement 节点，它有一个 argument，我们访问 argument 就找到了 BinaryExpression。.

BinaryExpression 有一个 operator，一个 left，和一个 right。 Operator 不是一个节点，它只是一个值因此我们不用继续向内遍历，我们只需要访问 left 和 right。.

Babel 的转换步骤全都是这样的遍历过程。

### Visitors（访问者）

当我们谈及“进入”一个节点，实际上是说我们在访问它们， 之所以使用这样的术语是因为有一个访问者模式（visitor）的概念。.

访问者是一个用于 AST 遍历的跨语言的模式。 简单的说它们就是一个对象，定义了用于在一个树状结构中获取具体节点的方法。 这么说有些抽象所以让我们来看一个例子。

```
const MyVisitor = {
  Identifier() {
    console.log("Called!");
  }
};
```

```
注意： Identifier() { ... } 是 Identifier: { enter() { ... } } 的简写形式。.
```

这是一个简单的访问者，把它用于遍历中时，每当在树中遇见一个 Identifier 的时候会调用 Identifier() 方法。

所以在下面的代码中 Identifier() 方法会被调用四次（包括 square 在内，总共有四个 Identifier）。).

```
function square(n) {
  return n * n;
}
```

```
Called!
Called!
Called!
Called!
```

这些调用都发生在进入节点时，不过有时候我们也可以在退出时调用访问者方法。.

假设我们有一个树状结构：

```
- FunctionDeclaration
  - Identifier (id)
  - Identifier (params[0])
  - BlockStatement (body)
    - ReturnStatement (body)
      - BinaryExpression (argument)
        - Identifier (left)
        - Identifier (right)
```

当我们向下遍历这颗树的每一个分支时我们最终会走到尽头，于是我们需要往上遍历回去从而获取到下一个节点。 向下遍历这棵树我们进入每个节点，向上遍历回去时我们退出每个节点。

让我们以上面那棵树为例子走一遍这个过程。

* 进入 FunctionDeclaration
    * 进入 Identifier (id)
    * 走到尽头
    * 退出 Identifier (id)
    * 进入 Identifier (params[0])
    * 走到尽头
    * 退出 Identifier (params[0])
    * 进入 BlockStatement (body)
        * 进入 ReturnStatement (body)
            * 进入 BinaryExpression (argument)
                * 进入 Identifier (left)
                * 走到尽头
                * 退出 Identifier (left)
                * 进入 Identifier (right)
                * 走到尽头
                * 退出 Identifier (right)
            * 退出 BinaryExpression (argument)
        * 退出 ReturnStatement (body)
    * 退出 BlockStatement (body)
* 退出 FunctionDeclaration

所以当创建访问者时你实际上有两次机会来访问一个节点。

```javascript
const MyVisitor = {
  Identifier: {
    enter() {
      console.log("Entered!");
    },
    exit() {
      console.log("Exited!");
    }
  }
};
```

### Paths（路径）

AST 通常会有许多节点，那么节点直接如何相互关联？ 我们可以用一个巨大的可变对象让你来操作以及完全访问（节点的关系），或者我们可以用Paths（路径）来简化这件事情。.

Path 是一个对象，它表示两个节点之间的连接。

举例来说如果我们有以下的节点和它的子节点：

```json
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  ...
}
```

将子节点 Identifier 表示为路径的话，看起来是这样的：

```json
{
  "parent": {
    "type": "FunctionDeclaration",
    "id": {...},
    ....
  },
  "node": {
    "type": "Identifier",
    "name": "square"
  }
}
```

同时它还有关于该路径的附加元数据：

```json
{
  "parent": {...},
  "node": {...},
  "hub": {...},
  "contexts": [],
  "data": {},
  "shouldSkip": false,
  "shouldStop": false,
  "removed": false,
  "state": null,
  "opts": null,
  "skipKeys": null,
  "parentPath": null,
  "context": null,
  "container": null,
  "listKey": null,
  "inList": false,
  "parentKey": null,
  "key": null,
  "scope": null,
  "type": null,
  "typeAnnotation": null
}
```

当然还有成堆的方法，它们和添加、更新、移动和删除节点有关，不过我们后面再说。

可以这么说，路径是对于节点在数中的位置以及其他各种信息的响应式表述。 当你调用一个方法更改了树的时候，这些信息也会更新。 Babel 帮你管理着这一切从而让你能更轻松的操作节点并且尽量保证无状态化。（译注：意即尽可能少的让你来维护状态）

### Paths in Visitors（存在于访问者中的路径）

当你有一个拥有 Identifier() 方法的访问者时，你实际上是在访问路径而不是节点。 如此一来你可以操作节点的响应式表述（译注：即路径）而不是节点本身。

```
const MyVisitor = {
  Identifier(path) {
    console.log("Visiting: " + path.node.name);
  }
};
```

```
a + b + c;
Visiting: a
Visiting: b
Visiting: c
```

State（状态）

状态是 AST 转换的敌人。状态会不停的找你麻烦，你对状态的预估到最后几乎总是错的，因为你无法预先考虑到所有的语法。

考虑下列代码：

```
function square(n) {
  return n * n;
}
```

让我们写一个把 n 重命名为 x 的访问者的快速实现：.

```javascript
let paramName;

const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    paramName = param.name;
    param.name = "x";
  },

  Identifier(path) {
    if (path.node.name === paramName) {
      path.node.name = "x";
    }
  }
};
```

对上面的代码来说或许能行，但我们很容易就能“搞坏”它：

```javascript
function square(n) {
  return n * n;
}
n;
```

更好的处理方式是递归。那么让我们来像克里斯托佛·诺兰的电影那样来把一个访问者放进另外一个访问者里面。

```javascript
const updateParamNameVisitor = {
  Identifier(path) {
    if (path.node.name === this.paramName) {
      path.node.name = "x";
    }
  }
};

const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    const paramName = param.name;
    param.name = "x";

    path.traverse(updateParamNameVisitor, { paramName });
  }
};
```

当然，这只是一个刻意捏造的例子，不过它演示了如何从访问者中消除全局状态。

### Scopes（作用域）

接下来让我们引入作用域（scope）的概念。 JavaScript 拥有词法作用域，代码块创建新的作用域并形成一个树状结构。

```javascript
// global scope

function scopeOne() {
  // scope 1

  function scopeTwo() {
    // scope 2
  }
}
```

在 JavaScript 中，每当你创建了一个引用，不管是通过变量（variable）、函数（function）、类型（class）、参数（params）、模块导入（import）、标签（label）等等，它都属于当前作用域。

```javascript
var global = "I am in the global scope";

function scopeOne() {
  var one = "I am in the scope created by `scopeOne()`";

  function scopeTwo() {
    var two = "I am in the scope created by `scopeTwo()`";
  }
}
```

处于深层作用域代码可以使用高（外）层作用域的引用。

```javascript
function scopeOne() {
  var one = "I am in the scope created by `scopeOne()`";

  function scopeTwo() {
    one = "I am updating the reference in `scopeOne` inside `scopeTwo`";
  }
}
```

低（内）层作用域也可以创建（和外层）同名的引用而无须更改它。

```javascript
function scopeOne() {
  var one = "I am in the scope created by `scopeOne()`";

  function scopeTwo() {
    var one = "I am creating a new `one` but leaving reference in `scopeOne()` alone.";
  }
}
```

当编写一个转换器时，我们须要小心作用域。我们得确保在改变代码的各个部分时不会破坏它。

我们会想要添加新的引用并且保证它们不会和已经存在的引用冲突。 又或者我们只是想要找出变量在哪里被引用的。 我们需要能在给定作用域内跟踪这些引用。

作用域可以表述为：

```javascript
{
  path: path,
  block: path.node,
  parentBlock: path.parent,
  parent: parentScope,
  bindings: [...]
}
```

当你创建一个新的作用域时需要给它一个路径及父级作用域。之后在遍历过程中它会在改作用于内收集所有的引用（“绑定”）。

这些做好之后，你将拥有许多用于作用域上的方法。我们稍后再讲这些。

Bindings（绑定）

引用从属于特定的作用域；这种关系被称作：绑定（binding）。.

```javascript
function scopeOnce() {
  var ref = "This is a binding";

  ref; // This is a reference to a binding

  function scopeTwo() {
    ref; // This is a reference to a binding from a lower scope
  }
}
```

一个绑定看起来如下：

```javascript
{
  identifier: node,
  scope: scope,
  path: path,
  kind: 'var',

  referenced: true,
  references: 3,
  referencePaths: [path, path, path],

  constant: false,
  constantViolations: [path]
}
```

有了这些信息你就可以查找一个绑定的所有引用，并且知道绑定的类型是什么（参数，定义等等），寻找到它所属的作用域，或者得到它的标识符的拷贝。 你甚至可以知道它是否是一个常量，并查看是哪个路径让它不是一个常量。

知道绑定是否为常量在很多情况下都会很有用，最大的用处就是代码压缩。

```javascript
function scopeOne() {
  var ref1 = "This is a constant binding";

  becauseNothingEverChangesTheValueOf(ref1);

  function scopeTwo() {
    var ref2 = "This is *not* a constant binding";
    ref2 = "Because this changes the value";
  }
}
```

## API

Babel 实际上是一系列的模块。本节我们将探索一些主要的模块，解释它们是做什么的以及如何使用它们。

注意：本节内容不是详细的 API 文档的替代品，正式的 API 文档将很快提供出来。


### babylon

Babylon 是 Babel 的解析器。最初是 Acorn 的一份 fork，它非常快，易于使用，并且针对非标准特性（以及那些未来的标准特性）设计了一个基于插件的架构。

首先，让我们先安装它。

```bash
$ npm install --save babylon
```

让我们从解析简单的字符形式代码开始：

```javascript
import * as babylon from "babylon";

const code = `function square(n) {
  return n * n;
}`;

babylon.parse(code);
// Node {
//   type: "File",
//   start: 0,
//   end: 38,
//   loc: SourceLocation {...},
//   program: Node {...},
//   comments: [],
//   tokens: [...]
// }
```

我们还能传递选项给 parse()：

```javascript
babylon.parse(code, {
  sourceType: "module", // default: "script"
  plugins: ["jsx"] // default: []
});
```

sourceType 可以是 "module" 或者 "script"，它表示 Babylon 应该用哪种模式来解析。 "module" 将会在严格模式下解析并且允许模块定义，"script" 则不会。

注意： sourceType 的默认值是 "script" 并且在发现 import 或 export 时产生错误。 使用 scourceType: "module" 来避免这些错误。

因为 Babylon 使用了基于插件的架构，因此 plugins 选项可以开启内置插件。 注意 Babylon 尚未对外部插件开放此 API 接口，不过未来会开放的。

可以在 Babylon README 查看所有插件的列表。.

### babel-traverse

Babel Tranverse（遍历）模块维护了整棵树的状态，并且负责替换、移除和添加节点。

运行以下命令安装：

```bash
$ npm install --save babel-traverse
```

我们可以配合 Babylon 一起使用来遍历和更新节点：

```javascript
import * as babylon from "babylon";
import traverse from "babel-traverse";

const code = `function square(n) {
  return n * n;
}`;

const ast = babylon.parse(code);

traverse(ast, {
  enter(path) {
    if (
      path.node.type === "Identifier" &&
      path.node.name === "n"
    ) {
      path.node.name = "x";
    }
  }
});
```

### babel-types

Babel Types（类型）模块是一个用于 AST 节点的 Lodash 式工具库。 译注：Lodash 是一个 JavaScript 函数工具库，提供了基于函数式编程风格的众多工具函数）它包含了构造、验证以及变换 AST 节点的方法。 其设计周到的工具方法有助于编写清晰简单的 AST 逻辑。

运行以下命令来安装它：

```bash
$ npm install --save babel-types
```

然后如下所示来使用：

```javascript
import traverse from "babel-traverse";
import * as t from "babel-types";

traverse(ast, {
  enter(path) {
    if (t.isIdentifier(path.node, { name: "n" })) {
      path.node.name = "x";
    }
  }
});
```

#### Definitions（定义）

Babel Types模块拥有每一个单一类型节点的定义，包括有哪些属性分别属于哪里，哪些值是合法的，如何构建该节点，该节点应该如何去遍历，以及节点的别名等信息。

单一节点类型定义的形式如下：

```javascript
defineType("BinaryExpression", {
  builder: ["operator", "left", "right"],
  fields: {
    operator: {
      validate: assertValueType("string")
    },
    left: {
      validate: assertNodeType("Expression")
    },
    right: {
      validate: assertNodeType("Expression")
    }
  },
  visitor: ["left", "right"],
  aliases: ["Binary", "Expression"]
});
```

#### Builders（构建器）

你会注意到上面的 BinaryExpression 定义有一个 builder 字段。.

```javascript
builder: ["operator", "left", "right"]
```

这是由于每一个节点类型都有构建器方法：

```javascript
t.binaryExpression("*", t.identifier("a"), t.identifier("b"));
```

它可以创建如下所示的 AST：

```json
{
  type: "BinaryExpression",
  operator: "*",
  left: {
    type: "Identifier",
    name: "a"
  },
  right: {
    type: "Identifier",
    name: "b"
  }
}
```

当打印出来（输出）之后是这样的：

```javascript
a * b
```

构建器还会验证自身创建的节点，并在错误使用的情形下抛出描述性的错误。这就引出了接下来的一种方法。

#### Validators（验证器）

BinaryExpression 的定义还包含了节点的 fields 字段信息并且指示了如何验证它们。

```javascript
fields: {
  operator: {
    validate: assertValueType("string")
  },
  left: {
    validate: assertNodeType("Expression")
  },
  right: {
    validate: assertNodeType("Expression")
  }
}
```

这可以用来创建两种类型的验证方法。第一种是 isX。.

```javascript
t.isBinaryExpression(maybeBinaryExpressionNode);
```

此方法用来确保节点是一个二进制表达式，不过你也可以传入第二个参数来确保节点包含特定的属性和值。

```javascript
t.isBinaryExpression(maybeBinaryExpressionNode, { operator: "*" });
```

这些方法还有一种更加，嗯，断言式的版本，会抛出异常而不是返回 true 或 false。.

```javascript
t.assertBinaryExpression(maybeBinaryExpressionNode);
t.assertBinaryExpression(maybeBinaryExpressionNode, { operator: "*" });
// Error: Expected type "BinaryExpression" with option { "operator": "*" }
```

#### Converters（变换器）

##### babel-generator

Babel Generator模块是 Babel 的代码生成器。它将 AST 输出为代码并包括源码映射（sourcemaps）。

运行以下命令来安装它：

```bash
$ npm install --save babel-generatoraj
```

然后如下所示使用：

```javascript
import * as babylon from "babylon";
import generate from "babel-generator";

const code = `function square(n) {
  return n * n;
}`;

const ast = babylon.parse(code);

generate(ast, null, code);
// {
//   code: "...",
//   map: "..."
// }
```

你也可以给 generate() 传递选项。.

```javascript
generate(ast, {
  retainLines: false,
  compact: "auto",
  concise: false,
  quotes: "double",
  // ...
}, code);
```

##### babel-template

Babel Template模块是一个很小但却非常有用的模块。它能让你编写带有占位符的字符串形式的代码，你可以用此来替代大量的手工构建的 AST。

```javascript
$ npm install --save babel-template
import template from "babel-template";
import generate from "babel-generator";
import * as t from "babel-types";

const buildRequire = template(`
  var IMPORT_NAME = require(SOURCE);
`);

const ast = buildRequire({
  IMPORT_NAME: t.identifier("myModule"),
  SOURCE: t.stringLiteral("my-module")
});

console.log(generate(ast).code);
// var myModule = require("my-module");
```

