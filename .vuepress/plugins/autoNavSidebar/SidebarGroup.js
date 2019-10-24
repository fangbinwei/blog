const ChainedMap = require('./ChainedMap')
const ChainedSet = require('./ChainedSet')
class SidebarGroup extends ChainedMap {
  constructor(parent, name) {
    super(parent)
    this.name = name

    this.children = new ChainedSet(this)

    this.extend(['title', 'sidebarDepth', 'collapsable'])
  }
  toConfig() {
    const config = this.clean(
      Object.assign(this.entries() || {}, {
        children: this.children.values()
      })
    )
    return config
  }
}

module.exports = SidebarGroup
