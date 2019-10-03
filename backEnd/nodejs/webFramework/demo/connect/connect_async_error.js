const indentString = require('indent-string')
const connect = require('connect')
const app = connect()

app.use((req, res, next) => {
  console.log(indentString('->1 middleware', 0))
  next()
  console.log(indentString('<-1 middleware after next', 0))
})

app.use((req, res, next) => {
  setTimeout(() => {
    try {
      throw new Error('test error')
      console.log(indentString('->final middleware', 8))
      res.end('hello')
    } catch (err) {
      next(err)
    }
  }, 100)
})
app.use(function onerror(err, req, res, next) {
  console.log('catch error')
});


app.listen(3000)

