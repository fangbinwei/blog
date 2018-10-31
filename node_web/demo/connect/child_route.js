const connect = require('connect')
const http = require('http')

const router = connect()
const app = connect()

router.use('/child1', (req, res, next) => {
  // res.end('<h1>child1</h1>')
  console.log('child1')
  next()
})

router.use((req, res, next) => {
  // res.end('<h1>child2</h1>')
  console.log('child2')
  next()
})

app.use('/foo', router)
app.use((req, res, next) => {
  res.end('final')
  console.log('final')
})

http.createServer(app).listen(3000)