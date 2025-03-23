"use client";

import { motion } from 'framer-motion';

interface AboutPageProps {
  onClose: () => void;
}

export default function AboutPage({ onClose }: AboutPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl shadow-xl flex flex-col overflow-hidden w-full max-w-4xl max-h-[90vh] text-white">
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white">À propos de MediScan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 text-white/90">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Introduction */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#89CFF0]">Bienvenue sur MediScan</h3>
              <p>
                MediScan est une application web innovante conçue pour vous aider à identifier vos médicaments
                et à obtenir des informations précises et détaillées à leur sujet. Notre mission est de 
                rendre les informations médicales plus accessibles et compréhensibles pour tous.
              </p>
              <div className="flex justify-center my-6">
                <div className="w-24 h-24 relative">
                  <img 
                    src="/images/logo-app.png" 
                    alt="MediScan Logo" 
                    className="w-full h-full object-contain rounded-full border-4 border-[#89CFF0]/30"
                  />
                </div>
              </div>
            </section>
            
            {/* Fonctionnalités */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-[#89CFF0]">Fonctionnalités principales</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-800/50 rounded-lg p-4 border border-[#89CFF0]/30">
                  <h4 className="text-lg font-semibold mb-2 text-[#89CFF0]">Identification de médicaments</h4>
                  <p className="text-white/80">
                    Prenez une photo ou téléchargez une image de votre médicament. Notre 
                    technologie avancée analyse l'image et identifie le médicament avec précision.
                  </p>
                </div>
                
                <div className="bg-blue-800/50 rounded-lg p-4 border border-[#89CFF0]/30">
                  <h4 className="text-lg font-semibold mb-2 text-[#89CFF0]">Informations détaillées</h4>
                  <p className="text-white/80">
                    Obtenez des informations complètes sur vos médicaments : principes actifs, dosage,
                    indications, contre-indications, effets secondaires et précautions d'emploi.
                  </p>
                </div>
                
                <div className="bg-blue-800/50 rounded-lg p-4 border border-[#89CFF0]/30">
                  <h4 className="text-lg font-semibold mb-2 text-[#89CFF0]">PharmaAI</h4>
                  <p className="text-white/80">
                    Notre assistant pharmaceutique intelligent vous permet de poser des questions 
                    spécifiques sur vos médicaments et d'obtenir des réponses personnalisées.
                  </p>
                </div>
                
                <div className="bg-blue-800/50 rounded-lg p-4 border border-[#89CFF0]/30">
                  <h4 className="text-lg font-semibold mb-2 text-[#89CFF0]">Historique des analyses</h4>
                  <p className="text-white/80">
                    Gardez un historique complet de vos analyses précédentes pour un suivi facile 
                    et une consultation rapide des informations.
                  </p>
                </div>
              </div>
            </section>
            
            {/* Comment ça marche */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-[#89CFF0]">Comment ça marche ?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-[#89CFF0] rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <span className="text-blue-900 font-medium">1</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">Capturez ou téléchargez une image</h5>
                    <p className="text-white/70">
                      Utilisez votre appareil photo ou téléchargez une image claire de votre médicament.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-[#89CFF0] rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <span className="text-blue-900 font-medium">2</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">Analyse automatique</h5>
                    <p className="text-white/70">
                      Notre système analyse l'image et identifie le médicament en comparant ses caractéristiques 
                      visuelles avec notre base de données étendue.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-[#89CFF0] rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <span className="text-blue-900 font-medium">3</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">Consultation des résultats</h5>
                    <p className="text-white/70">
                      Consultez les informations détaillées sur votre médicament et sauvegardez-les 
                      pour une référence future.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-[#89CFF0] rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <span className="text-blue-900 font-medium">4</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">Posez vos questions</h5>
                    <p className="text-white/70">
                      Utilisez PharmaAI pour poser des questions spécifiques et obtenir des 
                      informations complémentaires adaptées à vos besoins.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Notre équipe */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-[#89CFF0]">Notre équipe</h3>
              <p className="text-white/80">
                MediScan a été développé par une équipe de professionnels passionnés par l'innovation 
                technologique et l'amélioration de l'accès aux informations de santé. Notre équipe 
                multidisciplinaire comprend des experts en développement web, en intelligence artificielle,
                des pharmaciens et des professionnels de la santé.
              </p>
            </section>
            
            {/* Contact */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-[#89CFF0]">Contactez-nous</h3>
              <p className="text-white/80">
                Vous avez des questions, des suggestions ou des commentaires ? 
                N'hésitez pas à nous contacter à l'adresse : 
                <a href="mailto:personnelmomo@gmail.com" className="text-[#89CFF0] hover:underline ml-1">
                  personnelmomo@gmail.com
                </a>
              </p>
            </section>
            
            {/* Confidentialité */}
            <section className="space-y-4 mb-8">
              <h3 className="text-xl font-bold text-[#89CFF0]">Confidentialité et sécurité</h3>
              <p className="text-white/80">
                Chez MediScan, nous prenons la confidentialité et la sécurité de vos données très au sérieux. 
                Toutes les images et les informations que vous partagez avec nous sont traitées de manière 
                sécurisée et confidentielle. Nous utilisons des méthodes de cryptage avancées pour 
                protéger vos données personnelles.
              </p>
            </section>
          </div>
        </div>
        
        <div className="p-4 bg-blue-900 border-t border-[#89CFF0]/30 text-center">
          <button
            onClick={onClose}
            className="bg-[#89CFF0] hover:bg-[#74B9FF] text-blue-950 py-2 px-8 rounded-full transition-colors shadow-md font-medium"
          >
            Retour à l'application
          </button>
        </div>
      </div>
    </motion.div>
  );
} 