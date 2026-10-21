const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', 'out', 'renderer')
const port = Number(process.env.PORT || 4173)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'
  const filePath = path.join(root, pathname)
  if (!filePath.startsWith(root)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (path.extname(pathname)) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      fs.readFile(path.join(root, 'index.html'), (indexError, html) => {
        if (indexError) {
          res.writeHead(500)
          res.end('Server error')
          return
        }
        res.writeHead(200, { 'Content-Type': types['.html'], 'Cache-Control': 'no-store' })
        res.end(html)
      })
      return
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    res.end(data)
  })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Presence Studio preview: http://127.0.0.1:${port}`)
})
