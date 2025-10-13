// Script pour tester les modèles Gemini disponibles
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Clé API Gemini manquante');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Liste des modèles à tester
const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b', 
  'gemini-1.5-flash-001',
  'gemini-1.0-pro',
  'gemini-1.0-pro-001',
  'gemini-pro',
  'gemini-pro-vision'
];

async function testModel(modelName) {
  try {
    console.log(`🧪 Test du modèle: ${modelName}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("Test simple");
    
    if (result && result.response && result.response.text()) {
      console.log(`✅ ${modelName} - Fonctionne !`);
      return true;
    } else {
      console.log(`❌ ${modelName} - Pas de réponse`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${modelName} - Erreur: ${error.message}`);
    return false;
  }
}

async function testAllModels() {
  console.log('🔍 Test de tous les modèles Gemini disponibles...\n');
  
  const workingModels = [];
  
  for (const model of modelsToTest) {
    const works = await testModel(model);
    if (works) {
      workingModels.push(model);
    }
    console.log(''); // Ligne vide
  }
  
  console.log('📊 Résumé:');
  if (workingModels.length > 0) {
    console.log('✅ Modèles fonctionnels:');
    workingModels.forEach(model => console.log(`   - ${model}`));
  } else {
    console.log('❌ Aucun modèle ne fonctionne');
  }
}

testAllModels().catch(console.error);

