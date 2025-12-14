import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configurer l'API Gemini
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    // Vérifier si la clé API est configurée
    if (!apiKey) {
      console.error("❌ Clé API Gemini manquante");
      return NextResponse.json({
        success: false,
        message: "Configuration manquante : Clé API Gemini non trouvée",
        nom: "Erreur de configuration",
        description: "Veuillez configurer la clé API Gemini dans les variables d'environnement."
      }, { status: 500 });
    }
    // Vérification de la méthode
    if (request.method !== "POST") {
      return NextResponse.json({
        success: false,
        message: "Méthode non autorisée",
      }, { status: 405 });
    }

    // Récupérer le FormData avec l'image
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({
        success: false,
        message: "Aucune image fournie",
      }, { status: 400 });
    }

    // Convertir l'image pour Gemini
    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString("base64");

    // Utiliser le modèle Gemini 2.5 Flash (dernière version stable, performant pour images)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Définir le prompt pour l'analyse de médicaments, optimisé pour Gemini 2.0 Flash
    const prompt = `
      Analyse cette image de médicament et identifie-le avec précision.
      Fournis les informations suivantes au format JSON strict:
      
      {
        "nom": "nom commercial du médicament",
        "description": "brève description du médicament et son usage principal",
        "nomCommercial": "nom commercial complet avec dosage",
        "laboratoire": "fabricant du médicament",
        "dci": "principe(s) actif(s) / Dénomination Commune Internationale",
        "formePharmaceutique": "comprimé, gélule, sirop, etc.",
        "dosage": "quantité de principe actif",
        "classeTherapeutique": "catégorie pharmacologique",
        "indicationsTherapeutiques": "pathologies traitées et usages thérapeutiques",
        "posologie": "instructions de prise et dosage recommandé",
        "contreIndications": "situations où ce médicament ne doit pas être utilisé",
        "effetsSecondaires": "effets indésirables possibles",
        "interactions": "interactions avec d'autres médicaments ou substances",
        "precautionsEmploi": "précautions particulières à prendre",
        "conservation": "conditions de conservation"
      }
      
      Si tu ne peux pas identifier le médicament avec certitude, réponds avec:
      {"nom": "Médicament non identifié", "description": "L'image ne permet pas d'identifier le médicament avec certitude."}
      
      IMPORTANTE: Réponds UNIQUEMENT avec le JSON formaté, sans texte supplémentaire.
    `;

    // Générer la réponse
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const responseText = response.text();
    
    console.log("Réponse Gemini brute:", responseText.substring(0, 200) + "...");
    
    // Essayer de parser la réponse JSON
    try {
      // Nettoyer la réponse pour extraire uniquement le JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText.trim();
      
      const jsonResponse = JSON.parse(jsonString);
      
      // Retourner les informations extraites
      return NextResponse.json({
        success: true,
        ...jsonResponse
      }, { status: 200 });
    } catch (parseError) {
      console.error("Erreur lors du parsing JSON:", parseError);
      // Si le parsing échoue, retourner le texte brut
      return NextResponse.json({
        success: false,
        message: "Impossible de traiter la réponse",
        nom: "Médicament non identifié",
        description: "L'analyse n'a pas pu être complétée. Veuillez réessayer avec une image plus claire.",
        rawResponse: responseText.substring(0, 500) // Pour le débogage
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de l'analyse du médicament:", error);
    
    // Gestion spécifique des erreurs d'API Gemini
    let errorMessage = "Une erreur est survenue lors de l'analyse.";
    let statusCode = 500;
    
    if (error.message?.includes("API key")) {
      errorMessage = "Clé API invalide ou expirée.";
      statusCode = 401;
    } else if (error.message?.includes("quota")) {
      errorMessage = "Quota d'API dépassé. Veuillez réessayer plus tard.";
      statusCode = 429;
    } else if (error.message?.includes("SAFETY")) {
      errorMessage = "Contenu bloqué pour des raisons de sécurité.";
      statusCode = 400;
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "Problème de connexion réseau.";
      statusCode = 503;
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage,
      nom: "Erreur d'analyse",
      description: errorMessage + " Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
} 