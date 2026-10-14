import { useEffect, useMemo, useState } from 'react';
import { Plus, ListOrdered, Zap, AlertTriangle, Pause, X, RotateCcw, CircleHelp } from 'lucide-react';
import { MatchCard } from '../components/MatchCard';
import { MatchTimer, getGradeColor } from '../utils';

export const MatchesTab = ({
  session, courts, matches, activeMatches, queuedMatchesList, finishedMatches,
  waitingListPlayers, maxSets, isProcessing, getMemberData, getInitialCourtName,
  openEditMatchModal, openEditHistoryModal, handleAutoGenerateCourt, handleAutoFillEmptySlots, setSwapCourtModal,
  setConfirmDeleteMatchId, setConfirmResetMatchId, handleStartMatch, handleFinishMatch,
  handleReorderQueue, handleQueueMatch, handleAutoFillAllCourts, handleUpdateSparringMatch, handleAddPreviewMatch, handleUndoPreviewMatch, handleRefreshPreview,
  updateAttendanceStatus, handleUpdateSessionRule, t
}: any) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [explanationMatch, setExplanationMatch] = useState<any>(null);
  const [reservedPreviewPlayerIds, setReservedPreviewPlayerIds] = useState<number[]>([]);
  const [previewToast, setPreviewToast] = useState<{ matchId: number; playerIds: number[] } | null>(null);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
  const [previewCycle, setPreviewCycle] = useState(0);
  useEffect(() => {
    if (!previewToast) return undefined;
    const timer = window.setTimeout(() => setPreviewToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [previewToast]);
  const previewPool = useMemo(() => waitingListPlayers.filter((player: any) => !reservedPreviewPlayerIds.includes(Number(player.id))), [waitingListPlayers, reservedPreviewPlayerIds]);
  const previewGroups = useMemo(() => {
    if (previewPool.length < 4) return [];
    const offset = previewPool.length > 4 ? previewCycle % previewPool.length : 0;
    const rotatedPool = offset === 0 ? previewPool : [...previewPool.slice(offset), ...previewPool.slice(0, offset)];
    return Array.from({ length: Math.min(3, Math.floor(rotatedPool.length / 4)) }, (_, index) => rotatedPool.slice(index * 4, index * 4 + 4));
  }, [previewPool, previewCycle]);

  const getMatchExplanation = (match: any) => {
    const playerIds = [match.teamA_player1, match.teamA_player2, match.teamB_player1, match.teamB_player2].filter(Boolean).map(Number);
    const players = playerIds.map(playerId => getMemberData(playerId)).filter(Boolean);
    const names = players.map((player: any) => player.name).filter(Boolean);
    const grades = players.map((player: any) => player.skillLevel).filter(Boolean);
    const gradeSet = [...new Set(grades)];
    const waitingStats = players.map((player: any) => waitingListPlayers.find((waiting: any) => Number(waiting.id) === Number(player.id))).filter(Boolean);
    const playedValues = waitingStats.map((player: any) => Number(player.gamesPlayed)).filter(Number.isFinite);
    const lowestPlayed = playedValues.length ? Math.min(...playedValues) : null;
    const highestPlayed = playedValues.length ? Math.max(...playedValues) : null;
    const status = match.status === 'on_court' ? 'playing' : match.status === 'finished' ? 'finished' : 'queued';
    const strictness = session?.pairingRule;
    const isSparring = session?.sessionType === 'sparring';
    const nameLine = names.length ? names.slice(0, 4).join(', ').replace(/, ([^,]*)$/, ' and $1') : 'the selected players';
    const variations = [
      `This group is a practical next step for ${nameLine}. It keeps the session moving while leaving the court in front of them undisturbed.`,
      `The pairing looks like a sensible fit for the current queue: ${nameLine} are grouped without pulling players out of an ongoing game.`,
      `This is a balanced-looking option for the next turn. The goal here is to give ${nameLine} a fair opportunity while the rotation continues.`,
      `The organizer view points to this group because it fits the next available turn, rather than forcing a reshuffle of matches already in progress.`
    ];
    const lead = variations[Number(match.id || 0) % variations.length];
    const details: string[] = [];
    if (status === 'playing') details.push('The match is already on court, so the player assignments are being kept stable until it is finished or canceled.');
    else if (status === 'finished') details.push('This is a record of a completed match; the notes below describe the selection context, not a new recommendation.');
    else details.push('The match is waiting for its turn and can be moved or edited without changing any match that is currently playing.');
    if (!isSparring && strictness) {
      const strictLabel = strictness === 'very_strict' ? 'Very Strict' : strictness === 'strict' ? 'Strict' : strictness === 'moderate' ? 'Moderate' : 'Randomize';
      details.push(strictness === 'randomize' ? 'The session is using a more flexible rotation, so grade similarity is not treated as the only deciding factor.' : `The ${strictLabel} setting gives grade compatibility a ${strictness === 'very_strict' ? 'very strong' : 'strong'} influence when the next group is chosen.`);
    } else if (isSparring) {
      details.push('This is a sparring fixture, so the two sides follow the session sequence instead of the normal grade-based rotation.');
    }
    if (gradeSet.length === 1 && gradeSet[0]) details.push(`Everyone shown here is in ${gradeSet[0]}, which keeps the level of play consistent.`);
    else if (gradeSet.length > 1) details.push(`The group spans ${gradeSet.join(' and ')}; that wider mix is shown here so you can review the trade-off before starting it.`);
    if (lowestPlayed !== null && highestPlayed !== null) {
      details.push(lowestPlayed === highestPlayed ? `The visible rotation counts are even at ${lowestPlayed} game${lowestPlayed === 1 ? '' : 's'} played.` : `The visible rotation counts range from ${lowestPlayed} to ${highestPlayed} games played, helping the next turn stay reasonably even.`);
    } else {
      details.push('Recent-turn counts are kept in the waiting-list view, where you can compare who has played least before making a change.');
    }
    return { lead, details };
  };

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
                      openEditHistoryModal={openEditHistoryModal}
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
                        openEditMatchModal={openEditMatchModal} openEditHistoryModal={openEditHistoryModal}
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
              <div className="flex items-start justify-between border-b border-subtle bg-app px-5 py-4 dark:border-zinc-800 dark:bg-[#121214] sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-widest text-muted-ink dark:text-zinc-500">Matchmaking preview</p><h2 id="matches-preview-title" className="mt-1 text-xl font-black text-primary dark:text-white">Next available groups</h2><p className="mt-1 text-xs font-medium text-muted-ink dark:text-zinc-400">Preview only. No match is created.</p></div><div className="flex items-center gap-1"><button type="button" onClick={async () => { setIsRefreshingPreview(true); setPreviewCycle(previous => previous + 1); setPreviewToast(null); try { await handleRefreshPreview?.(); } finally { setIsRefreshingPreview(false); } }} className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-black text-primary hover:bg-muted dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"><RotateCcw size={14} className={isRefreshingPreview ? 'animate-spin' : ''} /> <span className="hidden sm:inline">{isRefreshingPreview ? 'Refreshing…' : 'Refresh'}</span></button><button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-full p-2 text-muted-ink hover:bg-muted dark:text-zinc-400 dark:hover:bg-zinc-800"><X size={20}/></button></div></div>
              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                {previewGroups.length === 0 ? <div className="rounded-2xl border border-dashed border-subtle p-10 text-center text-sm font-bold text-muted-ink dark:border-zinc-800 dark:text-zinc-500">Not enough idle players for a preview.</div> : <div className="space-y-4">{previewGroups.map((group: any[], index: number) => <div key={group.map((player: any) => player.id).join('-')} className="rounded-2xl border border-subtle bg-app p-4 dark:border-zinc-800 dark:bg-[#121214]"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-widest text-muted-ink dark:text-zinc-500">Preview match {index + 1}</span><span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-black text-ink dark:bg-zinc-800 dark:text-zinc-200">Least played first</span></div><div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">{group.map((player: any) => <div key={player.id} className="min-w-0 rounded-xl border border-subtle bg-surface px-3 py-2 dark:border-zinc-700 dark:bg-[#18181b]"><div className="truncate text-sm font-bold text-primary dark:text-white">{player.name}</div><div className="mt-1 text-[10px] font-bold text-muted-ink dark:text-zinc-500">{player.skillLevel} · {player.gamesPlayed} played</div></div>)}</div><button type="button" disabled={isProcessing || isRefreshingPreview || !handleAddPreviewMatch} onClick={async () => { const added = await handleAddPreviewMatch(group); if (added !== false) { const playerIds = group.map((player: any) => Number(player.id)); setReservedPreviewPlayerIds(previous => [...new Set([...previous, ...playerIds])]); if (typeof added === 'number') setPreviewToast({ matchId: added, playerIds }); } }} className="mt-3 w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">Add to queue</button></div>)}</div>}
              </div>
              <div className="flex justify-end border-t border-subtle bg-app px-5 py-4 dark:border-zinc-800"><button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-xl bg-ink px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-zinc-900">Close</button></div>
            </div>
          </div>
        )}

        {previewToast && (
          <div className="fixed bottom-5 left-1/2 z-[10000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl dark:border-emerald-900/60 dark:bg-[#18181b]">
            <div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-sm font-black text-primary dark:text-white">Preview match added to queue</p><p className="mt-1 text-xs font-medium text-muted-ink dark:text-zinc-400">A replacement preview is ready.</p></div><button type="button" onClick={async () => { if (!handleUndoPreviewMatch) return; const undone = await handleUndoPreviewMatch(previewToast.matchId); if (undone !== false) { setReservedPreviewPlayerIds(previous => previous.filter(playerId => !previewToast.playerIds.includes(playerId))); setPreviewToast(null); } }} className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500">Undo</button></div>
          </div>
        )}

        {explanationMatch && (() => {
          const explanation = getMatchExplanation(explanationMatch);
          return (
            <div className="fixed inset-0 z-[9999] flex items-end justify-end bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="match-explanation-title">
              <div className="flex h-full w-full max-w-md flex-col border-l border-subtle bg-surface shadow-2xl dark:border-zinc-800 dark:bg-[#0f0f11] sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border">
                <div className="flex items-start justify-between border-b border-subtle bg-app px-5 py-4 dark:border-zinc-800 dark:bg-[#121214]"><div><p className="text-[10px] font-black uppercase tracking-widest text-muted-ink dark:text-zinc-500">Organizer view</p><h2 id="match-explanation-title" className="mt-1 text-xl font-black text-primary dark:text-white">Why this match?</h2><p className="mt-1 text-xs font-medium text-muted-ink dark:text-zinc-400">A plain-language look at the choice, not a technical log.</p></div><button type="button" onClick={() => setExplanationMatch(null)} className="rounded-full p-2 text-muted-ink hover:bg-muted dark:text-zinc-400 dark:hover:bg-zinc-800"><X size={20}/></button></div>
                <div className="space-y-4 overflow-y-auto p-6"><div className="rounded-2xl border border-subtle bg-app p-4 dark:border-zinc-800 dark:bg-[#121214]"><p className="text-xs font-bold uppercase tracking-widest text-muted-ink dark:text-zinc-500">At a glance</p><p className="mt-2 text-base font-black leading-snug text-primary dark:text-white">{explanation.lead}</p></div><div className="space-y-3 text-sm font-medium leading-relaxed text-muted-ink dark:text-zinc-400">{explanation.details.map((detail: string, index: number) => <div key={`${explanationMatch.id}-${index}`} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60 dark:bg-zinc-500"/><p>{detail}</p></div>)}</div><div className="rounded-xl border border-dashed border-subtle px-4 py-3 text-xs font-medium leading-relaxed text-muted-ink dark:border-zinc-800 dark:text-zinc-500">Use this panel as a quick review before changing the match. It explains the current inputs; it does not alter how matches are generated.</div></div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
