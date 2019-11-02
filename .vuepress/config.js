module.exports = {
  base: process.env.GITHUB_PAGE ? '/blog/' : '/',
  title: `Sleepwalker's Blog`,
  description: `It's a technology blog focuses on front-end development, but not only that.`,
  plugins: [
    ['@vuepress/medium-zoom', { selector: 'img' }],
    ['vuepress-plugin-mathjax'],
    // [require('./plugins/generateFrontmatterDate/index')],
    [
      require('./plugins/autoNavSidebar/index'),
      {
        ignore: [],
        transform: config => config,
        sidebarDepth: 2,
        collapsable: false
      }
    ]
  ],
  // permalink: '/:year-:month-:day-:slug',
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    repo: 'fangbinwei/blog',
    editLinks: true,
    smoothScroll: false,
    nav: [
      {
        text: '近期',
        link: '/guide/'
      }
    ],
    // nav: require('./config/nav'),
    // sidebar: require('./config/sidebar'),
    lastUpdated: 'Last Updated'
  }
}
