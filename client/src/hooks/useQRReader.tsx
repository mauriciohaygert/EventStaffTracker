import { useState, useRef, useEffect, useCallback } from "react";

export function useQRReader() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  
  // Import jsQR dynamically to prevent SSR issues
  const [jsQR, setJsQR] = useState<any>(null);
  
  useEffect(() => {
    import('jsqr').then(module => {
      setJsQR(() => module.default);
    });
  }, []);
  
  const scanQRFromVideo = useCallback(() => {
    if (!scanning || !jsQR || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        setLastResult(code.data);
        return;
      }
    }
    
    // Schedule next scan
    requestAnimationFrame(scanQRFromVideo);
  }, [scanning, jsQR]);
  
  useEffect(() => {
    if (scanning && jsQR) {
      requestAnimationFrame(scanQRFromVideo);
    }
  }, [scanning, jsQR, scanQRFromVideo]);
  
  const startScanning = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
      }
      
      const constraints = {
        video: {
          facingMode: 'environment',
        },
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setScanning(true);
      setLastResult(null);
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw error;
    }
  }, []);
  
  const stopScanning = useCallback(() => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  return {
    videoRef,
    canvasRef,
    lastResult,
    startScanning,
    stopScanning,
    isScanning: scanning,
  };
}
