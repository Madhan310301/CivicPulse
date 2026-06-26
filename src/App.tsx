import React, { useState, useEffect } from 'react';
import { auth, db, loginWithGoogle, logoutUser } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';
import LandingView from './views/LandingView';
import FeedView from './views/FeedView';
import IssueDetailView from './views/IssueDetailView';
import DashboardView from './views/DashboardView';
import LeaderboardView from './views/LeaderboardView';
import ReportForm from './components/ReportForm';
import GamificationBar from './components/GamificationBar';
import { Sparkles, Trophy, Map, LayoutDashboard, PlusCircle, LogOut, LogIn, Activity } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Intercept URL Query parameters for Deep-linking shared issues
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('issueId');
    if (sharedId) {
      setSelectedIssueId(sharedId);
      setCurrentView('issue-detail');
    }

    // 2. Setup real-time Firebase Auth state observer
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      if (firebaseUser) {
        // Fetch user profile from Firestore and set up real-time listener
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Profile doesn't exist yet, it will be initialized during their first report/verification
            setProfile({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Citizen Hero',
              email: firebaseUser.email || '',
              xp: 0,
              badges: [],
              reportsCount: 0,
              verificationsCount: 0,
              resolvedCount: 0,
              ward: 'Central',
              joinedAt: new Date().toISOString(),
            });
          }
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const loggedUser = await loginWithGoogle();
      setUser(loggedUser);
      setCurrentView('feed');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
      setCurrentView('home');
    } catch (err) {
      console.error(err);
    }
  };

  const navigateToIssue = (id: string) => {
    // Update browser URL query param quietly without hard-refreshing
    const newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?issueId=${id}`;
    window.history.pushState({ path: newurl }, '', newurl);
    
    setSelectedIssueId(id);
    setCurrentView('issue-detail');
  };

  const navigateBackToFeed = () => {
    // Clear URL query param quietly
    const newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.pushState({ path: newurl }, '', newurl);

    setSelectedIssueId(null);
    setCurrentView('feed');
  };

  // View Router dispatcher
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <LandingView onNavigate={setCurrentView} user={user} onLoginSuccess={setUser} />;
      case 'feed':
        return <FeedView onNavigateToIssue={navigateToIssue} />;
      case 'report':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-slate-900">File a Hyperlocal Report</h1>
              <p className="text-xs text-slate-500">File broken streetlights, road hazards, or potholes. AI auto-triages in real-time.</p>
            </div>
            <ReportForm onSuccess={navigateToIssue} onNavigateToIssue={navigateToIssue} />
          </div>
        );
      case 'dashboard':
        return <DashboardView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'issue-detail':
        return selectedIssueId ? (
          <IssueDetailView
            issueId={selectedIssueId}
            onBack={navigateBackToFeed}
            onNavigateToIssue={navigateToIssue}
          />
        ) : (
          <FeedView onNavigateToIssue={navigateToIssue} />
        );
      default:
        return <LandingView onNavigate={setCurrentView} user={user} onLoginSuccess={setUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      
      {/* Visual Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Civic<span className="text-blue-600">Pulse</span>
            </span>
          </div>

          {/* Nav menu links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'feed', label: 'Map Feed', icon: Map },
              { id: 'report', label: 'Report Issue', icon: PlusCircle, requiresAuth: true },
              { id: 'dashboard', label: 'Govt Analytics', icon: LayoutDashboard },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id || (link.id === 'feed' && currentView === 'issue-detail');
              const disabled = link.requiresAuth && !user;

              return (
                <button
                  key={link.id}
                  disabled={disabled}
                  onClick={() => setCurrentView(link.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right auth menu triggers */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3.5">
                {profile && (
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-extrabold text-slate-800">{profile.displayName}</span>
                    <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.2 rounded self-end">
                      {profile.xp} XP
                    </span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-100 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Login with Google
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Primary Layout Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Pane */}
          <div className={`col-span-1 ${profile && currentView !== 'home' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
            {renderView()}
          </div>

          {/* Gamification Sidebar HUD */}
          {profile && currentView !== 'home' && (
            <aside className="col-span-1 lg:col-span-4 space-y-6">
              <GamificationBar xp={profile.xp} badges={profile.badges} />
              
              <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-extrabold text-sm tracking-tight">Hackathon Bonus Tips</h4>
                </div>
                <p className="text-[11px] leading-relaxed font-normal">
                  You can test government mechanics directly inside ticket detail screens! Simulating ticket updates triggers additional XP boosts for the reporting citizen dynamically.
                </p>
              </div>
            </aside>
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-150 py-6 bg-white text-center text-xs text-slate-400 font-medium mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} CivicPulse. All rights reserved.</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Sandbox Active
          </span>
        </div>
      </footer>

    </div>
  );
}
