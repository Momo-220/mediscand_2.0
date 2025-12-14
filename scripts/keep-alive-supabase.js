// Script de keep-alive pour maintenir Supabase actif
// Ce script envoie des requêtes périodiques à Supabase pour éviter qu'il ne s'éteigne

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Intervalle entre les requêtes (en millisecondes)
// Par défaut: 10 minutes (600000 ms)
// Vous pouvez ajuster selon vos besoins
const INTERVAL_MS = parseInt(process.env.KEEP_ALIVE_INTERVAL || '600000', 10);

let requestCount = 0;
let errorCount = 0;

/**
 * Effectue une requête de ping vers Supabase
 */
async function pingSupabase() {
  try {
    requestCount++;
    const timestamp = new Date().toLocaleString('fr-FR');
    
    console.log(`[${timestamp}] 🔄 Ping #${requestCount} - Vérification de la connexion Supabase...`);
    
    // Effectuer une requête simple pour maintenir la connexion active
    // On fait une requête sur une table qui existe toujours (comme profiles)
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      // Si la table n'existe pas, on essaie une autre approche
      // On fait juste une requête d'authentification qui est toujours disponible
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError && authError.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        throw authError;
      }
    }
    
    console.log(`[${timestamp}] ✅ Supabase est actif et répond correctement`);
    errorCount = 0; // Réinitialiser le compteur d'erreurs en cas de succès
    
  } catch (error) {
    errorCount++;
    const timestamp = new Date().toLocaleString('fr-FR');
    console.error(`[${timestamp}] ❌ Erreur lors du ping Supabase:`, error.message);
    
    // Si trop d'erreurs consécutives, arrêter le script
    if (errorCount >= 5) {
      console.error('❌ Trop d\'erreurs consécutives. Arrêt du script.');
      process.exit(1);
    }
  }
}

/**
 * Fonction principale
 */
async function startKeepAlive() {
  console.log('🚀 Démarrage du keep-alive Supabase...');
  console.log(`📊 Intervalle: ${INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`🔗 URL Supabase: ${supabaseUrl}`);
  console.log('💡 Appuyez sur Ctrl+C pour arrêter\n');
  
  // Faire un premier ping immédiatement
  await pingSupabase();
  
  // Puis faire des pings périodiques
  setInterval(async () => {
    await pingSupabase();
  }, INTERVAL_MS);
}

// Gérer l'arrêt propre du script
process.on('SIGINT', () => {
  console.log('\n\n🛑 Arrêt du keep-alive Supabase...');
  console.log(`📊 Total de requêtes: ${requestCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Arrêt du keep-alive Supabase...');
  process.exit(0);
});

// Démarrer le keep-alive
startKeepAlive().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
