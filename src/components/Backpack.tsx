import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Trash2, Play, BookOpen, 
  Search, Filter, Calendar, ChevronRight,
  X
} from 'lucide-react';
import { SavedLesson } from '../types';

interface BackpackProps {
  savedLessons: SavedLesson[];
  onRemove: (lessonId: string) => void;
  onPlay: (lessonId: string) => void;
  onClose: () => void;
}

export default function Backpack({ savedLessons, onRemove, onPlay, onClose }: BackpackProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredLessons = savedLessons.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 z-[150] w-full max-w-md bg-white border-l-8 border-black shadow-2xl flex flex-col"
    >
      <div className="p-6 bg-black text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Briefcase className="text-yellow-400" size={32} />
          <div>
            <h2 className="text-2xl font-black uppercase italic leading-none">Mon Sac à Dos</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/60">Tes fiches sauvegardées</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 border-b-4 border-black bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une fiche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-4 border-black rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black border-dashed">
              <BookOpen className="text-gray-300" size={32} />
            </div>
            <p className="font-black uppercase italic text-gray-400">Ton sac est vide !</p>
            <p className="text-xs font-bold text-gray-300 uppercase mt-2">Sauvegarde des leçons pour les retrouver ici</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredLessons.map((lesson) => (
              <motion.div
                key={lesson.lessonId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-full border-2 border-black mb-2 inline-block">
                      {lesson.category}
                    </span>
                    <h3 className="font-black text-lg leading-tight uppercase italic">{lesson.title}</h3>
                  </div>
                  <button 
                    onClick={() => onRemove(lesson.lessonId)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                    <Calendar size={12} />
                    Sauvé le {new Date(lesson.savedAt).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => onPlay(lesson.lessonId)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-black uppercase italic text-xs hover:bg-yellow-400 hover:text-black transition-all"
                  >
                    Réviser <Play size={14} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-6 bg-gray-50 border-t-4 border-black">
        <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest">
          {filteredLessons.length} Fiche{filteredLessons.length > 1 ? 's' : ''} dans ton sac
        </p>
      </div>
    </motion.div>
  );
}
