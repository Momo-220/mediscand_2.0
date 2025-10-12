import { supabase } from './config'

/**
 * Service de gestion du stockage de fichiers Supabase
 */
export class StorageService {
  /**
   * Upload d'un fichier vers Supabase Storage
   */
  static async uploadFile(
    file: File,
    bucket: string = 'medicament-images',
    path?: string
  ): Promise<string> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name}`
      const filePath = path ? `${path}/${fileName}` : `${user.id}/${fileName}`

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error: any) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }
  }

  /**
   * Upload d'une image de médicament
   */
  static async uploadMedicamentImage(file: File): Promise<string> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Générer un nom de fichier unique et sécurisé
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Remplacer les caractères spéciaux
      const fileName = `${timestamp}-${sanitizedName}`
      const filePath = `${user.id}/${fileName}`

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from('medicament-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Obtenir l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('medicament-images')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error: any) {
      console.error('Erreur lors de l\'upload du fichier:', error)
      throw error
    }
  }

  /**
   * Supprimer un fichier du stockage
   */
  static async deleteFile(
    filePath: string,
    bucket: string = 'medicament-images'
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur est authentifié
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      // Vérifier que l'utilisateur peut supprimer ce fichier
      if (!filePath.includes(user.id)) {
        throw new Error('Accès non autorisé à ce fichier')
      }

      // Supprimer le fichier
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression du fichier:', error)
      throw error
    }
  }

  /**
   * Obtenir l'URL publique d'un fichier
   */
  static getPublicUrl(filePath: string, bucket: string = 'medicament-images'): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /**
   * Lister les fichiers d'un utilisateur
   */
  static async listUserFiles(
    userId?: string,
    bucket: string = 'medicament-images'
  ): Promise<string[]> {
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

      // Lister les fichiers de l'utilisateur
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(targetUserId)

      if (error) {
        throw error
      }

      return data?.map(file => file.name) || []
    } catch (error: any) {
      console.error('Erreur lors du listing des fichiers:', error)
      return []
    }
  }

  /**
   * Obtenir les informations d'un fichier
   */
  static async getFileInfo(
    filePath: string,
    bucket: string = 'medicament-images'
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        })

      if (error) {
        throw error
      }

      return data?.[0] || null
    } catch (error: any) {
      console.error('Erreur lors de la récupération des infos du fichier:', error)
      return null
    }
  }

  /**
   * Télécharger un fichier
   */
  static async downloadFile(
    filePath: string,
    bucket: string = 'medicament-images'
  ): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath)

      if (error) {
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Erreur lors du téléchargement du fichier:', error)
      throw error
    }
  }

  /**
   * Créer un bucket (nécessite des permissions admin)
   */
  static async createBucket(
    bucketName: string,
    isPublic: boolean = true
  ): Promise<void> {
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du bucket:', error)
      throw error
    }
  }
}

// Export par défaut
export default StorageService
