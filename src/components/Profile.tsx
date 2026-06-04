import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Zap, Star, Trophy, Palette, Sparkles, Calendar, BookOpen, Target, Crown, Flame, Share2, Check } from 'lucide-react';
import { UserState, Reward } from '../types';
import { Swords } from 'lucide-react';
import { audio } from '../lib/audio';

interface ProfileProps {
  user: UserState & { id?: string };
  onUpdateProfile: (updates: Partial<UserState>) => void;
  isOwnProfile?: boolean;
  onBack?: () => void;
  onDuel?: (playerId: string) => void;
}

export default function Profile({ user, onUpdateProfile, isOwnProfile = true, onBack, onDuel }: ProfileProps) {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const titles = user.inventory.filter(r => r.type === 'profile_name');
  const auras = user.inventory.filter(r => r.type === 'aura');

  const stats = [
    { label: 'XP Total', value: user.xp, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Leçons', value: user.completedLessons.length, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Niveau', value: user.level, icon: Crown, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Items', value: user.inventory.length, icon: Star, color: 'text-pink-500', bg: 'bg-pink-50' },
  ];

  const achievements = [
    { label: 'Premier Pas', desc: 'Compléter 1 leçon', done: user.completedLessons.length >= 1, icon: Star },
    { label: 'Savant', desc: 'Atteindre le niveau 5', done: user.level >= 5, icon: Crown },
    { label: 'Collectionneur', desc: 'Avoir 10 items', done: user.inventory.length >= 10, icon: Trophy },
    { label: 'Millionnaire', desc: 'Avoir 1000 pièces', done: user.coins >= 1000, icon: Flame },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {!isOwnProfile && onBack && (
        <button 
          onClick={() => {
            audio.play('click');
            onBack();
          }}
          className="flex items-center gap-2 px-6 py-3 bg-card-bg rounded-2xl border-4 border-black font-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
        >
          <Star className="rotate-180" size={20} /> Retour au classement
        </button>
      )}
      {/* Profile Header Card */}
      <div className="bg-card-bg rounded-[32px] md:rounded-[48px] border-4 md:border-8 border-black p-6 md:p-12 shadow-[0_12px_0_rgba(0,0,0,1)] md:shadow-[0_24px_0_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        {/* Aura Effect Background */}
        {user.activeAura && (
          <div className="absolute inset-0 opacity-20 pointer-events-none animate-pulse bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500" />
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="relative group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className={`w-32 h-32 md:w-48 md:h-48 rounded-[32px] md:rounded-[40px] border-4 md:border-8 border-black flex items-center justify-center bg-gray-50 overflow-hidden relative ${user.activeSkin ? 'ring-4 md:ring-8 ring-yellow-400 ring-offset-2 md:ring-offset-4' : ''}`}
            >
              <User className="text-gray-300 w-16 h-16 md:w-24 md:h-24" />
              {user.activeSkin && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent" />
              )}
            </motion.div>
            
            {user.activeAura && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 md:-inset-6 border-4 border-dashed border-purple-500 rounded-[32px] md:rounded-[48px] opacity-40"
              />
            )}
            
            <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl border-2 md:border-4 border-black font-black text-[10px] md:text-sm uppercase italic whitespace-nowrap shadow-lg">
              LVL {user.level}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 mb-3 md:mb-4">
              <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">{user.name}</h2>
              {user.activeTitle && (
                <motion.span 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="px-3 md:px-6 py-1 md:py-2 bg-red-500 text-white text-[10px] md:text-sm font-black rounded-xl md:rounded-2xl border-2 md:border-4 border-black uppercase tracking-widest shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]"
                >
                  {user.activeTitle}
                </motion.span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 rounded-xl border-2 border-black font-bold uppercase text-[10px] md:text-sm">
                <Target className="text-blue-500 w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                {user.schoolLevel}
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 rounded-xl border-2 border-black font-bold uppercase text-[10px] md:text-sm">
                <Calendar className="text-purple-500 w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                2026
              </div>
              
              <button 
                onClick={async () => {
                  audio.play('click');
                  const shareData = {
                    title: `Profil de ${user.name} sur Anglix`,
                    text: `Regarde ma progression sur Anglix ! Je suis niveau ${user.level}.`,
                    url: `${window.location.origin}?player=${user.id || ''}`
                  };

                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch (err) {
                      console.log('Share failed', err);
                    }
                  } else {
                    navigator.clipboard.writeText(shareData.url);
                    setShowCopySuccess(true);
                    setTimeout(() => setShowCopySuccess(false), 2000);
                  }
                }}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-black text-white rounded-xl border-2 border-black font-bold uppercase text-[10px] md:text-sm hover:scale-105 transition-all relative"
              >
                <AnimatePresence>
                  {showCopySuccess ? (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5 md:gap-2"
                    >
                      <Check className="text-green-400 w-3.5 h-3.5 md:w-4.5 md:h-4.5" /> Copié !
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Share2 className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" /> Partager
                    </div>
                  )}
                </AnimatePresence>
              </button>

              {!isOwnProfile && onDuel && user.id && (
                <button 
                  onClick={() => {
                    audio.play('click');
                    onDuel(user.id!);
                  }}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-red-500 text-white rounded-xl border-2 border-black font-bold uppercase text-[10px] md:text-sm hover:scale-105 transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]"
                >
                  <Swords className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" /> Duel
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className={`${stat.bg} p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 md:border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] text-center`}
                >
                  <stat.icon className={`mx-auto mb-1 ${stat.color} w-4 h-4 md:w-5 md:h-5`} />
                  <div className="text-xl md:text-2xl font-black italic leading-none mb-1">{stat.value}</div>
                  <div className="text-[8px] md:text-[10px] font-black uppercase opacity-50 tracking-tighter">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customization Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card-bg rounded-[40px] border-4 border-black p-8 shadow-[0_12px_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-purple-100 rounded-2xl border-2 border-black">
                <Palette size={28} className="text-purple-600" />
              </div>
              <h3 className="text-3xl font-black uppercase italic">Style & Identité</h3>
            </div>

            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-black uppercase tracking-widest opacity-50">Titres Honorifiques</label>
                  <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full border-2 border-black">{titles.length} débloqués</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {titles.length === 0 ? (
                    <div className="w-full py-8 text-center border-4 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-sm font-bold text-gray-300 uppercase italic">Gagne des titres dans les gemmes !</p>
                    </div>
                  ) : (
                    titles.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          audio.play('click');
                          onUpdateProfile({ activeTitle: user.activeTitle === t.name ? undefined : t.name });
                        }}
                        className={`px-6 py-3 rounded-2xl border-4 border-black font-black text-sm uppercase italic transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                          user.activeTitle === t.name ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-black uppercase tracking-widest opacity-50">Auras de Puissance</label>
                  <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full border-2 border-black">{auras.length} débloquées</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {auras.length === 0 ? (
                    <div className="w-full py-8 text-center border-4 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-sm font-bold text-gray-300 uppercase italic">Les auras sont très rares...</p>
                    </div>
                  ) : (
                    auras.map(a => (
                      <button
                        key={a.id}
                        onClick={() => {
                          audio.play('click');
                          onUpdateProfile({ activeAura: user.activeAura === a.name ? undefined : a.name });
                        }}
                        className={`px-6 py-3 rounded-2xl border-4 border-black font-black text-sm uppercase italic transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                          user.activeAura === a.name ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <Sparkles size={16} className="inline mr-2" />
                        {a.name}
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Achievements Panel */}
        <div className="bg-card-bg rounded-[40px] border-4 border-black p-8 shadow-[0_12px_0_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-yellow-100 rounded-2xl border-2 border-black">
              <Trophy size={28} className="text-yellow-600" />
            </div>
            <h3 className="text-3xl font-black uppercase italic">Succès</h3>
          </div>
          
          <div className="space-y-4">
            {achievements.map((s, i) => (
              <motion.div 
                key={i} 
                whileHover={s.done ? { scale: 1.02 } : {}}
                className={`flex items-center gap-4 p-5 rounded-3xl border-4 border-black transition-all ${s.done ? 'bg-green-50 border-green-500/50' : 'bg-gray-50 opacity-40 grayscale'}`}
              >
                <div className={`w-14 h-14 rounded-2xl border-2 border-black flex items-center justify-center shrink-0 ${s.done ? 'bg-green-500 text-white shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-400'}`}>
                  <s.icon size={24} className={s.done ? 'fill-current' : ''} />
                </div>
                <div>
                  <div className="font-black text-sm uppercase italic leading-tight">{s.label}</div>
                  <div className="text-[10px] font-bold opacity-60 uppercase">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-black rounded-[32px] text-white text-center">
            <div className="text-xs font-black uppercase tracking-widest mb-2 opacity-50">Progression Globale</div>
            <div className="text-4xl font-black italic mb-4">
              {Math.round((achievements.filter(a => a.done).length / achievements.length) * 100)}%
            </div>
            <div className="h-3 bg-white/20 rounded-full border-2 border-white/10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(achievements.filter(a => a.done).length / achievements.length) * 100}%` }}
                className="h-full bg-green-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
