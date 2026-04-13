import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraViewProps {
  onFrame: (base64: string) => void;
  isAnalyzing: boolean;
  autoCaptureInterval?: number | null;
}

export const CameraView: React.FC<CameraViewProps> = ({ onFrame, isAnalyzing, autoCaptureInterval }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported in this browser.");
      return;
    }

    try {
      // Try with environment facing mode first (ideal for mobile)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      }
      setIsActive(true);
      setError(null);
    } catch (err) {
      console.warn("Environment camera failed, trying default...", err);
      try {
        // Fallback to any available camera (ideal for desktop)
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
        setIsActive(true);
        setError(null);
      } catch (fallbackErr) {
        console.error("Camera access failed:", fallbackErr);
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive || isAnalyzing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      onFrame(base64);
    }
  }, [isActive, isAnalyzing, onFrame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && autoCaptureInterval && !isAnalyzing) {
      interval = setInterval(captureFrame, autoCaptureInterval);
    }
    return () => clearInterval(interval);
  }, [isActive, autoCaptureInterval, isAnalyzing, captureFrame]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-[#141414] shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay HUD */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/10">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/80">
            {isActive ? 'Live Feed' : 'Offline'}
          </span>
        </div>

        {isAnalyzing && (
          <div className="absolute top-4 right-4 bg-blue-500/20 backdrop-blur-md px-3 py-1.5 rounded border border-blue-500/30 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">
              Analyzing...
            </span>
          </div>
        )}

        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20" />
        
        {/* Scanning Line */}
        {isActive && isAnalyzing && (
          <motion.div
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[1px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
          />
        )}
      </div>

      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm z-20"
          >
            {error ? (
              <div className="text-center p-6 max-w-sm">
                <CameraOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 font-mono text-sm mb-2">{error}</p>
                <p className="text-zinc-500 font-mono text-[10px] mb-6 uppercase tracking-tight">
                  Pro Tip: Try opening the app in a new tab using the icon at the top right of the preview.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startCamera}
                    className="px-6 py-2 bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                  >
                    Retry Access
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <button
                  onClick={startCamera}
                  className="px-8 py-3 bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2"
                >
                  Initialize Camera
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Capture Button for debugging/testing */}
      {isActive && (
        <button
          onClick={captureFrame}
          disabled={isAnalyzing}
          className="absolute bottom-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all active:scale-95 disabled:opacity-50 pointer-events-auto"
          title="Manual Analysis"
        >
          <RefreshCw className={`w-5 h-5 text-white ${isAnalyzing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};
