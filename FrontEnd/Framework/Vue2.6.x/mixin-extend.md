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

我们使用`Vue.ues`来注册插件, 配合`Vue.component`可以全局注册组件, `Vue.component`实际上是在Vue的构造函数上添加这些组件(`vm.constructor.options.components`), 从而使得后续实例化的Vue实例, 全都能从`vm.$options`上拿到这些组件(通过将`vm.$options`指向`vm.constructor.options`)

**vue/src/core/instance/init.js**
```js
  const opts = vm.$options = Object.create(vm.constructor.options)
```

但是在一次业务开发中, 我发现`vm.constructor.options.components`的结构并不是很直观, 原型链有很多冗余

```js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

Vue.component('globalComponentExample', {
  data () {
    return {
    }
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

console.log(Vue.options)
```
对应的`Vue.options`如下

![截屏2020-09-13 下午9.08.23](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/mixin-extend/%E6%88%AA%E5%B1%8F2020-09-13%20%E4%B8%8B%E5%8D%889.08.23_e5ff387a.png)

如果代码改成这样
```js

Vue.config.productionTip = false

Vue.mixin({})
Vue.mixin({})

Vue.component('globalComponentExample', {
  data () {
    return {
    }
  }
})
```

`components`的原型链会变成这样
![2020-09-13-21-40-12](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/mixin-extend/2020-09-13-21-40-12_6e011c8e.png)


这个问题的根本是涉及了`Vue.mixin` 的`components`的合并策略

```js
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
```
`Vue.mixin`时, 会先针对`Vue.options`上已有的属性进行一次合并

**mergeOptions**
```js{1,2,3}
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
```
`Vue.options`上默认肯定是有`components`属性的, 所以我们使用`Vue.mixin`的时候, 肯定会执行一次`mergeField('components')`, 而`components`的合并策略由下面的代码决定. 所以每调用一次`Vue.mixin`, `components`的原型链长度就会+1.

对`components`的这种合并策略, 持保持态度, 没什么大问题

```js{7}
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})
```

实际上, 很多地方都会有`Vue.mixin`的调用, 比如vue router, vuex, vue devtool, 所以有时候`Vue.options.components`会呈现一种原型链冗长的状态.