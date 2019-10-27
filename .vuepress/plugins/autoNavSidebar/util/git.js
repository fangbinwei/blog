const spawn = require('cross-spawn')
const path = require('path')
const os = require('os')

function getGitAddedTimeStamp(filePath) {
  let earliest
  try {
    // git log 文件夹的时间戳有多个
    const addedTimeStampHistory = spawn
      .sync(
        'git',
        ['log', '--diff-filter=A', '--format=%at', path.basename(filePath)],
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
    return Number.MAX_SAFE_INTEGER
  }
  return earliest === '' ? Number.MAX_SAFE_INTEGER : Number(earliest)
}
module.exports = { getGitAddedTimeStamp }
