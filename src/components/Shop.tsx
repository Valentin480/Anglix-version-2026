import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Zap, Gem, Coins, Star, Sparkles, Shield, Flame, Snowflake, Heart } from 'lucide-react';
import { UserState, Reward } from '../types';
import { audio } from '../lib/audio';

interface ShopProps {
  user: UserState;
  onPurchase: (item: any) => void;
}

const SHOP_ITEMS = [
  {
    id: 'streak_freeze',
    name: 'Gel de Série',
    description: 'Protège ta série si tu oublies de jouer un jour.',
    price: 500,
    currency: 'coins',
    icon: Snowflake,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'xp_booster_30',
    name: 'Boost XP 30min',
    description: 'Gagne 2x plus d\'XP pendant 30 minutes.',
    price: 1000,
    currency: 'coins',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'mystery_gem',
    name: 'Pierre Mystère',
    description: 'Une pierre de savoir aléatoire (Rare+ garanti).',
    price: 50,
    currency: 'gems',
    icon: Gem,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'aura_rainbow',
    name: 'Aura Arc-en-ciel',
    description: 'Une aura légendaire multicolore.',
    price: 200,
    currency: 'gems',
    icon: Sparkles,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 'theme_dark',
    name: 'Thème Sombre',
    description: 'Une interface élégante et reposante.',
    price: 1000,
    currency: 'coins',
    icon: Star,
    color: 'bg-gray-800 text-white',
    type: 'theme',
    themeId: 'dark'
  },
  {
    id: 'theme_cyberpunk',
    name: 'Thème Cyberpunk',
    description: 'Néon, futuriste et électrique.',
    price: 2500,
    currency: 'coins',
    icon: Zap,
    color: 'bg-purple-900 text-green-400',
    type: 'theme',
    themeId: 'cyberpunk'
  },
  {
    id: 'theme_nature',
    name: 'Thème Nature',
    description: 'Zen, vert et apaisant.',
    price: 1500,
    currency: 'coins',
    icon: Heart,
    color: 'bg-green-100 text-green-700',
    type: 'theme',
    themeId: 'nature'
  },
  {
    id: 'theme_ocean',
    name: 'Thème Océan',
    description: 'Plonge dans le bleu profond.',
    price: 1500,
    currency: 'coins',
    icon: Snowflake,
    color: 'bg-blue-900 text-blue-200',
    type: 'theme',
    themeId: 'ocean'
  }
];

export default function Shop({ user, onPurchase }: ShopProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 md:mb-12">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Boutique</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-sm">Dépense tes gains !</p>
        </div>
        <div className="flex gap-3 md:gap-4">
          <div className="flex items-center gap-1.5 md:gap-2 bg-white border-2 md:border-4 border-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <Coins className="text-yellow-600 w-4 h-4 md:w-5 md:h-5" />
            <span className="font-black text-sm md:text-base">{user.coins}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 bg-white border-2 md:border-4 border-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <Gem className="text-blue-500 w-4 h-4 md:w-5 md:h-5" />
            <span className="font-black text-sm md:text-base">{user.gems}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {SHOP_ITEMS.map((item) => {
          const canAfford = item.currency === 'coins' ? user.coins >= item.price : user.gems >= item.price;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -5 }}
              className="bg-white border-4 md:border-8 border-black rounded-[24px] md:rounded-[32px] p-4 md:p-6 flex flex-col shadow-[0_8px_0_rgba(0,0,0,1)] md:shadow-[0_12px_0_rgba(0,0,0,1)]"
            >
              <div className="flex gap-4 md:gap-6 mb-4 md:mb-6">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl border-2 md:border-4 border-black flex items-center justify-center ${item.color} shrink-0`}>
                  <item.icon className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black uppercase italic leading-none mb-1 md:mb-2">{item.name}</h3>
                  <p className="text-gray-500 font-bold text-xs md:text-sm leading-tight">{item.description}</p>
                </div>
              </div>

              <button
                disabled={!canAfford}
                onClick={() => {
                  audio.play('click');
                  onPurchase(item);
                }}
                className={`mt-auto py-3 md:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 border-black font-black uppercase italic tracking-widest flex items-center justify-center gap-2 transition-all text-sm md:text-base ${
                  canAfford 
                    ? 'bg-black text-white hover:bg-gray-800 shadow-[0_4px_0_rgba(255,255,255,0.2)]' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {item.currency === 'coins' ? <Coins className="w-4 h-4 md:w-5 md:h-5" /> : <Gem className="w-4 h-4 md:w-5 md:h-5" />}
                {item.price} {item.currency === 'coins' ? 'Pièces' : 'Gemmes'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 md:mt-12 p-6 md:p-8 bg-black text-white rounded-[32px] md:rounded-[40px] border-4 md:border-8 border-black flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl md:text-2xl font-black uppercase italic">Série : {user.streak} jours</h4>
            <p className="text-red-500 font-bold uppercase text-[10px] tracking-widest">Gels en stock : {user.streakFreezeCount}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 md:w-3 h-6 md:h-8 rounded-full border-2 border-white/20 ${i < user.streak % 7 ? 'bg-red-500' : 'bg-white/10'}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
