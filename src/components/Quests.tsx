import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Coins, Sparkles } from 'lucide-react';
import { Quest } from '../types';

interface QuestsProps {
  quests: Quest[];
  onClaim: (questId: string) => void;
}

export default function Quests({ quests, onClaim }: QuestsProps) {
  return (
    <div className="bg-white rounded-[32px] border-4 border-black p-6 shadow-[0_8px_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-yellow-500" size={24} />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Quêtes du jour</h2>
      </div>

      <div className="space-y-4">
        {quests.map((quest) => {
          const progressPercent = Math.min((quest.progress / quest.target) * 100, 100);
          
          return (
            <div key={quest.id} className="relative group">
              <div className={`p-4 rounded-2xl border-4 border-black transition-all ${
                quest.claimed ? 'bg-gray-50 opacity-60' : 'bg-white'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {quest.completed ? (
                      <CheckCircle2 className="text-green-500" size={24} />
                    ) : (
                      <Circle className="text-gray-300" size={24} />
                    )}
                    <div>
                      <h3 className="font-black uppercase text-sm leading-tight">{quest.title}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{quest.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg border-2 border-black">
                    <Coins size={14} className="text-yellow-600" />
                    <span className="font-black text-xs">+{quest.reward}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-gray-100 rounded-full border-2 border-black overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className={`h-full ${quest.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                      {quest.progress} / {quest.target}
                    </span>
                  </div>
                </div>

                {quest.completed && !quest.claimed && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onClaim(quest.id)}
                    className="w-full mt-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase italic text-xs rounded-xl border-4 border-black shadow-[0_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
                  >
                    Récupérer !
                  </motion.button>
                )}

                {quest.claimed && (
                  <div className="w-full mt-4 py-2 bg-gray-200 text-gray-500 font-black uppercase italic text-xs rounded-xl border-4 border-black text-center">
                    Récupéré
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
