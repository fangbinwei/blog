function ensureSuffixSlash(path) {
  return path.replace(/([^/])$/, '$1/')
}
function ensurePrefixSlash(path) {
  return path.replace(/^([^/])/, '/$1')
}

function ensureArrayItem(arr, conditionCb, item, type = 'push') {
  let existItem = arr.find(conditionCb)
  if (existItem) return existItem

  arr[type](item)
  return
}
function ensureObjectProp(obj, prop, value) {
  if (Object.prototype.hasOwnProperty.call(obj, prop)) return obj[prop]
  obj[prop] = value
  return
}
module.exports = {
  ensurePrefixSlash,
  ensureSuffixSlash,
  ensureArrayItem,
  ensureObjectProp
}
