const indentString = require('indent-string')
const connect = require('connect')
const app = connect()

app.use((req, res, next) => {
  console.log('__proto__', res, Object.prototype.hasOwnProperty.call(res, 'end'))
  console.log(indentString('->1 middleware', 0))
  next()
  console.log(indentString('<-1 middleware after next', 0))
})

app.use((req, res, next) => {
  setTimeout(() => {
    console.log(indentString('->final middleware', 8))
    res.end('hello')
  }, 100)
})


app.listen(3000)

