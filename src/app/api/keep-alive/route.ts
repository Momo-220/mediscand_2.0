import { NextResponse } from 'next/server'
import { supabase } from '@/supabase/config'

/**
 * Route API pour maintenir Supabase actif
 * Cette route peut être appelée périodiquement par un service externe
 * (comme cron-job.org, UptimeRobot, etc.) pour éviter que Supabase ne s'éteigne
 */
export async function GET() {
  try {
    // Effectuer une requête simple pour maintenir la connexion active
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    // Si la table profiles n'existe pas ou retourne une erreur,
    // on essaie une requête d'authentification qui est toujours disponible
    if (error) {
      const { error: authError } = await supabase.auth.getSession()
      
      if (authError && authError.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        throw authError
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase est actif',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Erreur keep-alive:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la vérification Supabase',
        error: error.message
      },
      { status: 500 }
    )
  }
}
