import React from 'react';
import { Search } from 'lucide-react';
import { getGradeColor, getMatchTypeColor } from '../utils';

export const PlaytimeTab = ({ playtimeSearch, setPlaytimeSearch, playtimeData, setPlayerDetailModal, t, inputStyles }: any) => {
  return (
    <div className="animate-in fade-in duration-200 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-bold">{t('playtime')}</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
          <input type="text" placeholder="Search players..." value={playtimeSearch} onChange={(e) => setPlaytimeSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
        </div>
      </div>
      
      <div className="hidden sm:block bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark text-xs uppercase text-muted-ink font-semibold">
              <tr>
                <th className="p-4 w-1/4">Player</th>
                <th className="p-4 w-1/2">Match History</th>
                <th className="p-4 text-center w-32">{t('matches_played')}</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
              {playtimeData.map(({ member, attendance, playedGames }: any) => (
                <tr key={member.id} className="hover:bg-app dark:hover:bg-elevated-dark/30">
                  <td className="p-4">
                    <div className="font-bold text-sm dark:text-primary-dark truncate cursor-pointer hover:text-ink transition-colors" onClick={() => setPlayerDetailModal(member.id)}>{member.name}</div>
                    <div className="mt-1"><span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(member.skillLevel)}`}>{member.skillLevel}</span></div>
                  </td>
                  <td className="p-4 relative">
                    <div className="flex flex-wrap gap-2">
                      {playedGames.length === 0 ? <span className="text-xs text-faint">No matches yet</span> : 
                        playedGames.map((g: any, i: number) => (
                          <div key={i} className="group relative inline-block">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-help transition-colors ${getMatchTypeColor(g.type)} whitespace-nowrap ${g.result === 'Ongoing' && 'animate-pulse ring-2 ring-blue-400'}`}>{g.type}</span>
                            {/* Rich Card Tooltip */}
                            <div className="hidden group-hover:flex absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[340px] bg-surface dark:bg-surface-dark text-primary dark:text-primary-dark p-4 rounded-xl shadow-2xl border border-subtle dark:border-subtle-dark ring-1 ring-black/5 pointer-events-none flex-col gap-3">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-faint uppercase tracking-widest text-[10px] whitespace-nowrap">{g.type} MATCH</span>
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider whitespace-nowrap ${
                                  g.result === 'Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                                  g.result === 'Lost' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 
                                  g.result === 'Ongoing' ? 'bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark' :
                                  'bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint'
                                }`}>{String(t(g.result.toLowerCase(), { defaultValue: g.result }))}</span>
                              </div>
                              <div className="flex items-center justify-between w-full bg-app dark:bg-app-dark rounded-lg p-3 border border-subtle dark:border-subtle-dark">
                                <div className="flex flex-col text-center truncate flex-1 px-2">
                                  <div className="font-bold text-xs dark:text-primary-dark truncate" title={member.name}>{member.name}</div>
                                  <div className="text-muted-ink text-[10px] truncate" title={`& ${g.partnerName}`}>& {g.partnerName}</div>
                                </div>
                                <div className="font-black text-lg text-primary-soft dark:text-muted-dark whitespace-nowrap flex items-center justify-center gap-1 shrink-0">
                                  {g.result === 'Ongoing' ? (
                                     <span className="text-ink text-sm">Playing</span>
                                  ) : (
                                    <>
                                      <span className={g.myScore > g.oppScore ? "text-emerald-500" : ""}>{g.myScore}</span>
                                      <span className="text-muted-ink dark:text-muted-ink">-</span>
                                      <span className={g.oppScore > g.myScore ? "text-emerald-500" : ""}>{g.oppScore}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-col text-center truncate flex-1 px-2">
                                  <div className="font-bold text-xs dark:text-primary-dark truncate" title={g.opp1Name}>{g.opp1Name}</div>
                                  <div className="text-muted-ink text-[10px] truncate" title={`& ${g.opp2Name}`}>& {g.opp2Name}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-black text-lg text-slate-700 dark:text-slate-300">{playedGames.length}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase inline-block ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                      {attendance.status === 'active' ? t('status_active') : t('resting')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden flex flex-col gap-3">
        {playtimeData.map(({ member, playedGames }: any) => (
          <div key={member.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col cursor-pointer" onClick={() => setPlayerDetailModal(member.id)}>
                <span className="font-bold text-sm dark:text-primary-dark">{member.name}</span>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold mt-1 w-max ${getGradeColor(member.skillLevel)}`}>{member.skillLevel}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-black text-lg text-primary-soft dark:text-muted-dark leading-none">{playedGames.length}</span>
                <span className="text-[9px] font-bold text-faint uppercase tracking-widest">{t('matches_played')}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-subtle dark:border-subtle-dark">
              {playedGames.length === 0 ? <span className="text-xs text-faint">No matches yet</span> : 
                playedGames.map((g: any, i: number) => (
                  <span key={i} className={`px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap ${getMatchTypeColor(g.type)} ${g.result === 'Ongoing' && 'animate-pulse ring-1 ring-blue-400'}`}>{g.type}</span>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};