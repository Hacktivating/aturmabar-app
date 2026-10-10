import { useMemo, useState } from 'react';
import { Plus, ListOrdered, Zap, AlertTriangle, Pause, X, RotateCcw, CircleHelp } from 'lucide-react';
import { MatchCard } from '../components/MatchCard';
import { MatchTimer, getGradeColor } from '../utils';

export const MatchesTab = ({
  session, courts, matches, activeMatches, queuedMatchesList, finishedMatches,
  waitingListPlayers, maxSets, isProcessing, getMemberData, getInitialCourtName,
  openEditMatchModal, openEditHistoryModal, handleAutoGenerateCourt, handleAutoFillEmptySlots, setSwapCourtModal,
  setConfirmDeleteMatchId, setConfirmResetMatchId, handleStartMatch, handleFinishMatch,
  handleReorderQueue, handleQueueMatch, handleAutoFillAllCourts, handleUpdateSparringMatch, handleAddPreviewMatch,
  updateAttendanceStatus, handleUpdateSessionRule, t
}: any) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [explanationMatch, setExplanationMatch] = useState<any>(null);
  const [addedPreviewIndexes, setAddedPreviewIndexes] = useState<number[]>([]);
  const previewGroups = useMemo(() => Array.from({ length: Math.min(3, Math.floor(waitingListPlayers.length / 4)) }, (_, index) => waitingListPlayers.slice(index * 4, index * 4 + 4)), [waitingListPlayers]);

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
                <span className="text-[8px] font-bold text-faint uppercase tracking-widest mt-1">{String(t('played', { defaultValue: 'Played' }))}</span>
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
                title={String(t('set_resting', { defaultValue: 'Set to Resting' }))}
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
                    
                    {/* Home Team (Blue) */}
                    <td className="px-4 py-3">
                       <div onClick={() => openEditMatchModal(m)} className="cursor-pointer hover:opacity-80 transition-opacity">
                         {isTeamA ? (
                           <div className="flex flex-col gap-1">
                             <span className="font-bold text-blue-600 dark:text-blue-400 truncate">{getMemberData(m.teamA_player1)?.name || 'TBD'}</span>
                             <span className="font-bold text-blue-600 dark:text-blue-400 truncate">{getMemberData(m.teamA_player2)?.name || 'TBD'}</span>
                           </div>
                         ) : (
                           <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><Plus size={14}/> Add Home</span>
                         )}
                       </div>
                    </td>

                    {/* Away Team (Rose) */}
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
          <AlertTriangle size={18} className="mr-2" /> {String(t('session_not_started', { defaultValue: 'Start the session to enable matchmaking.' }))}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className={`flex-1 w-full flex flex-col gap-8 ${session?.sessionType !== 'sparring' ? 'pb-24' : ''}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">{String(t('matches', { defaultValue: 'Matches' }))}</h2>
              {/* NEW ON-THE-FLY STRICTNESS DROPDOWN */}
              {session?.sessionType !== 'sparring' && session?.status === 'active' && (
                <select 
                  value={session?.pairingRule || 'strict'} 
                  onChange={(e) => handleUpdateSessionRule(e.target.value)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-app dark:bg-elevated-dark border border-subtle dark:border-strong-dark rounded-lg text-xs font-bold text-muted-ink dark:text-muted-dark outline-none cursor-pointer hover:border-ink transition-colors disabled:opacity-50"
                  title="Matchmaking Strictness"
                >
                  <option value="very_strict">Very Strict</option>
                  <option value="strict">Strict</option>
                  <option value="moderate">Moderate</option>
                  <option value="randomize">Randomize</option>
                </select>
              )}
            </div>

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
                      handleAutoFillEmptySlots={handleAutoFillEmptySlots}
                      onExplainMatch={setExplanationMatch}
                      t={t}
                    />
                  );
                })}
              </div>
              
              {queuedMatchesList.length > 0 && (
                <div className="animate-in fade-in">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">{String(t('waiting_list', { defaultValue: 'Waiting List' }))} <span className="bg-muted dark:bg-elevated-dark text-muted-ink dark:text-muted-dark text-xs px-2.5 py-0.5 rounded-full font-bold">{queuedMatchesList.length}</span></h3>
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
                        handleAutoFillEmptySlots={handleAutoFillEmptySlots}
                        onExplainMatch={setExplanationMatch}
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
              <h3 className="font-bold text-sm tracking-wide text-primary dark:text-primary-dark uppercase">{String(t('available_players', { defaultValue: 'Available Players' }))}</h3>
              <span className="bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark font-bold px-2 py-0.5 rounded-full text-xs">{waitingListPlayers.length}</span>
            </div>
            {renderWaitingListContent()}
          </div>
        )}

        {session?.sessionType !== 'sparring' && (
          <div className="fixed bottom-3 left-1/2 z-[120] w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 pointer-events-none sm:w-[calc(100%-2rem)]">
            <div className="pointer-events-auto rounded-2xl border border-subtle bg-surface/95 p-2 shadow-2xl shadow-black/20 backdrop-blur-md dark:border-zinc-700 dark:bg-[#18181b]/95 sm:p-3">
              <div className="mb-1 hidden px-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-ink dark:text-zinc-500 sm:block">Quick match actions</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button type="button" disabled={session?.status !== 'active' || isProcessing} onClick={() => openEditMatchModal({ courtId: null, matchType: 'MD' })} className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-subtle bg-surface px-2 py-2 text-[10px] font-black text-primary shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-[#121214] dark:text-white dark:hover:bg-zinc-800 sm:min-h-12 sm:px-4 sm:text-sm"><Plus size={16} /> <span className="truncate">Manual</span></button>
                <button type="button" disabled={session?.status !== 'active' || isProcessing} onClick={handleQueueMatch} className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-2 py-2 text-[10px] font-black text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-12 sm:px-4 sm:text-sm"><ListOrdered size={16} /> <span className="truncate">Auto Queue</span></button>
                <button type="button" disabled={session?.status !== 'active' || isProcessing} onClick={handleAutoFillAllCourts} className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2 py-2 text-[10px] font-black text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-12 sm:px-4 sm:text-sm"><Zap size={16} /> <span className="truncate">Auto Fill</span></button>
                <button type="button" onClick={() => setIsPreviewOpen(true)} className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-subtle bg-surface px-2 py-2 text-[10px] font-black text-primary shadow-sm transition-colors hover:bg-muted dark:border-zinc-700 dark:bg-[#121214] dark:text-white dark:hover:bg-zinc-800 sm:min-h-12 sm:px-4 sm:text-sm"><CircleHelp size={16} /> <span className="truncate">Preview</span></button>
              </div>
            </div>
          </div>
        )}

        {isPreviewOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="matches-preview-title">
            <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-subtle bg-surface shadow-2xl dark:border-zinc-800 dark:bg-[#0f0f11] sm:rounded-3xl">
              <div className="flex items-start justify-between border-b border-subtle bg-app px-5 py-4 dark:border-zinc-800 dark:bg-[#121214] sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-widest text-muted-ink dark:text-zinc-500">Matchmaking preview</p><h2 id="matches-preview-title" className="mt-1 text-xl font-black text-primary dark:text-white">Next available groups</h2><p className="mt-1 text-xs font-medium text-muted-ink dark:text-zinc-400">Preview only. No match is created.</p></div><button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-full p-2 text-muted-ink hover:bg-muted dark:text-zinc-400 dark:hover:bg-zinc-800"><X size={20}/></button></div>
              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                {previewGroups.length === 0 ? <div className="rounded-2xl border border-dashed border-subtle p-10 text-center text-sm font-bold text-muted-ink dark:border-zinc-800 dark:text-zinc-500">Not enough idle players for a preview.</div> : <div className="space-y-4">{previewGroups.map((group: any[], index: number) => {
                  const alreadyAdded = addedPreviewIndexes.includes(index);
                  return <div key={index} className="rounded-2xl border border-subtle bg-app p-4 dark:border-zinc-800 dark:bg-[#121214]"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-widest text-muted-ink dark:text-zinc-500">Preview match {index + 1}</span><span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-black text-ink dark:bg-zinc-800 dark:text-zinc-200">Least played first</span></div><div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">{group.map((player: any) => <div key={player.id} className="min-w-0 rounded-xl border border-subtle bg-surface px-3 py-2 dark:border-zinc-700 dark:bg-[#18181b]"><div className="truncate text-sm font-bold text-primary dark:text-white">{player.name}</div><div className="mt-1 text-[10px] font-bold text-muted-ink dark:text-zinc-500">{player.skillLevel} · {player.gamesPlayed} played</div></div>)}</div><button type="button" disabled={alreadyAdded || isProcessing || !handleAddPreviewMatch} onClick={async () => { const added = await handleAddPreviewMatch(group); if (added !== false) setAddedPreviewIndexes(previous => [...previous, index]); }} className={`mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-black transition-colors disabled:cursor-not-allowed ${alreadyAdded ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-ink text-white hover:bg-ink-soft dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'}`}>{alreadyAdded ? 'Added to queue' : 'Add this match to queue'}</button></div>;
                })}</div>}
              </div>
              <div className="flex justify-end border-t border-subtle bg-app px-5 py-4 dark:border-zinc-800"><button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-xl bg-ink px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-zinc-900">Close</button></div>
            </div>
          </div>
        )}

        {explanationMatch && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-end bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="match-explanation-title">
            <div className="flex h-full w-full max-w-md flex-col border-l border-subtle bg-surface shadow-2xl dark:border-zinc-800 dark:bg-[#0f0f11] sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border"><div className="flex items-start justify-between border-b border-subtle bg-app px-5 py-4 dark:border-zinc-800 dark:bg-[#121214]"><div><p className="text-[10px] font-black uppercase tracking-widest text-muted-ink dark:text-zinc-500">Organizer view</p><h2 id="match-explanation-title" className="mt-1 text-xl font-black text-primary dark:text-white">Why this match?</h2></div><button type="button" onClick={() => setExplanationMatch(null)} className="rounded-full p-2 text-muted-ink hover:bg-muted dark:text-zinc-400 dark:hover:bg-zinc-800"><X size={20}/></button></div><div className="space-y-4 overflow-y-auto p-6"><div className="rounded-2xl border border-subtle bg-app p-4 dark:border-zinc-800 dark:bg-[#121214]"><p className="text-xs font-bold uppercase tracking-widest text-muted-ink dark:text-zinc-500">Status</p><p className="mt-1 text-lg font-black text-primary dark:text-white">{explanationMatch.status === 'on_court' ? 'Playing' : explanationMatch.status === 'finished' ? 'Finished' : 'Queued'}</p></div><div className="space-y-3 text-sm font-medium leading-relaxed text-muted-ink dark:text-zinc-400"><p>• Players already in another active match are excluded.</p><p>• Lower games played is prioritized for the next selection.</p><p>• Grade proximity follows the selected matchmaking strictness.</p><p>• This view explains the inputs only; it does not change match generation.</p></div></div></div>
          </div>
        )}
      </div>
    </div>
  );
};
