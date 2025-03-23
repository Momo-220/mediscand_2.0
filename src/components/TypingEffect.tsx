"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypingEffectProps {
  text: string;
  speed?: number;
  cursor?: boolean;
  loop?: boolean;
  className?: string;
  html?: boolean;
}

export default function TypingEffect({ 
  text, 
  speed = 30, // Vitesse par défaut réduite pour un effet plus rapide
  cursor = true, 
  loop = false,
  className = "",
  html = false
}: TypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [key, setKey] = useState(0);
  const [paused, setPaused] = useState(false); // État pour gérer les pauses
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extraire le texte pur si html est à true
  const textContent = html ? stripHtml(text) : text;

  // Réinitialiser l'animation lorsque le texte change
  useEffect(() => {
    setDisplayedText('');
    setCharCount(0);
    setIsComplete(false);
    setPaused(false);
    setKey(prev => prev + 1);
  }, [text]);

  // Gérer l'effet de frappe
  useEffect(() => {
    if (charCount >= textContent.length) {
      setIsComplete(true);
      if (loop) {
        // Si boucle activée, redémarrer l'animation après une pause
        const timeout = setTimeout(() => {
          setDisplayedText('');
          setCharCount(0);
          setIsComplete(false);
          setPaused(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // Si en pause, ne rien faire
    if (paused) {
      return;
    }

    // Analyser le contexte pour des pauses plus naturelles
    const currentChar = textContent[charCount];
    const previousChar = charCount > 0 ? textContent[charCount - 1] : '';
    const next10Chars = textContent.substring(charCount, charCount + 10);
    
    // Vérifier si nous sommes à un point de pause logique (fin de phrase, paragraphe, etc.)
    const isAtParagraphEnd = previousChar === '\n' && currentChar === '\n';
    const isAtSentenceEnd = ['.', '!', '?'].includes(previousChar) && currentChar === ' ';
    const isAtComma = previousChar === ',' && currentChar === ' ';
    const isStartingNewSection = next10Chars.startsWith('# ') || next10Chars.startsWith('## ');
    
    // Calculer la durée de la pause en fonction du contexte
    let pauseDuration = 0;
    
    if (isAtParagraphEnd) {
      pauseDuration = 500 + Math.random() * 300; // 500-800ms pause entre paragraphes
    } else if (isAtSentenceEnd) {
      pauseDuration = 280 + Math.random() * 200; // 280-480ms pause entre phrases
    } else if (isAtComma) {
      pauseDuration = 150 + Math.random() * 100; // 150-250ms pause après virgule
    } else if (isStartingNewSection) {
      pauseDuration = 600 + Math.random() * 400; // 600-1000ms pause avant nouvelle section
    } else if (currentChar === ' ' && Math.random() < 0.08) {
      // Occasionnellement, faire une courte pause après certains mots (8% de chance)
      pauseDuration = 100 + Math.random() * 150; // 100-250ms pause aléatoire
    }
    
    // Si une pause est nécessaire, la configurer
    if (pauseDuration > 0) {
      setPaused(true);
      const pauseTimer = setTimeout(() => {
        setPaused(false);
      }, pauseDuration);
      
      return () => clearTimeout(pauseTimer);
    }

    // Calculer le délai de base pour l'ajout du caractère suivant
    // Plus fluide que la version précédente, avec des "rafales" de caractères
    let burstMode = Math.random() < 0.7; // 70% de chance d'être en mode "rafale"
    let baseDelay = speed;
    
    if (burstMode) {
      // En mode rafale, la frappe est plus rapide
      baseDelay = speed * 0.6;
    } else {
      // Hors rafale, vitesse normale avec légère variation
      baseDelay = speed * (0.9 + Math.random() * 0.4);
    }
    
    // Ajustements contextuels
    if (['.', '!', '?', ';', ':'].includes(currentChar)) {
      baseDelay *= 1.5; // Ralentir légèrement sur la ponctuation finale
    }
    
    // Délai final avec une petite variation aléatoire
    const delay = Math.max(10, baseDelay * (0.9 + Math.random() * 0.2));
    
    const timer = setTimeout(() => {
      if (html) {
        // Pour le contenu HTML, on doit reconstruire en préservant les balises
        setDisplayedText(truncateHtmlSafely(text, charCount + 1));
      } else {
        // Pour le texte simple, ajouter simplement le caractère suivant
        setDisplayedText(prev => prev + textContent[charCount]);
      }
      setCharCount(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [charCount, textContent, speed, loop, text, html, paused]);

  // Faire défiler automatiquement vers le bas quand le texte est mis à jour
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  // Effet de clignotement du curseur amélioré
  const cursorVariants = {
    blink: {
      opacity: [1, 1, 0, 0, 1, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
      }
    }
  };

  if (html) {
    return (
      <div className="relative">
        <div 
          ref={containerRef}
          className={`${className}`} 
          key={key}
          dangerouslySetInnerHTML={{ __html: displayedText }}
        />
        {cursor && !isComplete && (
          <motion.span
            className="inline-block w-[2px] h-[1.2em] bg-current absolute"
            variants={cursorVariants}
            animate="blink"
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} key={key} ref={containerRef}>
      <span>{displayedText}</span>
      {cursor && !isComplete && (
        <motion.span
          className="inline-block w-[2px] h-[1.2em] ml-[1px] bg-current align-middle"
          variants={cursorVariants}
          animate="blink"
        />
      )}
    </div>
  );
}

// Fonction pour supprimer les balises HTML et obtenir le texte pur
function stripHtml(html: string): string {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Fonction pour tronquer du HTML de manière sécurisée
function truncateHtmlSafely(html: string, maxChars: number): string {
  // Si pas d'HTML, on retourne une chaîne vide
  if (!html) return '';
  
  // Initialiser un compteur de caractères visibles
  let visibleCount = 0;
  let result = '';
  let inTag = false;
  let inEntity = false;
  let entityBuffer = '';
  
  // Parcourir caractère par caractère
  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    
    // Gérer les balises
    if (char === '<') {
      inTag = true;
      result += char;
      continue;
    }
    
    if (char === '>') {
      inTag = false;
      result += char;
      continue;
    }
    
    // Si on est dans une balise, ajouter le caractère tel quel
    if (inTag) {
      result += char;
      continue;
    }
    
    // Gérer les entités HTML comme &nbsp; &lt; etc.
    if (char === '&' && !inEntity) {
      inEntity = true;
      entityBuffer = char;
      continue;
    }
    
    if (inEntity) {
      entityBuffer += char;
      if (char === ';') {
        inEntity = false;
        result += entityBuffer;
        entityBuffer = '';
        visibleCount++; // Compte comme un seul caractère visible
        if (visibleCount >= maxChars) break;
      }
      continue;
    }
    
    // Caractère normal (hors balise et entité)
    result += char;
    visibleCount++;
    
    // Arrêter si on atteint le nombre de caractères voulus
    if (visibleCount >= maxChars) break;
  }
  
  // S'assurer que toutes les entités ou balises ouvertes sont fermées correctement
  if (inEntity) result += ';'; // Compléter l'entité si nécessaire
  
  return result;
} 