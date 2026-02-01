import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ViewState, PRELOADER_URL } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Preload image in background to ensure browser cache
    const img = new Image();
    img.src = PRELOADER_URL;

    // Simulator loader progress
    // Adjusted speed: ~3-4 seconds to ensure image loads
    const timer = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Slower increment: 0.2 to 1.5 per tick (avg ~0.85)
        // 100 / 0.85 ~= 117 ticks * 30ms ~= 3.5 seconds
        const increment = Math.random() * 1.3 + 0.2;
        return Math.min(prev + increment, 100);
      });
    }, 30); // Faster tick rate for smoother animation, but smaller increments

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Small delay after 100% before showing login/dashboard
      const timeout = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentView('dashboard');
        }
        setLoading(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  const progressRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow effects - softer for white background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="z-10 flex flex-col items-center w-full max-w-sm">
          {/* Logo Image */}
          <div className="w-64 h-64 mb-12 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-30 animate-pulse"></div>
            <img
              src={PRELOADER_URL}
              alt="Loading..."
              className="w-full h-full object-contain drop-shadow-xl animate-float-slow"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Progress Bar Container - Adjusted for white background */}
          <div className="w-full h-1.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden relative">
            {/* Moving Shine Effect */}
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -translate-x-full animate-shimmer z-20"></div>

            {/* Progress Fill */}
            <div
              ref={progressRef}
              className="h-full bg-primary shadow-[0_0_12px_rgba(227,24,55,0.4)] transition-all duration-75 ease-out relative z-10"
            />
          </div>

          {/* Percentage Text */}
          <div className="mt-4 flex items-center justify-between w-full px-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Carregando Sistema</span>
            <span className="text-xs text-primary font-black">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 animate-fade-in">
      {currentView === 'login' ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;