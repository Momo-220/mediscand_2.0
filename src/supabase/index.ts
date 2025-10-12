// Export de la configuration Supabase
export { supabase } from './config'
export type { SupabaseUser, SupabaseAnalyse, DetailsMedicament } from './config'

// Export des services
export { default as AuthService } from './authService'
export { default as AnalysesService } from './analysesService'
export { default as StorageService } from './storageService'

// Export des fonctions individuelles pour faciliter l'utilisation
export {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  resetPassword,
  getCurrentUser,
  getCurrentSession,
  onAuthStateChange,
  isAuthenticated
} from './authService'

export {
  saveAnalyse,
  getRecentAnalyses,
  getUserAnalyses,
  getAnalyseById,
  updateAnalyse,
  deleteAnalyse,
  getAnalysesCount
} from './analysesService'

export {
  uploadFile,
  uploadMedicamentImage,
  deleteFile,
  getPublicUrl,
  listUserFiles,
  getFileInfo,
  downloadFile
} from './storageService'
