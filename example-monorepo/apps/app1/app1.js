import http from 'node:http'
import { caps } from '$/shared/util.js'
import { smalls } from '$/lib/util.js'
import { fizz, bigFizz } from './_words.js'

const server = http.createServer((req, res) => {
	res.statusCode = 200
	res.setHeader('Content-Type', 'text/plain')
	res.end(`app1: "${fizz}" becomes "${caps(fizz)}" while "${bigFizz}" becomes "${smalls(bigFizz)}"`)
})

server.listen(3001, '127.0.0.1', () => {
	console.log('app1 running: http://127.0.0.1:3001')
})
