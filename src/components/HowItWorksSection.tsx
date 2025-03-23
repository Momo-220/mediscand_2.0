"use client";

import { motion } from 'framer-motion';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: "Prenez une photo",
      description: "Photographiez ou téléchargez une image claire de votre médicament"
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Analyse IA",
      description: "Notre intelligence artificielle analyse l'image pour identifier le médicament"
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Résultats détaillés",
      description: "Recevez des informations complètes sur le médicament identifié"
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.section
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="text-center mb-10" variants={itemVariants}>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white mb-3">
          Comment ça marche
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Un processus simple en trois étapes pour identifier rapidement vos médicaments
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-10">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className="step-card group"
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="mb-6 relative">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto transform transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30">
                {step.icon}
              </div>
              <div className="absolute top-1/2 -right-4 w-8 h-1 bg-blue-200 dark:bg-blue-800/50 hidden md:block md:last:hidden"></div>
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-3 text-center">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
} 