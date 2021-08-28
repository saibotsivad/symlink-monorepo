import http from 'node:http'
import { caps } from '$/shared/util.js'
import { mixed } from '$/lib/util.js'
import { fuzz, bigFuzz } from './_words.js'

const server = http.createServer((req, res) => {
	res.statusCode = 200
	res.setHeader('Content-Type', 'text/plain')
	res.end(`app2: "${fuzz}" becomes "${caps(fuzz)}" while "${bigFuzz}" becomes "${mixed(bigFuzz)}"`)
})

server.listen(3002, '127.0.0.1', () => {
	console.log('app2 running: http://127.0.0.1:3002')
})
