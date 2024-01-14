import React, { useEffect, useState, useRef } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'

function formatNumber(number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number)
}

function parseDataString(input) {
  let output = {
    items: [],
    totals: {}
  }

  let decodeURL = decodeURIComponent(input)
  let parts = decodeURL.split('')

  parts.map((row) => {
    let rowParts = row.split(':')

    if (rowParts[0] === '_s') {
      output.totals.items = parseFloat(rowParts[1])
    } else if (rowParts[0] === '_i') {
      output.totals.tip = parseFloat(rowParts[1])
    } else if (rowParts[0] === '_a') {
      output.totals.tax = parseFloat(rowParts[1])
    } else if (rowParts[0] === '_o') {
      output.totals.total = parseFloat(rowParts[1])
    } else {
      output.items.push({
        quantity: parseInt(rowParts[0]),
        name: rowParts[1],
        price: parseFloat(rowParts[2])
      })
    }
  })

  return output
}

function Camera() {
  const [imageData, setImageData] = useState('') // State to hold the base64 encoded image data
  const [response, setResponse] = useState(null)

  const uploadDocument = async () => {
    event.preventDefault()

    try {
      const response = await fetch('https://leo.local:4000/parseReceiptImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: imageData }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.text()
    } catch (error) {
      console.error('There was an error sending the POST request:', error)
    }
  }

  // References for video and canvas elements
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [image, setImage] = useState('')

  // Function to get the camera feed
  const getVideo = () => {
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            exact: 'environment'
          },
          width: { ideal: 3264/2 },
          height: { ideal: 2448/2 }
        }
      })
      .then(stream => {
        let video = videoRef.current
        video.srcObject = stream
        video.play()
      })
      .catch(err => {
        console.error("error:", err)
      })
  }

  const takePicture = () => {
    const width = 3264/2
    const height = 2448/2
    let video = videoRef.current
    let canvas = canvasRef.current

    canvas.width = width
    canvas.height = height

    let ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, width, height)

    let imageData = canvas.toDataURL('image/png')
    setImage(imageData)

    setImageData(imageData)
  }

  getVideo()

  useEffect(() => {
    if (imageData) {
      uploadDocument(imageData)
    }
  }, [imageData])

  useEffect(() => {
    if (response) {
      console.log(response)
    }
  }, [response])

  return (
    <div className='cameraContainer'>
      <video ref={videoRef} className='camera' autoplay="" muted="" playsinline=""></video>
      <button className='shutter' onClick={takePicture} />
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  )
}

function LocalReceipt() {
  const url = useParams()

  let dataString = parseDataString(url.receiptDataString)

  return <pre>{JSON.stringify(dataString, null, 2)}</pre>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Camera />} />
      <Route path="/localReceipt/:receiptDataString" element={<LocalReceipt />} />
    </Routes>
  )
}