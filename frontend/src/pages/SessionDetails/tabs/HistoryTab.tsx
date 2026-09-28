import React from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';

export const HistoryTab = ({
  historySearch, setHistorySearch, filteredHistory, maxSets, getMemberData, 
  getInitialCourtName, openEditHistoryModal, setConfirmDeleteMatchId, isProcessing, t
}: any) => {
  return (
    <div className="animate-in fade-in duration-200">
      
      {/* Tab Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('history', 'History')}</h2>
          <span className="bg-muted dark:bg-[#18181b] border border-subtle dark:border-zinc-800 text-muted-ink dark:text-zinc-400 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
            {filteredHistory.length}
          </span>
        </div>
        
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder={t('search_history', 'Search history...')} 
            value={historySearch} 
            onChange={(e) => setHistorySearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-medium text-primary dark:text-white transition-all"
          />
        </div>
      </div>
      
      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredHistory.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-ink dark:text-zinc-500 text-sm font-medium bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl">
            {t('no_history', 'No match history found.')}
          </div>
        ) : (
          filteredHistory.map((match: any) => {
            const duration = Math.max(0, Math.floor((new Date(match.endedAt).getTime() - new Date(match.startedAt).getTime()) / 60000));
            
            let teamAWins = 0, teamBWins = 0;
            const sets = [];
            for(let i=1; i<=maxSets; i++) {
              const sa = match[`scoreTeamA_set${i}`];
              const sb = match[`scoreTeamB_set${i}`];
              if (sa !== undefined && sb !== undefined && (sa > 0 || sb > 0 || i === 1)) {
                sets.push({sa, sb});
                if (sa > sb) teamAWins++;
                else if (sb > sa) teamBWins++;
              }
            }
            
            const isTeamAWonMatch = teamAWins > teamBWins;
            const isTeamBWonMatch = teamBWins > teamAWins;
            
            return (
              <div key={match.id} className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:border-ink dark:hover:border-zinc-700">
                
                {/* Card Header (Court, Time, Actions) */}
                <div className="flex justify-between items-center px-4 py-3 bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-ink dark:text-zinc-400 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-700 px-2 py-0.5 rounded-md shadow-sm truncate max-w-[100px]">
                      {getInitialCourtName(match.courtId) || 'Deleted Court'}
                    </span>
                    <span className="text-[11px] font-bold text-primary dark:text-zinc-300">
                      {duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      type="button" 
                      disabled={isProcessing} 
                      onClick={(e) => { e.preventDefault(); openEditHistoryModal(match); }} 
                      className="p-1.5 text-muted-ink dark:text-zinc-400 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-700 hover:text-ink dark:hover:text-white rounded-md transition-colors shadow-sm cursor-pointer disabled:opacity-50" 
                      title={t('edit_history', 'Edit')}
                    >
                      <Edit2 size={14}/>
                    </button>
                    <button 
                      type="button" 
                      disabled={isProcessing} 
                      onClick={(e) => { e.preventDefault(); setConfirmDeleteMatchId(match.id); }} 
                      className="p-1.5 text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 rounded-md transition-colors shadow-sm cursor-pointer disabled:opacity-50" 
                      title="Delete Match"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                {/* Card Body (Scores) */}
                <div className="flex flex-col p-4 gap-4">
                  {/* Team A */}
                  <div className={`flex justify-between items-center ${isTeamAWonMatch ? 'text-primary dark:text-white' : 'text-muted-ink dark:text-zinc-500'}`}>
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-bold text-sm truncate">{getMemberData(match.teamA_player1)?.name || 'TBD'}</span>
                      <span className="font-bold text-sm truncate">{getMemberData(match.teamA_player2)?.name || 'TBD'}</span>
                    </div>
                    <div className="flex gap-2.5 shrink-0">
                      {sets.map((set, i) => (
                         <span key={i} className={`w-5 text-right font-black text-lg ${set.sa > set.sb ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                           {set.sa || 0}
                         </span>
                      ))}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className={`flex justify-between items-center ${isTeamBWonMatch ? 'text-primary dark:text-white' : 'text-muted-ink dark:text-zinc-500'}`}>
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-bold text-sm truncate">{getMemberData(match.teamB_player1)?.name || 'TBD'}</span>
                      <span className="font-bold text-sm truncate">{getMemberData(match.teamB_player2)?.name || 'TBD'}</span>
                    </div>
                    <div className="flex gap-2.5 shrink-0">
                      {sets.map((set, i) => (
                         <span key={i} className={`w-5 text-right font-black text-lg ${set.sb > set.sa ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                           {set.sb || 0}
                         </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};