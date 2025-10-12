// Export de la configuration Supabase
export { supabase } from './config'
export type { SupabaseUser, SupabaseAnalyse, DetailsMedicament } from './config'

// Export des services
export { default as AuthService } from './authService'
export { default as AnalysesService } from './analysesService'
export { default as StorageService } from './storageService'

// Les fonctions sont accessibles via les services (AuthService, AnalysesService, StorageService)
// Pas besoin d'exporter les fonctions individuelles car elles sont des méthodes statiques
