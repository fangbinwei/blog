const glob = require('glob')
const {
  ensurePrefixSlash,
  ensureSuffixSlash,
  ensureArrayItem,
  ensureObjectProp
} = require('./util')

module.exports = (options, ctx) => {
  let docsDir = options.docsDir || './'
  // remove prefix ./, ensure suffix /
  docsDir = ensureSuffixSlash(docsDir.replace(/^\.\//, ''))
  let ignore = options.ignore || []
  if (!Array.isArray(ignore)) ignore = [ignore]
  ignore = ['node_modules/**'].concat(ignore)

  const globPattern = docsDir === './' ? '**/**.md' : `${docsDir}**/**.md`

  const files = glob.sync(globPattern, {
    ignore
  })
  let { nav, sidebar } = generate(files)

  let {
    nav: defaultNavs = [],
    sidebar: defaultSidebar = {}
  } = ctx.siteConfig.themeConfig
  // merge default nav
  for (let i = defaultNavs.length - 1; i >= 0; i--) {
    ensureArrayItem(
      nav,
      autoGenerateNav => autoGenerateNav.text === defaultNavs[i].text,
      defaultNavs[i],
      'unshift'
    )
  }

  // merge default sidebar
  Object.keys(defaultSidebar).forEach(prop => {
    ensureObjectProp(sidebar, prop, defaultSidebar[prop])
  })

  return {
    async ready() {
      let themeConfig = ctx.siteConfig.themeConfig
      themeConfig.nav = nav
      themeConfig.sidebar = sidebar
    }
  }
}

function setNav(structure, link, nav = []) {
  const [navGroup, navSubGroup, articleGroup] = structure
  const articleGroupItem = {
    text: articleGroup,
    link: ensurePrefixSlash(link)
  }
  const navItem = {
    text: navGroup,
    items: [
      {
        text: navSubGroup,
        items: [articleGroupItem]
      }
    ]
  }
  const _navGroup = ensureArrayItem(
    nav,
    item => item.text === navGroup,
    navItem
  )
  if (!_navGroup) return

  const _navSubGroup = ensureArrayItem(
    _navGroup.items,
    item => item.text === navSubGroup,
    navItem.items[0]
  )
  if (!_navSubGroup) return

  ensureArrayItem(
    _navSubGroup.items,
    item => item.text === articleGroup,
    articleGroupItem
  )

  return nav
}

function setSidebar(structure, sidebar = {}) {
  const [navGroup, navSubGroup, articleGroup, article] = structure
  const sidebarProp = `/${navGroup}/${navSubGroup}/`
  const articleLink = [articleGroup, article].join('/')
  const sidebarGroup = {
    title: articleGroup,
    sidebarDepth: 0,
    collapsable: false,
    children: [articleLink]
  }
  const _sidebarForMatchedPath = ensureObjectProp(sidebar, sidebarProp, [
    sidebarGroup
  ])
  if (!_sidebarForMatchedPath) return
  const _sidebarGroup = ensureArrayItem(
    _sidebarForMatchedPath,
    groupItem => groupItem.title === articleGroup,
    sidebarGroup
  )
  if (!_sidebarGroup) return
  ensureArrayItem(
    _sidebarGroup.children,
    link => link === articleLink,
    articleLink
  )
}

function generate(files) {
  // let structureObj = {}
  let nav = []
  let sidebar = {}

  let filterFiles = files.filter(link => {
    let structure = link.split('/')
    const validDirStructure = structure.length >= 4

    structure = structure.slice(-4)

    // const [navGroup, navSubGroup, articleGroup, article] = structure

    if (validDirStructure) {
      setNav(structure, link, nav)
      setSidebar(structure, sidebar)
      // structureObj[navGroup] = structureObj[navGroup] || {}
      // structureObj[navGroup][navSubGroup] =
      //   structureObj[navGroup][navSubGroup] || {}
      // structureObj[navGroup][navSubGroup][articleGroup] =
      //   structureObj[navGroup][navSubGroup][articleGroup] || {}
      // structureObj[navGroup][navSubGroup][articleGroup][article] = item
    }

    return validDirStructure
  })
  return {
    files: filterFiles,
    nav,
    sidebar
    // structure
  }
}
