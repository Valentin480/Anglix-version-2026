import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowRight, ChevronLeft, Image as ImageIcon, Star, Zap, Printer, ExternalLink, Layers } from 'lucide-react';
import { Lesson } from '../types';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import PrintableLesson from './PrintableLesson';

interface LessonViewProps {
  lesson: Lesson;
  onContinue: () => void;
  onBack: () => void;
  onFlashcards?: () => void;
}

export default function LessonView({ lesson, onContinue, onBack, onFlashcards }: LessonViewProps) {
  const [readTheme, setReadTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Thematic styles for reading
  const themeClasses = {
    light: 'bg-white text-black border-black',
    sepia: 'bg-[#FAF4E8] text-[#332A15] border-[#4E3F1F]',
    dark: 'bg-[#18181A] text-[#E4E4E7] border-[#27272A]'
  };

  const textClasses = {
    base: 'text-sm md:text-base leading-relaxed',
    lg: 'text-base md:text-xl leading-relaxed',
    xl: 'text-lg md:text-2xl leading-relaxed'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-3 md:p-6 pb-24 relative"
    >
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gray-200 z-50">
        <div 
          className="h-full bg-blue-600 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center mb-4 md:mb-6 px-1">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-white text-black rounded-xl border-2 md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-[10px] md:text-sm"
        >
          <ChevronLeft size={16} className="md:w-5 md:h-5" /> Retour
        </button>

        {/* E-reader Customization Toolbar */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-xs font-bold">
          {/* Font Sizes Buttons */}
          <div className="flex items-center gap-1 border-r-2 border-gray-200 pr-2">
            <button 
              onClick={() => setFontSize('base')}
              className={`p-1.5 w-6 h-6 flex items-center justify-center rounded-lg uppercase ${fontSize === 'base' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Petite police"
            >
              A-
            </button>
            <button 
              onClick={() => setFontSize('lg')}
              className={`p-1.5 w-7 h-7 flex items-center justify-center rounded-lg uppercase font-black ${fontSize === 'lg' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Police standard"
            >
              A
            </button>
            <button 
              onClick={() => setFontSize('xl')}
              className={`p-1.5 w-8 h-8 flex items-center justify-center rounded-lg uppercase font-black text-sm ${fontSize === 'xl' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Grande police"
            >
              A+
            </button>
          </div>

          {/* Color Themes Buttons */}
          <div className="flex items-center gap-1.5 pl-1">
            <button 
              onClick={() => setReadTheme('light')}
              className={`w-6 h-6 rounded-full border-2 ${readTheme === 'light' ? 'border-blue-500 scale-110' : 'border-black'} bg-white`}
              title="Mode Clair"
            />
            <button 
              onClick={() => setReadTheme('sepia')}
              className={`w-6 h-6 rounded-full border-2 ${readTheme === 'sepia' ? 'border-blue-500 scale-110' : 'border-[#4E3F1F]'} bg-[#FAF4E8]`}
              title="Mode Sépia"
            />
            <button 
              onClick={() => setReadTheme('dark')}
              className={`w-6 h-6 rounded-full border-2 ${readTheme === 'dark' ? 'border-blue-500 scale-110' : 'border-[#27272A]'} bg-[#18181A]`}
              title="Mode Sombre (Yeux sensibles)"
            />
          </div>
        </div>

        {onFlashcards && (
          <button 
            onClick={onFlashcards}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded-xl border-2 md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-[10px] md:text-sm"
          >
            <Layers size={16} className="md:w-5 md:h-5" /> Flashcards
          </button>
        )}

        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-yellow-400 text-black rounded-xl border-2 md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-[10px] md:text-sm"
        >
          <Printer size={16} className="md:w-5 md:h-5" /> Imprimer
        </button>
      </div>

      {/* Hidden printable content */}
      <div className="print-only">
        <PrintableLesson lesson={lesson} />
      </div>

      <div className="bg-card-bg rounded-[24px] md:rounded-[48px] border-4 md:border-8 border-black overflow-hidden shadow-[0_8px_0_rgba(0,0,0,1)] md:shadow-[0_24px_0_rgba(0,0,0,1)]">
        {/* Header Image/Banner */}
        <div className="h-32 md:h-64 bg-blue-500 relative overflow-hidden border-b-4 md:border-b-8 border-black">

          {lesson.imageUrl ? (
            <img 
              src={lesson.imageUrl} 
              alt={lesson.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
              <BookOpen className="text-white/20 w-12 h-12 md:w-30 md:h-30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 md:bottom-8 left-4 md:left-8 right-4 md:right-8">
            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 text-[10px] md:text-xs">
              <span className="px-2.5 md:px-4 py-0.5 md:py-1 bg-yellow-400 text-black font-black uppercase rounded-full border-2 border-black">
                {lesson.category}
              </span>
              <span className="px-2.5 md:px-4 py-0.5 md:py-1 bg-white text-black font-black uppercase rounded-full border-2 border-black">
                {lesson.level}
              </span>
            </div>
            <h2 className="text-xl md:text-5xl font-black text-white uppercase italic leading-tight tracking-tighter drop-shadow-xl">
              {lesson.title}
            </h2>
          </div>
        </div>

        <div className="p-4 md:p-12">
          <div className="max-w-none mb-8 md:mb-12">
            <div className="flex items-center gap-3 md:gap-6 mb-4 md:mb-8">
              <div className="p-2.5 md:p-4 bg-blue-50 rounded-xl md:rounded-3xl border-2 md:border-4 border-black shrink-0">
                <BookOpen className="text-blue-600 w-5 h-5 md:w-10 md:h-10" />
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-black uppercase italic leading-none mb-1 md:mb-2">L'essentiel</h3>
                <p className="text-gray-500 font-bold uppercase text-[8px] md:text-sm tracking-widest leading-none">Prends le temps de lire</p>
              </div>
            </div>

            <div className={`p-4 md:p-10 rounded-2xl md:rounded-[32px] border-2 md:border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden relative transition-colors duration-300 ${themeClasses[readTheme]}`}>
              {/* Paper line effect */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 1.5rem md:2rem' }}></div>
              
              <div className={`markdown-body prose prose-sm md:prose-xl max-w-none prose-img:rounded-lg md:prose-img:rounded-2xl prose-img:border-2 md:prose-img:border-4 prose-img:border-black relative z-10 transition-all duration-300 ${textClasses[fontSize]}`}>
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{lesson.explanation}</ReactMarkdown>
              </div>
            </div>

            {lesson.youtubeId && (
              <div className="mt-8 md:mt-12">
                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-red-100 rounded-lg md:rounded-xl border-2 border-black">
                    <Zap size={20} className="text-red-600 md:w-6 md:h-6" />
                  </div>
                  Vidéo de Révision
                </h3>
                <div className="relative pt-[56.25%] rounded-2xl md:rounded-[32px] border-4 md:border-8 border-black overflow-hidden shadow-[0_8px_0_rgba(0,0,0,1)] md:shadow-[0_16px_0_rgba(0,0,0,1)]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-3 md:mt-4 flex justify-center">
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.youtubeSearchQuery || lesson.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[8px] md:text-xs font-black uppercase italic text-gray-400 hover:text-red-600 transition-colors"
                  >
                    Problème avec la vidéo ? <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* Placeholder for more details/images if needed */}
            <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-yellow-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 md:border-4 border-black">
                <h4 className="text-lg md:text-xl font-black uppercase italic mb-2 md:mb-4 flex items-center gap-2">
                  <Star size={18} className="text-yellow-500 fill-yellow-500 md:w-5 md:h-5" /> Astuce
                </h4>
                <p className="font-bold text-gray-700 text-xs md:text-base">
                  Relis bien les points clés. Le quiz qui suit testera ta compréhension globale du sujet !
                </p>
              </div>
              <div className="bg-purple-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 md:border-4 border-black">
                <h4 className="text-lg md:text-xl font-black uppercase italic mb-2 md:mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-purple-500 fill-purple-500 md:w-5 md:h-5" /> Récompense
                </h4>
                <p className="font-bold text-gray-700 text-xs md:text-base">
                  Réussir ce quiz te rapportera +50 XP et t'aidera à monter de niveau rapidement.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-5 md:py-8 bg-black text-white rounded-2xl md:rounded-[32px] font-black text-lg md:text-2xl uppercase italic tracking-widest flex items-center justify-center gap-3 md:gap-4 hover:bg-gray-800 transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-[0_6px_0_rgba(0,0,0,0.3)] md:shadow-[0_12px_0_rgba(0,0,0,0.3)]"
          >
            Passer au Quiz <ArrowRight size={24} className="md:w-8 md:h-8" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
