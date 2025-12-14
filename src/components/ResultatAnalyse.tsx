"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TableauAnime from './TableauAnime';

interface ResultatAnalyseProps {
  resultat: {
    nom?: string;
    description?: string;
    erreur?: boolean;
    detailsAnalyse?: {
      nomCommercial: string;
      laboratoire: string;
      dci: string;
      formePharmaceutique: string;
      dosage: string;
      classeTherapeutique: string;
      indicationsTherapeutiques: string;
      posologie: string;
      modeAdministration: string;
      contreIndications: string;
      effetsSecondaires: string;
      interactions: string;
      precautionsEmploi: string;
      conservation: string;
      populationRisque: string;
      surveillance: string;
      statut: string;
      fabricant: string;
      validite: string;
    };
  };
  imageData: string;
  onReset: () => void;
}

export default function ResultatAnalyse({ resultat, imageData, onReset }: ResultatAnalyseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Si le composant n'est pas encore monté, ne rien afficher
  if (!mounted) {
    return null;
  }

  // Vérifier s'il y a une erreur
  const hasError = resultat.erreur || !resultat.detailsAnalyse?.nomCommercial;

  // Définir les sections d'information pharmaceutique
  const sections = [
    {
      titre: "Identification du médicament",
      items: [
        { label: "Nom commercial", value: resultat.detailsAnalyse?.nomCommercial },
        { label: "Laboratoire", value: resultat.detailsAnalyse?.laboratoire },
        { label: "DCI / Principe actif", value: resultat.detailsAnalyse?.dci },
        { label: "Forme pharmaceutique", value: resultat.detailsAnalyse?.formePharmaceutique },
        { label: "Dosage", value: resultat.detailsAnalyse?.dosage }
      ]
    },
    {
      titre: "Classification & Indications",
      items: [
        { label: "Classe thérapeutique", value: resultat.detailsAnalyse?.classeTherapeutique },
        { label: "Indications thérapeutiques", value: resultat.detailsAnalyse?.indicationsTherapeutiques }
      ]
    },
    {
      titre: "Posologie & Administration",
      items: [
        { label: "Posologie recommandée", value: resultat.detailsAnalyse?.posologie },
        { label: "Mode d'administration", value: resultat.detailsAnalyse?.modeAdministration }
      ]
    },
    {
      titre: "Sécurité & Précautions",
      items: [
        { label: "Contre-indications", value: resultat.detailsAnalyse?.contreIndications },
        { label: "Effets indésirables", value: resultat.detailsAnalyse?.effetsSecondaires },
        { label: "Interactions médicamenteuses", value: resultat.detailsAnalyse?.interactions },
        { label: "Précautions d'emploi", value: resultat.detailsAnalyse?.precautionsEmploi }
      ]
    },
    {
      titre: "Population spécifique & Surveillance",
      items: [
        { label: "Population à risque", value: resultat.detailsAnalyse?.populationRisque },
        { label: "Surveillance particulière", value: resultat.detailsAnalyse?.surveillance }
      ]
    },
    {
      titre: "Informations pratiques",
      items: [
        { label: "Conservation", value: resultat.detailsAnalyse?.conservation },
        { label: "Statut", value: resultat.detailsAnalyse?.statut },
        { label: "Fabricant", value: resultat.detailsAnalyse?.fabricant },
        { label: "Durée de validité", value: resultat.detailsAnalyse?.validite }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-6xl mx-auto bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
    >
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-900 to-indigo-900 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-base sm:text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
          Résultat de l'analyse
        </h2>
        <button
          onClick={onReset}
          className="flex items-center justify-center bg-gray-800/30 hover:bg-gray-700/50 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 transition-colors flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-12rem)]">
        {resultat ? (
          <div className="flex flex-col lg:flex-row">
            {/* Section image du médicament */}
            <div className="w-full lg:w-1/3 bg-gray-900 p-4 sm:p-6 flex flex-col items-center justify-start lg:justify-center border-b lg:border-b-0 lg:border-r border-gray-700">
              {imageData ? (
                <img 
                  src={imageData} 
                  alt="Médicament analysé" 
                  className="w-full max-w-[200px] sm:max-w-[240px] h-auto object-contain rounded-lg shadow-lg border border-gray-700"
                />
              ) : (
                <div className="w-full max-w-[200px] sm:max-w-[240px] h-36 sm:h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <div className="mt-4 sm:mt-6 w-full">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{resultat.detailsAnalyse?.nomCommercial}</h3>
                
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  {resultat.detailsAnalyse?.laboratoire && (
                    <span className="px-2 sm:px-3 py-1 bg-blue-900/40 text-blue-300 text-xs rounded-full">
                      {resultat.detailsAnalyse.laboratoire}
                    </span>
                  )}
                  {resultat.detailsAnalyse?.dosage && (
                    <span className="px-2 sm:px-3 py-1 bg-green-900/40 text-green-300 text-xs rounded-full">
                      {resultat.detailsAnalyse.dosage}
                    </span>
                  )}
                </div>

                {resultat.detailsAnalyse?.laboratoire && (
                  <div className="mb-3 sm:mb-4 p-3 bg-gray-800/80 border border-gray-700 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Laboratoire</p>
                    <p className="text-sm sm:text-base text-white font-medium">{resultat.detailsAnalyse.laboratoire}</p>
                  </div>
                )}

                {resultat.detailsAnalyse?.dci && (
                  <div className="p-3 bg-gray-800/80 border border-gray-700 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">DCI / Principe actif</p>
                    <p className="text-sm sm:text-base text-white font-medium">{resultat.detailsAnalyse.dci}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section informations détaillées */}
            <div className="w-full lg:w-2/3 p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 pb-2 border-b border-gray-700">
                  À propos
                </h3>
                <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap">{resultat.description}</p>
              </div>

              {sections.map((section, index) => (
                <div key={index} className="mb-4 sm:mb-6">
                  {section.items.filter(item => item.value && item.value.trim() !== "").length > 0 && (
                    <>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 pb-2 border-b border-gray-700 flex items-center">
                        <span className="mr-2 text-blue-400 text-sm sm:text-base">{section.titre}</span>
                      </h3>
                      <div className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap">
                        <TableauAnime 
                          headers={["Propriété", "Détail"]}
                          data={section.items
                            .filter(item => item.value && item.value.trim() !== "")
                            .map(item => [item.label, item.value || ""])}
                          animationDuration={0.6}
                          animationDelay={0.15}
                          effect="fade"
                          highlightKeywords={true}
                          className="mb-2"
                          title={index === 0 ? "Détails pharmaceutiques" : undefined}
                          darkMode={false}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Propriétés supplémentaires */}
              {sections.map((section, index) => (
                section.items.filter(item => item.value && item.value.trim() !== "").length > 0 && (
                  <div key={`${section.titre}-additional`} className="mt-6 sm:mt-8 pt-4 border-t border-gray-700">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                      Informations complémentaires
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {section.items.filter(item => item.value && item.value.trim() !== "").map((item, itemIndex) => (
                        <div key={`${section.titre}-${itemIndex}`} className="p-3 bg-gray-700/30 rounded-lg border border-gray-700">
                          <p className="text-gray-400 text-xs sm:text-sm mb-1">{item.label}</p>
                          <p className="text-sm sm:text-base text-white break-words">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 text-center">
            <div className="animate-pulse flex flex-col items-center justify-center p-8 sm:p-12">
              <div className="rounded-full bg-gray-700 h-12 w-12 sm:h-16 sm:w-16 mb-4"></div>
              <div className="h-3 sm:h-4 bg-gray-700 rounded w-3/4 sm:w-1/2 mb-3"></div>
              <div className="h-2 sm:h-3 bg-gray-700 rounded w-1/2 sm:w-1/3"></div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 