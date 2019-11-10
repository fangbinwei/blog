const spawn = require('cross-spawn')
const path = require('path')
const os = require('os')
const debug = require('debug')('myPlugin-autoNavSidebar-git')

function getGitAddedTimeStamp(filePath) {
  let earliest
  debug('filePath', filePath)
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
    debug('earliest', earliest)
  } catch (e) {
    debug('catch', e)
    return Number.MAX_SAFE_INTEGER
  }
  return earliest === '' ? Number.MAX_SAFE_INTEGER : Number(earliest)
}
module.exports = { getGitAddedTimeStamp }
