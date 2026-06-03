import { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiveReceiptScanner({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = async (mode) => {
    setIsInitializing(true);
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Kamera error:', err);
      toast.error('Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.');
      onClose();
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    
    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to Blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Stop stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center animate-fadeIn">
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
        >
          <X className="w-6 h-6" />
        </button>
        <button 
          onClick={toggleCamera}
          className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition flex items-center space-x-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm font-semibold pr-1">Putar</span>
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {isInitializing && (
          <div className="absolute text-white/50 text-sm animate-pulse">Menyiapkan kamera...</div>
        )}
        <video 
          ref={videoRef} 
          playsInline 
          className="w-full h-full object-cover"
        />
        {/* Helper overlay box for receipt alignment */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
          <div className="w-full max-w-sm h-3/4 border-2 border-white/40 border-dashed rounded-xl relative">
            <div className="absolute top-2 left-0 w-full text-center text-white/60 text-xs font-semibold drop-shadow-md">
              Posisikan struk di dalam kotak
            </div>
            {/* Corners */}
            <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
            <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
            <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
            <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom Controls */}
      <div className="absolute bottom-0 w-full p-8 flex justify-center items-center z-10 bg-gradient-to-t from-black/80 to-transparent">
        <button 
          onClick={handleCapture}
          className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all border-4 border-white/50 backdrop-blur-sm"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Camera className="w-6 h-6 text-black" />
          </div>
        </button>
      </div>
    </div>
  );
}
