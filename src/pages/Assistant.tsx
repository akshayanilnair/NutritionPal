import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFoodLogsByDate } from '../services/firestoreService';
import { chatWithAssistant } from '../services/geminiService';
import { awardXP } from '../services/gamificationService';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { Send, Bot, User as UserIcon, Loader2, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

export const Assistant = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm NutritionPal, your AI nutrition assistant. How can I help you with your diet today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gamification State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [xpGained, setXpGained] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !profile) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayLogs = await getFoodLogsByDate(user.uid, today) || [];
      
      const response = await chatWithAssistant(profile, todayLogs, userMessage, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Award XP for asking a question (e.g., 5 XP)
      const result = await awardXP(user, profile, 5, format(new Date(), 'yyyy-MM-dd'));
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
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="mb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Ask about your diet, recipes, or nutrition advice</p>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-card/80 backdrop-blur-md lovable-gradient-card rounded-3xl shadow-sm border border-border/50 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <UserIcon size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white rounded-tr-none' 
                  : 'bg-background/40 backdrop-blur-sm text-foreground font-semibold rounded-tl-none border border-border/50'
              }`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-orange max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-muted-foreground text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-card/80 backdrop-blur-md lovable-gradient-card border-t border-border/50">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your diet..."
              className="w-full pl-4 pr-14 py-4 bg-background/40 backdrop-blur-sm border border-border rounded-2xl focus:ring-2 focus:ring-ring outline-none"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-2 bottom-2 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white p-3 rounded-xl hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
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
