import React, { useMemo } from 'react';
import { Plus, ListOrdered, Zap, AlertTriangle, ArrowRightLeft, Pause, Users, X, RotateCcw } from 'lucide-react';
import { MatchCard } from '../components/MatchCard';
import { MatchTimer, getGradeColor, getMatchTypeColor } from '../utils';

export const MatchesTab = ({
  session, communityData, courts, matches, activeMatches, queuedMatchesList, finishedMatches,
  waitingListPlayers, maxSets, isProcessing, getMemberData, getInitialCourtName,
  openEditMatchModal, openEditHistoryModal, handleAutoGenerateCourt, setSwapCourtModal,
  setConfirmDeleteMatchId, setConfirmResetMatchId, handleStartMatch, handleFinishMatch,
  handleReorderQueue, handleQueueMatch, handleAutoFillAllCourts, handleUpdateSparringMatch,
  updateAttendanceStatus, isWaitingListOpen, setIsWaitingListOpen, t
}: any) => {

  const sparringScore = useMemo(() => {
    let homeMatches = 0, awayMatches = 0;
    let homeSets = 0, awaySets = 0;
    let homePoints = 0, awayPoints = 0;

    finishedMatches.forEach((m: any) => {
      let hSets = 0, aSets = 0;
      let hPts = 0, aPts = 0;

      for (let i = 1; i <= maxSets; i++) {
        const sa = m[`scoreTeamA_set${i}`] || 0; 
        const sb = m[`scoreTeamB_set${i}`] || 0; 
        if (sa > 0 || sb > 0 || i === 1) {
          hPts += sa; aPts += sb;
          if (sa > sb) hSets++;
          else if (sb > sa) aSets++;
        }
      }
      
      homeSets += hSets; awaySets += aSets;
      homePoints += hPts; awayPoints += aPts;

      if (hSets > aSets) homeMatches++;
      else if (aSets > hSets) awayMatches++;
    });

    return { homeMatches, awayMatches, homeSets, awaySets, homePoints, awayPoints };
  }, [finishedMatches, maxSets]);

  const renderWaitingListContent = () => (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      {waitingListPlayers.length === 0 ? (
        <div className="p-8 text-center text-faint text-sm font-medium">No available players waiting.</div>
      ) : (
        waitingListPlayers.map((p: any) => (
          <div key={p.id} className="p-3 bg-surface dark:bg-app-dark border border-subtle dark:border-subtle-dark rounded-xl flex justify-between items-center shadow-sm">
            <div className="flex flex-col min-w-0 pr-3 flex-1">
              <span className="font-bold text-sm truncate dark:text-primary-dark">{p.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(p.skillLevel)}`}>{p.skillLevel}</span>
                <span className="text-[10px] text-faint">{new Date(p.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center group relative cursor-help px-2 border-x border-subtle dark:border-subtle-dark">
                <span className="font-black text-xl leading-none text-ink dark:text-ink-dark">{p.gamesPlayed}</span>
                <span className="text-[8px] font-bold text-faint uppercase tracking-widest mt-1">{t('played', 'Played')}</span>
                <div className="hidden group-hover:block absolute bottom-full mb-2 right-0 bg-elevated dark:bg-strong-dark text-white p-2.5 rounded-lg shadow-xl text-xs z-50 whitespace-nowrap border dark:border-default-dark dark:border-strong-dark">
                  <div className="font-bold mb-1 border-b dark:border-strong-dark pb-1">{p.name}</div>
                  <div className="flex justify-between gap-4"><span>Finished:</span> <span>{p.finishedCount}</span></div>
                  <div className="flex justify-between gap-4 text-emerald-400"><span>Ongoing:</span> <span>{p.ongoingCount}</span></div>
                </div>
              </div>
              <button 
                disabled={isProcessing}
                onClick={() => updateAttendanceStatus(p.attendanceId, 'resting')}
                className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition-colors flex items-center justify-center disabled:opacity-50"
                title={t('set_resting', 'Set to Resting')}
              >
                <Pause size={14} fill="currentColor" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSparringTable = (matchType: string, label: string) => {
    const typeMatches = (session.sessionType === 'sparring' ? [...activeMatches, ...finishedMatches, ...queuedMatchesList] : matches)
      .filter((m: any) => m.matchType === matchType).sort((a: any, b: any) => a.id - b.id);
      
    if (typeMatches.length === 0) return null;

    return (
      <div className="mb-8 overflow-hidden bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm">
        <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
          <h3 className="font-bold text-lg text-primary dark:text-primary-dark tracking-wide">{label}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-faint uppercase bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark tracking-widest font-bold">
              <tr>
                <th className="px-4 py-3 w-16">Match</th>
                <th className="px-4 py-3 min-w-[200px]">Home Team</th>
                <th className="px-4 py-3 min-w-[200px]">Away Team</th>
                <th className="px-4 py-3 w-40">Court</th>
                <th className="px-4 py-3 w-32 text-center">Score</th>
                <th className="px-4 py-3 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
              {typeMatches.map((m: any) => {
                const isTeamA = m.teamA_player1 || m.teamA_player2;
                const isTeamB = m.teamB_player1 || m.teamB_player2;

                return (
                  <tr key={m.id} className={`hover:bg-app dark:hover:bg-elevated-dark/30 transition-colors ${m.status === 'on_court' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    <td className="px-4 py-3 font-bold text-muted-ink dark:text-muted-dark whitespace-nowrap">{m.name}</td>
                    
                    {/* Home Team */}
                    <td className="px-4 py-3">
                       <div onClick={() => openEditMatchModal(m)} className="cursor-pointer hover:opacity-80 transition-opacity">
                         {isTeamA ? (
                           <div className="flex flex-col gap-1">
                             <span className="font-bold text-primary dark:text-white truncate">{getMemberData(m.teamA_player1)?.name || 'TBD'}</span>
                             <span className="font-bold text-primary dark:text-white truncate">{getMemberData(m.teamA_player2)?.name || 'TBD'}</span>
                           </div>
                         ) : (
                           <span className="text-xs font-bold text-ink dark:text-ink-dark flex items-center gap-1"><Plus size={14}/> Add Home</span>
                         )}
                       </div>
                    </td>

                    {/* Away Team */}
                    <td className="px-4 py-3">
                       <div onClick={() => openEditMatchModal(m)} className="cursor-pointer hover:opacity-80 transition-opacity">
                         {isTeamB ? (
                           <div className="flex flex-col gap-1">
                             <span className="font-bold text-rose-600 dark:text-rose-400 truncate">{getMemberData(m.teamB_player1)?.name || 'TBD'}</span>
                             <span className="font-bold text-rose-600 dark:text-rose-400 truncate">{getMemberData(m.teamB_player2)?.name || 'TBD'}</span>
                           </div>
                         ) : (
                           <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><Plus size={14}/> Add Away</span>
                         )}
                       </div>
                    </td>

                    {/* Court Selector */}
                    <td className="px-4 py-3">
                      {m.status === 'queued' ? (
                        <select 
                          value={m.courtId || ''} 
                          onChange={(e) => {
                            const targetId = parseInt(e.target.value) || null;
                            if (targetId) {
                               const isOccupied = activeMatches.some((am: any) => am.courtId === targetId && am.status === 'on_court');
                               if (isOccupied) {
                                  alert("Cannot move to this court because a match is currently ongoing. Please finish or cancel it first.");
                                  return;
                               }
                            }
                            handleUpdateSparringMatch(m.id, { courtId: targetId });
                          }}
                          className="w-full px-2 py-1.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded outline-none text-xs font-bold focus:ring-1 focus:ring-ink"
                        >
                          <option value="">No Court</option>
                          {courts.filter((c: any) => c.isActive).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-muted-ink uppercase tracking-widest">{getInitialCourtName(m.courtId)}</span>
                           {m.status === 'on_court' && <MatchTimer startedAt={m.startedAt} />}
                        </div>
                      )}
                    </td>

                    {/* Score / Status */}
                    <td className="px-4 py-3 text-center font-bold">
                       {m.status === 'queued' && <span className="text-faint text-xs uppercase tracking-widest">Waiting</span>}
                       {m.status === 'on_court' && <span className="text-blue-500 animate-pulse text-xs uppercase tracking-widest">Playing</span>}
                       {m.status === 'finished' && (
                         <div className="flex flex-col text-xs font-black">
                           {[1, 2, 3].map(i => {
                             const sa = m[`scoreTeamA_set${i}`]; const sb = m[`scoreTeamB_set${i}`];
                             if (!sa && !sb && i > 1) return null;
                             return <span key={i} className="whitespace-nowrap">{sa || 0} - {sb || 0}</span>;
                           })}
                         </div>
                       )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                       {m.status === 'queued' && (
                         <button 
                           onClick={() => handleUpdateSparringMatch(m.id, { status: 'on_court' })} 
                           disabled={!m.courtId || (!isTeamA && !isTeamB)}
                           className="px-3 py-1.5 bg-ink text-white rounded text-xs font-bold shadow-sm hover:bg-ink-soft disabled:opacity-50"
                         >Start</button>
                       )}
                       {m.status === 'on_court' && (
                         <div className="flex justify-end gap-1.5">
                           <button onClick={() => setConfirmResetMatchId(m.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded shadow-sm hover:bg-rose-100" title="Reset Match"><RotateCcw size={14} /></button>
                           <button onClick={() => openEditHistoryModal(m)} className="px-3 py-1.5 bg-emerald-500 text-white rounded text-xs font-bold shadow-sm hover:bg-emerald-600">Finish</button>
                         </div>
                       )}
                       {m.status === 'finished' && (
                         <button onClick={() => openEditHistoryModal(m)} className="px-3 py-1.5 bg-surface dark:bg-app-dark border border-subtle dark:border-subtle-dark text-primary dark:text-primary-dark rounded text-xs font-bold shadow-sm hover:bg-app">Edit</button>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-200 relative">
      {session?.status !== 'active' && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-500 p-4 rounded-xl mb-6 font-bold flex items-center justify-center shadow-sm">
          <AlertTriangle size={18} className="mr-2" /> {t('session_not_started', 'Start the session to enable matchmaking.')}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold">{t('matches')}</h2>

            {session?.sessionType !== 'sparring' && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button disabled={session?.status !== 'active' || isProcessing} onClick={() => openEditMatchModal({ courtId: null, matchType: 'MD' })} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-surface dark:bg-elevated-dark hover:bg-app dark:hover:bg-strong-dark border border-subtle dark:border-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus size={16}/> {t('manual_match', 'Manual Match')}
                </button>
                <button disabled={session?.status !== 'active' || isProcessing} onClick={handleQueueMatch} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-muted dark:bg-elevated-dark hover:bg-elevated dark:hover:bg-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <ListOrdered size={16}/> {t('queue_match')}
                </button>
                <button disabled={session?.status !== 'active' || isProcessing} onClick={handleAutoFillAllCourts} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-dark dark:text-white dark:hover:bg-primary-dark">
                  <Zap size={16}/> {t('auto_fill')}
                </button>
              </div>
            )}
          </div>

          {session?.sessionType === 'sparring' && session?.matchQuotas && (
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl text-center shadow-sm">
                <p className="text-xs font-bold text-muted-ink uppercase tracking-wider mb-1">MD Matches</p>
                <p className="text-xl font-black text-primary dark:text-primary-dark">{finishedMatches.filter((m: any) => m.matchType === 'MD').length} <span className="text-faint">/ {session.matchQuotas.MD || 0}</span></p>
              </div>
              <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl text-center shadow-sm">
                <p className="text-xs font-bold text-muted-ink uppercase tracking-wider mb-1">WD Matches</p>
                <p className="text-xl font-black text-primary dark:text-primary-dark">{finishedMatches.filter((m: any) => m.matchType === 'WD').length} <span className="text-faint">/ {session.matchQuotas.WD || 0}</span></p>
              </div>
              <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl text-center shadow-sm">
                <p className="text-xs font-bold text-muted-ink uppercase tracking-wider mb-1">XD Matches</p>
                <p className="text-xl font-black text-primary dark:text-primary-dark">{finishedMatches.filter((m: any) => m.matchType === 'XD').length} <span className="text-faint">/ {session.matchQuotas.XD || 0}</span></p>
              </div>
            </div>
          )}

          {session?.sessionType === 'sparring' ? (
            <div className="flex flex-col">
              {renderSparringTable('MD', "Men's Doubles (MD)")}
              {renderSparringTable('WD', "Women's Doubles (WD)")}
              {renderSparringTable('XD', "Mixed Doubles (XD)")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {courts.filter((c: any) => c.isActive).map((court: any) => {
                  const activeMatch = activeMatches.find((m: any) => m.courtId === court.id);
                  const queuedMatch = queuedMatchesList.find((m: any) => m.courtId === court.id);
                  const displayMatch = activeMatch || queuedMatch;
                  
                  return (
                    <MatchCard 
                      key={court.id} 
                      match={displayMatch} 
                      court={court} 
                      maxSets={maxSets}
                      sessionStatus={session?.status}
                      isProcessing={isProcessing}
                      getMemberData={getMemberData}
                      openEditMatchModal={openEditMatchModal}
                      handleFinishMatch={handleFinishMatch}
                      setConfirmDeleteMatchId={setConfirmDeleteMatchId}
                      setConfirmResetMatchId={setConfirmResetMatchId}
                      setSwapCourtModal={setSwapCourtModal}
                      handleStartMatch={handleStartMatch}
                      handleAutoGenerateCourt={handleAutoGenerateCourt}
                      t={t}
                    />
                  );
                })}
              </div>
              
              {queuedMatchesList.length > 0 && (
                <div className="animate-in fade-in">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Waiting List <span className="bg-muted dark:bg-elevated-dark text-muted-ink dark:text-muted-dark text-xs px-2.5 py-0.5 rounded-full font-bold">{queuedMatchesList.length}</span></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {queuedMatchesList.map((match: any, index: number) => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        court={null} 
                        maxSets={maxSets} 
                        sessionStatus={session?.status} 
                        isProcessing={isProcessing} 
                        getMemberData={getMemberData} 
                        openEditMatchModal={openEditMatchModal} 
                        handleFinishMatch={handleFinishMatch} 
                        setConfirmDeleteMatchId={setConfirmDeleteMatchId} 
                        setConfirmResetMatchId={setConfirmResetMatchId}
                        setSwapCourtModal={setSwapCourtModal} 
                        handleStartMatch={handleStartMatch} 
                        handleAutoGenerateCourt={handleAutoGenerateCourt} 
                        handleReorderQueue={handleReorderQueue}
                        queueIndex={index}
                        totalQueued={queuedMatchesList.length}
                        t={t} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {session?.sessionType !== 'sparring' && (
          <div className="hidden lg:flex w-80 shrink-0 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm flex-col h-[calc(100vh-140px)] sticky top-24 overflow-hidden">
            <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm tracking-wide text-primary dark:text-primary-dark uppercase">{t('available_players', 'Available Players')}</h3>
              <span className="bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark font-bold px-2 py-0.5 rounded-full text-xs">{waitingListPlayers.length}</span>
            </div>
            {renderWaitingListContent()}
          </div>
        )}

        {session?.sessionType !== 'sparring' && (
          <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center lg:hidden pointer-events-none">
            <button 
              onClick={() => setIsWaitingListOpen(true)} 
              className="pointer-events-auto bg-ink shadow-xl shadow-blue-600/30 text-white px-6 py-3.5 rounded-full font-bold flex items-center gap-3 transition-transform active:scale-95"
            >
              <Users size={18} />
              {t('waiting_list', 'Waiting List')}
              <span className="bg-surface text-ink px-2.5 py-0.5 rounded-full text-xs font-black">{waitingListPlayers.length}</span>
            </button>
          </div>
        )}

        <div className={`fixed inset-0 z-[100] bg-ink/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isWaitingListOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsWaitingListOpen(false)} />
        <div className={`fixed inset-y-0 right-0 z-[110] w-full max-w-[320px] bg-app dark:bg-surface-dark shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col border-l border-subtle dark:border-subtle-dark ${isWaitingListOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-app-dark flex justify-between items-center shrink-0 mt-safe">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-primary dark:text-primary-dark uppercase">{t('available_players', 'Available')}</h3>
                <span className="bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark font-bold px-2 py-0.5 rounded-full text-xs">{waitingListPlayers.length}</span>
              </div>
              <button onClick={() => setIsWaitingListOpen(false)} className="p-2 text-faint hover:text-muted-ink bg-muted dark:bg-elevated-dark rounded-full"><X size={18}/></button>
           </div>
           {renderWaitingListContent()}
        </div>
      </div>
    </div>
  );
};