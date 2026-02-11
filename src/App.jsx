import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { FixedExpenses } from './pages/FixedExpenses';
import { FixedIncome } from './pages/FixedIncome';
import { Investments } from './pages/Investments';
import { Goals } from './pages/Goals';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminUsers } from './pages/AdminUsers'; // Import Admin Page
import { LockScreen } from './components/LockScreen';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUsers, setHasUsers] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const exists = await api.checkUsersExist();
        setHasUsers(exists);

        // Restore session
        const savedSession = localStorage.getItem('user_session');
        if (savedSession) {
          setUser(JSON.parse(savedSession));
        }

        // Request notification permission
        await api.requestNotificationPermissions();
      } catch (e) {
        console.error("Auth check failed", e);
      }
      setLoading(false);
    };
    checkAuth();

    // Listen for window focus events (when restored from tray)
    const handleFocus = () => {
      if (user) {
        setIsLocked(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-emerald-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onLogin={setUser} />} />
          <Route path="*" element={<Navigate to={hasUsers ? "/login" : "/register"} replace />} />
        </Routes>
      ) : (
        <div className="flex bg-slate-950 h-screen w-full font-sans text-slate-50 selection:bg-emerald-500/30 selection:text-emerald-400 overflow-hidden animate-fade-in">
          {isLocked && <LockScreen user={user} onUnlock={() => setIsLocked(false)} />}
          <Sidebar user={user} onLogout={() => setUser(null)} />
          <main key={user.id} className="flex-1 overflow-auto relative custom-scrollbar bg-slate-950/50">
            {/* Background elements */}
            <div className="fixed top-0 left-64 w-full h-96 bg-emerald-500/5 blur-[120px] pointer-events-none -z-10 rounded-full"></div>
            <div className="fixed bottom-0 right-0 w-96 h-96 bg-violet-500/5 blur-[120px] pointer-events-none -z-10 rounded-full"></div>

            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/transactions" element={<Transactions user={user} />} />
              <Route path="/fixed-expenses" element={<FixedExpenses user={user} />} />
              <Route path="/fixed-income" element={<FixedIncome user={user} />} />
              <Route path="/investments" element={<Investments user={user} />} />
              <Route path="/goals" element={<Goals user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
              <Route path="/admin-users" element={user ? <AdminUsers user={user} /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </HashRouter>
  );
}

export default App;
