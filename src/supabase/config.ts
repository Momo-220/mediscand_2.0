import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Vérifier que les variables d'environnement sont configurées
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables d\'environnement Supabase manquantes. Veuillez configurer NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types TypeScript pour la base de données
export interface User {
  id: string
  email?: string
  created_at?: string
  updated_at?: string
}

export interface AnalyseMedicament {
  id: string
  user_id: string
  nom: string
  description?: string
  image_url?: string
  details_analyse?: any
  created_at: string
  updated_at: string
}

// Types pour les détails de médicament
export interface DetailsMedicament {
  nomCommercial: string
  laboratoire: string
  dci: string
  formePharmaceutique: string
  dosage: string
  classeTherapeutique: string
  indicationsTherapeutiques: string
  posologie: string
  contreIndications: string
  effetsSecondaires: string
  interactions: string
  precautionsEmploi: string
  conservation: string
  [key: string]: string
}

// Export des types
export type { User as SupabaseUser, AnalyseMedicament as SupabaseAnalyse }
