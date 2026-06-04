import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Crown, Star, Calendar, Globe, Users, Swords } from 'lucide-react';
import { LeaderboardEntry, LeaderboardType } from '../types';
import { audio } from '../lib/audio';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  activeType: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
  onPlayerClick: (playerId: string) => void;
  onDuelChallenge: (playerId: string) => void;
}

const LEAGUES = [
  { name: 'Bronze', color: 'bg-orange-700', minXp: 0 },
  { name: 'Argent', color: 'bg-gray-400', minXp: 1000 },
  { name: 'Or', color: 'bg-yellow-400', minXp: 5000 },
  { name: 'Platine', color: 'bg-cyan-400', minXp: 15000 },
  { name: 'Diamant', color: 'bg-blue-500', minXp: 50000 },
  { name: 'Légende', color: 'bg-purple-600', minXp: 100000 },
];

export default function Leaderboard({ entries, activeType, onTypeChange, onPlayerClick, onDuelChallenge }: LeaderboardProps) {
  return (
    <div className="bg-card-bg rounded-[24px] md:rounded-[40px] border-4 md:border-8 border-black p-4 md:p-8 shadow-[0_8px_0_rgba(0,0,0,1)] md:shadow-[0_16px_0_rgba(0,0,0,1)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-yellow-100 rounded-3xl border-4 border-black">
            <Trophy className="text-yellow-500 w-12 h-12" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Classement</h2>
            <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Les meilleurs joueurs du monde</p>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex bg-gray-100 p-1 md:p-1.5 rounded-2xl border-4 border-black overflow-x-auto no-scrollbar max-w-full">
          {(['daily', 'weekly', 'monthly', 'all-time'] as LeaderboardType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                audio.play('click');
                onTypeChange(type);
              }}
              className={`px-4 md:px-6 py-2.5 md:py-2 rounded-xl font-black uppercase italic text-[10px] md:text-xs transition-all whitespace-nowrap flex-1 min-w-[80px] ${
                activeType === type ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'
              }`}
            >
              {type === 'daily' ? 'Jour' : type === 'weekly' ? 'Semaine' : type === 'monthly' ? 'Mois' : 'Global'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {entries.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-4 border-black border-dashed">
                <Globe className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="font-black uppercase italic text-gray-400">Aucune donnée pour cette période</p>
              </div>
            ) : (
              entries.map((entry, index) => {
                const isTop3 = index < 3;
                const colors = [
                  'bg-yellow-400 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]',
                  'bg-gray-200 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]',
                  'bg-orange-400 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]'
                ];

                const league = [...LEAGUES].reverse().find(l => entry.xp >= l.minXp) || LEAGUES[0];

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onPlayerClick(entry.id)}
                    className={`flex items-center justify-between p-3 md:p-5 rounded-2xl md:rounded-[32px] border-2 md:border-4 transition-all cursor-pointer group hover:-translate-y-1 ${
                      entry.isCurrentUser ? 'bg-blue-500 border-black text-white shadow-[4px_4px_0_rgba(0,0,0,1)]' : 
                      isTop3 ? colors[index] : 'bg-card-bg border-black hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-6">
                      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-2 border-black flex items-center justify-center font-black text-lg md:text-2xl italic shrink-0 ${entry.isCurrentUser ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {index === 0 && <Crown className="text-yellow-400 w-6 h-6 md:w-8 md:h-8" />}
                        {index === 1 && <Medal className="text-gray-300 w-6 h-6 md:w-8 md:h-8" />}
                        {index === 2 && <Medal className="text-orange-300 w-6 h-6 md:w-8 md:h-8" />}
                        {index > 2 && index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="font-black text-base md:text-2xl uppercase italic tracking-tight group-hover:underline truncate">{entry.name}</span>
                          <div className={`px-2 py-0.5 rounded-lg border-2 border-black text-[8px] font-black uppercase ${league.color} text-white`}>
                            {league.name}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 md:gap-2 text-[8px] md:text-xs font-black uppercase tracking-widest ${entry.isCurrentUser ? 'text-white/70' : 'text-gray-400'}`}>
                          <Star size={10} className="fill-current" />
                          Niveau {entry.level}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="text-right">
                        <div className="font-black text-xl md:text-3xl italic leading-none">{entry.xp.toLocaleString()}</div>
                        <div className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter opacity-50">
                          {activeType === 'all-time' ? 'XP TOTAL' : 'XP PÉRIODE'}
                        </div>
                      </div>
                      {!entry.isCurrentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.play('click');
                            onDuelChallenge(entry.id);
                          }}
                          className="p-2 md:p-3 bg-red-500 text-white border-2 border-black rounded-lg md:rounded-xl hover:scale-110 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]"
                          title="Défier en duel"
                        >
                          <Swords className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
