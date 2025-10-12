import { supabase } from './config'
import { SupabaseAnalyse, DetailsMedicament } from './config'

// Interface pour créer une nouvelle analyse
export interface CreateAnalyseData {
  nom: string
  description?: string
  image_url?: string
  details_analyse?: DetailsMedicament
}

// Interface pour mettre à jour une analyse
export interface UpdateAnalyseData {
  nom?: string
  description?: string
  image_url?: string
  details_analyse?: DetailsMedicament
}

/**
 * Service de gestion des analyses de médicaments
 */
export class AnalysesService {
  /**
   * Sauvegarder une nouvelle analyse
   */
  static async saveAnalyse(analyseData: CreateAnalyseData): Promise<string | null> {
    try {
      console.log('🔄 Début de la sauvegarde de l\'analyse...')
      
      // Vérifier que l'utilisateur est authentifié
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Erreur d\'authentification:', userError)
        throw new Error(`Erreur d'authentification: ${userError.message}`)
      }
      
      if (!user) {
        console.error('❌ Utilisateur non authentifié')
        throw new Error('Utilisateur non authentifié')
      }

      console.log('✅ Utilisateur authentifié:', user.id)

      // Préparer les données pour l'insertion
      const dataToInsert = {
        user_id: user.id,
        nom: analyseData.nom,
        description: analyseData.description,
        image_url: analyseData.image_url,
        details_analyse: analyseData.details_analyse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('📊 Données à insérer:', dataToInsert)

      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('analyses')
        .insert(dataToInsert)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de l\'insertion:', error)
        console.error('❌ Code d\'erreur:', error.code)
        console.error('❌ Message d\'erreur:', error.message)
        console.error('❌ Détails complets:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('✅ Analyse sauvegardée avec succès:', data.id)
      return data.id
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde de l\'analyse:', error)
      throw error
    }
  }

  /**
   * Récupérer les analyses récentes d'un utilisateur
   */
  static async getRecentAnalyses(limit = 10): Promise<SupabaseAnalyse[]> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Récupérer les analyses de l'utilisateur
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      // Mapper details_analyse vers detailsAnalyse pour compatibilité
      return (data || []).map(analyse => ({
        ...analyse,
        detailsAnalyse: analyse.details_analyse
      }))
    } catch (error: any) {
      console.error('Erreur lors de la récupération des analyses:', error)
      return []
    }
  }

  /**
   * Récupérer toutes les analyses d'un utilisateur
   */
  static async getUserAnalyses(userId?: string): Promise<SupabaseAnalyse[]> {
    try {
      let targetUserId = userId

      // Si aucun userId fourni, utiliser l'utilisateur actuel
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Utilisateur non authentifié')
        }
        targetUserId = user.id
      }

      // Récupérer toutes les analyses de l'utilisateur
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Mapper details_analyse vers detailsAnalyse pour compatibilité
      return (data || []).map(analyse => ({
        ...analyse,
        detailsAnalyse: analyse.details_analyse
      }))
    } catch (error: any) {
      console.error('Erreur lors de la récupération des analyses:', error)
      throw error
    }
  }

  /**
   * Récupérer une analyse par son ID
   */
  static async getAnalyseById(analyseId: string): Promise<SupabaseAnalyse | null> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Récupérer l'analyse
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analyseId)
        .eq('user_id', user.id) // S'assurer que l'utilisateur peut accéder à cette analyse
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Analyse non trouvée
        }
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'analyse:', error)
      throw error
    }
  }

  /**
   * Mettre à jour une analyse existante
   */
  static async updateAnalyse(analyseId: string, updateData: UpdateAnalyseData): Promise<void> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Préparer les données de mise à jour
      const dataToUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      }

      // Mettre à jour l'analyse
      const { error } = await supabase
        .from('analyses')
        .update(dataToUpdate)
        .eq('id', analyseId)
        .eq('user_id', user.id) // S'assurer que l'utilisateur peut modifier cette analyse

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'analyse:', error)
      throw error
    }
  }

  /**
   * Supprimer une analyse
   */
  static async deleteAnalyse(analyseId: string): Promise<void> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Supprimer l'analyse
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analyseId)
        .eq('user_id', user.id) // S'assurer que l'utilisateur peut supprimer cette analyse

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'analyse:', error)
      throw error
    }
  }

  /**
   * Compter le nombre d'analyses d'un utilisateur
   */
  static async getAnalysesCount(userId?: string): Promise<number> {
    try {
      let targetUserId = userId

      // Si aucun userId fourni, utiliser l'utilisateur actuel
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Utilisateur non authentifié')
        }
        targetUserId = user.id
      }

      // Compter les analyses
      const { count, error } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)

      if (error) {
        throw error
      }

      return count || 0
    } catch (error: any) {
      console.error('Erreur lors du comptage des analyses:', error)
      return 0
    }
  }
}

// Export par défaut
export default AnalysesService

// Export des fonctions individuelles pour la compatibilité
export const saveAnalyse = AnalysesService.saveAnalyse
export const getRecentAnalyses = AnalysesService.getRecentAnalyses
export const getUserAnalyses = AnalysesService.getUserAnalyses
export const getAnalyseById = AnalysesService.getAnalyseById
export const updateAnalyse = AnalysesService.updateAnalyse
export const deleteAnalyse = AnalysesService.deleteAnalyse
export const getAnalysesCount = AnalysesService.getAnalysesCount
