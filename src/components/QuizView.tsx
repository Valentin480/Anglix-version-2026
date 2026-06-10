import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, HelpCircle, Star, TrendingUp, Zap, Calendar, Mail, Bell, AlertCircle, Sparkles, Inbox } from 'lucide-react';
import { Lesson, Question, UserState } from '../types';
import { audio } from '../lib/audio';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

interface QuizViewProps {
  lesson: Lesson;
  user: UserState;
  onComplete: (success: boolean, score: number, accuracy: number, timeSpent: number) => void;
}

const SCHOOL_LEVEL_ORDER = ['Primaire', 'Collège', 'Lycée', 'Supérieur'];

export default function QuizView({ lesson, user, onComplete }: QuizViewProps) {
  const [startTime] = useState(Date.now());
  const [quizQuestions] = useState(() => {
    const shuffled = [...lesson.questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [animatedXp, setAnimatedXp] = useState(0);

  // Mistake recording and notification reminder state
  const [mistakes, setMistakes] = useState<{ question: Question; userAnswer: string; isCorrect: boolean }[]>([]);
  const [email, setEmail] = useState('');
  const [reminderInterval, setReminderInterval] = useState<'3_days' | '1_month'>('3_days');
  const [reminderScheduled, setReminderScheduled] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [reminderError, setReminderError] = useState('');

  const currentQuestion = quizQuestions[currentQuestionIndex];

  // Calculate XP details for summary
  const userLevelIndex = SCHOOL_LEVEL_ORDER.indexOf(user.schoolLevel);
  const lessonLevelIndex = SCHOOL_LEVEL_ORDER.indexOf(lesson.level);
  const isLowerLevel = lessonLevelIndex < userLevelIndex;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lessonAttempt = (user.lessonAttempts || {})[lesson.id] || { count: 0, lastAttempt: '' };
  const attemptCount = lessonAttempt.lastAttempt === today ? lessonAttempt.count : 0;
  const penaltyMultiplier = Math.max(0.1, 1 - (attemptCount * 0.1));
  
  const baseXPPerAnswer = isLowerLevel ? 20 / 30 : 20;
  const totalBaseXP = Math.round(score * baseXPPerAnswer * penaltyMultiplier);
  const isBoostActive = user.activeXpBoostUntil && new Date(user.activeXpBoostUntil) > new Date();
  const finalXP = isBoostActive ? totalBaseXP * 2 : totalBaseXP;

  // Pre-fill email when auth is loaded
  useEffect(() => {
    if (auth.currentUser?.email) {
      setEmail(auth.currentUser.email);
    }
  }, []);

  useEffect(() => {
    if (showSummary) {
      const duration = 1500;
      const steps = 60;
      const stepValue = finalXP / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= finalXP) {
          setAnimatedXp(finalXP);
          clearInterval(interval);
        } else {
          setAnimatedXp(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [showSummary, finalXP]);

  const checkAnswer = (answer: number | string) => {
    if (currentQuestion.type === 'qcm' || currentQuestion.type === 'true_false' || !currentQuestion.type) {
      return Number(answer) === Number(currentQuestion.correctAnswer);
    }
    const normalizedInput = String(answer).toLowerCase().trim();
    const normalizedCorrect = String(currentQuestion.correctAnswer).toLowerCase().trim();
    return normalizedInput === normalizedCorrect;
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    const isCorrect = checkAnswer(index);
    if (isCorrect) {
      setScore(prev => prev + 1);
      audio.play('success');
      audio.haptic(30);
    } else {
      audio.play('error');
      audio.haptic([50, 50]);
      
      const wrongAnswerLabel = currentQuestion.options ? currentQuestion.options[index] : String(index);
      setMistakes(prev => [
        ...prev,
        {
          question: currentQuestion,
          userAnswer: wrongAnswerLabel,
          isCorrect: false
        }
      ]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !textAnswer.trim()) return;
    setIsAnswered(true);
    
    const isCorrect = checkAnswer(textAnswer);
    if (isCorrect) {
      setScore(prev => prev + 1);
      audio.play('success');
      audio.haptic(30);
    } else {
      audio.play('error');
      audio.haptic([50, 50]);
      
      setMistakes(prev => [
        ...prev,
        {
          question: currentQuestion,
          userAnswer: textAnswer,
          isCorrect: false
        }
      ]);
    }
  };

  const handleNext = async () => {
    audio.play('click');
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setIsAnswered(false);
    } else {
      setShowSummary(true);
      audio.play('levelUp');
      
      // Save errors to firestore automatically to keep mistakes history
      const fbUser = auth.currentUser;
      if (fbUser && mistakes.length > 0) {
        try {
          const docRef = doc(db, 'users', fbUser.uid, 'quizMistakes', lesson.id);
          await setDoc(docRef, {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            updatedAt: new Date().toISOString(),
            mistakes: mistakes.map(m => ({
              questionId: m.question.id,
              questionText: m.question.text,
              userAnswer: m.userAnswer,
              correctAnswerText: m.question.type === 'qcm' || m.question.type === 'true_false' || !m.question.type
                ? (m.question.options ? (m.question.options[Number(m.question.correctAnswer)] || String(m.question.correctAnswer)) : String(m.question.correctAnswer))
                : String(m.question.correctAnswer),
              explanation: m.question.explanation || '',
              options: m.question.options || []
            }))
          }, { merge: true });
        } catch (error) {
          console.error("Erreur lors de l'enregistrement des erreurs :", error);
        }
      }
    }
  };

  const handleScheduleReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setReminderError("S'il te plaît, entre une adresse email valide.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setReminderError("Cette adresse email semble invalide.");
      return;
    }

    setIsScheduling(true);
    setReminderError('');

    try {
      const days = reminderInterval === '3_days' ? 3 : 30;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + days);

      const specialLink = `${window.location.origin}?lessonId=${lesson.id}`;

      const reminderData = {
        userId: auth.currentUser?.uid || 'guest',
        userEmail: email,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        scheduledFor: scheduledDate.toISOString(),
        createdAt: new Date().toISOString(),
        link: specialLink,
        status: 'pending'
      };

      if (auth.currentUser) {
        const userReminderRef = doc(db, 'users', auth.currentUser.uid, 'reminders', `${lesson.id}_${reminderInterval}`);
        await setDoc(userReminderRef, reminderData);
      } else {
        await addDoc(collection(db, 'reminders'), reminderData);
      }

      // Local storage backup for reinforcing offline capability
      const cachedReminders = JSON.parse(localStorage.getItem('anglix_reminders') || '[]');
      cachedReminders.push({
        ...reminderData,
        id: `${lesson.id}_${reminderInterval}`
      });
      localStorage.setItem('anglix_reminders', JSON.stringify(cachedReminders));

      setReminderScheduled(true);
      audio.play('success');
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement du rappel :", err);
      setReminderError("Erreur lors de la programmation. Réessaie.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (showSummary) {
    const currentXpInLevel = user.xp % 200;
    const nextLevelXp = 200;
    
    // Format memory date
    const targetDays = reminderInterval === '3_days' ? 3 : 30;
    const recallDate = new Date();
    recallDate.setDate(recallDate.getDate() + targetDays);
    const recallFormatted = recallDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto p-4 md:p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Main Completion Stats (left/main panel) */}
          <div className="md:col-span-5 bg-card-bg rounded-[24px] md:rounded-[32px] border-4 md:border-8 border-black p-5 md:p-8 shadow-[0_8px_0_rgba(0,0,0,1)] text-center h-full">
            <motion.div 
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-16 h-16 md:w-24 md:h-24 bg-yellow-400 rounded-2xl md:rounded-3xl border-2 md:border-4 border-black flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-[4px_4px_0_rgba(0,0,0,1)]"
            >
              <Star size={32} className="text-white fill-white md:hidden" />
              <Star size={48} className="text-white fill-white hidden md:block" />
            </motion.div>
            
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-1 md:mb-2 text-gray-900">Quiz Terminé !</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-6">Voici ton bilan</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border-2 border-black">
                <span className="font-black uppercase italic text-gray-500 text-xs md:text-sm">Score</span>
                <span className="font-black text-lg md:text-xl text-black">{score} / {quizQuestions.length}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border-2 border-black relative overflow-hidden">
                {isBoostActive && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white px-2 py-0.5 text-[8px] font-black uppercase rounded-bl-lg border-l-2 border-b-2 border-black">
                    Boost x2
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-purple-600 w-4 h-4" />
                  <span className="font-black uppercase italic text-purple-600 text-xs md:text-sm">XP Gagné</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-xl md:text-2xl text-purple-600">+{animatedXp}</span>
                </div>
              </div>

              {/* Level Progress */}
              <div className="p-3 bg-blue-50 rounded-xl border-2 border-black">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black uppercase italic text-blue-600 text-[10px] md:text-xs">Niveau {user.level}</span>
                  <span className="font-black text-[10px] md:text-xs text-blue-600">{Math.min(nextLevelXp, currentXpInLevel + animatedXp)} / {nextLevelXp}</span>
                </div>
                <div className="h-3 bg-white border-2 border-black rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: `${(currentXpInLevel / nextLevelXp) * 100}%` }}
                    animate={{ width: `${(Math.min(nextLevelXp, currentXpInLevel + animatedXp) / nextLevelXp) * 100}%` }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>

              {isLowerLevel && (
                <p className="text-[8px] md:text-[10px] font-black text-red-500 uppercase tracking-tight">
                  ⚠️ Niveau scolaire inférieur : XP divisé par 30
                </p>
              )}
              
              {attemptCount > 0 && (
                <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-tight">
                  🔄 Répétition : -{attemptCount * 10}% d'XP (Max -90%)
                </p>
              )}
            </div>

            <button
              onClick={() => {
                const accuracy = (score / quizQuestions.length) * 100;
                const timeSpent = Math.floor((Date.now() - startTime) / 1000);
                onComplete(score >= quizQuestions.length / 2, score, accuracy, timeSpent);
              }}
              className="w-full py-3.5 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[0_4px_0_rgba(0,0,0,0.3)] text-xs md:text-sm"
            >
              Continuer
            </button>
          </div>

          {/* Right/Secondary Panel: Mistakes Correction list & Spaced repetition */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Mistakes Section */}
            <div className="bg-card-bg rounded-[24px] border-4 border-black p-5 md:p-6 shadow-[0_8px_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                <HelpCircle className="text-red-500 w-5 h-5" />
                <h3 className="font-black uppercase italic text-black text-sm md:text-lg">
                  {mistakes.length === 0 ? "Bilan : Zéro Faute !" : `Correction de tes erreurs (${mistakes.length})`}
                </h3>
              </div>

              {mistakes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-2">🎉</div>
                  <h4 className="font-black text-green-600 text-lg">Parfait, Sans Faute !</h4>
                  <p className="text-gray-500 text-xs font-bold mt-1 max-w-sm mx-auto">
                    Tu as répondu correctement à toutes les questions. Ton cerveau enregistre cette leçon à merveille !
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {mistakes.map((m, i) => {
                    const expectedText = m.question.type === 'qcm' || m.question.type === 'true_false' || !m.question.type
                      ? (m.question.options ? (m.question.options[Number(m.question.correctAnswer)] || String(m.question.correctAnswer)) : String(m.question.correctAnswer))
                      : String(m.question.correctAnswer);

                    return (
                      <div key={i} className="p-3 bg-white rounded-xl border-2 border-black text-left text-xs space-y-2">
                        <div className="font-extrabold text-gray-900">
                          {i + 1}. {m.question.text}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-bold text-[11px]">
                          <div className="flex items-center gap-1.5 p-1.5 bg-red-50 border border-red-300 rounded text-red-700">
                            <XCircle size={14} className="flex-shrink-0" />
                            <span>Ta réponse : {m.userAnswer}</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-1.5 bg-green-50 border border-green-300 rounded text-green-700">
                            <CheckCircle2 size={14} className="flex-shrink-0" />
                            <span>Correct : {expectedText}</span>
                          </div>
                        </div>
                        {m.question.explanation && (
                          <div className="text-[10px] text-blue-800 bg-blue-50/50 p-2 rounded border border-blue-100 italic">
                            💡 {m.question.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Spaced Repetition Panel */}
            <div className="bg-card-bg rounded-[24px] border-4 border-black p-5 md:p-6 shadow-[0_8px_0_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#FF6321] text-white px-3 py-1 text-[9px] font-black uppercase rounded-bl-xl border-l-[3px] border-b-[3px] border-black">
                Mémoire Long Terme
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Bell className="text-purple-600 w-5 h-5 animate-bounce" />
                <h3 className="font-black uppercase italic text-black text-sm md:text-lg">Ancre l'info définitivement</h3>
              </div>

              <p className="text-gray-600 text-xs font-semibold mb-4 leading-relaxed">
                La courbe de l'oubli prouve qu'un rappel espacé dans <span className="font-black text-black">3 jours ou 1 mois</span> déplace durablement ces notions de ta mémoire immédiate à ta mémoire à long terme.
              </p>

              {!reminderScheduled ? (
                <form onSubmit={handleScheduleReminder} className="space-y-4">
                  {/* Select Interval */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { audio.play('click'); setReminderInterval('3_days'); }}
                      className={`py-3 px-2 border-2 border-black rounded-xl font-black text-xs uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1 ${
                        reminderInterval === '3_days' 
                          ? 'bg-purple-100 text-purple-700 shadow-[2px_2px_0_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5' 
                          : 'bg-white text-gray-500'
                      }`}
                    >
                      <Zap size={14} className={reminderInterval === '3_days' ? 'fill-purple-300' : ''} />
                      Dans 3 Jours
                    </button>
                    <button
                      type="button"
                      onClick={() => { audio.play('click'); setReminderInterval('1_month'); }}
                      className={`py-3 px-2 border-2 border-black rounded-xl font-black text-xs uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1 ${
                        reminderInterval === '1_month' 
                          ? 'bg-purple-100 text-purple-700 shadow-[2px_2px_0_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5' 
                          : 'bg-white text-gray-500'
                      }`}
                    >
                      <Calendar size={14} />
                      Dans 1 Mois
                    </button>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider">Ton adresse Mail de rappel :</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: valentin@mail.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-xl text-xs font-bold outline-none focus:ring-2 ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {reminderError && (
                    <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-300 rounded-lg text-red-700 text-xs font-bold">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{reminderError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="w-full py-3 bg-[#FF6321] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                  >
                    {isScheduling ? 'Planification...' : "S'inscrire au Rappel Automatique 🚀"}
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-2.5 bg-green-50 border-2 border-green-500 p-3 rounded-xl text-green-800 text-xs">
                    <Inbox className="text-green-600 flex-shrink-0 animate-pulse mt-0.5" size={18} />
                    <div>
                      <h4 className="font-black text-green-900 uppercase">Rappel programmé !</h4>
                      <p className="font-semibold text-[11px] mt-0.5">
                        Tu recevras un rappel automatique par email le <span className="font-black underline">{recallFormatted}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Email Receipt Preview Box */}
                  <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-400 rounded-xl space-y-2 text-left">
                    <div className="flex justify-between items-center pb-1 border-b border-gray-200 text-[10px] text-gray-500 font-bold">
                      <span className="flex items-center gap-1"><Sparkles size={11} className="text-purple-500" /> Aperçu du Mail :</span>
                      <span>De : Anglix Memory Engine</span>
                    </div>
                    <div className="text-[11px] font-bold space-y-1">
                      <div className="text-gray-500">Objet : <span className="text-gray-900 font-extrabold">[Anglix 🧠] C'est l'heure de ton rappel mémoire !</span></div>
                      <div className="pt-2 text-gray-700 leading-relaxed font-medium">
                        "Hey ! Il y a {targetDays === 3 ? "3 jours" : "1 mois"}, tu as fait le quiz sur <span className="font-extrabold text-black">"{lesson.title}"</span>. Pour fixer définitivement l'info : "
                      </div>
                      <div className="py-2.5 text-center">
                        <span className="inline-block px-4 py-2 bg-purple-600 border border-black text-white rounded text-[10px] uppercase font-black tracking-widest pointer-events-none shadow-[2px_2px_0_rgba(0,0,0,1)]">
                          Refaire le Quiz Instantanément 🎯
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-400 text-center font-mono">
                        Lien unique : {window.location.origin}?lessonId={lesson.id}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>

          </div>

        </div>
      </motion.div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-4 border-black">
        <p className="font-black uppercase italic text-red-500">Aucune question disponible pour cette leçon.</p>
        <button onClick={() => onComplete(false, 0, 0, 0)} className="mt-4 px-6 py-2 bg-black text-white rounded-xl font-bold uppercase">Retour</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto p-4 md:p-6"
    >
      <div className="bg-card-bg rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-4 border-black">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-purple-500 w-4.5 h-4.5 md:w-6 md:h-6" />
            <span className="font-bold text-gray-500 uppercase tracking-widest text-[10px] md:text-sm">
              Question {currentQuestionIndex + 1} / {quizQuestions.length}
            </span>
          </div>
          <div className="h-2 w-24 md:w-32 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 md:mb-8 leading-tight">
          {currentQuestion.text}
        </h2>

        {currentQuestion.diagram && (
          <div className="mb-8 p-4 bg-white border-4 border-black rounded-2xl flex justify-center items-center overflow-hidden">
            <div 
              className="w-full max-w-[300px] h-auto"
              dangerouslySetInnerHTML={{ __html: currentQuestion.diagram }} 
            />
          </div>
        )}

        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
          {(!currentQuestion.type || currentQuestion.type === 'qcm' || currentQuestion.type === 'true_false') ? (
            currentQuestion.options?.map((option, index) => {
              const isCorrect = index === Number(currentQuestion.correctAnswer);
              const isSelected = index === selectedOption;
              
              let bgColor = 'bg-gray-50 border-gray-200 hover:border-gray-400';
              if (isAnswered) {
                if (isCorrect) bgColor = 'bg-green-100 border-green-500 text-green-700';
                else if (isSelected) bgColor = 'bg-red-100 border-red-500 text-red-700';
                else bgColor = 'bg-gray-50 border-gray-200 opacity-50';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered}
                  className={`w-full p-4 md:p-5 rounded-xl md:rounded-2xl border-2 md:border-4 text-left font-bold text-base md:text-lg transition-all flex items-center justify-between ${bgColor}`}
                >
                  {option}
                  {isAnswered && isCorrect && <CheckCircle2 className="text-green-600 w-5 h-5 md:w-6 md:h-6" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-600 w-5 h-5 md:w-6 md:h-6" />}
                </button>
              );
            })
          ) : (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={isAnswered}
                placeholder="Ta réponse ici..."
                className={`w-full p-4 md:p-5 rounded-xl md:rounded-2xl border-4 border-black font-bold text-lg outline-none transition-all ${
                  isAnswered 
                    ? checkAnswer(textAnswer) 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : 'bg-red-100 border-red-500 text-red-700'
                    : 'bg-white focus:ring-4 ring-purple-500/20'
                }`}
              />
              {isAnswered && !checkAnswer(textAnswer) && (
                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-500 text-green-700 font-bold">
                  La bonne réponse était : <span className="uppercase">{currentQuestion.correctAnswer}</span>
                </div>
              )}
              {!isAnswered && (
                <button
                  type="submit"
                  className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Valider
                </button>
              )}
            </form>
          )}
        </div>

        {isAnswered && currentQuestion.explanation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-blue-800 text-sm font-bold italic"
          >
            💡 {currentQuestion.explanation}
          </motion.div>
        )}

        <AnimatePresence>
          {isAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-[0_8px_0_rgb(88,28,135)]"
            >
              {currentQuestionIndex < quizQuestions.length - 1 ? 'Suivant' : 'Terminer'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
