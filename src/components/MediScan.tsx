"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Camera from './Camera';
import UploadImage from './UploadImage';
import ResultatAnalyse from './ResultatAnalyse';
import HowItWorksSection from './HowItWorksSection';
import Image from 'next/image';
import { Toaster, toast } from 'react-hot-toast';
import { auth, storage } from '../firebase/config';
import { onAuthChange, signOut } from '../firebase/userService';
import { saveAnalyse, AnalyseMedicament } from '../firebase/analysesService';
import { User } from 'firebase/auth';
import HistoriqueAnalyses from './HistoriqueAnalyses';
import LoginForm from './LoginForm';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PharmaAI from './PharmaAI';
import AboutPage from './AboutPage';

enum Etape {
  ACCUEIL = 'ACCUEIL',
  CAPTURE = 'CAPTURE',
  ANALYSE = 'ANALYSE',
  RESULTAT = 'RESULTAT',
  HISTORIQUE = 'HISTORIQUE',
  CAMERA = 'CAMERA'
}

// Définir l'interface AnalyseResultat
interface AnalyseResultat {
  nom?: string;
  description?: string;
  image?: string;
  error?: string;
  detailsAnalyse?: any;
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
  const [selectedAnalyse, setSelectedAnalyse] = useState<AnalyseMedicament | null>(null);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [showPharmaAI, setShowPharmaAI] = useState<boolean>(false);
  const [showAboutPage, setShowAboutPage] = useState<boolean>(false);

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
      // Vérifier que l'utilisateur est authentifié
      if (!auth.currentUser) {
        toast.error("Veuillez vous connecter pour analyser une image");
        setEtape(Etape.CAPTURE);
        return { error: "Utilisateur non authentifié" };
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

      const userId = auth.currentUser.uid;
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `images/${userId}/${fileName}`);
      
      // Upload de l'image vers Firebase Storage
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      
      console.log("Image téléchargée avec succès:", imageUrl);
      
      // Simulation d'analyse (à remplacer par votre API réelle)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Résultat simulé
      const resultat: AnalyseResultat = {
        nom: "Doliprane 1000mg",
        description: "Médicament antalgique (anti-douleur) et antipyrétique (anti-fièvre)",
        image: imageUrl,
        detailsAnalyse: {
          nomCommercial: "Doliprane 1000mg",
          laboratoire: "Sanofi Aventis France",
          dci: "Paracétamol",
          formePharmaceutique: "Comprimés pelliculés",
          dosage: "1000 mg",
          classeTherapeutique: "Antalgique et antipyrétique. Anilides code ATC : N02BE01",
          indicationsTherapeutiques: "Traitement symptomatique des douleurs d'intensité légère à modérée et/ou des états fébriles.",
          posologie: "Adultes: 1 comprimé (1000mg) à renouveler si nécessaire au bout de 4 heures minimum, sans dépasser 3 comprimés par jour.",
          conservation: "À conserver à température ambiante, à l'abri de l'humidité."
        }
      };
      
      setResultat(resultat);
      setEtape(Etape.RESULTAT);
      
      // Sauvegarder automatiquement l'analyse dans Firestore
      if (auth.currentUser) {
        try {
          await saveAnalyse({
            nom: resultat.nom || "Médicament inconnu",
            description: resultat.description,
            image: imageUrl,
            detailsAnalyse: resultat.detailsAnalyse
          });
          console.log("Analyse sauvegardée automatiquement");
        } catch (saveError) {
          console.error("Erreur lors de la sauvegarde automatique:", saveError);
          // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
        }
      }
      
      return resultat;
    } catch (error: any) {
      console.error("Erreur lors de l'analyse:", error);
      
      // Gestion spécifique des erreurs de stockage
      if (error.code?.includes('storage/')) {
        if (error.code === 'storage/unauthorized') {
          toast.error("Accès non autorisé. Veuillez vous reconnecter.");
        } else {
          toast.error(`Erreur de stockage: ${error.message}`);
        }
      } else {
        toast.error("Erreur lors de l'analyse de l'image");
      }
      
      setErreur(error.message || "Erreur inconnue lors de l'analyse");
      setEtape(Etape.CAPTURE);
      return { error: error.message || "Erreur inconnue lors de l'analyse" };
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

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setIsAuthenticated(!!currentUser);
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSaveAnalyse = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Veuillez vous connecter pour sauvegarder l'analyse.");
      return;
    }

    if (!resultat || etape !== Etape.RESULTAT) {
      toast.error("Aucune analyse à sauvegarder.");
      return;
    }

    try {
      toast.loading("Sauvegarde en cours...");
      
      // Adapter les données au nouveau format d'AnalyseMedicament
      const analyseData = {
        nom: resultat.nom || 'Inconnu',
        description: resultat.description || '',
        image: imageData || undefined,
        detailsAnalyse: resultat.detailsAnalyse || {}
      };

      await saveAnalyse(analyseData);
      toast.dismiss();
      toast.success("Analyse sauvegardée avec succès!");
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      toast.dismiss();
      toast.error("Erreur lors de la sauvegarde de l'analyse.");
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
  const handleViewAnalyse = (analyse: AnalyseMedicament) => {
    // Créer un objet résultat à partir de l'analyse sauvegardée
    setResultat({
      nom: analyse.nom,
      description: analyse.description || '',
      image: analyse.image,
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
      await signOut();
      toast.success('Vous êtes déconnecté');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 lg:p-8" suppressHydrationWarning>
      <div className="min-h-[calc(100vh-4rem)] rounded-3xl border-4 border-[#89CFF0]/30 shadow-xl overflow-hidden bg-white/80 backdrop-filter backdrop-blur-sm" suppressHydrationWarning>
        <header className="py-4 px-6 backdrop-blur-md bg-white/70 border-b border-[#89CFF0]/20 sticky top-0 z-10 mb-8">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative">
                <img 
                  src="/images/logo-app.png" 
                  alt="MediScan Logo" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#89CFF0] to-[#5AB0E2]">
                MediScan
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowPharmaAI(true)}
                    className="px-3 py-1.5 bg-[#59C3F0]/90 hover:bg-[#59C3F0] text-white rounded-md text-sm transition-all"
                  >
                    Pharma AI
                  </button>
                  <button
                    onClick={handleShowHistorique}
                    className="px-3 py-1.5 bg-[#89CFF0]/90 hover:bg-[#89CFF0] text-white rounded-md text-sm transition-all"
                  >
                    Historique
                  </button>
                  <button
                    onClick={() => setShowAboutPage(true)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-all"
                  >
                    À propos
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-gray-200/70 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-all"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAboutPage(true)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-all"
                  >
                    À propos
                  </button>
                  <button
                    onClick={handleShowLoginForm}
                    className="px-3 py-1.5 bg-[#89CFF0]/90 hover:bg-[#89CFF0] text-white rounded-md text-sm transition-all"
                  >
                    Connexion
                  </button>
                </>
              )}
              {etape === Etape.RESULTAT && (
                <button
                  onClick={handleSaveAnalyse}
                  disabled={!isAuthenticated || saveSuccess}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
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
        </header>

        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
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
                <div className="relative w-24 h-24">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 border-t-[#89CFF0] rounded-full animate-spin"></div>
                  <div className="absolute top-2 left-2 right-2 bottom-2 bg-white rounded-full flex items-center justify-center">
                    <img 
                      src="/images/logo-app.png" 
                      alt="MediScan Logo" 
                      className="w-16 h-16 object-contain rounded-full"
                    />
                  </div>
                </div>
                <p className="mt-6 text-lg font-medium text-gray-800">Analyse en cours...</p>
                <p className="text-gray-600 mt-2">Veuillez patienter quelques instants</p>
              </motion.div>
            )}

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
          }} 
        />
      )}

      {/* Ajouter le chatbot PharmaAI */}
      {showPharmaAI && (
        <PharmaAI 
          user={user}
          onClose={() => setShowPharmaAI(false)}
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