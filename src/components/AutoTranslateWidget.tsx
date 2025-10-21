'use client';
import { useEffect } from 'react';

export const AutoTranslateWidget = () => {
  useEffect(() => {
    // 1. Détection de la langue du navigateur
    const browserLang = navigator.language.split('-')[0]; 
    // Ex: 'en-US' → 'en', 'zh-CN' → 'zh'

    console.log('🌐 Langue détectée pour MediScan:', browserLang);

    // 2. Si ce n'est pas français, activer la traduction
    if (browserLang !== 'fr') {
      
      // 3. Charger le script Google Translate
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
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

        // 5. Déclencher la traduction automatique après 1.5 secondes
        // (Délai plus long pour laisser MediScan se charger)
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (select) {
            select.value = browserLang;  // Ex: 'en', 'zh', 'ar', 'es'
            select.dispatchEvent(new Event('change')); // ⚡ Traduction !
            console.log('✅ MediScan traduit vers', browserLang);
            
            // Notification discrète pour l'utilisateur
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
            
            // Supprimer la notification après 3 secondes
            setTimeout(() => {
              notification.style.animation = 'slideOut 0.3s ease-in';
              setTimeout(() => notification.remove(), 300);
            }, 3000);
          }
        }, 1500);
      };
    } else {
      console.log('🇫🇷 MediScan en français (langue par défaut)');
    }
  }, []);

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
