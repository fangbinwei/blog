const spawn = require('cross-spawn')
const path = require('path')
const DATE_RE = /(\d{4}-\d{1,2}(-\d{1,2})?)-(.*)/
const debug = require('debug')('myPlugin-generateDate')

module.exports = (options, ctx) => {
  return {
    name: 'vuepress-plugin-added-time',
    extendPageData($page) {
      const { _filePath, frontmatter, filename, dirname } = $page
      // TODO: vuepress permalink router bug
      // if (!frontmatter.permalink && filename !== '404') {
      // frontmatter.permalink = '/:year-:month-:day-:slug'
      // }
      if (frontmatter.date) return
      // if (filename && filename.match(DATE_RE)) return
      // if (dirname && dirname.match(DATE_RE)) return
      let stamp
      if ((stamp = getGitAddedTimeStamp(_filePath))) {
        frontmatter.date = stamp
      }
    }
  }
}

function getGitAddedTimeStamp(filePath) {
  let addedTimeStamp
  debug('filePath', filePath)
  try {
    addedTimeStamp = spawn
      .sync(
        'git',
        [
          'log',
          '--follow',
          '--diff-filter=A',
          '--format=%at',
          path.basename(filePath)
        ],
        {
          cwd: path.dirname(filePath)
        }
      )
      .stdout.toString('utf-8')
      .trim()
  } catch (e) {
    return Date.now()
  }

  debug('timestamp', addedTimeStamp)
  return addedTimeStamp === '' ? Date.now() : Number(addedTimeStamp) * 1000
}
