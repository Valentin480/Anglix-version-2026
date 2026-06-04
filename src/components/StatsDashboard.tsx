import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Award, Clock, Target, 
  Brain, Zap, Trophy, Flame, ChevronRight,
  BookOpen, Swords, Star
} from 'lucide-react';
import { UserStats } from '../types';

interface StatsDashboardProps {
  stats: UserStats;
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function StatsDashboard({ stats, onClose }: StatsDashboardProps) {
  const categoryData = Object.entries(stats.xpPerCategory || {}).map(([name, value]) => ({
    name,
    xp: value
  }));

  const accuracyData = Object.entries(stats.accuracyPerCategory || {}).map(([name, value]) => ({
    name,
    accuracy: Math.round(value * 100)
  }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white border-4 border-black rounded-[36px] shadow-[0_16px_0_rgba(0,0,0,1)] max-w-5xl w-full p-5 md:p-10 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest leading-none">Rapport d'activité</span>
            <h2 className="text-2xl md:text-5xl font-black text-black uppercase italic tracking-tighter leading-tight mt-1">Analyse de Performance</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-2xl border-2 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs"
          >
            Fermer le rapport
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={<Zap className="text-yellow-600" />} 
            label="Quiz Terminés" 
            value={stats.totalQuizzes} 
            color="bg-yellow-50"
          />
          <StatCard 
            icon={<Swords className="text-red-500" />} 
            label="Duels Joués" 
            value={stats.totalDuels} 
            color="bg-red-50"
          />
          <StatCard 
            icon={<Trophy className="text-blue-500" />} 
            label="Victoires" 
            value={stats.duelWins} 
            color="bg-blue-50"
          />
          <StatCard 
            icon={<Flame className="text-orange-500" />} 
            label="Meilleure Série" 
            value={`${stats.bestStreak}j`} 
            color="bg-orange-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* XP Distribution */}
          <div className="bg-gray-50 rounded-[28px] border-2 border-black p-6 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-black">
              <Brain className="text-blue-600 w-5 h-5" /> EXP par Matière
            </h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold', fontSize: '11px' }}
                  />
                  <Bar dataKey="xp" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracy per Category */}
          <div className="bg-gray-50 rounded-[28px] border-2 border-black p-6 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-black">
              <Target className="text-green-600 w-5 h-5" /> Précision (%)
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[150px] w-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accuracyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="accuracy"
                    >
                      {accuracyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '2px solid black', fontWeight: 'bold', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                {accuracyData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 p-1.5 bg-white border border-gray-200 rounded-xl">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-black uppercase text-gray-700 truncate">{entry.name}: {entry.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Time Spent / Activity */}
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-[24px] border-2 border-black p-6 shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-purple-900">
                <Clock className="text-purple-600" /> Temps cumulé d'étude
              </h3>
              <p className="text-xs font-bold text-purple-700 mt-1">
                "Chaque minute passée sur Anglix renforce tes neurones. Continue comme ça !"
              </p>
            </div>
            <div className="text-3xl font-black italic text-purple-900 shrink-0 bg-white border-2 border-black px-4 py-2 rounded-xl">
              {stats.totalTimeSpent} min
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  return (
    <div className={`bg-white rounded-2xl border-4 border-black p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center gap-4`}>
      <div className={`p-3 rounded-xl border-2 border-black ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{label}</p>
        <p className="text-2xl font-black italic leading-none">{value}</p>
      </div>
    </div>
  );
}
