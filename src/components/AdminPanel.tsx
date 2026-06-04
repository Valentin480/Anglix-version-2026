import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, BookOpen, Sparkles, Trash2, Ban, Edit3, Plus, Save, X, Wand2, Loader2 } from 'lucide-react';
import { UserState, Lesson, Quest } from '../types';
import { generateLessonWithAI } from '../services/geminiService';
import { fetchUnsplashImage } from '../services/imageService';

interface AdminPanelProps {
  users: (UserState & { id: string })[];
  lessons: Lesson[];
  onUpdateLesson: (lesson: Lesson) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onUpdateQuests: (quests: Quest[]) => void;
}

export default function AdminPanel({ users, lessons, onUpdateLesson, onDeleteUser, onDeleteLesson, onUpdateQuests }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'lessons' | 'quests'>('users');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('Collège');
  const [aiSpecificLevel, setAiSpecificLevel] = useState('');
  const [includeVideo, setIncludeVideo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const levelToUse = aiSpecificLevel || aiLevel;
      const generated = await generateLessonWithAI(aiTopic, levelToUse, includeVideo);
      
      // Fetch relevant image
      const imageUrl = generated.imageSearchTerm 
        ? await fetchUnsplashImage(generated.imageSearchTerm)
        : await fetchUnsplashImage(generated.title);

      setEditingLesson({
        id: 'new-' + Date.now(),
        ...generated,
        imageUrl: imageUrl || undefined,
        questions: (generated.questions || []).map((q: any, idx: number) => ({
          ...q,
          id: q.id || `q-${Date.now()}-${idx}`
        })),
        level: aiLevel,
        difficulty: 1
      });
      setAiTopic('');
    } catch (error) {
      console.error('AI Generation error:', error);
      alert('Erreur lors de la génération par l\'IA. Réessaie !');
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    if (!editingLesson) return;
    const newQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'Nouvelle question ?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0
    };
    setEditingLesson({
      ...editingLesson,
      questions: [...editingLesson.questions, newQuestion]
    });
  };

  const removeQuestion = (id: string) => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      questions: editingLesson.questions.filter(q => q.id !== id)
    });
  };

  const updateQuestion = (id: string, updates: any) => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      questions: editingLesson.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-black text-white p-4 md:p-8 rounded-t-[24px] md:rounded-t-[40px] border-x-4 md:border-x-8 border-t-4 md:border-t-8 border-black flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Shield className="text-red-500 w-8 h-8 md:w-12 md:h-12" />
          <div>
            <h2 className="text-2xl md:text-4xl font-black uppercase italic">Admin</h2>
            <p className="text-red-500 font-bold uppercase text-[10px] tracking-widest">Contrôle Total • Anglix OS</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {(['users', 'lessons', 'quests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl font-black uppercase italic text-xs md:text-sm transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-black scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {tab === 'users' && 'Utilisateurs'}
              {tab === 'lessons' && 'Leçons'}
              {tab === 'quests' && 'Quêtes'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-x-4 md:border-x-8 border-b-4 md:border-b-8 border-black p-4 md:p-8 rounded-b-[24px] md:rounded-b-[40px] shadow-[0_10px_0_rgba(0,0,0,1)] md:shadow-[0_20px_0_rgba(0,0,0,1)] min-h-[400px] md:min-h-[600px]">
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2 font-black uppercase text-xs text-gray-400">
              <div className="col-span-2">Utilisateur</div>
              <div>Niveau / XP</div>
              <div>Pièces / Gemmes</div>
              <div className="text-right">Actions</div>
            </div>
            {users.map((u) => (
              <div key={u.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 md:border-4 border-black group hover:bg-white transition-all gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-black shrink-0">
                    {u.name[0]}
                  </div>
                  <div>
                    <div className="font-black uppercase italic text-sm md:text-base">{u.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">{u.id}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto justify-between md:justify-start">
                  <div className="font-black text-xs md:text-sm">Lvl {u.level} • {u.xp} XP</div>
                  <div className="font-black text-xs md:text-sm text-yellow-600">{u.coins} 🪙 • {u.gems} 💎</div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => onDeleteUser(u.id)}
                    className="p-2 bg-red-100 text-red-500 rounded-lg border-2 border-black hover:bg-red-500 hover:text-white transition-all"
                    title="Bannir / Supprimer"
                  >
                    <Ban size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-8">
            {/* AI Generation Section */}
            <div className="bg-purple-50 border-4 border-purple-200 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="text-purple-600" size={24} />
                <h4 className="text-xl font-black uppercase italic text-purple-900">Générateur IA</h4>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text"
                  placeholder="Sujet (ex: Le passé composé, La Révolution Française...)"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="flex-1 p-4 bg-white border-4 border-black rounded-2xl font-bold"
                />
                <select 
                  value={aiLevel}
                  onChange={(e) => setAiLevel(e.target.value)}
                  className="p-4 bg-white border-4 border-black rounded-2xl font-bold"
                >
                  <option value="Primaire">Primaire</option>
                  <option value="Collège">Collège</option>
                  <option value="Lycée">Lycée</option>
                  <option value="Supérieur">Supérieur</option>
                </select>
                <input 
                  type="text"
                  placeholder="Niveau précis (ex: 6ème, CM2...)"
                  value={aiSpecificLevel}
                  onChange={(e) => setAiSpecificLevel(e.target.value)}
                  className="w-full md:w-48 p-4 bg-white border-4 border-black rounded-2xl font-bold"
                />
                <div className="flex items-center gap-2 px-4 bg-white border-4 border-black rounded-2xl">
                  <input 
                    type="checkbox"
                    id="includeVideo"
                    checked={includeVideo}
                    onChange={(e) => setIncludeVideo(e.target.checked)}
                    className="w-5 h-5 accent-purple-600"
                  />
                  <label htmlFor="includeVideo" className="font-black uppercase italic text-xs cursor-pointer">Vidéo ?</label>
                </div>
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !aiTopic}
                  className="px-8 py-4 bg-purple-600 text-white rounded-2xl border-4 border-black font-black uppercase italic tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_8px_0_rgba(0,0,0,0.2)]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Générer
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] font-bold text-purple-400 mt-3 uppercase tracking-widest">
                L'IA va créer une fiche complète et un quiz de 5 questions en quelques secondes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic">Gestion des Leçons ({lessons.length})</h3>
              <button 
                onClick={() => setEditingLesson({
                  id: 'new-' + Date.now(),
                  title: 'Nouvelle Leçon',
                  category: 'Général',
                  level: 'Collège',
                  difficulty: 1,
                  explanation: 'Contenu de la leçon...',
                  questions: []
                })}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-black uppercase italic text-sm"
              >
                <Plus size={18} /> Ajouter une leçon
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-4 border-4 border-black rounded-2xl flex justify-between items-center group">
                  <div>
                    <div className="text-[10px] font-black text-blue-500 uppercase">{lesson.category} • {lesson.level}</div>
                    <div className="font-black uppercase italic">{lesson.title}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{lesson.questions.length} Questions</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingLesson(lesson)}
                      className="p-2 bg-gray-100 rounded-lg border-2 border-black hover:bg-black hover:text-white transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Supprimer cette leçon ?')) {
                          onDeleteLesson(lesson.id);
                        }
                      }}
                      className="p-2 bg-red-50 text-red-500 rounded-lg border-2 border-black hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        {activeTab === 'quests' && (
          <div className="text-center py-20">
            <Sparkles size={64} className="mx-auto text-yellow-500 mb-4" />
            <h3 className="text-3xl font-black uppercase italic mb-2">Éditeur de Quêtes</h3>
            <p className="text-gray-400 font-bold uppercase max-w-md mx-auto">
              Bientôt disponible : Modifie les quêtes quotidiennes et les récompenses en temps réel.
            </p>
          </div>
        )}
      </div>

      {/* Edit Lesson Modal */}
      <AnimatePresence>
        {editingLesson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 md:border-8 border-black rounded-[24px] md:rounded-[40px] p-4 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="text-xl md:text-3xl font-black uppercase italic">Modifier la leçon</h3>
                <button onClick={() => setEditingLesson(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4 md:space-y-6">
                  <h4 className="text-lg md:text-xl font-black uppercase italic border-b-4 border-black pb-2">Infos Générales</h4>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 md:mb-2">Titre de la leçon</label>
                    <input 
                      type="text" 
                      value={editingLesson.title}
                      onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                      className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 md:mb-2">Catégorie</label>
                      <input 
                        type="text" 
                        value={editingLesson.category}
                        onChange={(e) => setEditingLesson({...editingLesson, category: e.target.value})}
                        className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 md:mb-2">Niveau</label>
                      <select 
                        value={editingLesson.level}
                        onChange={(e) => setEditingLesson({...editingLesson, level: e.target.value as any})}
                        className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
                      >
                        <option value="Primaire">Primaire</option>
                        <option value="Collège">Collège</option>
                        <option value="Lycée">Lycée</option>
                        <option value="Supérieur">Supérieur</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 md:mb-2">Image de couverture (URL)</label>
                    <input 
                      type="text" 
                      value={editingLesson.imageUrl || ''}
                      onChange={(e) => setEditingLesson({...editingLesson, imageUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 md:mb-2">ID Vidéo YouTube</label>
                      <input 
                        type="text" 
                        value={editingLesson.youtubeId || ''}
                        onChange={(e) => setEditingLesson({...editingLesson, youtubeId: e.target.value})}
                        placeholder="ID de 11 caractères"
                        className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 md:mb-2">Requête de recherche YouTube</label>
                      <input 
                        type="text" 
                        value={editingLesson.youtubeSearchQuery || ''}
                        onChange={(e) => setEditingLesson({...editingLesson, youtubeSearchQuery: e.target.value})}
                        placeholder="Fallback si l'ID est mort"
                        className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold text-sm md:text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-black uppercase text-gray-400">Explication (Markdown)</label>
                      <button 
                        onClick={() => {
                          const imgTag = '\n![image](URL_ICI)\n';
                          setEditingLesson({
                            ...editingLesson,
                            explanation: editingLesson.explanation + imgTag
                          });
                        }}
                        className="text-[8px] md:text-[10px] font-black uppercase bg-gray-100 px-2 py-1 rounded border-2 border-black hover:bg-black hover:text-white transition-all"
                      >
                        + Image
                      </button>
                    </div>
                    <textarea 
                      value={editingLesson.explanation}
                      onChange={(e) => setEditingLesson({...editingLesson, explanation: e.target.value})}
                      rows={8}
                      className="w-full p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-bold font-mono text-xs md:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="flex justify-between items-center border-b-4 border-black pb-2">
                    <h4 className="text-lg md:text-xl font-black uppercase italic">Questions ({editingLesson.questions.length})</h4>
                    <button 
                      onClick={addQuestion}
                      className="p-1.5 md:p-2 bg-black text-white rounded-lg hover:scale-110 transition-all"
                    >
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2">
                    {editingLesson.questions.map((q, qIndex) => (
                      <div key={q.id} className="p-3 md:p-4 bg-gray-50 border-2 md:border-4 border-black rounded-xl md:rounded-2xl relative">
                        <button 
                          onClick={() => removeQuestion(q.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full border-2 border-black"
                        >
                          <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </button>
                        <input 
                          type="text"
                          value={q.text}
                          onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                          placeholder="Question..."
                          className="w-full bg-transparent font-black uppercase text-xs md:text-sm mb-3 border-b-2 border-black/10 focus:border-black outline-none"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <input 
                                type="radio"
                                checked={q.correctAnswer === oIndex}
                                onChange={() => updateQuestion(q.id, { correctAnswer: oIndex })}
                                className="accent-black shrink-0"
                              />
                              <input 
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[oIndex] = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                className="w-full bg-white border-2 border-black rounded-lg p-1 text-[10px] md:text-xs font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8">
                <button 
                  onClick={() => {
                    onUpdateLesson(editingLesson);
                    setEditingLesson(null);
                  }}
                  className="flex-1 py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Save className="w-4.5 h-4.5 md:w-5 md:h-5" /> Enregistrer
                </button>
                <button 
                  onClick={() => setEditingLesson(null)}
                  className="flex-1 py-3 md:py-4 bg-gray-100 text-black border-2 md:border-4 border-black rounded-xl md:rounded-2xl font-black uppercase italic tracking-widest text-sm md:text-base"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
