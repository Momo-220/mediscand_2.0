"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  
  // Effet pour initialiser le thème à partir de localStorage ou des préférences du système
  useEffect(() => {
    // Empêcher l'exécution pendant le rendu côté serveur
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Vérifier d'abord si l'utilisateur a déjà une préférence dans localStorage
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.add(storedTheme);
      return;
    }
    
    // Sinon, utiliser les préférences système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
  }, []);
  
  // Effet pour appliquer la classe au document lorsque le thème change
  useEffect(() => {
    // Empêcher l'exécution pendant le rendu côté serveur ou avant le montage
    if (!mounted || typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };
  
  const value = {
    theme,
    setTheme,
    toggleTheme
  };
  
  // Ne pas rendre le contexte avant le montage pour éviter les erreurs d'hydratation
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte de thème
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 
 
 