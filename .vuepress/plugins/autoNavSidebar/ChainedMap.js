const Chainable = require('./Chainable')
class ChainedMap extends Chainable {
  constructor(parent) {
    super(parent)
    this.store = new Map()
  }
  has(key) {
    return this.store.has(key)
  }
  set(key, value) {
    this.store.set(key, value)
    return this
  }
  get(key) {
    return this.store.get(key)
  }
  order() {
    const entries = [...this.store].reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})
    const order = Object.keys(entries)
    return { entries, order }
  }
  entries() {
    const { entries, order } = this.order()
    if (order.length) {
      return entries
    }
    return
  }
  values() {
    const { entries, order } = this.order()
    return order.map(key => entries[key])
  }

  getOrCompute(key, fn) {
    if (!this.has(key)) {
      this.set(key, fn())
    }
    return this.get(key)
  }
  extend(methods) {
    this.shorthands = methods
    methods.forEach(method => {
      this[method] = value => this.set(method, value)
    })
    return this
  }

  clean(obj) {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key]

      if (value === undefined) {
        return acc
      }

      if (Array.isArray(value) && !value.length) {
        return acc
      }

      if (
        Object.prototype.toString.call(value) === '[object Object]' &&
        !Object.keys(value).length
      ) {
        return acc
      }

      acc[key] = value

      return acc
    }, {})
  }
}

module.exports = ChainedMap
