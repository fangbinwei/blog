const spawn = require('cross-spawn')
const path = require('path')
const DATE_RE = /(\d{4}-\d{1,2}(-\d{1,2})?)-(.*)/

module.exports = (options, ctx) => {
  return {
    name: 'vuepress-plugin-added-time',
    extendPageData($page) {
      const { _filePath, frontmatter, filename, dirname } = $page
      if (frontmatter.date) return
      if (filename && filename.match(DATE_RE)) return
      if (dirname && dirname.match(DATE_RE)) return
      let stamp
      if ((stamp = getGitAddedTimeStamp(_filePath))) {
        frontmatter.date = stamp
      }
    }
  }
}

function getGitAddedTimeStamp(filePath) {
  let addedTimeStamp
  try {
    addedTimeStamp =
      parseInt(
        spawn
          .sync(
            'git',
            ['log', '--diff-filter=A', '--format=%at', path.basename(filePath)],
            {
              cwd: path.dirname(filePath)
            }
          )
          .stdout.toString('utf-8')
      ) * 1000
  } catch (e) {
    return null
  }
  return addedTimeStamp
}
