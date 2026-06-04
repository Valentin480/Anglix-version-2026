import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, BookOpen, Zap, Loader2, Star } from 'lucide-react';

const MESSAGES = [
  "Consultation des archives d'Anglix...",
  "Synthèse des connaissances de l'IA...",
  "Génération d'un quiz sur mesure...",
  "Optimisation pédagogique...",
  "Recherche d'illustrations pertinentes...",
  "Mise en page de ta fiche de révision...",
  "Finalisation de l'expérience d'apprentissage..."
];

export default function AIGenerationOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center">
        {/* Central Animation */}
        <div className="relative w-48 h-48 mx-auto mb-12">
          {/* Pulsing circles */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-4 border-yellow-400 rounded-full"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: 1.5 + (i * 0.2), 
                opacity: 0,
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.4,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Rotating ring */}
          <motion.div
            className="absolute inset-0 border-8 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Main Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-white rounded-[32px] border-8 border-black flex items-center justify-center shadow-[0_12px_24px_rgba(250,204,21,0.4)]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={messageIndex}
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0, rotate: 45 }}
                  className="text-black"
                >
                  {messageIndex % 3 === 0 && <Brain size={48} className="fill-blue-100" />}
                  {messageIndex % 3 === 1 && <Sparkles size={48} className="text-yellow-500 fill-yellow-200" />}
                  {messageIndex % 3 === 2 && <BookOpen size={48} className="text-purple-500" />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Floating icons */}
          <motion.div 
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 -right-4 bg-yellow-400 p-2 rounded-lg border-2 border-black"
          >
            <Star size={20} className="fill-black" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute -bottom-4 -left-4 bg-blue-500 p-2 rounded-lg border-2 border-black"
          >
            <Zap size={20} className="text-white fill-white" />
          </motion.div>
        </div>

        {/* Text Content */}
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
          L'IA Anglix <br />
          <span className="text-yellow-400">est au travail</span>
        </h2>
        
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-blue-400 font-bold uppercase tracking-[0.2em] text-sm md:text-base italic"
            >
              {MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar (Fake but nice) */}
        <div className="mt-12 max-w-xs mx-auto">
          <div className="h-3 bg-white/10 rounded-full border-2 border-white/20 overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 20, ease: "linear" }}
              className="h-full bg-gradient-to-r from-blue-500 via-yellow-400 to-purple-500"
            />
          </div>
          <p className="mt-4 text-[10px] font-black text-white/30 uppercase tracking-widest">
            Veuillez patienter • Création de contenu unique
          </p>
        </div>
      </div>
    </motion.div>
  );
}
