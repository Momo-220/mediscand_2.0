// Script de test pour vérifier la connexion Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Test de connexion Supabase...');
console.log('URL:', supabaseUrl);
console.log('Clé:', supabaseKey ? 'Présente' : 'Manquante');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    // Test 1: Vérifier la connexion
    console.log('\n🧪 Test 1: Connexion à Supabase');
    const { data, error } = await supabase.from('analyses').select('count(*)').limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error);
    } else {
      console.log('✅ Connexion réussie');
    }

    // Test 2: Vérifier l'authentification
    console.log('\n🧪 Test 2: État d\'authentification');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError);
    } else if (user) {
      console.log('✅ Utilisateur connecté:', user.id);
    } else {
      console.log('⚠️ Aucun utilisateur connecté');
    }

    // Test 3: Vérifier les tables
    console.log('\n🧪 Test 3: Vérification des tables');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'analyses']);
    
    if (tablesError) {
      console.error('❌ Erreur lors de la vérification des tables:', tablesError);
    } else {
      console.log('✅ Tables trouvées:', tables.map(t => t.table_name));
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testSupabase();
