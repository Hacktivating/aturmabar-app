import React from 'react';
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMatchTypeColor } from '../utils';

export const HistoryTab = ({
  historySearch, setHistorySearch, filteredHistory, maxSets, getMemberData, 
  getInitialCourtName, openEditHistoryModal, setConfirmDeleteMatchId, isProcessing, t
}: any) => {
  return (
    <div className="animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-bold">{t('history')}</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
          <input type="text" placeholder="Search history..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {filteredHistory.length === 0 ? (
          <div className="p-10 text-center text-muted-ink border border-subtle dark:border-subtle-dark rounded-xl bg-surface dark:bg-surface-dark">{t('no_history')}</div>
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
              <div key={match.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 sm:p-6 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 w-full flex flex-col gap-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${isTeamAWonMatch ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' : 'bg-app border-subtle dark:bg-app-dark dark:border-subtle-dark'}`}>
                     <div className="flex items-center gap-3 truncate pr-4">
                       <span className="font-bold text-sm dark:text-primary-dark truncate">{getMemberData(match.teamA_player1)?.name || 'TBD'}</span>
                       <span className="text-muted-ink dark:text-muted-ink">&</span>
                       <span className="font-bold text-sm dark:text-primary-dark truncate">{getMemberData(match.teamA_player2)?.name || 'TBD'}</span>
                     </div>
                     <div className="flex gap-3 items-center shrink-0">
                       {sets.map((set, i) => (
                         <span key={i} className={`font-mono text-lg ${set.sa > set.sb ? 'font-black text-emerald-600 dark:text-emerald-400' : 'font-medium text-faint dark:text-muted-ink'}`}>
                           {set.sa || 0}
                         </span>
                       ))}
                     </div>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${isTeamBWonMatch ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' : 'bg-app border-subtle dark:bg-app-dark dark:border-subtle-dark'}`}>
                     <div className="flex items-center gap-3 truncate pr-4">
                       <span className="font-bold text-sm dark:text-primary-dark truncate">{getMemberData(match.teamB_player1)?.name || 'TBD'}</span>
                       <span className="text-muted-ink dark:text-muted-ink">&</span>
                       <span className="font-bold text-sm dark:text-primary-dark truncate">{getMemberData(match.teamB_player2)?.name || 'TBD'}</span>
                     </div>
                     <div className="flex gap-3 items-center shrink-0">
                       {sets.map((set, i) => (
                         <span key={i} className={`font-mono text-lg ${set.sb > set.sa ? 'font-black text-emerald-600 dark:text-emerald-400' : 'font-medium text-faint dark:text-muted-ink'}`}>
                           {set.sb || 0}
                         </span>
                       ))}
                     </div>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-4 sm:border-l sm:border-subtle sm:dark:border-subtle-dark sm:pl-6 w-full sm:w-auto border-t border-subtle dark:border-subtle-dark pt-4 sm:pt-0">
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-bold text-faint uppercase tracking-widest mb-1">{getInitialCourtName(match.courtId) || 'Deleted Court'}</span>
                     <span className="font-mono font-bold text-lg dark:text-primary-dark">{duration} min</span>
                   </div>
                   <div className="flex gap-2">
                     <button disabled={isProcessing} onClick={() => openEditHistoryModal(match)} className="p-2.5 bg-muted hover:bg-accent-soft dark:bg-elevated-dark dark:hover:bg-strong-dark text-muted-ink dark:text-muted-dark rounded-lg transition-colors disabled:opacity-50" title={t('edit_history')}><Edit2 size={16}/></button>
                     <button disabled={isProcessing} onClick={() => setConfirmDeleteMatchId(match.id)} className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 rounded-lg transition-colors disabled:opacity-50" title="Delete Match"><Trash2 size={16}/></button>
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