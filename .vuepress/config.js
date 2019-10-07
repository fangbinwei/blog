module.exports = {
  base: process.env.GITHUB_PAGE ? '/blog/' : '/',
  title: `Sleepwalker's Blog`,
  description: `It's a technology blog focuses on front-end development, but not only that.`,
  plugins: [
    ['@vuepress/medium-zoom', { selector: 'img' }],
    ['vuepress-plugin-mathjax']
  ],
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    repo: 'fangbinwei/blog',
    editLinks: true,
    smoothScroll: true,
    nav: require('./config/nav.js'),
    sidebar: require('./config/sidebar'),
    lastUpdated: 'Last Updated'
  }
}
