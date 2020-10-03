# Reflect.set(), 翻看ECMA2020

> 当下理解有限, 难免有误

> Reflect.set()和Reflect.defineProperty

本文为了解释如下现象,

在`Reflect.set`配合`Proxy`使用的时候, 会有这样一个现象.

```js
let p = {
  a: 'a'
};

let handler = {
  set(target, key, value, receiver) {
    console.log('set');
    // receiver 指向obj
    Reflect.set(target, key, value, receiver)
  },
  defineProperty(target, key, attribute) {
    console.log('defineProperty');
    // 内部调用[[DefineOwnProperty]]
    Reflect.defineProperty(target, key, attribute);
  }
};

let obj = new Proxy(p, handler);
obj.a = 'A';
// set
// defineProperty
```

默认`Reflect.set`的receiver是指向target的, 但是当指向Proxy对象的时候, 会触发Proxy对象的defineProperty.

既然`Reflect.set`内部调用了对象的内部方法`[[Set]]`, 那么可以猜测, 上面的情况中`[[Set]]`调用了receiver的内部方法`[[DefineOwnProperty]]`, 从而被Proxy截获.

## Reflect.set()

[关于`Reflect`的一些基础知识](https://es6.ruanyifeng.com/#docs/reflect)

[`Reflect.set()`](https://tc39.es/ecma262/#sec-reflect.set)用于对象的属性[赋值](https://tc39.es/ecma262/#sec-assignment-operators-runtime-semantics-evaluation), 其会调用对象的内部方法`[[Set]]`, 需要注意要将其和[`Accessor Property`的`[[Set]]`](https://tc39.es/ecma262/#table-accessor-property-attributes)区分.

![2020-10-03-02-01-30](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-03-02-01-30_71cc16ab.png)


## `[[Put]]`, `[[Set]]`
规范中关于对象属性赋值的内容随着版本变化也有所不同, 在ES5中, 对象的属性赋值是调用对象的内部方法[`[[Put]]`](https://www.ecma-international.org/ecma-262/5.1/#sec-8.12.5), 但是在我当下最新的ES2020中, 已经使用内部方法`[[Set]]`, 主要是文字描述上的区别.

ES5:

[`PutValue`](https://www.ecma-international.org/ecma-262/5.1/#sec-8.7.2) -> `[[Put]]`

ES2020:

[`PutValue`](https://tc39.es/ecma262/#sec-putvalue) -> `[[Set]]`

下面看下具体ES2020中的内容,

![2020-10-01-21-47-25](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-01-21-47-25_056671e6.png)

![2020-10-01-21-43-38](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-01-21-43-38_9136dc11.png)

```js
let p = {
  a: 'a'
};
// 步骤6.b
p.a = 'A'
```

对于上述例子, base为`p`, 最终调用`p`对象的内部`[[Set]]`方法, `p.[[Set]]('a', 'A', p)`, 可见默认`[[Set]]`函数的receiver是this, 即这里的`p`.

上述例子如果使用`Reflect.set`, 代码如下

```js
let p = {
  a: 'a'
};
Reflect.set(p, 'a', 'A')
//或者
//Reflect.set(p, 'a', 'A', p)
```

那么再看一个例子
```js
let p = {
  a: 'a'
};

let obj = {}
Reflect.set(p, 'a', 'A', obj)
console.log(p.a) // 'a'
console.log(obj.a) // 'A'
```

可以发现, 赋值操作在receiver上生效了, 并没有改变target. 查看ECMA2020中`[[Set]]`的相关流程可以知道, `[[Set]]`最后是作用在receiver上的, 而target只是用于获取属性描述符. 只不过通常target和receiver是同一个对象, 而`Reflect.set`可以指定receiver.

> https://stackoverflow.com/questions/47992070/reflect-set-not-working-as-intended

## `[[Set]]`具体流程

`[[Set]]` -> `OrdinarySet` -> `OrdinarySetWithOwnDescriptor`

```js
let p = {
  a: 'a'
};

let obj = {}
Reflect.set(p, 'a', 'A', obj)
console.log(p.a) // 'a'
console.log(obj.a) // 'A'
```
![2020-10-03-18-38-44](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-03-18-38-44_24b95058.png)

我们的例子中, 首先利用内部方法`[[GetOwnProperty]]`通过`p`, 获取`'a'`属性的属性描述符ownDesc.


`Object.getOwnPropertyDescriptor`就是调用内部方法`[[GetOwnProperty]]`
```js
Object.getOwnPropertyDescriptor(p, 'a')
// {value: "a", writable: true, enumerable: true, configurable: true}
```
在获取到属性描述符之后, 调用`OrdinarySetWithOwnDescriptor`

![2020-10-03-18-54-33](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-03-18-54-33_0baff27b.png)

![2020-10-03-19-02-53](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-03-19-02-53_a5d16d5c.png)



由于`p.a`定义的是数据描述符, 而`obj`本身没有定义`'a'`, 所以最后执行`CreateDataProperty(Receiver, P, V)`, 这也就解释了, 上述例子的现象.

:::tip
数据描述符对应Data Property, 访问/存取描述符对应Accessor Property
:::

根据上述`OrdinarySetWithOwnDescriptor`的执行步骤, 不难看出, 下面的代码, 会使得`Reflect.set`返回`false`

```js
let p = {}
Object.defineProperty(p, 'a', {writable:false, value: 'a'})
let obj = {}
Reflect.set(p, 'a', 'A', obj)
```

```js
let p = {
  a: 'a'
}
let obj = {}
Object.defineProperty(obj, 'a', {writable:false, value: 'a'})
Reflect.set(p, 'a', 'A', obj)
```

了解了receiver在`[[Set]]`中的作用后, 就可以解释, 文章开始所描述的场景.

```js
let p = {
  a: 'a'
};

let handler = {
  set(target, key, value, receiver) {
    console.log('set');
    // receiver 指向obj
    Reflect.set(target, key, value, receiver)
  },
  defineProperty(target, key, attribute) {
    console.log('defineProperty');
    // 内部调用[[DefineOwnProperty]]
    Reflect.defineProperty(target, key, attribute);
  }
};

let obj = new Proxy(p, handler);
obj.a = 'A';
// set
// defineProperty
```

和之前提到的例子类似的, `Reflect.set`会通过`CreateDataProperty(Receiver, P, V)`, 从而执行`Receiver.[[DefineOwnProperty]](P, newDesc)`,  被Proxy对象`obj`的`defineProperty` trap拦截到.

仔细回味一下, 我认为这是预期行为, 既然通过Proxy去赋值'a'属性, 而赋值操作内部调用`[[DefineOwnProperty]]`, 也就该触发Proxy对应的trap, 毕竟我们是通过Proxy去赋值的.

## `[[Set]]`和原型链

通过观察`OrdinarySetWithOwnDescriptor`的执行步骤, 可以发现有查找原型链的步骤. 这让我想到[<<你不知道的Javascript 上卷>>](https://github.com/getify/You-Dont-Know-JS/blob/1ed-zh-CN/this%20%26%20object%20prototypes/ch5.md#%E8%AE%BE%E7%BD%AE%E4%B8%8E%E9%81%AE%E8%94%BD%E5%B1%9E%E6%80%A7)中关于属性屏蔽的描述.

![2020-10-03-19-44-21](https://image.fangbinwei.cn/FrontEnd/Javascript/ECMA/reflect_set/2020-10-03-19-44-21_39763eee.png)

上面的3种情况其实就是`OrdinarySetWithOwnDescriptor`中的各种场景判断



## 参考

> https://tc39.es/ecma262/

> https://www.ecma-international.org/ecma-262/5.1/

> https://stackoverflow.com/questions/47992070/reflect-set-not-working-as-intended

> https://github.com/getify/You-Dont-Know-JS

> https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

> https://es6.ruanyifeng.com/#docs/reflect

> https://www.zhihu.com/question/267483784