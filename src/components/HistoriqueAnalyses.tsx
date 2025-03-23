"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserAnalyses, deleteAnalyse, AnalyseMedicament, getRecentAnalyses } from '../firebase/analysesService';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

interface HistoriqueAnalysesProps {
  user: User | null;
  onClose: () => void;
  onViewAnalyse: (analyse: AnalyseMedicament) => void;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function HistoriqueAnalyses({ user, onClose, onViewAnalyse }: HistoriqueAnalysesProps) {
  const [analyses, setAnalyses] = useState<AnalyseMedicament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        loadAnalyses();
      } else {
        setAnalyses([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Tester la connexion à Firestore
    const testFirestore = async () => {
      if (!isAuthenticated) return;
      
      try {
        console.log("Test Firestore: tentative de connexion à la collection 'analyses'");
        const testQuery = query(
          collection(db, 'analyses'),
          limit(1)
        );
        
        const snapshot = await getDocs(testQuery);
        console.log(`Test Firestore réussi: ${snapshot.size} document(s) trouvé(s)`);
        console.log("Collections disponibles dans Firestore:", db.app.options.projectId);
      } catch (error) {
        console.error("Test Firestore échoué:", error);
      }
    };
    
    testFirestore();
  }, [isAuthenticated]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userAnalyses = await getRecentAnalyses(10);
      
      if (userAnalyses.length === 0) {
        console.log("Aucune analyse trouvée dans l'historique");
      } else {
        console.log(`${userAnalyses.length} analyses récupérées avec succès`);
      }
      
      setAnalyses(userAnalyses);
    } catch (err) {
      console.error("Erreur lors du chargement des analyses:", err);
      setError("Impossible de charger l'historique des analyses. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalyse = async (analyseId: string) => {
    if (!analyseId) return;

    try {
      toast.loading("Suppression en cours...");
      await deleteAnalyse(analyseId);
      
      // Mettre à jour la liste sans recharger toutes les analyses
      setAnalyses(analyses.filter(a => a.id !== analyseId));
      
      toast.dismiss();
      toast.success("Analyse supprimée avec succès");
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.dismiss();
      toast.error("Erreur lors de la suppression de l'analyse");
    }
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Historique des analyses</h2>
        <p className="text-gray-600 dark:text-gray-300">Connectez-vous pour voir votre historique d'analyses.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900/90 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold text-white">Historique des analyses</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900/60">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Analyses récentes</h2>
            <button 
              onClick={loadAnalyses} 
              className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg">
              {error}
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-blue-500 text-6xl mb-4 opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Aucune analyse sauvegardée</h3>
              <p className="text-gray-400">
                Les analyses de médicaments que vous sauvegardez apparaîtront ici.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {analyses.map((analyse) => (
                <AnimatePresence key={analyse.id} mode="wait">
                  {deleteConfirm === analyse.id ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl"
                    >
                      <p className="text-red-300 mb-4">
                        Êtes-vous sûr de vouloir supprimer cette analyse ?
                      </p>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-sm transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => analyse.id && handleDeleteAnalyse(analyse.id)}
                          className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      layout
                      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-700/50 hover:shadow-lg hover:shadow-blue-900/20 transition-all group"
                    >
                      <div className="relative h-40 w-full bg-gray-900">
                        {analyse.image ? (
                          <img
                            src={analyse.image}
                            alt={analyse.nom}
                            className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-600">Image non disponible</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                            {analyse.nom}
                          </h3>
                          {analyse.detailsAnalyse?.dosage && (
                            <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded-full">
                              {analyse.detailsAnalyse.dosage}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {analyse.detailsAnalyse?.laboratoire || analyse.description}
                        </p>
                        
                        <div className="text-xs text-gray-500 mb-4 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(analyse.date instanceof Date ? analyse.date : new Date())}
                        </div>
                        
                        <div className="flex justify-between space-x-2">
                          <button
                            onClick={() => onViewAnalyse(analyse)}
                            className="flex-1 px-3 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm rounded-md transition-colors flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Voir détails
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(analyse.id || null)}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 