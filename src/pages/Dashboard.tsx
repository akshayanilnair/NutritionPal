import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFoodLogsByDate } from '../services/firestoreService';
import { getXpForNextLevel, getXpForCurrentLevel } from '../services/gamificationService';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Activity, Flame, Scale, Target, Trophy, Star } from 'lucide-react';

export const Dashboard = () => {
  const { profile, user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (user) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const logs = await getFoodLogsByDate(user.uid, today);
        setTodayLogs(logs || []);
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  if (!profile || loading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  const totalCalories = todayLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = todayLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const totalCarbs = todayLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const totalFat = todayLogs.reduce((sum, log) => sum + (log.fat || 0), 0);

  const remainingCalories = Math.max(0, profile.dailyCalorieTarget - totalCalories);
  const progressPercentage = Math.min(100, (totalCalories / profile.dailyCalorieTarget) * 100);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (bmi < 24.9) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };
    if (bmi < 29.9) return { label: 'Overweight', color: 'text-primary', bg: 'bg-primary/20' };
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const bmiInfo = getBMICategory(profile.bmi);

  // Gamification Data
  const level = profile.level || 1;
  const xp = profile.xp || 0;
  const streak = profile.streak || 0;
  const xpForNext = getXpForNextLevel(level);
  const xpForCurrent = getXpForCurrentLevel(level);
  const xpProgress = Math.min(100, ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100);

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground font-bold tracking-tight">Hello, {profile.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">Here's your nutrition overview for today.</p>
        </div>
        
        {/* Gamification Header Widget */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 bg-card/80 backdrop-blur-md lovable-gradient-card p-3 rounded-2xl shadow-sm border border-border/50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
            <Flame className="text-amber-500 fill-amber-500" size={20} />
            <span className="font-bold text-amber-700">{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 lovable-gradient-spice shadow-spice rounded-full flex items-center justify-center shadow-inner border-2 border-white">
              <span className="text-white font-bold text-sm">{level}</span>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
                <span>XP</span>
                <span>{xp} / {xpForNext}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BMI Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground"><Activity size={20} /></div>
            <h3 className="font-semibold text-foreground">Current BMI</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-foreground font-bold">{profile.bmi}</span>
          </div>
          <div className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${bmiInfo.bg} ${bmiInfo.color}`}>
            {bmiInfo.label}
          </div>
        </motion.div>

        {/* Weight Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground"><Scale size={20} /></div>
            <h3 className="font-semibold text-foreground">Weight</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-foreground font-bold">{profile.weight}</span>
            <span className="text-muted-foreground mb-1">kg</span>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Target: <span className="font-medium text-foreground">{profile.targetWeight} kg</span>
          </div>
        </motion.div>

        {/* Calories Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary"><Flame size={20} /></div>
              <h3 className="font-semibold text-foreground">Calories Today</h3>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{profile.dailyCalorieTarget} kcal target</span>
          </div>
          
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-light text-foreground font-bold">{totalCalories}</span>
            <span className="text-muted-foreground mb-1">/ {profile.dailyCalorieTarget} kcal</span>
          </div>

          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${progressPercentage > 100 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {remainingCalories > 0 ? `${remainingCalories} kcal remaining` : 'Target reached!'}
          </p>
        </motion.div>
      </div>

      {/* Macros Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
        <h3 className="font-semibold text-foreground font-semibold mb-6 flex items-center gap-2">
          <Target size={20} className="text-muted-foreground/70" />
          Macronutrients
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground font-medium">Protein</span>
              <span className="text-foreground font-bold">{totalProtein}g</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totalProtein / 150) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground font-medium">Carbs</span>
              <span className="text-foreground font-bold">{totalCarbs}g</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (totalCarbs / 300) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground font-medium">Fat</span>
              <span className="text-foreground font-bold">{totalFat}g</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (totalFat / 80) * 100)}%` }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
