"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"

export default function CameraTestPage() {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      setError(null)
      console.log("Starting camera...")
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      console.log("Stream obtained:", stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsActive(true)
        
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded")
          console.log("Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
        }
        
        videoRef.current.play().catch(err => {
          console.error("Play failed:", err)
          setError("Failed to play video")
        })
      }
    } catch (err) {
      console.error("Camera error:", err)
      setError(err instanceof Error ? err.message : "Camera access failed")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Camera Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Camera View */}
          <div 
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ aspectRatio: "16/9", minHeight: "300px" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
            
            {!isActive && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <p>Camera not active</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900 text-white">
                <div className="text-center p-4">
                  <p className="font-bold">Error:</p>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700">
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="destructive">
                Stop Camera
              </Button>
            )}
          </div>
          
          {/* Debug Info */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Camera Active:</strong> {isActive ? "Yes" : "No"}</p>
              <p><strong>Error:</strong> {error || "None"}</p>
              <p><strong>Stream:</strong> {streamRef.current ? "Active" : "None"}</p>
              <p><strong>Video Element:</strong> {videoRef.current ? "Ready" : "Not Ready"}</p>
              {videoRef.current && (
                <>
                  <p><strong>Video Ready State:</strong> {videoRef.current.readyState}</p>
                  <p><strong>Video Paused:</strong> {videoRef.current.paused ? "Yes" : "No"}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}