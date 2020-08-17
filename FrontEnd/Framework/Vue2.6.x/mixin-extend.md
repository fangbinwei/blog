# Vue.mixin/extend

在项目中, 使用`import Vue from 'vue'`来引入vue的构造函数. 

而`Vue.mixin()`则会不断地修改`Vue.options`从而永久性地影响之后实例化的对象

```js
Vue.mixin = function (mixin: Object) {
  this.options = mergeOptions(this.options, mixin)
  return this
}
```

我们同样可以利用`Vue.extend`创建一个子类, 为它预置一些options, 但是它不会修改`Vue.options`, 因此不会影响父类. 你可以构造你的子类, 限制影响范围.

:::tip
但是`Vue.mixin`会影响到所有`Vue.extend`的子类. 即便你是如下的顺序去创建子类, 最后调用的`Vue.mixin`也会影响到子类. [vue内部有专门的代码判断这种情况](https://github.com/vuejs/vue/blob/5b399612d8323ad0bb8b3f6fa8b2982ab73c0e6e/src/core/instance/init.js#L98-L107)

```js
Vue.mixin(option1)
const Child = Vue.extend(optionChild)
Vue.mixin(option2)
:::

`Vue.mixin`通常只有在你需要全局地影响你项目中所有的Vue实例, 才会用到.

比如一些插件`vue-router`, `vuex`, `vue-router`需要全局性地注入一些生命钩子, 从而保证你所有的组件都能通过`this.$router`来访问到router实例, ect.

## 为什么突然注意到`Vue.mixin`?
// TODO: components的合并规则
