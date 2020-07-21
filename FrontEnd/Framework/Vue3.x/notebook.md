# 看Vue3源码时的意识流

Vue2的时候, 创建vnode, 在代码中都是以render命名, 而patch能根据vnode渲染DOM.这个命名是有点奇怪的. 而Vue3将创建vnode以createVNode命名, 根据vnode渲染DOM的整个过程命名为render, 更加符合直觉.

Vue2中有_vnode, $node的命名, _vnode指组件template对应的vnode, 而$vnode指组件本身(Vue实例)对应的组件vnode, 除了组件vnode, 还有DOM元素对应的vnode.