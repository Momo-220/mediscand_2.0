// Utilitaire pour masquer tous les logs en production
// Ce fichier centralise la gestion des logs pour toute l'application

const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.includes('vercel.app') ||
   process.env.NODE_ENV === 'development');

// En production, ces fonctions ne font rien du tout - AUCUN log visible
export const devLog = (...args: any[]) => {
  // Ne rien faire en production - logs complètement masqués
  // Les utilisateurs ne verront plus aucun log dans la console F12
};

export const devError = (...args: any[]) => {
  // Ne rien faire en production - erreurs complètement masquées
  // Les erreurs ne s'affichent plus dans la console F12
};

export const devWarn = (...args: any[]) => {
  // Ne rien faire en production - warnings complètement masqués
  // Les warnings ne s'affichent plus dans la console F12
};

export const devInfo = (...args: any[]) => {
  // Ne rien faire en production - infos complètement masquées
  // Les infos ne s'affichent plus dans la console F12
};

// Fonction pour masquer complètement console.log, console.error, etc. en production
export const hideConsoleInProduction = () => {
  if (!isDevelopment && typeof window !== 'undefined') {
    // Remplacer toutes les méthodes de console par des fonctions vides
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.trace = () => {};
    console.table = () => {};
    console.group = () => {};
    console.groupEnd = () => {};
    console.time = () => {};
    console.timeEnd = () => {};
    console.count = () => {};
    console.clear = () => {};
  }
};
