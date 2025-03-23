"use client";

import { useEffect, useState, useMemo } from 'react';
import TypingEffect from './TypingEffect';

interface FormattedMessageProps {
  content: string;
  isStreaming?: boolean;
  isAssistant?: boolean;
  speed?: number;
}

export default function FormattedMessage({
  content,
  isStreaming = false,
  isAssistant = true,
  speed = 50
}: FormattedMessageProps) {
  // Formater le message (Markdown → HTML)
  const formattedContent = useMemo(() => {
    return formatMessage(content);
  }, [content]);

  // Si ce n'est pas un message assistant ou pas en streaming, simplement afficher le contenu formaté
  if (!isAssistant || !isStreaming) {
    return (
      <div 
        className="text-gray-800"
        dangerouslySetInnerHTML={{ __html: formattedContent }} 
      />
    );
  }

  // Pour les messages assistant en streaming, utiliser l'effet de frappe avec le HTML formaté
  return (
    <div className="formatted-message">
      <TypingEffect 
        text={formattedContent} 
        speed={speed}
        cursor={isStreaming}
        className="text-gray-800"
        html={true}
      />
    </div>
  );
}

// Fonction pour formater le message avec mise en forme Markdown simple
function formatMessage(content: string): string {
  if (!content) return '';
  
  // Échapper les caractères HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Remplacer les ** pour le gras
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Remplacer les * pour l'italique
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Remplacer les titres avec des classes adaptées
  formatted = formatted.replace(/^# (.*?)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2 text-[#59C3F0]">$1</h3>');
  formatted = formatted.replace(/^## (.*?)$/gm, '<h4 class="text-base font-bold mt-2 mb-1 text-[#59C3F0]">$1</h4>');
  formatted = formatted.replace(/^### (.*?)$/gm, '<h5 class="text-sm font-bold mt-2 mb-1 text-[#74B9FF]">$1</h5>');
  
  // Remplacer les listes
  // On identifie d'abord les blocs de liste
  const listRegex = /^- (.*?)(?:\n|$)/gm;
  let listMatches;
  let lastIndex = 0;
  let result = '';

  while ((listMatches = listRegex.exec(formatted)) !== null) {
    const matchIndex = listMatches.index;
    
    // Ajouter le texte avant la liste
    result += formatted.substring(lastIndex, matchIndex);
    
    // Démarrer une liste
    if (matchIndex === 0 || formatted[matchIndex - 1] === '\n') {
      result += '<ul class="list-disc pl-5 mb-3 mt-1">\n';
    }
    
    // Ajouter l'élément de liste
    result += `<li class="mb-1">${listMatches[1]}</li>\n`;
    
    // Vérifier si le prochain élément est aussi une liste
    const nextIndex = matchIndex + listMatches[0].length;
    const isEndOfText = nextIndex >= formatted.length;
    const isNextItemList = !isEndOfText && formatted.substring(nextIndex, nextIndex + 2) === '- ';
    
    // Fermer la liste si nécessaire
    if (!isNextItemList) {
      result += '</ul>';
    }
    
    lastIndex = nextIndex;
  }
  
  // Ajouter le reste du texte
  result += formatted.substring(lastIndex);
  formatted = result;
  
  // Transformer les URL en liens cliquables
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#5AB0E2] underline hover:text-[#89CFF0]">$1</a>'
  );
  
  // Ajouter des sections pour les blocs importants (entourés par ```)
  formatted = formatted.replace(
    /```([\s\S]*?)```/g,
    '<div class="bg-gray-100 p-3 rounded-md my-2 overflow-x-auto font-mono text-sm border border-gray-200">$1</div>'
  );
  
  // Ajouter des sauts de ligne
  formatted = formatted.replace(/\n\n/g, '<br/><br/>');
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return formatted;
} 