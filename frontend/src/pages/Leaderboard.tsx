import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Calendar, SquareStack, ArrowLeft, Zap, Globe, Sun, Moon, Settings as SettingsIcon, LogOut, Medal, ChevronDown } from 'lucide-react';
import api from '../api/axios';

export default function Leaderboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [communityData, setCommunityData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [loading, setLoading] = useState(true);
  
  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [matchesMap, setMatchesMap] = useState<Record<number, any[]>>({});
  
  const [viewMode, setViewMode] = useState<'month' | 'session'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [memRes, sessRes, userRes] = await Promise.all([
          api.get('/members'),
          api.get('/sessions'),
          api.get('/users/me')
        ]);
        setMembers(memRes.data);
        const sortedSessions = sessRes.data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSessions(sortedSessions);
        setCommunityData(userRes.data.community);
        if (sortedSessions.length > 0) setSelectedSessionId(sortedSessions[0].id);
      } catch (err) {
        console.error("Failed to load init data");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Dynamically fetch matches for required sessions
  useEffect(() => {
    const fetchMatches = async () => {
      const sessionsToFetch: number[] = [];
      
      if (viewMode === 'session' && selectedSessionId && !matchesMap[selectedSessionId]) {
        sessionsToFetch.push(selectedSessionId);
      } else if (viewMode === 'month' && selectedMonth) {
        const monthSessions = sessions.filter(s => s.date.startsWith(selectedMonth));
        monthSessions.forEach(s => { if (!matchesMap[s.id]) sessionsToFetch.push(s.id); });
      }

      if (sessionsToFetch.length === 0) return;

      try {
        const promises = sessionsToFetch.map(id => api.get(`/matches/${id}`));
        const results = await Promise.all(promises);
        
        setMatchesMap(prev => {
          const updated = { ...prev };
          results.forEach((res, i) => {
            updated[sessionsToFetch[i]] = res.data;
          });
          return updated;
        });
      } catch (err) {
        console.error("Failed to load match data");
      }
    };
    
    fetchMatches();
  }, [viewMode, selectedMonth, selectedSessionId, sessions, matchesMap]);

  // Aggregation & Tie-Breaker Algorithm
  const leaderboardData = useMemo(() => {
    let targetSessions = [];
    if (viewMode === 'session' && selectedSessionId) {
      targetSessions = sessions.filter(s => s.id === selectedSessionId);
    } else if (viewMode === 'month' && selectedMonth) {
      targetSessions = sessions.filter(s => s.date.startsWith(selectedMonth));
    }

    const playerStats: Record<number, any> = {};
    members.forEach(m => {
      playerStats[m.id] = { id: m.id, name: m.name, grade: m.skillLevel, played: 0, won: 0, lost: 0, netSets: 0, netPoints: 0, totalPoints: 0, lastWinTime: 0 };
    });

    targetSessions.forEach(session => {
      const matchLimit = session.matchLimit || 999; // Assume 999 if no limit set
      const maxSets = session.scoringSystem?.includes('3 Sets') ? 3 : session.customSets || 1;
      
      const sessionMatches = matchesMap[session.id] || [];
      const finished = sessionMatches.filter(m => m.status === 'finished').sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

      // Track limits per session
      const playerMatchCount: Record<number, number> = {};
      
      finished.forEach(match => {
        const pA1 = match.teamA_player1;
        const pA2 = match.teamA_player2;
        const pB1 = match.teamB_player1;
        const pB2 = match.teamB_player2;

        const isEligible = (pId: number | null) => {
          if (!pId) return false;
          if (!playerMatchCount[pId]) playerMatchCount[pId] = 0;
          if (playerMatchCount[pId] < matchLimit) {
            playerMatchCount[pId]++;
            return true;
          }
          return false;
        };

        const eA1 = isEligible(pA1);
        const eA2 = isEligible(pA2);
        const eB1 = isEligible(pB1);
        const eB2 = isEligible(pB2);

        // Compute Match Result
        let sa = 0, sb = 0;
        let setsA = 0, setsB = 0;
        for (let i=1; i<=maxSets; i++) {
          const s1 = match[`scoreTeamA_set${i}`] || 0;
          const s2 = match[`scoreTeamB_set${i}`] || 0;
          if (s1 > 0 || s2 > 0 || i === 1) {
            sa += s1; sb += s2;
            if (s1 > s2) setsA++;
            else if (s2 > s1) setsB++;
          }
        }
        
        const aWon = sa > sb;
        const bWon = sb > sa;
        const endTime = new Date(match.endedAt).getTime();

        const applyStats = (pId: number | null, isEligible: boolean, isTeamA: boolean) => {
          if (!pId || !isEligible) return;
          const p = playerStats[pId];
          p.played++;
          
          if ((isTeamA && aWon) || (!isTeamA && bWon)) {
            p.won++;
            p.lastWinTime = Math.max(p.lastWinTime, endTime); // Keep track of latest win for this aggregation
          } else if ((isTeamA && bWon) || (!isTeamA && aWon)) {
            p.lost++;
          }

          p.netSets += isTeamA ? (setsA - setsB) : (setsB - setsA);
          p.netPoints += isTeamA ? (sa - sb) : (sb - sa);
          p.totalPoints += isTeamA ? sa : sb;
        };

        applyStats(pA1, eA1, true);
        applyStats(pA2, eA2, true);
        applyStats(pB1, eB1, false);
        applyStats(pB2, eB2, false);
      });
    });

    // Final Sort: The Waterfall Tie-Breaker
    return Object.values(playerStats)
      .filter(p => p.played > 0)
      .map(p => ({ ...p, winRate: p.played > 0 ? (p.won / p.played) : 0 }))
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate; // 1. Win Rate %
        if (b.won !== a.won) return b.won - a.won;                 // 2. Total Wins
        if (b.netSets !== a.netSets) return b.netSets - a.netSets; // 3. Net Sets
        if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints; // 4. Net Points
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints; // 5. Total Offense
        return a.lastWinTime - b.lastWinTime; // 6. Chronological (First to reach wins wins tie-breaker)
      });
  }, [viewMode, selectedMonth, selectedSessionId, sessions, matchesMap, members]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      {/* Universal Top Navigation */}
      <nav className="h-16 border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center text-white shrink-0">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-slate-200 dark:border-[#1E293B] max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-semibold truncate hidden sm:block">{communityData?.name}</span>
            </div>
            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg transition-colors">
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors shrink-0">
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 sm:p-2.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-xl hover:bg-slate-100 dark:hover:bg-[#334155]/80 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl flex items-center justify-center">
               <Trophy size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('leaderboard', 'Leaderboard')}</h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 sm:p-6 rounded-2xl shadow-sm mb-8 flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl w-full sm:w-auto shrink-0">
             <button onClick={() => setViewMode('month')} className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'month' ? 'bg-white dark:bg-[#0F172A] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t('by_month', 'By Month')}
             </button>
             <button onClick={() => setViewMode('session')} className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === 'session' ? 'bg-white dark:bg-[#0F172A] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {t('by_session', 'By Session')}
             </button>
          </div>

          <div className="w-full sm:w-72">
             {viewMode === 'month' ? (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-colors [&::-webkit-calendar-picker-indicator]:dark:invert" />
                </div>
             ) : (
                <div className="relative">
                  <SquareStack className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select value={selectedSessionId || ''} onChange={e => setSelectedSessionId(parseInt(e.target.value))} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-colors appearance-none">
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({new Date(s.date).toLocaleDateString()})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
             )}
          </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-slate-500 font-medium">Loading rankings...</div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] text-xs uppercase text-slate-500 font-bold tracking-widest">
                  <tr>
                    <th className="p-5 w-16 text-center">{t('rank', 'Rank')}</th>
                    <th className="p-5">{t('player', 'Player')}</th>
                    <th className="p-5 text-center">{t('matches', 'Matches')}</th>
                    <th className="p-5 text-center">{t('w_l', 'W-L')}</th>
                    <th className="p-5 text-center">{t('win_rate', 'Win Rate')}</th>
                    <th className="p-5 text-center">{t('net_sets', 'Net Sets')}</th>
                    <th className="p-5 text-center">{t('net_pts', 'Net Pts')}</th>
                    <th className="p-5 text-center">{t('total_pts', 'Total Pts')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {leaderboardData.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-slate-500 font-medium">No matches found for this selection.</td></tr>
                  ) : (
                    leaderboardData.map((player, index) => {
                      const rank = index + 1;
                      let rankBadge = <span className="font-mono font-black text-slate-400">{rank}</span>;
                      if (rank === 1) rankBadge = <div className="w-8 h-8 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;
                      if (rank === 2) rankBadge = <div className="w-8 h-8 mx-auto bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;
                      if (rank === 3) rankBadge = <div className="w-8 h-8 mx-auto bg-orange-100 text-orange-700 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;

                      return (
                        <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/30 transition-colors">
                          <td className="p-5 text-center">{rankBadge}</td>
                          <td className="p-5">
                            <div className="font-bold text-base dark:text-white">{player.name}</div>
                            <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block ${player.grade === 'A1' ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>{player.grade}</span>
                          </td>
                          <td className="p-5 text-center font-black text-slate-700 dark:text-slate-300">{player.played}</td>
                          <td className="p-5 text-center font-bold text-sm">
                            <span className="text-emerald-600">{player.won}</span> - <span className="text-rose-600">{player.lost}</span>
                          </td>
                          <td className="p-5 text-center font-black text-blue-600 dark:text-blue-400">{Math.round(player.winRate * 100)}%</td>
                          <td className="p-5 text-center font-mono font-bold">{player.netSets > 0 ? `+${player.netSets}` : player.netSets}</td>
                          <td className="p-5 text-center font-mono font-bold">{player.netPoints > 0 ? `+${player.netPoints}` : player.netPoints}</td>
                          <td className="p-5 text-center font-mono font-bold text-slate-500">{player.totalPoints}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}