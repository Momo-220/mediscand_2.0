"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic']
});

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Attendre que l'animation de sortie soit terminée
    }, 5000); // Durée d'affichage du splash screen augmentée à 5 secondes

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative w-40 h-40 mb-8"
          >
            <div className="absolute inset-0 bg-white rounded-full shadow-xl flex items-center justify-center p-2">
              <img 
                src="/images/logo-app.png" 
                alt="MediScan Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="absolute -inset-4 border-4 border-blue-200 border-t-[#89CFF0] rounded-full animate-spin opacity-70"></div>
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            MediScan
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className={`text-gray-700 text-lg text-center max-w-xs ${playfair.className} italic`}
          >
            Bienvenue dans votre application d'analyse intelligente de médicaments
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 