import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWeightLogs, logWeight } from '../services/firestoreService';
import { awardXP } from '../services/gamificationService';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, Scale, Plus, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Progress = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Gamification State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [xpGained, setXpGained] = useState(0);

  const fetchLogs = async () => {
    if (!user) return;
    const logs = await getWeightLogs(user.uid);
    setWeightLogs(logs || []);
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWeight) return;
    
    await logWeight(user.uid, date, parseFloat(newWeight));
    setNewWeight('');
    fetchLogs();

    // Award XP for logging weight (e.g., 5 XP)
    const result = await awardXP(user, profile, 5, date);
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
      }
    }
  };

  const chartData = weightLogs.map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    weight: log.weight
  }));

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : (profile?.weight || 0);
  const weightChange = (profile?.weight || 0) - currentWeight;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground font-bold tracking-tight">Progress</h1>
          <p className="text-muted-foreground mt-1">Track your weight journey</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Scale size={20} /></div>
            <h3 className="font-semibold text-foreground">Current Weight</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-foreground font-bold">{currentWeight}</span>
            <span className="text-muted-foreground mb-1">kg</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg text-primary"><TrendingDown size={20} /></div>
            <h3 className="font-semibold text-foreground">Total Change</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-light text-foreground font-bold">{Math.abs(weightChange).toFixed(1)}</span>
            <span className="text-muted-foreground mb-1">kg {weightChange > 0 ? 'lost' : 'gained'}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Log Weight</h3>
          <form onSubmit={handleLogWeight} className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="e.g. 70.5"
              className="w-full p-2.5 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
            />
            <button 
              type="submit" 
              disabled={!newWeight}
              className="bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white p-2.5 rounded-xl hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-colors"
            >
              <Plus size={20} />
            </button>
          </form>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-2 p-2.5 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none text-sm text-muted-foreground"
          />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/80 backdrop-blur-md lovable-gradient-card p-6 rounded-2xl shadow-sm border border-border/50 h-96">
        <h3 className="font-semibold text-foreground font-semibold mb-6">Weight Trend</h3>
        {weightLogs.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
              <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#ea580c', fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground/70">
            Log your weight to see the trend.
          </div>
        )}
      </motion.div>

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
