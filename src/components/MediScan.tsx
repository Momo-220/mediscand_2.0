"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { devLog, devError, hideConsoleInProduction } from '../utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import Camera from './Camera';
import UploadImage from './UploadImage';
import ResultatAnalyse from './ResultatAnalyse';
import HowItWorksSection from './HowItWorksSection';
import Image from 'next/image';
import { Toaster, toast } from 'react-hot-toast';
import HistoriqueAnalyses from './HistoriqueAnalyses';
import LoginForm from './LoginForm';
// import PharmaAI from './PharmaAI'; // Temporairement désactivé
import AboutPage from './AboutPage';
import SplashScreen from './SplashScreen';
import { AuthService, AnalysesService, StorageService, SupabaseAnalyse } from '../supabase';
import type { User } from '@supabase/supabase-js';
import AutoTranslateWidget from './AutoTranslateWidget';

enum Etape {
  ACCUEIL = 'ACCUEIL',
  CAPTURE = 'CAPTURE',
  ANALYSE = 'ANALYSE',
  RESULTAT = 'RESULTAT',
  HISTORIQUE = 'HISTORIQUE',
  CAMERA = 'CAMERA'
  // PHARMA_AI = 'PHARMA_AI' // Temporairement désactivé
}

// Définir l'interface AnalyseResultat
interface DetailsMedicament {
  nomCommercial: string;
  laboratoire: string;
  dci: string;
  formePharmaceutique: string;
  dosage: string;
  classeTherapeutique: string;
  indicationsTherapeutiques: string;
  posologie: string;
  contreIndications: string;
  effetsSecondaires: string;
  interactions: string;
  precautionsEmploi: string;
  conservation: string;
  [key: string]: string; // Pour les champs supplémentaires potentiels
}

interface AnalyseResultat {
  nom?: string;
  description?: string;
  image?: string;
  error?: string;
  detailsAnalyse?: DetailsMedicament;
}

export default function MediScan() {
  const [etape, setEtape] = useState<Etape>(Etape.ACCUEIL);
  const [imageData, setImageData] = useState<string | null>(null);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showHistorique, setShowHistorique] = useState<boolean>(false);
  const [selectedAnalyse, setSelectedAnalyse] = useState<SupabaseAnalyse | null>(null);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [showAboutPage, setShowAboutPage] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);
  const [freeAnalysesCount, setFreeAnalysesCount] = useState<number>(0);
  const FREE_ANALYSES_LIMIT = 3;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErreur(null);

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image est trop volumineuse. Taille maximum : 5MB');
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setImageData(base64Image);
        await analyserImage(file);
      };
      reader.onerror = () => {
        throw new Error('Erreur lors de la lecture du fichier');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const analyserImage = async (fileOrBase64: File | string): Promise<AnalyseResultat> => {
    setEtape(Etape.ANALYSE);
    try {
      // Vérifier si l'utilisateur peut analyser (soit connecté, soit dans la limite gratuite)
      if (!user) {
        // Mode essai gratuit : vérifier le nombre d'analyses
        if (freeAnalysesCount >= FREE_ANALYSES_LIMIT) {
          toast.error(`🔐 Vous avez utilisé vos ${FREE_ANALYSES_LIMIT} analyses gratuites ! Inscrivez-vous pour continuer`, {
            duration: 5000,
            style: {
              background: '#FEE2E2',
              color: '#991B1B',
              fontWeight: '500',
            }
          });
          setEtape(Etape.ACCUEIL);
          setShowLoginForm(true);
          return { error: "Limite d'essai atteinte" };
        }
        
        // Incrémenter le compteur d'analyses gratuites
        const newCount = freeAnalysesCount + 1;
        setFreeAnalysesCount(newCount);
        localStorage.setItem('freeAnalysesCount', newCount.toString());
        
        // Afficher un message informatif
        const remainingAnalyses = FREE_ANALYSES_LIMIT - newCount;
        if (remainingAnalyses > 0) {
          toast.success(`🎁 Essai gratuit : ${remainingAnalyses} analyse${remainingAnalyses > 1 ? 's' : ''} restante${remainingAnalyses > 1 ? 's' : ''}`, {
            duration: 4000,
            style: {
              background: '#DBEAFE',
              color: '#1E40AF',
              fontWeight: '500',
            }
          });
        } else {
          toast.success(`✨ Dernière analyse gratuite ! Inscrivez-vous pour continuer`, {
            duration: 5000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              fontWeight: '500',
            }
          });
        }
      }

      // Gérer à la fois les fichiers et les chaînes base64
      let file: File;
      if (typeof fileOrBase64 === 'string') {
        // Convertir la chaîne base64 en fichier
        const response = await fetch(fileOrBase64);
        const blob = await response.blob();
        file = new File([blob], "image.jpg", { type: "image/jpeg" });
      } else {
        file = fileOrBase64;
      }

      // Upload vers Supabase Storage (uniquement pour les utilisateurs connectés)
      let imageUrl: string;
      if (user) {
        try {
          imageUrl = await StorageService.uploadMedicamentImage(file);
          devLog("Image uploadée vers Supabase Storage:", imageUrl);
        } catch (uploadError) {
          console.error("Erreur lors de l'upload:", uploadError);
          // Fallback vers URL locale si l'upload échoue
          imageUrl = URL.createObjectURL(file);
        }
      } else {
        // Mode essai gratuit : utiliser une URL locale (pas de sauvegarde en ligne)
        imageUrl = URL.createObjectURL(file);
        devLog("Mode essai gratuit : utilisation d'une URL locale");
      }
      
      devLog("Image téléchargée avec succès:", imageUrl);
      
      // Appel à l'API réelle d'analyse d'image de médicament avec retry automatique
      let analysisResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Préparer les données pour l'API
          const formData = new FormData();
          formData.append('image', file);
          
          // Appel à l'API d'analyse de médicaments
          const response = await fetch('/api/analyser-medicament', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erreur lors de l'analyse du médicament");
          }
          
          // Récupérer les résultats de l'analyse
          analysisResult = await response.json();
          
          // Si on arrive ici, l'analyse a réussi
          break;
          
        } catch (error: any) {
          retryCount++;
          devLog(`🔄 Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
          
          if (retryCount >= maxRetries) {
            throw error; // Re-lancer l'erreur après tous les essais
          }
          
          // Attendre avant de réessayer (délai progressif)
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          
          // Afficher un message de retry
          toast(`🔄 Nouvelle tentative ${retryCount}/${maxRetries}...`, {
            duration: 2000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              fontWeight: '500',
            }
          });
        }
      }
      
      // Créer l'objet résultat à partir des données réelles
      const resultat: AnalyseResultat = {
          nom: analysisResult.nom || "Médicament inconnu",
          description: analysisResult.description || "Aucune description disponible",
          image: imageUrl,
          detailsAnalyse: {
            nomCommercial: analysisResult.nomCommercial || analysisResult.nom || "Non identifié",
            laboratoire: analysisResult.laboratoire || "Information non disponible",
            dci: analysisResult.dci || "Information non disponible",
            formePharmaceutique: analysisResult.formePharmaceutique || "Information non disponible",
            dosage: analysisResult.dosage || "Information non disponible",
            classeTherapeutique: analysisResult.classeTherapeutique || "Information non disponible",
            indicationsTherapeutiques: analysisResult.indicationsTherapeutiques || "Information non disponible",
            posologie: analysisResult.posologie || "Information non disponible",
            contreIndications: analysisResult.contreIndications || "Information non disponible",
            effetsSecondaires: analysisResult.effetsSecondaires || "Information non disponible",
            interactions: analysisResult.interactions || "Information non disponible",
            precautionsEmploi: analysisResult.precautionsEmploi || "Information non disponible",
            conservation: analysisResult.conservation || "Information non disponible"
          }
        };
        
        setResultat(resultat);
        setEtape(Etape.RESULTAT);
        
        // Sauvegarder automatiquement l'analyse dans Supabase (uniquement pour utilisateurs connectés)
        if (user) {
          try {
            await AnalysesService.saveAnalyse({
              nom: resultat.nom ?? "Médicament inconnu",
              description: resultat.description,
              image_url: imageUrl,
              details_analyse: resultat.detailsAnalyse
            });
            devLog("Analyse sauvegardée automatiquement dans Supabase");
            toast.success("✅ Analyse sauvegardée dans votre historique", {
              duration: 2000,
              style: {
                background: '#D1FAE5',
                color: '#065F46',
                fontWeight: '500',
              }
            });
          } catch (saveError) {
            console.error("Erreur lors de la sauvegarde automatique:", saveError);
            toast.error("⚠️ L'analyse n'a pas pu être sauvegardée", {
              duration: 3000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                fontWeight: '500',
              }
            });
          }
        } else {
          // Mode essai gratuit : informer que l'analyse ne sera pas sauvegardée
          toast("ℹ️ Connectez-vous pour sauvegarder vos analyses", {
            duration: 3000,
            icon: '💾',
            style: {
              background: '#DBEAFE',
              color: '#1E40AF',
              fontWeight: '500',
            }
          });
        }
        
        return resultat;
      } catch (apiError) {
        console.error("Erreur lors de l'appel à l'API d'analyse:", apiError);
        toast.dismiss();
        toast.error("Erreur lors de l'analyse: " + (apiError instanceof Error ? apiError.message : "Erreur inconnue"));
        
        // En cas d'erreur, afficher une erreur explicite
        setErreur("Impossible d'analyser ce médicament. Veuillez réessayer avec une image plus claire.");
        setEtape(Etape.CAPTURE);
        return { 
          error: "Erreur d'analyse de l'image" 
        };
      }
  };

  const retourAccueil = useCallback(() => {
    setEtape(Etape.ACCUEIL);
    setImageData(null);
    setResultat(null);
    setErreur(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Gérer l'authentification avec Supabase
  useEffect(() => {
    // Masquer complètement la console en production
    hideConsoleInProduction();
    
    // Charger le compteur d'analyses gratuites depuis localStorage
    const savedCount = localStorage.getItem('freeAnalysesCount');
    if (savedCount) {
      setFreeAnalysesCount(parseInt(savedCount, 10));
    }
    
    // Gérer les tokens OAuth dans l'URL (après connexion Google)
    const handleOAuthCallback = async () => {
      // Vérifier les tokens dans l'URL (hash ou query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        devLog('🔐 Tokens OAuth détectés, connexion en cours...');
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Réinitialiser le compteur d'analyses gratuites après connexion
        localStorage.removeItem('freeAnalysesCount');
        setFreeAnalysesCount(0);
        
        toast.success('🎉 Connexion réussie !', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            color: '#065F46',
            fontWeight: '500',
            fontSize: '14px'
          }
        });
        
        // Forcer la mise à jour de l'état d'authentification
        setTimeout(async () => {
          const user = await AuthService.getCurrentUser();
          if (user) {
            setIsAuthenticated(true);
            setUser(user);
          }
        }, 1000);
      }
    };
    
    handleOAuthCallback();
    
    const { data: { subscription } } = AuthService.onAuthStateChange((currentUser, session) => {
      devLog('🔄 État d\'authentification changé:', { user: !!currentUser, session: !!session });
      setIsAuthenticated(!!currentUser);
      setUser(currentUser);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSaveAnalyse = async () => {
    if (!isAuthenticated || !user) {
      toast.error("🔐 Connectez-vous pour sauvegarder vos analyses", {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          fontWeight: '500',
        }
      });
      return;
    }

    if (!resultat || etape !== Etape.RESULTAT) {
      toast.error("⚠️ Aucune analyse à sauvegarder", {
        duration: 2000,
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          fontWeight: '500',
        }
      });
      return;
    }

    try {
      toast.loading("💾 Sauvegarde en cours...", {
        style: {
          background: '#DBEAFE',
          color: '#1E40AF',
          fontWeight: '500',
        }
      });
      
      // Adapter les données au nouveau format Supabase
      const analyseData = {
        nom: resultat.nom || 'Inconnu',
        description: resultat.description || '',
        image_url: imageData || undefined,
        details_analyse: resultat.detailsAnalyse || {}
      };

      await AnalysesService.saveAnalyse(analyseData);
      toast.dismiss();
      toast.success("✅ Analyse sauvegardée avec succès !", {
        duration: 3000,
        style: {
          background: '#D1FAE5',
          color: '#065F46',
          fontWeight: '500',
        }
      });
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      toast.dismiss();
      toast.error("❌ Impossible de sauvegarder l'analyse", {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          fontWeight: '500',
        }
      });
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Gérer l'affichage de l'historique
  const handleShowHistorique = () => {
    setShowHistorique(true);
  };

  // Gérer la fermeture de l'historique
  const handleCloseHistorique = () => {
    setShowHistorique(false);
  };

  // Gérer l'affichage d'une analyse de l'historique
  const handleViewAnalyse = (analyse: any) => {
    // Créer un objet résultat à partir de l'analyse sauvegardée
    setResultat({
      nom: analyse.nom,
      description: analyse.description || '',
      image: analyse.image_url,
      error: false,
      detailsAnalyse: analyse.detailsAnalyse || {}
    });

    // Afficher le résultat
    setEtape(Etape.RESULTAT);
    setShowHistorique(false);
  };

  // Gérer l'affichage du formulaire de connexion
  const handleShowLoginForm = () => {
    setShowLoginForm(true);
  };

  // Gérer la fermeture du formulaire de connexion
  const handleCloseLoginForm = () => {
    setShowLoginForm(false);
  };

  // Gérer la déconnexion
  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      toast.success('👋 À bientôt !', {
        duration: 2000,
        style: {
          background: '#D1FAE5',
          color: '#065F46',
          fontWeight: '500',
        }
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('❌ Impossible de se déconnecter', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          fontWeight: '500',
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-50 p-4 sm:p-6 lg:p-8" suppressHydrationWarning>
      {/* 🌐 Widget de traduction automatique - IMMÉDIAT */}
      <AutoTranslateWidget />
      
      {showSplashScreen && (
        <SplashScreen onComplete={() => setShowSplashScreen(false)} />
      )}
      
      <div className="min-h-[calc(100vh-4rem)] rounded-3xl border-4 border-white/40 shadow-2xl overflow-hidden bg-white/90 backdrop-filter backdrop-blur-xl" suppressHydrationWarning>
        <header className="py-4 px-4 sm:px-6 backdrop-blur-md bg-white/70 border-b border-[#89CFF0]/20 sticky top-0 z-10 mb-8">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                <img 
                  src="/images/logo-app.png" 
                  alt="MediScan Logo" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#89CFF0] to-[#5AB0E2]">
                MediScan
              </h1>
              
              {/* Badge d'essai gratuit pour les utilisateurs non connectés */}
              {!isAuthenticated && freeAnalysesCount < FREE_ANALYSES_LIMIT && (
                <div className="hidden sm:flex ml-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-semibold text-white shadow-lg">
                  🎁 {FREE_ANALYSES_LIMIT - freeAnalysesCount} essai{FREE_ANALYSES_LIMIT - freeAnalysesCount > 1 ? 's' : ''} gratuit{FREE_ANALYSES_LIMIT - freeAnalysesCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {/* Menu pour petit écran */}
            <div className="block sm:hidden">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)} 
                className="p-2 rounded-md bg-blue-50 hover:bg-blue-100"
              >
                <svg className="w-6 h-6 text-[#5AB0E2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
            
            {/* Menu pour grand écran */}
            <div className="hidden sm:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleShowHistorique}
                    className="px-3 py-1.5 bg-[#89CFF0]/90 hover:bg-[#89CFF0] text-white rounded-md text-sm"
                  >
                    Historique
                  </button>
                  <button
                    onClick={() => setShowAboutPage(true)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                  >
                    À propos
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-gray-200/70 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAboutPage(true)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                  >
                    À propos
                  </button>
                  <button
                    onClick={handleShowLoginForm}
                    className="px-3 py-1.5 bg-[#89CFF0]/90 hover:bg-[#89CFF0] text-white rounded-md text-sm"
                  >
                    Connexion
                  </button>
                </>
              )}
              {etape === Etape.RESULTAT && (
                <button
                  onClick={handleSaveAnalyse}
                  disabled={!isAuthenticated || saveSuccess}
                  className={`px-3 py-1 rounded-md text-sm ${
                    saveSuccess
                      ? 'bg-green-500 text-white'
                      : isAuthenticated
                      ? 'bg-[#89CFF0] hover:bg-[#74B9FF] text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saveSuccess ? '✓ Sauvegardé' : 'Sauvegarder'}
                </button>
              )}
            </div>
            
            {/* Menu mobile déroulant */}
            {showMobileMenu && (
              <div className="w-full mt-4 sm:hidden">
                <div className="flex flex-col space-y-2 bg-white/90 p-3 rounded-lg shadow-md border border-[#89CFF0]/20">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          handleShowHistorique();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-3 py-2 bg-[#89CFF0]/90 hover:bg-[#89CFF0] text-white rounded-md text-sm text-left"
                      >
                        Historique
                      </button>
                      <button
                        onClick={() => {
                          setShowAboutPage(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm text-left"
                      >
                        À propos
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-3 py-2 bg-gray-200/70 hover:bg-gray-200 text-gray-700 rounded-md text-sm text-left"
                      >
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowAboutPage(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm text-left"
                      >
                        À propos
                      </button>
                      <button
                        onClick={() => {
                          handleShowLoginForm();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-3 py-2 bg-[#89CFF0]/90 hover:bg-[#89CFF0] text-white rounded-md text-sm text-left"
                      >
                        Connexion
                      </button>
                    </>
                  )}
                  {etape === Etape.RESULTAT && (
                    <button
                      onClick={() => {
                        handleSaveAnalyse();
                        setShowMobileMenu(false);
                      }}
                      disabled={!isAuthenticated || saveSuccess}
                      className={`w-full px-3 py-2 text-sm text-left rounded-md ${
                        saveSuccess
                          ? 'bg-green-500 text-white'
                          : isAuthenticated
                          ? 'bg-[#89CFF0] hover:bg-[#74B9FF] text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {saveSuccess ? '✓ Sauvegardé' : 'Sauvegarder'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {etape === Etape.ACCUEIL && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col space-y-10"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4 text-gray-800">
                    Analysez <span className="text-[#5AB0E2]">votre médicament</span>
                  </h2>
                  <p className="text-gray-600 max-w-xl mx-auto">
                    Scannez vos médicaments pour obtenir instantanément des informations détaillées et fiables
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ y: -5, boxShadow: '0 15px 30px -5px rgba(137, 207, 240, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    className="overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-[#89CFF0]/30 shadow-lg transition-all duration-300 group"
                  >
                    <div
                      className="h-full p-8 flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-20 h-20 bg-[#89CFF0]/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#89CFF0]/30 transition-all duration-300">
                        <svg className="w-10 h-10 text-[#5AB0E2] group-hover:text-[#3D9AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-center text-gray-800 group-hover:text-[#5AB0E2] transition-colors">
                        Télécharger une image
                      </h3>
                      <p className="text-gray-600 text-center mb-4 group-hover:text-gray-700 transition-colors">
                        Glissez une image ou cliquez pour parcourir
                      </p>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 w-full text-center group-hover:border-[#89CFF0]/50 transition-colors">
                        <p className="text-sm text-gray-500 group-hover:text-gray-600">
                          PNG, JPG, JPEG (max. 5MB)
                        </p>
                      </div>
                      {erreur && (
                        <div className="mt-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
                          {erreur}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5, boxShadow: '0 15px 30px -5px rgba(137, 207, 240, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEtape(Etape.CAMERA)}
                    className="overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-[#89CFF0]/30 shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="h-full p-8 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-[#89CFF0]/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#89CFF0]/30 transition-all duration-300">
                        <svg className="w-10 h-10 text-[#5AB0E2] group-hover:text-[#3D9AD2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-center text-gray-800 group-hover:text-[#5AB0E2] transition-colors">
                        Utiliser l'appareil photo
                      </h3>
                      <p className="text-gray-600 text-center mb-4 group-hover:text-gray-700 transition-colors">
                        Prendre une photo du médicament
                      </p>
                      <div className="bg-[#89CFF0] hover:bg-[#74B9FF] text-white py-2 px-6 rounded-full transition-colors font-medium">
                        Ouvrir la caméra
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Section PharmaAI - TEMPORAIREMENT DÉSACTIVÉE */}
                {/*
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      Asistan<span className="text-[#5AB0E2]">PharmaAI</span>
                    </h3>
                    <p className="text-gray-600 text-lg">
                      İlaç sorularınızı uzman yapay zekamıza sorun
                    </p>
                  </div>
                  
                  <motion.div
                    whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(89, 195, 240, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEtape(Etape.PHARMA_AI)}
                    className="max-w-lg mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-white via-cyan-50 to-blue-50 border-2 border-[#59C3F0]/20 shadow-xl transition-all duration-500 cursor-pointer group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div className="relative h-full p-10 flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 bg-gradient-to-br from-[#59C3F0]/30 to-[#3D9AD2]/30 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#59C3F0]/20 to-[#3D9AD2]/20 rounded-full animate-pulse"></div>
                        <svg className="relative w-12 h-12 text-[#59C3F0] group-hover:text-[#3D9AD2] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-gray-800 via-[#59C3F0] to-gray-800 bg-clip-text text-transparent group-hover:from-[#59C3F0] group-hover:via-[#3D9AD2] group-hover:to-[#59C3F0] transition-all duration-500">
                        PharmaAI ile sohbet edin
                      </h3>
                      
                      <p className="text-gray-600 text-center mb-8 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                        İlaçlarınızla ilgili anında yanıtlar alın
                      </p>
                      
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#59C3F0] to-[#3D9AD2] rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <button className="relative bg-gradient-to-r from-[#59C3F0] to-[#3D9AD2] hover:from-[#3D9AD2] hover:to-[#59C3F0] text-white py-3 px-8 rounded-full font-semibold transition-all duration-300 transform group-hover:scale-105 shadow-lg">
                          Sohbeti aç
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
                */}
              </motion.div>
            )}

            {etape === Etape.CAMERA && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl overflow-hidden bg-gray-800 shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={retourAccueil}
                    className="flex items-center text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour
                  </button>
                  <h2 className="text-xl font-bold">Prendre une photo</h2>
                  <div className="w-20"></div>
                </div>
                <Camera 
                  onPhotoCapture={analyserImage} 
                  onClose={retourAccueil} 
                />
              </motion.div>
            )}

            {etape === Etape.ANALYSE && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 border-t-[#89CFF0] rounded-full animate-spin"></div>
                  <div className="absolute top-3 left-3 right-3 bottom-3 bg-white rounded-full flex items-center justify-center">
                    <img 
                      src="/images/logo-app.png" 
                      alt="MediScan Logo" 
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-full"
                    />
                  </div>
                </div>
                <p className="mt-8 text-xl font-medium text-gray-800">Analyse en cours...</p>
                <p className="text-gray-600 mt-3 text-lg">Veuillez patienter quelques instants</p>
              </motion.div>
            )}

            {/* Section PharmaAI - TEMPORAIREMENT DÉSACTIVÉE */}
            {/*
            {etape === Etape.PHARMA_AI && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
                suppressHydrationWarning
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#59C3F0] to-[#3D9AD2]">
                    Assistant PharmaAI
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={retourAccueil}
                    className="bg-[#59C3F0] hover:bg-[#3D9AD2] text-white py-2 px-5 rounded-full flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour à l'accueil
                  </motion.button>
                </div>

                <div className="rounded-2xl overflow-hidden bg-white shadow-lg border border-[#59C3F0]/20 h-[600px]">
                  <PharmaAI 
                    user={user}
                    onClose={retourAccueil}
                  />
                </div>
              </motion.div>
            )}
            */}

            {etape === Etape.RESULTAT && resultat && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
                suppressHydrationWarning
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Résultat de l'analyse
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={retourAccueil}
                    className="bg-[#89CFF0] hover:bg-[#74B9FF] text-white py-2 px-5 rounded-full flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Nouvelle analyse
                  </motion.button>
                </div>

                {typeof window !== 'undefined' && (
                  <ResultatAnalyse 
                    resultat={resultat} 
                    imageData={imageData || ''} 
                    onReset={retourAccueil} 
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      
      <Toaster position="top-center" />

      {/* Ajouter le composant d'historique */}
      {showHistorique && (
        <HistoriqueAnalyses 
          user={user}
          onClose={handleCloseHistorique}
          onViewAnalyse={handleViewAnalyse}
        />
      )}

      {/* Ajouter le formulaire de connexion */}
      {showLoginForm && (
        <LoginForm 
          onClose={handleCloseLoginForm} 
          onLoginSuccess={() => {
            setShowLoginForm(false);
            toast.success('Vous êtes connecté');
            
            // Si une image est en attente d'analyse, reprendre l'analyse
            if (imageData) {
              setTimeout(() => {
                analyserImage(imageData);
              }, 1000); // Délai court pour laisser le toast de connexion s'afficher
            }
          }} 
        />
      )}


      {/* Ajouter la page À propos */}
      {showAboutPage && (
        <AboutPage 
          onClose={() => setShowAboutPage(false)}
        />
      )}
    </div>
  );
}