# webpack打包📦出来的代码

> webpack@4.43.0

webpack可以兼容多种模块化机制, 先来看一下webpack打包esModule输出的代码. 直接看打包之后的代码, 能对webpack有一个初步感性的认识.

## 总览

**webpack.config.js**
```js
module.exports = {
  mode: 'development',
  devtool: 'source-map'
}
```

**src/index.js**
```js
import defaultB, {namedB} from './b'
console.log(defaultB, namedB)

export const namedA = 'namedA'
export default 'defaultA'

```

**src/b.js**
```js
export const namedB = 'b'
export default 'defaultB'
```

默认webpack打包出来的是可以直接运行在web上的代码

![webpackIIFE](https://fangbinwei-blog-image.oss-cn-shanghai.aliyuncs.com/FrontEnd/Engineering/webpack/module/webpackIIFE_03d266e3.svg)





**dist/main.js**
```js
/******/ (function(modules) { // webpackBootstrap
//...
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/b.js":
/*!******************!*\
  !*** ./src/b.js ***!
  \******************/
/*! exports provided: namedB, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {
// ...
/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: namedA, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {
// ...
/***/ })

/******/ });
//# sourceMappingURL=main.js.map
```

可以看到打包后的代码是IIFE(immediately invoked function expression), 函数的输出是`entryModule`, IIFE的输入是包含一系列依赖模块的对象字面量, 每个模块都被类似如下的结构所包裹.

```js
(function(module, __webpack_exports__, __webpack_require__) {
// ...
}),
```

 `webpackBootstrap`则是能够收集,缓存依赖, 让模块拥有导出和导入其他模块的能力. 这和nodejs实现commonjs的方式非常类似. `webpackBootstrap`的存在, 也使得webpack和nodejs实现的commonjs一样, 可以处理循环依赖.
 
 > 之前捣鼓vscode插件打包的时候, 遇到rollup处理不了循环依赖, 最后还是用了webpack

 
## Module和webpackBootstrap

首先看一下, 一些必要的webpackBootstrap代码

### `__webpack_require__`

```js
 	// The module cache
 	var installedModules = {};

 	// The require function
 	function __webpack_require__(moduleId) {

 		// Check if module is in cache
 		if(installedModules[moduleId]) {
 			return installedModules[moduleId].exports;
 		}
 		// Create a new module (and put it into the cache)
 		var module = installedModules[moduleId] = {
 			i: moduleId,
 			l: false,
 			exports: {}
 		};

 		// Execute the module function
 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

 		// Flag the module as loaded
 		module.l = true;

 		// Return the exports of the module
 		return module.exports;
 	}
```

内部使用`installedModules`来缓存模块, `__webpack_require__`流程很清晰,

1. 首先检查缓存, 若存在直接返回已经缓存的模块
2. 创建新的模块, `installedModules[moduleId]`也指向这个新模块

:::tip
这一步对于解决循环依赖很关键(`var module = installedModules[moduleId] = ...`), 因为执行下面的module function时, 如果循环依赖到了自身, 那依赖到的自身就是上面的`installedModules[moduleId]`
:::

3. 执行module function

4. 返回模块的exports

### `__webpack_require__.d`

```js
// define getter function for harmony exports
__webpack_require__.d = function(exports, name, getter) {
	if(!__webpack_require__.o(exports, name)) {
		Object.defineProperty(exports, name, { enumerable: true, get: getter });
	}
};
```

#### `__webpack_require__.o`
```js
	// Object.prototype.hasOwnProperty.call
	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
```

`__webpack_require__.d`通过定义getter从而让内部值的变化能够反应到外部. 这点和commonjs不同. babel和typescript实现esModule这个性质的方式和webpack不同, 它们是在编译阶段实现的.

:::tip
可以参考[阮一峰的文章](https://es6.ruanyifeng.com/#docs/module-loader#ES6-%E6%A8%A1%E5%9D%97%E4%B8%8E-CommonJS-%E6%A8%A1%E5%9D%97%E7%9A%84%E5%B7%AE%E5%BC%82)
:::

### `__webpack_require__.r`

```js

// define __esModule on exports
__webpack_require__.r = function(exports) {
	if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
	}
	Object.defineProperty(exports, '__esModule', { value: true });
};
```

`Symbol.toStringTag`定义模块输出的`toString`为`[object Module]`, 并在`exports`上定义`__esModule`属性, 来表明该模块是由ES模块转化而来.

告诉别人该模块是ES模块转化过来的, 意味着什么呢? 

这等于在说, hi, 我的默认导出在‘default’属性上. 这在处理模块之间的兼容有重要作用. 比如一个es6的模块通过webpack打包成了commonjs, 然后被拿去别人用, 别人是通过babel用这个包的.

### entryModule

首先看下`entryModule`

```js
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: namedA, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "namedA", function() { return namedA; });
/* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./b */ "./src/b.js");

console.log(_b__WEBPACK_IMPORTED_MODULE_0__["default"], _b__WEBPACK_IMPORTED_MODULE_0__["namedB"])

const namedA = 'a'
/* harmony default export */ __webpack_exports__["default"] = ('defaultA');
/***/ })
```

esModule是声明式的, webpack所做的就是把这些声明式的代码, 替换为命令式的代码.

入口模块中, 使用`__webpack_require__.d`来定义模块的`named export`, 使用`__webpack_require__`来加载所依赖的模块.

#### default export
`default export`则是通过一个`default`属性来实现. 有意思是默认导出是一个值的复制, 并不像`__webpack_require__.d`.


更有意思的是, 如果代码是这样写的, 

```js
const defaultA = 'defaultA'
export {
  defaultA as default
}
```

那`default`则是用`getter`来定义的, 这个暂时还不清楚, 虽然阮一峰老师的文章说`export {defaultA as default}`等同于`export default defaultA`. 需要研究下ES6的规范和webpack的实现.

类似的场景还有,
```js
export default function () {
  //...
}
// 其打包后

/* harmony default export */ __webpack_exports__["default"] = (function (){

});
```

```js
export default function c () {
// ...
}
// 其打包后

/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return c; });

function c() {}

/***/ })
```

TODO: 这个需要具体分析`webpack/lib/dependencies/HarmonyExportSpecifierDependency.js` 和`webpack/lib/dependencies/HarmonyExportExpressionDependency.js`


## 使用ESModule语法导入commonjs模块

commonjs和esModule本身是不兼容的

esModule有两种导出方式, named export, default export, 而commonjs只有一种导出方式, 就是通过`module.exports/ exports`

假如有个commonjs规范的代码如下,
**example.js**
```js
module.exports = function () {}
module.exports.a = 'a'
module.exports.b = 'b'
```
那esModule的语法要怎么去加载这个模块呢? 实际上是如下方式

```js
import example, {a, b} from './example.js'
```

我们要用esModule的语法导入commonjs模块, 就需要把esModule的name export和default export两个概念映射到commonjs中. 那么`module.exports`的整体导出就对应default export, 通过`module.exports`上的属性named export. 可以看到这两个概念在commonjs中重叠使用了`module.exports`

使用如下的例子打包, 

调整一下`src/b.js`, 改为commonjs, webpack也是可以搞定的

**src/index.js**
```js
import defaultB, {namedB} from './b'
console.log(defaultB, namedB)
```

**src/b.js**
```js
const c = require('./c.js')
module.exports = function b() {
  c()
}
module.exports.namedB = 'namedB'

```
**src/c.js**
```js
module.exports = function c() {console.log('defaultC')}
```
其依赖关系如下, 

![esmodule_commonjs](https://fangbinwei-blog-image.oss-cn-shanghai.aliyuncs.com/FrontEnd/Engineering/webpack/module/esmodule_commonjs_3edeb466.svg)



**打包后**
`src/index.js`中主要关注导入模块b的代码
```js{25,26,28}
({

 "./src/b.js":
 (function(module, exports) {
const c = __webpack_require__(/*! ./c.js */ "./src/c.js")
module.exports = function b() {
  c()
}
module.exports.namedB = 'namedB'

 }),

 "./src/c.js":
 (function(module, exports) {

  module.exports = function c() {console.log('defaultC')}

 }),

 "./src/index.js":
 (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./b */ "./src/b.js");
/* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_b__WEBPACK_IMPORTED_MODULE_0__);

console.log(_b__WEBPACK_IMPORTED_MODULE_0___default.a, _b__WEBPACK_IMPORTED_MODULE_0__["namedB"])



 })

});
```

对于需要导入的`namedB`, 是直接从`src/b.js`的`module.exports`上去取(和前一个例子相同), 而对于`defaultB`, 则需要用`__webpack_require__.n`来处理.


### `__webpack_require__.n`
```js
	// getDefaultExport function for compatibility with non-harmony modules
	__webpack_require__.n = function(module) {
		var getter = module && module.__esModule ?
			function getDefault() { return module['default']; } :
			function getModuleExports() { return module; };
		__webpack_require__.d(getter, 'a', getter);
		return getter;
	};
```
因为我们加载的commonjs有可能是通过打包工具从esModule转化过来的, 这种从esModule转化过来的commonjs模块, 会有`__esModule`属性, 这种模块, 它的default export就在‘default’属性上, 而对于传统的commonjs来说, 我们就需要加载其`module.exports`作为其default export. (假如我们的`src/b.js`中的代码是网上找来的代码, 别人是通过babel打包出来的, 那它就可能有`__esModule`属性Jj)

babel/ts的处理和webpack类似, 但是比webpack更为周到. 

考虑下面这种情况

**src/index.js**
```js
import * as f from './b'
console.log(f())
```

**src/b.js**
```js
module.exports = function d() {console.log('defaultB')}
```

`import * as f from './b'`在esModule中是将所有的named export加载到`f`上, `f`就是一个命名空间, `f`是不能作为一个函数去调用的.

webpack打出的`src/index.js`代码中关键部分如下
```js
/* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./b */ "./src/b.js");

console.log(_b__WEBPACK_IMPORTED_MODULE_0__())
```
webpack打包的代码, `f`是可以执行的, 这违背esModule的规范. 而babel/ts在对这种情况做了处理.

在ts2.7的版本以前, 其处理方式和webpack类似, `import * as ..`直接等同于`require()`, 而在[2.7版本中新增的`esModuleInterop`编译选项](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#support-for-import-d-from-cjs-from-commonjs-modules-with---esmoduleinterop)就是针对这种情况的.

## 使用commonjs语法导入ESModule
直接用`require()`去理解就行,

**src/b.js**
```js
export default 'defaultB'

export const namedB = 'namedB'
```

**src/index.js**
```js
const b = require('./b')
console.log(b)
```

我们拿到的结果就是
```bash
Object [Module] { namedB: [Getter], default: 'defaultB' }
// 这个是node的输出, 没显示不可枚举的`__esModule`属性
```
所在有些情况下, 你会看到类似的代码`require(...).default`

## 混用commonjs 和esModule可能存在的问题
当然, 强烈建议不要混用两种不同的规范

有种情况是有问题, 下面举个例子

**src/b.js**
```js
export default 'defaultB'

export const namedB = 'namedB'
```

**src/index.js**
```js
import defaultB, {namedB} from './b'

console.log(defaultB, namedB)

// exports.test = 2 // 不会有效
module.exports = { // 会报错
  test: 2
}
```

会什么这种情况会报错呢, 看一下打包后的代码

```js
{
"./node_modules/webpack/buildin/harmony-module.js":
(function(module, exports) {
  //...
}),

 "./src/b.js":
 (function(module, __webpack_exports__, __webpack_require__) {
   //...
 }),

 "./src/index.js":
 (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(module) {/* harmony import */ var _b__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./b */ "./src/b.js");


console.log(_b__WEBPACK_IMPORTED_MODULE_0__["default"], _b__WEBPACK_IMPORTED_MODULE_0__["namedB"])

// exports.test = 2 // 不会有效
// module.exports.test = 2 // 会报错
module.exports = { // 会报错
  test: 2
}



/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../node_modules/webpack/buildin/harmony-module.js */ "./node_modules/webpack/buildin/harmony-module.js")(module)))

 })
}
```
我们看到, 有一个`harmony-module.js`的代码被执行了, 这个模块中有一句关键代码, `exports`的`writable`为`false`, `module.exports`是只读的
```js
		Object.defineProperty(module, "exports", {
			enumerable: true
		});
```

因为我们使用了esModule的导入语法, 所以webpack判断当前是一个es module, 而上面提到, esModule的导出语法本身是和commonjs的导出语法是不兼容的. 所以webpack不允许这样混用.

:::tip
在使用vue cli的时候碰到[一个问题](https://github.com/vuejs/vue-cli/issues/4773#issuecomment-548241889), 就是由这个造成的
:::

## External
在打包库代码的时候, external是常用到的一个配置项

假如我们现在有一个库`lib-b`, 入口文件代码如下

**src/index.js**
```js
const c = require('./c.js')
module.exports = function b() {
  c()
}
module.exports.namedB = 'namedB'
```

**src/c.js**
```js
module.exports = function c() {console.log('defaultC')}
```

我们现在要打包库`lib-b`, 假如`./c.js`已经被提取成了一个npm包`lib-c`, 配置如下,

**webpack.config.js**
```js
module.exports = {
  mode: 'development', // 仅为了说明, 使用dev
  devtool: 'source-map',
  output: {
    libraryTarget: 'commonjs2',
  },
  externals: {
    './c.js': 'commonjs2 lib-c'
  }
}
```

那么打包后的结果如下, `./c.js`的代码没有被打包进来.

```js
module.exports =
(function(modules) { // webpackBootstrap
  // ...
	// Load entry module and return exports
	return __webpack_require__(__webpack_require__.s = "./src/index.js");
})
({

 "./c.js":
 (function(module, exports) {

module.exports = require("lib-c");

 }),

 "./src/index.js":
 (function(module, exports, __webpack_require__) {

const c = __webpack_require__(/*! ./c.js */ "./c.js")
module.exports = function b() {
  c()
}
module.exports.namedB = 'namedB'

 })

 });
//# sourceMappingURL=main.js.map
```

假如我们的应用现在要使用这个`lib-b`, 

**src/index.js**
```js
import defaultB, {namedB} from 'lib-b'
console.log(defaultB)
console.log(namedB)
```

那现在的场景就是这样, 我们要使用esModule语法去加载一个commonjs模块, 和上文提到的场景['使用esmodule语法导入commonjs模块'](#使用esmodule语法导入commonjs模块)是一样的. 但是, 我们使用的这个commonjs模块是webpack打包出来的, 通过npm来安装它, 它有一点点臃肿, 因为它包含了webpack bootstrap代码, 同时它依赖了`lib-c`这个npm包. `lib-b`包肯定是会把`lib-c`包加到其package.json的dependencies列表内的.

打包后的部分代码如下
```js{3,40,49}
{

  "./node_modules/lib-b/index.js": (function (module, exports, __webpack_require__) {

    module.exports =
      (function (modules) { // webpackBootstrap
        // ...
        // Load entry module and return exports
        return __webpack_require__(__webpack_require__.s = "./src/index.js");
      })
      ({

        "./c.js":
          /*!************************!*\
            !*** external "lib-c" ***!
            \************************/
          /*! no static exports found */
          /***/
          (function (module, exports) {

            module.exports = __webpack_require__( /*! lib-c */ "./node_modules/lib-c/index.js");

          }),

        "./src/index.js": (function (module, exports, __webpack_require__) {

          const c = __webpack_require__( /*! ./c.js */ "./c.js")
          module.exports = function b() {
            c()
          }
          module.exports.namedB = 'namedB'

        })

      });


  }),

  "./node_modules/lib-c/index.js": (function (module, exports) {

    module.exports = function c() {
      console.log('defaultC')
    }


  }),

  "./src/index.js": (function (module, __webpack_exports__, __webpack_require__) {

    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */
    var lib_b__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__( /*! lib-b */ "./node_modules/lib-b/index.js");
    /* harmony import */
    var lib_b__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(lib_b__WEBPACK_IMPORTED_MODULE_0__);

    console.log(lib_b__WEBPACK_IMPORTED_MODULE_0___default.a)
    console.log(lib_b__WEBPACK_IMPORTED_MODULE_0__["namedB"])
  })

}
```

可以看到`./node_modules/lib-b/index.js`这个包是由webpack打包的, 它的代码是有点点臃肿的, 因为它自带webpackBootstrap代码.

而在lib-b包中external掉的`lib-c`, 其代码也被webpack处理过了,

```js
module.exports = require("lib-c");
```

处理后变为
```js
  module.exports = __webpack_require__( /*! lib-c */ "./node_modules/lib-c/index.js");
```
而这个`__webpack_require__`并非来自`lib-b`的webpackBootstrap, 而是来自外层我们当前所打包的这个应用的`__webpack_require__`

整体代码结构如下,

![external_structure](https://fangbinwei-blog-image.oss-cn-shanghai.aliyuncs.com/FrontEnd/Engineering/webpack/module/external_structure_37f1ba4e.svg)

模块的依赖图如下,

![external_dep](https://fangbinwei-blog-image.oss-cn-shanghai.aliyuncs.com/FrontEnd/Engineering/webpack/module/external_dep_076c94ba.svg)

我们可以发现, 这个模块依赖图和上文提到的场景['使用esmodule语法导入commonjs模块'](#使用esmodule语法导入commonjs模块)中的依赖图非常类似. 我们通过打包发布npm包的形式, 达到共享代码, 而这个npm包中的一些通用代码, 通过external的方式避免将代码硬编码到自己的包中, 而最终由webpack来组织这些代码.

无论是通过使用npm包的方式, 还是使用自身代码的方式, 对于webpack打包都没有区别, 无非就是npm包的代码在本地node_modules文件夹中. 对于webpack来说, 他们就是一个个模块, 只是磁盘位置不同.

### 需要注意的

可以看到webpack打包的库`lib-b`是有一点臃肿的, webpack在生产环境下有`ModuleConcatenationPlugin`来做优化, rollup在这方面也有一定优势, 所以通常打包一些库文件, rollup是比较受欢迎的.

## Dynamic Import / Code Split

**src/index.js**
```js
import('./b').then(moduleB => {
  console.log(moduleB.default, moduleB.namedB)
})
```

**src/b.js**
```js
export const namedB = 'b'
export default 'defaultB'
```

打包后, 得到`main.js`, `0.js`(即`src/b.js`的代码)

首先看`0.js`

```js
(window['webpackJsonp'] = window['webpackJsonp'] || []).push([
  [0],
  {
    './src/b.js': function(module, __webpack_exports__, __webpack_require__) {
      'use strict'
      __webpack_require__.r(__webpack_exports__)
      /* harmony export (binding) */ __webpack_require__.d(
        __webpack_exports__,
        'namedB',
        function() {
          return namedB
        }
      )
      const namedB = 'b'
      /* harmony default export */ __webpack_exports__['default'] = 'defaultB'
    }
  }
])
```

而`window['webpackJsonp']在入口js文件的webpackBootstrap代码中有定义, 而且其`push`方法也是通过装饰者模式修改过的.

**window['webpackJsonp']**
```js
 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
 	jsonpArray.push = webpackJsonpCallback;
 	jsonpArray = jsonpArray.slice();
 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
 	var parentJsonpFunction = oldJsonpFunction;
```

如果全局作用域下有`window['webpackJsonp']`就直接使用, 否则创建个新的空数组.
并将数组原生`push`替换成`webpackJsonpCallback`, 原生`push`保存在`parentJsonpFunction`, 装饰者模式. 

起初`jsonArray`, `window['webpackJsonp']`都指向`push`被修改过的数组.

在调用`jsonpArray = jsonpArray.slice();`之后, `jsonpArray`重新指向了`push`为原生的数组. 而`window['webpackJsonp']`的`push`仍旧是被修改过的.

当`0.js`中的代码执行, 将chunk push到`window['webpackJsonp']`的时候, 就执行了`webpackJsonpCallback`

入口模块的代码将会在执行`import('./b.js')`的时候, 将`0.js`通过script标签插入到DOM中并执行, 
```js
{
  './src/index.js': function(module, exports, __webpack_require__) {
    __webpack_require__
      .e(/*! import() */ 0)
      .then(__webpack_require__.bind(null, /*! ./b */ './src/b.js'))
      .then(moduleB => {
        console.log(moduleB.default, moduleB.namedB)
      })
  }
}
```
1. `__webpack_require__.e(/*! import() */ 0)`将会执行`0.js`中的代码, 会将chunk模块添加到`modules`变量中
2. `__webpack_require__.bind(null, /*! ./b */ './src/b.js')`将会加载`./b.js`中的模块, 并返回模块输出, 模块输出将会传递给下个`then`的回调函数, 即我们自己手写的回调函数.

### `__webpack_require__.e`
```js
  // installedChunks中管理了所有已加载/正在加载的chunk
 	var installedChunks = {
 		"main": 0
 	};
 	__webpack_require__.e = function requireEnsure(chunkId) {
 		var promises = [];


 		// JSONP chunk loading for javascript
 		var installedChunkData = installedChunks[chunkId];
 		if(installedChunkData !== 0) { // 0 means "already installed".

       // a Promise means "currently loading".
       // 该chunk正在加载, installedChunkData为[resolve, reject, promise]
       // 当使用`import()`重复加载同一个模块, 会有可能进到这个逻辑的
 			if(installedChunkData) {
 				promises.push(installedChunkData[2]);
 			} else {
         // chunk未加载, 加载该chunk
 				// setup Promise in chunk cache
 				var promise = new Promise(function(resolve, reject) {
 					installedChunkData = installedChunks[chunkId] = [resolve, reject];
         });
        // 当installedChunks[chunkId][0]调用的时候, 该promise resolve
 				promises.push(installedChunkData[2] = promise);

        // 通过script标签加载code split的代码
 				// start chunk loading
 				var script = document.createElement('script');
 				var onScriptComplete;

 				script.charset = 'utf-8';
        script.timeout = 120;
        // Content-Security-Policy, 见https://webpack.js.org/guides/csp/
 				if (__webpack_require__.nc) {
 					script.setAttribute("nonce", __webpack_require__.nc);
        }
        // 获取chunk路径
 				script.src = jsonpScriptSrc(chunkId);

 				// create error before stack unwound to get useful stacktrace later
         var error = new Error();
         // 当chunk中的代码执行完后, 会执行该回调
 				onScriptComplete = function (event) {
 					// avoid mem leaks in IE.
 					script.onerror = script.onload = null;
           clearTimeout(timeout);
           // 可以想象, 如果chunk正常加载, 正常执行, 其执行代码肯定会将installedChunks[chunkId]赋值为0
          var chunk = installedChunks[chunkId];
 					if(chunk !== 0) {
 						if(chunk) {
 							var errorType = event && (event.type === 'load' ? 'missing' : event.type);
 							var realSrc = event && event.target && event.target.src;
 							error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
 							error.name = 'ChunkLoadError';
 							error.type = errorType;
 							error.request = realSrc;
 							chunk[1](error);
 						}
 						installedChunks[chunkId] = undefined;
 					}
 				};
 				var timeout = setTimeout(function(){
 					onScriptComplete({ type: 'timeout', target: script });
 				}, 120000);
 				script.onerror = script.onload = onScriptComplete;
 				document.head.appendChild(script);
 			}
 		}
 		return Promise.all(promises);
 	};
```
总结下`__webpack_require__.e`将会加载chunk代码, 并在`installedChunks`中记录下该chunk的状态, 若该chunk为已加载, 其为`0`, 若正在加载, 其为`[resolve, reject, promise]`, `__webpack_require__.e`返回Promise, 当`installedChunks[chunkId][0]`被调用的时候, 其变为resolve状态. 

加载chunk代码的时候, 将执行`webpackJsonpCallback`, `installedChunks[chunkId][0]`将被调用

### webpackJsonpCallback
**webpackJsonpCallback**
```js
 	function webpackJsonpCallback(data) {
 		var chunkIds = data[0];
 		var moreModules = data[1];


 		// add "moreModules" to the modules object,
 		// then flag all "chunkIds" as loaded and fire callback
 		var moduleId, chunkId, i = 0, resolves = [];
 		for(;i < chunkIds.length; i++) {
 			chunkId = chunkIds[i];
 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
 				resolves.push(installedChunks[chunkId][0]);
       }
       // installedChunks中标记为0, 意味chunk成功加载
 			installedChunks[chunkId] = 0;
 		}
 		for(moduleId in moreModules) {
       // 将chunk中的模块添加到`modules`中, `modules`中记录了应用依赖的模块
 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
 				modules[moduleId] = moreModules[moduleId];
 			}
     }
     // 执行原生push方法, 将chunk信息记录到window['webpackJsonp']中
 		if(parentJsonpFunction) parentJsonpFunction(data);

    // 执行installedChunks[chunkId][0], __webpack_require__.e返回的Promise将resolve.
 		while(resolves.length) {
 			resolves.shift()();
 		}

 	};
```

```js
    __webpack_require__
      .e(/*! import() */ 0)
      .then(__webpack_require__.bind(null, /*! ./b */ './src/b.js'))
      .then(moduleB => {
        console.log(moduleB.default, moduleB.namedB)
      })
```


当`webpackJsonpCallback`执行完后, `__webpack_require__.bind(null, /*! ./b */ './src/b.js')`将执行, 从`modules`中拿到`./src/b.js`并执行其中的模块代码. 这样dynamic import的流程就走完了


若我们把`b.js`该为commonjs模块

**src/b.js**
```js
module.exports = {
  namedB: 'b'
}
```

那带出来的代码是类似的, 但是`modules`有点小区别

```js
{
  './src/index.js': function(module, exports, __webpack_require__) {
    __webpack_require__
      .e(/*! import() */ 0)
      .then(__webpack_require__.t.bind(null, /*! ./b */ './src/b.js', 7))
      .then(moduleB => {
        console.log(moduleB.default, moduleB.namedB)
      })
  }
}
```

执行的是`__webpack_require__.t`, 而不是`__webpack_require__`

因为之前有提到加载commonjs模块需要判断其是否有`__esModule`属性, 而`__webpack_require__.t`就是为了这个操作

翻看前面的代码, 我们是用`__webpack_require__.n`和`__webpack_require__`配合处理commonjs模块的, 对于dynamic import, 则使用`__webpack_require__.t`则更灵活, 因为dynamic import还有更复杂的场景, 比如
```js
let m = 'b'
import(`./${b}.js`)
```

### `__webpack_require__.t`
```js
// create a fake namespace object
// mode & 1: value is a module id, require it
// mode & 2: merge all properties of value into the ns
// mode & 4: return value when already ns object
// mode & 8|1: behave like require
__webpack_require__.t = function(value, mode) {
  if (mode & 1) value = __webpack_require__(value)
  if (mode & 8) return value
  if (mode & 4 && typeof value === 'object' && value && value.__esModule)
    return value
  var ns = Object.create(null)
  __webpack_require__.r(ns)
  Object.defineProperty(ns, 'default', { enumerable: true, value: value })
  if (mode & 2 && typeof value != 'string')
    for (var key in value)
      __webpack_require__.d(
        ns,
        key,
        function(key) {
          return value[key]
        }.bind(null, key)
      )
  return ns
}

```

`__webpack_require__.t.bind(null, /*! ./b */ './src/b.js', 7)`, mode 7将会执行`(mode & 1)`, `(mode & 4)`, `(mode & 2)`的代码, 处理源代码为commonjs的模块

mode 9将执行`(mode & 1)`, `(mode & 8)`, mode 9 处理项目中源代码为esModule的那些模块

### flowchart
![dynamic_import_flowchart](https://fangbinwei-blog-image.oss-cn-shanghai.aliyuncs.com/FrontEnd/Engineering/webpack/module/dynamic_import_flowchart_4ec3df6d.svg)




## 参考
> https://zhuanlan.zhihu.com/p/97737035
> https://medium.com/webpack/webpack-4-import-and-commonjs-d619d626b655
> https://zhuanlan.zhihu.com/p/84204506
> https://developer.aliyun.com/article/755252