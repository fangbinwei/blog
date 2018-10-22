# node http
## 使用node搭建服务器
---
```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

// event ‘request’
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

// event ‘listening’
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```
![node http demo](_v_images/nodehttpde_1539530232_1360319875.png)


这是node官网的一段示例, 若干行代码搭建了一个http服务器.

代码监听了http.Server实例上的'request'事件, 当有请求发送过来, 触发request事件, 则绑定的函数会执行.

所绑定的函数执行了如下操作: 
1. 设置了响应的状态吗、首部`Conten-Type`.
2. 对所有的请求都返回了相同的内容.

但是实际在使用的时候, 我们可能需要: 
- 对请求进行权限判断
- 对不同的请求路径做不同的响应. (router)
- 对响应主体进行压缩 (gzip)
- 静态资源缓存策略
- ...

可以发现, 其实这些任务其实可以排个序, 中间件就是帮助我们完成这个任务.
## 中间件
---
![middleware](_v_images/middleware_1540233808_732314898.png)

中间件可以把服务端的操作解耦开来. 不同的中间件各司其职, 如上图——使用中间件实现一个逻辑简单的服务器, static cache中间件可以响应静态文件, router中间件可以用来响应API.

### 中间件更具体的作用
- 处理逻辑
- 修改/扩展已有的对象(请求req, 响应res)
- 将控制权交给下一个中间件 next()
- 结束reques-response cycle( 调用res.end()结束请求, 结束请求后, 还调用next() 可能会产生错误, 比如对已经响应的请求 setHeader)

### 举个栗子 如何实现compression中间件?
```js
function compression(req, res, next) {
    let _end = res.end
    let _write = res.write

    res.write = function (chunk, encoding) {
        //对chunk压缩, 使用_write写入压缩后的数据
        _write.call(res, compressedChunk)
    }

    res.end = function (chunk, encoding) {
      // ...
      _end.call(res)
    }
    next()
}
```

(通常压缩的过程可以使用node中的 Transform Stream, 输入数据 -> 对数据处理 -> 输出数据)

这个中间件对已有的res方法进行了包装, 并调用next() 将控制权交给下一个中间件, 后面的中间件都可以使用被compression中间件包装过的res方法.

一个完善的compression中间件应该还包括, 自适应请求的Accept-Encoding首部; 提供一个threshold阈值, 响应主体大于该阈值再进行压缩等功能.

# connect -> express -> koa (3.6.6, 4.x, 2.5.1)
---
## 作者
> TJ Holowaychuk，程序员兼艺术家，Koa、Co、Express、jade、mocha、node-canvas、commander.js等知名开源项目的创建和贡献者

*任何一个做node.js开发的人, 一定都直接或间接引用过他写的库*

## connect
---
> Connect is an extensible HTTP server framework for node using "plugins" known as middleware

connect是express的基础, 它们middleware的实现原理相同. 早期的express是直接引用了connect, 后来将connect集成到express内部.

### connect示例
```js
var connect = require('connect');
var http = require('http');
var compression = require('compression');
var bodyParser = require('body-parser');

var app = connect();

app.use(compression());

app.use(bodyParser.urlencoded({extended: false}));

app.use(function(req, res){
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello from Connect!\n'); // content-length达不到压缩的要求
});

http.createServer(app).listen(3000);
```

不同的功能分别对应各自的中间件.

### connect 中间件执行同步代码
```js
const indentString = require('indent-string')
const connect = require('connect')
const app = connect()

app.use((req, res, next) => {
  console.log(indentString('->1 middleware', 0))
  next()
  console.log(indentString('<-1 middleware after next', 0))
})

app.use('/foo', (req, res, next) => {
  console.log(indentString('->foo middleware', 8))
  res.end('foo')
})

app.listen(3000)

// output
// /foo
->1 middleware
        ->foo middleware
<-1 middleware after next
```

其实坦白说中间件是要实现类似如下的功能---- 函数的嵌套调用
```js
http.createServer(function app (req, res) {
  fn1 (req, res) {
    fn2 (req, res) {
      fn3 (req, res) {}
    }
  }
})
```

#### 同步代码示例图1.0
![connect_sync](_v_images/connect_sy_1539626102_272386920.png)

stack中存放这所use的中间件, 当请求到达时, app函数调用内部的next(), 该next()函数实现如下功能:
1. 读取stack
2. 路径匹配 ? 调用stack[index].handler(req, res, next) : 继续调用next()

#### next()示例图
![](_v_images/1539626134_1719312683.png)

next()函数的作用就是上图虚线所框选部分, 读取stack, 并进行路径匹配, 路径不匹配则继续调用next()函数.

#### 同步代码示例2.0
![connect_sync2](_v_images/connect_sy_1540237857_787709729.png)

### connect中间件执行异步代码
```js
app.use((req, res, next) => {
  console.log('->1 middleware')
  next()
  console.log('<-1 middleware after next')
})

app.use((req, res, next) => {
  setTimeout(() => {
    console.log('->final middleware')
    res.end('hello')
  }, 100)
})
// output
//->1 middleware
//<-1 middleware after next
//        ->final middleware
```
![](_v_images/1540155763_294155741.png)

异步代码执行的顺序, 不同于同步代码.

异步代码和同步代码的执行对于异步操作来说, 需要注意的地方在于如何进行错误处理.

### 错误处理
![](_v_images/1540143921_26349576.png)

connect中, 中间件的执行是被try catch包裹的, 捕捉到err, 就会传给next()函数.

之前有说过, next()函数的作用: 
1. 读取stack
2. 路径匹配 ? 调用stack[index].handler(req, res, next) : 直接调用next()

其实在步骤2的时候, 在路径匹配到中间件之后, 会先判断next()函数是否传入err, 若传入了err, 则判断中间件fn.length === 4, 若不是, 则反复调用next()直到finalHandler来处理err

#### 同步代码错误处理
```js
app.use(function (req, res, next) {
  next(new Error('boom!'));
  // throw new Error(‘boom!’) 
});

app.use(function onerror(err, req, res, next) {
  // an error occurred!
});
```

#### 异步代码错误处理
```js
app.use(function (req, res, next) {
    fs.readFile("/file-does-not-exist", function (err, data) {
        if (err) {
          next(err); 
        }
        else {
          //...
        }
})
```
或者可以用promise包裹, 进行错误处理.

```js
app.use(function (req, res, next) {
    setTimeout(() => {
      throw new Error('test error')
    }
  }, 100)
});
```
上面代码的错误, connect包裹中间件的try catch无法捕捉到
```js
app.use((req, res, next) => {
  setTimeout(() => {
    try {
      throw new Error('test error')
      console.log(indentString('->final middleware', 8))
      res.end('hello')
    } catch (err) {
      next(err)
    }
  }, 100)
})
```
*整体来看, connect的错误处理, 其实并不优雅.*, 需要利用next()函数来传递err.

### 路由嵌套
```js
const connect = require('connect')
const http = require('http')

const router = connect()
const app = connect()

router.use('/child1', (req, res, next) => {
  res.end('<h1>child1</h1>')
})

router.use('/child2', (req, res, next) => {
  res.end('<h1>child2</h1>')
})

app.use('/foo', router)

http.createServer(app).listen(3000)
```
#### 路由嵌套的原理
![](_v_images/1540239367_1948215195.png)

### 代码演示, 解析前端发送的请求, content-type: application/json

### connect 总结
1. 实现了中间件的逻辑处理.
2. 有简单的路由判断, 有'子路由'的功能

可能不够优雅的地方: 
1. 对响应的回复耦合在中间件中.
2. 错误处理还是差点感觉, 同步代码的错误, 可以不管, 由最外层包裹中间件的try catch进行捕捉, 异步代码的错误, 需要传给next(err).

## express 4.x
---
express4.x之前, 直接依赖了connect包, 4.x之后, 将connect集成到了express中.

### express相比connect
- 对node原生req, res进行了包装和扩展, 使用原型链, 乍一看, 还是让人蛮眼花缭乱的.
- 集成了一些常用的中间件. (bodyParser.json, serve-static等)
- 将router的逻辑单独抽出来, 优化了代码结构
- 升级了的路由匹配

采用正则匹配来处理路由路径, 路由路径的结构类似vue-router
```js
app.get('/users/:userId/books/:bookId', function (req, res) {
  res.send(req.params)
})
```

express更像是connect的升级版本, 底层对中间件的处理, 错误的处理, 差别并不大.

## koa
---
### koa示例
```js
const Koa = require('koa');
const app = new Koa();

// response
app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
```
中间件的传参发生了变化, 不再传入`(req,res,next)`, 而是传入`(ctx, next)`

ctx是koa构建的一个上下文对象, ctx.request 是koa包装的request对象, ctx.response包装的response对象

koa没有改动原生的req, res, 而是在其基础上包装了自己的request, response.

ctx.body调用的是ctx.response.body, 对应一个setter方法, 它设置ctx.body属性的同时, 还设置了http响应的状态码status(200)、响应头Content-Type(text/plain)、Content-Length(9).

在所有中间件执行完成后, 若中间件没有响应请求, koa会根据ctx.body的值, 响应请求, 所以响应请求并不一定需要像connect, express那样耦合在中间件中.

### ctx
![](_v_images/1540158338_1654230173.png)

### koa中间件
#### async/await写法
```js
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
```
#### 常规写法
```js
app.use((ctx, next) => {
  const start = Date.now();
  return next().then(() => {
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
});
```
这段代码记录了调用next() 之后, 中间件处理请求所花的时间.

不同于connect, express, koa的next返回的是一个Promise对象.

*正确书写koa中间件, 可以保证代码的执行顺序.*

#### 中间件处理示意图
![koa middleware](_v_images/koamiddlew_1540157879_974579072.png)

koa的中间件处理方式, 和connect的本质区别在于其next()函数, koa的next()函数返回的是promise对象, 只有在该promise为fulfilled的时候, 才会执行`await next()`以后的代码.

> async 函数中可能会有 await 表达式，这会使 async 函数暂停执行，等待表达式中的 Promise 执行完成后才会继续执行 async 函数并返回. 
> await  操作符用于等待一个Promise 对象

### 错误处理
使用aync, await写法, 你可以自己定义一个错误处理中间件, 所有中间件抛出的错误, 让最外层定义的中间件来处理(当然koa其实也自带默认的错误处理函数)
```js
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    throw err;
  }
});
```
connect, 需要把err传给next()函数, 在koa中, 你只要想办法把err throw出去, 让最外层定义的错误处理中间件去处理就可以.

我们只需要让await真正有效——将异步函数包装成一个promise, 这样就能正确throw err

1. 利用Promise((resolve, reject) => {})中的reject
```js
app.use(async (ctx, next) => {
    function asyncFunc(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject('err')
            }, ms)
        })
    }
    await asyncFunc(2000)
    await next()
});
```
2. 利用util.promisify, 处理node式异步函数

```js
app.use(async (ctx, next) => {
  const read = util.promisify(fs.readFile)
  await read('./ccccc.js')
  await next()
})
```
### koa总结
1. 构建了ctx.request/response, 并没有改动原生的node req, res.
2. 异步代码执行顺序可控.
3. 利用async await可以优雅地进行错误处理.
4. 代码精简, 没有路由功能.
5. 在中间件执行完后, 有默认的响应函数, 若中间件中没有响应请求, 响应函数会主要根据ctx.body响应请求. (connect, express都必须在中间件中调用res.end())

## connect express koa 简单对比
| Feature           | Koa | Express | Connect |
|------------------:|-----|---------|---------|
| 中间件 | Promise-based   |   常规操作     | 常规操作       |
| 路由           |    无 |  功能较全       |    极简...     |
| 错误处理        |  async/await 配合 try/catch   |  同connect     |  中规中矩利用next(err)        |
|  集成额外功能     |  无   |  jsonp/ template等      |     无    |


## 参考文献
> https://medium.com/@selvaganesh93/how-node-js-middleware-works-d8e02a936113
> https://juejin.im/post/5ad466d25188253edd4d898a
> https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function
> https://github.com/brunoyang/blog/issues/5
> https://cnodejs.org/topic/5b9a5867ce9d14c2254dfa13