import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurer l'API Gemini avec la clé fournie
const API_KEY = 'AIzaSyB_0L7LtNCmhfqfubj1JW6O0GYjFl5ZTa8';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(req: Request) {
  try {
    // Récupérer l'image de la requête
    const body = await req.json();
    const imageData = body.image;
    
    if (!imageData) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }
    
    console.log('Image reçue, préparation pour analyse...');
    
    // Préparer l'image pour Gemini
    let base64Data = imageData;
    
    // Si l'image a un préfixe data:image, extraire seulement les données base64
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    // Créer le modèle Gemini 1.5 Flash (version actuelle)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Configurer le prompt simplifié
    const prompt = `Analyse cette image de médicament et identifie-le. Fournir toutes les informations dans ce format:
    
Nom: [nom du médicament]
Principe actif: [principe actif]
Dosage: [dosage]
Forme: [forme pharmaceutique]
Laboratoire: [fabricant]
Indications: [indications thérapeutiques]
Posologie: [posologie recommandée]
Effets secondaires: [effets secondaires courants]
Contre-indications: [contre-indications]`;
    
    console.log('Envoi de l\'image à l\'API Gemini...');
    
    // Appeler l'API Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ]);
    
    // Traiter la réponse
    const response = await result.response;
    const text = response.text();
    
    console.log('Réponse reçue de Gemini, traitement...');
    
    if (!text || text.length < 10) {
      throw new Error('Réponse invalide de l\'API Gemini');
    }
    
    // Parser la réponse en format structuré
    const medicament = parseReponseGemini(text);
    
    return NextResponse.json(medicament);
    
  } catch (error) {
    console.error('Erreur d\'analyse:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse du médicament',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        success: 'false'
      }, 
      { status: 500 }
    );
  }
}

// Fonction pour parser la réponse de Gemini
function parseReponseGemini(texte: string): Record<string, string> {
  console.log('Texte reçu de Gemini:', texte);
  
  const medicament: Record<string, string> = {
    nom: '',
    principe_actif: '',
    dosage: '',
    forme: '',
    laboratoire: '',
    indications: '',
    posologie: '',
    effets_secondaires: '',
    contre_indications: ''
  };
  
  // Parser les lignes de la réponse
  const lignes = texte.split('\n').filter(ligne => ligne.trim().length > 0);
  
  for (const ligne of lignes) {
    // Chercher les paires clé: valeur
    const match = ligne.match(/([^:]+):\s*(.*)/);
    
    if (match) {
      const [_, cle, valeur] = match;
      const cleNormalisee = cle.trim().toLowerCase();
      
      // Mapper les clés aux champs de notre objet
      if (cleNormalisee.includes('nom')) {
        medicament.nom = valeur.trim();
      } else if (cleNormalisee.includes('principe actif')) {
        medicament.principe_actif = valeur.trim();
      } else if (cleNormalisee.includes('dosage')) {
        medicament.dosage = valeur.trim();
      } else if (cleNormalisee.includes('forme')) {
        medicament.forme = valeur.trim();
      } else if (cleNormalisee.includes('laboratoire') || cleNormalisee.includes('fabricant')) {
        medicament.laboratoire = valeur.trim();
      } else if (cleNormalisee.includes('indication')) {
        medicament.indications = valeur.trim();
      } else if (cleNormalisee.includes('posologie')) {
        medicament.posologie = valeur.trim();
      } else if (cleNormalisee.includes('effet') && cleNormalisee.includes('secondaire')) {
        medicament.effets_secondaires = valeur.trim();
      } else if (cleNormalisee.includes('contre') && cleNormalisee.includes('indication')) {
        medicament.contre_indications = valeur.trim();
      }
    }
  }
  
  console.log('Médicament identifié:', medicament.nom || 'Non identifié');
  
  return {
    ...medicament,
    success: medicament.nom ? 'true' : 'false',
    message: medicament.nom 
      ? `Médicament identifié: ${medicament.nom}` 
      : 'Aucun médicament identifié dans l\'image'
  };
} 