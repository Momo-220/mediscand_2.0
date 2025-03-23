"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import FormattedMessage from './FormattedMessage';

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
      content: "Bonjour, je suis Dr. PharmaAI, votre expert pharmaceutique. Je peux vous renseigner sur les médicaments, leurs indications, dosages, effets secondaires, interactions et contre-indications. Comment puis-je vous aider aujourd'hui?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  }, []);

  // Nettoyer l'AbortController lorsque le composant est démonté
  useEffect(() => {
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
                text: `Tu es Dr. PharmaAI, un pharmacien expert avec une expertise spécifique en pharmacologie, galénique, et conseils thérapeutiques.

                Pour toutes les questions pharmaceutiques, tu dois:
                1. Donner des informations précises et basées sur la science
                2. Toujours mentionner la DCI (Dénomination Commune Internationale) à côté des noms commerciaux
                3. Préciser les classes pharmacologiques et thérapeutiques
                4. Détailler les formes galéniques disponibles quand c'est pertinent
                5. Mentionner le statut (prescription obligatoire ou non)
                6. Indiquer clairement les contre-indications et précautions d'emploi
                7. Rappeler systématiquement l'importance de consulter un professionnel de santé

                Utilise une structure claire avec des sous-titres quand ta réponse est longue.
                Utilise un ton professionnel mais accessible, comme un pharmacien d'officine expérimenté parlant à un patient.
                Réponds en français, avec la terminologie pharmaceutique appropriée.
                
                Question du patient: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
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

      // Appeler l'API Gemini avec streaming
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isProcessing) return;
    
    // Ajout du message utilisateur
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    // Ajout immédiat du message utilisateur dans la liste
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      // Appel à l'API Gemini
      await callGeminiAPI(userMessage.content);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Fonction pour annuler une requête en cours
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Mettre à jour l'UI
    setIsProcessing(false);
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-xl shadow-xl flex flex-col overflow-hidden ${
        isMobile ? 'w-full h-[90vh]' : 'w-full max-w-3xl h-[80vh]'
      }`}>
        <div className="bg-gradient-to-r from-[#89CFF0] to-[#5AB0E2] py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white">PharmaAI</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="max-w-2xl mx-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  {/* Icône pour les messages de l'assistant */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#89CFF0]/20 flex-shrink-0 flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-[#5AB0E2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-lg px-3 py-2 max-w-[85%] shadow-sm ${
                      message.role === 'user'
                        ? 'bg-[#89CFF0] text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm">
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
                          onClick={cancelRequest}
                          className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Icône pour les messages de l'utilisateur */}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#89CFF0] flex-shrink-0 flex items-center justify-center ml-2">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 shadow-inner">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  className="w-full bg-transparent border-0 focus:ring-0 outline-none text-gray-800 resize-none max-h-32 text-sm"
                  rows={1}
                  disabled={isProcessing}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isProcessing}
                className={`rounded-full p-2.5 shadow transition-all ${
                  inputMessage.trim() && !isProcessing
                    ? 'bg-[#89CFF0] text-white hover:bg-[#74B9FF]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 