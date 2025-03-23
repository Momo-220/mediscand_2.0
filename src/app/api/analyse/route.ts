import { NextRequest, NextResponse } from 'next/server';
import { analyserImageMedicament } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { image } = data;
    
    if (!image) {
      return NextResponse.json(
        { resultat: "Aucune image n'a été fournie. Veuillez réessayer." }
      );
    }
    
    const resultat = await analyserImageMedicament(image);
    
    return NextResponse.json({ resultat });
  } catch (error) {
    console.error("Erreur API:", error);
    
    return NextResponse.json({
      resultat: "Une erreur s'est produite lors de l'analyse de l'image. Veuillez réessayer avec une autre image."
    });
  }
} 