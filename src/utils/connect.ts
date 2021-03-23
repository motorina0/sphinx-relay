import * as publicIp from 'public-ip'
import password from '../utils/password'
import {loadConfig} from './config'
const fs = require('fs')

const config = loadConfig()

export async function getQR():Promise<string> {
  let theIP

  const public_url = config.public_url
  if (public_url) theIP = public_url

  console.log('public_url', public_url)
  console.log('0. theIP', theIP)

  if (!theIP) {
    const ip = process.env.NODE_IP
    console.log('1. ip', ip)
    if (!ip) {
      try {
        theIP = await publicIp.v4()
        console.log('1. theIP', theIP)
      } catch (e) { }
    } else {
      // const port = config.node_http_port
      // theIP = port ? `${ip}:${port}` : ip
      theIP = ip
      console.log('2. theIP', theIP)
    }
  }
  const url = Buffer.from(`ip::${theIP}::${password || ''}`).toString('base64')
  console.log('url', url)
  return url;
}

export async function connect(req, res) {
  fs.readFile("public/index.html", async function (error, pgResp) {
    if (error) {
      res.writeHead(404);
      res.write('Contents you are looking are Not Found');
    } else {
      const htmlString = Buffer.from(pgResp).toString()
      const qr = await getQR()
      const rep = htmlString.replace(/CONNECTION_STRING/g, qr)
      const final = Buffer.from(rep, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(final);
    }
    res.end();
  });
}