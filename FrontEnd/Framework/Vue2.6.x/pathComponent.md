# 组件化与patch

## 组件化
先来说说, 假如Vue中没有组件这个概念, 那用Vue实现一个页面, 将会是怎么样的

```js
new Vue({
  el: '#app',
  data () {
    return {
      count: 0
    }
  },
  template: `
    <div>
      <header>
        title
      </header>
      <main>
        <div>
          <div>
            {{count}}
          </div>
          <button type="button" @click="count++">+</button>
          <button type="button" @click="count--">-</button>
        </div>
      </main>
      <footer>
        copyright
      </footer>
    </div>
    `
})
```

Vue可以像一些模板引擎一样, 渲染template(也可以使用编程方式的render函数), 但是Vue的数据是响应式的, 当数据变化, 会触发模板重新渲染.

想象一下, 如果我们要用这种方式去写一个复杂的页面, 那Vue的template/render, data等将会非常复杂. Vue的组件化可以解决这个问题, 此外还可以达到组件复用的作用.

我们知道Vue实例可以维护模板和响应式数据. 既然组件化的一个目的是将模板拆分, 那么可以猜测, 拆分出来的模板都可以通过一个个Vue实例来维护? Vue正是这么做的, 一个个组件就是一个个Vue实例.

上面的例子, 我们可以将`<main></main>`内部的内容分离成组件

```js
const ButtonCount = {
  name: 'ButtonCount',
  data () {
    return {
      count: 0
    }
  },
  render(h) {
    return h('div',{}, [
      h('div', {}, [this.count]),
      h('button', {attr: {type: 'button'}, on: {click: ()=> this.count++}}, ['+']),
      h('button', {attr: {type: 'button'}, on: {click: ()=> this.count--}}, ['-']),
    ])
  }
}

new Vue({
  el: '#app',
  data () {
    return {
      count: 0
    }
  },
  components: {
    ButtonCount
  },
  render (h) {
    return h('div', {}, [
      h('header',{}, ['title']),
      h('main',{}, [h('button-count')]),
      h('footer',{}, ['copyright'])
    ])
  }
})
```

这里我们定义了`components`属性, 或者也可以使用`Vue.component`, 因为我们在render函数中通过传递tag `button-count`指代组件, Vue在render的时候会在`vm.$options.components`(包括原型链)中去寻找组件(可以参考[render部分](/FrontEnd/Framework/vue2.6.x/vueRender.html#createelement-2)). 而定义`components`, 或使用`Vue.component`,本质上是在往`vm.$options.components`中去注入组件. 因此在`.vue`文件中使用`template`的时候, 我们通常需要使用`components`属性来注册下组件.

当然也可以不需要手动注册组件, 直接利用作用域, 但是这种方式只能配合render函数使用

```js
const ButtonCount = {
  //...
}

new Vue({
  el: '#app',
  data () {
    return {
      count: 0
    }
  },
  render (h) {
    return h('div', {}, [
      h('header',{}, ['title']),
      h('main',{}, [h(ButtonCount)]),
      h('footer',{}, ['copyright'])
    ])
  }
})
```

## 组件化之后, 什么发生了变化?
我们拿上面的例子来说, 组件化之后, 首当其冲, render函数得到的vNode tree变了. 如果没有组件化, 我们只需要创建DOM元素对应的vNode, 组件化之后, 我们就需要创建组件对应的vNode, 参考[render章节](/FrontEnd/Framework/vue2.6.x/vueRender.html#createcomponent)

## 组件化与patch
没有组件化的时候, 我们patch的过程会创建所有DOM元素, 并将vm.$el插入到DOM中. 组件化之后, 何时去创建组件对应的DOM元素呢? 

**case study**

我们分析一个例子, 来了解组件化之后, patch的过程,

```js
const Child1 = {
  name: 'Child1',
  render(h) {
    return h('div', null, 'child1')
  }
}
new Vue({
  el: "#app",
  render (h) {
    return h('main',{class: 'main-class'}, [
      'main-text',
      h(Child1, {ref: 'child1'})
    ])
  }
})
```

```html
<div id="app"></div>
```

前面的过程和非组件化的过程一致, 不同的是patch过程. 

首先通过render得到vNode tree

这个例子中我们render得到到的tree 如下:

![componentRender](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/patchComponent/componentRender.svg)

然后就需要根据这个vNode tree, 通过patch得到真实的DOM元素.

### 根组件patch

```js{8,39}
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []

    if (isUndef(oldVnode)) {
      //...
    } else {
      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR)
            hydrating = true
          }
          if (isTrue(hydrating)) {
            //...
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode)
        }

        // replacing existing element
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          //,,,
        }

        // destroy old node
        if (isDef(parentElm)) {
          removeVnodes(parentElm, [oldVnode], 0, 0)
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode)
        }
      }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
}
```
上面的代码在[patch章节](/FrontEnd/Framework/vue2.6.x/patch.html#case-study-传入el参数的情况)分析过

关键代码在`createElm`, 根据vnode创建DOM元素

```js

    const insertedVnodeQueue = []
    // ...
    createElm(
      vnode,
      insertedVnodeQueue,
      // extremely rare edge case: do not insert if old element is in a
      // leaving transition. Only happens when combining transition +
      // keep-alive + HOCs. (#4590)
      oldElm._leaveCb ? null : parentElm,
      nodeOps.nextSibling(oldElm)
    )
// createElm
  function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {}
```

在我们的例子里, `vnode`为render得到的vNode tree, `insertedVnodeQueue`为空数组, `parentElm`为body, `refElm`只是用于往DOM中insert时的参照物.

### createElm
```js
  function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      vnode = ownerArray[index] = cloneVNode(vnode)
    }

    vnode.isRootInsert = !nested // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    if (isDef(tag)) {
      if (process.env.NODE_ENV !== 'production') {
        //...
      }

      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode)
      setScope(vnode)

      /* istanbul ignore if */
      if (__WEEX__) {
        // ...
      } else {
        createChildren(vnode, children, insertedVnodeQueue)
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue)
        }
        insert(parentElm, vnode.elm, refElm)
      }

      if (process.env.NODE_ENV !== 'production' && data && data.pre) {
        creatingElmInVPre--
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    }
  }
```

对于DOM元素对应的vnode, `createElm`执行的就是创建DOM元素的逻辑,

```js
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }
```
如果vnode对应着组件, 则`createComponent`则返回`true`, 直接`return`

对于我们的例子, 会先创建`<main></main>`, 然后调用`createChildren`来遍历子vnode, 并递归调用`createElm`, 创建子vnode对应的DOM元素, 并插入到父vnode的`vnode.elm`

### createChildren

```js
  function createChildren (vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(children)
      }
      for (let i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i)
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
    }
  }
```

createChildren中调用createElm时, refElm传递的总是null

### createComponent
在我们的例子中, `Child1`是组件vnode, `createElm`中会执行`createComponent`, 并返回`true`

```js
  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    let i = vnode.data
    if (isDef(i)) {
      const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */)
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue)
        insert(parentElm, vnode.elm, refElm)
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
        }
        return true
      }
    }
  }
```
要判断一个组件是否是组件vnode, 关键判断其是否有`vnode.componentInstance`, 创建组件的vnode时, 会为其[注入hooks](/FrontEnd/Framework/vue2.6.x/vueRender.html#createcomponent), 这其中就有`init`, `vnode.componentInstance`就是和`init` hook 相关. 

### init hook

```js
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },
  //...
}
```

由于我们这不涉及`keep-alive`, 在这个init钩子中, 主要实例化组件, 并进行挂载(empty mount), 实例化后的对象将赋值给`vnode.componentInstance`

:::tip
挂载涉及`$mount`, 但是如果是子组件的话, 不会在这里执行mounted钩子, 因为对于子组件来说, 其`$vnode`不为`null`, 这是在render的过程中决定的

**src/core/instance/lifecycle.js**
```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```
:::

#### createComponentInstanceForVnode

```js
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  // check inline-template render functions
  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  return new vnode.componentOptions.Ctor(options)
}
```
inlineTemplate涉及Vue的[内联模板](https://vuejs.org/v2/guide/components-edge-cases.html#Inline-Templates), 这里可以忽略

`vnode.componentOptions.Ctor`是在render阶段就决定了的, 其来自于`Vue.extend`, 所以接下去要实例化子组件.

```js
new vnode.componentOptions.Ctor({
    _isComponent: true,
    _parentVnode: vnode,
    parent
  })
```
这里的`_parentVnode`就是Child1 vnode, 我通常称其为子组件在父组件中的placeholder

![componentRender](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/patchComponent/componentRender2.svg)

而parent则是`activeInstance`
```js
    const child = vnode.componentInstance = createComponentInstanceForVnode(
      vnode,
      activeInstance
    )
```

**src/core/instance/lifecycle.js**
```js
export let activeInstance: any = null
export let isUpdatingChildComponent: boolean = false

export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}

export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    //...
    const restoreActiveInstance = setActiveInstance(vm)

    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    //...
  }
}
```

`activeInstance`是在`Vue.prototype._update`进行赋值的, 也就是在patch之前, 会将`activeInstance`赋值为正在执行`_update`, 即将patch的实例. 并在patch完后, 将其赋值回前一个值

在我们的例子中, 显然我们当前正在patch的是根组件,

```js
new vnode.componentOptions.Ctor({
    _isComponent: true,
    _parentVnode: vnode,
    parent
  })
```
因此parent就是根组件的Vue实例

接下里就要实例化子组件, 下面看一些子组件实例化要执行的关键代码

**src/core/instance/init.js**
```js{12,39}
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    //...
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    // ...

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```
和实例化根组件还是有一些区别的, 首先子组件和根组件对`vm.$options`的处理不同, 然后子组件由于没有指定`el`参数, 因此不会自动挂载.

##### initInternalComponent
```js
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  // 内联模板相关, 忽略
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}
```

`initInternalComponent`主要是对`vm.$options`进行处理, 

`vm.constructor.options`是合并了 Vue构造函数的options和子组件options的结果. 其合并过程在`Vue.extend`中

```js{10}
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    //...

    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    //...
    return Sub
  }
```

:::tip
Vue构造函数的options在`initGlobalAPI(Vue)`中注入, 并受`Vue.mixin()`影响

子组件的options则是我们传入的
:::

回到`initInternalComponent`
```js

const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

```

首先使用原型链构造`vm.$options`, 并设置相关属性

`vm.$options.parent`为`activeInstance`, 即当前正在执行`_update`的实例, 我们的例子中是根组件的Vue实例,

`vm.$options._parentVnode`是子组件在父组件中的placeholder, placeholder中有很多信息, 比如props, 监听的事件, 与slot相关的children(这些信息在render 组件对应vnode时, 保存在`componentOptions`)

因此接下来的代码都是将这些placeholder上的信息, 保存在子组件实例的`vm.$options`上
```js

  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag
```

#### child.$mount
```js{5}
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
```

在实例化完子组件之后, 就需要对子组件进行挂载(empty mount), 也就是执行其render和patch的逻辑

首先我们关注一下子组件的render过程

```js
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render, _parentVnode } = vm.$options
    // ...


    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // There's no need to maintain a stack becaues all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      //...
    } finally {
      currentRenderingInstance = null
    }
    // ...
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
```
在`_render`中, `_parentVnode`是子组件在父组件中的placeholder node, **`vm.$vnode`和`vnode.parent`都指向了该placeholder**, 因此子组件的`vm.$vnode`一定是有值的, 并指向其placeholder, 而根组件的`vm.$vnode`为`undefined`

render之后, 执行patch逻辑
**src/core/instance/lifecycle.js**
```js
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
```
```js{13}
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {
      // ...
      } else {
        // ...
      }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
}
```

`vm.$el`为`undefined`, 又回到了开头提到的`patch`函数, 不过这次`oldVnode`为`undefined`, 因此代码执行的是子组件的empty mount


```js
  function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    // ...

    vnode.isRootInsert = !nested // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    if (isDef(tag)) {
      if (process.env.NODE_ENV !== 'production') {
        //...
      }

      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode)
      setScope(vnode)

      /* istanbul ignore if */
      if (__WEEX__) {
        // ...
      } else {
        createChildren(vnode, children, insertedVnodeQueue)
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue)
        }
        insert(parentElm, vnode.elm, refElm)
      }

    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    }
  }
```
与根组件不同, 子组件empty mount调用`createElm`并没有传`parentElm`, 根组件patch的时候`parentElm`是body, 是将DOM元素插入到DOM中

```js
  function insert (parent, elm, ref) {
    if (isDef(parent)) {
      if (isDef(ref)) {
        if (nodeOps.parentNode(ref) === parent) {
          nodeOps.insertBefore(parent, elm, ref)
        }
      } else {
        nodeOps.appendChild(parent, elm)
      }
    }
  }
```

由于子组件并没有传`parentElm`, 因此其`createElm`中, `insert`并不会做任何操作, 子组件只会创建DOM元素, 并赋值给vnode.elm, 最终赋值给子组件的`vm.$el`



```js
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    let i = vnode.data
    if (isDef(i)) {
      const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */)
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue)
        insert(parentElm, vnode.elm, refElm)
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
        }
        return true
      }
    }
  }
```

这样, 子组件patch的过程就算完成了. 子组件上面所有执行代码的源头都是`createComponent`中的`init` hook, `init` hook中实例化了子组件并赋值给`vnode.componentInstance`, 并执行empty mount, 从而得到子组件vNode tree对应的DOM元素`vm.$el`

### initComponent

```js
initComponent(vnode, insertedVnodeQueue)
```

在init hook执行完之后, 

```js
  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
      setScope(vnode)
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode)
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode)
    }
  }
```
`isPatchable`在这里的作用可以参考[附录](#initcomponent中为什么要用ispatchable来判断)

`pendingInsert`的作用暂且不谈, 我们的例子中, 其为空数组, 因此`insertedVnodeQueue`并没有变化, 还是空数组

 `initComponent`另一个很重要的作用, 是将子组件patch得到的`vm.$el`赋值给`vnode.elm`(vnode是子组件在父组件中的placeholder). 这样, placeholder vnode也拿到了子组件vnode tree对应的DOM元素.

TODO: setScope

我们的例子中, 会执行`invokeCreateHooks`, 其作用在[patch章节](/FrontEnd/Framework/vue2.6.x/patch.html#createelm)有提及. 我们的例子中, 往根组件注入`$refs.child1`就是在其中执行.

```js
new Vue({
  el: "#app",
  render (h) {
    return h('main',{class: 'main-class'}, [
      'main-text',
      h(Child1, {ref: 'child1'})
    ])
  }
})
```

组件对应的vnode(placeholder vnode)其在执行`invokeCreateHooks`时, 相比DOM对应的vnode, 其会额外执行一些逻辑

```js{8}
  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (let i = 0; i < cbs.create.length; ++i) {
      cbs.create[i](emptyNode, vnode)
    }
    i = vnode.data.hook // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) i.create(emptyNode, vnode)
      if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
    }
  }
```
这样, 我们的例子中, `insertedVnodeQueue`首次push了一个vnode(Child1 vnode)

### insert
```js
if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue)
        insert(parentElm, vnode.elm, refElm)
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
        }
        return true
      }
```
`initComponent`中, 组件的placeholder `vnode.elm`被赋值为`vm.$el`

我们就可以将其insert到parentElm(`<main></main>`)中, 到这里`createComponent`的逻辑都结束了.

从结果上来看, 当我们patch下面这个vnode tree

![componentRender](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/patchComponent/componentRender.svg)

其流程如下, 

1. createElm `<main></main>`
2. createChildren
    1. createElm `main-text` -> insert to `<main></main>`
    2. createElm -> createComponent `<div>child1</div>`-> insert to `<main></main>`
        1. createElm `<div></div>`
        2. createChildren -> createElm `child1` -> insert to `<div></div>`
4. insert to `<body></body>`

5. remove `#app`

显然这是一个深度优先遍历, 如果子组件中还有子组件, 会不断递归`createElm`,`createComponent`

### invokeInsertHook

在根组件执行完上面的流程后, `patch`函数中, 还有最后一个逻辑需要执行

```js
invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)

function invokeInsertHook (vnode, queue, initial) {
  // delay insert hooks for component root nodes, invoke them after the
  // element is really inserted
  if (isTrue(initial) && isDef(vnode.parent)) {
    vnode.parent.data.pendingInsert = queue
  } else {
    for (let i = 0; i < queue.length; ++i) {
      queue[i].data.hook.insert(queue[i])
    }
  }
}
```

根据我们上面的分析, 我们的例子中, `insertedVnodeQueue`中只有一个vnode, 就是子组件Child1在父组件(根组件)中的placeholder, 即Child1 vnode

```js{8,11,13}

  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {
      //...
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
```

对于根组件(指定了`el`属性)来说, 其`isInitialPatch`为`false`, 子组件其`isInitialPatch`为`true`

因此根组件的`invokeInsertHook`主要是执行`insertedVnodeQueue`中vnode的insert hook

例子中, 是执行Child1的insert hook
```js
const componentVNodeHooks = {

  insert (vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance)
      } else {
        activateChildComponent(componentInstance, true /* direct */)
      }
    }
  },
}
```

不考虑`keep-alive`, 首次挂载, 执行Child1的`mounted` hook

Vue通过这种方式, 很好地协调了根组件和子组件/子子...组件的`mounted` hook执行的顺序

### 根组件patch之后

**src/core/instance/lifecycle.js**
```js{35}
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  //...
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
  //...
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

根组件patch结束之后, DOM元素已经插入到DOM中, 执行根组件的`mounted`钩子

[之前有说明](#child-mount), 只有根组件的`vm.$vnode`为`undefined`

### chart

#### patch flowchart
![componentRender](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/patchComponent/patchComponent.svg)

#### vnode,vm relation
![componentRenderRelation](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/patchComponent/patchComponentRelation.svg)


### insertedVnodeQueue
```js{5}
  function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue
    } else {
      for (let i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i])
      }
    }
  }
```

```js
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
```

前提1: 子组件在patch逻辑的最后, 会通过`invokeInsertHook`将`insertedVnodeQueue`赋值给其placeholder node(`data.pendingInsert`),

前提2: 根组件会在patch逻辑的最后, 通过`invokeInsertHook`, 调用`insertedVnodeQueue`中vnode的insert hook

用分治归并的思想来理解, 根组件的`insertedVnodeQueue`来源于嵌套的子组件的`insertedVnodeQueue`,  其嵌套子组件的`insertedVnodeQueue`来源于其嵌套子组件的`insertedVnodeQueue`, 递归的终点是一个不嵌套子组件的组件, 其`insertedVnodeQueue`为空数组. 结合[下面例子的图](#insertedvnodequeue-chart)来理解这个过程

递归式:

1. (当组件不嵌套组件) `insertedVnodeQueue`是空数组 

2. (当组件嵌套组件) `insertedVnodeQueue`为非空数组, 数组中的vnode来源有两个地方, 来源1是嵌套组件的placeholder node的`data.pendingInsert`(前提1), 来源2是placeholder node本身


递归式2的来源1:
```js{3}
  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
      setScope(vnode)
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode)
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode)
    }
  }
```

递归式2的来源2:

```js{8,24}
  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
      setScope(vnode)
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode)
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode)
    }
  }
  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (let i = 0; i < cbs.create.length; ++i) {
      cbs.create[i](emptyNode, vnode) }
    i = vnode.data.hook // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) i.create(emptyNode, vnode)
      if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
    }
  }
```


根组件执行所收集的组件vnode的insert hook
```js
const componentVNodeHooks = {
  insert (vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    if (vnode.data.keepAlive) {
      //...
    }
  },
}
```

最后根组件执行自己的mounted hook

看下面的例子

```js
const Child1_1 = {
  name: 'Child1',
  render(h) {
    return h('div', null, '--child1_1')
  },
  mounted() {
    console.log('mounted child1_1')
  }
}
const Child1_2 = {
  name: 'Child1',
  render(h) {
    return h('div', null, '--child1_2')
  },
  mounted() {
    console.log('mounted child1_2')
  }
}

const Child1 = {
  name: 'Child2',
  render(h) {
    return h('div', null, ['-child1', h(Child1_1), h(Child1_2)])
  },
  mounted() {
    console.log('mounted child1')
  }
}

new Vue({
  el: "#app",
  render (h) {
      return h('div',{class: 'root'}, [
        'root',
        h(Child1)
      ])
  },
  mounted () {
    console.log('root mounted')
  }
})
```

**console output**
```
// root created
// created child1
// created child1_1
// created child1_2
mounted child1_1
mounted child1_2
mounted child1
root mounted
```

#### insertedVnodeQueue chart

结合下面的图, 来理解上面的过程, patch根组件的过程中, 会实例化子组件, patch子组件, 这个过程中收集insertedVnodeQueue, 从而组织mounted钩子的调用顺序

![insertedVnodeQueue](https://image.fangbinwei.cn/FrontEnd/Framework/Vue2.6.x/patchComponent/insertedVnodeQueue.svg)

## 附录

### Vue组件为什么只能有一个根节点?
文章开头的例子是这样的

```js
new Vue({
  el: '#app',
  data () {
    return {
      count: 0
    }
  },
  template: `
    <div>
      <header>
        title
      </header>
      <main>
        <div>
          <div>
            {{count}}
          </div>
          <button type="button" @click="count++">+</button>
          <button type="button" @click="count--">-</button>
        </div>
      </main>
      <footer>
        copyright
      </footer>
    </div>
    `
})
```
后面, 我们把`<main></main>`中的内容抽离成了组件, 这个例子里, main中的内容被div包裹了, 

但是我们没办法将组件template写成如下的形式,

```vue
<template>
  <div>
    {{count}}
  </div>
  <button type="button" @click="count++">+</button>
  <button type="button" @click="count--">-</button>
<template>
```

其[本质原因](https://github.com/vuejs/vue/issues/7088#issuecomment-357899727)是, Vue在数据变化后, 重新渲染视图的时候, 需要比对新老的virtual dom, 而目前的对比算法, 必须要求组件模板只有一个根节点

TODO: re-patch


### isPatchable
```js
  function isPatchable (vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode
    }
    return isDef(vnode.tag)
  }
```
对于DOM元素对应的vnode, 其判断tag是否有定义, 这样可以跳过comment vnode, text vnode

对于子组件对应的vnode, 由于vnode只是其在父组件的placeholder, 实例在`vnode.componentInstance`上, 子组件的根节点就是`vnode.componentInstance._vnode`, `isPatchable`就是判断该节点的tag

### initComponent中为什么要用isPatchable来判断?
```js

  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
      setScope(vnode)
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode)
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode)
    }
  }
```

参考该[commit](https://github.com/vuejs/vue/commit/efb603570e271b9627c735c0ab2b3b11e292f151)

```js
const vm = new Vue({
      template: `
        <div>
          <test class="test"></test>
        </div>
      `,
      components: {
        test: {
          data () {
            return { ok: false }
          },
          template: '<div v-if="ok" id="ok" class="inner">test</div>'
        }
      }
    }).$mount()
```
因为子组件可能是不满足isPatchable的, 此时没必要执行`invokeCreateHooks`的全部逻辑,
比如class的create hook, 会将placeholder vnode中的 `class="test"`补充到子组件的class中, 如果`this.ok`为false, 子组件是一个comment node, 这个添加class的操作就是不必要的.

```js
  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
      setScope(vnode)
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode)
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode)
    }
  }


 ```
