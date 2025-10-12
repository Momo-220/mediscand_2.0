import { supabase } from './config'
import { User, Session } from '@supabase/supabase-js'

// Interface pour les données de connexion
export interface LoginData {
  email: string
  password: string
}

// Interface pour les données d'inscription
export interface SignUpData {
  email: string
  password: string
  displayName?: string
}

/**
 * Service d'authentification Supabase
 */
export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async signUp({ email, password, displayName }: SignUpData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || ''
          }
        }
      })

      if (error) {
        throw error
      }

      return { user: data.user, session: data.session }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error)
      throw error
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async signIn({ email, password }: LoginData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return { user: data.user, session: data.session }
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error)
      throw error
    }
  }

  /**
   * Connexion avec Google
   */
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Erreur lors de la connexion Google:', error)
      throw error
    }
  }

  /**
   * Déconnexion
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error)
      throw error
    }
  }

  /**
   * Réinitialisation de mot de passe
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error)
      throw error
    }
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      return null
    }
  }

  /**
   * Obtenir la session actuelle
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error)
      return null
    }
  }

  /**
   * Écouter les changements d'état d'authentification
   */
  static onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null, session)
    })
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return !!user
  }
}

// Export par défaut
export default AuthService
