import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configurer l'API Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
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

    // Utiliser le modèle Gemini 2.0 Flash pour une meilleure performance
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
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
  } catch (error) {
    console.error("Erreur lors de l'analyse du médicament:", error);
    
    return NextResponse.json({
      success: false,
      message: "Erreur lors de l'analyse du médicament",
      nom: "Erreur d'analyse",
      description: "Une erreur est survenue lors de l'analyse. Veuillez réessayer."
    }, { status: 500 });
  }
} 