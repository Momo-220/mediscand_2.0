'use client';
import { useEffect, useState, useRef } from 'react';
import { devLog, devError, devWarn, hideConsoleInProduction } from '../utils/logger';

// Flag global pour éviter les re-initialisations multiples
let isTranslationInitialized = false;
let translationInProgress = false;

export const AutoTranslateWidget = () => {
  const [isClient, setIsClient] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const watcherTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour forcer la suppression de l'icône Google Translate
  const hideGoogleTranslateIcon = () => {
    // Vérifier qu'on est côté client et que le DOM est prêt
    if (typeof window === 'undefined' || !document.body) {
      return;
    }
    
    try {
      // Sélecteurs pour tous les éléments Google Translate possibles
      const selectors = [
        '.goog-te-gadget',
        '.goog-te-gadget-simple',
        '.goog-te-gadget-icon',
        '.goog-te-combo',
        '.goog-te-menu-value',
        '.goog-te-banner-frame',
        '.skiptranslate',
        '#google_translate_element',
        '#google_translate_element_hidden',
        'body > .goog-te-banner-frame',
        'body > .skiptranslate',
        // Sélecteurs spécifiques pour l'icône Google Translate
        '.VIpgJd-ZVi9od-l4eHX-hSRGPd',
        '.VIpgJd-ZVi9od-eFMyYd',
        '.VIpgJd-ZVi9od-ORHb',
        '.goog-toolbar',
        '.gt_selector_div',
        '.gt_float_menu_box',
        '.goog-te-combo-col',
        '.goog-text-highlight',
        '.goog-tooltip--open',
        'iframe.goog-te-banner-frame',
        'iframe.skiptranslate'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            // Masquer visuellement SANS casser la fonctionnalité
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.width = '0';
            element.style.height = '0';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '-9999px';
            element.style.pointerEvents = 'none';
            element.style.overflow = 'hidden';
            element.style.zIndex = '-9999';
            // NE PAS utiliser display: none pour préserver la traduction
          }
        });
      });

      // Masquer tous les éléments avec des classes contenant "VIpgJd", "goog-te", "skiptranslate", "gt_"
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        if (element instanceof HTMLElement) {
          const classList = Array.from(element.classList);
          const hasGoogleClass = classList.some(cls => 
            cls.includes('VIpgJd') || 
            cls.includes('goog-te') || 
            cls.includes('skiptranslate') || 
            cls.includes('gt_')
          );
          
          if (hasGoogleClass) {
            // Masquer visuellement SANS casser la fonctionnalité
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.width = '0';
            element.style.height = '0';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '-9999px';
            element.style.pointerEvents = 'none';
            element.style.overflow = 'hidden';
            element.style.zIndex = '-9999';
            // NE PAS utiliser display: none pour préserver la traduction
          }
        }
      });

      // Masquer tous les éléments avec des IDs contenant "google_translate", "goog-te", "gt_"
      const allElementsWithId = document.querySelectorAll('[id]');
      allElementsWithId.forEach(element => {
        if (element instanceof HTMLElement && element.id) {
          const hasGoogleId = element.id.includes('google_translate') || 
                             element.id.includes('goog-te') || 
                             element.id.includes('gt_');
          
          if (hasGoogleId) {
            // Masquer visuellement SANS casser la fonctionnalité
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.width = '0';
            element.style.height = '0';
            element.style.position = 'absolute';
            element.style.left = '-9999px';
            element.style.top = '-9999px';
            element.style.pointerEvents = 'none';
            element.style.overflow = 'hidden';
            element.style.zIndex = '-9999';
            // NE PAS utiliser display: none pour préserver la traduction
          }
        }
      });

      devLog('🎯 Icône Google Translate masquée avec succès (traduction préservée)');
    } catch (error) {
      devError('❌ Erreur lors du masquage de l\'icône:', error);
    }
  };

  // Fonction pour démarrer l'observateur de mutations (optimisée)
  const startMutationObserver = () => {
    // Vérifier qu'on est côté client et que le DOM est prêt
    if (typeof window === 'undefined' || !document.body) {
      return;
    }
    
    // Si un observateur existe déjà, le nettoyer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    try {
      const observer = new MutationObserver((mutations) => {
        // Debouncing : ne traiter qu'une fois toutes les 200ms
        if (translationInProgress) return;
        
        let hasGoogleElements = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                // Vérifier si le nœud ajouté contient des éléments Google Translate
                const googleElements = node.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple, .goog-te-gadget-icon, .goog-te-combo, .skiptranslate');
                if (googleElements.length > 0 || node.classList.contains('goog-te-gadget') || node.classList.contains('skiptranslate')) {
                  hasGoogleElements = true;
                }
              }
            });
          }
        });
        
        if (hasGoogleElements) {
          devLog('🔍 Nouvel élément Google Translate détecté, masquage automatique...');
          hideGoogleTranslateIcon();
        }
      });

      // Observer les changements dans le body
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      observerRef.current = observer;

      // Arrêter l'observateur après 30 secondes pour éviter les surcharges
      setTimeout(() => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
          devLog('⏹️ Observateur de mutations arrêté automatiquement');
        }
      }, 30000);

      devLog('👁️ Observateur de mutations Google Translate démarré');
    } catch (error) {
      devError('❌ Erreur lors du démarrage de l\'observateur:', error);
    }
  };

  // Fonction pour surveiller continuellement l'icône Google Translate (optimisée)
  const startContinuousIconWatcher = () => {
    // Nettoyer le timeout précédent si existe
    if (watcherTimeoutRef.current) {
      clearTimeout(watcherTimeoutRef.current);
    }
    
    try {
      // Vérifier toutes les 500ms pendant 20 secondes (moins agressif pour éviter les glitches)
      let checkCount = 0;
      const maxChecks = 40; // 20 secondes / 500ms
      
      const checkInterval = setInterval(() => {
        checkCount++;
        hideGoogleTranslateIcon();
        
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          devLog('⏹️ Surveillance continue de l\'icône arrêtée');
        }
      }, 500);

      devLog('🔄 Surveillance continue de l\'icône Google Translate démarrée');
    } catch (error) {
      devError('❌ Erreur lors du démarrage de la surveillance continue:', error);
    }
  };

  // Fonction pour surveiller le contenu non traduit (DÉSACTIVÉE pour éviter les glitches)
  const startContentWatcher = (browserLang: string) => {
    // Cette fonction est désactivée car elle peut causer des glitches
    // La traduction unique suffit généralement
    devLog('👀 Surveillance du contenu désactivée (optimisation)');
    return;
    
    // Code désactivé mais conservé pour référence
    /*
    try {
      const checkInterval = setInterval(() => {
        const untranslatedElements = document.querySelectorAll('*:not(.translated):not(.notranslate)');
        const hasFrenchText = Array.from(untranslatedElements).some(element => {
          const text = element.textContent || '';
          const frenchWords = ['Analyser', 'Médicament', 'Historique', 'Connexion', 'Inscription'];
          return frenchWords.some(word => text.includes(word));
        });

        if (hasFrenchText) {
          devLog('🔍 Contenu français détecté, re-traduction...');
          forceRetranslation(browserLang);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(checkInterval);
        devLog('⏹️ Surveillance du contenu arrêtée');
      }, 20000);

      devLog('👀 Surveillance du contenu non traduit démarrée');
    } catch (error) {
      devError('❌ Erreur lors du démarrage de la surveillance:', error);
    }
    */
  };

  // Fonction pour obtenir le nom de la langue
  const getLanguageName = (code: string): string => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'zh': '中文',
      'ar': 'العربية',
      'es': 'Español',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'tr': 'Türkçe',
      'ru': 'Русский',
      'it': 'Italiano',
      'pt': 'Português',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'no': 'Norsk',
      'da': 'Dansk',
      'fi': 'Suomi',
      'pl': 'Polski',
      'cs': 'Čeština',
      'hu': 'Magyar',
      'ro': 'Română',
      'bg': 'Български',
      'hr': 'Hrvatski',
      'sk': 'Slovenčina',
      'sl': 'Slovenščina',
      'et': 'Eesti',
      'lv': 'Latviešu',
      'lt': 'Lietuvių',
      'el': 'Ελληνικά',
      'he': 'עברית',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'id': 'Bahasa Indonesia',
      'ms': 'Bahasa Melayu',
      'tl': 'Filipino',
      'hi': 'हिन्दी',
      'bn': 'বাংলা',
      'ta': 'தமிழ்',
      'te': 'తెలుగు',
      'ml': 'മലയാളം',
      'kn': 'ಕನ್ನಡ',
      'gu': 'ગુજરાતી',
      'pa': 'ਪੰਜਾਬੀ',
      'mr': 'मराठी',
      'ne': 'नेपाली',
      'si': 'සිංහල',
      'my': 'မြန်မာ',
      'km': 'ខ្មែរ',
      'lo': 'ລາວ',
      'ka': 'ქართული',
      'am': 'አማርኛ',
      'sw': 'Kiswahili',
      'zu': 'IsiZulu',
      'af': 'Afrikaans',
      'sq': 'Shqip',
      'mk': 'Македонски',
      'sr': 'Српски',
      'bs': 'Bosanski',
      'mt': 'Malti',
      'is': 'Íslenska',
      'ga': 'Gaeilge',
      'cy': 'Cymraeg',
      'eu': 'Euskera',
      'ca': 'Català',
      'gl': 'Galego',
    };
    return languages[code] || code.toUpperCase();
  };

  // Fonction pour afficher la notification de traduction
  const showTranslationNotification = (browserLang: string) => {
    // Vérifier qu'on est côté client
    if (typeof window === 'undefined' || !document.body) {
      return;
    }
    
    const notification = document.createElement('div');
    notification.innerHTML = `🌐 MediScan traduit en ${getLanguageName(browserLang)}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #89CFF0, #5AB0E2);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Fonction pour afficher un message si la traduction est bloquée
  const showTranslationBlockedMessage = (browserLang: string) => {
    // Vérifier qu'on est côté client
    if (typeof window === 'undefined' || !document.body) {
      return;
    }
    
    // Vérifier si une notification existe déjà
    const existingNotification = document.querySelector('.translation-blocked-notification');
    if (existingNotification) {
      return; // Ne pas afficher plusieurs notifications
    }

    const notification = document.createElement('div');
    notification.className = 'translation-blocked-notification';
    const langName = getLanguageName(browserLang);
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>⚠️</span>
        <div>
          <strong>Traduction indisponible</strong><br>
          <small style="opacity: 0.9;">Désactivez votre bloqueur de pub ou utilisez Chrome pour traduire en ${langName}</small>
        </div>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 99999;
      animation: slideIn 0.3s ease-out;
      max-width: 350px;
      line-height: 1.5;
    `;
    
    // Ajouter l'animation CSS si elle n'existe pas
    if (!document.querySelector('#translation-animations')) {
      const style = document.createElement('style');
      style.id = 'translation-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Fermer la notification après 8 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 8000);
  };

  // Fonction pour forcer la traduction des éléments React (DÉSACTIVÉE car cause des glitches)
  const forceReactTranslation = () => {
    // Cette fonction est désactivée car elle peut causer des glitches de rendu
    devLog('⚛️ Traduction React désactivée (optimisation)');
    return;
    
    // Code désactivé mais conservé pour référence
    /*
    try {
      const event = new CustomEvent('forceTranslation', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(event);
      
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a, label');
      textElements.forEach(element => {
        if (element.textContent && element.textContent.trim()) {
          element.classList.remove('translated');
          element.classList.add('notranslate');
          setTimeout(() => {
            element.classList.remove('notranslate');
          }, 100);
        }
      });
      
      devLog('⚛️ Traduction React forcée');
    } catch (error) {
      devError('❌ Erreur lors de la traduction React:', error);
    }
    */
  };

  // Fonction pour forcer la re-traduction (simplifiée pour éviter les glitches)
  const forceRetranslation = (browserLang: string) => {
    // Éviter les re-traductions multiples
    if (translationInProgress) {
      devLog('⏳ Traduction en cours, re-traduction annulée');
      return;
    }
    
    try {
      // Vérifier que Google Translate est toujours disponible
      if (typeof (window as any).google === 'undefined' || 
          typeof (window as any).google.translate === 'undefined') {
        devWarn('⚠️ Google Translate non disponible pour la re-traduction');
        return;
      }

      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        // Vérifier que la langue est supportée
        const supportedLangs = Array.from(select.options).map(opt => opt.value);
        const targetLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
        
        // Si déjà traduit vers la bonne langue, ne rien faire
        if (select.value === targetLang) {
          devLog('✅ Déjà traduit vers', targetLang);
          // Juste masquer l'icône
          hideGoogleTranslateIcon();
          return;
        }
        
        translationInProgress = true;
        
        // Appliquer directement la traduction sans toggle
        select.value = targetLang;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        devLog('🔄 Re-traduction vers', targetLang);
        
        // Masquer l'icône après un délai
        setTimeout(() => {
          hideGoogleTranslateIcon();
          translationInProgress = false;
        }, 1000);
        
      } else {
        devWarn('⚠️ Sélecteur Google Translate non trouvé pour la re-traduction');
      }
    } catch (error: any) {
      translationInProgress = false;
      devError('❌ Erreur lors de la re-traduction:', error);
    }
  };

  // Fonction pour initialiser la traduction (optimisée)
  const initializeTranslation = (browserLang: string, retryCount = 0) => {
    // Éviter les re-traductions multiples
    if (translationInProgress) {
      devLog('⏳ Traduction déjà en cours, en attente...');
      return;
    }
    
    translationInProgress = true;
    
    try {
      // Vérifier que Google Translate est bien chargé
      if (typeof (window as any).google === 'undefined' || 
          typeof (window as any).google.translate === 'undefined') {
        translationInProgress = false;
        if (retryCount < 10) {
          devLog(`⏳ Google Translate pas encore chargé, nouvelle tentative (${retryCount + 1}/10)...`);
          setTimeout(() => initializeTranslation(browserLang, retryCount + 1), 500);
        } else {
          devError('❌ Google Translate n\'a pas pu être chargé après plusieurs tentatives');
          showTranslationBlockedMessage(browserLang);
        }
        return;
      }

      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        // Vérifier que la langue est supportée
        const supportedLangs = Array.from(select.options).map(opt => opt.value);
        const targetLang = supportedLangs.includes(browserLang) ? browserLang : 'en'; // Fallback vers anglais
        
        if (targetLang !== browserLang) {
          devWarn(`⚠️ Langue ${browserLang} non supportée, utilisation de ${targetLang}`);
        }
        
        select.value = targetLang;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        devLog('✅ MediScan traduit vers', targetLang);
        showTranslationNotification(targetLang);
        
        // Marquer comme traduit pour éviter les re-traductions
        isTranslationInitialized = true;
        
        // Forcer la suppression de l'icône Google Translate après traduction
        setTimeout(() => {
          hideGoogleTranslateIcon();
          translationInProgress = false;
        }, 1500);
        
        // Désactiver la surveillance du contenu (cause des glitches)
        // startContentWatcher(targetLang);
        
      } else {
        translationInProgress = false;
        if (retryCount < 15) {
          devLog(`⏳ Sélecteur Google Translate pas encore prêt, nouvelle tentative (${retryCount + 1}/15)...`);
          setTimeout(() => initializeTranslation(browserLang, retryCount + 1), 400);
        } else {
          devError('❌ Impossible de trouver le sélecteur Google Translate après plusieurs tentatives');
          showTranslationBlockedMessage(browserLang);
        }
      }
    } catch (error: any) {
      translationInProgress = false;
      devError('❌ Erreur lors de la traduction:', error);
      if (retryCount < 3) {
        setTimeout(() => initializeTranslation(browserLang, retryCount + 1), 1000);
      } else {
        showTranslationBlockedMessage(browserLang);
      }
    }
  };

  useEffect(() => {
    // S'assurer qu'on est côté client
    if (typeof window === 'undefined') {
      return;
    }
    
    // Éviter les re-initialisations multiples (Fast Refresh)
    if (isTranslationInitialized) {
      devLog('🔄 Traduction déjà initialisée, passage du re-render');
      return;
    }
    
    setIsClient(true);
    
    // Masquer complètement la console en production
    hideConsoleInProduction();
    
    // Attendre que l'hydratation soit terminée (plus de temps pour éviter les conflits)
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est complètement prêt
    const initTranslation = () => {
      // 1. Détection de la langue du navigateur avec fallback
      let browserLang = 'fr'; // Par défaut français
      try {
        if (navigator.language) {
          browserLang = navigator.language.split('-')[0].toLowerCase();
        } else if ((navigator as any).userLanguage) {
          browserLang = (navigator as any).userLanguage.split('-')[0].toLowerCase();
        }
      } catch (error) {
        devWarn('⚠️ Impossible de détecter la langue du navigateur, utilisation du français par défaut');
      }

      devLog('🌐 Langue détectée pour MediScan:', browserLang);

      // 2. Si ce n'est pas français, activer la traduction IMMÉDIATE
      if (browserLang !== 'fr') {
      
        // 3. Définir la fonction callback AVANT de charger le script
        // C'est crucial pour éviter l'erreur "Cannot access before initialization"
        (window as any).googleTranslateElementInit = () => {
          try {
            devLog('📥 Google Translate callback appelé');
            
            // Vérifier que Google Translate est bien chargé
            if (typeof (window as any).google === 'undefined' || 
                typeof (window as any).google.translate === 'undefined' ||
                typeof (window as any).google.translate.TranslateElement === 'undefined') {
              throw new Error('Google Translate API non disponible');
            }

            // Initialiser le widget
            new (window as any).google.translate.TranslateElement(
              {
                pageLanguage: 'fr',        // Langue source du site (français)
                includedLanguages: '',      // Toutes les langues supportées
                autoDisplay: false,         // Masquer le sélecteur Google
                layout: 0,                  // Layout minimal
                multilanguagePage: true,    // Support multi-langues
              },
              'google_translate_element_hidden' // ID du conteneur caché
            );

            // 5. Déclencher la traduction automatique IMMÉDIATEMENT
            devLog('⚡ Traduction immédiate déclenchée !');
            
            // Attendre un peu que le widget soit prêt
            setTimeout(() => {
              initializeTranslation(browserLang);
            }, 800);
            
            // 6. Une seule re-traduction pour éviter les glitches
            setTimeout(() => {
              if (!translationInProgress) {
                forceRetranslation(browserLang);
              }
            }, 3000);
          } catch (error: any) {
            devError('❌ Erreur lors de l\'initialisation de Google Translate:', error);
            showTranslationBlockedMessage(browserLang);
          }
        };
      
        // 3. Démarrer la traduction immédiatement (sans attendre Google Translate)
        devLog('🚀 Démarrage de la traduction IMMÉDIATE...');
        
        // Masquer l'icône immédiatement
        hideGoogleTranslateIcon();
        
        // Démarrer l'observateur de mutations immédiatement
        startMutationObserver();
        
        // Démarrer la surveillance continue immédiatement
        startContinuousIconWatcher();
        
        // Vérifier si Google Translate est déjà chargé
        if (typeof (window as any).google !== 'undefined' && 
            (window as any).google.translate &&
            typeof (window as any).google.translate.TranslateElement !== 'undefined') {
          devLog('✅ Google Translate déjà chargé - traduction immédiate !');
          // Appeler directement la fonction callback
          if (typeof (window as any).googleTranslateElementInit === 'function') {
            (window as any).googleTranslateElementInit();
          }
          return;
        }
        
        // 4. Vérifier si le script n'est pas déjà chargé
        const existingScript = document.querySelector('script[src*="translate.google.com"]');
        if (existingScript) {
          devLog('📥 Script Google Translate déjà présent, utilisation de l\'existant');
          // Attendre un peu et essayer d'initialiser
          setTimeout(() => {
            if (typeof (window as any).googleTranslateElementInit === 'function') {
              (window as any).googleTranslateElementInit();
            } else {
              initializeTranslation(browserLang);
            }
          }, 500);
          return;
        }
        
        // 5. Charger le script Google Translate avec gestion d'erreur améliorée
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.defer = true;
        script.id = 'google-translate-script';
        
        // Timeout pour détecter si le script ne charge pas
        const loadTimeout = setTimeout(() => {
          devWarn('⚠️ Timeout: Google Translate ne se charge pas (peut être bloqué)');
          showTranslationBlockedMessage(browserLang);
        }, 10000); // 10 secondes de timeout
        
        script.onload = () => {
          clearTimeout(loadTimeout);
          devLog('📥 Script Google Translate chargé avec succès');
        };
        
        script.onerror = (error) => {
          clearTimeout(loadTimeout);
          devWarn('⚠️ Google Translate bloqué par le navigateur/bloqueur de pub', error);
          // Fallback : afficher un message à l'utilisateur
          showTranslationBlockedMessage(browserLang);
        };
        
        // Ajouter le script au document (dans head pour meilleure performance)
        try {
          const head = document.head || document.getElementsByTagName('head')[0];
          if (head) {
            head.appendChild(script);
          } else {
            // Fallback vers body si head n'existe pas
            document.body.appendChild(script);
          }
        } catch (error) {
          devError('❌ Erreur lors de l\'ajout du script:', error);
          showTranslationBlockedMessage(browserLang);
        }
      } else {
        devLog('🇫🇷 MediScan en français (langue par défaut)');
      }
    };
    
    // Utiliser requestAnimationFrame pour s'assurer que l'hydratation est terminée
    // puis attendre un peu plus pour éviter les conflits avec les extensions
    const frameId = requestAnimationFrame(() => {
      setTimeout(() => {
        initTranslation();
      }, 500); // Délai plus long pour stabilité
    });

    return () => {
      cancelAnimationFrame(frameId);
      
      // Nettoyer les observateurs
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (watcherTimeoutRef.current) {
        clearTimeout(watcherTimeoutRef.current);
        watcherTimeoutRef.current = null;
      }
    };
  }, []);

  // Ne pas rendre le composant tant que l'hydratation n'est pas terminée
  // Pour éviter les erreurs d'hydratation, on retourne toujours le même élément
  // mais on ne l'utilise que côté client
  return (
    <div 
      id="google_translate_element_hidden" 
      style={{ display: 'none' }} 
      suppressHydrationWarning
    />
  );
};

export default AutoTranslateWidget;
