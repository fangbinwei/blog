# patch与响应式

> vue@2.6.11

Vue一大特点就是在响应式数据变化的时候, 页面的DOM会自动跟随随便.

**src/core/instance/lifecycle.js**
```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
new Watcher(vm, updateComponent, noop, {
  before () {
    if (vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'beforeUpdate')
    }
  }
}, true /* isRenderWatcher */)
```

`new Watcher(...)`的执行, 使得当响应式数据(在template中使用到的)变化的时候, 会触发重新执行`updateComponent`, 从而触发patch的过程.

在patch章节有提到, patch有两个应用场景. vnode创建时(根据vnode挂载DOM), 和vnode更新时(根据新旧vnode更新DOM).

## 单组件场景
一个组件维护着一个template, 如果这个template里没有包含别的组件, 那么这个就是一个单组件场景, 足够简单.

比如下面的根组件, 其没有props, 所以其patch不受外部控制; 其template中没有嵌套的组件, 所以其本身也不触发别的组件的更新.

```js
new Vue({
  el: '#app',
  data() {
    return {
      cls: 'test'
    }
  },
  render(h) {
    return h(
      'div',
      {
        class: this.cls
      },
      ['child1']
    )
  }
})
```

当`cls`变化的时候, 会执行`updateComponent`, render出最新的vnode tree, 然后对比新旧vnode tree, 执行patch过程来更新DOM.

这里思考一下, class更新的时候, Vue最终要在DOM中去更改元素的class attribute. 除了class, 与DOM操作相关的还有style, attrs, domProps, on等

每当更新DOM的时候, Vue需要根据新旧vnode去更新DOM, 所以Vue把这一类操作的代码统一抽象出来, 放置在`src/platforms/web/runtime/modules/`

```bash
platforms/web/runtime/modules
├── attrs.js
├── class.js
├── dom-props.js
├── events.js
├── index.js
├── style.js
└── transition.js
```

```js

updateComponent = () => {
  vm._update(vm._render(), hydrating)
}

Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  // ...
  vm._vnode = vnode
  if (!prevVnode) {
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  // ...
}
```


## 嵌套组件场景