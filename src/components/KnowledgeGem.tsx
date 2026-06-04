import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Star, Zap, User, Shield, Gem, Coins, Flame, ZapOff, Palette, Crown } from 'lucide-react';
import { Reward, RewardType, AppTheme } from '../types';
import { audio } from '../lib/audio';
import confetti from 'canvas-confetti';

interface KnowledgeGemProps {
  onOpen: (reward: Reward) => void;
  onClose: () => void;
}

const RARITIES = [
  { name: 'Rare', color: '#22c55e', shadow: 'shadow-green-500/50' },
  { name: 'Super Rare', color: '#a855f7', shadow: 'shadow-purple-500/50' },
  { name: 'Epic', color: '#ec4899', shadow: 'shadow-pink-500/50' },
  { name: 'Mythic', color: '#ef4444', shadow: 'shadow-red-500/50' },
  { name: 'Legendary', color: '#eab308', shadow: 'shadow-yellow-500/50' }
] as const;

const REWARD_POOL: Record<RewardType, { name: string, icon: any, themeId?: AppTheme }[]> = {
  xp_boost: [
    { name: 'Boost XP', icon: Zap }
  ],
  skin: [
    { name: 'Skin Néon', icon: User },
    { name: 'Skin Or', icon: User },
    { name: 'Skin Galaxie', icon: User },
    { name: 'Skin Rétro', icon: User }
  ],
  achievement: [
    { name: 'Maître du Savoir', icon: Star },
    { name: 'Explorateur', icon: Star },
    { name: 'Génie', icon: Star }
  ],
  trophy: [
    { name: 'Coupe de Bronze', icon: Trophy },
    { name: 'Coupe d\'Argent', icon: Trophy },
    { name: 'Coupe d\'Or', icon: Trophy }
  ],
  aura: [
    { name: 'Aura de Feu', icon: Flame },
    { name: 'Aura de Glace', icon: Sparkles },
    { name: 'Aura Électrique', icon: Zap }
  ],
  profile_name: [
    { name: 'Légende', icon: Shield },
    { name: 'Savant', icon: Shield },
    { name: 'Érudit', icon: Shield },
    { name: 'Empereur', icon: Crown },
    { name: 'Phénix', icon: Flame }
  ],
  gem: [
    { name: 'Gemmes', icon: Gem }
  ],
  coin: [
    { name: 'Pièces', icon: Coins }
  ],
  theme: [
    { name: 'Thème Sombre', icon: Palette, themeId: 'dark' },
    { name: 'Thème Cyberpunk', icon: Palette, themeId: 'cyberpunk' },
    { name: 'Thème Nature', icon: Palette, themeId: 'nature' },
    { name: 'Thème Océan', icon: Palette, themeId: 'ocean' },
    { name: 'Thème Or', icon: Palette, themeId: 'gold' }
  ],
  streak_freeze: [
    { name: 'Gel de Série', icon: ZapOff }
  ]
};

export default function KnowledgeGem({ onOpen, onClose }: KnowledgeGemProps) {
  const [clicks, setClicks] = useState(0);
  const [rarityIndex, setRarityIndex] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  const currentRarity = RARITIES[rarityIndex];

  const handleClick = () => {
    if (isOpening || isOpened) return;

    audio.play('click');
    audio.haptic(20);
    setClicks(prev => prev + 1);
    setShakeIntensity(prev => prev + 2);

    // Visual feedback for click
    if (Math.random() < 0.3) {
      confetti({
        particleCount: 10,
        spread: 30,
        origin: { y: 0.6 },
        colors: [currentRarity.color]
      });
    }

    if (clicks >= 6) {
      startOpeningSequence();
    }
  };

  const startOpeningSequence = () => {
    setIsOpening(true);
    audio.play('gemOpen');
    audio.haptic([100, 50, 100, 50, 200]);
    
    // Roll for rarity at the start of opening
    const roll = Math.random();
    let rIndex = 0;
    if (roll < 0.02) rIndex = 4; // Legendary (2%)
    else if (roll < 0.07) rIndex = 3; // Mythic (5%)
    else if (roll < 0.22) rIndex = 2; // Epic (15%)
    else if (roll < 0.50) rIndex = 1; // Super Rare (28%)
    else rIndex = 0; // Rare (50%)
    
    setRarityIndex(rIndex);

    setTimeout(() => {
      setIsOpened(true);
      setIsOpening(false);
      generateReward(rIndex);
    }, 1500);
  };

  const generateReward = (rIndex: number) => {
    const selectedRarity = RARITIES[rIndex];
    const rarityName = selectedRarity.name;
    
    let newReward: Reward = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'coin',
      name: '',
      rarity: rarityName as any,
    };

    const baseCoins = 50;
    const baseGems = 3;

    if (rarityName === 'Rare') {
      newReward.coins = baseCoins;
      newReward.gems = baseGems;
      newReward.name = "Coffre Rare";
      newReward.type = 'coin';
    } else if (rarityName === 'Super Rare') {
      newReward.coins = baseCoins * 2;
      newReward.gems = baseGems * 2;
      newReward.name = "Coffre Super Rare";
      newReward.type = 'coin';
    } else if (rarityName === 'Epic') {
      newReward.coins = baseCoins * 3;
      newReward.gems = baseGems * 3;
      newReward.name = "Coffre Épique";
      
      const roll = Math.random();
      if (roll < 0.15) { // 15% Title
        const title = REWARD_POOL.profile_name[Math.floor(Math.random() * REWARD_POOL.profile_name.length)];
        newReward.type = 'profile_name';
        newReward.name = `Titre : ${title.name}`;
      } else if (roll < 0.35) { // 20% XP Boost (5 min)
        newReward.type = 'xp_boost';
        newReward.name = "Boost XP (5 min)";
        newReward.value = 5;
      }
    } else if (rarityName === 'Mythic') {
      newReward.coins = baseCoins * 4;
      newReward.gems = baseGems * 4;
      newReward.name = "Coffre Mythique";

      const roll = Math.random();
      if (roll < 0.45) { // ~45% Title (3x Epic)
        const title = REWARD_POOL.profile_name[Math.floor(Math.random() * REWARD_POOL.profile_name.length)];
        newReward.type = 'profile_name';
        newReward.name = `Titre : ${title.name}`;
      } else if (roll < 0.60) { // 15% Streak Freeze
        newReward.type = 'streak_freeze';
        newReward.name = "Gel de Série";
        newReward.value = 1;
      } else if (roll < 0.80) { // 20% XP Boost (15 min)
        newReward.type = 'xp_boost';
        newReward.name = "Boost XP (15 min)";
        newReward.value = 15;
      }
    } else if (rarityName === 'Legendary') {
      newReward.coins = baseCoins * 10;
      newReward.gems = baseGems * 15;
      newReward.name = "Coffre Légendaire";

      const roll = Math.random();
      if (roll < 0.60) { // > 50% Title
        const title = REWARD_POOL.profile_name[Math.floor(Math.random() * REWARD_POOL.profile_name.length)];
        newReward.type = 'profile_name';
        newReward.name = `Titre : ${title.name}`;
      } else if (roll < 0.85) { // 25% Aura or Theme
        if (Math.random() < 0.5) {
          const aura = REWARD_POOL.aura[Math.floor(Math.random() * REWARD_POOL.aura.length)];
          newReward.type = 'aura';
          newReward.name = aura.name;
        } else {
          const theme = REWARD_POOL.theme[Math.floor(Math.random() * REWARD_POOL.theme.length)];
          newReward.type = 'theme';
          newReward.name = theme.name;
          newReward.themeId = theme.themeId;
          newReward.id = `theme-${theme.themeId}`;
        }
      }
    }

    setReward(newReward);
    audio.play('explosion');

    // Big confetti for high rarities
    if (rIndex >= 3) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [selectedRarity.color, '#ffffff', '#000000']
      });
    } else {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: [selectedRarity.color]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '110vh', x: Math.random() * 100 + 'vw', opacity: 0 }}
            animate={{ 
              y: '-10vh', 
              opacity: [0, 0.5, 0],
              rotate: 360
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity, 
              delay: Math.random() * 5 
            }}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
          />
        ))}
      </div>

      <div className="relative w-full max-w-lg p-4 md:p-8 text-center">
        <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.div
              key="closed"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, filter: 'brightness(3)' }}
              className="flex flex-col items-center gap-8 md:gap-12"
            >
              <div className="space-y-2">
                <motion.h2 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  Pierre de Savoir
                </motion.h2>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] md:text-sm">Clique pour charger l'énergie !</p>
              </div>
              
              <div className="relative">
                {/* Aura Ring */}
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.5, 0.2]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ borderColor: currentRarity.color }}
                  className="absolute -inset-8 md:-inset-12 border-4 border-dashed rounded-full"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9, rotate: Math.random() * 10 - 5 }}
                  onClick={handleClick}
                  animate={isOpening ? {
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 0.8, 1.5],
                  } : {
                    x: [0, -shakeIntensity, shakeIntensity, 0],
                    y: [0, shakeIntensity, -shakeIntensity, 0],
                  }}
                  transition={isOpening ? { duration: 1.5, ease: "easeInOut" } : { duration: 0.1 }}
                  style={{ 
                    backgroundColor: currentRarity.color,
                    boxShadow: `0 0 ${20 + shakeIntensity * 5}px ${currentRarity.color}`
                  }}
                  className={`relative w-40 h-40 md:w-56 md:h-56 rounded-[32px] md:rounded-[48px] border-4 md:border-8 border-white/30 flex items-center justify-center cursor-pointer overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  >
                    <Gem size={64} className="text-white fill-white/20" />
                  </motion.div>

                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (clicks / 7) * 251}
                      className="opacity-20 transition-all duration-300"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl md:text-6xl font-black text-white/40 italic">{7 - clicks > 0 ? 7 - clicks : '!'}</span>
                  </div>
                </motion.button>
              </div>

              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="flex justify-between w-full mb-1">
                  <span className="text-[10px] font-black uppercase text-white/50">Rareté actuelle</span>
                  <span style={{ color: currentRarity.color }} className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                    {currentRarity.name}
                  </span>
                </div>
                <div className="flex gap-1.5 md:gap-2 w-full">
                  {RARITIES.map((r, i) => (
                    <div 
                      key={r.name} 
                      className="flex-1 h-2 md:h-3 rounded-full border-2 border-black overflow-hidden bg-white/10"
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: i <= rarityIndex ? '100%' : '0%' }}
                        style={{ backgroundColor: r.color }}
                        className="h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="opened"
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="relative"
            >
              {/* Reward Glow */}
              <div 
                style={{ backgroundColor: currentRarity.color }}
                className="absolute inset-0 blur-[80px] md:blur-[120px] opacity-40 rounded-full" 
              />

              <div className="relative bg-white rounded-[40px] md:rounded-[60px] border-4 md:border-8 border-black p-8 md:p-12 flex flex-col items-center gap-6 md:gap-8 shadow-[0_16px_0_rgba(0,0,0,1)] md:shadow-[0_32px_0_rgba(0,0,0,1)]">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <span style={{ color: currentRarity.color }} className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2 block">
                    {reward?.rarity} DÉBLOQUÉ !
                  </span>
                  <h3 className="text-3xl md:text-5xl font-black text-black uppercase italic tracking-tighter leading-none">
                    {reward?.name}
                  </h3>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.5 }}
                  style={{ backgroundColor: currentRarity.color }}
                  className={`w-32 h-32 md:w-40 md:h-40 rounded-[32px] md:rounded-[40px] border-4 md:border-8 border-black flex items-center justify-center text-white shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)]`}
                >
                  {reward && (
                    reward.type === 'coin' ? <Coins size={64} className="drop-shadow-lg" /> :
                    reward.type === 'gem' ? <Gem size={64} className="drop-shadow-lg" /> :
                    reward.type === 'xp_boost' ? <Zap size={64} className="drop-shadow-lg" /> :
                    reward.type === 'streak_freeze' ? <ZapOff size={64} className="drop-shadow-lg" /> :
                    reward.type === 'profile_name' ? <Shield size={64} className="drop-shadow-lg" /> :
                    reward.type === 'aura' ? <Flame size={64} className="drop-shadow-lg" /> :
                    reward.type === 'theme' ? <Palette size={64} className="drop-shadow-lg" /> :
                    <Star size={64} className="drop-shadow-lg" />
                  )}
                </motion.div>

                {reward && (reward.coins || reward.gems) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-4"
                  >
                    {reward.coins && (
                      <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl border-2 border-black font-black">
                        <Coins size={20} className="text-yellow-600" />
                        +{reward.coins}
                      </div>
                    )}
                    {reward.gems && (
                      <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl border-2 border-black font-black">
                        <Gem size={20} className="text-blue-500" />
                        +{reward.gems}
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="w-full space-y-4">
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={() => reward && onOpen(reward)}
                    className="w-full py-4 md:py-6 bg-black text-white rounded-2xl md:rounded-3xl font-black text-lg md:text-xl uppercase italic tracking-widest hover:bg-gray-800 transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[0_4px_0_rgba(0,0,0,0.3)] md:shadow-[0_8px_0_rgba(0,0,0,0.3)]"
                  >
                    Récupérer
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
