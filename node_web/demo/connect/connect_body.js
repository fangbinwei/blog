const connect = require('connect')
const fs = require('fs')
const path = require('path')

const app = connect()

app.use((req, res, next) => {
  let type = req.headers['content-type'] || ''
  type = type.split(';')[0]
  if (type !== 'application/json') return next()
  let data = ''

  req.on('data', (chunk) => {
    data += chunk
  })
  req.on('end', () => {
    req.body = JSON.parse(data)
    next()
  })
})

app.use('/home', (req, res) => {
  console.log('req.url', req.url)
  fs.createReadStream(path.resolve(__dirname , './index.html')).pipe(res)
})

app.use('/foo', (req, res, next) => {
  console.log(req.body)
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    resFirstName: req.body.firstName,
    resLastName: req.body.lastName
  }))
})

app.listen(3001)