
export type RewardType = 'xp_boost' | 'skin' | 'achievement' | 'trophy' | 'aura' | 'profile_name' | 'gem' | 'coin' | 'theme' | 'streak_freeze';

export type AppTheme = 'default' | 'dark' | 'cyberpunk' | 'nature' | 'gold' | 'ocean';

export type SchoolLevel = 'Primaire' | 'Collège' | 'Lycée' | 'Supérieur';

export interface Reward {
  id: string;
  type: RewardType;
  name: string;
  rarity: 'Common' | 'Rare' | 'Super Rare' | 'Epic' | 'Mythic' | 'Legendary';
  value?: number;
  coins?: number;
  gems?: number;
  icon?: string;
  themeId?: AppTheme;
}

export type QuestionType = 'qcm' | 'fill_in_the_blank' | 'true_false' | 'calculation' | 'open_ended';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType;
  options?: string[];
  correctAnswer: number | string;
  explanation?: string;
  diagram?: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  explanation: string;
  questions: Question[];
  level: SchoolLevel;
  difficulty: 1 | 2 | 3;
  imageUrl?: string;
  imageSearchTerm?: string;
  youtubeId?: string;
  youtubeSearchQuery?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

export interface UserState {
  name: string;
  schoolLevel: SchoolLevel;
  xp: number;
  level: number;
  coins: number;
  gems: number;
  inventory: Reward[];
  completedLessons: string[];
  activeAura?: string;
  activeTitle?: string;
  activeSkin?: string;
  dailyQuests?: Quest[];
  lastQuestReset?: string;
  skipLessonIds?: string[];
  streak: number;
  lastActiveDate?: string;
  streakFreezeCount: number;
  activeTheme?: AppTheme;
  activeXpBoostUntil?: string;
  lessonAttempts?: Record<string, { count: number, lastAttempt: string }>;
}

export interface Duel {
  id: string;
  challengerId: string;
  challengerName: string;
  opponentId?: string;
  opponentName?: string;
  lessonId?: string;
  lessonTitle?: string;
  status: 'searching' | 'voting' | 'playing' | 'completed' | 'cancelled';
  challengerVote?: string;
  opponentVote?: string;
  challengerScore?: number;
  opponentScore?: number;
  challengerErrors?: number;
  opponentErrors?: number;
  winnerId?: string;
  mode?: 'speed' | 'accuracy';
  createdAt: string;
  startTime?: string;
  votingEndsAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  level: number;
  activeTitle?: string;
  isCurrentUser?: boolean;
}

export interface UserStats {
  userId: string;
  totalQuizzes: number;
  totalDuels: number;
  duelWins: number;
  duelLosses: number;
  xpPerCategory: Record<string, number>;
  accuracyPerCategory: Record<string, number>;
  bestStreak: number;
  totalTimeSpent: number;
  lastUpdated: string;
}

export interface SavedLesson {
  userId: string;
  lessonId: string;
  title: string;
  category: string;
  savedAt: string;
}

export type LeaderboardType = 'daily' | 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardPeriodEntry {
  userId: string;
  userName: string;
  xp: number;
  period: string;
  type: LeaderboardType;
}
