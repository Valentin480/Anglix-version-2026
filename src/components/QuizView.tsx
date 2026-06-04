import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, HelpCircle, Star, TrendingUp, Zap } from 'lucide-react';
import { Lesson, Question, UserState } from '../types';
import { audio } from '../lib/audio';

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
    if (checkAnswer(index)) {
      setScore(prev => prev + 1);
      audio.play('success');
      audio.haptic(30);
    } else {
      audio.play('error');
      audio.haptic([50, 50]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !textAnswer.trim()) return;
    setIsAnswered(true);
    if (checkAnswer(textAnswer)) {
      setScore(prev => prev + 1);
      audio.play('success');
      audio.haptic(30);
    } else {
      audio.play('error');
      audio.haptic([50, 50]);
    }
  };

  const handleNext = () => {
    audio.play('click');
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setTextAnswer('');
      setIsAnswered(false);
    } else {
      setShowSummary(true);
      audio.play('levelUp');
    }
  };

  if (showSummary) {
    const currentXpInLevel = user.xp % 200;
    const nextLevelXp = 200;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto p-4 md:p-6"
      >
        <div className="bg-card-bg rounded-[32px] md:rounded-[40px] border-4 md:border-8 border-black p-5 md:p-8 shadow-[0_8px_0_rgba(0,0,0,1)] md:shadow-[0_16px_0_rgba(0,0,0,1)] text-center">
          <motion.div 
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-16 h-16 md:w-24 md:h-24 bg-yellow-400 rounded-2xl md:rounded-3xl border-2 md:border-4 border-black flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-[4px_4px_0_rgba(0,0,0,1)]"
          >
            <Star size={32} className="text-white fill-white md:hidden" />
            <Star size={48} className="text-white fill-white hidden md:block" />
          </motion.div>
          
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-1 md:mb-2">Quiz Terminé !</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-6 md:mb-8">Voici ton bilan</p>

          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
            <div className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border-2 border-black">
              <span className="font-black uppercase italic text-gray-500 text-xs md:text-base">Réponses Justes</span>
              <span className="font-black text-xl md:text-2xl">{score} / {quizQuestions.length}</span>
            </div>

            <div className="flex justify-between items-center p-3 md:p-4 bg-purple-50 rounded-xl md:rounded-2xl border-2 border-black relative overflow-hidden">
              {isBoostActive && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-2 py-0.5 text-[8px] font-black uppercase rounded-bl-lg border-l-2 border-b-2 border-black">
                  Boost x2
                </div>
              )}
              <div className="flex items-center gap-2">
                <TrendingUp className="text-purple-600 w-4 h-4 md:w-5 md:h-5" />
                <span className="font-black uppercase italic text-purple-600 text-xs md:text-base">XP Gagné</span>
              </div>
              <div className="text-right">
                <span className="font-black text-2xl md:text-4xl text-purple-600">+{animatedXp}</span>
              </div>
            </div>

            {/* Level Progress in Summary */}
            <div className="p-3 md:p-4 bg-blue-50 rounded-xl md:rounded-2xl border-2 border-black">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black uppercase italic text-blue-600 text-[10px] md:text-xs">Progression Niveau {user.level}</span>
                <span className="font-black text-[10px] md:text-xs text-blue-600">{Math.min(nextLevelXp, currentXpInLevel + animatedXp)} / {nextLevelXp}</span>
              </div>
              <div className="h-3 md:h-4 bg-white border-2 border-black rounded-full overflow-hidden">
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
            className="w-full py-4 md:py-5 bg-black text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[0_4px_0_rgba(0,0,0,0.3)] md:shadow-[0_8px_0_rgba(0,0,0,0.3)] text-sm md:text-base"
          >
            Continuer
          </button>
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
              {currentQuestionIndex < lesson.questions.length - 1 ? 'Suivant' : 'Terminer'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
