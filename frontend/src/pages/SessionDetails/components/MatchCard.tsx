import { useState, useEffect } from 'react';
import { Play, Settings as SettingsIcon, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { MatchTimer } from '../utils';

export const MatchCard = ({ match, court, sessionStatus, maxSets, isProcessing, getMemberData, openEditMatchModal, handleAutoGenerateCourt, setSwapCourtModal, setConfirmDeleteMatchId, setConfirmResetMatchId, handleStartMatch, handleFinishMatch, handleReorderQueue, queueIndex, totalQueued, t }: any) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [scores, setScores] = useState({
    a1: match?.scoreTeamA_set1 || '', b1: match?.scoreTeamB_set1 || '',
    a2: match?.scoreTeamA_set2 || '', b2: match?.scoreTeamB_set2 || '',
    a3: match?.scoreTeamA_set3 || '', b3: match?.scoreTeamB_set3 || ''
  });

  useEffect(() => {
    setCurrentSet(1);
    setScores({
      a1: match?.scoreTeamA_set1 || '', b1: match?.scoreTeamB_set1 || '',
      a2: match?.scoreTeamA_set2 || '', b2: match?.scoreTeamB_set2 || '',
      a3: match?.scoreTeamA_set3 || '', b3: match?.scoreTeamB_set3 || ''
    });
  }, [match?.id]);

  if (!match) {
    return (
      <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
        <div className="p-3 flex justify-between items-center border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-primary dark:text-primary-dark tracking-wide">{court?.name || 'Queued'}</h3>
          </div>
          <div className="text-faint dark:text-muted-ink text-[10px] font-bold tracking-widest uppercase">{t('empty', 'EMPTY')}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 px-4">
          <button disabled={sessionStatus !== 'active' || isProcessing} onClick={() => handleAutoGenerateCourt(court.id)} className="px-4 py-2.5 bg-ink hover:bg-ink-soft text-white text-xs font-bold rounded-lg shadow-sm transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed">{t('auto_fill', 'Auto-Fill Courts')}</button>
          <span className="text-[10px] text-faint font-bold uppercase tracking-widest">OR</span>
          <button disabled={sessionStatus !== 'active' || isProcessing} onClick={() => openEditMatchModal({ courtId: court.id, matchType: 'MD' })} className="px-4 py-2.5 bg-muted hover:bg-muted dark:bg-elevated-dark dark:hover:bg-strong-dark text-primary dark:text-primary-dark text-xs font-bold rounded-lg transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed">{t('manual_match', 'Manual Match')}</button>
        </div>
      </div>
    );
  }

  const isActive = match.status === 'on_court';
  const numA = parseInt(scores[`a${currentSet}` as keyof typeof scores]) || 0;
  const numB = parseInt(scores[`b${currentSet}` as keyof typeof scores]) || 0;

  const tAName1 = getMemberData(match.teamA_player1)?.name?.split(' ')[0] || 'TBD';
  const tAName2 = getMemberData(match.teamA_player2)?.name?.split(' ')[0] || '';
  const tBName1 = getMemberData(match.teamB_player1)?.name?.split(' ')[0] || 'TBD';
  const tBName2 = getMemberData(match.teamB_player2)?.name?.split(' ')[0] || '';

  return (
    <div className={`bg-surface dark:bg-surface-dark border ${isActive ? 'border-emerald-300 dark:border-emerald-700 shadow-md ring-2 ring-emerald-500/20' : 'border-subtle dark:border-subtle-dark shadow-sm'} rounded-xl overflow-hidden flex flex-col h-full transition-all`}>
      <div className="p-3 flex justify-between items-center border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-primary dark:text-primary-dark tracking-wide">{court ? court.name : 'Queued'}</h3>
          {!court && <span className="bg-muted dark:bg-elevated-dark text-muted-ink dark:text-muted-dark text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">#{queueIndex + 1}</span>}
          {court && <span className="bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink text-[9px] px-1.5 py-0.5 rounded border border-accent dark:border-strong-dark uppercase tracking-wider font-bold">AUTO</span>}
        </div>
        <div className="flex items-center gap-3">
          {isActive ? <MatchTimer startedAt={match.startedAt} /> : <div className="text-ink dark:text-ink text-[10px] font-bold tracking-widest uppercase">{court ? t('ready', 'READY') : ''}</div>}
          
          {!isActive && (
            <div className="flex items-center gap-1 border-l border-subtle dark:border-default-dark pl-2 ml-1">
              {!court && queueIndex > 0 && (
                <button disabled={isProcessing} onClick={() => handleReorderQueue(queueIndex, 'up')} className="p-1 text-faint hover:text-ink transition-colors disabled:opacity-50"><ChevronUp size={16}/></button>
              )}
              {!court && queueIndex < totalQueued - 1 && (
                <button disabled={isProcessing} onClick={() => handleReorderQueue(queueIndex, 'down')} className="p-1 text-faint hover:text-ink transition-colors disabled:opacity-50"><ChevronDown size={16}/></button>
              )}
              <button disabled={isProcessing} onClick={() => openEditMatchModal(match)} className="p-1 text-faint hover:text-ink transition-colors disabled:opacity-50"><SettingsIcon size={14}/></button>
              <button disabled={isProcessing} onClick={() => setConfirmDeleteMatchId(match.id)} className="p-1 text-faint hover:text-rose-500 transition-colors disabled:opacity-50"><Trash2 size={14}/></button>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        {court && isActive && (
          <div className="flex justify-end mb-3">
            <button disabled={isProcessing} onClick={() => openEditMatchModal(match)} className="p-1.5 border border-subtle dark:border-strong-dark rounded-md bg-app dark:bg-elevated-dark/50 text-muted-ink hover:text-ink dark:hover:text-white transition-colors shadow-sm disabled:opacity-50"><SettingsIcon size={12}/></button>
          </div>
        )}
        
        <div className="flex flex-col mb-4">
          <div className="relative mt-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface dark:bg-surface-dark px-2 text-[10px] text-muted-ink font-black uppercase tracking-widest z-10 border border-subtle dark:border-subtle-dark rounded-full shadow-sm">{match.matchType}</div>
            
            <div className="flex border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm">
              {/* Team A Badge - Highly Visible Blue */}
              <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-center border-r border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-900/40">
                <div className="flex justify-between items-center mb-1.5 gap-2">
                  <span className="font-bold text-xs sm:text-sm truncate text-blue-900 dark:text-blue-100">{getMemberData(match.teamA_player1)?.name || 'TBD'}</span>
                  <span className="text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold bg-white/60 dark:bg-black/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 shrink-0">
                    {getMemberData(match.teamA_player1)?.skillLevel || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm truncate text-blue-900 dark:text-blue-100">{getMemberData(match.teamA_player2)?.name || 'TBD'}</span>
                  <span className="text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold bg-white/60 dark:bg-black/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 shrink-0">
                    {getMemberData(match.teamA_player2)?.skillLevel || '-'}
                  </span>
                </div>
              </div>
              
              {/* Team B Badge - Highly Visible Rose */}
              <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-center bg-rose-100 dark:bg-rose-900/40">
                <div className="flex justify-between items-center mb-1.5 gap-2">
                  <span className="font-bold text-xs sm:text-sm truncate text-rose-900 dark:text-rose-100">{getMemberData(match.teamB_player1)?.name || 'TBD'}</span>
                  <span className="text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold bg-white/60 dark:bg-black/30 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200 shrink-0">
                    {getMemberData(match.teamB_player1)?.skillLevel || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm truncate text-rose-900 dark:text-rose-100">{getMemberData(match.teamB_player2)?.name || 'TBD'}</span>
                  <span className="text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold bg-white/60 dark:bg-black/30 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200 shrink-0">
                    {getMemberData(match.teamB_player2)?.skillLevel || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          {isActive ? (
            <form onSubmit={(e) => { e.preventDefault(); if(!isProcessing) handleFinishMatch(match.id, true, scores, court?.id); }} className="w-full flex flex-col gap-2 mt-auto">
              <div className="bg-app dark:bg-app-dark border border-subtle dark:border-subtle-dark p-3 rounded-xl relative">
                {maxSets > 1 && (
                  <div className="flex items-center justify-between mb-3 bg-surface dark:bg-surface-dark rounded-md p-1 border border-subtle dark:border-subtle-dark">
                    <button type="button" onClick={() => setCurrentSet(c => c - 1)} disabled={currentSet <= 1 || isProcessing} className="p-1 text-muted-ink hover:text-ink disabled:opacity-30 transition-colors"><ChevronLeft size={14}/></button>
                    <span className="text-[9px] font-bold text-muted-ink dark:text-muted-dark uppercase tracking-widest">Set {currentSet} of {maxSets}</span>
                    <button type="button" onClick={() => setCurrentSet(c => c + 1)} disabled={currentSet >= maxSets || isProcessing} className="p-1 text-muted-ink hover:text-ink disabled:opacity-30 transition-colors"><ChevronRight size={14}/></button>
                  </div>
                )}
                
                {/* Visual UI scoring enhancement! */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex flex-col items-center bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-inner">
                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 mb-2 truncate w-full text-center tracking-wide uppercase">
                      {tAName1} {match.teamA_player2 && `& ${tAName2}`}
                    </span>
                    <input 
                      type="number" placeholder="0" disabled={isProcessing}
                      onWheel={(e) => e.currentTarget.blur()}
                      value={scores[`a${currentSet}` as keyof typeof scores]} 
                      onChange={(e) => setScores(p => ({...p, [`a${currentSet}`]: e.target.value}))} 
                      className={`w-full bg-white dark:bg-app-dark border-2 ${numA > numB && numA > 0 ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-blue-100 dark:border-blue-900/50 text-blue-900 dark:text-blue-100 focus:border-blue-400'} rounded-lg py-3 sm:py-4 text-center font-black text-3xl outline-none transition-all disabled:opacity-50 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} 
                    />
                  </div>

                  <div className="text-faint dark:text-muted-dark font-black text-sm uppercase tracking-widest shrink-0">VS</div>

                  <div className="flex-1 flex flex-col items-center bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 shadow-inner">
                    <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 mb-2 truncate w-full text-center tracking-wide uppercase">
                      {tBName1} {match.teamB_player2 && `& ${tBName2}`}
                    </span>
                    <input 
                      type="number" placeholder="0" disabled={isProcessing}
                      onWheel={(e) => e.currentTarget.blur()}
                      value={scores[`b${currentSet}` as keyof typeof scores]} 
                      onChange={(e) => setScores(p => ({...p, [`b${currentSet}`]: e.target.value}))} 
                      className={`w-full bg-white dark:bg-app-dark border-2 ${numB > numA && numB > 0 ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-rose-100 dark:border-rose-900/50 text-rose-900 dark:text-rose-100 focus:border-rose-400'} rounded-lg py-3 sm:py-4 text-center font-black text-3xl outline-none transition-all disabled:opacity-50 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} 
                    />
                  </div>
                </div>

              </div>
              <button type="submit" disabled={isProcessing} className="w-full bg-ink hover:bg-ink-soft text-white py-3 rounded-lg text-sm font-bold transition-colors shadow-sm mt-2 disabled:opacity-50">
                {t('finish_free_court', 'Finish & Free Court')}
              </button>
              <button type="button" disabled={isProcessing} onClick={() => setConfirmResetMatchId(match.id)} className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 py-2.5 rounded-lg text-xs font-bold transition-colors mt-1 disabled:opacity-50">
                Cancel Match
              </button>
            </form>
          ) : court ? (
            <div className="w-full flex gap-2 mt-auto">
              <button disabled={isProcessing} onClick={() => setSwapCourtModal(match)} className="p-2.5 border border-subtle dark:border-subtle-dark rounded-lg text-faint hover:bg-app dark:hover:bg-elevated-dark dark:hover:text-white transition-colors disabled:opacity-50" title="Manage Court"><ArrowRightLeft size={16}/></button>
              <button onClick={() => handleStartMatch(match.id)} disabled={isProcessing || sessionStatus !== 'active'} className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <Play fill="currentColor" size={14}/> {t('start', 'Start')}
              </button>
            </div>
          ) : (
            <button disabled={isProcessing || sessionStatus !== 'active'} onClick={() => setSwapCourtModal(match)} className="w-full mt-auto py-2.5 bg-accent-soft hover:bg-accent-soft dark:bg-elevated-dark dark:hover:bg-strong-dark text-ink dark:text-primary-dark rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Move to Court
            </button>
          )}
        </div>
      </div>
    </div>
  );
};