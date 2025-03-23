"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { loginUser, registerUser, resetPassword, signInWithGoogle } from '../firebase/userService';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginForm({ onClose, onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    
    try {
      setIsLoading(true);
      await loginUser(email, password);
      toast.success('Connexion réussie !');
      onLoginSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      let errorMessage = 'Erreur lors de la connexion.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives échouées. Veuillez réessayer plus tard.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    try {
      setIsLoading(true);
      await registerUser(email, password);
      toast.success('Compte créé avec succès !');
      onLoginSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      let errorMessage = 'Erreur lors de la création du compte.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé par un autre compte.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format d\'email invalide.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success('Connexion réussie !');
      onLoginSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur de connexion avec Google:', error);
      toast.error('Erreur lors de la connexion avec Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Veuillez entrer votre adresse email.');
      return;
    }
    
    try {
      setIsLoading(true);
      await resetPassword(email);
      toast.success('Email de réinitialisation envoyé. Vérifiez votre boîte de réception.');
    } catch (error: any) {
      console.error('Erreur de réinitialisation:', error);
      let errorMessage = 'Erreur lors de l\'envoi de l\'email de réinitialisation.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte n\'est associé à cet email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format d\'email invalide.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/75 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white border border-gray-800"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
      >
        <div className="p-8 space-y-6">
          {/* Logo et titre */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-20 h-20 mb-4 relative rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-950 p-1 flex items-center justify-center">
                <Image 
                  src="/images/logo-app.png"
                  alt="MediScan Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isSignUp ? 'Créer un compte' : 'Connexion'}
            </h2>
          </div>
          
          {/* Formulaire de connexion/inscription */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">Adresse email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="Votre adresse email"
                required
              />
            </div>
            
            {isSignUp || (
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  placeholder="Mot de passe"
                  required
                />
              </div>
            )}
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Chargement...' : 'Continuer'}
            </motion.button>
          </form>
          
          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/60"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-gray-900 to-gray-950 text-gray-400">OU</span>
            </div>
          </div>
          
          {/* Connexion avec Google */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-70 font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continuer avec Google</span>
          </motion.button>
          
          {/* Liens de navigation */}
          <div className="space-y-3 mt-4">
            {/* Lien pour changer de mode */}
            <div className="text-center text-sm text-gray-400">
              {isSignUp ? (
                <p>
                  Déjà un compte?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                  >
                    Se connecter
                  </button>
                </p>
              ) : (
                <p>
                  Pas encore de compte?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                  >
                    S'inscrire
                  </button>
                </p>
              )}
            </div>
            
            {/* Mot de passe oublié */}
            {!isSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                >
                  Mot de passe oublié?
                </button>
              </div>
            )}
          </div>
          
          {/* Bouton de fermeture */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 