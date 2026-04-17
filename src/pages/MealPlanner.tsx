import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMealPlan, saveMealPlan, saveUserProfile } from '../services/firestoreService';
import { generateMealPlan } from '../services/geminiService';
import { awardXP } from '../services/gamificationService';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { Calendar, Loader2, Sparkles, RefreshCw, Settings2, X, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MealPlanner = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [plan, setPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    calories: 2000,
    diet: 'veg',
    cuisine: 'Any Indian',
    healthIssues: [] as string[],
    dislikedFoods: ''
  });

  // Gamification State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [xpGained, setXpGained] = useState(0);

  const healthOptions = ['Diabetes', 'High Cholesterol', 'High Blood Pressure', 'PCOS', 'Thyroid', 'Uric Acid'];

  useEffect(() => {
    if (profile) {
      setPrefs({
        calories: profile.dailyCalorieTarget || 2000,
        diet: profile.dietaryPreference || 'veg',
        cuisine: profile.cuisinePreferences?.[0] || 'Any Indian',
        healthIssues: profile.healthIssues || [],
        dislikedFoods: profile.dislikes || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      setIsLoading(true);
      const existingPlan = await getMealPlan(user.uid, date);
      if (existingPlan) {
        setPlan(JSON.parse(existingPlan.plan));
      } else {
        setPlan(null);
      }
      setIsLoading(false);
    };
    fetchPlan();
  }, [user, date]);

  const handleGenerateClick = () => {
    setShowPrefs(true);
  };

  const handleConfirmGenerate = async () => {
    if (!user || !profile) return;
    setIsGenerating(true);
    setShowPrefs(false);
    try {
      // Optionally save health issues and dislikes back to profile if they changed
      if (
        JSON.stringify(prefs.healthIssues) !== JSON.stringify(profile.healthIssues) ||
        prefs.dislikedFoods !== profile.dislikes
      ) {
        await saveUserProfile(user.uid, { 
          ...profile, 
          healthIssues: prefs.healthIssues,
          dislikes: prefs.dislikedFoods
        });
      }

      const newPlan = await generateMealPlan(profile, date, prefs);
      await saveMealPlan(user.uid, date, JSON.stringify(newPlan));
      setPlan(newPlan);

      // Award XP for generating a meal plan (e.g., 20 XP)
      const result = await awardXP(user, profile, 20, format(new Date(), 'yyyy-MM-dd'));
      if (result) {
        await refreshProfile();
        setXpGained(result.xpGained);
        if (result.leveledUp) {
          setNewLevel(result.newLevel);
          setShowLevelUp(true);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#fdba74', '#fcd34d']
          });
        } else {
          confetti({
            particleCount: 30,
            spread: 40,
            origin: { y: 0.8 },
            colors: ['#f97316']
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate plan", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleHealthIssue = (issue: string) => {
    setPrefs(prev => ({
      ...prev,
      healthIssues: prev.healthIssues.includes(issue)
        ? prev.healthIssues.filter(i => i !== issue)
        : [...prev.healthIssues, issue]
    }));
  };

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground font-bold tracking-tight">AI Meal Planner</h1>
          <p className="text-muted-foreground mt-1">Personalized Indian diet plans</p>
        </div>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="p-2.5 bg-card/80 backdrop-blur-md lovable-gradient-card border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-ring outline-none font-medium text-foreground"
        />
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : !plan ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-12 rounded-3xl shadow-sm border border-border/50 text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground font-semibold mb-4">No plan for {format(new Date(date), 'MMMM d')}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Let our AI generate a personalized Indian meal plan based on your goals, diet, and health conditions.
          </p>
          <button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white px-8 py-4 rounded-xl font-medium hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-all mx-auto shadow-lg shadow-spice active:scale-95"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {isGenerating ? 'Generating Plan...' : 'Generate AI Meal Plan'}
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Target Calories</p>
                <p className="text-2xl font-bold text-foreground font-bold">{plan.totalCalories} kcal</p>
              </div>
              <div className="h-10 w-px bg-muted-foreground/20 hidden sm:block"></div>
              <div className="flex gap-4 text-sm font-medium">
                <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">P: {plan.totalProtein}g</div>
                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg">C: {plan.totalCarbs}g</div>
                <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">F: {plan.totalFat}g</div>
              </div>
            </div>
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan.meals.map((meal: any, idx: number) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50 hover:border-primary/30 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-foreground font-semibold capitalize flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
                      {idx + 1}
                    </span>
                    {meal.mealType}
                  </h3>
                  <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm">
                    {meal.calories} kcal
                  </span>
                </div>
                
                <h4 className="font-semibold text-foreground font-bold text-xl mb-2">{meal.foodName}</h4>
                <p className="text-muted-foreground text-sm mb-4">{meal.portionSize}</p>
                
                <div className="bg-background/40 backdrop-blur-sm p-4 rounded-xl mb-4 border border-border/50">
                  <p className="text-sm text-foreground italic mb-2">"{meal.recipeHint}"</p>
                  {meal.recipeInstructions && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">How to prepare:</p>
                      <p className="text-sm text-foreground">{meal.recipeInstructions}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Protein: {meal.protein}g</span>
                  <span>Carbs: {meal.carbs}g</span>
                  <span>Fat: {meal.fat}g</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showPrefs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card/80 backdrop-blur-md lovable-gradient-card rounded-3xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-foreground font-semibold flex items-center gap-2">
                  <Settings2 size={24} className="text-primary" />
                  Plan Preferences
                </h3>
                <button onClick={() => setShowPrefs(false)} className="text-muted-foreground/70 hover:text-muted-foreground">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Target Calories (kcal)</label>
                  <input
                    type="number"
                    value={prefs.calories}
                    onChange={(e) => setPrefs({...prefs, calories: Number(e.target.value)})}
                    className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Defaulted to your BMI-based target.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Dietary Preference</label>
                  <select
                    value={prefs.diet}
                    onChange={(e) => setPrefs({...prefs, diet: e.target.value})}
                    className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="jain">Jain</option>
                    <option value="halal">Halal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Cuisine Preference</label>
                  <select
                    value={prefs.cuisine}
                    onChange={(e) => setPrefs({...prefs, cuisine: e.target.value})}
                    className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                  >
                    <option value="Any Indian">Any Indian</option>
                    <option value="North Indian">North Indian</option>
                    <option value="South Indian">South Indian</option>
                    <option value="East Indian">East Indian</option>
                    <option value="West Indian">West Indian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Health Conditions (Avoids triggers)</label>
                  <div className="flex flex-wrap gap-2">
                    {healthOptions.map(issue => (
                      <button
                        key={issue}
                        onClick={() => toggleHealthIssue(issue)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          prefs.healthIssues.includes(issue)
                            ? 'bg-primary/20 border-primary/30 text-primary-foreground text-opacity-80'
                            : 'bg-card/80 backdrop-blur-md lovable-gradient-card border-border text-muted-foreground hover:bg-background/40 backdrop-blur-sm'
                        }`}
                      >
                        {issue}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Foods I Don't Like (Allergies/Dislikes)</label>
                  <input
                    type="text"
                    value={prefs.dislikedFoods}
                    onChange={(e) => setPrefs({...prefs, dislikedFoods: e.target.value})}
                    placeholder="e.g., mushrooms, peanuts, brinjal"
                    className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-background/40 backdrop-blur-sm border-t border-border/50 flex justify-end gap-3">
                <button
                  onClick={() => setShowPrefs(false)}
                  className="px-5 py-2.5 text-muted-foreground font-medium hover:bg-muted-foreground/20 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmGenerate}
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white font-medium rounded-xl hover:scale-[1.02] transition-transform text-white transition-colors flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Generate Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-card/80 backdrop-blur-md lovable-gradient-card rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 lovable-gradient-spice shadow-spice opacity-20"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 lovable-gradient-spice shadow-spice rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-spice border-4 border-white">
                  <Trophy size={40} className="text-white" />
                </div>
                
                <h2 className="text-3xl font-black text-foreground font-bold mb-2 tracking-tight">Level Up!</h2>
                <p className="text-muted-foreground mb-6 font-medium">You've reached Level {newLevel}</p>
                
                <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-border/50 flex items-center justify-center gap-2">
                  <Star className="text-amber-400 fill-amber-400" size={20} />
                  <span className="font-bold text-foreground font-semibold">+{xpGained} XP Earned</span>
                </div>
                
                <button
                  onClick={() => setShowLevelUp(false)}
                  className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20 active:scale-95"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
