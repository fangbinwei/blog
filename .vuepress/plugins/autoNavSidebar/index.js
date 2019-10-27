const glob = require('glob')
const Config = require('vuepress-chain')
const config = new Config()
const path = require('path')
const { getGitAddedTimeStamp } = require('./util/git')

const {
  ensurePrefixSlash,
  ensureArrayItem,
  ensureObjectProp
} = require('./util')

module.exports = (options, ctx) => {
  let docsDir = path.relative(process.cwd(), ctx.sourceDir)
  // remove prefix ./, ensure suffix /
  // docsDir = ensureSuffixSlash(docsDir.replace(/^\.\//, ''))
  let ignore = options.ignore || []
  if (!Array.isArray(ignore)) ignore = [ignore]
  ignore = ['node_modules/**'].concat(ignore)

  const globPattern = docsDir === '' ? `**/**.md` : `${docsDir}/**/**.md`

  const files = glob.sync(globPattern, {
    ignore
  })
  generate(files)
  const { nav, sidebar } = config.toConfig()
  sortSidebar(sidebar, ctx.sourceDir)

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
function sortSidebar(sidebar, context) {
  Object.keys(sidebar).forEach(baseLink => {
    sidebar[baseLink].sort(function(item1, item2) {
      const path1 = path.join(context, baseLink, item1.title)
      const path2 = path.join(context, baseLink, item2.title)
      return getGitAddedTimeStamp(path1) - getGitAddedTimeStamp(path2)
    })
    sidebar[baseLink].forEach(group => {
      group.children.sort(function(item1, item2) {
        const path1 = path.join(context, baseLink, item1)
        const path2 = path.join(context, baseLink, item2)
        return getGitAddedTimeStamp(path1) - getGitAddedTimeStamp(path2)
      })
    })
  })
}

function setNav(structure, link) {
  const [navGroup, navSubGroup, articleGroup] = structure
  config
    .nav(navGroup)
    .text(navGroup)
    .group(navSubGroup)
    .text(navSubGroup)
    .item(articleGroup)
    .text(articleGroup)
    .link(ensurePrefixSlash(link))
}

function setSidebar(structure) {
  const [navGroup, navSubGroup, articleGroup, article] = structure
  const sidebarProp = `/${navGroup}/${navSubGroup}/`
  const articleLink = [articleGroup, article].join('/')
  config
    .sidebar(sidebarProp)
    .group(articleGroup)
    .title(articleGroup)
    .sidebarDepth(0)
    .collapsable(false)
    .children.add(articleLink)
}

function generate(files) {
  let filterFiles = files.filter(link => {
    let structure = link.split('/')
    const validDirStructure = structure.length >= 4

    structure = structure.slice(-4)

    // const [navGroup, navSubGroup, articleGroup, article] = structure

    if (validDirStructure) {
      setNav(structure, link)
      setSidebar(structure)
    }

    return validDirStructure
  })
  return {
    files: filterFiles
  }
}
