import { 
  GoogleGenerativeAI, 
  GenerativeModel,
  HarmCategory, 
  HarmBlockThreshold,
  ChatSession
} from '@google/generative-ai';

// Récupérer la clé API Gemini depuis les variables d'environnement
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Vérifier que la clé API est disponible
if (!apiKey) {
  console.warn('Clé API Gemini non trouvée. Veuillez définir NEXT_PUBLIC_GEMINI_API_KEY dans vos variables d\'environnement.');
}

// Initialiser le client Gemini
const genAI = new GoogleGenerativeAI(apiKey);

// Instruction système pour PharmaAI
const SYSTEM_INSTRUCTION = `Tu es PharmaAI, un assistant pharmaceutique intelligent conçu pour aider les utilisateurs avec des questions sur les médicaments et la santé.

Règles importantes:
1. Réponds toujours en français
2. Fournis des informations précises et factuelles sur les médicaments
3. Ne donne jamais de conseils médicaux personnalisés qui remplaceraient l'avis d'un médecin
4. Pour les questions hors de ton domaine, indique poliment que tu es spécialisé en information pharmaceutique
5. Sois empathique, professionnel et utile
6. Ne transmets pas d'informations potentiellement dangereuses sur le mésusage des médicaments
7. Si tu n'es pas sûr d'une information, admets-le clairement`;

// Configurer le modèle Gemini pour le chat
// Utilisation de Gemini 2.5 Flash (dernière version, performant)
const modelConfig = {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 16,
    maxOutputTokens: 2048,
  }
};

// Variables globales pour la gestion du chat
let model: GenerativeModel;
let chat: ChatSession | null = null;
let isGenerating = false;
let abortController: AbortController | null = null;

/**
 * Initialiser une nouvelle session de chat avec l'API Gemini
 */
export async function initChat(): Promise<void> {
  try {
    // Initialiser le modèle avec la configuration
    model = genAI.getGenerativeModel(modelConfig);
    
    // Créer une nouvelle session de chat
    chat = model.startChat();
    
    // Envoyer le message initial pour configurer le comportement
    const result = await chat.sendMessage([
      {
        text: "Tu es PharmaAI, un assistant pharmaceutique intelligent qui répond en français et donne des informations précises sur les médicaments."
      }
    ]);
    
    // Vérifier que le chat a été créé avec succès
    if (!chat || !result) {
      throw new Error('Échec de l\'initialisation du chat');
    }
    
    console.log('Chat Gemini initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du chat Gemini:', error);
    throw error;
  }
}

/**
 * Envoyer un message à l'API Gemini et gérer la réponse
 */
export async function sendMessage(
  message: string,
  onPartialResponse?: (text: string) => void
): Promise<{ text: string; error?: string }> {
  if (!chat) {
    await initChat();
  }

  if (isGenerating) {
    return { text: '', error: 'Une génération est déjà en cours' };
  }
  
  isGenerating = true;
  abortController = new AbortController();
  
  try {
    if (!chat) {
      throw new Error('Chat non initialisé');
    }
    
    let fullResponse = '';
    const result = await chat.sendMessageStream(message);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      
      if (onPartialResponse) {
        onPartialResponse(fullResponse);
      }
    }
    
    return { text: fullResponse };
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du message:', error);
    
    if (error.name === 'AbortError') {
      return { text: '', error: 'Génération annulée' };
    }
    
    return { text: '', error: error.message || 'Une erreur est survenue' };
  } finally {
    isGenerating = false;
    abortController = null;
  }
}

/**
 * Annuler une génération en cours
 */
export function cancelGeneration(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  
  isGenerating = false;
  console.log('Génération annulée');
}

// Fonction pour analyser une image et obtenir des informations sur un médicament
export async function analyserImageMedicament(imageBase64: string): Promise<string> {
  try {
    console.log("🔍 Début de l'analyse de l'image...");

    if (!apiKey) {
      return "❌ Erreur : Aucune clé API Gemini n'a été configurée. Veuillez ajouter votre clé API dans le fichier .env.local";
    }

    if (!imageBase64) {
      return "❌ Erreur : Aucune image n'a été fournie";
    }

    // Traitement du base64
    let base64Image = imageBase64;
    if (imageBase64.includes('data:image')) {
      const parts = imageBase64.split(',');
      if (parts.length > 1) {
        base64Image = parts[1];
      }
    }

    console.log("📏 Taille de l'image:", base64Image.length, "caractères");

    // Vérification de la taille de l'image
    if (base64Image.length > 5000000) {
      return "❌ Erreur : L'image est trop volumineuse. Veuillez utiliser une image plus petite.";
    }

    // Vérification de la validité du base64
    try {
      atob(base64Image);
    } catch (e) {
      return "❌ Erreur : L'image fournie n'est pas dans un format valide";
    }

    console.log("✅ Image validée, initialisation du modèle Gemini...");

    // Initialiser le modèle avec des configurations optimisées pour la vitesse
    // Utilisation de Gemini 2.5 Flash (dernière version, performant)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1, // Plus déterministe = plus rapide
        topK: 16, // Réduit pour plus de vitesse
        topP: 0.8, // Réduit pour plus de vitesse
        maxOutputTokens: 1000, // Réduit pour plus de vitesse
      }
    });

    // Création de la partie image
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image
      }
    };

    // Création du prompt enrichi pour plus d'informations
    const prompt = `Tu es un pharmacien expert. Identifie ce médicament à partir de l'image et fais une analyse COMPLÈTE avec toutes les informations médicales importantes.

Pour les informations qui ne sont pas visibles sur l'image, utilise tes connaissances pharmaceutiques pour compléter avec les informations EXACTES et PRÉCISES pour ce médicament spécifique. Ne laisse AUCUNE information manquante.

Présente les résultats dans ce format tableau:

| Nom commercial | [nom exact du médicament] |
| Laboratoire | [nom du fabricant/laboratoire] |
| Principes actifs | [tous les principes actifs avec leurs dosages précis] |
| Forme galénique | [comprimé, gélule, solution, etc.] |
| Indications | [liste complète des indications thérapeutiques] |
| Posologie | [posologie détaillée pour différents cas] |
| Effets secondaires | [effets secondaires fréquents et graves] |
| Contre-indications | [toutes les contre-indications importantes] |
| Interactions | [interactions médicamenteuses principales] |
| Conservation | [conditions de conservation] |
| Classification | [classe thérapeutique et pharmacologique] |
| Prix approximatif | [prix moyen en pharmacie] |

Si tu ne peux pas identifier le médicament avec certitude, fais une estimation éducative en te basant sur ses caractéristiques visuelles, mais ÉVITE de mentionner tout doute dans ta réponse finale.

Réponds uniquement en français et assure-toi que TOUTES les informations sont fournies pour chaque catégorie.`;

    console.log("🚀 Envoi de la requête à l'API Gemini...");

    try {
      // Ajouter un timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: L\'API Gemini prend trop de temps à répondre')), 30000); // 30 secondes max
      });

      const generatePromise = model.generateContent([
        { text: prompt },
        imagePart
      ]);

      const result = await Promise.race([generatePromise, timeoutPromise]) as any;

      console.log("📥 Réponse reçue de l'API Gemini");

      if (!result || !result.response) {
        return "❌ Erreur : Aucune réponse n'a été reçue de l'API";
      }

      const text = result.response.text();
      if (!text) {
        return "❌ Erreur : La réponse reçue est vide";
      }

      console.log("✨ Analyse terminée avec succès");
      console.log("Début de la réponse:", text.substring(0, 50) + "...");
      return text;

    } catch (apiError: any) {
      console.error("Erreur API détaillée:", apiError);
      
      // Vérification des erreurs spécifiques à l'API
      if (apiError.message?.includes("SAFETY")) {
        return "❌ Erreur : Le contenu a été bloqué pour des raisons de sécurité. Veuillez utiliser une image de médicament.";
      }
      
      if (apiError.message?.includes("quota")) {
        return "❌ Erreur : Quota d'API dépassé. Veuillez réessayer plus tard.";
      }
      
      if (apiError.message?.includes("invalid")) {
        return "❌ Erreur : Requête invalide. Veuillez vérifier le format de l'image.";
      }
      
      if (apiError.message?.includes("Not Found")) {
        return "❌ Erreur : Le modèle d'IA n'est pas disponible. Veuillez contacter l'administrateur du site.";
      }
      
      return `❌ Erreur lors de l'appel à l'API: ${apiError.message}`;
    }

  } catch (error: any) {
    console.error("❌ Erreur détaillée:", error);
    
    // Log complet de l'erreur pour le débogage
    console.error("Erreur complète:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return "❌ Une erreur s'est produite lors de l'analyse. Veuillez vérifier que l'image est claire et réessayer.";
  }
} 