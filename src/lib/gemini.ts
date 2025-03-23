import { GoogleGenerativeAI } from "@google/generative-ai";

// Récupération de la clé API depuis les variables d'environnement
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Vérification de la présence de la clé API
if (!API_KEY) {
  console.error("❌ Aucune clé API Gemini n'a été trouvée");
} else {
  console.log("✅ Clé API trouvée:", API_KEY.substring(0, 5) + "...");
}

// Initialisation du client Gemini
export const genAI = new GoogleGenerativeAI(API_KEY || "");

// Fonction pour analyser une image et obtenir des informations sur un médicament
export async function analyserImageMedicament(imageBase64: string): Promise<string> {
  try {
    console.log("🔍 Début de l'analyse de l'image...");

    if (!API_KEY) {
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

    // Initialiser le modèle avec des configurations appropriées
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1500,
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
      const result = await model.generateContent([
        { text: prompt },
        imagePart
      ]);

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