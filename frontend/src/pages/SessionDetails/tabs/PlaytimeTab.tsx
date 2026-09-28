import React from 'react';
import { Search } from 'lucide-react';

const SKILL_LEVELS = [
  { id: 'A1', label: 'A1 - Pro', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700' },
  { id: 'A2', label: 'A2 - Advanced', color: 'bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60' },
  { id: 'B1', label: 'B1 - Upper Intermediate', color: 'bg-blue-50 text-blue-700 dark:bg-[#172554]/60 dark:text-[#93c5fd] border border-blue-200 dark:border-blue-800/60' },
  { id: 'B2', label: 'B2 - Lower Intermediate', color: 'bg-teal-50 text-teal-700 dark:bg-[#042f2e]/60 dark:text-[#5eead4] border border-teal-200 dark:border-teal-800/60' },
  { id: 'C1', label: 'C1 - Beginner', color: 'bg-emerald-50 text-emerald-700 dark:bg-[#022c22]/60 dark:text-[#6ee7b7] border border-emerald-200 dark:border-emerald-800/60' },
  { id: 'C2', label: 'C2 - Newbie', color: 'bg-lime-50 text-lime-700 dark:bg-[#3f6212]/40 dark:text-[#d9f99d] border border-lime-200 dark:border-lime-800/60' }
];

const getBadgeStyle = (levelId?: string) => {
  const shortId = levelId ? levelId.split(' ')[0] : 'C1';
  return SKILL_LEVELS.find(s => s.id === shortId)?.color || 'bg-muted text-primary-soft dark:bg-zinc-800 dark:text-zinc-400 border border-transparent dark:border-zinc-700';
};

const getMatchTypeStyle = (type: string) => {
  switch (type) {
    case 'MD': return { badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-[#0c4a6e]/30 dark:text-[#7dd3fc] dark:border-[#0c4a6e]', text: 'text-sky-600 dark:text-[#7dd3fc]' };
    case 'WD': return { badge: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-[#831843]/30 dark:text-[#f9a8d4] dark:border-[#831843]', text: 'text-pink-600 dark:text-[#f9a8d4]' };
    case 'XD': return { badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-[#3b0764]/40 dark:text-[#d8b4fe] dark:border-[#3b0764]', text: 'text-purple-600 dark:text-[#d8b4fe]' };
    default: return { badge: 'bg-muted text-muted-ink border-subtle dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700', text: 'text-muted-ink dark:text-zinc-400' };
  }
};

export const PlaytimeTab = ({ playtimeSearch, setPlaytimeSearch, playtimeData, setPlayerDetailModal, t }: any) => {
  return (
    <div className="animate-in fade-in duration-200 flex flex-col h-full bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* High-Density Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('playtime', 'Playtime')}</h2>
            <span className="bg-muted dark:bg-[#18181b] border border-subtle dark:border-zinc-800 text-muted-ink dark:text-zinc-400 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">{playtimeData.length}</span>
          </div>
          
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={14} />
            <input 
              type="text" 
              placeholder={String(t('search_players', { defaultValue: 'Search players...' }))} 
              value={playtimeSearch} 
              onChange={(e) => setPlaytimeSearch(e.target.value)} 
              className="w-full pl-9 pr-3 py-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg shadow-sm outline-none focus:ring-1 focus:ring-ink text-xs font-medium text-primary dark:text-white transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800 sticky top-0 z-10">
            <tr className="text-[10px] uppercase tracking-widest text-muted-ink dark:text-zinc-500 font-bold">
              <th className="p-2.5 pl-5 w-1/4">{t('player', 'PLAYER')}</th>
              <th className="p-2.5 w-1/2">{t('match_history', 'MATCH HISTORY')}</th>
              <th className="p-2.5 text-center w-32">{t('matches_played', 'MATCHES')}</th>
              <th className="p-2.5 text-right pr-5">{t('status', 'STATUS')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {playtimeData.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-muted-ink dark:text-zinc-500 text-sm font-medium">{t('no_players', 'No players found.')}</td></tr>
            ) : (
              playtimeData.map(({ member, attendance, playedGames }: any) => (
                <tr key={member.id} className="hover:bg-app dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-3">
                      <span 
                        className="font-bold text-sm text-primary dark:text-zinc-100 truncate cursor-pointer hover:text-ink dark:hover:text-white transition-colors max-w-[200px]" 
                        onClick={(e) => { e.preventDefault(); setPlayerDetailModal(member.id); }}
                      >
                        {member.name}
                      </span>
                      <span className={`text-[9px] border px-1.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0 ${getBadgeStyle(member.skillLevel)}`}>
                        {member.skillLevel ? member.skillLevel.split(' ')[0] : 'C1'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-2.5 py-2 relative">
                    <div className="flex flex-wrap gap-1.5">
                      {playedGames.length === 0 ? <span className="text-xs font-medium text-muted-ink dark:text-zinc-500 italic">No matches yet</span> : 
                        playedGames.map((g: any, i: number) => {
                          const style = getMatchTypeStyle(g.type);
                          return (
                            <div key={i} className="group relative inline-block cursor-help outline-none" tabIndex={0}>
                              <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded border transition-colors ${style.badge} ${g.result === 'Ongoing' && 'animate-pulse ring-1 ring-blue-400'}`}>
                                {g.type}
                              </span>
                              
                              {/* Symmetrical Scoreboard Tooltip */}
                              <div className="hidden group-hover:flex group-focus:flex absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[300px] bg-surface dark:bg-[#18181b] p-4 rounded-2xl shadow-2xl border border-subtle dark:border-zinc-700 ring-1 ring-black/5 flex-col gap-4">
                                <div className="flex justify-between items-center w-full">
                                  <span className={`font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${style.text}`}>{g.type} MATCH</span>
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-widest whitespace-nowrap border ${
                                    g.result === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 
                                    g.result === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 
                                    g.result === 'Ongoing' ? 'bg-accent-soft text-ink border-transparent dark:bg-accent-soft-dark dark:text-white animate-pulse' :
                                    'bg-app text-muted-ink border-subtle dark:bg-[#121214] dark:border-zinc-800 dark:text-zinc-500'
                                  }`}>{String(t(g.result.toLowerCase(), { defaultValue: g.result }))}</span>
                                </div>
                                
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex flex-col flex-1 text-right min-w-0">
                                    <span className="font-bold text-sm text-primary dark:text-white truncate">{member.name}</span>
                                    <span className="text-[10px] text-muted-ink dark:text-zinc-500 truncate">& {g.partnerName}</span>
                                  </div>
                                  <div className="flex shrink-0 items-center justify-center font-black text-xl bg-app dark:bg-[#121214] px-4 py-2 rounded-xl border border-subtle dark:border-zinc-800 min-w-[70px]">
                                    {g.result === 'Ongoing' ? (
                                       <span className="text-sm font-bold text-ink dark:text-white uppercase tracking-widest text-[10px]">Playing</span>
                                    ) : (
                                       <>
                                         <span className={g.myScore > g.oppScore ? "text-emerald-600 dark:text-emerald-400" : "text-primary dark:text-white"}>{g.myScore}</span>
                                         <span className="mx-1.5 text-muted-ink dark:text-zinc-600">-</span>
                                         <span className={g.oppScore > g.myScore ? "text-emerald-600 dark:text-emerald-400" : "text-primary dark:text-white"}>{g.oppScore}</span>
                                       </>
                                    )}
                                  </div>
                                  <div className="flex flex-col flex-1 text-left min-w-0">
                                    <span className="font-bold text-sm text-primary dark:text-white truncate">{g.opp1Name}</span>
                                    <span className="text-[10px] text-muted-ink dark:text-zinc-500 truncate">& {g.opp2Name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </td>
                  
                  <td className="px-2.5 py-2 text-center">
                    <span className="font-black text-lg text-primary dark:text-white">{playedGames.length}</span>
                  </td>
                  
                  <td className="px-5 py-2 text-right">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase border inline-block ${attendance.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                      {attendance.status === 'active' ? t('status_active', 'ACTIVE') : t('resting', 'RESTING')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ultra-Compact Mobile View */}
      <div className="sm:hidden flex flex-col divide-y divide-slate-100 dark:divide-zinc-800/50">
        {playtimeData.length === 0 ? (
           <div className="p-10 text-center text-muted-ink dark:text-zinc-500 text-sm font-medium">{t('no_players', 'No players found.')}</div>
        ) : (
          playtimeData.map(({ member, attendance, playedGames }: any) => (
            <div key={member.id} className="p-3 hover:bg-app dark:hover:bg-white/5 transition-colors flex flex-col gap-2.5">
              
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span 
                    className="font-bold text-sm text-primary dark:text-zinc-100 truncate cursor-pointer hover:underline" 
                    onClick={(e) => { e.preventDefault(); setPlayerDetailModal(member.id); }}
                  >
                    {member.name}
                  </span>
                  <span className={`text-[9px] border px-1.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0 ${getBadgeStyle(member.skillLevel)}`}>
                    {member.skillLevel ? member.skillLevel.split(' ')[0] : 'C1'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 px-2 py-0.5 rounded-md shadow-sm">
                    <span className="font-black text-sm text-primary dark:text-white leading-none">{playedGames.length}</span>
                    <span className="text-[8px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest">{t('matches', 'M')}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase border ${attendance.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                    {attendance.status === 'active' ? t('status_active', 'ACT') : t('resting', 'REST')}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {playedGames.length === 0 ? <span className="text-xs font-medium text-muted-ink dark:text-zinc-500 italic">No matches yet</span> : 
                  playedGames.map((g: any, i: number) => {
                    const style = getMatchTypeStyle(g.type);
                    return (
                      <div key={i} className="group relative inline-block cursor-pointer outline-none" tabIndex={0}>
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded border transition-colors ${style.badge} ${g.result === 'Ongoing' && 'animate-pulse ring-1 ring-blue-400'}`}>
                          {g.type}
                        </span>
                        
                        {/* Mobile Hover Tooltip */}
                        <div className="hidden group-hover:flex group-focus:flex absolute z-[100] top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 w-[280px] bg-surface dark:bg-[#18181b] p-3 rounded-xl shadow-2xl border border-subtle dark:border-zinc-700 ring-1 ring-black/5 flex-col gap-3">
                          <div className="flex justify-between items-center w-full border-b border-subtle dark:border-zinc-800 pb-2">
                            <span className={`font-black uppercase tracking-widest text-[10px] whitespace-nowrap ${style.text}`}>{g.type} MATCH</span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-widest whitespace-nowrap border ${
                              g.result === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 
                              g.result === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 
                              g.result === 'Ongoing' ? 'bg-accent-soft text-ink border-transparent dark:bg-accent-soft-dark dark:text-white animate-pulse' :
                              'bg-app text-muted-ink border-subtle dark:bg-[#121214] dark:border-zinc-800 dark:text-zinc-500'
                            }`}>{String(t(g.result.toLowerCase(), { defaultValue: g.result }))}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col flex-1 text-right min-w-0">
                              <span className="font-bold text-xs text-primary dark:text-white truncate">{member.name}</span>
                              <span className="text-[10px] text-muted-ink dark:text-zinc-500 truncate">& {g.partnerName}</span>
                            </div>
                            <div className="flex shrink-0 items-center justify-center font-black text-base bg-app dark:bg-[#121214] px-2.5 py-1.5 rounded-lg border border-subtle dark:border-zinc-800 min-w-[50px]">
                              {g.result === 'Ongoing' ? (
                                 <span className="text-[10px] font-bold text-ink dark:text-white uppercase tracking-widest">Playing</span>
                              ) : (
                                 <>
                                   <span className={g.myScore > g.oppScore ? "text-emerald-600 dark:text-emerald-400" : "text-primary dark:text-white"}>{g.myScore}</span>
                                   <span className="mx-1 text-muted-ink dark:text-zinc-600">-</span>
                                   <span className={g.oppScore > g.myScore ? "text-emerald-600 dark:text-emerald-400" : "text-primary dark:text-white"}>{g.oppScore}</span>
                                 </>
                              )}
                            </div>
                            <div className="flex flex-col flex-1 text-left min-w-0">
                              <span className="font-bold text-xs text-primary dark:text-white truncate">{g.opp1Name}</span>
                              <span className="text-[10px] text-muted-ink dark:text-zinc-500 truncate">& {g.opp2Name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
};