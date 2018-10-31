const indentString = require('indent-string')
const connect = require('connect')
const app = connect()

app.use((req, res, next) => {
  console.log(indentString('->1 middleware', 0))
  next()
  console.log(indentString('<-1 middleware after next', 0))
})

app.use('/foo', (req, res, next) => {
  console.log(indentString('->foo middleware', 8))
  res.end('foo')
})
app.use('/bar', (req, res, next) => {
  console.log(indentString('->foo middleware', 8))
  res.end('bar')
})

app.listen(3000)

