import React from 'react';
import { motion } from 'motion/react';
import { Bell, Moon, Volume2, Shield, LogOut, Trash2, Info, Palette, Check } from 'lucide-react';
import { UserState, AppTheme } from '../types';

interface SettingsProps {
  user: UserState;
  onUpdateTheme: (theme: AppTheme) => void;
  onReset: () => void;
}

export default function Settings({ user, onUpdateTheme, onReset }: SettingsProps) {
  const unlockedThemes = user.inventory?.filter(r => r.type === 'theme') || [];
  const themes: { id: AppTheme; name: string; color: string }[] = [
    { id: 'default', name: 'Classique', color: 'bg-[#FF6321]' },
    { id: 'dark', name: 'Sombre', color: 'bg-gray-900' },
    { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-purple-600' },
    { id: 'nature', name: 'Nature', color: 'bg-green-600' },
    { id: 'gold', name: 'Or', color: 'bg-yellow-600' },
    { id: 'ocean', name: 'Océan', color: 'bg-blue-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="bg-card-bg rounded-[32px] border-4 border-black p-8 shadow-[0_8px_0_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black uppercase italic mb-8">Paramètres</h2>
        
        <div className="space-y-8">
          {/* Themes Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Palette size={24} />
              <h3 className="font-black uppercase italic text-xl">Thèmes débloqués</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themes.map((theme) => {
                const isUnlocked = theme.id === 'default' || unlockedThemes.some(t => t.id === `theme-${theme.id}`);
                const isActive = (user.activeTheme || 'default') === theme.id;

                return (
                  <button
                    key={theme.id}
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && onUpdateTheme(theme.id)}
                    className={`relative p-4 rounded-2xl border-4 border-black flex flex-col items-center gap-2 transition-all ${
                      isActive ? 'bg-black text-white scale-105' : isUnlocked ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 opacity-50 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 border-black ${theme.color}`} />
                    <span className="font-black text-[10px] uppercase tracking-tighter">{theme.name}</span>
                    {isActive && <Check size={16} className="absolute top-2 right-2" />}
                    {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">🔒</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-black">
            <div className="flex items-center gap-3">
              <Bell size={24} />
              <span className="font-bold uppercase">Notifications</span>
            </div>
            <div className="w-12 h-6 bg-green-500 rounded-full border-2 border-black relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-black">
            <div className="flex items-center gap-3">
              <Moon size={24} />
              <span className="font-bold uppercase">Mode Sombre</span>
            </div>
            <div className="w-12 h-6 bg-gray-300 rounded-full border-2 border-black relative">
              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-black">
            <div className="flex items-center gap-3">
              <Volume2 size={24} />
              <span className="font-bold uppercase">Effets Sonores</span>
            </div>
            <div className="w-12 h-6 bg-green-500 rounded-full border-2 border-black relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-gray-100 space-y-4">
          <button className="w-full flex items-center gap-3 p-4 text-gray-500 hover:text-black transition-colors font-bold uppercase text-sm">
            <Shield size={20} /> Politique de Confidentialité
          </button>
          <button className="w-full flex items-center gap-3 p-4 text-gray-500 hover:text-black transition-colors font-bold uppercase text-sm">
            <Info size={20} /> À propos d'Anglix
          </button>
          <button 
            onClick={onReset}
            className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black uppercase text-sm"
          >
            <Trash2 size={20} /> Réinitialiser le compte
          </button>
        </div>
        </div>
      </div>
      
      <div className="text-center text-white/50 font-bold text-xs uppercase tracking-widest mt-8">
        Anglix v1.0.4 • Fait avec ❤️ pour apprendre
      </div>
    </div>
  );
}
