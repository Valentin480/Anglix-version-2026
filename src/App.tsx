import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Trophy, Package, Home, Star, Zap, Gem, Coins, ChevronRight, User as UserIcon, Settings as SettingsIcon, Users, Sparkles, Shield, LogIn, LogOut, BookOpen, Flame, Swords, ShoppingBag, Printer, Loader2, TrendingUp, Paperclip, Camera, FileText, X as XIcon } from 'lucide-react';
import { ALL_LESSONS } from './data/lessons';
import { UserState, Lesson, Reward, LeaderboardEntry, SchoolLevel, Duel, UserStats, SavedLesson, LeaderboardType } from './types';
import LessonView from './components/LessonView';
import QuizView from './components/QuizView';
import KnowledgeGem from './components/KnowledgeGem';
import Onboarding from './components/Onboarding';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Quests from './components/Quests';
import AdminPanel from './components/AdminPanel';
import Shop from './components/Shop';
import Duels from './components/Duels';
import StatsDashboard from './components/StatsDashboard';
import Backpack from './components/Backpack';
import AIGenerationOverlay from './components/AIGenerationOverlay';
import FlashcardsView from './components/FlashcardsView';
import { audio } from './lib/audio';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection, query, orderBy, limit, addDoc, deleteDoc, getDocs, where, or, deleteField } from 'firebase/firestore';
import { Quest } from './types';
import { generateLessonWithAI } from './services/geminiService';
import { fetchUnsplashImage } from './services/imageService';

export default function App() {
  const cleanObject = (obj: any) => {
    const cleaned: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  const [view, setView] = useState<'home' | 'lesson' | 'quiz' | 'inventory' | 'leaderboard' | 'profile' | 'settings' | 'admin' | 'shop' | 'duels' | 'flashcards'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [skipLessonPrompt, setSkipLessonPrompt] = useState(false);
  const [showGem, setShowGem] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [genLevel, setGenLevel] = useState<string>('');
  const [genIncludeVideo, setGenIncludeVideo] = useState(true);
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<UserState | null>(null);
  const [allUsers, setAllUsers] = useState<(UserState & { id: string })[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(true);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('all-time');
  const [showStats, setShowStats] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  
  const isAdmin = currentUser?.email === 'valentinstark22@gmail.com';
  
  const SCHOOL_LEVEL_ORDER: SchoolLevel[] = ['Primaire', 'Collège', 'Lycée', 'Supérieur'];

const INITIAL_USER_STATE: UserState = {
    name: '',
    schoolLevel: 'Collège',
    xp: 0,
    level: 1,
    coins: 100,
    gems: 10,
    inventory: [],
    completedLessons: [],
    dailyQuests: [
      {
        id: 'lessons_3',
        title: 'Apprenti Assidu',
        description: 'Complète 3 leçons aujourd\'hui',
        target: 3,
        progress: 0,
        reward: 150,
        completed: false,
        claimed: false
      }
    ],
    lastQuestReset: new Date().toISOString().split('T')[0],
    skipLessonIds: [],
    streak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    streakFreezeCount: 0,
    activeTheme: 'default',
    activeXpBoostUntil: undefined
  };

  const [user, setUser] = useState<UserState>(INITIAL_USER_STATE);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setCurrentUser(fbUser);
      setIsAuthReady(true);
      
      if (!fbUser) {
        // Load guest from localStorage immediately if not authenticated
        const cached = localStorage.getItem('anglix_guest_user');
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch (e) {
            setUser(INITIAL_USER_STATE);
          }
        } else {
          setUser(INITIAL_USER_STATE);
        }
      } else {
        setUser(INITIAL_USER_STATE);
      }
      
      setLeaderboardData([]);
      
      // Check for deep links
      const params = new URLSearchParams(window.location.search);
      const playerId = params.get('player');
      if (playerId) {
        setViewingPlayerId(playerId);
        setView('profile');
      } else {
        setView('home');
      }
      
      setSearchQuery('');
    });
    return () => unsubscribe();
  }, []);

  // Listen for Duels
  useEffect(() => {
    if (!currentUser) {
      setDuels([]);
      return;
    }

    const duelsQuery = query(
      collection(db, 'duels'),
      or(
        where('challengerId', '==', currentUser.uid),
        where('opponentId', '==', currentUser.uid)
      ),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(duelsQuery, (snapshot) => {
      const duelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Duel));
      setDuels(duelsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'duels');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync User with Firestore or Local Storage
  useEffect(() => {
    if (!currentUser) {
      const cached = localStorage.getItem('anglix_guest_user');
      let currentGuest = INITIAL_USER_STATE;
      if (cached) {
        try {
          currentGuest = JSON.parse(cached);
        } catch (e) {
          currentGuest = INITIAL_USER_STATE;
        }
      }
      
      // Guest Streak Logic
      if (currentGuest.name) {
        const today = new Date().toISOString().split('T')[0];
        if (currentGuest.lastActiveDate !== today) {
          const lastDate = currentGuest.lastActiveDate ? new Date(currentGuest.lastActiveDate) : null;
          const todayDate = new Date(today);
          const diffTime = lastDate ? todayDate.getTime() - lastDate.getTime() : Infinity;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let newStreak = currentGuest.streak || 0;
          let newFreeze = currentGuest.streakFreezeCount || 0;

          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            if (newFreeze > 0) {
              newFreeze -= 1;
            } else {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          currentGuest = {
            ...currentGuest,
            streak: newStreak,
            lastActiveDate: today,
            streakFreezeCount: newFreeze
          };
          localStorage.setItem('anglix_guest_user', JSON.stringify(currentGuest));
        }
      }
      setUser(currentGuest);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Listen for real-time updates to user profile
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserState;
        
        // Streak Logic
        const today = new Date().toISOString().split('T')[0];
        if (data.lastActiveDate !== today) {
          const lastDate = data.lastActiveDate ? new Date(data.lastActiveDate) : null;
          const todayDate = new Date(today);
          const diffTime = lastDate ? todayDate.getTime() - lastDate.getTime() : Infinity;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let newStreak = data.streak || 0;
          let newFreeze = data.streakFreezeCount || 0;

          if (diffDays === 1) {
            // Consecutive day!
            newStreak += 1;
          } else if (diffDays > 1) {
            // Missed a day
            if (newFreeze > 0) {
              newFreeze -= 1;
              // Streak preserved by freeze
            } else {
              newStreak = 1; // Reset to 1 for today
            }
          } else {
            newStreak = 1; // First time or error
          }

          setDoc(userDocRef, { 
            streak: newStreak, 
            lastActiveDate: today,
            streakFreezeCount: newFreeze
          }, { merge: true });
        }

        setUser(data);
      } else {
        // If user document doesn't exist, ensure state is initial (for onboarding)
        setUser(INITIAL_USER_STATE);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Lessons Listener & Seeding
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!currentUser) {
      setCustomLessons(ALL_LESSONS);
      setIsLessonsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'lessons'), async (snapshot) => {
      if (snapshot.empty && currentUser && isAdmin) {
        // Only admin seeds to avoid race conditions and unnecessary writes
        console.log('Seeding initial lessons...');
        const seedPromises = ALL_LESSONS.slice(0, 10).map(lesson => 
          setDoc(doc(db, 'lessons', lesson.id), lesson)
        );
        await Promise.all(seedPromises);
      } else if (!snapshot.empty) {
        const lessons = snapshot.docs.map(doc => ({
          ...doc.data() as Lesson,
          id: doc.id
        }));
        setCustomLessons(lessons);
        setIsLessonsLoading(false);
      } else {
        // If empty and not admin, or just empty, still stop loading
        setIsLessonsLoading(false);
      }
    }, (error) => {
      // If it's a permission error or something else, don't block the UI forever
      setIsLessonsLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'lessons');
    });

    return () => unsubscribe();
  }, [isAuthReady, currentUser, isAdmin]);

  // Viewing Player Listener
  useEffect(() => {
    if (!viewingPlayerId) {
      setViewingPlayer(null);
      return;
    }

    if (viewingPlayerId.startsWith('mock-')) {
      const entry = leaderboardData.find(e => e.id === viewingPlayerId);
      if (entry) {
        setViewingPlayer({
          uid: entry.id,
          name: entry.name,
          schoolLevel: 'Lycée',
          xp: entry.xp,
          level: entry.level,
          coins: 500,
          gems: 25,
          inventory: entry.activeTitle ? [{ id: 'title-1', type: 'profile_name', name: entry.activeTitle, level: 1 }] : [],
          completedLessons: [],
          dailyQuests: [],
          lastQuestReset: '',
          skipLessonIds: [],
          streak: 4,
          lastActiveDate: '',
          streakFreezeCount: 1,
          activeTheme: 'default',
          activeTitle: entry.activeTitle,
        } as any);
      }
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', viewingPlayerId), (snapshot) => {
      if (snapshot.exists()) {
        setViewingPlayer({ ...snapshot.data() as UserState, id: snapshot.id } as any);
      }
    });

    return () => unsubscribe();
  }, [viewingPlayerId, leaderboardData]);

  const handleViewPlayer = (playerId: string) => {
    setViewingPlayerId(playerId);
    setView('profile');
  };
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...(doc.data() as UserState),
        id: doc.id
      }));
      setAllUsers(users);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleUpdateLesson = async (updatedLesson: Lesson) => {
    try {
      await setDoc(doc(db, 'lessons', updatedLesson.id), updatedLesson);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `lessons/${updatedLesson.id}`);
    }
  };

  const handleGenerateLesson = async () => {
    if ((!searchQuery && selectedFiles.length === 0) || isGeneratingLesson) return;
    
    setIsGeneratingLesson(true);
    try {
      const levelToUse = genLevel || user.schoolLevel;
      const attachments = selectedFiles.map(f => ({ data: f.data, mimeType: f.type }));
      const generated = await generateLessonWithAI(searchQuery, levelToUse, genIncludeVideo, attachments);
      
      // Fetch relevant image
      const imageUrl = generated.imageSearchTerm 
        ? await fetchUnsplashImage(generated.imageSearchTerm)
        : await fetchUnsplashImage(generated.title);

      const newLesson: Lesson = {
        id: 'ai-' + Date.now(),
        ...generated,
        imageUrl: imageUrl || undefined,
        questions: (generated.questions || []).map((q: any, idx: number) => ({
          ...q,
          id: q.id || `q-${Date.now()}-${idx}`
        })),
        level: levelToUse as SchoolLevel,
        difficulty: 1
      };
      
      // Save to Firestore
      if (currentUser) {
        try {
          await setDoc(doc(db, 'lessons', newLesson.id), newLesson);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `lessons/${newLesson.id}`);
        }
      } else {
        setCustomLessons(prev => [newLesson, ...prev]);
      }
      
      // Select it
      setSelectedLesson(newLesson);
      setView('lesson');
      setSearchQuery('');
      setSelectedFiles([]);
      setGenLevel('');
    } catch (error) {
      console.error('Error generating lesson:', error);
      alert('Désolé, une erreur est survenue lors de la génération de la leçon. Réessaie avec un sujet plus précis !');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `lessons/${lessonId}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // In a real app, we'd call a cloud function or delete the doc
    // For now, we'll just log it as we need specific rules to delete others
    console.log('Banning user:', userId);
    alert('Action Admin: Demande de bannissement envoyée pour ' + userId);
  };

  // Leaderboard Listener
  useEffect(() => {
    if (!isAuthReady) return;

    if (!currentUser) {
      // Offline/Guest Mode Leaderboard Data
      const guestEntry: LeaderboardEntry = {
        id: 'guest',
        name: user.name || 'Invité',
        xp: user.xp,
        level: user.level,
        activeTitle: user.activeTitle,
        isCurrentUser: true
      };
      const MOCK_LEADERBOARD: LeaderboardEntry[] = [
        { id: 'mock-1', name: 'Valentin 👑', xp: 12450, level: 8, activeTitle: 'Grand Maître', isCurrentUser: false },
        { id: 'mock-2', name: 'Sarah Sparkles ✨', xp: 9800, level: 6, isCurrentUser: false },
        { id: 'mock-3', name: 'Le Shaker ⚡', xp: 7200, level: 5, isCurrentUser: false },
        { id: 'mock-4', name: 'English Expert 🇬🇧', xp: 5120, level: 4, isCurrentUser: false },
        { id: 'mock-5', name: 'Emma Rose 🌹', xp: 3200, level: 3, isCurrentUser: false },
        { id: 'mock-6', name: 'Antoine', xp: 1510, level: 2, isCurrentUser: false },
      ];
      // Construct sorted combined leaderboard
      const combined = [guestEntry, ...MOCK_LEADERBOARD].sort((a, b) => b.xp - a.xp);
      setLeaderboardData(combined);
      return;
    }

    let q;
    if (leaderboardType === 'all-time') {
      q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
    } else {
      const period = getPeriodString(leaderboardType);
      q = query(
        collection(db, 'leaderboards', leaderboardType, 'entries'),
        where('period', '==', period),
        orderBy('xp', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.userId || doc.id,
          name: data.name || data.userName,
          xp: data.xp,
          level: data.level || 1,
          activeTitle: data.activeTitle,
          isCurrentUser: (data.userId || doc.id) === currentUser?.uid
        };
      });
      setLeaderboardData(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaderboards');
    });

    return () => unsubscribe();
  }, [isAuthReady, currentUser, leaderboardType, user.xp, user.name, user.level, user.activeTitle]);

  const getPeriodString = (type: LeaderboardType) => {
    const now = new Date();
    if (type === 'daily') return now.toISOString().split('T')[0];
    if (type === 'weekly') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `${now.getFullYear()}-W${weekNumber}`;
    }
    if (type === 'monthly') return `${now.getFullYear()}-${now.getMonth() + 1}`;
    return 'all-time';
  };

  // Listen for User Stats
  useEffect(() => {
    if (!currentUser) {
      const cached = localStorage.getItem('anglix_guest_stats');
      if (cached) {
        try {
          setUserStats(JSON.parse(cached));
        } catch (e) {
          setUserStats(null);
        }
      } else {
        const guestStats: UserStats = {
          userId: 'guest',
          totalQuizzes: 0,
          totalDuels: 0,
          duelWins: 0,
          duelLosses: 0,
          xpPerCategory: {},
          accuracyPerCategory: {},
          bestStreak: 0,
          totalTimeSpent: 0,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('anglix_guest_stats', JSON.stringify(guestStats));
        setUserStats(guestStats);
      }
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid, 'stats', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setUserStats(snapshot.data() as UserStats);
      } else {
        const initialStats: UserStats = {
          userId: currentUser.uid,
          totalQuizzes: 0,
          totalDuels: 0,
          duelWins: 0,
          duelLosses: 0,
          xpPerCategory: {},
          accuracyPerCategory: {},
          bestStreak: 0,
          totalTimeSpent: 0,
          lastUpdated: new Date().toISOString()
        };
        setDoc(doc(db, 'users', currentUser.uid, 'stats', 'main'), initialStats);
        setUserStats(initialStats);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for Backpack (Saved Lessons)
  useEffect(() => {
    if (!currentUser) {
      const cached = localStorage.getItem('anglix_guest_backpack');
      if (cached) {
        try {
          setSavedLessons(JSON.parse(cached));
        } catch (e) {
          setSavedLessons([]);
        }
      } else {
        setSavedLessons([]);
      }
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'users', currentUser.uid, 'backpack'), (snapshot) => {
      const lessons = snapshot.docs.map(doc => doc.data() as SavedLesson);
      setSavedLessons(lessons);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredLessons = useMemo(() => {
    let lessons = customLessons;
    if (!searchQuery) {
      lessons = customLessons.filter(l => l.level === user.schoolLevel);
    } else {
      const queryStr = searchQuery.toLowerCase();
      lessons = customLessons.filter(l => 
        l.title.toLowerCase().includes(queryStr) || 
        l.category.toLowerCase().includes(queryStr) ||
        l.level.toLowerCase().includes(queryStr)
      );
    }
    return lessons.slice(0, 24);
  }, [searchQuery, user.schoolLevel, customLessons]);

  const handleOnboardingComplete = async (name: string, schoolLevel: SchoolLevel) => {
    const newUser: UserState = {
      ...user,
      name,
      schoolLevel,
      uid: currentUser ? currentUser.uid : 'guest',
      lastUpdated: new Date().toISOString()
    } as any;

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), newUser);
        setUser(newUser);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
      }
    } else {
      localStorage.setItem('anglix_guest_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    audio.play('click');
    setSelectedLesson(lesson);
    if (user.skipLessonIds?.includes(lesson.id)) {
      setView('quiz');
    } else {
      setShowLessonModal(true);
    }
  };

  const handleSaveToBackpack = async (lesson: Lesson) => {
    const savedLesson: SavedLesson = {
      userId: currentUser ? currentUser.uid : 'guest',
      lessonId: lesson.id,
      title: lesson.title,
      category: lesson.category,
      savedAt: new Date().toISOString()
    };

    if (!currentUser) {
      const updatedBackpack = [...savedLessons.filter(l => l.lessonId !== lesson.id), savedLesson];
      localStorage.setItem('anglix_guest_backpack', JSON.stringify(updatedBackpack));
      setSavedLessons(updatedBackpack);
      audio.play('success');
      return;
    }

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'backpack', lesson.id), savedLesson);
      audio.play('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `backpack/${lesson.id}`);
    }
  };

  const handleRemoveFromBackpack = async (lessonId: string) => {
    if (!currentUser) {
      const updatedBackpack = savedLessons.filter(l => l.lessonId !== lessonId);
      localStorage.setItem('anglix_guest_backpack', JSON.stringify(updatedBackpack));
      setSavedLessons(updatedBackpack);
      audio.play('click');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'backpack', lessonId));
      audio.play('click');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `backpack/${lessonId}`);
    }
  };

  const updateStats = async (category: string, xpGained: number, accuracy: number, timeSpent: number, isDuel: boolean = false, isWin: boolean = false) => {
    if (!userStats) return;

    const newXpPerCategory = { ...userStats.xpPerCategory };
    newXpPerCategory[category] = (newXpPerCategory[category] || 0) + xpGained;

    const newAccuracyPerCategory = { ...userStats.accuracyPerCategory };
    const currentAccuracy = newAccuracyPerCategory[category] || 0;
    // Simple moving average for accuracy
    newAccuracyPerCategory[category] = currentAccuracy === 0 ? accuracy : (currentAccuracy + accuracy) / 2;

    const updates: Partial<UserStats> = {
      totalQuizzes: userStats.totalQuizzes + (isDuel ? 0 : 1),
      totalDuels: userStats.totalDuels + (isDuel ? 1 : 0),
      duelWins: userStats.duelWins + (isWin ? 1 : 0),
      duelLosses: userStats.duelLosses + (isDuel && !isWin ? 1 : 0),
      xpPerCategory: newXpPerCategory,
      accuracyPerCategory: newAccuracyPerCategory,
      totalTimeSpent: userStats.totalTimeSpent + timeSpent,
      bestStreak: Math.max(userStats.bestStreak, user.streak),
      lastUpdated: new Date().toISOString()
    };

    if (!currentUser) {
      const updatedStats = { ...userStats, ...updates };
      localStorage.setItem('anglix_guest_stats', JSON.stringify(updatedStats));
      setUserStats(updatedStats);
      return;
    }

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'stats', 'main'), updates, { merge: true });
      
      // Update periodic leaderboards
      const periods = ['daily', 'weekly', 'monthly'].map(type => ({ type, period: getPeriodString(type as LeaderboardType) }));
      for (const { type, period } of periods) {
        const entryId = `${currentUser.uid}_${period}`;
        const entryRef = doc(db, 'leaderboards', type, 'entries', entryId);
        const entrySnap = await getDoc(entryRef);
        
        if (entrySnap.exists()) {
          await setDoc(entryRef, { xp: entrySnap.data().xp + xpGained }, { merge: true });
        } else {
          await setDoc(entryRef, {
            userId: currentUser.uid,
            userName: user.name,
            xp: xpGained,
            period,
            type,
            level: user.level,
            activeTitle: user.activeTitle
          });
        }
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const handleConfirmLesson = (showLesson: boolean, skipForever: boolean) => {
    audio.play('click');
    if (!selectedLesson) return;

    if (skipForever) {
      const newSkipIds = [...(user.skipLessonIds || []), selectedLesson.id];
      updateProfile({ skipLessonIds: newSkipIds });
    }

    setShowLessonModal(false);
    if (showLesson) {
      setView('lesson');
    } else {
      setView('quiz');
    }
  };

  const handleLessonComplete = () => {
    setView('quiz');
  };

  const handleQuizComplete = async (success: boolean, score: number = 0, accuracy: number = 0, timeSpent: number = 0) => {
    if (currentUser) {
      if (activeDuel) {
        const isChallenger = activeDuel.challengerId === currentUser.uid;
        const updates: any = isChallenger ? { challengerScore: score } : { opponentScore: score };
        
        // If both played, determine winner
        const updatedDuel = { ...activeDuel, ...updates };
        let isWin = false;
        if (updatedDuel.challengerScore !== undefined && updatedDuel.opponentScore !== undefined) {
          updatedDuel.status = 'completed';
          if (updatedDuel.challengerScore > updatedDuel.opponentScore) {
            updatedDuel.winnerId = updatedDuel.challengerId;
            isWin = updatedDuel.winnerId === currentUser.uid;
          } else if (updatedDuel.opponentScore > updatedDuel.challengerScore) {
            updatedDuel.winnerId = updatedDuel.opponentId;
            isWin = updatedDuel.winnerId === currentUser.uid;
          } else {
            updatedDuel.winnerId = 'draw';
          }

          // Reward winner
          if (updatedDuel.winnerId === currentUser.uid) {
            const isBoostActive = user.activeXpBoostUntil && new Date(user.activeXpBoostUntil) > new Date();
            const xpToAdd = isBoostActive ? 400 : 200;
            await updateProfile({ 
              coins: user.coins + 100,
              xp: user.xp + xpToAdd
            });
            audio.play('levelUp');
            // Update stats for duel win
            await updateStats('Duel', xpToAdd, accuracy, timeSpent, true, true);
          } else if (updatedDuel.winnerId !== 'draw') {
            // Update stats for duel loss
            await updateStats('Duel', 0, accuracy, timeSpent, true, false);
          }
        }

        await setDoc(doc(db, 'duels', activeDuel.id), cleanObject(updatedDuel), { merge: true });
        setActiveDuel(null);
        setView('duels');
        return;
      }

      if (success && selectedLesson) {
        audio.play('success');
        audio.haptic(50);

        // XP Calculation Logic
        const userLevelIndex = SCHOOL_LEVEL_ORDER.indexOf(user.schoolLevel);
        const lessonLevelIndex = SCHOOL_LEVEL_ORDER.indexOf(selectedLesson.level);
        
        let xpPerCorrectAnswer = 20; // Base XP per correct answer
        
        // If lesson level is lower than user level, divide by 30
        if (lessonLevelIndex < userLevelIndex) {
          xpPerCorrectAnswer = xpPerCorrectAnswer / 30;
        }

        // Handle repetition penalty
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const attempts = user.lessonAttempts || {};
        const lessonAttempt = attempts[selectedLesson.id] || { count: 0, lastAttempt: '' };
        
        let attemptCount = lessonAttempt.lastAttempt === today ? lessonAttempt.count : 0;
        const penaltyMultiplier = Math.max(0.1, 1 - (attemptCount * 0.1)); // -10% each time, min 10%
        
        const baseXP = Math.round(score * xpPerCorrectAnswer * penaltyMultiplier);
        
        // Apply XP Boost
        const isBoostActive = user.activeXpBoostUntil && new Date(user.activeXpBoostUntil) > new Date();
        const finalXP = isBoostActive ? baseXP * 2 : baseXP;

        const newXp = user.xp + finalXP;
        const newLevel = Math.floor(newXp / 200) + 1;
        const newCompleted = [...user.completedLessons, selectedLesson.id];
        
        // Update attempts
        const updatedAttempts = {
          ...attempts,
          [selectedLesson.id]: {
            count: attemptCount + 1,
            lastAttempt: today
          }
        };

        // Update daily quests
        const updatedQuests = (user.dailyQuests || []).map(quest => {
          if (quest.id === 'lessons_3' && !quest.completed) {
            const newProgress = quest.progress + 1;
            return {
              ...quest,
              progress: newProgress,
              completed: newProgress >= quest.target
            };
          }
          return quest;
        });

        const updates = {
          xp: newXp,
          level: newLevel,
          completedLessons: newCompleted,
          dailyQuests: updatedQuests,
          lessonAttempts: updatedAttempts
        };

        await updateProfile(updates);
        // Update Stats
        await updateStats(selectedLesson.category, finalXP, accuracy, timeSpent);
        setShowGem(true);
      } else {
        setView('home');
      }
    }
  };

  const handleClaimQuest = async (questId: string) => {
    if (!currentUser) return;

    const quest = user.dailyQuests?.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    const updatedQuests = user.dailyQuests?.map(q => 
      q.id === questId ? { ...q, claimed: true } : q
    );

    await updateProfile({
      coins: user.coins + quest.reward,
      dailyQuests: updatedQuests
    });
  };

  const handleGemOpen = async (reward: Reward) => {
    if (!currentUser) return;

    audio.play('levelUp');
    audio.haptic([100, 50, 100]);

    const updates: Partial<UserState> = {
      inventory: [...user.inventory, reward],
      gems: user.gems + (reward.gems || 0),
      coins: user.coins + (reward.coins || 0)
    };

    if (reward.type === 'gem') updates.gems = (updates.gems || 0) + (reward.value || 0);
    if (reward.type === 'coin') updates.coins = (updates.coins || 0) + (reward.value || 0);
    if (reward.type === 'theme' && reward.themeId) updates.activeTheme = reward.themeId;
    if (reward.type === 'streak_freeze') updates.streakFreezeCount = (user.streakFreezeCount || 0) + (reward.value || 1);
    if (reward.type === 'xp_boost' && reward.value) {
      const now = new Date();
      const until = new Date(now.getTime() + reward.value * 60000);
      updates.activeXpBoostUntil = until.toISOString();
    }

    await updateProfile(updates);
    setShowGem(false);
    setView('home');
  };

  const handlePurchase = async (item: any) => {
    if (!currentUser) return;
    
    const updates: Partial<UserState> = {};
    if (item.price !== undefined) {
      if (item.currency === 'coins') {
        updates.coins = (user.coins || 0) - item.price;
      } else {
        updates.gems = (user.gems || 0) - item.price;
      }
    }

    if (item.id === 'streak_freeze') {
      updates.streakFreezeCount = (user.streakFreezeCount || 0) + 1;
    } else if (item.id === 'mystery_gem') {
      setShowGem(true);
    } else if (item.id === 'aura_rainbow') {
      const newReward: Reward = {
        id: 'aura-rainbow-' + Date.now(),
        type: 'aura',
        name: 'Aura Arc-en-ciel',
        rarity: 'Legendary'
      };
      updates.inventory = [...(user.inventory || []), newReward];
    } else if (item.type === 'theme') {
      updates.activeTheme = item.themeId;
      const newReward: Reward = {
        id: 'theme-' + item.themeId,
        type: 'theme',
        name: item.name,
        rarity: 'Epic'
      };
      // Check if already in inventory
      const hasTheme = user.inventory?.some(r => r.id === newReward.id);
      if (!hasTheme) {
        updates.inventory = [...(user.inventory || []), newReward];
      }
    }

    await updateProfile(updates);
    audio.play('success');
    audio.haptic([50, 30, 50]);
  };

  const handleDuelChallenge = async (opponentId: string) => {
    if (!currentUser) return;
    const opponent = allUsers.find(u => u.id === opponentId);
    if (!opponent) return;

    const newDuel: Omit<Duel, 'id'> = {
      challengerId: currentUser.uid,
      challengerName: user.name || 'Joueur',
      opponentId: opponentId,
      opponentName: opponent.name || 'Adversaire',
      status: 'voting',
      votingEndsAt: new Date(Date.now() + 15000).toISOString(),
      mode: Math.random() > 0.5 ? 'speed' : 'accuracy',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'duels'), newDuel);
      audio.play('success');
      setView('duels');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'duels');
    }
  };

  const updateProfile = async (updates: Partial<UserState>) => {
    if (!currentUser) {
      const updatedUser = {
        ...user,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('anglix_guest_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return;
    }
    
    // Clean updates: Firestore doesn't support 'undefined'.
    const sanitizedUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        sanitizedUpdates[key] = deleteField();
      } else {
        sanitizedUpdates[key] = value;
      }
    });

    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...sanitizedUpdates,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const resetAccount = async () => {
    if (currentUser) {
      try {
        // Delete the document from Firestore for a true reset
        const userDocRef = doc(db, 'users', currentUser.uid);
        // Instead of deleting (which might break rules if not careful), 
        // we overwrite with initial state to keep the UID mapping
        await setDoc(userDocRef, {
          ...INITIAL_USER_STATE,
          uid: currentUser.uid,
          lastUpdated: new Date().toISOString()
        });
        setUser(INITIAL_USER_STATE);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    } else {
      localStorage.removeItem('anglix_guest_user');
      localStorage.removeItem('anglix_guest_stats');
      localStorage.removeItem('anglix_guest_backpack');
      setUser(INITIAL_USER_STATE);
    }
    window.location.reload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedFiles(prev => [...prev, {
        name: file.name,
        type: file.type,
        data: base64String
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#FF6321] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Star className="text-white" size={48} />
        </motion.div>
      </div>
    );
  }



  if (isLessonsLoading) {
    return (
      <div className="min-h-screen bg-[#FF6321] flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block mb-4">
            <Star className="text-white" size={48} />
          </motion.div>
          <p className="text-white font-black uppercase italic tracking-widest">Chargement des leçons...</p>
        </div>
      </div>
    );
  }

  if (!user.name) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-black selection:text-white transition-colors duration-500 ${user.activeTheme ? `theme-${user.activeTheme}` : ''} bg-app-bg text-text-main flex flex-col lg:flex-row pb-28 lg:pb-0`}>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-72 fixed left-0 top-0 bottom-0 bg-white border-r-4 border-black z-40 p-6 select-none justify-between shadow-[4px_0_0_rgba(0,0,0,1)]">
        <div className="space-y-8">
          {/* Logo / Brand */}
          <div 
            onClick={() => { audio.play('click'); setView('home'); }}
            className="flex items-center gap-3 cursor-pointer group mt-2"
          >
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-[3px_3px_0_rgba(0,0,0,1)] group-hover:scale-105 transition-transform border-2 border-black">
              <Star className="fill-white w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none group-hover:text-blue-600 transition-colors">
                Anglix<span className="text-blue-600">.</span>
              </h1>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">STARTUP EDITION</span>
            </div>
          </div>

          {/* User Level Profile Card */}
          <div className="p-4 bg-gray-50 border-2 border-black rounded-3xl shadow-[4px_4px_0_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black italic text-sm border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm truncate uppercase italic tracking-tight">{user.name}</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{user.schoolLevel}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span>Niveau {user.level}</span>
                <span className="text-gray-400">{user.xp % 100} / 100 XP</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full border-2 border-black overflow-hidden relative">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${user.xp % 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {[
              { id: 'home', label: 'Accueil', icon: <Home className="w-5 h-5" /> },
              { id: 'inventory', label: 'Sac à dos', icon: <Package className="w-5 h-5" /> },
              { id: 'duels', label: 'Mode Duel', icon: <Swords className="w-5 h-5" /> },
              { id: 'leaderboard', label: 'Classement', icon: <Users className="w-5 h-5" /> },
              { id: 'profile', label: 'Profil joueur', icon: <UserIcon className="w-5 h-5" />, action: () => setViewingPlayerId(null) },
              { id: 'shop', label: 'Boutique', icon: <ShoppingBag className="w-5 h-5" /> },
              { id: 'settings', label: 'Réglages', icon: <SettingsIcon className="w-5 h-5" /> },
            ].map((item) => {
              const isActive = view === item.id && (item.id !== 'profile' || !viewingPlayerId);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    audio.play('click');
                    if (item.action) item.action();
                    setView(item.id as any);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all font-black uppercase italic text-xs tracking-wide ${isActive ? 'bg-black text-white border-black translate-x-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-gray-50 border-transparent hover:border-black text-gray-500 hover:text-black'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => { audio.play('click'); setView('admin'); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all font-black uppercase italic text-xs tracking-wide ${view === 'admin' ? 'bg-red-600 text-white border-black translate-x-1 shadow-[2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-red-50 border-transparent hover:border-red-600 text-red-500'}`}
              >
                <Shield className="w-5 h-5" />
                <span>Administration</span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer info or streak */}
        <div className="pt-4 border-t-2 border-black/5 space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 border-2 border-orange-200 rounded-2xl">
            <div className="flex items-center gap-2">
              <Flame className="text-orange-500 fill-orange-500 w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-900">Série de Jours</span>
            </div>
            <span className="text-sm font-black italic text-orange-600">{user.streak} Jours</span>
          </div>
          {currentUser ? (
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 border-2 border-gray-300 hover:border-red-600 rounded-xl transition-all font-black uppercase italic text-[10px] tracking-wider"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          ) : (
            <button 
              onClick={async () => {
                audio.play('success');
                try {
                  await loginWithGoogle();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white border-2 border-black rounded-xl transition-all font-black uppercase italic text-[10px] tracking-wider shadow-[2px_2px_0_rgba(0,0,0,1)] hover:scale-105 active:scale-95 duration-100"
            >
              <LogIn size={14} /> Se connecter
            </button>
          )}
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 lg:pl-72 min-h-screen flex flex-col relative w-full">
        {/* Top Header Commbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b-4 border-black px-4 md:px-8 py-3 flex items-center select-none shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
            {/* Mobile Brand */}
            <div 
              onClick={() => { audio.play('click'); setView('home'); }}
              className="flex lg:hidden items-center gap-2 cursor-pointer group"
            >
              <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white border border-black shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
                <Star className="fill-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter">
                Anglix<span className="text-blue-600">.</span>
              </h1>
            </div>

            {/* Desktop Page Context Info */}
            <div className="hidden lg:flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Tableau de Bord</span>
              <h2 className="text-base font-black uppercase italic text-black leading-tight tracking-tight mt-1">
                {view === 'home' ? 'Découverte & Révisions' : view === 'inventory' ? 'Mon Sac à Dos' : view === 'duels' ? 'Mode Duels' : view === 'leaderboard' ? 'Classement Général' : view === 'profile' ? 'Profil Joueur' : view === 'shop' ? 'Boutique' : view === 'settings' ? 'Réglages' : 'Administration'}
              </h2>
            </div>

            {/* Global Stats Dashboard widgets */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
              {/* Streak Tracker (Shown in top bar on Mobile only) */}
              <div className="flex lg:hidden items-center gap-1.5 bg-orange-50 border-2 border-black px-3 py-1.5 rounded-2xl h-10 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <Flame className="text-orange-500 fill-orange-500 w-4 h-4 animate-bounce" />
                <span className="font-black text-xs italic text-orange-600">{user.streak}</span>
              </div>

              {/* Currencies */}
              <div className="flex items-center gap-1.5 md:gap-3 bg-gray-50 px-2.5 py-1.5 rounded-2xl border-2 border-black h-10 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <div className="flex items-center gap-1 px-1">
                  <Coins size={14} className="text-yellow-500" />
                  <span className="font-black text-xs md:text-sm">{user.coins}</span>
                </div>
                <div className="w-px h-4 bg-black/10" />
                <div className="flex items-center gap-1 px-1 mr-0.5">
                  <Gem size={14} className="text-blue-500 animate-pulse" />
                  <span className="font-black text-xs md:text-sm">{user.gems}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { audio.play('click'); setShowStats(true); }}
                  className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-2xl border-2 border-black transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_rgba(0,0,0,1)]"
                  title="Statistiques de progression"
                >
                  <TrendingUp className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { audio.play('click'); setView('settings'); }}
                  className={`w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-black transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_rgba(0,0,0,1)] ${view === 'settings' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                  title="Réglages"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Hero Section */}
              <div className="relative overflow-hidden bg-black text-white rounded-[40px] p-8 md:p-16 border-8 border-black shadow-[0_16px_0_rgba(0,0,0,1)]">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles size={300} className="rotate-12" />
                </div>
                
                <div className="relative z-10 max-w-3xl">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="inline-block px-4 py-1 bg-yellow-400 text-black text-xs font-black uppercase rounded-full mb-6 italic tracking-widest">
                      Propulsé par l'IA • Anglix v2.0
                    </span>
                    <h2 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.85] tracking-tighter mb-8 drop-shadow-[0_4px_0_rgba(255,255,255,0.2)]">
                      Tes cours <br /> en fiches <br /> <span className="text-yellow-400 underline decoration-8 underline-offset-8">stylées</span>.
                    </h2>
                  </motion.div>

                    <div className="relative group max-w-xl">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-yellow-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Sujet ou scanne ton cours..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-24 py-5 md:py-7 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-black rounded-[32px] border-4 border-white/20 focus:border-yellow-400 text-xl md:text-2xl font-bold transition-all placeholder:text-gray-500 outline-none"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
                        <input 
                          type="file" 
                          id="course-upload" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          multiple
                        />
                        <input 
                          type="file" 
                          id="course-camera" 
                          className="hidden" 
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileChange}
                        />
                        
                        <label 
                          htmlFor="course-upload"
                          className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-2xl border-2 border-white/20 transition-all cursor-pointer hidden md:flex"
                          title="Ajouter un document (PDF/Image)"
                        >
                          <Paperclip size={20} />
                        </label>
                        
                        <label 
                          htmlFor="course-camera"
                          className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-2xl border-2 border-white/20 transition-all cursor-pointer flex"
                          title="Prendre une photo"
                        >
                          <Camera size={20} />
                        </label>

                        {(searchQuery || selectedFiles.length > 0) && (
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => setShowGenOptions(!showGenOptions)}
                              className={`p-3 rounded-2xl border-2 border-white/20 transition-all ${showGenOptions ? 'bg-yellow-400 text-black border-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                              title="Options de génération"
                            >
                              <SettingsIcon size={20} />
                            </button>
                            <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              onClick={handleGenerateLesson}
                              disabled={isGeneratingLesson}
                              className="px-4 md:px-6 py-3 bg-yellow-400 text-black rounded-2xl font-black uppercase italic text-xs md:text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {isGeneratingLesson ? '...' : 'Générer'}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Files Preview */}
                    <AnimatePresence>
                      {selectedFiles.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 flex flex-wrap gap-2"
                        >
                          {selectedFiles.map((f, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-xs font-black uppercase italic"
                            >
                              {f.type.includes('pdf') ? <FileText size={14} /> : <Camera size={14} />}
                              <span className="max-w-[100px] truncate">{f.name}</span>
                              <button 
                                onClick={() => removeFile(idx)}
                                className="p-1 hover:bg-black/20 rounded-full transition-colors"
                              >
                                <XIcon size={14} />
                              </button>
                            </motion.div>
                          ))}
                          <label 
                            htmlFor="course-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-2xl border-2 border-black border-dashed hover:bg-gray-50 transition-all cursor-pointer text-xs font-black uppercase italic"
                          >
                            <Paperclip size={14} /> + Ajouter
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showGenOptions && (searchQuery || selectedFiles.length > 0) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4 p-6 bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-wrap gap-4 items-center"
                        >
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Niveau précis (Optionnel)</label>
                            <input 
                              type="text"
                              placeholder="ex: 6ème, CM2..."
                              value={genLevel}
                              onChange={(e) => setGenLevel(e.target.value)}
                              className="px-4 py-2 bg-gray-50 border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-3 h-full pt-5">
                            <input 
                              type="checkbox"
                              id="userIncludeVideo"
                              checked={genIncludeVideo}
                              onChange={(e) => setGenIncludeVideo(e.target.checked)}
                              className="w-5 h-5 accent-yellow-400 border-2 border-black"
                            />
                            <label htmlFor="userIncludeVideo" className="font-black uppercase italic text-xs cursor-pointer">Inclure Vidéo ?</label>
                          </div>
                          <div className="flex-1" />
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px]">
                            Laisse vide pour utiliser ton niveau actuel ({user.schoolLevel}).
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  
                  <div className="mt-8 flex flex-wrap gap-6 text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      1,240 élèves en ligne
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-yellow-400" />
                      Génération instantanée
                    </div>
                    <div className="flex items-center gap-2">
                      <Printer size={14} className="text-blue-400" />
                      Prêt pour l'impression
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                {/* Left Column: Lessons */}
                <div className="md:col-span-8 space-y-6 md:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
                      <BookOpen className="text-blue-600" /> 
                      {searchQuery ? 'Résultats' : 'Tes Leçons'}
                    </h3>
                    {!searchQuery && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {['Tous', 'Maths', 'Français', 'Histoire'].map(cat => (
                          <button key={cat} className="px-4 py-1.5 bg-white border-2 border-black rounded-xl text-[10px] font-black uppercase hover:bg-gray-50 whitespace-nowrap">
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredLessons.map((lesson, idx) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -8, rotate: idx % 2 === 0 ? 1 : -1 }}
                        onClick={() => handleStartLesson(lesson)}
                        className="bg-white p-6 rounded-[32px] border-4 border-black shadow-[0_8px_0_rgba(0,0,0,1)] cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BookOpen size={80} />
                        </div>
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex flex-col gap-1">
                            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-lg w-fit">
                              {lesson.category}
                            </span>
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              {lesson.level}
                            </span>
                          </div>
                          {user.completedLessons.includes(lesson.id) && (
                            <div className="bg-yellow-400 p-2 rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                              <Trophy size={16} className="text-black" />
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-2xl font-black uppercase italic mb-6 group-hover:text-blue-600 transition-colors leading-none tracking-tighter">
                          {lesson.title}
                        </h3>
                        
                        <div className="flex items-center justify-between pt-4 border-t-2 border-black border-dashed">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                            <Zap size={12} className="text-yellow-500" /> 50 Questions
                          </div>
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {filteredLessons.length === 0 && searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-full py-16 flex flex-col items-center text-center bg-yellow-50 rounded-[40px] border-8 border-black border-dashed"
                      >
                        <div className="w-24 h-24 bg-white rounded-3xl border-4 border-black flex items-center justify-center mb-6 shadow-[8px_8px_0_rgba(0,0,0,1)]">
                          <Sparkles size={48} className="text-yellow-500" />
                        </div>
                        <h3 className="text-3xl font-black uppercase italic mb-4">Sujet inconnu ?</h3>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-8 max-w-md px-6">
                          Laisse l'IA créer une fiche complète sur <span className="text-black underline decoration-4 decoration-yellow-400">"{searchQuery}"</span> pour toi !
                        </p>
                        <button
                          onClick={handleGenerateLesson}
                          disabled={isGeneratingLesson}
                          className="group relative px-12 py-6 bg-black text-white rounded-[32px] font-black text-xl uppercase italic tracking-widest flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_12px_0_rgba(0,0,0,0.3)]"
                        >
                          {isGeneratingLesson ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            <>
                              <Sparkles size={24} className="group-hover:rotate-12 transition-transform" /> 
                              Créer la Fiche
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Right Column: Sidebar Bento */}
                <div className="md:col-span-4 space-y-8">
                  {/* Big Duel Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('duels')}
                    className="w-full bg-gradient-to-br from-red-600 to-purple-700 rounded-[40px] border-8 border-black p-8 shadow-[0_16px_0_rgba(0,0,0,1)] group relative overflow-hidden text-left"
                  >
                    <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform">
                      <Swords size={160} className="text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border-2 border-white/30">
                          <Swords size={24} className="text-white" />
                        </div>
                        <span className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-full border-2 border-black">
                          NOUVEAU
                        </span>
                      </div>
                      <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                        MODE <br /> DUEL
                      </h4>
                      <p className="text-white/80 font-bold text-xs uppercase tracking-widest">
                        Défie le monde entier 🌍
                      </p>
                    </div>
                  </motion.button>

                  {/* Quests Card */}
                  <div className="bg-white rounded-[40px] border-8 border-black p-6 shadow-[0_16px_0_rgba(0,0,0,1)]">
                    <Quests 
                      quests={user.dailyQuests || []} 
                      onClaim={handleClaimQuest} 
                    />
                  </div>

                  {/* Streak Card */}
                  <div className="bg-orange-500 text-white rounded-[40px] border-8 border-black p-8 shadow-[0_16px_0_rgba(0,0,0,1)] relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-20 rotate-12">
                      <Flame size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Flame className="text-yellow-300 fill-yellow-300" size={32} />
                        <h4 className="text-2xl font-black uppercase italic tracking-tight">Série de {user.streak} jours</h4>
                      </div>
                      <p className="font-bold text-sm uppercase mb-6 opacity-90">Ne lâche rien ! Demain, tu gagnes un bonus de +50 XP.</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <div key={d} className={`flex-1 h-3 rounded-full border-2 border-black ${d <= (user.streak % 7 || 7) ? 'bg-yellow-300' : 'bg-white/20'}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="bg-white rounded-[40px] border-8 border-black p-8 shadow-[0_16px_0_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Ton Niveau</span>
                        <h4 className="text-4xl font-black uppercase italic tracking-tighter">Lvl {Math.floor(user.xp / 100) + 1}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Prochain Niveau</span>
                        <span className="font-black text-sm italic">{(Math.floor(user.xp / 100) + 1) * 100 - user.xp} XP restant</span>
                      </div>
                    </div>
                    <div className="w-full h-6 bg-gray-100 rounded-full border-4 border-black overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${user.xp % 100}%` }}
                        className="h-full bg-blue-600 border-r-4 border-black"
                      />
                    </div>
                  </div>

                  {/* Trending Section */}
                  <div className="bg-yellow-400 rounded-[40px] border-8 border-black p-8 shadow-[0_16px_0_rgba(0,0,0,1)]">
                    <h4 className="text-2xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-2">
                      <Zap size={24} /> Tendance
                    </h4>
                    <div className="space-y-4">
                      {[
                        { title: 'Les Volcans', users: 420 },
                        { title: 'Théorème de Pythagore', users: 312 },
                        { title: 'Révolution Française', users: 285 }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-2xl border-2 border-black">
                          <span className="font-black uppercase italic text-xs truncate mr-2">{item.title}</span>
                          <span className="text-[10px] font-black text-gray-600 shrink-0">{item.users} 🔥</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shop Preview */}
                  <div className="bg-purple-600 text-white rounded-[40px] border-8 border-black p-8 shadow-[0_16px_0_rgba(0,0,0,1)] group cursor-pointer" onClick={() => setView('shop')}>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-2xl font-black uppercase italic tracking-tight">Boutique</h4>
                      <ShoppingBag size={24} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="aspect-square bg-white/10 rounded-2xl border-2 border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Zap size={32} className="text-yellow-300" />
                      </div>
                      <div className="aspect-square bg-white/10 rounded-2xl border-2 border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform delay-75">
                        <Gem size={32} className="text-blue-300" />
                      </div>
                    </div>
                    <button className="w-full py-3 bg-white text-black rounded-2xl font-black uppercase italic text-sm shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                      Dépenser mes 🪙
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'lesson' && selectedLesson && (
            <LessonView 
              lesson={selectedLesson} 
              onContinue={handleLessonComplete} 
              onBack={() => setView('home')}
              onFlashcards={() => setView('flashcards')}
            />
          )}

          {view === 'flashcards' && selectedLesson && (
            <FlashcardsView 
              lesson={selectedLesson} 
              onBack={() => setView('lesson')}
            />
          )}

          {view === 'quiz' && selectedLesson && (
            <QuizView 
              lesson={selectedLesson} 
              user={user}
              onComplete={handleQuizComplete} 
            />
          )}

          {view === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Leaderboard 
                entries={leaderboardData} 
                activeType={leaderboardType}
                onTypeChange={setLeaderboardType}
                onPlayerClick={handleViewPlayer} 
                onDuelChallenge={handleDuelChallenge}
              />
            </motion.div>
          )}

          {view === 'duels' && (
            <Duels 
              user={user}
              lessons={customLessons}
              onClose={() => setView('home')}
              updateProfile={updateProfile}
              updateStats={updateStats}
            />
          )}

          {view === 'profile' && (
            <Profile 
              user={viewingPlayer || { ...user, id: currentUser?.uid }} 
              onUpdateProfile={viewingPlayer ? () => {} : updateProfile} 
              isOwnProfile={!viewingPlayer}
              onDuel={handleDuelChallenge}
              onBack={() => {
                setViewingPlayerId(null);
                setView('leaderboard');
              }}
            />
          )}

          {view === 'settings' && (
            <Settings 
              user={user}
              onUpdateTheme={(theme) => updateProfile({ activeTheme: theme })}
              onReset={resetAccount} 
            />
          )}

          {view === 'admin' && isAdmin && (
            <AdminPanel 
              users={allUsers}
              lessons={customLessons}
              onUpdateLesson={handleUpdateLesson}
              onDeleteUser={handleDeleteUser}
              onDeleteLesson={handleDeleteLesson}
              onUpdateQuests={() => {}}
            />
          )}

          {view === 'shop' && (
            <Shop user={user} onPurchase={handlePurchase} />
          )}

          {view === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Backpack 
                savedLessons={savedLessons}
                onRemove={handleRemoveFromBackpack}
                onPlay={(lessonId) => {
                  const lesson = customLessons.find(l => l.id === lessonId);
                  if (lesson) handleStartLesson(lesson);
                }}
                onClose={() => setView('home')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Lesson Selection Modal */}
      <AnimatePresence>
        {showLessonModal && selectedLesson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLessonModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative bg-white rounded-[32px] md:rounded-[40px] border-4 border-black p-6 md:p-12 max-w-xl w-full shadow-[0_12px_12px_rgba(0,0,0,0.15)] md:shadow-[0_24px_24px_rgba(0,0,0,0.15)] z-[101]"
            >
              <div className="text-center mb-6 md:mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-2xl md:rounded-3xl border-2 border-black flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <BookOpen className="text-blue-600 w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-2">{selectedLesson.title}</h3>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-sm">Prêt pour le défi ?</p>
              </div>

              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <button 
                  onClick={() => handleConfirmLesson(true, skipLessonPrompt)}
                  className="w-full py-4 md:py-6 bg-blue-600 text-white rounded-2xl md:rounded-3xl border-2 border-black font-black text-lg md:text-xl uppercase italic tracking-widest flex items-center justify-center gap-3 md:gap-4 hover:bg-blue-700 transition-all shadow-[0_4px_0_rgba(0,0,0,0.3)] md:shadow-[0_8px_0_rgba(0,0,0,0.3)]"
                >
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6" /> Voir la leçon
                </button>
                <button 
                  onClick={() => handleConfirmLesson(false, skipLessonPrompt)}
                  className="w-full py-4 md:py-6 bg-black text-white rounded-2xl md:rounded-3xl border-2 border-black font-black text-lg md:text-xl uppercase italic tracking-widest flex items-center justify-center gap-3 md:gap-4 hover:bg-gray-800 transition-all shadow-[0_4px_0_rgba(0,0,0,0.3)] md:shadow-[0_8px_0_rgba(0,0,0,0.3)]"
                >
                  <Zap className="w-5 h-5 md:w-6 md:h-6" /> Lancer le Quiz
                </button>
                <button 
                  onClick={() => {
                    handleSaveToBackpack(selectedLesson);
                    setShowLessonModal(false);
                  }}
                  className="w-full py-3 md:py-4 bg-purple-100 text-purple-700 rounded-2xl border-2 border-black font-black text-xs md:text-sm uppercase italic tracking-widest flex items-center justify-center gap-2 hover:bg-purple-200 transition-all"
                >
                  <Package className="w-4 h-4" /> Ajouter au sac à dos
                </button>
              </div>

              <label className="flex items-center justify-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={skipLessonPrompt}
                    onChange={(e) => setSkipLessonPrompt(e.target.checked)}
                  />
                  <div className={`w-8 h-8 rounded-lg border-4 border-black transition-colors ${skipLessonPrompt ? 'bg-green-500' : 'bg-white group-hover:bg-gray-100'}`}>
                    {skipLessonPrompt && <Star size={16} className="text-white fill-white m-auto mt-0.5" />}
                  </div>
                </div>
                <span className="font-black uppercase italic text-sm tracking-tight">Ne plus afficher pour ce quiz</span>
              </label>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div> {/* Closes the flex-1 lg:pl-72 container */}


      {/* Floating Premium Mobile Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border-4 border-black p-2 flex lg:hidden items-center justify-around shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-[24px]">
        {[
          { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'inventory', label: 'Sac', icon: <Package className="w-5 h-5" /> },
          { id: 'duels', label: 'Duels', icon: <Swords className="w-5 h-5 text-red-500" /> },
          { id: 'leaderboard', label: 'Top', icon: <Users className="w-5 h-5" /> },
          { id: 'profile', label: 'Profil', icon: <UserIcon className="w-5 h-5" />, action: () => setViewingPlayerId(null) },
        ].map((item) => {
          const isActive = view === item.id && (item.id !== 'profile' || !viewingPlayerId);
          return (
            <button 
              key={item.id}
              onClick={() => { 
                audio.play('click'); 
                if (item.action) item.action();
                setView(item.id as any); 
              }}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all flex-1 ${isActive ? 'bg-black text-white scale-105 shadow-[2px_2px_0_rgba(0,0,0,0.15)] border-2 border-black font-black' : 'text-gray-400 hover:text-black font-bold'}`}
            >
              {item.icon}
              <span className="text-[9px] uppercase tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Knowledge Gem Overlay */}
      <AnimatePresence>
        {isGeneratingLesson && <AIGenerationOverlay />}
      </AnimatePresence>
      <AnimatePresence>
        {showGem && (
          <KnowledgeGem 
            onOpen={handleGemOpen} 
            onClose={() => setShowGem(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

