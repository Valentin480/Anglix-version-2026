import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Timer, Trophy, X, Users, Star, Zap, Flame, Target, Loader2, ChevronRight, LogOut, LogIn, Sparkles, Coins } from 'lucide-react';
import { UserState, Duel, Lesson, Question, SchoolLevel } from '../types';
import { db, auth, handleFirestoreError, OperationType, loginWithGoogle } from '../firebase';
import { doc, setDoc, onSnapshot, collection, query, where, limit, getDocs, updateDoc, deleteDoc, or, and } from 'firebase/firestore';
import { audio } from '../lib/audio';
import QuizView from './QuizView';

interface DuelsProps {
  user: UserState;
  lessons: Lesson[];
  onClose: () => void;
  updateProfile: (updates: Partial<UserState>) => void;
  updateStats: (category: string, xpGained: number, accuracy: number, timeSpent: number, isDuel: boolean, isWin: boolean) => Promise<void>;
}

export default function Duels({ user, lessons, onClose, updateProfile, updateStats }: DuelsProps) {
  const [duel, setDuel] = useState<Duel | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(false);
  const [startTime] = useState(Date.now());

  const userId = auth.currentUser?.uid;
  const isAdmin = auth.currentUser?.email === 'valentinstark22@gmail.com';

  if (!userId) {
    return (
      <div className="bg-card-bg rounded-[24px] md:rounded-[40px] border-4 md:border-8 border-black p-6 md:p-12 shadow-[0_8px_0_rgba(0,0,0,1)] md:shadow-[0_16px_0_rgba(0,0,0,1)] text-center max-w-2xl mx-auto my-12">
        <div className="w-20 h-20 bg-red-100 rounded-3xl border-4 border-black flex items-center justify-center mx-auto mb-6">
          <Swords className="text-red-500 w-10 h-10" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">Arène des Duels</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm mb-8">
          Le mode Duel te permet de défier d'autres joueurs en temps réel sur du vocabulaire et de la grammaire !
        </p>
        
        <div className="bg-orange-50 border-4 border-black rounded-3xl p-6 mb-8 text-left border-dashed">
          <h4 className="font-black uppercase italic text-lg mb-2 text-orange-950">🔒 Connexion requise</h4>
          <p className="text-sm font-bold text-orange-900 leading-relaxed">
            Pour assurer l'appairage en temps réel avec de vrais adversaires, enregistrer ton score global et monter dans les ligues du classement, tu dois te connecter !
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button 
            onClick={async () => {
              audio.play('success');
              try {
                await loginWithGoogle();
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full sm:w-auto px-8 py-4 bg-black text-white hover:bg-gray-800 rounded-2xl border-4 border-black font-black text-sm uppercase italic tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all"
          >
            <LogIn size={18} /> Se connecter
          </button>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 hover:text-black rounded-2xl border-4 border-black font-black text-sm uppercase italic tracking-wider hover:bg-gray-100 shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all"
          >
            Retourner à l'accueil
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isSearching) {
      setSearchTimeout(false);
      timeout = setTimeout(() => {
        setIsSearching(false);
        setSearchTimeout(true);
        if (duel?.status === 'searching') {
          // Cancel the duel if we were the challenger
          if (duel.challengerId === userId) {
            updateDoc(doc(db, 'duels', duel.id), { status: 'cancelled' });
          }
          setDuel(null);
        }
      }, 45000); // 45 seconds timeout
    }
    return () => clearTimeout(timeout);
  }, [isSearching, duel?.id, userId]);

  // Check for existing active duel on mount
  useEffect(() => {
    if (!userId) return;

    const duelsRef = collection(db, 'duels');
    const q = query(
      duelsRef, 
      and(
        where('status', 'in', ['searching', 'voting', 'playing']),
        or(
          where('challengerId', '==', userId),
          where('opponentId', '==', userId)
        )
      ),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort by createdAt desc to get the most recent active duel
        const activeDuels = snapshot.docs
          .map(d => ({ ...d.data() as Duel, id: d.id }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        
        const activeDuel = activeDuels[0];
        setDuel(activeDuel);
        setIsSearching(false);
      } else {
        // If no active duel found in query, clear state unless we are currently searching/creating
        setDuel(prev => (prev && !isSearching) ? null : prev);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'duels');
    });

    return () => unsubscribe();
  }, [userId]);

  // Matchmaking logic
  const startMatchmaking = async () => {
    if (!userId || isSearching) return;
    setIsSearching(true);
    setSearchTimeout(false);
    audio.play('click');

    try {
      // Look for an existing duel waiting for an opponent
      const duelsRef = collection(db, 'duels');
      const q = query(
        duelsRef, 
        where('status', '==', 'searching'), 
        limit(20)
      );
      const querySnapshot = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'duels'));
      
      if (querySnapshot && !querySnapshot.empty) {
        // Find the most recent duel that isn't ours
        const otherDuels = querySnapshot.docs
          .filter(d => d.data().challengerId !== userId)
          .sort((a, b) => (b.data().createdAt || '').localeCompare(a.data().createdAt || ''));
        
        if (otherDuels.length > 0) {
          const foundDuelDoc = otherDuels[0];
          const existingDuel = { ...foundDuelDoc.data() as Duel, id: foundDuelDoc.id };
          
          // Join existing duel
          const updatedDuel: Partial<Duel> = {
            opponentId: userId,
            opponentName: user.name,
            status: 'voting',
            votingEndsAt: new Date(Date.now() + 15000).toISOString()
          };
          
          await updateDoc(doc(db, 'duels', existingDuel.id), updatedDuel).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${existingDuel.id}`));
          setDuel({ ...existingDuel, ...updatedDuel } as Duel);
          setIsSearching(false);
          return;
        }
      }

      // No suitable duel found, create new one
      const newDuelId = 'duel-' + Date.now();
      const newDuel: Duel = {
        id: newDuelId,
        challengerId: userId,
        challengerName: user.name,
        status: 'searching',
        createdAt: new Date().toISOString(),
        mode: Math.random() > 0.5 ? 'speed' : 'accuracy'
      };
      
      await setDoc(doc(db, 'duels', newDuelId), newDuel).catch(e => handleFirestoreError(e, OperationType.WRITE, `duels/${newDuelId}`));
      setDuel(newDuel);
      setIsSearching(false);
    } catch (error) {
      console.error('Matchmaking error:', error);
      setIsSearching(false);
    }
  };

  // Listen to current duel
  useEffect(() => {
    if (!duel?.id) return;

    const unsubscribe = onSnapshot(doc(db, 'duels', duel.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Duel;
        
        // If duel was cancelled by the other player, reset state
        if (data.status === 'cancelled') {
          setDuel(null);
          setIsSearching(false);
          return;
        }

        setDuel({ ...data, id: snapshot.id });
        
        if (data.status === 'voting' && isSearching) {
          setIsSearching(false);
          audio.play('levelUp');
        }

        if (data.status === 'playing' && data.startTime && !isGameOver) {
          // Initialize quiz if not already done
          const selectedLesson = lessons.find(l => l.id === data.lessonId);
          if (selectedLesson && quizQuestions.length === 0) {
            setQuizQuestions(selectedLesson.questions.slice(0, 10)); // 10 questions for duel
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `duels/${duel.id}`);
    });

    return () => unsubscribe();
  }, [duel?.id, lessons, isSearching, isGameOver, quizQuestions.length]);

  // Timer logic for voting and playing
  useEffect(() => {
    if (!duel) return;

    let timer: any;
    if (duel.status === 'voting' && duel.votingEndsAt) {
      const endsAt = new Date(duel.votingEndsAt).getTime();
      timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((endsAt - now) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
          handleAutoVote();
          clearInterval(timer);
        }
      }, 1000);
    } else if (duel.status === 'playing' && duel.startTime && duel.mode === 'speed') {
      const endsAt = new Date(duel.startTime).getTime() + 30000; // 30 seconds
      timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((endsAt - now) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
          handleFinishGame();
          clearInterval(timer);
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [duel?.status, duel?.votingEndsAt, duel?.startTime, duel?.mode]);

  const handleVote = async (lessonId: string) => {
    if (!duel || !userId) return;
    audio.play('click');
    const isChallenger = duel.challengerId === userId;
    const update = isChallenger ? { challengerVote: lessonId } : { opponentVote: lessonId };
    await updateDoc(doc(db, 'duels', duel.id), update).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${duel.id}`));
  };

  const handleAutoVote = async () => {
    if (!duel || duel.status !== 'voting') return;
    
    const isChallenger = duel.challengerId === userId;
    const hasVoted = isChallenger ? !!duel.challengerVote : !!duel.opponentVote;
    
    if (!hasVoted) {
      const randomLesson = lessons[Math.floor(Math.random() * lessons.length)];
      await handleVote(randomLesson.id);
    }

    // Resolution logic
    if (isChallenger) {
      setTimeout(async () => {
        const freshDoc = await getDocs(query(collection(db, 'duels'), where('id', '==', duel.id)));
        if (freshDoc.empty) return;
        const d = freshDoc.docs[0].data() as Duel;
        
        if (d.status === 'voting' && d.challengerVote && d.opponentVote) {
          let finalLessonId = d.challengerVote;
          if (d.challengerVote !== d.opponentVote) {
             // Random choice if different
             finalLessonId = Math.random() > 0.5 ? d.challengerVote : d.opponentVote;
          }
          const finalLesson = lessons.find(l => l.id === finalLessonId) || lessons[0];
          await updateDoc(doc(db, 'duels', d.id), {
            lessonId: finalLesson.id,
            lessonTitle: finalLesson.title,
            status: 'playing',
            startTime: new Date().toISOString()
          }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${d.id}`));
        }
      }, 1000);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
      audio.play('success');
    } else {
      setErrors(e => e + 1);
      audio.play('error');
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
    } else {
      handleFinishGame();
    }
  };

  const handleFinishGame = async () => {
    if (isGameOver || !duel || !userId) return;
    setIsGameOver(true);
    audio.play('levelUp');

    const isChallenger = duel.challengerId === userId;
    const updates = isChallenger 
      ? { challengerScore: score, challengerErrors: errors }
      : { opponentScore: score, opponentErrors: errors };

    await updateDoc(doc(db, 'duels', duel.id), updates).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${duel.id}`));

    // Wait for both to finish to show podium
    const checkInterval = setInterval(async () => {
      const freshDoc = await getDocs(query(collection(db, 'duels'), where('id', '==', duel.id))).catch(e => handleFirestoreError(e, OperationType.LIST, 'duels'));
      if (!freshDoc || freshDoc.empty) return;
      const d = freshDoc.docs[0].data() as Duel;
        if (d.challengerScore !== undefined && d.opponentScore !== undefined) {
          let winnerId = 'draw';
          if (d.mode === 'speed') {
            if (d.challengerScore > d.opponentScore) winnerId = d.challengerId;
            else if (d.opponentScore > d.challengerScore) winnerId = d.opponentId!;
          } else {
            if (d.challengerErrors! < d.opponentErrors!) winnerId = d.challengerId;
            else if (d.opponentErrors! < d.challengerErrors!) winnerId = d.opponentId!;
            else if (d.challengerScore! > d.opponentScore!) winnerId = d.challengerId;
          }

          await updateDoc(doc(db, 'duels', d.id), { status: 'completed', winnerId }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${d.id}`));
          
          const accuracy = (score / (quizQuestions.length || 1)) * 100;
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);

          // Reward the user
          if (winnerId === userId) {
            const xpToAdd = 200;
            updateProfile({
              xp: user.xp + xpToAdd,
              coins: user.coins + 100
            });
            await updateStats('Duel', xpToAdd, accuracy, timeSpent, true, true);
          } else if (winnerId === 'draw') {
            const xpToAdd = 100;
            updateProfile({ xp: user.xp + xpToAdd, coins: user.coins + 50 });
            await updateStats('Duel', xpToAdd, accuracy, timeSpent, true, false);
          } else {
            const xpToAdd = 50;
            updateProfile({ xp: user.xp + xpToAdd });
            await updateStats('Duel', xpToAdd, accuracy, timeSpent, true, false);
          }

          clearInterval(checkInterval);
        }
    }, 2000);
  };

  const leaveDuel = async () => {
    if (duel) {
      if (duel.status === 'searching') {
        // If we are just searching, DELETE the document so it's not matched with anyone else
        // and it doesn't trigger "cancelled" for others who haven't joined yet.
        await deleteDoc(doc(db, 'duels', duel.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `duels/${duel.id}`));
      } else {
        // If already matched (voting, playing), then cancel it properly
        await updateDoc(doc(db, 'duels', duel.id), { status: 'cancelled' }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${duel.id}`));
      }
    }
    setIsSearching(false);
    setDuel(null);
    onClose();
  };

  // Cleanup stale searching duels (older than 5 mins)
  useEffect(() => {
    if (!isAdmin) return; // Only admin cleans up to avoid multiple writes
    const cleanup = async () => {
      const duelsRef = collection(db, 'duels');
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const q = query(duelsRef, where('status', '==', 'searching'), where('createdAt', '<', fiveMinsAgo));
      const snapshot = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'duels'));
      if (snapshot) {
        snapshot.docs.forEach(d => deleteDoc(d.ref).catch(e => handleFirestoreError(e, OperationType.DELETE, `duels/${d.id}`)));
      }
    };
    cleanup();
  }, [isAdmin]);

  const isConflict = duel?.status === 'voting' && duel.challengerVote && duel.opponentVote && duel.challengerVote !== duel.opponentVote;
  const isChallenger = duel?.challengerId === userId;

  const resolveConflict = async () => {
    if (!duel) return;
    const finalLessonId = Math.random() > 0.5 ? duel.challengerVote : duel.opponentVote;
    const finalLesson = lessons.find(l => l.id === finalLessonId) || lessons[0];
    await updateDoc(doc(db, 'duels', duel.id), {
      lessonId: finalLesson.id,
      lessonTitle: finalLesson.title,
      status: 'playing',
      startTime: new Date().toISOString()
    }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `duels/${duel.id}`));
  };

  const showStart = !duel && !isSearching;
  const showSearching = isSearching || duel?.status === 'searching';
  const showVoting = duel?.status === 'voting';
  const showPlaying = duel?.status === 'playing';
  const showCompleted = duel?.status === 'completed';

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 md:p-8 overflow-hidden">
      <AnimatePresence mode="wait">
        {showStart && (
          <motion.div
            key="start"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="text-center max-w-md"
          >
            <div className="mb-8 relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-full blur-3xl opacity-20"
              />
              <Swords size={120} className="text-white mx-auto relative z-10" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic mb-4 tracking-tighter">Mode Duel</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest mb-8">Affronte un autre élève en temps réel !</p>
            
            {searchTimeout && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 font-bold text-sm uppercase tracking-wider"
              >
                Aucun adversaire trouvé pour le moment. Réessaie !
              </motion.div>
            )}

            <button
              onClick={startMatchmaking}
              className="w-full group relative px-12 py-6 bg-white rounded-[32px] border-8 border-black shadow-[0_12px_0_rgba(255,255,255,0.3)] hover:-translate-y-2 active:translate-y-0 active:shadow-none transition-all"
            >
              <span className="text-3xl font-black uppercase italic flex items-center justify-center gap-4">
                Trouver un adversaire <ChevronRight size={32} />
              </span>
            </button>
            <button onClick={onClose} className="mt-8 text-gray-500 font-black uppercase italic hover:text-white transition-colors">Retour</button>
          </motion.div>
        )}

        {showSearching && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center w-full max-w-sm px-6"
          >
            <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto mb-10">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={64} className="text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic mb-2">Recherche en cours...</h3>
            <p className="text-blue-400 font-bold text-xs md:text-sm animate-pulse uppercase tracking-widest">Un adversaire arrive bientôt</p>
            
            <div className="mt-12 flex flex-col gap-4">
              <button 
                onClick={leaveDuel} 
                className="w-full py-4 bg-white/10 text-white rounded-2xl border-2 border-white/10 font-black uppercase italic hover:bg-white/20 transition-all text-sm"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}

        {showVoting && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-4xl"
          >
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-yellow-400 font-black uppercase tracking-widest text-sm">Phase de Vote</span>
                <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic leading-none">Choisis le thème</h3>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white flex items-center gap-2">
                  <Timer className={timeLeft < 5 ? 'text-red-500 animate-bounce' : 'text-white'} />
                  {timeLeft}s
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {lessons.slice(0, 6).map((l) => {
                const challengerVoted = duel.challengerVote === l.id;
                const opponentVoted = duel.opponentVote === l.id;
                const myVote = (duel.challengerId === userId ? duel.challengerVote : duel.opponentVote) === l.id;

                return (
                  <button
                    key={l.id}
                    onClick={() => handleVote(l.id)}
                    className={`p-6 rounded-2xl border-4 transition-all text-left relative overflow-hidden ${
                      myVote ? 'bg-white border-yellow-400 scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-black uppercase italic text-lg text-white group-hover:text-black">{l.title}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase">{l.category}</div>
                    
                    <div className="absolute top-2 right-2 flex gap-1">
                      {challengerVoted && (
                        <div className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black rounded uppercase">
                          {duel.challengerName}
                        </div>
                      )}
                      {opponentVoted && (
                        <div className="px-2 py-1 bg-red-500 text-white text-[8px] font-black rounded uppercase">
                          {duel.opponentName}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-8 p-8 bg-white/5 rounded-3xl border-4 border-white/10">
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-2 flex items-center justify-center text-white font-black text-2xl">
                  {duel.challengerName[0]}
                </div>
                <div className="text-white font-black uppercase italic text-sm">{duel.challengerName}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">{duel.challengerVote ? 'A Voté' : 'En attente...'}</div>
              </div>
              
              {isConflict ? (
                <div className="flex-1 flex flex-col gap-2">
                  <button 
                    onClick={resolveConflict}
                    className="w-full py-3 bg-yellow-400 text-black rounded-xl font-black uppercase italic text-xs shadow-[0_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
                  >
                    Anglix décide ! 🎲
                  </button>
                  <button 
                    onClick={leaveDuel}
                    className="w-full py-3 bg-white/10 text-white rounded-xl font-black uppercase italic text-xs hover:bg-white/20 transition-all"
                  >
                    Quitter
                  </button>
                </div>
              ) : (
                <div className="text-white font-black text-4xl italic opacity-20">VS</div>
              )}

              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-red-500 rounded-2xl mx-auto mb-2 flex items-center justify-center text-white font-black text-2xl">
                  {duel.opponentName?.[0] || '?'}
                </div>
                <div className="text-white font-black uppercase italic text-sm">{duel.opponentName}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">{duel.opponentVote ? 'A Voté' : 'En attente...'}</div>
              </div>
            </div>
          </motion.div>
        )}

        {showPlaying && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl border-2 border-white/20">
                  <Zap className="text-yellow-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mode : {duel.mode === 'speed' ? 'Vitesse (30s)' : 'Précision'}</div>
                  <div className="text-xl font-black text-white uppercase italic">{duel.lessonTitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${timeLeft < 5 ? 'text-red-500' : 'text-white'}`}>
                  {duel.mode === 'speed' ? `${timeLeft}s` : `${currentQuestionIndex + 1}/${quizQuestions.length}`}
                </div>
              </div>
            </div>

            {quizQuestions.length > 0 && !isGameOver && (
              <div className="bg-white p-8 rounded-[40px] border-8 border-black shadow-[0_16px_0_rgba(255,255,255,0.1)]">
                <div className="mb-8">
                  <h4 className="text-2xl font-black uppercase italic leading-tight mb-2">
                    {quizQuestions[currentQuestionIndex].text}
                  </h4>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {quizQuestions[currentQuestionIndex].options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx === Number(quizQuestions[currentQuestionIndex].correctAnswer))}
                      className="p-5 bg-gray-50 border-4 border-black rounded-2xl text-left font-black uppercase italic hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isGameOver && (
              <div className="text-center py-20">
                <Loader2 size={64} className="mx-auto text-white animate-spin mb-4" />
                <h3 className="text-3xl font-black text-white uppercase italic">Partie terminée !</h3>
                <p className="text-gray-400 font-bold uppercase">En attente de l'adversaire...</p>
              </div>
            )}
          </motion.div>
        )}

        {showCompleted && (
          <motion.div
            key="podium"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center w-full max-w-4xl px-4"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-6xl md:text-8xl font-black text-white uppercase italic mb-4 tracking-tighter">
                {duel.winnerId === userId ? 'VICTOIRE !' : duel.winnerId === 'draw' ? 'ÉGALITÉ' : 'DÉFAITE'}
              </h2>
              <p className="text-yellow-400 font-black uppercase tracking-widest mb-12">
                {duel.mode === 'speed' ? 'Mode Vitesse' : 'Mode Précision'} • {duel.lessonTitle}
              </p>
            </motion.div>
            
            <div className="flex items-end justify-center gap-4 md:gap-12 mb-16 h-80 relative">
              {/* Confetti effect placeholder */}
              {duel.winnerId === userId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <Sparkles className="text-yellow-400 absolute top-0 left-1/4 animate-bounce" size={48} />
                  <Sparkles className="text-yellow-400 absolute top-10 right-1/4 animate-bounce delay-100" size={32} />
                  <Star className="text-white absolute top-20 left-1/2 animate-ping" size={24} />
                </motion.div>
              )}

              {/* Opponent Column */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: duel.winnerId === duel.opponentId ? '80%' : '50%' }}
                transition={{ type: 'spring', damping: 15, delay: 0.5 }}
                className={`w-32 md:w-56 rounded-t-[40px] border-x-8 border-t-8 border-black flex flex-col items-center justify-end pb-12 relative ${
                  duel.winnerId === duel.opponentId ? 'bg-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.3)]' : 'bg-gray-500'
                }`}
              >
                <div className="absolute -top-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-red-500 rounded-[24px] border-4 border-black flex items-center justify-center text-white font-black text-3xl shadow-lg mb-2">
                    {duel.opponentName?.[0] || '?'}
                  </div>
                  <div className="text-4xl">{duel.winnerId === duel.opponentId ? '👑' : '🥈'}</div>
                </div>
                <div className="font-black uppercase italic text-sm md:text-2xl truncate w-full px-4 text-black">{duel.opponentName}</div>
                <div className="font-black text-xs md:text-lg opacity-60 text-black">
                  {duel.opponentScore} PTS {duel.mode === 'accuracy' && `• ${duel.opponentErrors} ERR`}
                </div>
              </motion.div>

              {/* Challenger Column */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: duel.winnerId === duel.challengerId ? '100%' : '50%' }}
                transition={{ type: 'spring', damping: 15, delay: 0.7 }}
                className={`w-32 md:w-56 rounded-t-[40px] border-x-8 border-t-8 border-black flex flex-col items-center justify-end pb-12 relative ${
                  duel.winnerId === duel.challengerId ? 'bg-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.3)]' : 'bg-gray-500'
                }`}
              >
                <div className="absolute -top-24 flex flex-col items-center">
                  <div className="w-24 h-24 bg-blue-500 rounded-[32px] border-4 border-black flex items-center justify-center text-white font-black text-4xl shadow-lg mb-2">
                    {duel.challengerName[0]}
                  </div>
                  <div className="text-5xl">{duel.winnerId === duel.challengerId ? '👑' : '🥈'}</div>
                </div>
                <div className="font-black uppercase italic text-sm md:text-2xl truncate w-full px-4 text-black">{duel.challengerName}</div>
                <div className="font-black text-xs md:text-lg opacity-60 text-black">
                  {duel.challengerScore} PTS {duel.mode === 'accuracy' && `• ${duel.challengerErrors} ERR`}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-white p-8 rounded-[40px] border-8 border-black shadow-[0_16px_0_rgba(255,255,255,0.1)] inline-block"
            >
              <h3 className="text-3xl font-black uppercase italic mb-2">
                {duel.winnerId === userId ? 'Récompense Royale !' : duel.winnerId === 'draw' ? 'Bien joué !' : 'Continue de t\'entraîner !'}
              </h3>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-500" size={24} />
                  <span className="text-2xl font-black">+{duel.winnerId === userId ? '200' : duel.winnerId === 'draw' ? '100' : '50'} XP</span>
                </div>
                {(duel.winnerId === userId || duel.winnerId === 'draw') && (
                  <div className="flex items-center gap-2">
                    <Coins className="text-yellow-500" size={24} />
                    <span className="text-2xl font-black">+{duel.winnerId === userId ? '100' : '50'}</span>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="mt-12">
              <button
                onClick={onClose}
                className="px-12 py-5 bg-white text-black rounded-3xl font-black uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-all border-4 border-black shadow-[0_8px_0_rgba(0,0,0,1)]"
              >
                Retour au menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
