import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Rocket, Sparkles, BookOpen } from 'lucide-react';
import { SchoolLevel } from '../types';

interface OnboardingProps {
  onComplete: (name: string, level: SchoolLevel) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<SchoolLevel | null>(null);

  const levels: { id: SchoolLevel; label: string; icon: any; color: string }[] = [
    { id: 'Primaire', label: 'Primaire', icon: Sparkles, color: 'bg-green-500' },
    { id: 'Collège', label: 'Collège', icon: BookOpen, color: 'bg-blue-500' },
    { id: 'Lycée', label: 'Lycée', icon: GraduationCap, color: 'bg-purple-500' },
    { id: 'Supérieur', label: 'Supérieur', icon: Rocket, color: 'bg-red-500' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && level) {
      onComplete(name, level);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FF6321] p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-[40px] border-8 border-black p-10 shadow-[0_20px_0_rgba(0,0,0,1)]"
      >
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-4">Bienvenue sur Anglix</h1>
          <p className="text-xl font-bold text-gray-500 uppercase">Crée ton profil pour commencer l'aventure</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-3 ml-2">Ton Pseudo</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: SavantFou22"
              className="w-full p-6 bg-gray-100 rounded-3xl border-4 border-black text-2xl font-bold focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-3 ml-2">Ton Niveau Scolaire</label>
            <div className="grid grid-cols-2 gap-4">
              {levels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`p-6 rounded-3xl border-4 border-black flex flex-col items-center gap-3 transition-all ${
                    level === l.id ? `${l.color} text-white scale-105 shadow-[0_8px_0_rgba(0,0,0,1)]` : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <l.icon size={32} />
                  <span className="font-black uppercase italic">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!name || !level}
            className="w-full py-6 bg-black text-white rounded-3xl font-black text-2xl uppercase italic tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_12px_0_rgba(0,0,0,0.3)]"
          >
            C'est parti !
          </button>
        </form>
      </motion.div>
    </div>
  );
}
