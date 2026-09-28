import React from 'react';
import { Search, Medal, ChevronDown } from 'lucide-react';
import { getGradeColor } from '../utils';

export const LeaderboardTab = ({
  session, communityData, leaderboardSearch, setLeaderboardSearch, lbLimitType, setLbLimitType,
  lbCustomLimit, setLbCustomLimit, sessionLeaderboardData, sparringScore, t
}: any) => {
  return (
    <div className="animate-in fade-in duration-200 flex flex-col h-full bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* High-Density Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('leaderboard', 'Leaderboard')}</h2>
            <span className="bg-muted dark:bg-[#18181b] border border-subtle dark:border-zinc-800 text-muted-ink dark:text-zinc-400 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">{sessionLeaderboardData.length}</span>
          </div>
          
          {session?.sessionType !== 'sparring' && (
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 mt-1 lg:mt-0">
              <div className="relative flex-1 sm:w-56 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={14} />
                <input 
                  type="text" 
                  placeholder={String(t('search_players', { defaultValue: 'Search...' }))} 
                  value={leaderboardSearch} 
                  onChange={(e) => setLeaderboardSearch(e.target.value)} 
                  className="w-full pl-9 pr-3 py-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg shadow-sm outline-none focus:ring-1 focus:ring-ink text-xs font-medium text-primary dark:text-white transition-all"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <div className="relative">
                  <select 
                    value={lbLimitType} 
                    onChange={e => setLbLimitType(e.target.value)} 
                    className="appearance-none pl-3 pr-8 py-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg shadow-sm outline-none focus:ring-1 focus:ring-ink text-xs font-bold text-primary dark:text-white cursor-pointer transition-all"
                  >
                    <option value="all">All Games</option>
                    <option value="1">1 Game</option>
                    <option value="2">2 Games</option>
                    <option value="3">3 Games</option>
                    <option value="4">4 Games</option>
                    <option value="5">5 Games</option>
                    <option value="custom">Custom</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
                </div>

                {lbLimitType === 'custom' && (
                  <input 
                    type="number" 
                    min="1" 
                    value={lbCustomLimit} 
                    onChange={e => setLbCustomLimit(parseInt(e.target.value) || 1)} 
                    className="w-16 px-2 py-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg shadow-sm outline-none focus:ring-1 focus:ring-ink text-xs text-center font-bold text-primary dark:text-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {session?.sessionType === 'sparring' ? (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 bg-app dark:bg-[#18181b] p-6 rounded-3xl border border-subtle dark:border-zinc-800 shadow-sm">
               <div className="text-center flex-1 w-full">
                 <h3 className="text-lg font-black text-primary dark:text-white tracking-tight truncate">{communityData?.name || 'Home Team'}</h3>
                 <p className="text-5xl font-black mt-3 text-emerald-600 dark:text-emerald-400">{sparringScore.homeMatches}</p>
                 <p className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 mt-2 uppercase tracking-widest">Matches Won</p>
               </div>
               <div className="text-xl font-black text-muted-ink dark:text-zinc-600 bg-surface dark:bg-[#121214] p-3 rounded-full border border-subtle dark:border-zinc-800 shadow-inner">VS</div>
               <div className="text-center flex-1 w-full">
                 <h3 className="text-lg font-black text-primary dark:text-white tracking-tight truncate">{session.opposingCommunityName || 'Away Team'}</h3>
                 <p className="text-5xl font-black mt-3 text-rose-600 dark:text-rose-400">{sparringScore.awayMatches}</p>
                 <p className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 mt-2 uppercase tracking-widest">Matches Won</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 p-5 rounded-2xl text-center shadow-sm">
                 <p className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest mb-3">Total Sets Won</p>
                 <div className="flex justify-center items-center gap-4 text-2xl font-black">
                   <span className="text-emerald-600 dark:text-emerald-400">{sparringScore.homeSets}</span> 
                   <span className="text-muted-ink dark:text-zinc-600 text-lg">-</span> 
                   <span className="text-rose-600 dark:text-rose-400">{sparringScore.awaySets}</span>
                 </div>
               </div>
               <div className="bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 p-5 rounded-2xl text-center shadow-sm">
                 <p className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest mb-3">Total Points Won</p>
                 <div className="flex justify-center items-center gap-4 text-2xl font-black">
                   <span className="text-emerald-600 dark:text-emerald-400">{sparringScore.homePoints}</span> 
                   <span className="text-muted-ink dark:text-zinc-600 text-lg">-</span> 
                   <span className="text-rose-600 dark:text-rose-400">{sparringScore.awayPoints}</span>
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800 sticky top-0 z-10">
                  <tr className="text-[10px] uppercase tracking-widest text-muted-ink dark:text-zinc-500 font-bold">
                    <th className="p-3 text-center w-16">{t('rank', 'RANK')}</th>
                    <th className="p-3 pl-2">{t('player', 'PLAYER')}</th>
                    <th className="p-3 text-center">{t('matches', 'MATCHES')}</th>
                    <th className="p-3 text-center">{t('w_l', 'W-L')}</th>
                    <th className="p-3 text-center">{t('win_rate', 'WIN RATE')}</th>
                    <th className="p-3 text-center">{t('net_sets', 'NET SETS')}</th>
                    <th className="p-3 text-center">{t('net_pts', 'NET PTS')}</th>
                    <th className="p-3 text-center pr-6">{t('total_pts', 'TOTAL PTS')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {sessionLeaderboardData.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-muted-ink dark:text-zinc-500 text-sm font-medium">{t('no_players', 'No players found.')}</td></tr>
                  ) : (
                    sessionLeaderboardData.map((player: any) => {
                      const rank = player.rank;
                      let rankBadge = <span className="font-mono font-black text-muted-ink dark:text-zinc-500">{rank}</span>;
                      if (rank === 1) rankBadge = <div className="w-7 h-7 mx-auto bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={14}/></div>;
                      if (rank === 2) rankBadge = <div className="w-7 h-7 mx-auto bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={14}/></div>;
                      if (rank === 3) rankBadge = <div className="w-7 h-7 mx-auto bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={14}/></div>;

                      return (
                        <tr key={player.id} className="hover:bg-app dark:hover:bg-white/5 transition-colors">
                          <td className="p-3 text-center">{rankBadge}</td>
                          <td className="p-3 pl-2 flex items-center gap-3">
                            <span className="font-bold text-sm text-primary dark:text-zinc-100 truncate max-w-[180px]">{player.name}</span>
                            <span className={`text-[9px] border px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${getGradeColor(player.grade)}`}>{player.grade ? player.grade.split(' ')[0] : 'C1'}</span>
                          </td>
                          <td className="p-3 text-center font-black text-primary dark:text-white">{player.played}</td>
                          <td className="p-3 text-center font-bold text-sm">
                            <span className="text-emerald-600 dark:text-emerald-400">{player.won}</span> <span className="text-muted-ink dark:text-zinc-600 mx-0.5">-</span> <span className="text-rose-600 dark:text-rose-400">{player.lost}</span>
                          </td>
                          <td className="p-3 text-center font-black text-ink dark:text-white">{Math.round(player.winRate * 100)}%</td>
                          <td className="p-3 text-center font-mono font-bold text-sm text-primary dark:text-zinc-300">{player.netSets > 0 ? `+${player.netSets}` : player.netSets}</td>
                          <td className="p-3 text-center font-mono font-bold text-sm text-primary dark:text-zinc-300">{player.netPoints > 0 ? `+${player.netPoints}` : player.netPoints}</td>
                          <td className="p-3 text-center font-mono font-bold text-sm text-muted-ink dark:text-zinc-500 pr-6">{player.totalPoints}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Ultra-Compact Mobile View */}
            <div className="sm:hidden flex flex-col divide-y divide-slate-100 dark:divide-zinc-800/50">
              {sessionLeaderboardData.length === 0 ? (
                <div className="p-10 text-center text-muted-ink dark:text-zinc-500 text-sm font-medium">{t('no_players', 'No players found.')}</div>
              ) : (
                sessionLeaderboardData.map((player: any) => {
                  const rank = player.rank;
                  let rankBadge = <span className="font-mono font-black text-muted-ink dark:text-zinc-500 text-sm">{rank}</span>;
                  if (rank === 1) rankBadge = <div className="w-6 h-6 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={12}/></div>;
                  if (rank === 2) rankBadge = <div className="w-6 h-6 bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={12}/></div>;
                  if (rank === 3) rankBadge = <div className="w-6 h-6 bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={12}/></div>;

                  return (
                    <div key={player.id} className="p-3 hover:bg-app dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3">
                      
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-6 flex justify-center shrink-0">{rankBadge}</div>
                        <div className="flex flex-col min-w-0 gap-0.5">
                          <span className="font-bold text-sm text-primary dark:text-zinc-100 truncate">{player.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] border px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${getGradeColor(player.grade)}`}>{player.grade ? player.grade.split(' ')[0] : 'C1'}</span>
                            <span className="text-[10px] font-bold text-muted-ink dark:text-zinc-500">{player.played} {t('matches', 'Matches')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-xs"><span className="text-emerald-600 dark:text-emerald-400">{player.won}</span><span className="text-muted-ink dark:text-zinc-600 mx-0.5">-</span><span className="text-rose-600 dark:text-rose-400">{player.lost}</span></span>
                          <span className="text-[8px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest mt-0.5">{t('w_l', 'W-L')}</span>
                        </div>
                        <div className="flex flex-col items-end w-10 border-l border-subtle dark:border-zinc-800 pl-3">
                          <span className="font-black text-sm text-ink dark:text-white leading-none">{Math.round(player.winRate * 100)}%</span>
                          <span className="text-[8px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest mt-1">Win</span>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};