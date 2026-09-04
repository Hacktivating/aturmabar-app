import React from 'react';
import { Search, Medal } from 'lucide-react';
import { getGradeColor } from '../utils';

export const LeaderboardTab = ({
  session, communityData, leaderboardSearch, setLeaderboardSearch, lbLimitType, setLbLimitType,
  lbCustomLimit, setLbCustomLimit, sessionLeaderboardData, sparringScore, t, inputStyles
}: any) => {
  return (
    <div className="animate-in fade-in duration-200 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-bold">{t('leaderboard', 'Leaderboard')}</h2>
        
        {session?.sessionType !== 'sparring' && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
              <input type="text" placeholder={String(t('search_players', { defaultValue: 'Search players...' }))} value={leaderboardSearch} onChange={(e) => setLeaderboardSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                value={lbLimitType} 
                onChange={e => setLbLimitType(e.target.value)} 
                className="w-full sm:w-auto px-4 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-bold appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center]"
              >
                <option value="all">All Games</option>
                <option value="1">1 Game</option>
                <option value="2">2 Games</option>
                <option value="3">3 Games</option>
                <option value="4">4 Games</option>
                <option value="5">5 Games</option>
                <option value="custom">Custom Amount</option>
              </select>
              {lbLimitType === 'custom' && (
                <input 
                  type="number" 
                  min="1" 
                  value={lbCustomLimit} 
                  onChange={e => setLbCustomLimit(parseInt(e.target.value) || 1)} 
                  className="w-20 px-3 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm text-center font-bold"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {session?.sessionType === 'sparring' ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 bg-surface dark:bg-surface-dark p-8 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm">
             <div className="text-center flex-1">
               <h3 className="text-xl font-bold text-primary dark:text-primary-dark truncate">{communityData?.name || 'Home Team'}</h3>
               <p className="text-6xl font-black mt-4 text-emerald-600 dark:text-emerald-400">{sparringScore.homeMatches}</p>
               <p className="text-xs font-bold text-muted-ink mt-2 uppercase tracking-widest">Matches Won</p>
             </div>
             <div className="text-3xl font-black text-faint bg-app dark:bg-elevated-dark p-4 rounded-full border border-subtle dark:border-strong-dark">VS</div>
             <div className="text-center flex-1">
               <h3 className="text-xl font-bold text-primary dark:text-primary-dark truncate">{session.opposingCommunityName || 'Away Team'}</h3>
               <p className="text-6xl font-black mt-4 text-rose-600 dark:text-rose-400">{sparringScore.awayMatches}</p>
               <p className="text-xs font-bold text-muted-ink mt-2 uppercase tracking-widest">Matches Won</p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-6 rounded-2xl text-center shadow-sm">
               <p className="text-xs font-bold text-muted-ink uppercase tracking-widest mb-2">Total Sets Won</p>
               <div className="flex justify-center items-center gap-4 text-3xl font-black">
                 <span className="text-emerald-600">{sparringScore.homeSets}</span> <span className="text-faint">-</span> <span className="text-rose-600">{sparringScore.awaySets}</span>
               </div>
             </div>
             <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-6 rounded-2xl text-center shadow-sm">
               <p className="text-xs font-bold text-muted-ink uppercase tracking-widest mb-2">Total Points Won</p>
               <div className="flex justify-center items-center gap-4 text-3xl font-black">
                 <span className="text-emerald-600">{sparringScore.homePoints}</span> <span className="text-faint">-</span> <span className="text-rose-600">{sparringScore.awayPoints}</span>
               </div>
             </div>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden sm:block bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark text-xs uppercase text-muted-ink font-bold tracking-widest">
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
                  {sessionLeaderboardData.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-muted-ink font-medium">{t('no_players', 'No players found.')}</td></tr>
                  ) : (
                    sessionLeaderboardData.map((player: any) => {
                      const rank = player.rank;
                      let rankBadge = <span className="font-mono font-black text-faint">{rank}</span>;
                      if (rank === 1) rankBadge = <div className="w-8 h-8 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;
                      if (rank === 2) rankBadge = <div className="w-8 h-8 mx-auto bg-muted text-muted-ink rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;
                      if (rank === 3) rankBadge = <div className="w-8 h-8 mx-auto bg-orange-100 text-orange-700 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;

                      return (
                        <tr key={player.id} className="hover:bg-app dark:hover:bg-elevated-dark/30 transition-colors">
                          <td className="p-5 text-center">{rankBadge}</td>
                          <td className="p-5">
                            <div className="font-bold text-base dark:text-primary-dark">{player.name}</div>
                            <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold mt-1 inline-block ${getGradeColor(player.grade)}`}>{player.grade}</span>
                          </td>
                          <td className="p-5 text-center font-black text-slate-700 dark:text-slate-300">{player.played}</td>
                          <td className="p-5 text-center font-bold text-sm">
                            <span className="text-emerald-600">{player.won}</span> - <span className="text-rose-600">{player.lost}</span>
                          </td>
                          <td className="p-5 text-center font-black text-ink dark:text-ink-dark">{Math.round(player.winRate * 100)}%</td>
                          <td className="p-5 text-center font-mono font-bold">{player.netSets > 0 ? `+${player.netSets}` : player.netSets}</td>
                          <td className="p-5 text-center font-mono font-bold">{player.netPoints > 0 ? `+${player.netPoints}` : player.netPoints}</td>
                          <td className="p-5 text-center font-mono font-bold text-muted-ink">{player.totalPoints}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden flex flex-col gap-3">
            {sessionLeaderboardData.map((player: any) => {
              const rank = player.rank;
              let rankBadge = <span className="font-mono font-black text-faint text-lg">{rank}</span>;
              if (rank === 1) rankBadge = <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;
              if (rank === 2) rankBadge = <div className="w-8 h-8 bg-muted text-muted-ink rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;
              if (rank === 3) rankBadge = <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center shadow-sm"><Medal size={16}/></div>;

              return (
                <div key={player.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex justify-center shrink-0">{rankBadge}</div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm dark:text-primary-dark">{player.name}</span>
                        <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold mt-1 w-max ${getGradeColor(player.grade)}`}>{player.grade}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-lg text-ink dark:text-ink-dark leading-none">{Math.round(player.winRate * 100)}%</span>
                      <span className="text-[9px] font-bold text-faint uppercase tracking-widest">{t('win_rate', 'WIN RATE')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-subtle dark:border-subtle-dark">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-sm text-primary-soft dark:text-muted-dark">{player.played}</span>
                      <span className="text-[8px] font-bold text-faint uppercase tracking-widest">{t('matches', 'Matches')}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-sm"><span className="text-emerald-600">{player.won}</span>-<span className="text-rose-600">{player.lost}</span></span>
                      <span className="text-[8px] font-bold text-faint uppercase tracking-widest">{t('w_l', 'W-L')}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-sm font-mono text-primary-soft dark:text-muted-dark">{player.netPoints > 0 ? `+${player.netPoints}` : player.netPoints}</span>
                      <span className="text-[8px] font-bold text-faint uppercase tracking-widest">{t('net_pts', 'Net Pts')}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-sm font-mono text-primary-soft dark:text-muted-dark">{player.netSets > 0 ? `+${player.netSets}` : player.netSets}</span>
                      <span className="text-[8px] font-bold text-faint uppercase tracking-widest">{t('net_sets', 'Net Sets')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};