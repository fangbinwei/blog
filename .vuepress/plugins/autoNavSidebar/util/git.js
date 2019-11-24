const spawn = require('cross-spawn')
const path = require('path')
const os = require('os')
const debug = require('debug')('myPlugin-autoNavSidebar-git')

let cache = {}

function getGitAddedTimeStamp(filePath) {
  if (cache[filePath]) {
    debug('cache earliest')
    return cache[filePath]
  }
  let earliest
  try {
    // git log 文件夹的时间戳有多个
    const addedTimeStampHistory = spawn
      .sync(
        'git',
        [
          'log',
          '--follow', // continue listening the history of renamed file
          '--diff-filter=A',
          '--format=%at',
          path.basename(filePath)
        ],
        {
          cwd: path.dirname(filePath)
        }
      )
      .stdout.toString('utf-8')

    earliest = addedTimeStampHistory
      .trim()
      .split(os.EOL)
      .slice(-1)
      .toString()
  } catch (e) {
    debug('catch', e)
    return Date.now()
  }

  earliest = earliest === '' ? Date.now() : Number(earliest) * 1000

  debug('filePath', filePath)
  debug('earliest', earliest)

  cache[filePath] = earliest
  return earliest
}
module.exports = { getGitAddedTimeStamp }
