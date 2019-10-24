const Chainable = require('./Chainable')
class ChainedSet extends Chainable {
  constructor(parent) {
    super(parent)
    this.store = new Set()
  }
  add(value) {
    this.store.add(value)
    return this
  }
  delete(value) {
    this.store.delete(value)
    return this
  }
  values() {
    return [...this.store]
  }
  has(value) {
    return this.store.has(value)
  }
  clear() {
    this.store.clear()
    return this
  }
}
module.exports = ChainedSet
