import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Users, SquareStack, Play, History, Clock, Settings as SettingsIcon,
  Plus, UserPlus, Check, Pause, X, Edit2, Zap, Globe, Sun, Moon, LogOut, ChevronDown, Search, Trash2, GripVertical, ArrowRightLeft, ListOrdered, AlertCircle, AlertTriangle, Save, ChevronLeft, ChevronRight, FileDown, Info, Square, Trophy, Medal, ChevronUp, Wallet, TrendingUp, TrendingDown, DollarSign, RotateCcw
} from 'lucide-react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TABS = [
  { id: 'attendance', label: 'attendance', icon: <Users size={18} /> },
  { id: 'courts', label: 'courts', icon: <SquareStack size={18} /> },
  { id: 'matches', label: 'matches', icon: <Play size={18} /> },
  { id: 'billing', label: 'billing', icon: <Wallet size={18} /> },
  { id: 'history', label: 'history', icon: <History size={18} /> },
  { id: 'leaderboard', label: 'leaderboard', icon: <Trophy size={18} /> },
  { id: 'playtime', label: 'playtime', icon: <Clock size={18} /> },
  { id: 'settings', label: 'settings', icon: <SettingsIcon size={18} /> }
];

const useSafeTimer = (startedAt: string | null | undefined) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let validStart = startedAt ? new Date(startedAt).getTime() : Date.now();
    if (isNaN(validStart)) validStart = Date.now();
    const now = Date.now();
    if (validStart > now + 60000 && startedAt) {
        const stripped = startedAt.endsWith('Z') ? startedAt.slice(0, -1) : startedAt;
        const strippedTime = new Date(stripped).getTime();
        if (!isNaN(strippedTime) && strippedTime <= now + 60000) validStart = strippedTime;
        else validStart = now;
    }
    if (validStart > now) validStart = now;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - validStart) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return elapsed;
};

const MatchTimer = ({ startedAt }: { startedAt: string | null | undefined }) => {
  const elapsed = useSafeTimer(startedAt);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="text-ink font-mono font-bold tracking-widest">{h}:{m}:{s}</span>;
};

const SessionGlobalTimer = ({ startedAt }: { startedAt: string | null | undefined }) => {
  const elapsed = useSafeTimer(startedAt);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="text-ink dark:text-ink-dark font-mono font-black text-xl tracking-widest">{h}:{m}:{s}</span>;
};

const getGradeColor = (levelId: string | undefined | null) => {
  switch (levelId) {
    case 'A1': return 'bg-elevated text-white dark:bg-muted dark:text-primary border-transparent';
    case 'A2': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'B1': return 'bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark border-accent dark:border-strong-dark';
    case 'B2': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'C1': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'C2': return 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400 border-lime-200 dark:border-lime-800';
    default: return 'bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint border-subtle dark:border-default-dark';
  }
};

const getMatchTypeColor = (type: string) => {
  switch(type) {
    case 'MD': return 'bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark border-accent dark:border-strong-dark';
    case 'WD': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    case 'XD': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    default: return 'bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint border-subtle dark:border-default-dark';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const PlayerSlotSelect = ({ options, value, onChange, placeholder, currentName, currentGrade, swaps, onSwap, t }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt: any) => opt.name.toLowerCase().includes(search.toLowerCase()));
  const selectedOpt = options.find((o: any) => o.id === value);
  const displayName = selectedOpt?.name || currentName;
  const displayGrade = selectedOpt?.skillLevel || currentGrade;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${value === 0 && !currentName ? 'border-dashed border-default dark:border-strong-dark bg-transparent hover:bg-muted dark:hover:bg-elevated-dark/50' : 'border-solid border-subtle dark:border-subtle-dark bg-surface dark:bg-app-dark shadow-sm hover:border-ink dark:hover:border-ink'}`}>
        {value === 0 && !currentName ? (
          <div className="flex items-center gap-2 text-muted-ink"><Plus size={16} /> <span className="font-medium text-xs">{placeholder}</span></div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0"><div className="font-bold text-xs truncate text-primary dark:text-primary-dark">{displayName}</div></div>
            <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${getGradeColor(displayGrade)}`}>{displayGrade || '-'}</span>
            <ChevronDown size={14} className="text-faint shrink-0 ml-1" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 z-[100] w-full bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-2xl flex flex-col max-h-72 overflow-hidden ring-1 ring-black/5">
          <div className="p-2 border-b border-subtle dark:border-subtle-dark shrink-0 bg-app dark:bg-app-dark">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={14} />
              <input type="text" placeholder={t('search_players_to_select', 'Search players...')} value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface dark:bg-surface-dark pl-9 pr-3 py-2 text-xs rounded-lg outline-none border border-subtle dark:border-subtle-dark text-primary dark:text-primary-dark" autoFocus />
            </div>
          </div>
          <div className="p-1 overflow-y-auto flex-1 bg-surface dark:bg-surface-dark divide-y divide-slate-100 dark:divide-[#1E293B]">
            <div className="py-1">
              <div onClick={() => { onChange(0); setIsOpen(false); setSearch(''); }} className="px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer font-bold text-center transition-colors">
                {t('remove_player', '- Remove Player -')}
              </div>
            </div>
            {swaps && swaps.length > 0 && (
              <div className="py-1">
                {swaps.filter((s: any) => s.id !== 0 && s.id !== value).map((s: any) => (
                  <div key={`swap-${s.id}`} onClick={() => { onSwap(s.id); setIsOpen(false); }} className="px-3 py-2 text-xs text-ink dark:text-ink-dark hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded-lg cursor-pointer flex items-center gap-2 font-bold transition-colors">
                    <ArrowRightLeft size={12} /> {t('swap_with', 'Swap with')} {s.name}
                  </div>
                ))}
              </div>
            )}
            <div className="py-1">
              {filtered.length === 0 ? <div className="p-3 text-xs text-muted-ink text-center font-medium">No players found</div> :
                filtered.map((opt: any) => (
                  <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }} className="px-3 py-2.5 text-xs hover:bg-app dark:hover:bg-elevated-dark/50 rounded-lg cursor-pointer flex items-center justify-between transition-colors">
                    <span className="truncate mr-2 text-primary dark:text-primary-dark font-bold">{opt.name}</span>
                    <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${getGradeColor(opt.skillLevel)}`}>{opt.skillLevel}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, court, sessionStatus, maxSets, isProcessing, getMemberData, openEditMatchModal, handleAutoGenerateCourt, setSwapCourtModal, setConfirmDeleteMatchId, handleStartMatch, handleFinishMatch, handleReorderQueue, queueIndex, totalQueued, t }: any) => {
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

  return (
    <div className={`bg-surface dark:bg-surface-dark border ${isActive ? 'border-emerald-200 dark:border-emerald-900/50 shadow-md ring-1 ring-emerald-500/20' : 'border-subtle dark:border-subtle-dark shadow-sm'} rounded-xl overflow-hidden flex flex-col h-full transition-all`}>
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

        <div className="flex flex-col gap-3 mb-4">
          <div className="relative mt-1">
            <div className="absolute -top-2 left-2 bg-surface dark:bg-surface-dark px-1 text-[9px] text-muted-ink font-bold uppercase z-10">{match.matchType}</div>
            <div className="flex border border-subtle dark:border-subtle-dark rounded-lg overflow-hidden bg-app dark:bg-app-dark">
              <div className="flex-1 p-2.5 flex items-center justify-between border-r border-subtle dark:border-subtle-dark">
                <span className="font-semibold text-xs truncate dark:text-primary-dark">{getMemberData(match.teamA_player1)?.name || 'TBD'}</span>
                <span className={`text-[9px] border px-1 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamA_player1)?.skillLevel)}`}>{getMemberData(match.teamA_player1)?.skillLevel || '-'}</span>
              </div>
              <div className="flex-1 p-2.5 flex items-center justify-between">
                <span className="font-semibold text-xs truncate dark:text-primary-dark">{getMemberData(match.teamA_player2)?.name || 'TBD'}</span>
                <span className={`text-[9px] border px-1 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamA_player2)?.skillLevel)}`}>{getMemberData(match.teamA_player2)?.skillLevel || '-'}</span>
              </div>
            </div>
          </div>
          <div className="text-center text-faint dark:text-muted-dark text-[9px] font-bold tracking-widest uppercase -my-1">{t('vs', 'VS')}</div>
          <div className="relative">
            <div className="absolute -top-2 left-2 bg-surface dark:bg-surface-dark px-1 text-[9px] text-muted-ink font-bold uppercase z-10">{match.matchType}</div>
            <div className="flex border border-subtle dark:border-subtle-dark rounded-lg overflow-hidden bg-app dark:bg-app-dark">
              <div className="flex-1 p-2.5 flex items-center justify-between border-r border-subtle dark:border-subtle-dark">
                <span className="font-semibold text-xs truncate dark:text-primary-dark">{getMemberData(match.teamB_player1)?.name || 'TBD'}</span>
                <span className={`text-[9px] border px-1 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamB_player1)?.skillLevel)}`}>{getMemberData(match.teamB_player1)?.skillLevel || '-'}</span>
              </div>
              <div className="flex-1 p-2.5 flex items-center justify-between">
                <span className="font-semibold text-xs truncate dark:text-primary-dark">{getMemberData(match.teamB_player2)?.name || 'TBD'}</span>
                <span className={`text-[9px] border px-1 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamB_player2)?.skillLevel)}`}>{getMemberData(match.teamB_player2)?.skillLevel || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          {isActive ? (
            <form onSubmit={(e) => { e.preventDefault(); if(!isProcessing) handleFinishMatch(match.id, true, scores); }} className="w-full flex flex-col gap-2 mt-auto">
              <div className="bg-app dark:bg-app-dark border border-subtle dark:border-subtle-dark p-3 rounded-xl relative">
                {maxSets > 1 && (
                  <div className="flex items-center justify-between mb-3 bg-surface dark:bg-surface-dark rounded-md p-1 border border-subtle dark:border-subtle-dark">
                    <button type="button" onClick={() => setCurrentSet(c => c - 1)} disabled={currentSet <= 1 || isProcessing} className="p-1 text-muted-ink hover:text-ink disabled:opacity-30 transition-colors"><ChevronLeft size={14}/></button>
                    <span className="text-[9px] font-bold text-muted-ink dark:text-muted-dark uppercase tracking-widest">Set {currentSet} of {maxSets}</span>
                    <button type="button" onClick={() => setCurrentSet(c => c + 1)} disabled={currentSet >= maxSets || isProcessing} className="p-1 text-muted-ink hover:text-ink disabled:opacity-30 transition-colors"><ChevronRight size={14}/></button>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2 text-[9px] font-bold text-faint uppercase tracking-widest px-1">
                  <span className="truncate max-w-[100px]">{getMemberData(match.teamA_player1)?.name?.split(' ')[0]} & {getMemberData(match.teamA_player2)?.name?.split(' ')[0]}</span>
                  <span className="truncate max-w-[100px] text-right">{getMemberData(match.teamB_player1)?.name?.split(' ')[0]} & {getMemberData(match.teamB_player2)?.name?.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" placeholder="0" disabled={isProcessing}
                    value={scores[`a${currentSet}` as keyof typeof scores]}
                    onChange={(e) => setScores(p => ({...p, [`a${currentSet}`]: e.target.value}))}
                    className={`flex-1 w-full bg-surface dark:bg-surface-dark border-2 ${numA > numB && numA > 0 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-subtle dark:border-subtle-dark text-primary dark:text-primary-dark focus:border-ink'} rounded-lg py-3 text-center font-bold text-2xl outline-none transition-colors disabled:opacity-50`}
                  />
                  <span className="text-faint dark:text-muted-dark font-black text-sm">-</span>
                  <input
                    type="number" placeholder="0" disabled={isProcessing}
                    value={scores[`b${currentSet}` as keyof typeof scores]}
                    onChange={(e) => setScores(p => ({...p, [`b${currentSet}`]: e.target.value}))}
                    className={`flex-1 w-full bg-surface dark:bg-surface-dark border-2 ${numB > numA && numB > 0 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-subtle dark:border-subtle-dark text-primary dark:text-primary-dark focus:border-ink'} rounded-lg py-3 text-center font-bold text-2xl outline-none transition-colors disabled:opacity-50`}
                  />
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="w-full bg-ink hover:bg-ink-soft text-white py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm mt-1 disabled:opacity-50">
                {t('finish_free_court', 'Finish & Free Court')}
              </button>
              <button type="button" disabled={isProcessing} onClick={() => setConfirmDeleteMatchId(match.id)} className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 py-2.5 rounded-lg text-xs font-bold transition-colors mt-1 disabled:opacity-50">
                {t('cancel_match', 'Cancel Match')}
              </button>
            </form>
          ) : court ? (
            <div className="w-full flex gap-2 mt-auto">
              <button disabled={isProcessing} onClick={() => setSwapCourtModal(match)} className="p-2.5 border border-subtle dark:border-subtle-dark rounded-lg text-faint hover:bg-app dark:hover:bg-elevated-dark dark:hover:text-white transition-colors disabled:opacity-50" title="Manage Court"><ArrowRightLeft size={16}/></button>
              <button onClick={() => handleStartMatch(match.id)} disabled={isProcessing || sessionStatus !== 'active'} className="flex-1 bg-ink hover:bg-ink-soft text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
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

export default function SessionDetails() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [communityData, setCommunityData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [attendances, setAttendances] = useState<any[]>([]);
  const [allMembers, setMembers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [playtimeSearch, setPlaytimeSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');

  const [lbLimitType, setLbLimitType] = useState('all');
  const [lbCustomLimit, setLbCustomLimit] = useState(6);

  const [isAttendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);
  const [isWalkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ name: '', gender: 'male', skillLevel: 'C1' });
  const [editCourtId, setEditCourtId] = useState<number | null>(null);
  const [courtName, setCourtName] = useState('');
  const [playerDetailModal, setPlayerDetailModal] = useState<number | null>(null);
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);

  const [settingsForm, setSettingsForm] = useState<any>({});

  const [defaultFee, setDefaultFee] = useState<number>(0);
  const [memberDefaultFee, setMemberDefaultFee] = useState<number>(0);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editPaymentValue, setEditPaymentValue] = useState<number>(0);

  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [membershipPeriods, setMembershipPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  const [editMatchModal, setEditMatchModal] = useState<any>(null);
  const [editHistoryModal, setEditHistoryModal] = useState<any>(null);
  const [swapCourtModal, setSwapCourtModal] = useState<any>(null);
  const [manualPlayers, setManualPlayers] = useState({ ta1: 0, ta2: 0, tb1: 0, tb2: 0 });
  const [historyForm, setHistoryForm] = useState({ courtId: 0, ta1: 0, ta2: 0, tb1: 0, tb2: 0, sa1: 0, sb1: 0, sa2: 0, sb2: 0, sa3: 0, sb3: 0 });
  const [historySetView, setHistorySetView] = useState(1);

  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<number | null>(null);

  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success'|'error'}[]>([]);
  const addToast = (msg: string, type: 'success'|'error' = 'success') => {
    const message = msg.charAt(0).toUpperCase() + msg.slice(1);
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
  };

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchSessionData = async () => {
    try {
      const [sessionRes, membersRes, attendancesRes, matchesRes, userRes] = await Promise.all([
        api.get(`/sessions/${id}`),
        api.get('/members'),
        api.get(`/sessions/${id}/attendances`),
        api.get(`/matches/${id}`),
        api.get('/users/me')
      ]);

      setSession(sessionRes.data);
      setSettingsForm(sessionRes.data);
      setDefaultFee(sessionRes.data.defaultFee || 0);
      setMemberDefaultFee(sessionRes.data.memberDefaultFee || 0);
      setCourts(sessionRes.data.courts || []);
      setExpenses(sessionRes.data.expenses || []);
      setMembers(membersRes.data);
      setAttendances(attendancesRes.data);
      setMatches(matchesRes.data);
      setCommunityData(userRes.data.community);

      const ml = sessionRes.data.matchLimit;
      if (ml === 0) setLbLimitType('all');
      else if ([1,2,3,4,5].includes(ml)) setLbLimitType(String(ml));
      else { setLbLimitType('custom'); setLbCustomLimit(ml); }

    } catch (err) {
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessionData(); }, [id]);

  const getMaxSets = () => {
    if (!session) return 1;
    if (session.scoringSystem === 'BWF 21 Points x 3 Sets') return 3;
    if (session.scoringSystem === 'BWF 15 Points x 3 Sets') return 3;
    if (session.scoringSystem === 'custom' && session.customSets) return session.customSets;
    return 1;
  };
  const maxSets = getMaxSets();

  const visibleAttendances = useMemo(() => {
    return attendances
      .filter(a => a.attendance.status !== 'cancelled' && a.attendance.status !== 'absent')
      .filter(a => a.member.name.toLowerCase().includes(attendanceSearch.toLowerCase()));
  }, [attendances, attendanceSearch]);

  const availableMembersModal = useMemo(() => {
    return allMembers
      .filter(m => !attendances.some(a => a.member.id === m.id && (a.attendance.status === 'active' || a.attendance.status === 'resting')))
      .filter(m => m.name.toLowerCase().includes(modalSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMembers, attendances, modalSearch]);

  const activeMatches = useMemo(() => matches.filter(m => m.status === 'queued' || m.status === 'on_court'), [matches]);
  const finishedMatches = useMemo(() => matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()), [matches]);
  const queuedMatchesList = useMemo(() => matches.filter(m => m.courtId === null && m.status === 'queued').sort((a,b) => a.id - b.id), [matches]);

  const busyPlayerIds = useMemo(() => {
    const ids = new Set<number>();
    activeMatches.forEach(m => {
      if (editMatchModal && m.id === editMatchModal.id) return;
      if (m.teamA_player1) ids.add(m.teamA_player1);
      if (m.teamA_player2) ids.add(m.teamA_player2);
      if (m.teamB_player1) ids.add(m.teamB_player1);
      if (m.teamB_player2) ids.add(m.teamB_player2);
    });
    return ids;
  }, [activeMatches, editMatchModal]);

  const availableForManualMatch = useMemo(() => {
    return allMembers
      .filter(m => {
        const isAttending = attendances.some(a => a.member.id === m.id && a.attendance.status === 'active');
        if (!isAttending) return false;
        const isBusy = busyPlayerIds.has(m.id);
        const isCurrentlyInThisMatch = editMatchModal && (m.id === editMatchModal.teamA_player1 || m.id === editMatchModal.teamA_player2 || m.id === editMatchModal.teamB_player1 || m.id === editMatchModal.teamB_player2);
        return !isBusy || isCurrentlyInThisMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMembers, attendances, busyPlayerIds, editMatchModal]);

  const historyPlayerOptions = useMemo(() => [...allMembers].sort((a, b) => a.name.localeCompare(b.name)), [allMembers]);

  const filteredHistory = useMemo(() => {
    return finishedMatches.filter(match => {
      const search = historySearch.toLowerCase();
      if (!search) return true;
      const pA1 = getMemberData(match.teamA_player1)?.name?.toLowerCase() || '';
      const pA2 = getMemberData(match.teamA_player2)?.name?.toLowerCase() || '';
      const pB1 = getMemberData(match.teamB_player1)?.name?.toLowerCase() || '';
      const pB2 = getMemberData(match.teamB_player2)?.name?.toLowerCase() || '';
      const court = getInitialCourtName(match.courtId)?.toLowerCase() || '';
      return pA1.includes(search) || pA2.includes(search) || pB1.includes(search) || pB2.includes(search) || court.includes(search);
    });
  }, [finishedMatches, historySearch, allMembers, courts]);

  const playerMatchCounts = useMemo(() => {
    const counts: Record<number, { finished: number, ongoing: number, total: number }> = {};
    allMembers.forEach(m => counts[m.id] = { finished: 0, ongoing: 0, total: 0 });

    finishedMatches.forEach(m => {
      if(m.teamA_player1) counts[m.teamA_player1].finished++;
      if(m.teamA_player2) counts[m.teamA_player2].finished++;
      if(m.teamB_player1) counts[m.teamB_player1].finished++;
      if(m.teamB_player2) counts[m.teamB_player2].finished++;
    });

    activeMatches.forEach(m => {
      if (m.status === 'on_court') {
         if(m.teamA_player1) counts[m.teamA_player1].ongoing++;
         if(m.teamA_player2) counts[m.teamA_player2].ongoing++;
         if(m.teamB_player1) counts[m.teamB_player1].ongoing++;
         if(m.teamB_player2) counts[m.teamB_player2].ongoing++;
      }
    });

    Object.keys(counts).forEach(key => {
      counts[parseInt(key)].total = counts[parseInt(key)].finished + counts[parseInt(key)].ongoing;
    });

    return counts;
  }, [finishedMatches, activeMatches, allMembers]);

  const waitingListPlayers = useMemo(() => {
    return attendances
      .filter(a => a.attendance.status === 'active' && !busyPlayerIds.has(a.member.id))
      .map(a => {
        const stats = playerMatchCounts[a.member.id] || { total: 0, finished: 0, ongoing: 0 };
        return {
          ...a.member,
          attendanceId: a.attendance.id,
          arrivedAt: a.attendance.arrivedAt,
          gamesPlayed: stats.total,
          finishedCount: stats.finished,
          ongoingCount: stats.ongoing
        };
      })
      .sort((a, b) => {
        if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
        return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime();
      });
  }, [attendances, busyPlayerIds, playerMatchCounts]);

  const calculatePlayerGames = (member: any) => {
    if (!member) return [];
    const memberMatches = [...finishedMatches, ...activeMatches.filter(m => m.status === 'on_court')].filter(m =>
      m.teamA_player1 === member.id || m.teamA_player2 === member.id ||
      m.teamB_player1 === member.id || m.teamB_player2 === member.id
    ).sort((a, b) => new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime());

    return memberMatches.map(m => {
      let isTeamA = (m.teamA_player1 === member.id || m.teamA_player2 === member.id);
      let partnerId = isTeamA
        ? (m.teamA_player1 === member.id ? m.teamA_player2 : m.teamA_player1)
        : (m.teamB_player1 === member.id ? m.teamB_player2 : m.teamB_player1);

      let opp1 = isTeamA ? m.teamB_player1 : m.teamA_player1;
      let opp2 = isTeamA ? m.teamB_player2 : m.teamA_player2;

      let partnerGender = getMemberData(partnerId)?.gender;
      let myGender = member.gender;

      let type = 'MD';
      if (myGender === 'female' && partnerGender === 'female') type = 'WD';
      else if ((myGender === 'male' && partnerGender === 'female') || (myGender === 'female' && partnerGender === 'male')) type = 'XD';
      if (!partnerGender) type = '??';

      const pName = getMemberData(partnerId)?.name || 'None';
      const o1Name = getMemberData(opp1)?.name || 'TBD';
      const o2Name = getMemberData(opp2)?.name || 'TBD';

      const courtName = getInitialCourtName(m.courtId) || 'Unknown Court';
      const duration = m.startedAt && m.endedAt ? Math.max(0, Math.floor((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)) + ' min' : '-';

      if (m.status === 'on_court') {
         return { id: m.id, type, courtName, duration, partnerName: pName, opp1Name: o1Name, opp2Name: o2Name, myScore: 0, oppScore: 0, result: 'Ongoing', scoreString: 'Playing...' };
      }

      let myScore = 0, oppScore = 0;
      let scoreStrings = [];
      for(let i=1; i<=maxSets; i++) {
        let sa = m[`scoreTeamA_set${i}`];
        let sb = m[`scoreTeamB_set${i}`];
        if (sa > 0 || sb > 0 || i === 1) {
          if (isTeamA) { myScore += sa; oppScore += sb; scoreStrings.push(`${sa}-${sb}`); }
          else { myScore += sb; oppScore += sa; scoreStrings.push(`${sb}-${sa}`); }
        }
      }

      const result = myScore > oppScore ? 'Won' : myScore < oppScore ? 'Lost' : 'Draw';
      const scoreString = scoreStrings.join(' / ');
      return { id: m.id, type, courtName, duration, partnerName: pName, opp1Name: o1Name, opp2Name: o2Name, myScore, oppScore, result, scoreString };
    });
  };

  const playtimeData = useMemo(() => {
    return attendances
      .filter(a => a.attendance.status !== 'cancelled' && a.attendance.status !== 'absent')
      .filter(a => a.member.name.toLowerCase().includes(playtimeSearch.toLowerCase()))
      .map(({ member, attendance }) => {
        return { member, attendance, playedGames: calculatePlayerGames(member) };
      })
      .sort((a, b) => {
        if (a.playedGames.length !== b.playedGames.length) return a.playedGames.length - b.playedGames.length;
        return a.member.name.localeCompare(b.member.name);
      });
  }, [attendances, playtimeSearch, finishedMatches, activeMatches, maxSets, allMembers]);

  const sessionLeaderboardData = useMemo(() => {
    if (!session || !finishedMatches) return [];

    const activeMatchLimit = lbLimitType === 'all' ? 999 : (lbLimitType === 'custom' ? lbCustomLimit : parseInt(lbLimitType));
    const playerStats: Record<number, any> = {};

    allMembers.forEach(m => {
      playerStats[m.id] = { id: m.id, name: m.name, grade: m.skillLevel, played: 0, won: 0, lost: 0, netSets: 0, netPoints: 0, totalPoints: 0, lastWinTime: 0 };
    });

    const playerMatchCount: Record<number, number> = {};
    const chronologicalMatches = [...finishedMatches].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    chronologicalMatches.forEach(match => {
      const pA1 = match.teamA_player1;
      const pA2 = match.teamA_player2;
      const pB1 = match.teamB_player1;
      const pB2 = match.teamB_player2;

      const isEligible = (pId: number | null) => {
        if (!pId) return false;
        if (!playerMatchCount[pId]) playerMatchCount[pId] = 0;
        if (playerMatchCount[pId] < activeMatchLimit) {
          playerMatchCount[pId]++;
          return true;
        }
        return false;
      };

      const eA1 = isEligible(pA1);
      const eA2 = isEligible(pA2);
      const eB1 = isEligible(pB1);
      const eB2 = isEligible(pB2);

      let sa = 0, sb = 0;
      let setsA = 0, setsB = 0;
      for (let i=1; i<=maxSets; i++) {
        const s1 = match[`scoreTeamA_set${i}`] || 0;
        const s2 = match[`scoreTeamB_set${i}`] || 0;
        if (s1 > 0 || s2 > 0 || i === 1) {
          sa += s1; sb += s2;
          if (s1 > s2) setsA++;
          else if (s2 > s1) setsB++;
        }
      }

      const aWon = sa > sb;
      const bWon = sb > sa;
      const endTime = new Date(match.endedAt).getTime();

      const applyStats = (pId: number | null, eligible: boolean, isTeamA: boolean) => {
        if (!pId || !eligible || !playerStats[pId]) return;
        const p = playerStats[pId];
        p.played++;
        if ((isTeamA && aWon) || (!isTeamA && bWon)) {
          p.won++;
          p.lastWinTime = Math.max(p.lastWinTime, endTime);
        } else if ((isTeamA && bWon) || (!isTeamA && aWon)) {
          p.lost++;
        }
        p.netSets += isTeamA ? (setsA - setsB) : (setsB - setsA);
        p.netPoints += isTeamA ? (sa - sb) : (sb - sa);
        p.totalPoints += isTeamA ? sa : sb;
      };

      applyStats(pA1, eA1, true);
      applyStats(pA2, eA2, true);
      applyStats(pB1, eB1, false);
      applyStats(pB2, eB2, false);
    });

    const sortedWithRanks = Object.values(playerStats)
      .filter(p => p.played > 0)
      .map(p => ({ ...p, winRate: p.played > 0 ? (p.won / p.played) : 0 }))
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.won !== a.won) return b.won - a.won;
        if (b.netSets !== a.netSets) return b.netSets - a.netSets;
        if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints;
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.lastWinTime - b.lastWinTime;
      })
      .map((p, index) => ({ ...p, rank: index + 1 }));

    if (leaderboardSearch) {
       return sortedWithRanks.filter((p: any) => p.name.toLowerCase().includes(leaderboardSearch.toLowerCase()));
    }
    return sortedWithRanks;
  }, [finishedMatches, allMembers, session, maxSets, leaderboardSearch, lbLimitType, lbCustomLimit]);

  const billingAttendances = useMemo(() => {
    const uniqueMap = new Map();
    attendances.forEach(a => {
      const existing = uniqueMap.get(a.member.id);
      if (!existing || (a.attendance.paymentAmount || 0) > (existing.attendance.paymentAmount || 0)) {
        uniqueMap.set(a.member.id, a);
      }
    });

    return Array.from(uniqueMap.values())
      .filter(a => a.attendance.status !== 'cancelled')
      .filter(a => a.member.name.toLowerCase().includes(billingSearch.toLowerCase()))
      .sort((a, b) => a.member.name.localeCompare(b.member.name));
  }, [attendances, billingSearch]);

  const totalIncome = useMemo(() => {
    return attendances.reduce((sum, a) => {
      if (a.attendance.paymentStatus === 'paid' || a.attendance.paymentStatus === 'member') {
        return sum + (a.attendance.paymentAmount || 0);
      }
      return sum;
    }, 0);
  }, [attendances]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const netBalance = totalIncome - totalExpense;

  function getMemberData(memberId: number) { return allMembers.find(m => m.id === memberId); }
  function getInitialCourtName(cId: number) { return courts.find(c => c.id === cId)?.name; }

  const getOptionsFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    const selectedIds = Object.entries(manualPlayers).filter(([k]) => k !== currentKey).map(([, v]) => v);
    return availableForManualMatch.filter(m => !selectedIds.includes(m.id));
  };

  const getSwapListFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    return Object.entries(manualPlayers)
      .filter(([k, v]) => k !== currentKey && v !== 0)
      .map(([, v]) => ({ id: v, name: getMemberData(v)?.name || '' }));
  };

  const getHistorySwapListFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    return Object.entries(historyForm).filter(([k]) => k.startsWith('t'))
      .filter(([k, v]) => k !== currentKey && v !== 0)
      .map(([, v]) => ({ id: v, name: getMemberData(v as number)?.name || '' }));
  };

  const selectedDetailPlayer = playerDetailModal ? getMemberData(playerDetailModal) : null;
  const selectedDetailGames = playerDetailModal ? calculatePlayerGames(selectedDetailPlayer) : [];

  const handleStartSession = async () => {
    if(isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}/start`);
      await fetchSessionData();
      addToast("Session started successfully");
    } catch(err) { addToast("Error starting session", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleEndSession = async () => {
    if(isProcessing || !window.confirm("Are you sure you want to end this session? All ongoing matches will need to be finished manually.")) return;
    setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}/finish`);
      await fetchSessionData();
      addToast("Session ended successfully");
    } catch(err) { addToast("Error ending session", "error"); }
    finally { setIsProcessing(false); }
  };

  const applyPDFHeaderFooter = (doc: any, title: string, subtitle: string) => {
    let yPos = 20;
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    if (communityData?.logo?.startsWith('data:image')) {
      try {
        doc.addImage(communityData.logo, 14, 10, 16, 16);
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(communityData.name || 'Community', 35, 18);
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text("Generated by AturMabar", 35, 24);
      } catch(e) { console.warn('PDF Logo parsing error'); }
    } else {
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(communityData?.name || 'Community', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by AturMabar", 14, 26);
    }
    yPos = 55;
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, yPos);
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by AturMabar', 14, doc.internal.pageSize.height - 10);
    }
    return yPos + 10;
  };

  const exportSessionPDF = () => {
    const doc = new jsPDF();
    const tableStartY = applyPDFHeaderFooter(doc, `Session Report: ${session?.name}`, `Date: ${new Date(session?.date).toLocaleString(i18n.language)}`);

    const tableData = finishedMatches.map(m => {
      const teamA = `${getMemberData(m.teamA_player1)?.name || 'TBD'} & ${getMemberData(m.teamA_player2)?.name || 'TBD'}`;
      const teamB = `${getMemberData(m.teamB_player1)?.name || 'TBD'} & ${getMemberData(m.teamB_player2)?.name || 'TBD'}`;
      const courtName = getInitialCourtName(m.courtId) || 'Unknown Court';
      const duration = m.startedAt && m.endedAt ? Math.max(0, Math.floor((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)) + ' min' : '-';
      let saTotal = 0, sbTotal = 0;
      let scores = [];
      for(let i=1; i<=maxSets; i++) {
        const sa = m[`scoreTeamA_set${i}`] || 0;
        const sb = m[`scoreTeamB_set${i}`] || 0;
        if (sa > 0 || sb > 0 || i === 1) {
            scores.push(`${sa}-${sb}`);
            saTotal += sa; sbTotal += sb;
        }
      }
      const winner = saTotal > sbTotal ? 'A' : (sbTotal > saTotal ? 'B' : 'Draw');
      return [m.matchType, `${courtName}\n${duration}`, teamA, scores.join(' / '), teamB, winner];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [['Type', 'Details', 'Team A', 'Score', 'Team B']],
      body: tableData.map(row => row.slice(0, 5)),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const winner = tableData[data.row.index][5];
          if (data.column.index === 1) {
            data.cell.styles.textColor = [100, 116, 139];
            data.cell.styles.fontSize = 8;
          }
          if (winner === 'A') {
            if (data.column.index === 2 || data.column.index === 3) {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            }
          } else if (winner === 'B') {
            if (data.column.index === 4 || data.column.index === 3) {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    });

    doc.save(`Session_${session?.name}_Report.pdf`);
    addToast("Session PDF Exported successfully!");
  };

  const exportPlayerPDF = (_memberId: number, memberName: string, playedGames: any[]) => {
    const doc = new jsPDF();
    const tableStartY = applyPDFHeaderFooter(doc, `Player Report: ${memberName}`, `Session: ${session?.name} | Date: ${new Date(session?.date).toLocaleString(i18n.language)}`);

    const tableData = playedGames.map(g => [
      g.type, `${g.courtName}\n${g.duration}`, g.partnerName, g.scoreString, `${g.opp1Name} & ${g.opp2Name}`, g.result
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Type', 'Details', 'Partner', 'Score', 'Opponents', 'Result']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const result = (data.row.raw as any[])[5];
          if (data.column.index === 1) {
            data.cell.styles.textColor = [100, 116, 139];
            data.cell.styles.fontSize = 8;
          }
          if (result === 'Won') {
            if (data.column.index === 2 || data.column.index === 3 || data.column.index === 5) {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            }
          } else if (result === 'Lost') {
            if (data.column.index === 4) {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            }
            if (data.column.index === 5) {
              data.cell.styles.textColor = [225, 29, 72];
              data.cell.styles.fontStyle = 'bold';
            }
          } else if (result === 'Ongoing') {
             if (data.column.index === 5) {
               data.cell.styles.textColor = [37, 99, 235];
             }
          }
        }
      }
    });

    doc.save(`Player_${memberName}_Report.pdf`);
    addToast("Player PDF Exported successfully!");
  };

  const openAttendeeModal = () => { setSelectedAttendees([]); setModalSearch(''); setAttendeeModalOpen(true); };
  const toggleSelectAttendee = (memberId: number) => setSelectedAttendees(prev => prev.includes(memberId) ? prev.filter(mid => mid !== memberId) : [...prev, memberId]);

  const handleAddSelectedAttendees = async () => {
    if (selectedAttendees.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      await Promise.all(selectedAttendees.map(async (memberId) => {
        const existingRecord = attendances.find(a => a.member.id === memberId);
        if (existingRecord) return api.put(`/sessions/${id}/attendances/${existingRecord.attendance.id}`, { status: 'active' });
        return api.post(`/sessions/${id}/attendances`, { memberId });
      }));
      await fetchSessionData();
      setAttendeeModalOpen(false);
      addToast(t('attendance_added', "Attendees added successfully"));
    } catch (err) { addToast("Error processing attendees.", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleOpenImportModal = async () => {
    setIsProcessing(true);
    try {
      const res = await api.get('/members/periods');
      setMembershipPeriods(res.data);

      const sessionDate = new Date(session.date);
      let defaultId = '';
      const matchingPeriod = res.data.find((p: any) => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return sessionDate >= start && sessionDate <= end;
      });

      if (matchingPeriod) {
        defaultId = String(matchingPeriod.id);
      } else if (res.data.length > 0) {
        defaultId = String(res.data[0].id);
      }

      setSelectedPeriodId(defaultId);
      setImportModalOpen(true);
    } catch(err) {
      addToast("Error loading periods", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!selectedPeriodId || isProcessing) return;
    setIsProcessing(true);
    try {
      const periodId = parseInt(selectedPeriodId);
      const matchingPeriod = membershipPeriods.find(p => p.id === periodId);

      if (!matchingPeriod) {
        addToast("Invalid membership period.", "error");
        setIsProcessing(false);
        return;
      }

      const paymentsRes = await api.get(`/members/periods/${periodId}/payments`);
      const periodMembers = paymentsRes.data;

      const newMembers = periodMembers.filter((pm: any) => !attendances.some(a => a.member.id === pm.memberId));
      for (const pm of newMembers) {
         await api.post(`/sessions/${id}/attendances`, { memberId: pm.memberId });
      }

      const updatedAttRes = await api.get(`/sessions/${id}/attendances`);
      const updatedAtts = updatedAttRes.data;

      const updatePromises = periodMembers.map((pm: any) => {
         const att = updatedAtts.find((a: any) => a.member.id === pm.memberId);
         if (!att) return Promise.resolve();

         const isNew = newMembers.some((nm: any) => nm.memberId === pm.memberId);
         const statusPromise = isNew
           ? api.put(`/sessions/${id}/attendances/${att.attendance.id}`, { status: 'absent' })
           : Promise.resolve();

         const paymentStatus = pm.status === 'paid' ? 'member' : 'member_unpaid';
         const paymentAmount = pm.status === 'paid' ? memberDefaultFee : 0;

         const paymentPromise = api.put(`/sessions/${id}/attendances/${att.attendance.id}/payment`, {
             paymentAmount,
             paymentStatus
         });

         return Promise.all([statusPromise, paymentPromise]);
      });

      await Promise.all(updatePromises);
      await fetchSessionData();
      setImportModalOpen(false);
      addToast(`Successfully synced members from ${matchingPeriod.name}`);
    } catch (err: any) {
      addToast(err.response?.data?.error || "Error importing members", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if(isProcessing) return; setIsProcessing(true);
    try {
      await api.post(`/sessions/${id}/walk-in`, walkInForm);
      await fetchSessionData();
      setWalkInModalOpen(false);
      setWalkInForm({ name: '', gender: 'male', skillLevel: 'C1' });
      addToast(t('walk_in_added', "Walk-in player added successfully"));
    } catch (err) { addToast("Error adding walk-in", "error"); }
    finally { setIsProcessing(false); }
  };

  const updateAttendanceStatus = async (attendanceId: number, status: string) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}/attendances/${attendanceId}`, { status });
      await fetchSessionData();
      addToast(t('status_updated', "Status updated"));
    } catch (err) { addToast("Error updating status", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleUpdateGrade = async (memberId: number, skillLevel: string) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}/members/${memberId}/grade`, { skillLevel });
      await fetchSessionData();
      addToast("Player grade updated successfully");
    } catch (err) { addToast("Error updating grade", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleAddCourt = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.post(`/sessions/${id}/courts`, { name: `Court ${courts.length + 1}` });
      await fetchSessionData();
      addToast(t('court_added', "Court added"));
    } catch (err) { addToast("Error adding court", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleUpdateCourt = async (courtId: number, isActive: boolean, name?: string) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}/courts/${courtId}`, { isActive, name: name || courts.find(c => c.id === courtId)?.name });
      setEditCourtId(null);
      await fetchSessionData();
      addToast(t('court_updated', "Court updated"));
    } catch (err) { addToast("Error updating court", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteCourt = async (courtId: number) => {
    if (isProcessing || !window.confirm(t('delete_court') + "?")) return;
    setIsProcessing(true);
    try {
      await api.delete(`/sessions/${id}/courts/${courtId}`);
      await fetchSessionData();
      addToast(t('court_deleted', "Court deleted"));
    } catch (err) { addToast("Error deleting court", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleAutoGenerateCourt = async (courtId: number) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.post(`/matches/${id}/auto-generate`, { courtId });
      await fetchSessionData();
      addToast("Match generated successfully");
    } catch (err: any) { addToast(err.response?.data?.error || "Error generating match", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleAutoFillAllCourts = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      const emptyCourts = courts.filter(c => c.isActive && !matches.find(m => m.courtId === c.id && (m.status === 'on_court' || m.status === 'queued')));
      let generated = 0;
      for (const court of emptyCourts) {
        try { await api.post(`/matches/${id}/auto-generate`, { courtId: court.id }); generated++; }
        catch (err) { break; }
      }
      await fetchSessionData();
      if (generated > 0) addToast(`Successfully filled ${generated} court(s)`);
      else addToast("Not enough available players", "error");
    } finally { setIsProcessing(false); }
  };

  const handleQueueMatch = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.post(`/matches/${id}/auto-generate`, { courtId: null });
      await fetchSessionData();
      addToast(t('match_queued', "Match added to queue"));
    } catch (err: any) { addToast(err.response?.data?.error || "Error generating match", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleStartMatch = async (matchId: number) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/matches/${matchId}/start`);
      await fetchSessionData();
      addToast(t('match_started', "Match started"));
    } catch (err) { addToast("Error starting match", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleFinishMatch = async (matchId: number, saveScore: boolean, scores?: any) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      const payload: any = {};
      if (saveScore && scores) {
        payload.scoreTeamA_set1 = parseInt(scores.a1) || 0;
        payload.scoreTeamB_set1 = parseInt(scores.b1) || 0;
        payload.scoreTeamA_set2 = parseInt(scores.a2) || 0;
        payload.scoreTeamB_set2 = parseInt(scores.b2) || 0;
        payload.scoreTeamA_set3 = parseInt(scores.a3) || 0;
        payload.scoreTeamB_set3 = parseInt(scores.b3) || 0;
      }
      await api.put(`/matches/${matchId}/finish`, payload);
      await fetchSessionData();
      addToast(t('match_finished', "Match finished"));
    } catch (err) { addToast("Error finishing match", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleConfirmDeleteMatch = async () => {
    if (!confirmDeleteMatchId || isProcessing) return;
    setIsProcessing(true);
    try {
      await api.delete(`/matches/${confirmDeleteMatchId}`);
      await fetchSessionData();
      addToast(t('match_cancelled', "Match cancelled successfully."));
    } catch (err) { addToast("Error canceling match", "error"); }
    finally { setConfirmDeleteMatchId(null); setIsProcessing(false); }
  };

  const handleSwapCourt = async (matchId: number, targetCourtId: number | null) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/matches/${matchId}/swap-court`, { targetCourtId });
      setSwapCourtModal(null);
      await fetchSessionData();
      addToast(t('court_swapped', "Court swapped successfully"));
    } catch (err) { addToast("Error swapping courts", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleReorderQueue = async (currentIndex: number, direction: 'up'|'down') => {
    if (isProcessing) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= queuedMatchesList.length) return;

    setIsProcessing(true);
    try {
      const m1 = queuedMatchesList[currentIndex];
      const m2 = queuedMatchesList[targetIndex];
      await Promise.all([
        api.put(`/matches/${m1.id}/players`, {
          teamA_player1: m2.teamA_player1, teamA_player2: m2.teamA_player2,
          teamB_player1: m2.teamB_player1, teamB_player2: m2.teamB_player2
        }),
        api.put(`/matches/${m2.id}/players`, {
          teamA_player1: m1.teamA_player1, teamA_player2: m1.teamA_player2,
          teamB_player1: m1.teamB_player1, teamB_player2: m1.teamB_player2
        })
      ]);
      await fetchSessionData();
    } catch(e) {
      addToast("Failed to reorder queue", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditMatchModal = (match: any) => {
    setManualPlayers({ ta1: match.teamA_player1 || 0, ta2: match.teamA_player2 || 0, tb1: match.teamB_player1 || 0, tb2: match.teamB_player2 || 0 });
    setEditMatchModal(match);
  };

  const handleSwapWithinMatch = (sourceKey: 'ta1'|'ta2'|'tb1'|'tb2', targetId: number) => {
    const targetKey = (Object.keys(manualPlayers) as Array<keyof typeof manualPlayers>).find(k => manualPlayers[k as keyof typeof manualPlayers] === targetId);
    if (targetKey) {
      setManualPlayers(prev => ({
        ...prev,
        [sourceKey]: prev[targetKey as keyof typeof manualPlayers],
        [targetKey]: prev[sourceKey as keyof typeof manualPlayers]
      }));
    }
  };

  const saveManualMatch = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      const payload = {
        teamA_player1: manualPlayers.ta1 || null, teamA_player2: manualPlayers.ta2 || null,
        teamB_player1: manualPlayers.tb1 || null, teamB_player2: manualPlayers.tb2 || null
      };

      if (editMatchModal.id) {
        await api.put(`/matches/${editMatchModal.id}/players`, payload);
        addToast(t('match_updated', "Players updated successfully"));
      } else {
        await api.post(`/matches/${id}/manual`, { ...payload, courtId: editMatchModal.courtId });
        addToast("Manual match created successfully");
      }
      setEditMatchModal(null);
      await fetchSessionData();
    } catch (err) { addToast("Error saving players", "error"); }
    finally { setIsProcessing(false); }
  };

  const openEditHistoryModal = (match: any) => {
    setHistorySetView(1);
    setHistoryForm({
      courtId: match.courtId || 0,
      ta1: match.teamA_player1 || 0, ta2: match.teamA_player2 || 0,
      tb1: match.teamB_player1 || 0, tb2: match.teamB_player2 || 0,
      sa1: match.scoreTeamA_set1 || 0, sb1: match.scoreTeamB_set1 || 0,
      sa2: match.scoreTeamA_set2 || 0, sb2: match.scoreTeamB_set2 || 0,
      sa3: match.scoreTeamA_set3 || 0, sb3: match.scoreTeamB_set3 || 0,
    });
    setEditHistoryModal(match);
  };

  const handleSwapWithinHistory = (sourceKey: 'ta1'|'ta2'|'tb1'|'tb2', targetId: number) => {
    const targetKey = (Object.keys(historyForm).filter(k=>k.startsWith('t')))
      .find(k => historyForm[k as keyof typeof historyForm] === targetId);
    if (targetKey) {
      setHistoryForm(prev => ({
        ...prev,
        [sourceKey]: prev[targetKey as keyof typeof historyForm],
        [targetKey]: prev[sourceKey as keyof typeof historyForm]
      }));
    }
  };

  const saveHistoryMatch = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/matches/${editHistoryModal.id}/history`, {
        courtId: historyForm.courtId || null,
        teamA_player1: historyForm.ta1 || null, teamA_player2: historyForm.ta2 || null,
        teamB_player1: historyForm.tb1 || null, teamB_player2: historyForm.tb2 || null,
        scoreTeamA_set1: historyForm.sa1 || 0, scoreTeamB_set1: historyForm.sb1 || 0,
        scoreTeamA_set2: historyForm.sa2 || 0, scoreTeamB_set2: historyForm.sb2 || 0,
        scoreTeamA_set3: historyForm.sa3 || 0, scoreTeamB_set3: historyForm.sb3 || 0,
      });
      setEditHistoryModal(null);
      await fetchSessionData();
      addToast("History updated successfully");
    } catch (err) { addToast("Error updating history", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleResetBilling = async () => {
    if (isProcessing || !window.confirm(t('reset_billing_confirm', 'Are you sure you want to reset all player payments to Unpaid?'))) return;
    setIsProcessing(true);
    try {
      const promises = attendances.map(a =>
         api.put(`/sessions/${id}/attendances/${a.attendance.id}/payment`, { paymentAmount: 0, paymentStatus: 'unpaid' })
      );
      await Promise.all(promises);
      await fetchSessionData();
      addToast(t('billing_reset', 'Billing reset successfully.'));
    } catch (err) { addToast("Error resetting billing", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleUpdateDefaultFee = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}/billing/default-fee`, { defaultFee, memberDefaultFee });
      await fetchSessionData();
      addToast(t('fee_updated', 'Fees updated successfully'));
    } catch (err) { addToast("Error updating fees", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleUpdatePayment = async (attendanceId: number, paymentAmount: number, paymentStatus: string) => {
    try {
      await api.put(`/sessions/${id}/attendances/${attendanceId}/payment`, { paymentAmount, paymentStatus });
      await fetchSessionData();
    } catch (err) { addToast("Error updating payment", "error"); }
  };

  const savePaymentAmount = (attendanceId: number, status: string) => {
    handleUpdatePayment(attendanceId, editPaymentValue, status);
    setEditingPaymentId(null);
  };

  const handleStatusChange = (attendance: any, newStatus: string) => {
    let finalAmount = attendance.paymentAmount || 0;

    if (newStatus === 'paid') finalAmount = defaultFee;
    if (newStatus === 'member') finalAmount = memberDefaultFee;
    if (newStatus === 'free' || newStatus === 'unpaid' || newStatus === 'member_unpaid') finalAmount = 0;

    handleUpdatePayment(attendance.id, finalAmount, newStatus);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.post(`/sessions/${id}/expenses`, {
        description: expenseForm.description,
        amount: parseInt(expenseForm.amount)
      });
      setExpenseForm({ description: '', amount: '' });
      await fetchSessionData();
      addToast(t('expense_added', 'Expense added'));
    } catch (err) { addToast("Error adding expense", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (isProcessing || !window.confirm("Delete this expense?")) return;
    setIsProcessing(true);
    try {
      await api.delete(`/sessions/${id}/expenses/${expenseId}`);
      await fetchSessionData();
      addToast(t('expense_deleted', 'Expense deleted'));
    } catch (err) { addToast("Error deleting expense", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return; setIsProcessing(true);
    try {
      await api.put(`/sessions/${id}`, settingsForm);
      await fetchSessionData();
      addToast(t('save_settings', "Settings saved successfully"));
    } catch (err) { addToast("Error saving settings", "error"); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteSession = async () => {
    if (isProcessing || !window.confirm(t('delete_session_warning', "Delete session?"))) return;
    setIsProcessing(true);
    try {
      await api.delete(`/sessions/${id}`);
      navigate('/sessions');
    } catch (err) { addToast("Error deleting session", "error"); setIsProcessing(false); }
  };

  const renderWaitingListContent = () => (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      {waitingListPlayers.length === 0 ? (
        <div className="p-8 text-center text-faint text-sm font-medium">No available players waiting.</div>
      ) : (
        waitingListPlayers.map(p => (
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

  if (loading) return <div className="min-h-screen bg-app dark:bg-app-dark flex items-center justify-center text-muted-ink">{t('loading')}</div>;

  const inputStyles = "w-full px-3 py-2.5 bg-app dark:bg-surface-dark border border-default dark:border-subtle-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-ink transition-all text-primary dark:text-primary-dark";
  const settingsLimitType = settingsForm.matchLimit === 0 ? 'all' : ([1,2,3,4,5].includes(settingsForm.matchLimit) ? String(settingsForm.matchLimit) : 'custom');

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark text-primary dark:text-primary-dark font-sans flex flex-col">

      {/* Top Notification Toasts */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toastItem => (
          <div key={toastItem.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 fade-in duration-300 border ${toastItem.type === 'success' ? 'bg-ink border-ink text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
            {toastItem.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {toastItem.message}
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toastItem.id))} className="ml-4 hover:opacity-75"><X size={16}/></button>
          </div>
        ))}
      </div>

      {/* Universal Top Navigation */}
      <nav className="h-16 border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-ink dark:bg-ink-dark p-1.5 rounded-md flex items-center justify-center text-white dark:text-ink shrink-0">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-subtle dark:border-subtle-dark max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-muted dark:bg-elevated-dark border border-subtle dark:border-strong-dark flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-semibold truncate hidden sm:block">{communityData?.name}</span>
            </div>
            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-faint hover:text-ink dark:hover:text-ink-dark px-2 py-1.5 rounded-lg transition-colors">
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-muted-ink hover:text-ink dark:text-faint dark:hover:text-ink-dark rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-muted-ink hover:text-ink dark:text-faint dark:hover:text-ink-dark rounded-lg transition-colors shrink-0">
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Session Header Info */}
      <div className="bg-surface dark:bg-surface-dark border-b border-subtle dark:border-subtle-dark shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/sessions" className="p-2 sm:p-2.5 bg-app dark:bg-elevated-dark border border-subtle dark:border-strong-dark rounded-xl hover:bg-muted dark:hover:bg-strong-dark/80 transition-colors shrink-0">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{session?.name}</h1>
              <div className="text-xs sm:text-sm text-muted-ink font-medium mt-0.5">{session && new Date(session.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
            {(!session?.status || session?.status === 'scheduled' || session?.status === 'finished') && (
              <button disabled={isProcessing} onClick={handleStartSession} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
                <Play size={16} fill="currentColor"/>
                {session?.status === 'finished' ? t('restart_session', 'Restart Session') : t('start_session', 'Start Session')}
              </button>
            )}

            {session?.status === 'active' && (
              <>
                <SessionGlobalTimer startedAt={session?.startedAt} />
                <button disabled={isProcessing} onClick={handleEndSession} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
                  <Square size={16} fill="currentColor"/> {t('end_session', 'End Session')}
                </button>
              </>
            )}

            {session?.status === 'finished' && (
              <span className="bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint px-4 py-2.5 rounded-xl text-sm font-bold tracking-widest uppercase">
                {t('status_finished', 'FINISHED')}
              </span>
            )}

            <button disabled={isProcessing} onClick={exportSessionPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent-soft dark:bg-elevated-dark hover:bg-accent-soft dark:hover:bg-strong-dark text-ink dark:text-ink-dark px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border border-transparent dark:border-strong-dark shadow-sm disabled:opacity-50">
              <FileDown size={18}/> <span className="hidden sm:block">{t('export_pdf', 'Export PDF')}</span>
            </button>
          </div>
        </div>
        <div className="hidden sm:flex max-w-7xl mx-auto px-8 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-ink text-ink dark:text-ink' : 'border-transparent text-muted-ink hover:text-primary dark:hover:text-muted-dark'}`}>
              {tab.icon} {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="sm:hidden sticky top-16 z-20 px-4 py-3 bg-surface dark:bg-surface-dark border-b border-subtle dark:border-subtle-dark shadow-sm">
        <div className="relative">
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full appearance-none bg-app dark:bg-elevated-dark border border-subtle dark:border-strong-dark text-primary dark:text-primary-dark py-3 pl-11 pr-10 rounded-xl font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ink transition-all uppercase tracking-wide">
            {TABS.map(tab => <option key={tab.id} value={tab.id}>{t(tab.label)}</option>)}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink dark:text-ink pointer-events-none">{TABS.find(t => t.id === activeTab)?.icon}</div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none"><ChevronDown size={18} /></div>
        </div>
      </div>

      <main className={`flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto ${activeTab === 'matches' ? 'pb-24 lg:pb-8' : ''}`}>

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold shrink-0">{t('attendance')} <span className="text-faint ml-1">({visibleAttendances.length})</span></h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint dark:text-muted-ink" size={16} />
                  <input type="text" placeholder={t('search_players')} value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button onClick={() => setWalkInModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-muted hover:bg-elevated dark:bg-elevated-dark dark:hover:bg-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <UserPlus size={16}/> {t('add_walk_in')}
                  </button>
                  <button onClick={openAttendeeModal} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-ink hover:bg-ink-soft text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16}/> {t('add_attendee')}
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden sm:block bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark text-xs uppercase text-muted-ink font-semibold">
                  <tr><th className="p-4">Player</th><th className="p-4">{t('arrived_at')}</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {visibleAttendances.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted-ink">{t('no_players')}</td></tr> :
                   visibleAttendances.map(({ attendance, member }) => (
                    <tr key={attendance.id} className="hover:bg-app dark:hover:bg-elevated-dark/30 group">
                      <td className="p-4">
                        <div className="font-medium text-sm flex items-center gap-2 hover:text-ink dark:hover:text-ink-dark transition-colors cursor-pointer w-max" onClick={() => setPlayerDetailModal(member.id)}>
                          {member.name} {attendance.isWalkIn && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">W-IN</span>}
                          <Info size={14} className="text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-1.5">
                          <select
                            value={member.skillLevel}
                            disabled={isProcessing}
                            onChange={(e) => handleUpdateGrade(member.id, e.target.value)}
                            className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer outline-none appearance-none text-center hover:opacity-80 transition-opacity disabled:opacity-50 ${getGradeColor(member.skillLevel)}`}
                            title="Click to edit grade"
                          >
                            <option value="A1" className="bg-elevated text-white">A1</option>
                            <option value="A2" className="bg-elevated text-white">A2</option>
                            <option value="B1" className="bg-elevated text-white">B1</option>
                            <option value="B2" className="bg-elevated text-white">B2</option>
                            <option value="C1" className="bg-elevated text-white">C1</option>
                            <option value="C2" className="bg-elevated text-white">C2</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-ink">{new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                          {attendance.status === 'active' ? t('status_active') : t('resting')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {attendance.status === 'active' ? (
                            <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'resting')} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 rounded-lg transition-colors disabled:opacity-50" title={t('mark_resting')}><Pause size={16}/></button>
                          ) : (
                            <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'active')} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors disabled:opacity-50" title={t('mark_active')}><Check size={16}/></button>
                          )}
                          <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'cancelled')} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-lg transition-colors disabled:opacity-50" title={t('cancel_attendance')}><X size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden flex flex-col gap-3">
              {visibleAttendances.length === 0 ? <div className="p-8 text-center text-muted-ink border border-subtle dark:border-subtle-dark rounded-xl">{t('no_players')}</div> :
               visibleAttendances.map(({ attendance, member }) => (
                <div key={attendance.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2 hover:text-ink transition-colors cursor-pointer w-max" onClick={() => setPlayerDetailModal(member.id)}>
                      {member.name} {attendance.isWalkIn && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">W-IN</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <select
                        value={member.skillLevel}
                        disabled={isProcessing}
                        onChange={(e) => handleUpdateGrade(member.id, e.target.value)}
                        className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer outline-none appearance-none text-center hover:opacity-80 transition-opacity disabled:opacity-50 ${getGradeColor(member.skillLevel)}`}
                      >
                        <option value="A1" className="bg-elevated text-white">A1</option>
                        <option value="A2" className="bg-elevated text-white">A2</option>
                        <option value="B1" className="bg-elevated text-white">B1</option>
                        <option value="B2" className="bg-elevated text-white">B2</option>
                        <option value="C1" className="bg-elevated text-white">C1</option>
                        <option value="C2" className="bg-elevated text-white">C2</option>
                      </select>
                      <span className="text-xs text-muted-ink font-medium">• {t('arrived_at')} {new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                      {attendance.status === 'active' ? t('status_active') : t('resting')}
                    </span>
                    <div className="flex gap-1.5">
                      {attendance.status === 'active' ? (
                        <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'resting')} className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md disabled:opacity-50" title={t('mark_resting')}><Pause size={14}/></button>
                      ) : (
                        <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'active')} className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-md disabled:opacity-50" title={t('mark_active')}><Check size={14}/></button>
                      )}
                      <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'cancelled')} className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-md disabled:opacity-50" title={t('cancel_attendance')}><X size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COURTS TAB */}
        {activeTab === 'courts' && (
          <div className="animate-in fade-in duration-200 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{t('courts')}</h2>
              <button disabled={isProcessing} onClick={handleAddCourt} className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                <Plus size={16} /> {t('add_court')}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {courts.map(court => (
                <div key={court.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between transition-all">
                  {editCourtId === court.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input type="text" value={courtName} onChange={e => setCourtName(e.target.value)} className={inputStyles} autoFocus disabled={isProcessing}/>
                      <button disabled={isProcessing} onClick={() => handleUpdateCourt(court.id, court.isActive, courtName)} className="p-2.5 bg-ink text-white rounded-lg disabled:opacity-50"><Check size={18}/></button>
                      <button disabled={isProcessing} onClick={() => setEditCourtId(null)} className="p-2.5 bg-muted dark:bg-elevated-dark rounded-lg disabled:opacity-50"><X size={18}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="text-muted-ink dark:text-muted-ink cursor-grab" />
                      <span className={`font-semibold sm:text-lg ${!court.isActive && 'text-faint line-through'}`}>{court.name}</span>
                    </div>
                  )}

                  {editCourtId !== court.id && (
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input disabled={isProcessing} type="checkbox" className="sr-only peer" checked={court.isActive} onChange={() => handleUpdateCourt(court.id, !court.isActive, court.name)} />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-elevated-dark peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-strong-dark peer-checked:bg-emerald-500"></div>
                      </label>
                      <div className="flex items-center gap-1 border-l border-subtle dark:border-subtle-dark pl-4">
                        <button disabled={isProcessing} onClick={() => { setEditCourtId(court.id); setCourtName(court.name); }} className="p-2 text-faint hover:text-ink rounded-lg transition-colors disabled:opacity-50"><Edit2 size={16}/></button>
                        <button disabled={isProcessing} onClick={() => handleDeleteCourt(court.id)} className="p-2 text-faint hover:text-rose-600 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
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
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button disabled={session?.status !== 'active' || isProcessing} onClick={() => openEditMatchModal({ courtId: null, matchType: 'MD' })} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-surface dark:bg-elevated-dark hover:bg-app dark:hover:bg-strong-dark border border-subtle dark:border-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus size={16}/> {t('manual_match', 'Manual Match')}
                    </button>
                    <button disabled={session?.status !== 'active' || isProcessing} onClick={handleQueueMatch} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-muted dark:bg-elevated-dark hover:bg-elevated dark:hover:bg-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      <ListOrdered size={16}/> {t('queue_match')}
                    </button>
                    <button disabled={session?.status !== 'active' || isProcessing} onClick={handleAutoFillAllCourts} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-ink hover:bg-ink-soft text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      <Zap size={16}/> {t('auto_fill')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {courts.filter(c => c.isActive).map(court => {
                    const activeMatch = activeMatches.find(m => m.courtId === court.id);
                    const queuedMatch = queuedMatchesList.find(m => m.courtId === court.id);
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
                      {queuedMatchesList.map((match, index) => (
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
              </div>

              <div className="hidden lg:flex w-80 shrink-0 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm flex-col h-[calc(100vh-140px)] sticky top-24 overflow-hidden">
                <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-sm tracking-wide text-primary dark:text-primary-dark uppercase">{t('available_players', 'Available Players')}</h3>
                  <span className="bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark font-bold px-2 py-0.5 rounded-full text-xs">{waitingListPlayers.length}</span>
                </div>
                {renderWaitingListContent()}
              </div>

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
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="animate-in fade-in duration-200">
            <div className="flex flex-col gap-6">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-ink uppercase tracking-wider">{t('total_income', 'Total Income')}</p>
                    <p className="text-xl font-bold text-primary dark:text-primary-dark">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>

                <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-ink uppercase tracking-wider">{t('total_expense', 'Total Expense')}</p>
                    <p className="text-xl font-bold text-primary dark:text-primary-dark">{formatCurrency(totalExpense)}</p>
                  </div>
                </div>

                <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${netBalance >= 0 ? 'bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-ink uppercase tracking-wider">{t('net_balance', 'Net Balance')}</p>
                    <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-ink dark:text-ink-dark' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatCurrency(netBalance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Income Section */}
                <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm overflow-hidden flex flex-col">

                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold flex items-center gap-2 text-lg">
                        <DollarSign size={18} className="text-emerald-500"/> {t('player_payments', 'Player Payments')}
                      </h3>
                      <button onClick={handleOpenImportModal} disabled={isProcessing} className="flex items-center gap-2 bg-surface dark:bg-elevated-dark border border-subtle dark:border-strong-dark text-primary dark:text-primary-dark hover:bg-app dark:hover:bg-strong-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
                        <Users size={14} /> <span className="hidden sm:inline">{t('import_members', 'Import Members')}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 bg-surface dark:bg-elevated-dark border border-subtle dark:border-strong-dark p-1 rounded-lg">
                        <input type="number" value={defaultFee || ''} onChange={(e) => setDefaultFee(parseInt(e.target.value) || 0)} className="w-20 sm:w-24 bg-transparent outline-none text-right font-bold text-sm px-2 text-primary dark:text-primary-dark" placeholder={t('walk_in_fee', 'Walk-in')}/>
                        <div className="w-px h-5 bg-muted dark:bg-strong-dark"></div>
                        <input type="number" value={memberDefaultFee || ''} onChange={(e) => setMemberDefaultFee(parseInt(e.target.value) || 0)} className="w-20 sm:w-24 bg-transparent outline-none text-right font-bold text-sm px-2 text-primary dark:text-primary-dark" placeholder={t('member_fee', 'Member')}/>
                      </div>
                      <button onClick={handleUpdateDefaultFee} disabled={isProcessing} className="bg-ink hover:bg-ink-soft text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
                        {t('set_fee', 'Set Fee')}
                      </button>
                      <button onClick={handleResetBilling} disabled={isProcessing} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/30 rounded-lg transition-colors ml-1 disabled:opacity-50" title={t('reset_billing', 'Reset All Payments')}>
                        <RotateCcw size={16}/>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                      <input type="text" placeholder={t('search_players', 'Search players...')} value={billingSearch} onChange={(e) => setBillingSearch(e.target.value)} className={`${inputStyles} pl-9`} />
                    </div>
                  </div>

                  {/* Desktop Income Table */}
                  <div className="hidden sm:block overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-ink uppercase bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark">
                        <tr>
                          <th className="px-4 py-3">{t('player', 'Player')}</th>
                          <th className="px-4 py-3 text-right">{t('amount', 'Amount')}</th>
                          <th className="px-4 py-3 w-40">{t('status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                        {billingAttendances.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-ink">No players found</td></tr>}
                        {billingAttendances.map(({ member, attendance }) => (
                          <tr key={attendance.id} className="hover:bg-app dark:hover:bg-elevated-dark/50 transition-colors">
                            <td className="px-4 py-3 font-medium whitespace-nowrap">
                              {member.name}
                              {attendance.status === 'absent' && <span className="ml-2 text-[9px] font-bold tracking-widest uppercase text-faint border border-subtle dark:border-default-dark px-1.5 py-0.5 rounded bg-app dark:bg-app-dark">{t('absent', 'Absent')}</span>}
                            </td>
                            <td className="px-4 py-3 min-w-[120px] text-right">
                              {editingPaymentId === attendance.id ? (
                                <div className="flex items-center justify-end gap-2 w-full">
                                  <input
                                    type="number"
                                    autoFocus
                                    value={editPaymentValue || ''}
                                    onChange={(e) => setEditPaymentValue(parseInt(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 bg-surface dark:bg-surface-dark border border-ink rounded text-right font-bold outline-none"
                                    onKeyDown={(e) => { if (e.key === 'Enter') savePaymentAmount(attendance.id, attendance.paymentStatus || 'unpaid'); }}
                                  />
                                  <button onClick={() => savePaymentAmount(attendance.id, attendance.paymentStatus || 'unpaid')} className="p-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded"><Check size={14}/></button>
                                  <button onClick={() => setEditingPaymentId(null)} className="p-1 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded"><X size={14}/></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2 group cursor-pointer w-full" onClick={() => { setEditingPaymentId(attendance.id); setEditPaymentValue(attendance.paymentAmount || 0); }}>
                                  <span className="font-bold">{formatCurrency(attendance.paymentAmount || 0)}</span>
                                  <Edit2 size={12} className="text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={attendance.paymentStatus || 'unpaid'}
                                onChange={(e) => handleStatusChange(attendance, e.target.value)}
                                className={`w-full px-2 py-1.5 rounded outline-none border font-bold text-xs uppercase tracking-wider cursor-pointer ${
                                  (attendance.paymentStatus || 'unpaid') === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' :
                                  (attendance.paymentStatus || 'unpaid') === 'member' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' :
                                  (attendance.paymentStatus || 'unpaid') === 'member_unpaid' ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 dark:text-fuchsia-400' :
                                  (attendance.paymentStatus || 'unpaid') === 'free' ? 'bg-accent-soft border-accent text-ink dark:bg-accent-soft-dark dark:border-strong-dark dark:text-ink-dark' :
                                  'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                                }`}
                              >
                                <option value="unpaid">{t('unpaid', 'Unpaid')}</option>
                                <option value="paid">{t('paid', 'Paid')}</option>
                                <option value="member">{t('member', 'Member')}</option>
                                <option value="member_unpaid">{t('member_unpaid', 'Member (Unpaid)')}</option>
                                <option value="free">{t('free', 'Free')}</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Income Cards */}
                  <div className="sm:hidden flex flex-col p-4 gap-3 bg-app dark:bg-app-dark flex-1">
                    {billingAttendances.length === 0 && <div className="text-center text-muted-ink font-medium py-4">No players found</div>}
                    {billingAttendances.map(({ member, attendance }) => (
                      <div key={attendance.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="font-bold text-sm dark:text-primary-dark truncate">{member.name}</span>
                            {attendance.status === 'absent' && <span className="text-[9px] font-bold tracking-widest uppercase text-faint border border-subtle dark:border-default-dark px-1 py-0.5 rounded bg-app dark:bg-app-dark shrink-0">{t('absent', 'Absent')}</span>}
                          </div>
                          <select
                            value={attendance.paymentStatus || 'unpaid'}
                            onChange={(e) => handleStatusChange(attendance, e.target.value)}
                            className={`px-2 py-1 rounded outline-none border font-bold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer ${
                              (attendance.paymentStatus || 'unpaid') === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' :
                              (attendance.paymentStatus || 'unpaid') === 'member' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' :
                              (attendance.paymentStatus || 'unpaid') === 'member_unpaid' ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 dark:text-fuchsia-400' :
                              (attendance.paymentStatus || 'unpaid') === 'free' ? 'bg-accent-soft border-accent text-ink dark:bg-accent-soft-dark dark:border-strong-dark dark:text-ink-dark' :
                              'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                            }`}
                          >
                            <option value="unpaid">{t('unpaid', 'Unpaid')}</option>
                            <option value="paid">{t('paid', 'Paid')}</option>
                            <option value="member">{t('member', 'Member')}</option>
                            <option value="member_unpaid">{t('member_unpaid', 'Member (Unpaid)')}</option>
                            <option value="free">{t('free', 'Free')}</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-xs text-muted-ink font-bold uppercase tracking-widest">{t('amount', 'Amount')}</span>
                          {editingPaymentId === attendance.id ? (
                            <div className="flex items-center justify-end gap-2 w-full">
                              <input
                                type="number"
                                autoFocus
                                value={editPaymentValue || ''}
                                onChange={(e) => setEditPaymentValue(parseInt(e.target.value) || 0)}
                                className="w-full max-w-[100px] px-2 py-1.5 bg-surface dark:bg-app-dark border border-ink rounded text-right font-bold outline-none"
                              />
                              <button onClick={() => savePaymentAmount(attendance.id, attendance.paymentStatus || 'unpaid')} className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded"><Check size={16}/></button>
                              <button onClick={() => setEditingPaymentId(null)} className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded"><X size={16}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => { setEditingPaymentId(attendance.id); setEditPaymentValue(attendance.paymentAmount || 0); }}>
                              <span className="font-bold">{formatCurrency(attendance.paymentAmount || 0)}</span>
                              <Edit2 size={14} className="text-ink" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Section */}
                <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm overflow-hidden flex flex-col h-max">
                  <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
                    <h3 className="font-bold flex items-center gap-2"><DollarSign size={18} className="text-rose-500"/> {t('expenses', 'Expenses')}</h3>
                  </div>

                  <div className="p-4 border-b border-subtle dark:border-subtle-dark">
                    <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder={t('description', 'Description (e.g., Shuttlecocks)')}
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                        className={`${inputStyles} flex-1`}
                        required
                        disabled={isProcessing}
                      />
                      <input
                        type="number"
                        placeholder={t('amount', 'Amount')}
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        className={`${inputStyles} sm:w-32 text-right`}
                        required
                        disabled={isProcessing}
                      />
                      <button disabled={isProcessing} type="submit" className="bg-ink dark:bg-muted text-white dark:text-primary hover:bg-elevated dark:hover:bg-surface px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50">
                        <Plus size={16} /> <span className="sm:hidden lg:inline">{t('add_expense', 'Add Expense')}</span>
                      </button>
                    </form>
                  </div>

                  {/* Desktop Expenses Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-ink uppercase bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark">
                        <tr>
                          <th className="px-4 py-3">{t('description', 'Description')}</th>
                          <th className="px-4 py-3 text-right">{t('amount', 'Amount')}</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                        {expenses.length === 0 && (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-ink font-medium">No expenses recorded.</td></tr>
                        )}
                        {expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-app dark:hover:bg-elevated-dark/50 transition-colors">
                            <td className="px-4 py-3 font-medium">{expense.description}</td>
                            <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button disabled={isProcessing} onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 text-faint hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors disabled:opacity-50">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Expenses Cards */}
                  <div className="sm:hidden flex flex-col gap-3 p-4 bg-app dark:bg-app-dark">
                    {expenses.length === 0 && <div className="text-center text-muted-ink font-medium py-4">No expenses recorded.</div>}
                    {expenses.map(expense => (
                      <div key={expense.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm dark:text-primary-dark">{expense.description}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold mt-1">{formatCurrency(expense.amount)}</span>
                        </div>
                        <button disabled={isProcessing} onClick={() => handleDeleteExpense(expense.id)} className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
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
                filteredHistory.map(match => {
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
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in duration-200 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">{t('leaderboard', 'Leaderboard')}</h2>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                  <input type="text" placeholder={t('search_players', 'Search players...')} value={leaderboardSearch} onChange={(e) => setLeaderboardSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
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
            </div>

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
                      sessionLeaderboardData.map((player) => {
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
                            <td className="p-5 text-center font-black text-primary-soft dark:text-muted-dark">{player.played}</td>
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
              {sessionLeaderboardData.map((player) => {
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
          </div>
        )}

        {/* PLAYTIME TAB */}
        {activeTab === 'playtime' && (
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
                    {playtimeData.map(({ member, attendance, playedGames }) => (
                      <tr key={member.id} className="hover:bg-app dark:hover:bg-elevated-dark/30">
                        <td className="p-4">
                          <div className="font-bold text-sm dark:text-primary-dark truncate cursor-pointer hover:text-ink transition-colors" onClick={() => setPlayerDetailModal(member.id)}>{member.name}</div>
                          <div className="mt-1"><span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(member.skillLevel)}`}>{member.skillLevel}</span></div>
                        </td>
                        <td className="p-4 relative">
                          <div className="flex flex-wrap gap-2">
                            {playedGames.length === 0 ? <span className="text-xs text-faint">No matches yet</span> :
                              playedGames.map((g, i) => (
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
                                      }`}>{t(g.result.toLowerCase(), g.result)}</span>
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
                          <span className="font-black text-lg text-primary-soft dark:text-muted-dark">{playedGames.length}</span>
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

            {/* Mobile Playtime Cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {playtimeData.map(({ member, playedGames }) => (
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
                      playedGames.map((g, i) => (
                        <span key={i} className={`px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap ${getMatchTypeColor(g.type)} ${g.result === 'Ongoing' && 'animate-pulse ring-1 ring-blue-400'}`}>{g.type}</span>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold mb-6">{t('session_settings')}</h2>
            <form onSubmit={handleSaveSettings} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm p-6 flex flex-col gap-6 mb-8">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Session Name</label>
                <input disabled={isProcessing} type="text" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className={inputStyles} required />
              </div>

              <div className="pt-4 border-t border-subtle dark:border-subtle-dark">
                <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">{t('match_limit', 'Leaderboard Match Limit')}</label>
                <div className="flex gap-3">
                  <select
                    disabled={isProcessing}
                    value={settingsLimitType}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'all') setSettingsForm({...settingsForm, matchLimit: 0});
                      else if (val === 'custom') setSettingsForm({...settingsForm, matchLimit: 6});
                      else setSettingsForm({...settingsForm, matchLimit: parseInt(val)});
                    }}
                    className={`${inputStyles} font-medium flex-1 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}
                  >
                    <option value="all">{t('all_games', 'All Games')}</option>
                    <option value="1">1 Game</option>
                    <option value="2">2 Games</option>
                    <option value="3">3 Games</option>
                    <option value="4">4 Games</option>
                    <option value="5">5 Games</option>
                    <option value="custom">{t('custom_amount', 'Custom Amount')}</option>
                  </select>
                  {settingsLimitType === 'custom' && (
                    <input
                      disabled={isProcessing}
                      type="number"
                      min="1"
                      value={settingsForm.matchLimit}
                      onChange={e => setSettingsForm({...settingsForm, matchLimit: parseInt(e.target.value) || 0})}
                      className={`${inputStyles} w-24 text-center font-bold`}
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-subtle dark:border-subtle-dark">
                <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Scoring System</label>
                <select disabled={isProcessing} value={settingsForm.scoringSystem || ''} onChange={e => setSettingsForm({...settingsForm, scoringSystem: e.target.value})} className={`${inputStyles} font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}>
                  <option value="BWF 21 Points x 3 Sets">BWF 21 Points x 3 Sets</option>
                  <option value="BWF 15 Points x 3 Sets">BWF 15 Points x 3 Sets</option>
                  <option value="42 Points x 1 Set">42 Points x 1 Set</option>
                  <option value="30 Points x 1 Set">30 Points x 1 Set</option>
                  <option value="custom">Custom Sets & Points</option>
                </select>
              </div>
              {settingsForm.scoringSystem === 'custom' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Custom Sets</label>
                    <input disabled={isProcessing} type="number" min={1} value={settingsForm.customSets || ''} onChange={e => setSettingsForm({...settingsForm, customSets: parseInt(e.target.value)})} className={inputStyles} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Points Per Set</label>
                    <input disabled={isProcessing} type="number" min={1} value={settingsForm.customPoints || ''} onChange={e => setSettingsForm({...settingsForm, customPoints: parseInt(e.target.value)})} className={inputStyles} />
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-subtle dark:border-subtle-dark">
                <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Pairing Strictness</label>
                <select disabled={isProcessing} value={settingsForm.pairingRule || ''} onChange={e => setSettingsForm({...settingsForm, pairingRule: e.target.value})} className={`${inputStyles} font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}>
                  <option value="very_strict">Very Strict (Same Grade Only)</option>
                  <option value="strict">Strict (+/- 1 Grade)</option>
                  <option value="moderate">Moderate (+/- 2 Grades)</option>
                  <option value="randomize">Randomize (Any)</option>
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button disabled={isProcessing} type="submit" className="px-6 py-3 bg-ink hover:bg-ink-soft text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Save size={16}/> {t('save_settings')}
                </button>
              </div>
            </form>

            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-rose-700 dark:text-rose-500">{t('danger_zone')}</h3>
                <p className="text-sm text-rose-600/70 dark:text-rose-400/70 mt-1">{t('delete_session_warning')}</p>
              </div>
              <button disabled={isProcessing} onClick={handleDeleteSession} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50">
                Delete Session
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Import Members Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">{t('import_members')}</h3>
              <button disabled={isProcessing} onClick={() => setImportModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="p-6">
              {membershipPeriods.length === 0 ? (
                <div className="text-center text-muted-ink py-4">No active membership periods found.</div>
              ) : (
                <>
                  <label className="block text-sm font-bold mb-2 text-primary-soft dark:text-muted-dark">Select Membership Period</label>
                  <select
                    value={selectedPeriodId}
                    onChange={e => setSelectedPeriodId(e.target.value)}
                    className={`${inputStyles} font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}
                  >
                    {membershipPeriods.map(period => (
                      <option key={period.id} value={period.id}>{period.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-ink mt-4">
                    Importing will sync all members from the selected period into this session's ledger. They will be marked as "Absent" until they physically arrive.
                  </p>
                </>
              )}
            </div>

            <div className="p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-end gap-3 rounded-b-2xl">
              <button disabled={isProcessing} onClick={() => setImportModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={isProcessing || membershipPeriods.length === 0} onClick={confirmImport} className="px-6 py-2.5 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-lg shadow-sm transition-colors disabled:opacity-50">Import Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Match Edit Modal */}
      {editMatchModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-lg">{editMatchModal.id ? 'Edit Match Players' : 'Create Manual Match'}</h3>
              <button disabled={isProcessing} onClick={() => setEditMatchModal(null)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 relative items-stretch min-h-[400px]">
              <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark flex items-center justify-center font-black">A</div>
                  <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team A</h4>
                </div>
                <div className="flex flex-col gap-4">
                  <PlayerSlotSelect
                    options={getOptionsFor('ta1')} value={manualPlayers.ta1} t={t}
                    currentName={getMemberData(manualPlayers.ta1)?.name} currentGrade={getMemberData(manualPlayers.ta1)?.skillLevel}
                    swaps={getSwapListFor('ta1')} onSwap={(id: number) => handleSwapWithinMatch('ta1', id)}
                    onChange={(v: number) => setManualPlayers({...manualPlayers, ta1: v})}
                    placeholder="- Select Player 1 -"
                  />
                  <PlayerSlotSelect
                    options={getOptionsFor('ta2')} value={manualPlayers.ta2} t={t}
                    currentName={getMemberData(manualPlayers.ta2)?.name} currentGrade={getMemberData(manualPlayers.ta2)?.skillLevel}
                    swaps={getSwapListFor('ta2')} onSwap={(id: number) => handleSwapWithinMatch('ta2', id)}
                    onChange={(v: number) => setManualPlayers({...manualPlayers, ta2: v})}
                    placeholder="- Select Player 2 -"
                  />
                </div>
              </div>

              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface dark:bg-app-dark border border-subtle dark:border-subtle-dark shadow-md items-center justify-center font-black text-faint z-10">VS</div>
              <div className="md:hidden text-center text-faint font-black text-lg py-2">VS</div>

              <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6 justify-end md:justify-start">
                  <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">B</div>
                  <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team B</h4>
                  <div className="hidden md:flex w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 items-center justify-center font-black">B</div>
                </div>
                <div className="flex flex-col gap-4">
                  <PlayerSlotSelect
                    options={getOptionsFor('tb1')} value={manualPlayers.tb1} t={t}
                    currentName={getMemberData(manualPlayers.tb1)?.name} currentGrade={getMemberData(manualPlayers.tb1)?.skillLevel}
                    swaps={getSwapListFor('tb1')} onSwap={(id: number) => handleSwapWithinMatch('tb1', id)}
                    onChange={(v: number) => setManualPlayers({...manualPlayers, tb1: v})}
                    placeholder="- Select Player 1 -"
                  />
                  <PlayerSlotSelect
                    options={getOptionsFor('tb2')} value={manualPlayers.tb2} t={t}
                    currentName={getMemberData(manualPlayers.tb2)?.name} currentGrade={getMemberData(manualPlayers.tb2)?.skillLevel}
                    swaps={getSwapListFor('tb2')} onSwap={(id: number) => handleSwapWithinMatch('tb2', id)}
                    onChange={(v: number) => setManualPlayers({...manualPlayers, tb2: v})}
                    placeholder="- Select Player 2 -"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button disabled={isProcessing} onClick={() => setEditMatchModal(null)} className="px-5 py-2.5 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={isProcessing} onClick={saveManualMatch} className="px-6 py-2.5 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-lg shadow-sm transition-colors disabled:opacity-50">Save Players</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {editHistoryModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-lg">{t('edit_history')}</h3>
              <button disabled={isProcessing} onClick={() => setEditHistoryModal(null)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 overflow-y-auto relative">
              <div className="w-full bg-app dark:bg-elevated-dark/30 p-4 rounded-xl border border-subtle dark:border-subtle-dark">
                 <label className="block text-xs font-semibold mb-2 text-primary-soft dark:text-faint">Court Played On</label>
                 <select disabled={isProcessing} value={historyForm.courtId} onChange={e => setHistoryForm({...historyForm, courtId: parseInt(e.target.value)})} className={inputStyles}>
                   <option value={0}>Unknown / Deleted Court</option>
                   {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative items-stretch">
                <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark flex items-center justify-center font-black">A</div>
                    <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team A</h4>
                  </div>
                  <div className="flex flex-col gap-4">
                    <PlayerSlotSelect
                      options={historyPlayerOptions.filter(m => m.id !== historyForm.ta2 && m.id !== historyForm.tb1 && m.id !== historyForm.tb2)}
                      value={historyForm.ta1} t={t} currentName={getMemberData(historyForm.ta1)?.name} currentGrade={getMemberData(historyForm.ta1)?.skillLevel}
                      swaps={getHistorySwapListFor('ta1')} onSwap={(id: number) => handleSwapWithinHistory('ta1', id)}
                      onChange={(v: number) => setHistoryForm({...historyForm, ta1: v})} placeholder="- Select Player 1 -"
                    />
                    <PlayerSlotSelect
                      options={historyPlayerOptions.filter(m => m.id !== historyForm.ta1 && m.id !== historyForm.tb1 && m.id !== historyForm.tb2)}
                      value={historyForm.ta2} t={t} currentName={getMemberData(historyForm.ta2)?.name} currentGrade={getMemberData(historyForm.ta2)?.skillLevel}
                      swaps={getHistorySwapListFor('ta2')} onSwap={(id: number) => handleSwapWithinHistory('ta2', id)}
                      onChange={(v: number) => setHistoryForm({...historyForm, ta2: v})} placeholder="- Select Player 2 -"
                    />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <button type="button" onClick={() => setHistorySetView(v => v - 1)} disabled={historySetView <= 1 || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <label className="block text-xs font-semibold text-primary-soft dark:text-faint text-center uppercase tracking-widest">Score (Set {historySetView})</label>
                      <button type="button" onClick={() => setHistorySetView(v => v + 1)} disabled={historySetView >= maxSets || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                    <input
                       disabled={isProcessing}
                       type="number"
                       value={historyForm[`sa${historySetView}` as keyof typeof historyForm] || ''} placeholder="0"
                       onChange={e => setHistoryForm({...historyForm, [`sa${historySetView}`]: parseInt(e.target.value) || 0})}
                       className={`${inputStyles} text-center font-black text-2xl py-4 ${(historyForm[`sa${historySetView}` as keyof typeof historyForm] as number) > (historyForm[`sb${historySetView}` as keyof typeof historyForm] as number) ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`}
                    />
                  </div>
                </div>

                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface dark:bg-app-dark border border-subtle dark:border-subtle-dark shadow-md items-center justify-center font-black text-faint z-10">VS</div>
                <div className="md:hidden text-center text-faint font-black text-lg">VS</div>

                <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6 justify-end md:justify-start">
                    <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">B</div>
                    <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team B</h4>
                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 items-center justify-center font-black">B</div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <PlayerSlotSelect
                      options={historyPlayerOptions.filter(m => m.id !== historyForm.ta1 && m.id !== historyForm.ta2 && m.id !== historyForm.tb2)}
                      value={historyForm.tb1} t={t} currentName={getMemberData(historyForm.tb1)?.name} currentGrade={getMemberData(historyForm.tb1)?.skillLevel}
                      swaps={getHistorySwapListFor('tb1')} onSwap={(id: number) => handleSwapWithinHistory('tb1', id)}
                      onChange={(v: number) => setHistoryForm({...historyForm, tb1: v})} placeholder="- Select Player 1 -"
                    />
                    <PlayerSlotSelect
                      options={historyPlayerOptions.filter(m => m.id !== historyForm.ta1 && m.id !== historyForm.ta2 && m.id !== historyForm.tb1)}
                      value={historyForm.tb2} t={t} currentName={getMemberData(historyForm.tb2)?.name} currentGrade={getMemberData(historyForm.tb2)?.skillLevel}
                      swaps={getHistorySwapListFor('tb2')} onSwap={(id: number) => handleSwapWithinHistory('tb2', id)}
                      onChange={(v: number) => setHistoryForm({...historyForm, tb2: v})} placeholder="- Select Player 2 -"
                    />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <button type="button" onClick={() => setHistorySetView(v => v - 1)} disabled={historySetView <= 1 || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <label className="block text-xs font-semibold text-primary-soft dark:text-faint text-center uppercase tracking-widest">Score (Set {historySetView})</label>
                      <button type="button" onClick={() => setHistorySetView(v => v + 1)} disabled={historySetView >= maxSets || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                    <input
                       disabled={isProcessing}
                       type="number"
                       value={historyForm[`sb${historySetView}` as keyof typeof historyForm] || ''} placeholder="0"
                       onChange={e => setHistoryForm({...historyForm, [`sb${historySetView}`]: parseInt(e.target.value) || 0})}
                       className={`${inputStyles} text-center font-black text-2xl py-4 ${(historyForm[`sb${historySetView}` as keyof typeof historyForm] as number) > (historyForm[`sa${historySetView}` as keyof typeof historyForm] as number) ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button disabled={isProcessing} onClick={() => setEditHistoryModal(null)} className="px-5 py-2.5 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={isProcessing} onClick={saveHistoryMatch} className="px-6 py-2.5 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-lg shadow-sm transition-colors disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete/Cancel Match */}
      {confirmDeleteMatchId && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl border border-subtle dark:border-subtle-dark p-6 text-center">
             <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 mx-auto flex items-center justify-center mb-4">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">{t('confirm_cancel_title')}</h3>
             <p className="text-muted-ink dark:text-faint text-sm mb-6">{t('confirm_cancel_desc')}</p>
             <div className="flex gap-3">
               <button disabled={isProcessing} onClick={() => setConfirmDeleteMatchId(null)} className="flex-1 py-3 bg-muted dark:bg-elevated-dark hover:bg-muted dark:hover:bg-strong-dark rounded-xl font-bold transition-colors disabled:opacity-50">{t('abort')}</button>
               <button disabled={isProcessing} onClick={handleConfirmDeleteMatch} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{t('confirm')}</button>
             </div>
          </div>
        </div>
      )}

      {/* Swap Court Modal */}
      {swapCourtModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">Move to Court</h3>
              <button disabled={isProcessing} onClick={() => setSwapCourtModal(null)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-2">

              {swapCourtModal.status !== 'on_court' && swapCourtModal.courtId !== null && (
                <button disabled={isProcessing} onClick={() => handleSwapCourt(swapCourtModal.id, null)} className="w-full text-left p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors font-bold flex justify-between items-center text-amber-700 dark:text-amber-500 mb-2 disabled:opacity-50">
                  Move to Queue (Waiting List)
                  <ListOrdered size={16} />
                </button>
              )}

              {courts.filter(c => c.isActive && c.id !== swapCourtModal.courtId).length === 0 ? (
                <div className="text-center text-muted-ink py-4">No other active courts available.</div>
              ) : (
                courts.filter(c => c.isActive && c.id !== swapCourtModal.courtId).map(c => (
                  <button disabled={isProcessing} key={c.id} onClick={() => handleSwapCourt(swapCourtModal.id, c.id)} className="w-full text-left p-4 rounded-xl border border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark hover:bg-accent-soft hover:border-ink dark:hover:bg-elevated-dark dark:hover:dark:border-strong-dark transition-colors font-bold flex justify-between items-center disabled:opacity-50">
                    {c.name}
                    <ArrowRightLeft size={16} className="text-faint" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-select Attendee Modal */}
      {isAttendeeModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">{t('add_attendee')}</h3>
              <button disabled={isProcessing} onClick={() => setAttendeeModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
            </div>

            <div className="p-4 border-b border-subtle dark:border-subtle-dark">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                <input disabled={isProcessing} type="text" placeholder={t('search_players')} value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-app dark:bg-app-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm disabled:opacity-50" autoFocus />
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 bg-surface dark:bg-surface-dark">
              {availableMembersModal.length === 0 ? <div className="p-8 text-center text-muted-ink">{t('no_players')}</div> :
               availableMembersModal.map(member => (
                <div key={member.id} className={`flex items-center p-3 hover:bg-app dark:hover:bg-elevated-dark/50 rounded-xl cursor-pointer transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`} onClick={() => toggleSelectAttendee(member.id)}>
                  <div className="flex items-center gap-4 w-full">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAttendees.includes(member.id) ? 'bg-ink border-ink text-white' : 'border-default dark:border-strong-dark'}`}>
                      {selectedAttendees.includes(member.id) && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{member.name}</div>
                      <div className="text-xs text-muted-ink mt-0.5">{member.skillLevel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <button onClick={handleAddSelectedAttendees} disabled={selectedAttendees.length === 0 || isProcessing} className="w-full py-3 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {t('add_selected').replace('{{count}}', selectedAttendees.length.toString())}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">{t('add_walk_in')}</h3>
              <button disabled={isProcessing} onClick={() => setWalkInModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
            </div>
            <form onSubmit={handleWalkIn} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Name</label>
                <input disabled={isProcessing} type="text" required placeholder="Walk-in Player Name" value={walkInForm.name} onChange={e => setWalkInForm({...walkInForm, name: e.target.value})} className={inputStyles} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Gender</label>
                  <select disabled={isProcessing} value={walkInForm.gender} onChange={e => setWalkInForm({...walkInForm, gender: e.target.value})} className={`${inputStyles} font-medium`}>
                    <option value="male">♂ Male</option><option value="female">♀ Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Skill Level</label>
                  <select disabled={isProcessing} value={walkInForm.skillLevel} onChange={e => setWalkInForm({...walkInForm, skillLevel: e.target.value})} className={`${inputStyles} font-medium`}>
                    <option value="A1">A1</option><option value="A2">A2</option>
                    <option value="B1">B1</option><option value="B2">B2</option>
                    <option value="C1">C1</option><option value="C2">C2</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button disabled={isProcessing} type="button" onClick={() => setWalkInModalOpen(false)} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium bg-muted dark:bg-elevated-dark hover:bg-muted dark:hover:bg-strong-dark rounded-lg transition-colors disabled:opacity-50">Cancel</button>
                <button disabled={isProcessing} type="submit" className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-lg shadow-sm transition-colors disabled:opacity-50">Add Walk-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {playerDetailModal && selectedDetailPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent-soft dark:bg-elevated-dark flex items-center justify-center text-ink dark:text-muted-dark font-bold">
                  {selectedDetailPlayer?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{selectedDetailPlayer?.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(selectedDetailPlayer?.skillLevel)}`}>{selectedDetailPlayer?.skillLevel}</span>
                    <span className="text-xs text-muted-ink font-medium capitalize">{selectedDetailPlayer?.gender}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={isProcessing} onClick={() => exportPlayerPDF(selectedDetailPlayer?.id || 0, selectedDetailPlayer?.name || 'Unknown', selectedDetailGames)} className="px-4 py-2 bg-accent-soft dark:bg-elevated-dark text-ink dark:text-ink-dark hover:bg-accent-soft dark:hover:bg-strong-dark rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-transparent dark:border-strong-dark disabled:opacity-50">
                  <FileDown size={14}/> {t('export_pdf', 'Export PDF')}
                </button>
                <button disabled={isProcessing} onClick={() => setPlayerDetailModal(null)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                 <div className="bg-app dark:bg-elevated-dark/30 border border-subtle dark:border-subtle-dark p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-primary dark:text-primary-dark">{selectedDetailGames.length}</div>
                   <div className="text-[10px] font-bold text-muted-ink uppercase tracking-widest mt-1">{t('matches_played', 'MATCHES PLAYED')}</div>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedDetailGames.filter(g => g.result === 'Won').length}</div>
                   <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-1">{t('won', 'WON')}</div>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-rose-600 dark:text-rose-500">{selectedDetailGames.filter(g => g.result === 'Lost').length}</div>
                   <div className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mt-1">{t('lost', 'LOST')}</div>
                 </div>
                 <div className="bg-accent-soft dark:bg-accent-soft-dark border border-accent dark:border-subtle-dark p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-ink dark:text-ink-dark">
                     {selectedDetailGames.filter(g => g.result !== 'Ongoing').length > 0
                       ? Math.round((selectedDetailGames.filter(g => g.result === 'Won').length / selectedDetailGames.filter(g => g.result !== 'Ongoing').length) * 100)
                       : 0}%
                   </div>
                   <div className="text-[10px] font-bold text-ink/70 uppercase tracking-widest mt-1">{t('win_rate', 'WIN RATE')}</div>
                 </div>
              </div>

              <h4 className="font-bold mb-4">{t('history', 'History')}</h4>
              <div className="flex flex-col gap-3">
                {selectedDetailGames.length === 0 ? <div className="p-8 text-center text-muted-ink border border-subtle dark:border-subtle-dark rounded-xl">{t('no_history', 'No history found')}</div> :
                 selectedDetailGames.map((g, i) => (
                   <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm">
                     <div className="p-4 flex-1 flex items-center justify-between">
                       <div className="flex flex-col gap-1 w-1/3">
                         <span className="text-[10px] font-bold text-faint uppercase tracking-widest">{t('partner', 'PARTNER')}</span>
                         <span className="font-bold text-sm truncate">{g.partnerName}</span>
                       </div>
                       <div className="flex flex-col items-center justify-center px-4 w-1/3 border-x border-subtle dark:border-subtle-dark">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1 border ${getMatchTypeColor(g.type)} whitespace-nowrap`}>{g.type}</span>
                         <span className="font-black text-lg text-primary dark:text-primary-dark text-center whitespace-nowrap">
                            {g.result === 'Ongoing' ? (
                               <span className="text-ink text-sm">Playing...</span>
                            ) : (
                               g.scoreString || `${g.myScore} - ${g.oppScore}`
                            )}
                         </span>
                       </div>
                       <div className="flex flex-col gap-1 w-1/3 text-right">
                         <span className="text-[10px] font-bold text-faint uppercase tracking-widest">{t('opponents', 'OPPONENTS')}</span>
                         <span className="font-bold text-sm truncate">{g.opp1Name}</span>
                         <span className="font-bold text-sm truncate">{g.opp2Name}</span>
                       </div>
                     </div>
                     <div className={`p-4 sm:w-24 shrink-0 flex items-center justify-center font-bold text-sm uppercase tracking-widest ${
                        g.result === 'Won' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                        g.result === 'Lost' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' :
                        g.result === 'Ongoing' ? 'bg-accent-soft text-ink dark:bg-accent-soft-dark animate-pulse' :
                        'bg-app text-muted-ink dark:bg-elevated-dark'
                     }`}>
                       {t(g.result.toLowerCase(), g.result)}
                     </div>
                   </div>
                 ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}