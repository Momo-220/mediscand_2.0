'use client';
import { useEffect } from 'react';

export const AutoTranslateWidget = () => {
  useEffect(() => {
    // 1. Détection de la langue du navigateur
    const browserLang = navigator.language.split('-')[0]; 
    // Ex: 'en-US' → 'en', 'zh-CN' → 'zh'

    console.log('🌐 Langue détectée pour MediScan:', browserLang);

    // 2. Si ce n'est pas français, activer la traduction IMMÉDIATE
    if (browserLang !== 'fr') {
      
      // 3. Démarrer la traduction immédiatement (sans attendre Google Translate)
      console.log('🚀 Démarrage de la traduction IMMÉDIATE...');
      
      // Masquer l'icône immédiatement
      hideGoogleTranslateIcon();
      
      // Démarrer l'observateur de mutations immédiatement
      startMutationObserver();
      
      // Démarrer la surveillance continue immédiatement
      startContinuousIconWatcher();
      
      // Vérifier si Google Translate est déjà chargé
      if (typeof (window as any).google !== 'undefined' && (window as any).google.translate) {
        console.log('✅ Google Translate déjà chargé - traduction immédiate !');
        initializeTranslation(browserLang);
        return;
      }
      
      // 4. Charger le script Google Translate avec gestion d'erreur
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onload = () => {
        console.log('📥 Script Google Translate chargé avec succès');
      };
      script.onerror = () => {
        console.warn('⚠️ Google Translate bloqué par le navigateur/bloqueur de pub');
        // Fallback : afficher un message à l'utilisateur
        showTranslationBlockedMessage(browserLang);
      };
      document.body.appendChild(script);

      // 4. Initialiser le widget (fonction callback)
      (window as any).googleTranslateElementInit = () => {
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

         // 5. Déclencher la traduction automatique IMMÉDIATEMENT (plus d'attente)
         console.log('⚡ Traduction immédiate déclenchée !');
         initializeTranslation(browserLang);
         
         // 6. Forcer la re-traduction après 1 seconde pour s'assurer que tout est traduit
         setTimeout(() => {
           forceRetranslation(browserLang);
         }, 1000);
         
         // 7. Forcer une deuxième re-traduction après 2 secondes pour les éléments dynamiques
         setTimeout(() => {
           forceRetranslation(browserLang);
         }, 2000);
       };
     } else {
       console.log('🇫🇷 MediScan en français (langue par défaut)');
     }
   }, []);

  // Fonction pour initialiser la traduction
  const initializeTranslation = (browserLang: string) => {
    try {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = browserLang;
        select.dispatchEvent(new Event('change'));
        console.log('✅ MediScan traduit vers', browserLang);
        showTranslationNotification(browserLang);
        
        // Forcer la suppression de l'icône Google Translate après traduction
        setTimeout(() => {
          hideGoogleTranslateIcon();
        }, 1000); // Réduit de 2000ms à 1000ms
        
        // Démarrer la surveillance du contenu non traduit
        startContentWatcher(browserLang);
        
      } else {
        console.log('⏳ Sélecteur Google Translate pas encore prêt, nouvelle tentative...');
        // Réduire l'intervalle de 500ms à 200ms pour une réponse plus rapide
        setTimeout(() => initializeTranslation(browserLang), 200);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la traduction:', error);
      showTranslationBlockedMessage(browserLang);
    }
  };

   // Fonction pour forcer la re-traduction
   const forceRetranslation = (browserLang: string) => {
     try {
       const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
       if (select) {
         // Forcer la re-traduction en changeant temporairement la langue
         const originalValue = select.value;
         select.value = 'fr'; // Revenir au français
         select.dispatchEvent(new Event('change'));
         
         // Puis retraduire vers la langue cible (plus rapide)
         setTimeout(() => {
           select.value = browserLang;
           select.dispatchEvent(new Event('change'));
           console.log('🔄 Re-traduction forcée vers', browserLang);
           
           // Forcer la traduction des éléments React
           forceReactTranslation();
           
           // Masquer à nouveau l'icône (plus rapide)
           setTimeout(() => {
             hideGoogleTranslateIcon();
           }, 500); // Réduit de 1000ms à 500ms
         }, 200); // Réduit de 500ms à 200ms
       }
     } catch (error) {
       console.error('❌ Erreur lors de la re-traduction:', error);
     }
   };

   // Fonction pour forcer la traduction des éléments React
   const forceReactTranslation = () => {
     try {
       // Déclencher un événement personnalisé pour forcer la re-traduction
       const event = new CustomEvent('forceTranslation', {
         detail: { timestamp: Date.now() }
       });
       document.dispatchEvent(event);
       
       // Forcer la re-traduction de tous les éléments textuels
       const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a, label');
       textElements.forEach(element => {
         if (element.textContent && element.textContent.trim()) {
           // Marquer l'élément pour qu'il soit re-traduit
           element.classList.remove('translated');
           element.classList.add('notranslate');
           setTimeout(() => {
             element.classList.remove('notranslate');
           }, 100);
         }
       });
       
       console.log('⚛️ Traduction React forcée');
     } catch (error) {
       console.error('❌ Erreur lors de la traduction React:', error);
     }
   };

   // Fonction pour forcer la suppression de l'icône Google Translate
   const hideGoogleTranslateIcon = () => {
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

       console.log('🎯 Icône Google Translate masquée avec succès (traduction préservée)');
     } catch (error) {
       console.error('❌ Erreur lors du masquage de l\'icône:', error);
     }
   };

   // Fonction pour démarrer l'observateur de mutations
   const startMutationObserver = () => {
     try {
       const observer = new MutationObserver((mutations) => {
         mutations.forEach((mutation) => {
           if (mutation.type === 'childList') {
             mutation.addedNodes.forEach((node) => {
               if (node instanceof HTMLElement) {
                 // Vérifier si le nœud ajouté contient des éléments Google Translate
                 const googleElements = node.querySelectorAll('.goog-te-gadget, .goog-te-gadget-simple, .goog-te-gadget-icon, .goog-te-combo, .skiptranslate');
                 if (googleElements.length > 0 || node.classList.contains('goog-te-gadget') || node.classList.contains('skiptranslate')) {
                   console.log('🔍 Nouvel élément Google Translate détecté, masquage automatique...');
                   hideGoogleTranslateIcon();
                 }
               }
             });
           }
         });
       });

       // Observer les changements dans le body
       observer.observe(document.body, {
         childList: true,
         subtree: true
       });

       console.log('👁️ Observateur de mutations Google Translate démarré');
     } catch (error) {
       console.error('❌ Erreur lors du démarrage de l\'observateur:', error);
     }
   };

   // Fonction pour surveiller le contenu non traduit
   const startContentWatcher = (browserLang: string) => {
     try {
       // Vérifier périodiquement si le contenu est traduit
       const checkInterval = setInterval(() => {
         const untranslatedElements = document.querySelectorAll('*:not(.translated):not(.notranslate)');
         const hasFrenchText = Array.from(untranslatedElements).some(element => {
           const text = element.textContent || '';
           // Mots français courants dans MediScan (liste étendue)
           const frenchWords = ['Analyser', 'Médicament', 'Historique', 'Connexion', 'Inscription', 'PharmaAI', 'Comment ça marche', 'À propos', 
                               'Caméra', 'Télécharger', 'Résultat', 'Dosage', 'Posologie', 'Contre-indication', 'Effets secondaires', 
                               'Interactions', 'Précautions', 'Conservation', 'Laboratoire', 'Forme pharmaceutique', 'Classe thérapeutique',
                               'Indications', 'Se connecter', 'Créer un compte', 'Mot de passe', 'Email', 'Nom', 'Prénom', 'Annuler', 'Valider',
                               'Retour', 'Suivant', 'Précédent', 'Fermer', 'Ouvrir', 'Sauvegarder', 'Supprimer', 'Modifier', 'Rechercher'];
           return frenchWords.some(word => text.includes(word));
         });

         if (hasFrenchText) {
           console.log('🔍 Contenu français détecté, re-traduction...');
           forceRetranslation(browserLang);
         }
       }, 1000); // Vérifier toutes les 1 seconde (plus agressif)

       // Arrêter la surveillance après 60 secondes (plus long)
       setTimeout(() => {
         clearInterval(checkInterval);
         console.log('⏹️ Surveillance du contenu arrêtée');
       }, 60000);

       console.log('👀 Surveillance du contenu non traduit démarrée');
     } catch (error) {
       console.error('❌ Erreur lors du démarrage de la surveillance:', error);
     }
   };

   // Fonction pour surveiller continuellement l'icône Google Translate
   const startContinuousIconWatcher = () => {
     try {
       // Vérifier toutes les 200ms pendant 60 secondes (plus agressif)
       const checkInterval = setInterval(() => {
         hideGoogleTranslateIcon();
       }, 200);

       // Arrêter la surveillance après 60 secondes
       setTimeout(() => {
         clearInterval(checkInterval);
         console.log('⏹️ Surveillance continue de l\'icône arrêtée');
       }, 60000);

       console.log('🔄 Surveillance continue de l\'icône Google Translate démarrée');
     } catch (error) {
       console.error('❌ Erreur lors du démarrage de la surveillance continue:', error);
     }
   };

   // Fonction pour afficher la notification de traduction
   const showTranslationNotification = (browserLang: string) => {
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
     const notification = document.createElement('div');
     notification.innerHTML = `⚠️ Traduction bloquée - Désactivez votre bloqueur de pub pour traduire en ${getLanguageName(browserLang)}`;
     notification.style.cssText = `
       position: fixed;
       top: 20px;
       right: 20px;
       background: linear-gradient(135deg, #F59E0B, #D97706);
       color: white;
       padding: 12px 20px;
       border-radius: 25px;
       font-size: 14px;
       font-weight: 500;
       box-shadow: 0 4px 15px rgba(0,0,0,0.2);
       z-index: 9999;
       animation: slideIn 0.3s ease-out;
       max-width: 300px;
     `;
     document.body.appendChild(notification);
     
     setTimeout(() => {
       notification.style.animation = 'slideOut 0.3s ease-in';
       setTimeout(() => notification.remove(), 300);
     }, 5000);
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

  // 6. Conteneur invisible pour le widget Google Translate
  return <div id="google_translate_element_hidden" style={{ display: 'none' }} />;
};

export default AutoTranslateWidget;
