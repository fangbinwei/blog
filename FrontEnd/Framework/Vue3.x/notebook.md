# 看Vue3源码时的意识流

Vue2的时候, 创建vnode, 在代码中都是以render命名, 而patch能根据vnode渲染DOM.这个命名是有点奇怪的. 而Vue3将创建vnode以createVNode命名, 根据vnode渲染DOM的整个过程命名为render, 更加符合直觉.

Vue2中有`_vnode`, `$node`的命名, `_vnode`指组件template对应的vnode, 而$vnode指组件本身(Vue实例)对应的组件vnode, 除了组件vnode, 还有DOM元素对应的vnode.

Vue3一开始在`template`中是会自动对`ref`进行unwrap的, 从而避免手写`.value`, 其实现的方式是将我们`setup`返回的对象使用`reactive`处理, `reactive`之后的对象是可以unwrap的. 但是也存在着一些问题, 如果`setup`返回的是普通对象, 但是Vue内部使用`reactive`对其处理过后, `template`访问到的是Proxy对象, 产生了不一致. 因此Vue3调整了做法, 一个[break change](https://github.com/vuejs/vue-next/pull/1682)