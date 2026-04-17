import { saveUserProfile } from './firestoreService';
import { differenceInDays, format } from 'date-fns';

export const calculateLevel = (xp: number) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXpForNextLevel = (level: number) => {
  return Math.pow(level, 2) * 100;
};

export const getXpForCurrentLevel = (level: number) => {
  return Math.pow(level - 1, 2) * 100;
};

export const awardXP = async (user: any, profile: any, amount: number, actionDate: string) => {
  if (!user || !profile) return null;

  let currentXp = profile.xp || 0;
  let currentLevel = profile.level || 1;
  let currentStreak = profile.streak || 0;
  let lastActiveDate = profile.lastActiveDate || null;

  let leveledUp = false;
  let streakUpdated = false;

  // Streak calculation
  if (lastActiveDate) {
    const daysDiff = differenceInDays(new Date(actionDate), new Date(lastActiveDate));
    if (daysDiff === 1) {
      currentStreak += 1;
      streakUpdated = true;
    } else if (daysDiff > 1) {
      currentStreak = 1; // Reset streak
      streakUpdated = true;
    }
  } else {
    currentStreak = 1;
    streakUpdated = true;
  }

  // Add XP
  currentXp += amount;
  
  // Calculate new level
  const newLevel = calculateLevel(currentXp);
  if (newLevel > currentLevel) {
    leveledUp = true;
    currentLevel = newLevel;
  }

  const updatedProfile = {
    ...profile,
    xp: currentXp,
    level: currentLevel,
    streak: currentStreak,
    lastActiveDate: actionDate
  };

  await saveUserProfile(user.uid, updatedProfile);

  return {
    leveledUp,
    newLevel: currentLevel,
    xpGained: amount,
    streak: currentStreak,
    streakUpdated,
    updatedProfile
  };
};
