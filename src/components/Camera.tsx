"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CameraProps {
  onPhotoCapture: (imageData: string) => void;
  onClose?: () => void;
}

export default function Camera({ onPhotoCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [flashMode, setFlashMode] = useState(false);

  useEffect(() => {
    // Détection si c'est un appareil mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);

    const startCamera = async () => {
      try {
        // Options pour une meilleure qualité
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
          setError(null);
        }
      } catch (err) {
        setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
        setIsStreaming(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const toggleFlash = async () => {
    if (!videoRef.current?.srcObject) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    
    if (track) {
      try {
        // @ts-ignore - La propriété torch n'est pas reconnue par TypeScript mais existe sur certains appareils mobiles
        const capabilities = track.getCapabilities();
        // @ts-ignore - La propriété torch n'est pas reconnue par TypeScript mais existe sur certains appareils mobiles
        if (capabilities && capabilities.torch) {
          const newFlashMode = !flashMode;
          await track.applyConstraints({
            // @ts-ignore - La propriété torch n'est pas reconnue par TypeScript mais existe sur certains appareils mobiles
            advanced: [{ torch: newFlashMode }]
          });
          setFlashMode(newFlashMode);
        }
      } catch (err) {
        console.error('Flash non supporté sur cet appareil', err);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Définir les dimensions du canvas pour correspondre à la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image de la vidéo sur le canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir en base64 avec haute qualité
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        onPhotoCapture(imageData);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Barre supérieure */}
      <div className="relative pt-safe-top pb-4 px-4 flex justify-between items-center">
        <button 
          onClick={onClose}
          className="p-2 text-white bg-gray-800/50 rounded-full backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {isMobileDevice && (
          <button 
            onClick={toggleFlash}
            className={`p-2 text-white rounded-full backdrop-blur-sm ${flashMode ? 'bg-yellow-500' : 'bg-gray-800/50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Zone de la caméra */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-900/80 p-6 rounded-lg text-center max-w-md">
              <p className="text-white text-lg">{error}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-white text-red-900 rounded-lg font-medium"
              >
                Retour
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* Contrôles de la caméra - Bouton modernisé */}
      <div className="pb-safe-bottom pt-4 px-4 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
        {isStreaming && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={capturePhoto}
            className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur-md shadow-xl flex items-center justify-center"
            aria-label="Prendre une photo"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-full opacity-80"></div>
            <div className="absolute inset-2 bg-white rounded-full"></div>
            <div className="absolute inset-3 bg-[#89CFF0] rounded-full flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-white" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4.05l1.83-2h4.24l1.83 2H20v12z" />
              </svg>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
} 