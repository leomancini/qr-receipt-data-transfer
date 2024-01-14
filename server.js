import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import QRCode from 'qrcode'

import { parseWithGPT, parseWithVeryfi } from './functions/parse-receipt.js'

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(bodyParser.json({ limit: '10000kb' }))
app.use(cors())

server.listen(process.env.SERVER_NODE_PORT, () => {
  console.log(`Listening on port ${process.env.SERVER_NODE_PORT}`)
})

function generateDataString(parsedReceipt) {
  let dataArray = []

  parsedReceipt.line_items.map((line_item) => {
    dataArray.push(`${line_item.quantity}:${line_item.description}:${line_item.total}`)
  }).filter(x => x)

  dataArray.push(`_s:${parsedReceipt.subtotal}`)
  dataArray.push(`_i:${parsedReceipt.tax}`)
  dataArray.push(`_a:${parsedReceipt.tip}`)
  dataArray.push(`_o:${parsedReceipt.total}`)

  let dataString = dataArray.join(';')

  dataString = encodeURIComponent(dataString)

  return dataString
}

app.post('/parseReceiptImage', async (req, res) => {
  let imageData = req.body.image
  let parsedReceipt
  const receiptParsingMode = process.env.RECEIPT_PARSING_MODE
  
  if (receiptParsingMode === 'GPT') {
    parsedReceipt = await parseWithGPT(imageData)
  } else if (receiptParsingMode === 'VERYFI') {
    parsedReceipt = await parseWithVeryfi(imageData)
  }

  if (parsedReceipt) {
    const dataString = generateDataString(parsedReceipt)

    const url = `${process.env.LOCAL_VIEWER_URL}/${dataString}`
    const qr = await QRCode.toDataURL(url)

    res.send({
      url,
      qr
    })
  } else {
    res.sendStatus(404)
  }
})