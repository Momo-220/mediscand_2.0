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

    // Utiliser le modèle Gemini pour analyser l'image
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
    });

    // Définir le prompt pour l'analyse de médicaments
    const prompt = `
      Analyse cette image de médicament et fournis une analyse détaillée. 
      Identifie le médicament et donne les informations suivantes dans un format structuré JSON:
      
      1. nom (nom commercial du médicament)
      2. description (brève description du médicament et son usage)
      3. nomCommercial (le nom commercial complet)
      4. laboratoire (le fabricant)
      5. dci (Dénomination Commune Internationale, le principe actif)
      6. formePharmaceutique (comprimé, gélule, etc.)
      7. dosage (dosage du principe actif)
      8. classeTherapeutique (type de médicament et action)
      9. indicationsTherapeutiques (à quoi sert le médicament)
      10. posologie (comment le prendre)
      11. conservation (comment conserver le médicament)
      
      SI TU N'ARRIVES PAS À IDENTIFIER LE MÉDICAMENT DE FAÇON SÛRE, réponds uniquement avec:
      {
        "nom": "Médicament non identifié", 
        "description": "L'image ne permet pas d'identifier le médicament avec certitude."
      }
      
      RÉPONDS UNIQUEMENT AVEC UN OBJET JSON VALIDE, SANS COMMENTAIRES ADDITIONNELS.
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
    
    // Essayer de parser la réponse JSON
    try {
      const jsonResponse = JSON.parse(responseText.trim());
      
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
        description: "L'analyse n'a pas pu être complétée. Veuillez réessayer avec une image plus claire."
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