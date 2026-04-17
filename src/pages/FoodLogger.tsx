import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logFood, getFoodLogsByDate, deleteFoodLog } from '../services/firestoreService';
import { searchFoodDatabase, getRecommendedFoods, analyzeRecipe } from '../services/geminiService';
import { awardXP } from '../services/gamificationService';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { Search, Plus, Trash2, Loader2, UtensilsCrossed, Sparkles, ChefHat, X, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FoodLogger = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState('breakfast');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  const [recommendedFoods, setRecommendedFoods] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Recipe Calculator State
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeText, setRecipeText] = useState('');
  const [analyzedRecipe, setAnalyzedRecipe] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Gamification State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [xpGained, setXpGained] = useState(0);

  const fetchLogs = async () => {
    if (!user) return;
    setIsLoadingLogs(true);
    const fetchedLogs = await getFoodLogsByDate(user.uid, date);
    setLogs(fetchedLogs || []);
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [user, date]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!profile) return;
      setIsLoadingRecommendations(true);
      const recs = await getRecommendedFoods(
        profile.dietaryPreference || 'any', 
        mealType, 
        profile.healthIssues || [],
        profile.cuisinePreferences?.[0] || 'Any Indian'
      );
      setRecommendedFoods(recs);
      setIsLoadingRecommendations(false);
    };

    if (!query.trim()) {
      fetchRecommendations();
    }
  }, [mealType, profile, query]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    const results = await searchFoodDatabase(query, profile?.dietaryPreference || 'any');
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleLogFood = async (food: any) => {
    if (!user) return;
    
    const logData = {
      ...food,
      date,
      mealType
    };
    
    await logFood(logData);
    setQuery('');
    setSearchResults([]);
    fetchLogs();

    // Award XP for logging food (e.g., 10 XP)
    const result = await awardXP(user, profile, 10, date);
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
        // Just show a small toast or confetti for XP
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#f97316']
        });
      }
    }
  };

  const handleAnalyzeRecipe = async () => {
    if (!recipeText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeRecipe(recipeText);
      setAnalyzedRecipe(result);
    } catch (error) {
      console.error("Failed to analyze recipe", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogAnalyzedRecipe = async () => {
    if (!analyzedRecipe) return;
    
    const foodItem = {
      foodName: analyzedRecipe.recipeName,
      portionSize: analyzedRecipe.servingSize,
      calories: analyzedRecipe.perServingNutrition.calories,
      protein: analyzedRecipe.perServingNutrition.protein,
      carbs: analyzedRecipe.perServingNutrition.carbs,
      fat: analyzedRecipe.perServingNutrition.fat,
    };
    
    await handleLogFood(foodItem);
    setShowRecipeModal(false);
    setRecipeText('');
    setAnalyzedRecipe(null);
  };

  const handleDelete = async (id: string) => {
    await deleteFoodLog(id);
    fetchLogs();
  };

  const meals = ['breakfast', 'lunch', 'snack', 'dinner'];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground font-bold tracking-tight">Log Food</h1>
          <p className="text-muted-foreground mt-1">Track your daily Indian meals</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecipeModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/20 text-primary rounded-xl font-medium hover:bg-primary/30 transition-colors"
          >
            <ChefHat size={18} />
            <span className="hidden sm:inline">Recipe Calculator</span>
          </button>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="p-2.5 bg-card/80 backdrop-blur-md lovable-gradient-card border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-ring outline-none font-medium text-foreground"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <h2 className="text-lg font-semibold text-foreground font-semibold mb-4">Add Food</h2>
          
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {meals.map(meal => (
              <button
                key={meal}
                onClick={() => setMealType(meal)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                  mealType === meal 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                }`}
              >
                {meal}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="relative mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === '') setSearchResults([]);
              }}
              placeholder="Search Indian food (e.g., 2 Roti and Dal)"
              className="w-full pl-11 pr-4 py-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
            />
            <Search className="absolute left-4 top-3.5 text-muted-foreground/70" size={20} />
            <button 
              type="submit" 
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-2 bottom-2 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white px-4 rounded-lg text-sm font-medium hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-colors"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {query.trim() && searchResults.length > 0 && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 sticky top-0 bg-card/80 backdrop-blur-md lovable-gradient-card py-2 z-10">Search Results</h3>
              {searchResults.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-primary/30 transition-colors bg-background/40 backdrop-blur-sm/50">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground font-semibold">{item.foodName}</h4>
                    <p className="text-sm text-muted-foreground">{item.portionSize} • {item.calories} kcal</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground/70">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fat}g</span>
                    </div>
                    {item.recipeInstructions && (
                      <div className="mt-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-md lovable-gradient-card p-2 rounded-lg border border-border/50">
                        <span className="font-semibold block mb-1">Recipe:</span>
                        {item.recipeInstructions}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleLogFood(item)}
                    className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="space-y-3 mt-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2 sticky top-0 bg-card/80 backdrop-blur-md lovable-gradient-card py-2 z-10">
                <Sparkles size={16} className="text-primary" />
                Recommended for {mealType}
              </h3>
              
              {isLoadingRecommendations ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
              ) : recommendedFoods.length > 0 ? (
                recommendedFoods.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-primary/30 transition-colors bg-background/40 backdrop-blur-sm/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground font-semibold">{item.foodName}</h4>
                      <p className="text-sm text-muted-foreground">{item.portionSize} • {item.calories} kcal</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground/70">
                        <span>P: {item.protein}g</span>
                        <span>C: {item.carbs}g</span>
                        <span>F: {item.fat}g</span>
                      </div>
                      {item.recipeInstructions && (
                        <div className="mt-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-md lovable-gradient-card p-2 rounded-lg border border-border/50">
                          <span className="font-semibold block mb-1">Recipe:</span>
                          {item.recipeInstructions}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleLogFood(item)}
                      className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No recommendations available.</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Logs Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <h2 className="text-lg font-semibold text-foreground font-semibold mb-6 flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-muted-foreground/70" />
            Today's Log
          </h2>

          {isLoadingLogs ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground/70" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No food logged for this date yet.</p>
              <p className="text-sm mt-1">Search and add items to see them here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {meals.map(meal => {
                const mealLogs = logs.filter(l => l.mealType === meal);
                if (mealLogs.length === 0) return null;
                
                const mealCalories = mealLogs.reduce((sum, l) => sum + l.calories, 0);

                return (
                  <div key={meal}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-foreground capitalize">{meal}</h3>
                      <span className="text-sm font-semibold text-muted-foreground">{mealCalories} kcal</span>
                    </div>
                    <div className="space-y-2">
                      {mealLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-background/40 backdrop-blur-sm rounded-xl border border-border/50">
                          <div>
                            <p className="font-medium text-foreground font-semibold text-sm">{log.foodName}</p>
                            <p className="text-xs text-muted-foreground">{log.portionSize} • {log.calories} kcal</p>
                          </div>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recipe Calculator Modal */}
      <AnimatePresence>
        {showRecipeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card/80 backdrop-blur-md lovable-gradient-card rounded-3xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-foreground font-semibold flex items-center gap-2">
                  <ChefHat size={24} className="text-primary" />
                  Recipe Calculator
                </h3>
                <button 
                  onClick={() => {
                    setShowRecipeModal(false);
                    setAnalyzedRecipe(null);
                    setRecipeText('');
                  }} 
                  className="text-muted-foreground/70 hover:text-muted-foreground"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {!analyzedRecipe ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your recipe ingredients and quantities. We'll calculate the total nutrition and suggest a standard serving size (like 1 katori).
                    </p>
                    <textarea
                      value={recipeText}
                      onChange={(e) => setRecipeText(e.target.value)}
                      placeholder="e.g., 200g paneer, 2 tbsp oil, 100g onions, 50g tomatoes, 1 tsp turmeric..."
                      className="w-full p-4 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none min-h-[150px] resize-none"
                    />
                    <button
                      onClick={handleAnalyzeRecipe}
                      disabled={isAnalyzing || !recipeText.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white px-4 py-3 rounded-xl font-medium hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-colors"
                    >
                      {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                      {isAnalyzing ? 'Analyzing Recipe...' : 'Analyze Recipe'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-foreground font-semibold mb-1">{analyzedRecipe.recipeName}</h4>
                      <p className="text-sm text-primary font-medium bg-primary/10 inline-block px-3 py-1 rounded-full">
                        Suggested Serving: {analyzedRecipe.servingSize}
                      </p>
                    </div>

                    <div className="bg-background/40 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
                      <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Per Serving Nutrition</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card/80 backdrop-blur-md lovable-gradient-card p-3 rounded-xl shadow-sm">
                          <p className="text-xs text-muted-foreground mb-1">Calories</p>
                          <p className="text-lg font-bold text-foreground font-semibold">{analyzedRecipe.perServingNutrition.calories} kcal</p>
                        </div>
                        <div className="bg-card/80 backdrop-blur-md lovable-gradient-card p-3 rounded-xl shadow-sm">
                          <p className="text-xs text-muted-foreground mb-1">Protein</p>
                          <p className="text-lg font-bold text-foreground font-semibold">{analyzedRecipe.perServingNutrition.protein}g</p>
                        </div>
                        <div className="bg-card/80 backdrop-blur-md lovable-gradient-card p-3 rounded-xl shadow-sm">
                          <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                          <p className="text-lg font-bold text-foreground font-semibold">{analyzedRecipe.perServingNutrition.carbs}g</p>
                        </div>
                        <div className="bg-card/80 backdrop-blur-md lovable-gradient-card p-3 rounded-xl shadow-sm">
                          <p className="text-xs text-muted-foreground mb-1">Fat</p>
                          <p className="text-lg font-bold text-foreground font-semibold">{analyzedRecipe.perServingNutrition.fat}g</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background/40 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
                      <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Total Recipe Nutrition</h5>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Calories: {analyzedRecipe.totalNutrition.calories} kcal</span>
                        <span className="text-muted-foreground">Protein: {analyzedRecipe.totalNutrition.protein}g</span>
                        <span className="text-muted-foreground">Carbs: {analyzedRecipe.totalNutrition.carbs}g</span>
                        <span className="text-muted-foreground">Fat: {analyzedRecipe.totalNutrition.fat}g</span>
                      </div>
                    </div>

                    {analyzedRecipe.recipeInstructions && (
                      <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                        <h5 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">How to Prepare</h5>
                        <p className="text-sm text-primary-foreground text-opacity-80 whitespace-pre-line leading-relaxed">
                          {analyzedRecipe.recipeInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {analyzedRecipe && (
                <div className="p-6 bg-background/40 backdrop-blur-sm border-t border-border/50 flex justify-end gap-3">
                  <button
                    onClick={() => setAnalyzedRecipe(null)}
                    className="px-5 py-2.5 text-muted-foreground font-medium hover:bg-muted-foreground/20 rounded-xl transition-colors"
                  >
                    Edit Recipe
                  </button>
                  <button
                    onClick={handleLogAnalyzedRecipe}
                    className="px-5 py-2.5 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white font-medium rounded-xl hover:scale-[1.02] transition-transform text-white transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Log 1 Serving
                  </button>
                </div>
              )}
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
