"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ThemeSwitchProps {
  className?: string;
}

export default function ThemeSwitch({ className = '' }: ThemeSwitchProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // S'assurer que le composant est monté avant de rendre pour éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
    
    // Récupérer le thème depuis localStorage ou les préférences système
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Utiliser les préférences système comme valeur par défaut
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);
  
  // Effet pour appliquer le thème au document lorsqu'il change
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // Ne rien afficher jusqu'à ce que le composant soit monté côté client
  if (!mounted) return null;

  // Gérer le basculement du thème
  const handleToggle = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    
    // Réinitialiser l'état d'animation après la transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <button 
      onClick={handleToggle}
      className={`relative overflow-hidden rounded-full p-1.5 transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
        theme === 'dark' 
          ? 'bg-gray-700 hover:bg-gray-600' 
          : 'bg-blue-100 hover:bg-blue-200'
      } ${className}`}
      aria-label={`Passer au thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
    >
      <div className="flex w-14 h-7 items-center justify-between px-1.5">
        {/* Icône soleil */}
        <motion.div 
          animate={{ 
            opacity: theme === 'light' ? 1 : 0.5,
            scale: theme === 'light' ? 1.1 : 0.8,
            rotate: isAnimating && theme === 'light' ? 180 : 0
          }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 200
          }}
          className="z-10"
        >
          <svg 
            className={`w-5 h-5 ${theme === 'light' ? 'text-yellow-500 drop-shadow-md' : 'text-yellow-400/70'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        </motion.div>

        {/* Icône lune */}
        <motion.div 
          animate={{ 
            opacity: theme === 'dark' ? 1 : 0.5,
            scale: theme === 'dark' ? 1.1 : 0.8,
            rotate: isAnimating && theme === 'dark' ? 180 : 0
          }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 200
          }}
          className="z-10"
        >
          <svg 
            className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-300 drop-shadow-md' : 'text-indigo-400/70'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </motion.div>

        {/* Curseur mobile */}
        <motion.div 
          className={`absolute top-1.5 bottom-1.5 w-6 rounded-full shadow-lg ${
            theme === 'dark' 
              ? 'bg-gray-800 shadow-black/30' 
              : 'bg-white shadow-blue-400/30'
          }`}
          animate={{ 
            left: theme === 'dark' ? 'calc(100% - 1.75rem)' : '0.25rem'
          }}
          transition={{ 
            duration: 0.4,
            type: "spring", 
            stiffness: 400, 
            damping: 22
          }}
        />
      </div>
    </button>
  );
} 
 
 