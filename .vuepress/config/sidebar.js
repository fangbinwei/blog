module.exports = {
  // 前端->框架
  '/frontEnd/framework/': [
    {
      title: 'Vue',
      sidebarDepth: 0,
      collapsable: false,
      children: ['vue/vueLife.md']
    },
    {
      title: 'React',
      collapsable: false,
      sidebarDepth: 0,
      children: ['react/reactLife.md']
    }
  ],
  // 前端->工程化
  '/frontEnd/engineering/': [
    {
      title: 'Vue CLI',
      sidebarDepth: 0,
      collapsable: false,
      children: ['vueCli/cli.md']
    }
  ],
  // 后端->nodejs
  '/backEnd/nodejs/': [
    {
      title: 'web框架',
      collapsable: false,
      sidebarDepth: 0,
      children: ['webFramework/middleware.md']
    }
  ]
}
