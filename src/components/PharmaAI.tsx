"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FormattedMessage from './FormattedMessage';
import type { User } from '@supabase/supabase-js';
import { sendMessage, cancelGeneration, initChat } from '../lib/gemini';
import { toast } from 'react-hot-toast';

interface PharmaAIProps {
  user: User | null;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export default function PharmaAI({ user, onClose }: PharmaAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-message",
      role: 'assistant',
      content: "Initialisation de PharmaAI...",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [visibleChars, setVisibleChars] = useState<number[]>([0]);
  const [textareaHeight, setTextareaHeight] = useState<number>(40); // Hauteur initiale en pixels

  // Générer un ID unique pour chaque message
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  useEffect(() => {
    // Faire défiler jusqu'au dernier message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus sur le champ de saisie quand le composant est monté
    inputRef.current?.focus();
    // Ajuster la hauteur initiale
    adjustTextareaHeight();
  }, []);

  // Nettoyer l'AbortController lorsque le composant est démonté
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Au début du composant PharmaAI, initialiser le chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await initChat();
        setIsChatInitialized(true);
        setMessages([{
          id: "initial-message",
          role: 'assistant',
          content: "Je suis PharmaAI, un assistant pharmaceutique intelligent. Je suis conçu pour fournir des informations sur les médicaments, mais je ne suis pas un substitut à un professionnel de la santé. N'hésitez pas à me poser vos questions, mais rappelez-vous de toujours consulter un médecin ou un pharmacien pour tout problème de santé.",
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du chat:', error);
        setInitError('Erreur lors de l\'initialisation du chat. Veuillez réessayer.');
        toast.error('Erreur lors de l\'initialisation du chat');
      }
    };

    initializeChat();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fonction pour appeler l'API Gemini
  const callGeminiAPI = async (prompt: string) => {
    try {
      // Créer un AbortController pour pouvoir annuler la requête
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Créer le corps de la requête
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      };

      // Générer un ID unique pour le message de l'assistant
      const assistantMessageId = generateId();
      // Ajouter un message d'assistant vide pour commencer le streaming
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      // Appeler l'API Gemini 2.0 Flash
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal
        }
      );

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      // Gérer le streaming de la réponse
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      let accumulatedContent = '';
      
      // Lire le stream par morceaux
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convertir le chunk en texte
        const chunk = new TextDecoder().decode(value);
        
        try {
          // Traiter chaque ligne du chunk
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.includes('"text":')) {
              const textMatch = line.match(/"text":\s*"([^"]*)"/);
              if (textMatch && textMatch[1]) {
                // Échapper les caractères spéciaux JSON
                const decodedText = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                accumulatedContent += decodedText;
                
                // Mettre à jour le message
                setMessages(prev => {
                  return prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  );
                });
              }
            }
          }
        } catch (e) {
          console.error("Error parsing chunk:", e);
        }
      }

      // Mettre à jour le message final et terminer le streaming
      setMessages(prev => {
        return prev.map(msg => 
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent, isStreaming: false }
            : msg
        );
      });
      
      return accumulatedContent;
    } catch (error: any) {
      // Gérer les erreurs
      if (error.name === 'AbortError') {
        console.log('Fetch was aborted');
      } else {
        console.error("Error calling Gemini API:", error);
        // Ajouter un message d'erreur
        setMessages(prev => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content: "Désolé, j'ai rencontré un problème pour traiter votre demande. Veuillez réessayer.",
            timestamp: new Date()
          }
        ]);
      }
      return null;
    }
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!isChatInitialized) {
      toast.error('Le chat est en cours d\'initialisation, veuillez patienter...');
      return;
    }

    if (initError) {
      toast.error('Une erreur est survenue. Veuillez rafraîchir la page.');
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTextareaHeight(40); // Réinitialiser la hauteur
    setIsProcessing(true);

    try {
      // Ajouter un message temporaire de l'assistant
      const tempAssistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      
      setMessages(prev => [...prev, tempAssistantMessage]);

      const response = await sendMessage(inputMessage, (partialResponse) => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: partialResponse }
            ];
          }
          return prev;
        });
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: response.text, isStreaming: false }
          ];
        }
        return prev;
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour ajuster automatiquement la hauteur du textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      // Réinitialiser la hauteur pour calculer la hauteur de contenu
      inputRef.current.style.height = 'auto';
      // Calculer la nouvelle hauteur basée sur le contenu
      const scrollHeight = inputRef.current.scrollHeight;
      // Limiter la hauteur maximale (environ 6 lignes)
      const maxHeight = 120; // pixels
      const newHeight = Math.min(scrollHeight, maxHeight);
      setTextareaHeight(newHeight);
      inputRef.current.style.height = `${newHeight}px`;
    }
  };

  // Fonction pour gérer les changements dans le textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Je réimplémente la fonction handleKeyDown qui a été supprimée
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  // Dans la fonction handleCancelRequest, utiliser cancelGeneration
  const handleCancelRequest = () => {
    cancelGeneration();
    setIsProcessing(false);
    setProcessingMessageId(null);
    setIsStreaming(false);
    
    // Mettre à jour le dernier message pour indiquer l'annulation
    setMessages(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
        if (updated[lastIndex].content.trim() === '') {
          // Si le message est vide, ajouter un message d'annulation
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            content: "La génération a été annulée." 
          };
        } else {
          // Sinon, ajouter une note d'annulation
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            content: updated[lastIndex].content + " [Génération annulée]" 
          };
        }
      }
      return updated;
    });
    
    toast.success("Génération annulée");
  };

  // Détecter les changements de taille de la fenêtre pour le mode responsive
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Zone de messages responsive */}
      <div className="flex-1 bg-white overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}
                >
                  {/* Icône pour les messages de l'assistant */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#89CFF0]/20 flex-shrink-0 flex items-center justify-center mr-2 sm:mr-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#5AB0E2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] shadow-sm ${
                      message.role === 'user'
                        ? 'bg-[#89CFF0] text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm sm:text-base">
                      {message.role === 'assistant' ? (
                        <FormattedMessage 
                          content={message.content} 
                          isStreaming={message.isStreaming}
                          isAssistant={true}
                          speed={30}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br/>') }} />
                      )}
                    </div>
                    
                    {message.isStreaming && (
                      <div className="mt-1 text-right">
                        <button 
                          onClick={handleCancelRequest}
                          className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Icône pour les messages de l'utilisateur */}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#89CFF0] flex-shrink-0 flex items-center justify-center ml-2 sm:ml-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Zone de saisie fixée en bas */}
        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="flex-1 bg-gray-100 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-inner">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question à PharmaAI..."
                  className="w-full bg-transparent border-0 focus:ring-0 outline-none text-gray-800 resize-none text-sm sm:text-base transition-all duration-200 ease-in-out"
                  style={{ 
                    height: `${textareaHeight}px`,
                    minHeight: '40px',
                    maxHeight: '120px'
                  }}
                  rows={1}
                  disabled={isProcessing}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isProcessing}
                className={`rounded-full p-2.5 sm:p-3 shadow-lg transition-all ${
                  inputMessage.trim() && !isProcessing
                    ? 'bg-[#89CFF0] text-white hover:bg-[#74B9FF] hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 