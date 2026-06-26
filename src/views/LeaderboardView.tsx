import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Trophy, Award, CheckCircle, Flame, ShieldAlert } from 'lucide-react';

export default function LeaderboardView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('xp', 'desc'), limit(15));
      const snap = await getDocs(q);

      const loadedUsers: UserProfile[] = [];
      snap.forEach((doc) => {
        loadedUsers.push(doc.data() as UserProfile);
      });

      // If database is currently empty (new user setup), load beautiful mock candidates so leaderboard is never blank or unengaging!
      if (loadedUsers.length === 0) {
        setUsers([
          { uid: '1', displayName: 'Aarav Sharma', email: 'aarav@gmail.com', xp: 580, badges: ['First Responder', 'Truth Teller', 'Problem Solver', 'Ward Guardian'], reportsCount: 12, verificationsCount: 22, resolvedCount: 8, ward: 'Koramangala', joinedAt: '' },
          { uid: '2', displayName: 'Ananya Iyer', email: 'ananya@gmail.com', xp: 420, badges: ['First Responder', 'Truth Teller', 'Streak Hero'], reportsCount: 9, verificationsCount: 15, resolvedCount: 5, ward: 'Indiranagar', joinedAt: '' },
          { uid: '3', displayName: 'Kabir Mehta', email: 'kabir@gmail.com', xp: 350, badges: ['First Responder', 'Truth Teller'], reportsCount: 6, verificationsCount: 11, resolvedCount: 4, ward: 'Whitefield', joinedAt: '' },
          { uid: '4', displayName: 'Riya Patel', email: 'riya@gmail.com', xp: 210, badges: ['First Responder'], reportsCount: 4, verificationsCount: 6, resolvedCount: 1, ward: 'Central', joinedAt: '' },
          { uid: '5', displayName: 'Vikram Singh', email: 'vikram@gmail.com', xp: 130, badges: ['First Responder'], reportsCount: 3, verificationsCount: 3, resolvedCount: 0, ward: 'HSR Layout', joinedAt: '' },
        ]);
      } else {
        setUsers(loadedUsers);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const getPodiumStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          card: 'bg-amber-50/50 border-amber-200 ring-2 ring-amber-400 ring-offset-2',
          medal: 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-100',
          textColor: 'text-amber-800',
          podiumHeight: 'h-40',
        };
      case 2:
        return {
          card: 'bg-slate-50 border-slate-200',
          medal: 'bg-slate-400 text-white border-slate-500 shadow-md shadow-slate-100',
          textColor: 'text-slate-800',
          podiumHeight: 'h-32',
        };
      case 3:
      default:
        return {
          card: 'bg-orange-50/40 border-orange-200',
          medal: 'bg-amber-700 text-white border-amber-800 shadow-md shadow-amber-100',
          textColor: 'text-amber-900',
          podiumHeight: 'h-24',
        };
    }
  };

  const topThree = users.slice(0, 3);
  const remaining = users.slice(3);

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-150 rounded-xl">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Ranking civic guardians...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      
      {/* Visual podium for top 3 guardians */}
      {topThree.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-center font-extrabold text-slate-900 text-lg flex items-center justify-center gap-1.5">
            <Trophy className="w-5.5 h-5.5 text-amber-500" /> Hyperlocal Hall of Fame
          </h2>
          
          <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-4">
            
            {/* 2nd Place Medalist */}
            {topThree[1] && (
              <div className="w-full md:w-56 text-center space-y-2 order-2 md:order-1">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-lg font-black text-slate-700 shadow-inner">
                    {topThree[1].displayName[0]}
                  </div>
                  <span className={`absolute -bottom-1 right-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-black bg-slate-400 text-white border-slate-500`}>2</span>
                </div>
                <div className={`p-4 rounded-xl border bg-white shadow-sm space-y-1`}>
                  <h4 className="font-bold text-slate-900 text-sm truncate">{topThree[1].displayName}</h4>
                  <p className="text-xs text-indigo-600 font-bold font-mono">{topThree[1].xp} XP</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{topThree[1].badges.length} Badges</p>
                </div>
              </div>
            )}

            {/* 1st Place Golden Medalist */}
            {topThree[0] && (
              <div className="w-full md:w-64 text-center space-y-2 order-1 md:order-2">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-400 flex items-center justify-center text-2xl font-black text-amber-700 shadow-md shadow-amber-100 ring-2 ring-white">
                    {topThree[0].displayName[0]}
                  </div>
                  <span className={`absolute -bottom-1.5 right-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-black bg-amber-500 text-white border-amber-600 animate-bounce`}>1</span>
                </div>
                <div className={`p-5 rounded-2xl border bg-amber-50/50 border-amber-200 ring-2 ring-amber-400 shadow-md space-y-1 relative`}>
                  <h4 className="font-extrabold text-slate-900 text-base truncate">{topThree[0].displayName}</h4>
                  <p className="text-sm text-indigo-600 font-extrabold font-mono">{topThree[0].xp} XP</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{topThree[0].badges.length} Badges • {topThree[0].reportsCount} Filed</p>
                </div>
              </div>
            )}

            {/* 3rd Place Bronze Medalist */}
            {topThree[2] && (
              <div className="w-full md:w-56 text-center space-y-2 order-3">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-300 flex items-center justify-center text-lg font-black text-orange-700 shadow-inner">
                    {topThree[2].displayName[0]}
                  </div>
                  <span className={`absolute -bottom-1 right-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-black bg-amber-700 text-white border-amber-800`}>3</span>
                </div>
                <div className={`p-4 rounded-xl border bg-white shadow-sm space-y-1`}>
                  <h4 className="font-bold text-slate-900 text-sm truncate">{topThree[2].displayName}</h4>
                  <p className="text-xs text-indigo-600 font-bold font-mono">{topThree[2].xp} XP</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{topThree[2].badges.length} Badges</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Roster of ranks from 4th place down */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Rank & Citizen</span>
          <div className="flex gap-12 mr-4">
            <span>Ward</span>
            <span>Reports</span>
            <span>Verifications</span>
            <span>XP</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {remaining.length === 0 ? (
            <p className="p-6 text-xs text-center text-slate-400 italic">No remaining rank contenders. Keep reporting to scale up rankings!</p>
          ) : (
            remaining.map((user, index) => (
              <div key={user.uid} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150">
                <div className="flex items-center gap-4">
                  <span className="w-6 font-mono text-xs font-bold text-slate-400">#{index + 4}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-600">
                    {user.displayName[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{user.displayName}</h5>
                    <p className="text-[10px] text-slate-400">{user.badges.slice(0, 2).join(', ')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12 text-xs text-slate-600 mr-4 font-medium">
                  <span className="w-16 truncate text-right capitalize">{user.ward || 'Central'}</span>
                  <span className="w-8 text-center">{user.reportsCount}</span>
                  <span className="w-8 text-center">{user.verificationsCount}</span>
                  <span className="w-12 text-right font-bold text-indigo-600 font-mono">{user.xp} XP</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
