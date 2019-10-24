const ChainedMap = require('./ChainedMap')
const SidebarGroup = require('./SidebarGroup')

class Sidebar extends ChainedMap {
  constructor(parent, link) {
    super(parent)
    this.link = link
    this.sidebarGroups = new ChainedMap()
  }
  sidebarGroup(name) {
    return this.sidebarGroups.getOrCompute(
      name,
      () => new SidebarGroup(this, name)
    )
  }
  toConfig() {
    const config = this.sidebarGroups
      .values()
      .map(sidebarGroup => sidebarGroup.toConfig())
    return config
  }
}

module.exports = Sidebar
