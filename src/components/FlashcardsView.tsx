import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  ChevronLeft, 
  Printer, 
  RefreshCw, 
  Sparkles, 
  Check, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit, 
  BookOpen, 
  Lightbulb, 
  Zap, 
  Heart, 
  Save, 
  CheckCircle2, 
  Target 
} from 'lucide-react';
import { Lesson, Question } from '../types';
import { audio } from '../lib/audio';

// Dynamic category config with matching stylized SVGs/illustrations
interface CategoryConfig {
  borderClass: string;
  badgeClass: string;
  bgClass: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
}

const getCategoryStyles = (categoryType: string): CategoryConfig => {
  const cat = categoryType.toLowerCase();
  
  if (cat.includes('def') || cat.includes('definition')) {
    return {
      borderClass: 'border-red-500',
      badgeClass: 'bg-red-500 text-white',
      bgClass: 'bg-red-50',
      icon: <BookOpen size={16} />,
      illustration: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-300">
          <rect x="20" y="25" width="60" height="50" rx="4" fill="none" stroke="#ef4444" strokeWidth="4" />
          <line x1="30" y1="40" x2="70" y2="40" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <line x1="30" y1="60" x2="55" y2="60" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <circle cx="75" cy="20" r="8" fill="#f87171" />
        </svg>
      )
    };
  }
  
  if (cat.includes('formula') || cat.includes('formule') || cat.includes('math')) {
    return {
      borderClass: 'border-blue-500',
      badgeClass: 'bg-blue-500 text-white',
      bgClass: 'bg-blue-50',
      icon: <Lightbulb size={16} />,
      illustration: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-300">
          <circle cx="50" cy="55" r="22" fill="none" stroke="#3b82f6" strokeWidth="4" />
          <path d="M42 77h16M45 82h10M50 33v22M50 55l12-12" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 30l8 8M70 30l-8 8" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    };
  }

  if (cat.includes('example') || cat.includes('exemple') || cat.includes('science')) {
    return {
      borderClass: 'border-emerald-500',
      badgeClass: 'bg-emerald-500 text-white',
      bgClass: 'bg-emerald-50',
      icon: <CheckCircle2 size={16} />,
      illustration: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-300">
          <path d="M35 55l10 10 25-25" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#10b981" strokeWidth="4" />
        </svg>
      )
    };
  }

  if (cat.includes('tip') || cat.includes('astuce')) {
    return {
      borderClass: 'border-amber-500',
      badgeClass: 'bg-amber-400 text-black',
      bgClass: 'bg-amber-50',
      icon: <Zap size={16} />,
      illustration: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-300">
          <path d="M55 15L30 52h22L45 85l25-37H48z" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    };
  }

  // Classic fallback (Yellow / Purple for history/vocabs)
  return {
    borderClass: 'border-purple-500',
    badgeClass: 'bg-purple-500 text-white',
    bgClass: 'bg-purple-50',
    icon: <Sparkles size={16} />,
    illustration: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-300">
        <path d="M50 15l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" fill="none" stroke="#a855f7" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="3" fill="#c084fc" />
        <circle cx="80" cy="80" r="4" fill="#c084fc" />
      </svg>
    )
  };
};

export interface Flashcard {
  id: string;
  front: string;
  frontSub?: string;
  back: string;
  backSub?: string;
  category: string;
  diagram?: string; // custom SVG diagram from questions
}

interface FlashcardsViewProps {
  lesson: Lesson;
  onBack: () => void;
}

export default function FlashcardsView({ lesson, onBack }: FlashcardsViewProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [rotatedCards, setRotatedCards] = useState<Record<string, boolean>>({});
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'study' | 'grid'>('study');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Carousel active study index
  const [currentIndex, setCurrentIndex] = useState(0);

  // New custom card state
  const [isAdding, setIsAdding] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newFrontSub, setNewFrontSub] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newBackSub, setNewBackSub] = useState('');
  const [newCategory, setNewCategory] = useState('Général');

  // Editing state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Parse lesson to create initial Flashcards
  useEffect(() => {
    // 1. Instant parsing of lesson.explanation
    const extractedCards: Flashcard[] = [];
    const text = lesson.explanation;

    // A. Parse revision-def blocks
    const defRegex = /<div class="revision-def">([\s\S]*?)<\/div>/g;
    let match;
    let index = 1;
    while ((match = defRegex.exec(text)) !== null) {
      const inner = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      const parts = inner.split(/[-:：]/);
      const front = parts[0]?.trim() || `Définition ${index}`;
      const back = parts.slice(1).join(':').trim() || inner;
      extractedCards.push({
        id: `ext-def-${index}`,
        front: front,
        frontSub: 'Terme / Concept',
        back: back,
        category: 'Définition'
      });
      index++;
    }

    // B. Parse revision-formula blocks
    const formulaRegex = /<div class="revision-formula">([\s\S]*?)<\/div>/g;
    index = 1;
    while ((match = formulaRegex.exec(text)) !== null) {
      const inner = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      const parts = inner.split(/[-:：]/);
      const front = parts[0]?.trim() || `Formule ${index}`;
      const back = parts.slice(1).join(':').trim() || inner;
      extractedCards.push({
        id: `ext-form-${index}`,
        front: front,
        frontSub: 'Formule / Théorème',
        back: back,
        category: 'Formule'
      });
      index++;
    }

    // C. Parse direct key-value dates or vocabulary, e.g. **1789** : Prise de la Bastille
    const markdownKvRegex = /\*\*(.*?)\*\*\s*:\s*([^\n]+)/g;
    index = 1;
    while ((match = markdownKvRegex.exec(text)) !== null) {
      const key = match[1].trim();
      const val = match[2].trim();
      
      // Prevent duplicates
      if (!extractedCards.some(c => c.front.toLowerCase() === key.toLowerCase())) {
        extractedCards.push({
          id: `ext-kv-${index}`,
          front: key,
          frontSub: isNaN(Number(key.replace(/\s/g, ''))) ? 'Mot-clé' : 'Point historique / Date',
          back: val,
          category: isNaN(Number(key.replace(/\s/g, ''))) ? 'Vocabulaire' : 'Repère temporel'
        });
        index++;
      }
    }

    // D. Extract from Quiz questions (very fast fallback fallback)
    lesson.questions.slice(0, 8).forEach((q, qidx) => {
      let resolvedAnswer = '';
      if (q.type === 'qcm' && q.options) {
        resolvedAnswer = q.options[Number(q.correctAnswer)] || String(q.correctAnswer);
      } else if (q.type === 'true_false' && q.options) {
        resolvedAnswer = q.options[Number(q.correctAnswer)] || String(q.correctAnswer);
      } else {
        resolvedAnswer = String(q.correctAnswer);
      }

      extractedCards.push({
        id: `ext-quiz-${qidx}`,
        front: q.text,
        frontSub: q.type === 'qcm' ? 'Question à choix multiples' : 'Défi Quiz',
        back: resolvedAnswer,
        backSub: q.explanation || undefined,
        category: 'Défi Quiz',
        diagram: q.diagram
      });
    });

    // If we extracted absolutely nothing, provide direct fallbacks based on Lesson details
    if (extractedCards.length === 0) {
      extractedCards.push({
        id: 'fallback-1',
        front: lesson.title,
        frontSub: 'Titre principal',
        back: `Leçon sur le thème de ${lesson.category} (${lesson.level})`,
        category: 'Général'
      });
    }

    // Match with saved state inside localStorage to persist mastered status
    const cachedMastery = localStorage.getItem(`mastered_flashcards_${lesson.id}`);
    if (cachedMastery) {
      try {
        setMasteredCards(JSON.parse(cachedMastery));
      } catch (err) {
        console.error(err);
      }
    }

    setCards(extractedCards);
  }, [lesson]);

  // Persist mastery status changes
  const toggleMastered = (cardId: string) => {
    const updated = {
      ...masteredCards,
      [cardId]: !masteredCards[cardId]
    };
    setMasteredCards(updated);
    localStorage.setItem(`mastered_flashcards_${lesson.id}`, JSON.stringify(updated));
    audio.play('success');
  };

  const toggleRotate = (cardId: string) => {
    setRotatedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
    audio.play('click');
  };

  // Get dynamic category count for simple filters
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    cards.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return [['all', cards.length], ...Object.entries(counts)];
  }, [cards]);

  // Filtered cards based on selected filter
  const filteredCards = useMemo(() => {
    if (categoryFilter === 'all') return cards;
    return cards.filter(c => c.category === categoryFilter);
  }, [cards, categoryFilter]);

  // Handle active flashcard carousel reset
  useEffect(() => {
    setCurrentIndex(0);
  }, [categoryFilter]);

  const activeCard = filteredCards[currentIndex];

  // Statistics
  const masteryPercentage = useMemo(() => {
    if (cards.length === 0) return 0;
    const masteredCount = cards.filter(c => masteredCards[c.id]).length;
    return Math.round((masteredCount / cards.length) * 100);
  }, [cards, masteredCards]);

  // Print function
  const handlePrint = () => {
    audio.play('success');
    window.print();
  };

  // Add card
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    if (editingCardId) {
      // Modify
      setCards(prev => prev.map(c => c.id === editingCardId ? {
        ...c,
        front: newFront,
        frontSub: newFrontSub || 'Carte personnalisée',
        back: newBack,
        backSub: newBackSub || undefined,
        category: newCategory
      } : c));
      setEditingCardId(null);
      audio.play('success');
    } else {
      // Add
      const newCard: Flashcard = {
        id: `custom-${Date.now()}`,
        front: newFront,
        frontSub: newFrontSub || 'Carte personnalisée',
        back: newBack,
        backSub: newBackSub || undefined,
        category: newCategory
      };
      setCards(prev => [newCard, ...prev]);
      audio.play('success');
    }

    setNewFront('');
    setNewFrontSub('');
    setNewBack('');
    setNewBackSub('');
    setNewCategory('Général');
    setIsAdding(false);
  };

  // Edit card
  const handleEditCard = (card: Flashcard) => {
    setNewFront(card.front);
    setNewFrontSub(card.frontSub || '');
    setNewBack(card.back);
    setNewBackSub(card.backSub || '');
    setNewCategory(card.category);
    setEditingCardId(card.id);
    setIsAdding(true);
    audio.play('click');
  };

  // Delete card
  const handleDeleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    audio.play('click');
  };

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 pb-24 relative">
      {/* Return Header */}
      <div className="flex flex-wrap gap-2 justify-between items-center mb-6 px-1">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-white text-black rounded-xl border-2 md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-xs md:text-sm"
        >
          <ChevronLeft size={16} className="md:w-5 md:h-5" /> Retourner au cours
        </button>

        <h1 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-center flex items-center gap-2">
          <Layers className="text-purple-600 animate-pulse" /> Fiches Flashcards
        </h1>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-yellow-400 text-black rounded-xl border-2 md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-xs md:text-sm"
        >
          <Printer size={16} className="md:w-5 md:h-5" /> Imprimer A4
        </button>
      </div>

      {/* Overview stats panel */}
      <div className="bg-white border-4 border-black rounded-3xl p-5 mb-6 shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-2xl border-2 border-black text-purple-600">
            <Layers size={24} />
          </div>
          <div>
            <h2 className="font-extrabold uppercase text-lg leading-tight">Progression de Mémorisation</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {cards.filter(c => masteredCards[c.id]).length} sur {cards.length} cartes assimilées
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full md:w-64">
          <div className="flex justify-between text-xs font-black uppercase italic mb-1 text-purple-700">
            <span>Maîtrise</span>
            <span>{masteryPercentage}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full border-2 border-black overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-4 border-black pb-1.5 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('study'); audio.play('click'); }}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
            activeTab === 'study' ? 'bg-black text-white shadow-none' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-[2px_2px_0_rgba(0,0,0,1)]'
          }`}
        >
          🎴 Réviser
        </button>
        <button
          onClick={() => { setActiveTab('grid'); audio.play('click'); }}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
            activeTab === 'grid' ? 'bg-black text-white shadow-none' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-[2px_2px_0_rgba(0,0,0,1)]'
          }`}
        >
          🗂️ Vue d'ensemble ({cards.length})
        </button>
        <button
          onClick={() => { setIsAdding(true); setEditingCardId(null); audio.play('click'); }}
          className="ml-auto px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-0 active:shadow-none transition-all flex items-center gap-1"
        >
          <Plus size={14} /> Créer une fiche
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {categories.map(([cat, count]) => {
          const catStr = String(cat);
          const isSelected = categoryFilter === catStr;
          return (
            <button
              key={catStr}
              onClick={() => { setCategoryFilter(catStr); audio.play('click'); }}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 border-black ${
                isSelected 
                  ? 'bg-purple-600 text-white shadow-none' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 shadow-[2px_2px_0_rgba(0,0,0,1)]'
              }`}
            >
              {cat === 'all' ? 'Tout' : catStr} ({count})
            </button>
          );
        })}
      </div>

      {/* Study carousel view */}
      {activeTab === 'study' && (
        <div className="space-y-6">
          {filteredCards.length > 0 ? (
            <div className="flex flex-col items-center">
              {/* Perspective card container */}
              <div className="w-full max-w-lg aspect-[8/5] min-h-[250px] md:min-h-[320px] mb-6 perspective-1000 relative group">
                {/* 3D Animated flippable envelope */}
                {(() => {
                  const isCardRotated = !!rotatedCards[activeCard.id];
                  return (
                    <div 
                      className="w-full h-full duration-500 preserve-3d cursor-pointer relative"
                      style={{ 
                        transform: isCardRotated ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transformStyle: 'preserve-3d'
                      }}
                      onClick={() => toggleRotate(activeCard.id)}
                    >
                      {/* FRONT SIDE */}
                      <div 
                        className="absolute inset-0 w-full h-full backface-hidden bg-card-bg rounded-[32px] border-4 md:border-8 border-black p-6 md:p-8 shadow-[0_8px_0_rgba(0,0,0,1)] flex flex-col justify-between overflow-hidden"
                        style={{ 
                          backfaceVisibility: 'hidden', 
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg)',
                          zIndex: isCardRotated ? 10 : 20
                        }}
                      >
                        {/* Corner accent illustration depending on category */}
                        <div className="absolute right-4 top-4">
                          {getCategoryStyles(activeCard.category).illustration}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 border-black shadow-[1px_1px_0_rgba(0,0,0,1)] ${getCategoryStyles(activeCard.category).badgeClass}`}>
                            {activeCard.category}
                          </span>
                          <span className="text-[10px] font-black uppercase italic text-gray-400">
                            Recto 🎴
                          </span>
                        </div>

                        <div className="my-auto text-center px-4 space-y-4">
                          <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight text-gray-900 leading-tight">
                            {activeCard.front}
                          </h3>
                          {activeCard.frontSub && (
                            <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest italic">{activeCard.frontSub}</p>
                          )}

                          {/* SVG diagram representation if present */}
                          {activeCard.diagram && (
                            <div className="mx-auto border-2 border-black max-w-[120px] p-1 bg-white rounded-xl shadow-md overflow-hidden">
                              <div dangerouslySetInnerHTML={{ __html: activeCard.diagram }} />
                            </div>
                          )}
                        </div>

                        {/* Hint indicator */}
                        <div className="flex items-center justify-center gap-1.5 text-gray-400 font-extrabold text-[10px] uppercase tracking-widest">
                          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '6s' }} /> Cliquer pour retourner la carte
                        </div>
                      </div>

                      {/* BACK SIDE */}
                      <div 
                        className="absolute inset-0 w-full h-full backface-hidden bg-white text-black rounded-[32px] border-4 md:border-8 border-black p-6 md:p-8 shadow-[0_8px_0_rgba(0,0,0,1)] flex flex-col justify-between rotate-y-180"
                        style={{ 
                          backfaceVisibility: 'hidden', 
                          WebkitBackfaceVisibility: 'hidden', 
                          transform: 'rotateY(180deg)',
                          zIndex: isCardRotated ? 20 : 10
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 border-black shadow-[1px_1px_0_rgba(0,0,0,1)] ${getCategoryStyles(activeCard.category).badgeClass}`}>
                            {activeCard.category}
                          </span>
                          <span className="text-[10px] font-black uppercase italic text-gray-400">
                            Verso 🔄
                          </span>
                        </div>

                        <div className="my-auto text-center px-4 space-y-3 max-h-[160px] md:max-h-[220px] overflow-y-auto">
                          <p className="text-base md:text-2xl font-extrabold text-blue-900 leading-relaxed bg-blue-50 border-2 border-dashed border-blue-200 p-4 rounded-2xl relative">
                            {activeCard.back}
                          </p>
                          {activeCard.backSub && (
                            <p className="text-xs font-bold text-gray-500 leading-relaxed max-w-sm mx-auto italic mt-2 bg-yellow-50/50 border-2 border-amber-100 p-2.5 rounded-xl">
                              💡 {activeCard.backSub}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-gray-400 font-extrabold text-[10px] uppercase tracking-widest">
                          Cliquer pour voir la question
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-center gap-4 w-full max-w-md">
                <button
                  onClick={() => {
                    toggleMastered(activeCard.id);
                  }}
                  className={`flex-1 py-3 px-4 font-black uppercase italic tracking-wider text-xs border-2 md:border-4 border-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] ${
                    masteredCards[activeCard.id] 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-white hover:bg-gray-100 hover:text-green-600'
                  }`}
                >
                  <Check size={16} /> {masteredCards[activeCard.id] ? 'Assimilée !' : 'Marquer apprise'}
                </button>

                <button
                  onClick={() => {
                    setRotatedCards(prev => ({ ...prev, [activeCard.id]: !prev[activeCard.id] }));
                    audio.play('click');
                  }}
                  className="p-3 bg-white hover:bg-gray-100 border-2 md:border-4 border-black rounded-2xl shadow-[3px_3px_0_rgba(0,0,0,1)]"
                  title="Retourner la carte"
                >
                  <RefreshCw size={20} />
                </button>
              </div>

              {/* Navigation Arrows & Pagination */}
              <div className="flex items-center justify-between w-full max-w-md mt-6 bg-slate-50 border-2 border-black rounded-2xl px-5 py-2 text-xs font-black uppercase">
                <button
                  onClick={() => {
                    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredCards.length - 1));
                    audio.play('click');
                  }}
                  className="text-gray-600 hover:text-black hover:scale-110 active:scale-95 duration-100 py-1 px-3"
                >
                  ◀ Précédente
                </button>
                <span className="text-purple-700 tracking-widest">
                  {currentIndex + 1} / {filteredCards.length}
                </span>
                <button
                  onClick={() => {
                    setCurrentIndex(prev => (prev < filteredCards.length - 1 ? prev + 1 : 0));
                    audio.play('click');
                  }}
                  className="text-gray-600 hover:text-black hover:scale-110 active:scale-95 duration-100 py-1 px-3"
                >
                  Suivante ▶
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-4 border-dotted border-gray-300 rounded-3xl p-12 text-center text-gray-500 text-sm font-bold uppercase italic">
              Aucune carte ne correspond au filtre actif.
            </div>
          )}
        </div>
      )}

      {/* Grid view of all flashcards */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const isRotated = rotatedCards[card.id];
            const isMastered = masteredCards[card.id];
            const style = getCategoryStyles(card.category);
            
            return (
              <div 
                key={card.id} 
                className={`bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden relative group hover:shadow-[0_8px_0_rgba(0,0,0,1)] transition-all ${
                  isMastered ? 'ring-4 ring-green-400' : ''
                }`}
              >
                {/* Visual Category Border tag */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${style.borderClass.replace('border-', 'bg-')}`} />

                <div className="p-4 flex flex-col justify-between min-h-[200px]">
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <span className={`px-2 py-0.5 rounded-full ${style.badgeClass}`}>
                        {card.category}
                      </span>
                      {isMastered && (
                        <span className="text-green-600 flex items-center gap-0.5">
                          ✓ Appris
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {isRotated ? (
                        <div className="min-h-[70px] bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-2.5 text-xs text-blue-900 font-extrabold relative">
                          <span className="absolute top-0 right-0 bg-blue-600 text-white rounded-bl-lg px-1 text-[8px] tracking-widest font-black uppercase">VERSO</span>
                          <p>{card.back}</p>
                          {card.backSub && <p className="text-[10px] text-gray-400 mt-1 font-bold italic border-t border-blue-100 pt-1">💡 {card.backSub}</p>}
                        </div>
                      ) : (
                        <div className="min-h-[70px] p-2.5 text-sm text-gray-900 font-black relative leading-tight">
                          <span className="absolute top-0 right-0 bg-purple-600 text-white rounded-bl-lg px-1 text-[8px] tracking-widest font-black uppercase">RECTO</span>
                          <p>{card.front}</p>
                          {card.frontSub && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider italic">{card.frontSub}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleRotate(card.id)}
                        className="px-2.5 py-1.5 bg-gray-50 border border-black hover:bg-gray-100 rounded-lg text-[10px] font-black uppercase italic transition-all flex items-center gap-1 shadow-[1px_1px_0_rgba(0,0,0,1)]"
                      >
                        <RefreshCw size={8} /> Flips
                      </button>
                      <button
                        onClick={() => toggleMastered(card.id)}
                        className={`p-1.5 border border-black rounded-lg transition-all shadow-[1px_1px_0_rgba(0,0,0,1)] ${
                          isMastered ? 'bg-green-500 text-white' : 'bg-white hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        <Check size={10} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg"
                        title="Modifier la carte"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg"
                        title="Supprimer la carte"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adding / Editing Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-8 border-black rounded-[40px] max-w-md w-full p-6 shadow-[0_16px_0_rgba(0,0,0,1)] relative"
          >
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 flex items-center gap-2">
              <Layers className="text-green-500" /> {editingCardId ? 'Modifier la Fiche' : 'Créer une Fiche'}
            </h2>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Face Recto (Question / Concept) *</label>
                <input 
                  type="text" 
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="w-full px-4 py-3 font-bold border-4 border-black rounded-2xl outline-none focus:ring-4 focus:ring-purple-200"
                  placeholder="Ex: 1789, Past Simple of 'Go'..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Texte additionnel Recto (Optionnel)</label>
                <input 
                  type="text" 
                  value={newFrontSub}
                  onChange={(e) => setNewFrontSub(e.target.value)}
                  className="w-full px-4 py-3 font-bold border-4 border-black rounded-2xl outline-none focus:ring-4 focus:ring-purple-200"
                  placeholder="Ex: Repère historique, Grammaire..."
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Face Verso (Réponse / Définition) *</label>
                <textarea 
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  className="w-full px-4 py-3 font-bold border-4 border-black rounded-2xl outline-none focus:ring-4 focus:ring-purple-200 h-16"
                  placeholder="Ex: Prise de la Bastille (Révolution française)..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Texte d'explication Verso (Optionnel)</label>
                <textarea 
                  value={newBackSub}
                  onChange={(e) => setNewBackSub(e.target.value)}
                  className="w-full px-4 py-3 font-bold border-4 border-black rounded-2xl outline-none focus:ring-4 focus:ring-purple-200 h-12"
                  placeholder="Ex: Astuce d'apprentissage ou contexte supplémentaire"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Catégorie de la Fiche</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 font-bold border-4 border-black rounded-2xl outline-none focus:ring-4 focus:ring-purple-200 bg-white"
                >
                  <option value="Définition">Définition</option>
                  <option value="Formule">Formule</option>
                  <option value="Vocabulaire">Vocabulaire</option>
                  <option value="Repère temporel">Repère temporel</option>
                  <option value="Défi Quiz">Défi Quiz</option>
                  <option value="Général">Général</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingCardId(null); audio.play('click'); }}
                  className="flex-1 py-4 bg-white hover:bg-gray-100 rounded-2xl border-4 border-black font-black uppercase italic tracking-wider text-xs transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-green-500 text-white hover:bg-green-600 rounded-2xl border-4 border-black font-black uppercase italic tracking-wider text-xs shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PRINT-ONLY CONTAINER STRUCTURE */}
      {/* Designed perfectly on A4 layout spacing, 6 cards per page: side-by-side folding pairs */}
      <div className="print-only">
        <div className="print-a4 bg-white text-black p-4 font-sans leading-relaxed">
          {/* Header */}
          <div className="text-center mb-8 border-b-8 border-black pb-4 relative">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter">Anglix Flashcards Study</h1>
            <p className="text-xs font-black uppercase tracking-widest text-purple-600 mt-2">Leçon : {lesson.title} ({lesson.category} / {lesson.level})</p>
            <div className="text-[9px] font-bold text-gray-400 mt-1">Instructions : Imprimez, découpez le long des pointillés, pliez la carte en deux pour avoir le Recto et Verso dos à dos !</div>
          </div>

          {/* Cards render in rows of 2 side-by-side: left is Recto, right is Verso */}
          {/* Loop over printable cards grouped 3 per page (giving 6 individual panels per A4 page) */}
          <div className="space-y-12">
            {cards.map((card, index) => {
              const borderStyles = {
                'Définition': 'border-red-500',
                'Formule': 'border-blue-500',
                'Vocabulaire': 'border-purple-500',
                'Repère temporel': 'border-amber-500',
                'Défi Quiz': 'border-indigo-500'
              }[card.category] || 'border-purple-500';

              const badgeStyles = {
                'Définition': 'bg-red-500 text-white',
                'Formule': 'bg-blue-500 text-white',
                'Vocabulaire': 'bg-purple-500 text-white',
                'Repère temporel': 'bg-amber-500 text-black',
                'Défi Quiz': 'bg-indigo-500 text-white'
              }[card.category] || 'bg-purple-500 text-white';

              // Force page breaks after every 3 physical cards (which uses exactly 1 page - 6 panels)
              const needsPageBreak = index > 0 && index % 3 === 0;

              return (
                <div key={`print-row-${card.id}`} className={`print-row grid grid-cols-2 gap-12 border-4 border-dashed border-gray-300 p-4 rounded-3xl relative break-inside-avoid ${needsPageBreak ? 'page-break-before mt-12' : ''}`}>
                  
                  {/* FOLD LINE vertical divider inside the row */}
                  <div className="absolute left-1/2 top-4 bottom-4 border-2 border-dashed border-purple-200 -translate-x-1/2 flex flex-col justify-between items-center py-6">
                    <span className="text-[7px] font-bold text-purple-400 uppercase tracking-widest -rotate-90">PLIER LIGNE</span>
                    <span className="text-[7px] font-bold text-purple-400 uppercase tracking-widest -rotate-90">PLIER LIGNE</span>
                  </div>

                  {/* LEFT: RECTO (Front) */}
                  <div className={`border-8 ${borderStyles} rounded-3xl p-8 min-h-[70mm] flex flex-col justify-between bg-white relative`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${badgeStyles}`}>
                        {card.category}
                      </span>
                      <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">RECTO</span>
                    </div>

                    <div className="my-auto text-center py-4">
                      <h3 className="text-lg font-black uppercase text-gray-900 leading-tight">
                        {card.front}
                      </h3>
                      {card.frontSub && (
                        <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mt-2">{card.frontSub}</p>
                      )}

                      {/* Display diagram schematic in print as well */}
                      {card.diagram && (
                        <div className="mx-auto border bg-white border-black max-w-[100px] mt-4 p-1 rounded-lg">
                          <div dangerouslySetInnerHTML={{ __html: card.diagram }} />
                        </div>
                      )}
                    </div>

                    {/* Logo token */}
                    <div className="text-center text-[7px] font-black uppercase tracking-widest text-gray-300">
                      🦁 Anglix Academy
                    </div>
                  </div>

                  {/* RIGHT: VERSO (Back) */}
                  <div className={`border-8 ${borderStyles} rounded-3xl p-8 min-h-[70mm] flex flex-col justify-between bg-white bg-opacity-70 relative`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${badgeStyles}`}>
                        {card.category}
                      </span>
                      <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">VERSO</span>
                    </div>

                    <div className="my-auto text-center py-4">
                      <p className="text-sm font-extrabold text-blue-900 leading-relaxed bg-blue-50/50 p-4 border-2 border-dashed border-blue-100 rounded-xl">
                        {card.back}
                      </p>
                      {card.backSub && (
                        <p className="text-[9px] font-bold text-gray-500 tracking-tight leading-relaxed italic mt-2">
                          💡 {card.backSub}
                        </p>
                      )}
                    </div>

                    {/* Logo token */}
                    <div className="text-center text-[7px] font-black uppercase tracking-widest text-gray-300">
                      🦁 Anglix Academy
                    </div>
                  </div>

                  {/* Outer cutting label for rows */}
                  <div className="absolute -top-4 left-4 bg-gray-100 border border-black rounded px-1.5 text-[6px] font-black text-gray-500 uppercase tracking-widest">
                    ✂️ DÉCOUPER CONTOUR
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
          -webkit-perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
          -webkit-transform: rotateY(180deg);
        }

        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; display: block !important; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; bg-color: white !important; }
          @page { size: A4; margin: 12mm 10mm; }
          .page-break-before { page-break-before: always; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          .print-row {
            min-height: 75mm;
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 8mm;
          }
        }
      `}} />
    </div>
  );
}
