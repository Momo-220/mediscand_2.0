import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')

  console.log('🔐 Callback OAuth reçu:', { code: !!code, accessToken: !!accessToken, refreshToken: !!refreshToken })

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('❌ Erreur lors de l\'échange du code:', error)
      } else {
        console.log('✅ Session échangée avec succès')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code:', error)
    }
  }

  // Si on a des tokens dans l'URL (redirection directe), on les traite côté client
  if (accessToken && refreshToken) {
    console.log('🔑 Tokens détectés dans l\'URL, redirection vers l\'app')
    // Rediriger vers l'app avec les tokens dans l'URL pour traitement côté client
    return NextResponse.redirect(`${requestUrl.origin}/?access_token=${accessToken}&refresh_token=${refreshToken}`)
  }

  // Rediriger vers la page principale après authentification
  return NextResponse.redirect(`${requestUrl.origin}/`)
}




