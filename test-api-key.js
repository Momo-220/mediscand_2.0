// Test simple de la clé API Gemini
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

console.log('🔍 Test de la clé API Gemini...');
console.log('Clé API:', apiKey ? `${apiKey.substring(0, 20)}...` : 'MANQUANTE');

if (!apiKey) {
  console.error('❌ Clé API manquante dans .env.local');
  console.log('Ajoutez: NEXT_PUBLIC_GEMINI_API_KEY=votre-clé');
  process.exit(1);
}

// Test simple avec fetch
async function testApiKey() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Clé API valide !');
      console.log('📊 Modèles disponibles:', data.models?.length || 0);
      
      if (data.models) {
        console.log('🎯 Premiers modèles:');
        data.models.slice(0, 5).forEach(model => {
          console.log(`   - ${model.name}`);
        });
      }
    } else {
      console.error('❌ Clé API invalide ou problème de quota');
      console.error('Status:', response.status);
      console.error('Message:', await response.text());
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testApiKey();
