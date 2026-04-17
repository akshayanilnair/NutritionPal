import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Utensils, Calendar, LineChart, MessageSquare, LogOut, Flame, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/food-logger', icon: Utensils, label: 'Log Food' },
    { path: '/meal-planner', icon: Calendar, label: 'Meal Plan' },
    { path: '/progress', icon: LineChart, label: 'Progress' },
    { path: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  ];

  const level = profile?.level || 1;
  const streak = profile?.streak || 0;

  return (
    <div className="flex h-screen bg-transparent text-foreground font-sans flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-card/80 backdrop-blur-md lovable-gradient-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg lovable-gradient-spice shadow-spice flex items-center justify-center text-white font-bold text-lg shadow-sm">
            N
          </div>
          <span className="text-lg font-serif italic font-bold tracking-tight text-foreground">NutritionPal</span>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold border border-amber-100">
              <Flame size={14} className="fill-amber-500" />
              {streak}
            </div>
          )}
          <button
            onClick={logout}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-card/80 backdrop-blur-md lovable-gradient-card border-r border-border p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl lovable-gradient-spice shadow-spice flex items-center justify-center text-white font-bold text-xl shadow-md shadow-spice">
            N
          </div>
          <span className="text-xl font-serif italic font-bold tracking-tight text-foreground">NutritionPal</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20/50' 
                    : 'text-muted-foreground hover:bg-background/40 backdrop-blur-sm hover:text-foreground font-bold'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-muted-foreground/70'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center justify-between px-2 mb-4 bg-background/40 backdrop-blur-sm rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full lovable-gradient-spice shadow-spice flex items-center justify-center shadow-inner border border-white">
                <span className="text-white font-bold text-xs">{level}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">Lvl {level}</span>
                <span className="text-[10px] text-muted-foreground font-medium">Nutritionist</span>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-amber-500 bg-card/80 backdrop-blur-md lovable-gradient-card px-2 py-1 rounded-lg text-xs font-bold shadow-sm border border-amber-100">
                <Flame size={14} className="fill-amber-500" />
                {streak}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground font-bold truncate">{profile?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut size={20} className="text-muted-foreground/70 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md lovable-gradient-card border-t border-border flex justify-around p-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 ${
                isActive ? 'text-primary' : 'text-muted-foreground/70'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
