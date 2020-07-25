# tapable 2.0.0-beta.8

在tapable0.x中, 需要继承tapable才能使用它的钩子. tapable2.x更加专注于钩子本身, 使用它更加直接.

```js
const { SyncHook } = require('tapable')

class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(['newSpeed'])
    }
  }
  setSpeed(newSpeed) {
    this.hooks.accelerate.call(newSpeed)
  }
}

const myCar = new Car()
myCar.hooks.accelerate.tap('LoggerPlugin', newSpeed =>
  console.log(`Accelerating to ${newSpeed}`)
)
myCar.setSpeed(666) // Accelerating to 666

```
## SyncHook UML

![uml](https://image.fangbinwei.cn/FrontEnd/Engineering/webpack/tapable2/tapable2_synchook_uml.svg)

```js

const factory = new SyncHookCodeFactory();

const TAP_ASYNC = () => {
	throw new Error("tapAsync is not supported on a SyncHook");
};

const TAP_PROMISE = () => {
	throw new Error("tapPromise is not supported on a SyncHook");
};

const COMPILE = function(options) {
	factory.setup(this, options);
	return factory.create(options);
};

function SyncHook(args = [], name = undefined) {
	const hook = new Hook(args, name);
	hook.constructor = SyncHook;
	hook.tapAsync = TAP_ASYNC;
	hook.tapPromise = TAP_PROMISE;
	hook.compile = COMPILE;
	return hook;
}
```

以SyncHook为例, Hook相当于一个抽象类, SyncHook在其基础上, 提供自己的compile, tapAsync, tapPromise.

在SyncHook实例上注册的回调函数是同步调用的, 通过tap来注册, 由其基类Hook来提供方法, 调用tapAsync, tapPromise则抛出错误.


## SyncHook

以SyncHook为例

```js
const SyncHook = require("./lib/SyncHook.js");

const sh = new SyncHook(["p1", "p2"]);

sh.tap(
	{
		name: "mySyncHookPlugin1",
		stage: 2
	},
	(p1, p2) => {
		console.log("plugin1", "p1", p1, "p2", p2);
	}
);

sh.tap(
	{
		name: "mySyncHookPlugin2",
		stage: 0
	},
	(p1, p2) => {
		console.log("plugin2", "p1", p1, "p2", p2);
	}
);

sh.call(1, 2);

// plugin2 p1 1 p2 2
// plugin1 p1 1 p2 2
```

`tap`方法将会收集注册的回调函数(同步), tap继承自`Hook`

`call`方法执行所收集的回调函数, call继承自`Hook`

如果是tapable0.x, 这些回调函数会被收集起来, 并遍历进行调用.

而tapable2.x则利用`new Function`来执行生成的代码

上面的例子, 生成的代码如下
```js
function anonymous(p1, p2
) {
"use strict";
var _context;
var _x = this._x;
var _fn0 = _x[0];
_fn0(p1, p2);
var _fn1 = _x[1];
_fn1(p1, p2);
}
```

### tap

**Hook**
```js
	tap(options, fn) {
		this._tap("sync", options, fn);
	}

	_tap(type, options, fn) {
		//...
		options = Object.assign({ type, fn }, options);
		// 运行拦截器, 类似axios里的拦截器
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	_insert(item) {
		//...
		this.taps[i] = item;
	}
```

`tap`内部调用`_insert`来将回调函数收集到`taps`中, 首先看下`_insert`的主要逻辑

```js

	_insert(item) {
		let stage = 0;
		if (typeof item.stage === "number") {
			stage = item.stage;
		}
		let i = this.taps.length;
		while (i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i + 1] = x;
			const xStage = x.stage || 0;
			if (xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
```
默认插件的`stage`为0 , 根据`stage`从小到大, 使用插入排序

![2020-07-19-18-44-42](https://image.fangbinwei.cn/FrontEnd/Engineering/webpack/tapable2/2020-07-19-18-44-42_8e7e27a4.png)

而完整的`_insert`还由一个`before`变量来控制排序, `before`优先级比`stage`高.

```js
	_insert(item) {
		this._resetCompilation();
		let before;
		if (typeof item.before === "string") {
			before = new Set([item.before]);
		} else if (Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if (typeof item.stage === "number") {
			stage = item.stage;
		}
		let i = this.taps.length;
		while (i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i + 1] = x;
			const xStage = x.stage || 0;
			if (before) {
				if (before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if (before.size > 0) {
					continue;
				}
			}
			if (xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
```

![2020-07-19-19-11-51](https://image.fangbinwei.cn/FrontEnd/Engineering/webpack/tapable2/2020-07-19-19-11-51_47a8cd8f.png)

### call
在使用`tap`收集完回调后, 使用`call`则可以执行这些回调函数, 但是并不是通过遍历`taps`数组执行, 而是使用`call`去生成一个函数, 并执行

```js
const CALL_DELEGATE = function(...args) {
	this.call = this._createCall("sync");
	// 执行生成的函数
	return this.call(...args);
};


class Hook {
	constructor(args = [], name = undefined) {
		this._call = CALL_DELEGATE;
		this.call = CALL_DELEGATE;
	}
	_resetCompilation() {
		this.call = this._call;
		this.callAsync = this._callAsync;
		this.promise = this._promise;
	}
	_insert(item) {
		this._resetCompilation();
		// ..
	}
}
```

首次调用`call`则会调用`CALL_DELEGATE`, 会将`this.call`使用`this._createCall("sync")`覆盖, 避免重复调用`CALL_DELEGATE`去生成函数. 但是如果在调用`call`之后, 又通过`tap`去添加回调函数, 则会进行reset, 重新执行`CALL_DELEGATE`

### _createCall

**Hook**
```js
class Hook {
	compile(options) {
		throw new Error("Abstract: should be overridden");
	}
	_createCall(type) {
		return this.compile({
			taps: this.taps, // [{ type, fn, name }]
			interceptors: this.interceptors, // []
			args: this._args, // like ['p1', 'p2'] 
			type: type // 'sync' | 'async' | 'promise'
		});
	}
}
```
之前又提到`Hook`是一个抽象类, 它的一些方法需要子类去实现, `SyncHook`实现了`compile`

**SyncHook**
```js

class SyncHookCodeFactory extends HookCodeFactory {
	content({ onError, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}

const factory = new SyncHookCodeFactory();

const COMPILE = function(options) {
	factory.setup(this, options);
	return factory.create(options);
};
```

`SyncHookCodeFactory`继承自`HookCodeFactory`, 并提供`content`方法给父类方法使用.

#### factory.setup
```js
class HookCodeFactory {
	setup(instance, options) {
		instance._x = options.taps.map(t => t.fn);
	}
}
```
`setup`方法, 将`taps`中的回调函数保存在`SyncHook`实例的`_x`

#### factory.create
整体结构如下, 分别对`tap`, `async`, `promise`执行不同的逻辑来生成执行函数.

```js

class HookCodeFactory {
	create(options) {
		this.init(options);
		let fn;
		switch (this.options.type) {
			case "sync":
				fn = new Function(
					this.args(),
					'"use strict";\n' +
						this.header() +
						this.contentWithInterceptors({
							onError: err => `throw ${err};\n`,
							onResult: result => `return ${result};\n`,
							resultReturns: true,
							onDone: () => "",
							rethrowIfPossible: true
						})
				);
				break;
			case "async":
			case "promise":
		}
		this.deinit();
		return fn;
	}

	init(options) {
		this.options = options;
		this._args = options.args.slice();
	}

	deinit() {
		this.options = undefined;
		this._args = undefined;
	}

	contentWithInterceptors(options) {
		if (this.options.interceptors.length > 0) {
			//...
		} else {
			return this.content(options);
		}
	}
}
```

对于`call`, 执行的逻辑如下,
```js
fn = new Function(
	this.args(),
	'"use strict";\n' +
		this.header() +
		this.contentWithInterceptors({ 
			onError: err => `throw ${err};\n`,
			onResult: result => `return ${result};\n`,
			resultReturns: true,
			onDone: () => "",
			rethrowIfPossible: true
		})
);
```

`new Function`函数的形参由`this.args()`得到

比如我们的例子里, `['p1', 'p2']` 需要转化成 `'p1,p2'`, 对于`callAsync`我们还需多注入一个callback的参数, 如果考虑`context`, 这里也需要做处理.

```js
class HookCodeFactory {
	args({ before, after } = {}) {
		let allArgs = this._args;
		if (before) allArgs = [before].concat(allArgs);
		if (after) allArgs = allArgs.concat(after);
		if (allArgs.length === 0) {
			return "";
		} else {
			return allArgs.join(", ");
		}
	}
}
```

> https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function 

函数体由`this.header() + this.content()`得到
```js
class HookCodeFactory {
	header() {
		let code = "";
		if (this.needContext()) {
			code += "var _context = {};\n";
		} else {
			code += "var _context;\n";
		}
		code += "var _x = this._x;\n";
		if (this.options.interceptors.length > 0) {
			//...
		}
		for (let i = 0; i < this.options.interceptors.length; i++) {
			//...
		}
		return code;
	}
}
```

`header`里生成的代码主要是拿到`this._x`, 其包含里待执行的回调函数, 因为最终生成的函数是由`SyncHook`实例调用`call`方法执行的, 所以`this`指向`SyncHook`实例.


`SyncHookCodeFactory`提供了`content`方法的实现
```js
class SyncHookCodeFactory extends HookCodeFactory {
		// { 
		// 	onError: err => `throw ${err};\n`,
		// 	onResult: result => `return ${result};\n`,
		// 	resultReturns: true,
		// 	onDone: () => "",
		// 	rethrowIfPossible: true
		// }
	content({ onError, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}
```

各个子类Hook其`args`, `header`的代码是通用的, 而`content`则由各个子类自己实现.
![2020-07-19-21-55-22](https://image.fangbinwei.cn/FrontEnd/Engineering/webpack/tapable2/2020-07-19-21-55-22_4efb1bd0.png)

