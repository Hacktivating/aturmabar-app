import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Calendar, SquareStack, ArrowLeft, Zap, Globe, Sun, Moon, Settings as SettingsIcon, LogOut, Medal, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { useAppPreferences } from '../hooks/useAppPreferences';

const SKILL_LEVELS = [
  { id: 'A1', label: 'A1 - Pro', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700' },
  { id: 'A2', label: 'A2 - Advanced', color: 'bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60' },
  { id: 'B1', label: 'B1 - Upper Intermediate', color: 'bg-blue-50 text-blue-700 dark:bg-[#172554]/60 dark:text-[#93c5fd] border border-blue-200 dark:border-blue-800/60' },
  { id: 'B2', label: 'B2 - Lower Intermediate', color: 'bg-teal-50 text-teal-700 dark:bg-[#042f2e]/60 dark:text-[#5eead4] border border-teal-200 dark:border-teal-800/60' },
  { id: 'C1', label: 'C1 - Beginner', color: 'bg-emerald-50 text-emerald-700 dark:bg-[#022c22]/60 dark:text-[#6ee7b7] border border-emerald-200 dark:border-emerald-800/60' },
  { id: 'C2', label: 'C2 - Newbie', color: 'bg-lime-50 text-lime-700 dark:bg-[#3f6212]/40 dark:text-[#d9f99d] border border-lime-200 dark:border-lime-800/60' }
];

export default function Leaderboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isDark, toggleTheme, toggleLanguage, handleLogout } = useAppPreferences();

  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [matchesMap, setMatchesMap] = useState<Record<number, any[]>>({});

  const [viewMode, setViewMode] = useState<'month' | 'session'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

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
      const matchLimit = session.matchLimit || 999; 
      const maxSets = session.scoringSystem?.includes('3 Sets') ? 3 : session.customSets || 1;

      const sessionMatches = matchesMap[session.id] || [];
      const finished = sessionMatches.filter(m => m.status === 'finished').sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

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
            p.lastWinTime = Math.max(p.lastWinTime, endTime); 
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

  const getBadgeStyle = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.color || 'bg-muted text-primary-soft dark:bg-zinc-800 dark:text-zinc-400 border border-transparent dark:border-zinc-700';
  const getBadgeLabel = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.label || levelId;

  return (
    <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">
      
      <nav className="border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-[#0f0f11] sticky top-0 z-20 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-ink dark:bg-white p-1.5 rounded-lg flex items-center justify-center text-white dark:text-zinc-950 shrink-0 shadow-sm">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 pr-3 sm:pr-5 border-r border-subtle dark:border-zinc-800 max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-muted dark:bg-zinc-800 border border-subtle dark:border-zinc-700 flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-sm">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-bold truncate hidden sm:block">{communityData?.name}</span>
            </div>

            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white transition-colors px-2.5 py-2 rounded-lg hover:bg-muted dark:hover:bg-zinc-800">
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
            <button onClick={toggleTheme} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{String(t('logout', { defaultValue: 'Logout' }))}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative p-4 sm:p-8 max-w-6xl mx-auto w-full flex flex-col z-10">
        <div className="flex items-center gap-5 mb-8 shrink-0">
          <Link 
            to="/dashboard" 
            className="block p-2.5 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center justify-center shadow-sm">
               <Trophy size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-white">{t('leaderboard', 'Leaderboard')}</h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 shrink-0">
          <div className="flex bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-1.5 rounded-xl w-full sm:w-auto shrink-0 shadow-sm">
             <button onClick={() => setViewMode('month')} className={`flex-1 sm:flex-none px-8 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${viewMode === 'month' ? 'bg-app dark:bg-[#18181b] shadow-sm text-ink dark:text-white border border-subtle dark:border-zinc-700' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300 border border-transparent'}`}>
                {t('by_month', 'By Month')}
             </button>
             <button onClick={() => setViewMode('session')} className={`flex-1 sm:flex-none px-8 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${viewMode === 'session' ? 'bg-app dark:bg-[#18181b] shadow-sm text-ink dark:text-white border border-subtle dark:border-zinc-700' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300 border border-transparent'}`}>
                {t('by_session', 'By Session')}
             </button>
          </div>

          <div className="relative w-full sm:w-80">
             {viewMode === 'month' ? (
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={18} />
                  <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-bold text-primary dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert opacity-90 hover:opacity-100 transition-opacity" />
                </div>
             ) : (
                <div className="relative">
                  <SquareStack className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={18} />
                  <select value={selectedSessionId || ''} onChange={e => setSelectedSessionId(parseInt(e.target.value))} className="w-full pl-11 pr-10 py-3 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-bold text-primary dark:text-white appearance-none truncate">
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({new Date(s.date).toLocaleDateString()})</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" size={18} />
                </div>
             )}
          </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-muted-ink dark:text-zinc-500 font-medium">Loading rankings...</div>
        ) : (
          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex-1">
            <div className="overflow-x-auto h-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800 sticky top-0 z-10">
                  <tr className="text-xs uppercase text-muted-ink dark:text-zinc-400 font-bold tracking-widest">
                    <th className="p-5 w-20 text-center">{t('rank', 'RANK')}</th>
                    <th className="p-5">{t('player', 'PLAYER')}</th>
                    <th className="p-5 text-center">{t('matches', 'MATCHES')}</th>
                    <th className="p-5 text-center">{t('w_l', 'W-L')}</th>
                    <th className="p-5 text-center">{t('win_rate', 'WIN RATE')}</th>
                    <th className="p-5 text-center">{t('net_sets', 'NET SETS')}</th>
                    <th className="p-5 text-center">{t('net_pts', 'NET PTS')}</th>
                    <th className="p-5 text-center pr-6">{t('total_pts', 'TOTAL PTS')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {leaderboardData.length === 0 ? (
                    <tr><td colSpan={8} className="p-12 text-center text-muted-ink dark:text-zinc-500 font-medium">No matches found for this selection.</td></tr>
                  ) : (
                    leaderboardData.map((player, index) => {
                      const rank = index + 1;
                      let rankBadge = <span className="font-mono font-black text-muted-ink dark:text-zinc-500">{rank}</span>;
                      if (rank === 1) rankBadge = <div className="w-8 h-8 mx-auto bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-full flex items-center justify-center shadow-sm border border-amber-200 dark:border-amber-500/30"><Medal size={16}/></div>;
                      if (rank === 2) rankBadge = <div className="w-8 h-8 mx-auto bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300 rounded-full flex items-center justify-center shadow-sm border border-slate-300 dark:border-zinc-600"><Medal size={16}/></div>;
                      if (rank === 3) rankBadge = <div className="w-8 h-8 mx-auto bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 rounded-full flex items-center justify-center shadow-sm border border-orange-200 dark:border-orange-500/30"><Medal size={16}/></div>;

                      return (
                        <tr key={player.id} className="hover:bg-app dark:hover:bg-white/5 transition-colors">
                          <td className="p-5 text-center">{rankBadge}</td>
                          <td className="p-5">
                            <div className="font-bold text-base text-primary dark:text-zinc-100">{player.name}</div>
                            {player.grade && (
                              <span className={`mt-1.5 inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${getBadgeStyle(player.grade)}`}>
                                {getBadgeLabel(player.grade)}
                              </span>
                            )}
                          </td>
                          <td className="p-5 text-center font-black text-primary-soft dark:text-zinc-400">{player.played}</td>
                          <td className="p-5 text-center font-bold text-sm">
                            <span className="text-emerald-600 dark:text-emerald-400">{player.won}</span> <span className="text-muted-ink dark:text-zinc-600 mx-1">-</span> <span className="text-rose-600 dark:text-rose-400">{player.lost}</span>
                          </td>
                          <td className="p-5 text-center font-black text-ink dark:text-white">{Math.round(player.winRate * 100)}%</td>
                          <td className="p-5 text-center font-mono font-bold text-primary dark:text-zinc-300">{player.netSets > 0 ? `+${player.netSets}` : player.netSets}</td>
                          <td className="p-5 text-center font-mono font-bold text-primary dark:text-zinc-300">{player.netPoints > 0 ? `+${player.netPoints}` : player.netPoints}</td>
                          <td className="p-5 text-center font-mono font-bold text-muted-ink dark:text-zinc-500 pr-6">{player.totalPoints}</td>
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