"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TableauAnimeProps {
  headers: string[];
  data: (string | React.ReactNode)[][];
  title?: string;
  animationDuration?: number;
  animationDelay?: number;
  effect?: 'fade' | 'slide' | 'scale';
  highlightKeywords?: boolean;
  className?: string;
  darkMode?: boolean;
}

const TableauAnime: React.FC<TableauAnimeProps> = ({
  headers,
  data,
  title,
  animationDuration = 0.3,
  animationDelay = 0.1,
  effect = 'fade',
  highlightKeywords = false,
  className = '',
  darkMode = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visibleRows, setVisibleRows] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Animation progressive des lignes comme dans ChatGPT
    if (data.length > 0) {
      setVisibleRows(1); // Afficher immédiatement la première ligne
      
      // Ajouter progressivement les lignes restantes
      let currentRow = 1;
      
      intervalRef.current = setInterval(() => {
        if (currentRow < data.length) {
          currentRow += 1;
          setVisibleRows(currentRow);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 150); // Vitesse d'apparition des lignes
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data.length]);

  // Animation variants
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const getRowVariants = () => {
    switch (effect) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { duration: animationDuration } },
        };
      case 'slide':
        return {
          hidden: { opacity: 0, x: -10 },
          show: { opacity: 1, x: 0, transition: { duration: animationDuration } },
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.95 },
          show: { opacity: 1, scale: 1, transition: { duration: animationDuration } },
        };
      default:
        return {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { duration: animationDuration } },
        };
    }
  };

  // Function to highlight keywords in text
  const highlightText = (text: string | React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string' || !highlightKeywords) return text;

    // List of keywords to highlight with their associated colors
    const keywordHighlights = [
      { keywords: ['contre-indication', 'contre-indications', 'contre indication', 'contre indications', 'non recommandé', 'déconseillé', 'interdit'], color: 'text-red-500' },
      { keywords: ['attention', 'précaution', 'prudence', 'surveillance', 'vigilance', 'risque'], color: 'text-amber-500' },
      { keywords: ['recommandé', 'indication', 'indications', 'conseillé', 'efficace'], color: 'text-green-500' },
      { keywords: ['effet indésirable', 'effets indésirables', 'effet secondaire', 'effets secondaires'], color: 'text-orange-500' },
      { keywords: ['conservation', 'stockage', 'conserver', 'stocker', 'température'], color: 'text-blue-500' },
    ];

    // Split text to parts and apply highlighting
    let parts: React.ReactNode[] = [text];

    keywordHighlights.forEach(({ keywords, color }) => {
      keywords.forEach(keyword => {
        const lowerCaseKeyword = keyword.toLowerCase();
        const newParts: React.ReactNode[] = [];

        parts.forEach(part => {
          if (typeof part !== 'string') {
            newParts.push(part);
            return;
          }

          const lowerCasePart = part.toLowerCase();
          const splitParts = part.split(new RegExp(`(${keyword})`, 'gi'));

          if (splitParts.length > 1) {
            splitParts.forEach((subPart, i) => {
              if (subPart.toLowerCase() === lowerCaseKeyword) {
                newParts.push(
                  <span key={`${keyword}-${i}`} className={`${color} font-medium`}>
                    {subPart}
                  </span>
                );
              } else if (subPart) {
                newParts.push(subPart);
              }
            });
          } else {
            newParts.push(part);
          }
        });

        parts = newParts;
      });
    });

    return <>{parts}</>;
  };

  if (!mounted) return null;

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold text-gray-100 mb-3">{title}</h3>
      )}
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 shadow-lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gradient-to-r from-blue-900/80 to-indigo-900/80 text-left">
                {headers.map((header, index) => (
                  <th
                    key={`header-${index}`}
                    className="px-4 py-3 text-sm font-semibold text-gray-100 first:w-1/3"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, visibleRows).map((row, rowIndex) => (
                <motion.tr
                  key={`row-${rowIndex}`}
                  variants={getRowVariants()}
                  initial="hidden"
                  animate="show"
                  className="border-t border-gray-700 text-left transition-colors hover:bg-gray-700/30"
                  style={{ 
                    transitionDelay: `${rowIndex * animationDelay}s`,
                    backgroundColor: rowIndex % 2 === 0 ? 'rgba(30, 41, 59, 0.4)' : 'transparent'
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className={`px-4 py-3 ${cellIndex === 0 ? 'text-sm font-medium text-blue-300' : 'text-sm text-gray-300'}`}
                    >
                      {cellIndex === 1 && typeof cell === 'string'
                        ? highlightText(cell)
                        : cell}
                    </td>
                  ))}
                </motion.tr>
              ))}
              
              {/* Indicateur de chargement pour les lignes restantes */}
              {visibleRows < data.length && (
                <tr className="border-t border-gray-700 bg-gray-800/20">
                  <td colSpan={headers.length} className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-blue-400 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default TableauAnime; 