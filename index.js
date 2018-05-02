import { createServer } from 'http'
import Redis from 'ioredis'

const KEY_RE = /^0x[0-9a-f]{130}$/gi
const PORT = process.env.PORT || 4000

const redis = new Redis(process.env.REDIS_URL)

const sendKeys = async (res, redisKey) => {
  const keys = await redis.smembers(redisKey)
  const body = JSON.stringify(keys)
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'application/json',
  })
  res.end(body)
}

const sendError = (res, code) => {
  res.statusCode = code
  res.end()
}

createServer(async (req, res) => {
  const [, redisKey, pk] = req.url.split('/')
  if (req.method === 'PUT') {
    if (KEY_RE.test(pk)) {
      KEY_RE.lastIndex = 0
      await redis.sadd(redisKey, pk)
      sendKeys(res, redisKey)
    } else sendError(res, 400)
  } else if (req.method === 'GET') {
    if (pk == null) sendKeys(res, redisKey)
    else sendError(res, 404)
  } else sendError(res, 405)
}).listen(PORT, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    console.log('server listening on port', PORT)
  }
})

process.on('uncaughtException', ex => {
  console.log('exception', ex)
})
