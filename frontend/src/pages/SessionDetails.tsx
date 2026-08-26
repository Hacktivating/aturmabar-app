import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Users, SquareStack, Play, History, Clock, Settings as SettingsIcon, 
  Plus, UserPlus, Check, Pause, X, Edit2, Zap, Globe, Sun, Moon, LogOut, ChevronDown, Search, Trash2, GripVertical, ArrowRightLeft, ListOrdered, AlertCircle, AlertTriangle, Save, ChevronLeft, ChevronRight, FileDown, Info, Square
} from 'lucide-react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TABS = [
  { id: 'attendance', label: 'attendance', icon: <Users size={18} /> },
  { id: 'courts', label: 'courts', icon: <SquareStack size={18} /> },
  { id: 'matches', label: 'matches', icon: <Play size={18} /> },
  { id: 'history', label: 'history', icon: <History size={18} /> },
  { id: 'playtime', label: 'playtime', icon: <Clock size={18} /> },
  { id: 'settings', label: 'settings', icon: <SettingsIcon size={18} /> }
];

// Custom Hook to robustly handle missing dates and timezone drifts
const useSafeTimer = (startedAt: string | null | undefined) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Fallback to exactly NOW if startedAt is completely missing from database
    let validStart = startedAt ? new Date(startedAt).getTime() : Date.now();
    
    if (isNaN(validStart)) {
      validStart = Date.now();
    }
    
    const now = Date.now();

    // Fix: If timestamp parsed into the future by > 1 minute, it's a timezone serialization bug
    if (validStart > now + 60000 && startedAt) {
        const stripped = startedAt.endsWith('Z') ? startedAt.slice(0, -1) : startedAt;
        const strippedTime = new Date(stripped).getTime();
        if (!isNaN(strippedTime) && strippedTime <= now + 60000) {
            validStart = strippedTime;
        } else {
            validStart = now;
        }
    }
    
    // Safety clamp: If server clock is still ahead, lock it to component mount time
    if (validStart > now) validStart = now;

    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - validStart) / 1000)));
    
    tick(); // Instant first tick
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
  return <span className="text-[#10B981] font-mono font-bold tracking-widest">{h}:{m}:{s}</span>;
};

const SessionGlobalTimer = ({ startedAt }: { startedAt: string | null | undefined }) => {
  const elapsed = useSafeTimer(startedAt);
  
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="text-blue-600 dark:text-blue-400 font-mono font-black text-xl tracking-widest">{h}:{m}:{s}</span>;
};

const getGradeColor = (levelId: string | undefined | null) => {
  switch (levelId) {
    case 'A1': return 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent';
    case 'A2': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'B1': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'B2': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'C1': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'C2': return 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400 border-lime-200 dark:border-lime-800';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
};

const getMatchTypeColor = (type: string) => {
  switch(type) {
    case 'MD': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'WD': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    case 'XD': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
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
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${value === 0 && !currentName ? 'border-dashed border-slate-300 dark:border-[#334155] bg-transparent hover:bg-slate-100 dark:hover:bg-[#1E293B]/50' : 'border-solid border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1120] shadow-sm hover:border-blue-500 dark:hover:border-blue-500'}`}
      >
        {value === 0 && !currentName ? (
          <div className="flex items-center gap-3 text-slate-500">
            <Plus size={18} /> <span className="font-medium text-sm">{placeholder}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate text-slate-900 dark:text-white">{displayName}</div>
            </div>
            <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${getGradeColor(displayGrade)}`}>
              {displayGrade || '-'}
            </span>
            <ChevronDown size={16} className="text-slate-400 shrink-0 ml-1" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 z-[100] w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-2xl flex flex-col max-h-72 overflow-hidden ring-1 ring-black/5">
          <div className="p-2 border-b border-slate-100 dark:border-[#1E293B] shrink-0 bg-slate-50 dark:bg-[#0B1120]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder={t('search_players_to_select')} value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white dark:bg-[#0F172A] pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none border border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-slate-100" autoFocus />
            </div>
          </div>
          <div className="p-1 overflow-y-auto flex-1 bg-white dark:bg-[#0F172A] divide-y divide-slate-100 dark:divide-[#1E293B]">
            <div className="py-1">
              <div onClick={() => { onChange(0); setIsOpen(false); setSearch(''); }} className="px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer font-bold text-center transition-colors">
                {t('remove_player')}
              </div>
            </div>
            
            {swaps && swaps.length > 0 && (
              <div className="py-1">
                {swaps.filter((s: any) => s.id !== 0 && s.id !== value).map((s: any) => (
                  <div key={`swap-${s.id}`} onClick={() => { onSwap(s.id); setIsOpen(false); }} className="px-3 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer flex items-center gap-2 font-bold transition-colors">
                    <ArrowRightLeft size={14} /> {t('swap_with')} {s.name}
                  </div>
                ))}
              </div>
            )}

            <div className="py-1">
              {filtered.length === 0 ? <div className="p-4 text-sm text-slate-500 text-center font-medium">No players found</div> : 
                filtered.map((opt: any) => (
                  <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }} className="px-3 py-3 text-sm hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 rounded-lg cursor-pointer flex items-center justify-between transition-colors">
                    <span className="truncate mr-2 text-slate-900 dark:text-slate-100 font-bold">{opt.name}</span>
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${getGradeColor(opt.skillLevel)}`}>{opt.skillLevel}</span>
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

// ISOLATED MATCH CARD COMPONENT
const MatchCard = ({ match, court, sessionStatus, maxSets, getMemberData, openEditMatchModal, handleAutoGenerateCourt, setSwapCourtModal, setConfirmDeleteMatchId, handleStartMatch, handleFinishMatch, t }: any) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [scores, setScores] = useState({
    a1: match?.scoreTeamA_set1 || '', b1: match?.scoreTeamB_set1 || '',
    a2: match?.scoreTeamA_set2 || '', b2: match?.scoreTeamB_set2 || '',
    a3: match?.scoreTeamA_set3 || '', b3: match?.scoreTeamB_set3 || ''
  });

  if (!match) {
    return (
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]">
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-slate-400 dark:text-slate-500" />
            <h3 className="font-bold text-slate-800 dark:text-white tracking-wide">{court?.name || 'Queued'}</h3>
          </div>
          <div className="text-blue-600 dark:text-blue-500 text-xs font-bold tracking-widest uppercase">{t('ready')}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 px-5">
          <button disabled={sessionStatus !== 'active'} onClick={() => handleAutoGenerateCourt(court.id)} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed">{t('auto_fill')}</button>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">OR</span>
          <button disabled={sessionStatus !== 'active'} onClick={() => openEditMatchModal({ courtId: court.id, matchType: 'MD' })} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 text-sm font-bold rounded-xl transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed">{t('manual_match')}</button>
        </div>
      </div>
    );
  }

  const isActive = match.status === 'on_court';
  const numA = parseInt(scores[`a${currentSet}` as keyof typeof scores]) || 0;
  const numB = parseInt(scores[`b${currentSet}` as keyof typeof scores]) || 0;

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]">
        <div className="flex items-center gap-2">
          {court && <GripVertical size={16} className="text-slate-400 dark:text-slate-500" />}
          <h3 className="font-bold text-slate-800 dark:text-white tracking-wide">{court ? court.name : 'Queued'}</h3>
          {!court && <span className="bg-slate-200 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">Queue</span>}
          {court && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-500 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 uppercase tracking-wider font-bold">AUTO</span>}
        </div>
        {isActive ? <MatchTimer startedAt={match.startedAt} /> : <div className="text-blue-600 dark:text-blue-500 text-xs font-bold tracking-widest uppercase">{court ? t('ready') : ''}</div>}
        {!isActive && !court && (
          <div className="flex items-center gap-2">
            <button onClick={() => openEditMatchModal(match)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><SettingsIcon size={14}/></button>
            <button onClick={() => setConfirmDeleteMatchId(match.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {court && (
          <div className="flex justify-end mb-4">
            <button onClick={() => openEditMatchModal(match)} className="p-1.5 border border-slate-200 dark:border-[#334155] rounded-md bg-slate-50 dark:bg-[#1E293B]/50 text-slate-500 hover:text-blue-600 dark:hover:text-white transition-colors shadow-sm"><SettingsIcon size={14}/></button>
          </div>
        )}
        
        <div className="flex flex-col gap-4 mb-4">
          <div className="relative mt-1">
            <div className="absolute -top-2.5 left-3 bg-white dark:bg-[#0F172A] px-1.5 text-[10px] text-slate-500 font-bold uppercase z-10">{match.matchType}</div>
            <div className="flex border border-slate-200 dark:border-[#1E293B] rounded-lg overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
              <div className="flex-1 p-3.5 flex items-center justify-between border-r border-slate-200 dark:border-[#1E293B]">
                <span className="font-semibold text-sm truncate dark:text-white">{getMemberData(match.teamA_player1)?.name || 'TBD'}</span>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamA_player1)?.skillLevel)}`}>{getMemberData(match.teamA_player1)?.skillLevel || '-'}</span>
              </div>
              <div className="flex-1 p-3.5 flex items-center justify-between">
                <span className="font-semibold text-sm truncate dark:text-white">{getMemberData(match.teamA_player2)?.name || 'TBD'}</span>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamA_player2)?.skillLevel)}`}>{getMemberData(match.teamA_player2)?.skillLevel || '-'}</span>
              </div>
            </div>
          </div>
          <div className="text-center text-slate-400 dark:text-[#334155] text-[10px] font-bold tracking-widest uppercase">{t('vs')}</div>
          <div className="relative">
            <div className="absolute -top-2.5 left-3 bg-white dark:bg-[#0F172A] px-1.5 text-[10px] text-slate-500 font-bold uppercase z-10">{match.matchType}</div>
            <div className="flex border border-slate-200 dark:border-[#1E293B] rounded-lg overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
              <div className="flex-1 p-3.5 flex items-center justify-between border-r border-slate-200 dark:border-[#1E293B]">
                <span className="font-semibold text-sm truncate dark:text-white">{getMemberData(match.teamB_player1)?.name || 'TBD'}</span>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamB_player1)?.skillLevel)}`}>{getMemberData(match.teamB_player1)?.skillLevel || '-'}</span>
              </div>
              <div className="flex-1 p-3.5 flex items-center justify-between">
                <span className="font-semibold text-sm truncate dark:text-white">{getMemberData(match.teamB_player2)?.name || 'TBD'}</span>
                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(getMemberData(match.teamB_player2)?.skillLevel)}`}>{getMemberData(match.teamB_player2)?.skillLevel || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          {isActive ? (
            <form onSubmit={(e) => { e.preventDefault(); handleFinishMatch(match.id, true, scores); }} className="w-full flex flex-col gap-2 mt-auto">
              <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] p-4 rounded-xl relative">
                {maxSets > 1 && (
                  <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#0F172A] rounded-lg p-1 border border-slate-200 dark:border-[#1E293B]">
                    <button type="button" onClick={() => setCurrentSet(c => c - 1)} disabled={currentSet <= 1} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-30 transition-colors"><ChevronLeft size={16}/></button>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Set {currentSet} of {maxSets}</span>
                    <button type="button" onClick={() => setCurrentSet(c => c + 1)} disabled={currentSet >= maxSets} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-30 transition-colors"><ChevronRight size={16}/></button>
                  </div>
                )}
                <div className="flex justify-between items-center mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  <span className="truncate max-w-[120px]">{getMemberData(match.teamA_player1)?.name?.split(' ')[0]} & {getMemberData(match.teamA_player2)?.name?.split(' ')[0]}</span>
                  <span className="truncate max-w-[120px] text-right">{getMemberData(match.teamB_player1)?.name?.split(' ')[0]} & {getMemberData(match.teamB_player2)?.name?.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" placeholder="0" 
                    value={scores[`a${currentSet}` as keyof typeof scores]} 
                    onChange={(e) => setScores(p => ({...p, [`a${currentSet}`]: e.target.value}))} 
                    className={`flex-1 w-full bg-white dark:bg-[#0F172A] border-2 ${numA > numB && numA > 0 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:border-blue-500'} rounded-xl py-6 text-center font-bold text-4xl outline-none transition-colors`} 
                  />
                  <span className="text-slate-400 dark:text-[#334155] font-black">-</span>
                  <input 
                    type="number" placeholder="0" 
                    value={scores[`b${currentSet}` as keyof typeof scores]} 
                    onChange={(e) => setScores(p => ({...p, [`b${currentSet}`]: e.target.value}))} 
                    className={`flex-1 w-full bg-white dark:bg-[#0F172A] border-2 ${numB > numA && numB > 0 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-[#1E293B] text-slate-900 dark:text-white focus:border-blue-500'} rounded-xl py-6 text-center font-bold text-4xl outline-none transition-colors`} 
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-sm font-bold transition-colors shadow-md mt-2">
                {t('finish_free_court')}
              </button>
              <button type="button" onClick={() => setConfirmDeleteMatchId(match.id)} className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 py-3.5 rounded-xl text-sm font-bold transition-colors mt-2">
                {t('cancel_match')}
              </button>
            </form>
          ) : court ? (
            <div className="w-full flex gap-2">
              <button onClick={() => setSwapCourtModal(match)} className="p-3.5 border border-slate-200 dark:border-[#1E293B] rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1E293B] dark:hover:text-white transition-colors" title="Swap Court"><ArrowRightLeft size={18}/></button>
              <button onClick={() => setConfirmDeleteMatchId(match.id)} className="p-3.5 border border-slate-200 dark:border-[#1E293B] rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><Trash2 size={18}/></button>
              <button onClick={() => handleStartMatch(match.id)} disabled={sessionStatus !== 'active'} className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                <Play fill="currentColor" size={16}/> {t('start')}
              </button>
            </div>
          ) : (
            <button disabled={sessionStatus !== 'active'} onClick={() => setSwapCourtModal(match)} className="w-full mt-2 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-blue-600 dark:text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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

  // States
  const [attendances, setAttendances] = useState<any[]>([]);
  const [allMembers, setMembers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  // Search & Filter
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [playtimeSearch, setPlaytimeSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  
  // Modals & Forms
  const [isAttendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);
  const [isWalkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ name: '', gender: 'male', skillLevel: 'C1' });
  const [editCourtId, setEditCourtId] = useState<number | null>(null);
  const [courtName, setCourtName] = useState('');
  const [playerDetailModal, setPlayerDetailModal] = useState<number | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState<any>({});

  // Match Editing State
  const [editMatchModal, setEditMatchModal] = useState<any>(null);
  const [editHistoryModal, setEditHistoryModal] = useState<any>(null);
  const [swapCourtModal, setSwapCourtModal] = useState<any>(null);
  const [manualPlayers, setManualPlayers] = useState({ ta1: 0, ta2: 0, tb1: 0, tb2: 0 });
  const [historyForm, setHistoryForm] = useState({ courtId: 0, ta1: 0, ta2: 0, tb1: 0, tb2: 0, sa1: 0, sb1: 0, sa2: 0, sb2: 0, sa3: 0, sb3: 0 });
  const [historySetView, setHistorySetView] = useState(1);

  // Confirmation Modals
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<number | null>(null);

  // Toast System
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
      setCourts(sessionRes.data.courts);
      setMembers(membersRes.data);
      setAttendances(attendancesRes.data);
      setMatches(matchesRes.data);
      setCommunityData(userRes.data.community);
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

  // --- MEMOIZED COMPUTATIONS ---
  const visibleAttendances = useMemo(() => {
    return attendances
      .filter(a => a.attendance.status !== 'cancelled')
      .filter(a => a.member.name.toLowerCase().includes(attendanceSearch.toLowerCase()));
  }, [attendances, attendanceSearch]);

  const availableMembersModal = useMemo(() => {
    return allMembers
      .filter(m => !attendances.some(a => a.member.id === m.id && a.attendance.status !== 'cancelled'))
      .filter(m => m.name.toLowerCase().includes(modalSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMembers, attendances, modalSearch]);

  const activeMatches = useMemo(() => matches.filter(m => m.status === 'queued' || m.status === 'on_court'), [matches]);
  const finishedMatches = useMemo(() => matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()), [matches]);
  const queuedMatchesList = useMemo(() => matches.filter(m => m.courtId === null && m.status === 'queued'), [matches]);

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

  const calculatePlayerGames = (member: any) => {
    if (!member) return [];
    const memberMatches = finishedMatches.filter(m => 
      m.teamA_player1 === member.id || m.teamA_player2 === member.id || 
      m.teamB_player1 === member.id || m.teamB_player2 === member.id
    ).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

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

      return { id: m.id, type, partnerName: pName, opp1Name: o1Name, opp2Name: o2Name, myScore, oppScore, result, scoreString };
    });
  };

  const playtimeData = useMemo(() => {
    return attendances
      .filter(a => a.attendance.status !== 'cancelled')
      .filter(a => a.member.name.toLowerCase().includes(playtimeSearch.toLowerCase()))
      .map(({ member, attendance }) => {
        return { member, attendance, playedGames: calculatePlayerGames(member) };
      })
      .sort((a, b) => {
        if (a.playedGames.length !== b.playedGames.length) return a.playedGames.length - b.playedGames.length; 
        return a.member.name.localeCompare(b.member.name);
      });
  }, [attendances, playtimeSearch, finishedMatches, maxSets, allMembers]);

  // Helpers
  function getMemberData(memberId: number) { return allMembers.find(m => m.id === memberId); }
  function getInitialCourtName(cId: number) { return courts.find(c => c.id === cId)?.name; }

  const getOptionsFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    const selectedIds = Object.entries(manualPlayers).filter(([k]) => k !== currentKey).map(([k, v]) => v);
    return availableForManualMatch.filter(m => !selectedIds.includes(m.id));
  };

  const getSwapListFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    return Object.entries(manualPlayers)
      .filter(([k, v]) => k !== currentKey && v !== 0)
      .map(([k, v]) => ({ id: v, name: getMemberData(v)?.name || '' }));
  };

  const getHistorySwapListFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    return Object.entries(historyForm).filter(([k]) => k.startsWith('t'))
      .filter(([k, v]) => k !== currentKey && v !== 0)
      .map(([k, v]) => ({ id: v, name: getMemberData(v as number)?.name || '' }));
  };

  // Player Detail Variables
  const selectedDetailPlayer = playerDetailModal ? getMemberData(playerDetailModal) : null;
  const selectedDetailGames = playerDetailModal ? calculatePlayerGames(selectedDetailPlayer) : [];

  // --- SESSION CONTROLS ---
  const handleStartSession = async () => {
    try {
      await api.put(`/sessions/${id}/start`);
      fetchSessionData();
      addToast("Session started successfully");
    } catch(err) { addToast("Error starting session", "error"); }
  };

  const handleEndSession = async () => {
    if(!window.confirm("Are you sure you want to end this session? All ongoing matches will need to be finished manually.")) return;
    try {
      await api.put(`/sessions/${id}/finish`);
      fetchSessionData();
      addToast("Session ended successfully");
    } catch(err) { addToast("Error ending session", "error"); }
  };

  // --- PDF EXPORT LOGIC ---
  const applyPDFHeaderFooter = (doc: any, title: string, subtitle: string) => {
    let yPos = 20;

    if (communityData?.logo?.startsWith('data:image')) {
      try {
        doc.addImage(communityData.logo, 14, 12, 10, 10);
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42); 
        doc.text(communityData.name || 'Community', 28, 19);
        yPos = 34;
      } catch(e) { console.warn('PDF Logo parsing error'); }
    } else {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(communityData?.name || 'Community', 14, 19);
      yPos = 34;
    }

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, yPos);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.text(subtitle, 14, yPos + 6);

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by AturMabar', 14, doc.internal.pageSize.height - 10);
    }

    return yPos + 12; 
  };

  const exportSessionPDF = () => {
    const doc = new jsPDF();
    const tableStartY = applyPDFHeaderFooter(doc, `Session Report: ${session?.name}`, `Date: ${new Date(session?.date).toLocaleString(i18n.language)}`);

    const tableData = finishedMatches.map(m => {
      const teamA = `${getMemberData(m.teamA_player1)?.name || 'TBD'} & ${getMemberData(m.teamA_player2)?.name || 'TBD'}`;
      const teamB = `${getMemberData(m.teamB_player1)?.name || 'TBD'} & ${getMemberData(m.teamB_player2)?.name || 'TBD'}`;
      let scores = [];
      for(let i=1; i<=maxSets; i++) {
        const sa = m[`scoreTeamA_set${i}`];
        const sb = m[`scoreTeamB_set${i}`];
        if (sa > 0 || sb > 0 || i === 1) scores.push(`${sa}-${sb}`);
      }
      return [m.matchType, teamA, scores.join(' / '), teamB];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [['Type', 'Team A', 'Score', 'Team B']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Session_${session?.name}_Report.pdf`);
    addToast("Session PDF Exported successfully!");
  };

  const exportPlayerPDF = (memberId: number, memberName: string, playedGames: any[]) => {
    const doc = new jsPDF();
    const tableStartY = applyPDFHeaderFooter(doc, `Player Report: ${memberName}`, `Session: ${session?.name} | Date: ${new Date(session?.date).toLocaleString(i18n.language)}`);

    const tableData = playedGames.map(g => [
      g.type,
      g.partnerName,
      `${g.opp1Name} & ${g.opp2Name}`,
      g.scoreString,
      g.result
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Type', 'Partner', 'Opponents', 'Score', 'Result']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
           if (data.cell.raw === 'Won') data.cell.styles.textColor = [16, 185, 129];
           if (data.cell.raw === 'Lost') data.cell.styles.textColor = [225, 29, 72];
        }
      }
    });

    doc.save(`Player_${memberName}_Report.pdf`);
    addToast("Player PDF Exported successfully!");
  };

  // --- ATTENDANCE ACTIONS ---
  const openAttendeeModal = () => { setSelectedAttendees([]); setModalSearch(''); setAttendeeModalOpen(true); };
  const toggleSelectAttendee = (memberId: number) => setSelectedAttendees(prev => prev.includes(memberId) ? prev.filter(mid => mid !== memberId) : [...prev, memberId]);

  const handleAddSelectedAttendees = async () => {
    if (selectedAttendees.length === 0) return;
    try {
      await Promise.all(selectedAttendees.map(async (memberId) => {
        const existingRecord = attendances.find(a => a.member.id === memberId);
        if (existingRecord) return api.put(`/sessions/${id}/attendances/${existingRecord.attendance.id}`, { status: 'active' });
        return api.post(`/sessions/${id}/attendances`, { memberId });
      }));
      fetchSessionData();
      setAttendeeModalOpen(false);
      addToast(t('attendance_added') || "Attendees added successfully");
    } catch (err) { addToast("Error processing attendees.", "error"); }
  };

  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/sessions/${id}/walk-in`, walkInForm);
      fetchSessionData();
      setWalkInModalOpen(false);
      setWalkInForm({ name: '', gender: 'male', skillLevel: 'C1' });
      addToast(t('walk_in_added') || "Walk-in player added successfully");
    } catch (err) { addToast("Error adding walk-in", "error"); }
  };

  const updateAttendanceStatus = async (attendanceId: number, status: string) => {
    try {
      await api.put(`/sessions/${id}/attendances/${attendanceId}`, { status });
      fetchSessionData();
      addToast(t('status_updated') || "Status updated");
    } catch (err) { addToast("Error updating status", "error"); }
  };

  const handleUpdateGrade = async (memberId: number, skillLevel: string) => {
    try {
      await api.put(`/sessions/${id}/members/${memberId}/grade`, { skillLevel });
      fetchSessionData();
      addToast("Player grade updated successfully");
    } catch (err) { addToast("Error updating grade", "error"); }
  };

  // --- COURTS ACTIONS ---
  const handleAddCourt = async () => {
    try {
      await api.post(`/sessions/${id}/courts`, { name: `Court ${courts.length + 1}` });
      fetchSessionData();
      addToast(t('court_added') || "Court added");
    } catch (err) { addToast("Error adding court", "error"); }
  };

  const handleUpdateCourt = async (courtId: number, isActive: boolean, name?: string) => {
    try {
      await api.put(`/sessions/${id}/courts/${courtId}`, { isActive, name: name || courts.find(c => c.id === courtId)?.name });
      setEditCourtId(null);
      fetchSessionData();
      addToast(t('court_updated') || "Court updated");
    } catch (err) { addToast("Error updating court", "error"); }
  };

  const handleDeleteCourt = async (courtId: number) => {
    if (!window.confirm(t('delete_court') + "?")) return;
    try {
      await api.delete(`/sessions/${id}/courts/${courtId}`);
      fetchSessionData();
      addToast(t('court_deleted') || "Court deleted");
    } catch (err) { addToast("Error deleting court", "error"); }
  };

  // --- MATCH ACTIONS ---
  const handleAutoGenerateCourt = async (courtId: number) => {
    try {
      await api.post(`/matches/${id}/auto-generate`, { courtId });
      fetchSessionData();
      addToast("Match generated successfully");
    } catch (err: any) {
      addToast(err.response?.data?.error || "Error generating match", "error");
    }
  };

  const handleAutoFillAllCourts = async () => {
    const emptyCourts = courts.filter(c => c.isActive && !matches.find(m => m.courtId === c.id && (m.status === 'on_court' || m.status === 'queued')));
    let generated = 0;
    for (const court of emptyCourts) {
      try { await api.post(`/matches/${id}/auto-generate`, { courtId: court.id }); generated++; } 
      catch (err) { break; } 
    }
    fetchSessionData();
    if (generated > 0) addToast(`Successfully filled ${generated} court(s)`);
    else addToast("Not enough available players", "error");
  };

  const handleQueueMatch = async () => {
    try {
      await api.post(`/matches/${id}/auto-generate`, { courtId: null });
      fetchSessionData();
      addToast(t('match_queued') || "Match added to queue");
    } catch (err: any) { addToast(err.response?.data?.error || "Error generating match", "error"); }
  };

  const handleStartMatch = async (matchId: number) => {
    try { await api.put(`/matches/${matchId}/start`); fetchSessionData(); addToast(t('match_started') || "Match started"); } 
    catch (err) { addToast("Error starting match", "error"); }
  };

  const handleFinishMatch = async (matchId: number, saveScore: boolean, scores?: any) => {
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
      fetchSessionData();
      addToast(t('match_finished') || "Match finished");
    } catch (err) { addToast("Error finishing match", "error"); }
  };

  const handleConfirmDeleteMatch = async () => {
    if (!confirmDeleteMatchId) return;
    try { 
      await api.delete(`/matches/${confirmDeleteMatchId}`); 
      fetchSessionData(); 
      addToast(t('match_cancelled') || "Match cancelled successfully."); 
    } 
    catch (err) { addToast("Error canceling match", "error"); }
    finally { setConfirmDeleteMatchId(null); }
  };

  const handleSwapCourt = async (matchId: number, targetCourtId: number) => {
    try {
      await api.put(`/matches/${matchId}/swap-court`, { targetCourtId });
      setSwapCourtModal(null);
      fetchSessionData();
      addToast(t('court_swapped') || "Court swapped successfully");
    } catch (err) { addToast("Error swapping courts", "error"); }
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
    try {
      const payload = { 
        teamA_player1: manualPlayers.ta1 || null, teamA_player2: manualPlayers.ta2 || null, 
        teamB_player1: manualPlayers.tb1 || null, teamB_player2: manualPlayers.tb2 || null 
      };

      if (editMatchModal.id) {
        await api.put(`/matches/${editMatchModal.id}/players`, payload);
        addToast(t('match_updated') || "Players updated successfully");
      } else {
        await api.post(`/matches/${id}/manual`, { ...payload, courtId: editMatchModal.courtId });
        addToast("Manual match created successfully");
      }

      setEditMatchModal(null);
      fetchSessionData();
    } catch (err) { addToast("Error saving players", "error"); }
  };

  // --- HISTORY ACTIONS ---
  const openEditHistoryModal = (match: any) => {
    setHistorySetView(1);
    setHistoryForm({
      courtId: match.courtId || 0,
      ta1: match.teamA_player1 || 0,
      ta2: match.teamA_player2 || 0,
      tb1: match.teamB_player1 || 0,
      tb2: match.teamB_player2 || 0,
      sa1: match.scoreTeamA_set1 || 0,
      sb1: match.scoreTeamB_set1 || 0,
      sa2: match.scoreTeamA_set2 || 0,
      sb2: match.scoreTeamB_set2 || 0,
      sa3: match.scoreTeamA_set3 || 0,
      sb3: match.scoreTeamB_set3 || 0,
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
    try {
      await api.put(`/matches/${editHistoryModal.id}/history`, {
        courtId: historyForm.courtId || null,
        teamA_player1: historyForm.ta1 || null,
        teamA_player2: historyForm.ta2 || null,
        teamB_player1: historyForm.tb1 || null,
        teamB_player2: historyForm.tb2 || null,
        scoreTeamA_set1: historyForm.sa1 || 0,
        scoreTeamB_set1: historyForm.sb1 || 0,
        scoreTeamA_set2: historyForm.sa2 || 0,
        scoreTeamB_set2: historyForm.sb2 || 0,
        scoreTeamA_set3: historyForm.sa3 || 0,
        scoreTeamB_set3: historyForm.sb3 || 0,
      });
      setEditHistoryModal(null);
      fetchSessionData();
      addToast("History updated successfully");
    } catch (err) { addToast("Error updating history", "error"); }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/sessions/${id}`, settingsForm);
      fetchSessionData();
      addToast(t('save_settings') || "Settings saved successfully");
    } catch (err) { addToast("Error saving settings", "error"); }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm(t('delete_session_warning') || "Delete session?")) return;
    try {
      await api.delete(`/sessions/${id}`);
      navigate('/sessions');
    } catch (err) { addToast("Error deleting session", "error"); }
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center text-slate-500">{t('loading')}</div>;

  const inputStyles = "w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-[#1E293B] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-slate-100";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans flex flex-col">

      {/* Top Notification Toasts */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 fade-in duration-300 border ${t.type === 'success' ? 'bg-[#10B981] border-[#059669] text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
            {t.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {t.message}
            <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} className="ml-4 hover:opacity-75"><X size={16}/></button>
          </div>
        ))}
      </div>

      {/* Universal Top Navigation */}
      <nav className="h-16 border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center text-white shrink-0">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-slate-200 dark:border-[#1E293B] max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-semibold truncate hidden sm:block">{communityData?.name}</span>
            </div>
            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg transition-colors">
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors shrink-0">
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Session Header Info */}
      <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/sessions" className="p-2 sm:p-2.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-xl hover:bg-slate-100 dark:hover:bg-[#334155]/80 transition-colors shrink-0">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{session?.name}</h1>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{session && new Date(session.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
            {/* Allow starting if scheduled OR finished */}
            {(!session?.status || session?.status === 'scheduled' || session?.status === 'finished') && (
              <button onClick={handleStartSession} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                <Play size={16} fill="currentColor"/> 
                {session?.status === 'finished' ? t('restart_session', 'Restart Session') : t('start_session', 'Start Session')}
              </button>
            )}
            
            {session?.status === 'active' && (
              <>
                <SessionGlobalTimer startedAt={session.startedAt} />
                <button onClick={handleEndSession} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <Square size={16} fill="currentColor"/> {t('end_session', 'End Session')}
                </button>
              </>
            )}

            <button onClick={exportSessionPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 dark:bg-[#1E293B] hover:bg-blue-100 dark:hover:bg-[#334155] text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border border-transparent dark:border-[#334155] shadow-sm">
              <FileDown size={18}/> <span className="hidden sm:block">{t('export_pdf', 'Export PDF')}</span>
            </button>
          </div>
        </div>
        <div className="hidden sm:flex max-w-7xl mx-auto px-8 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
              {tab.icon} {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="sm:hidden sticky top-16 z-20 px-4 py-3 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1E293B] shadow-sm">
        <div className="relative">
          <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full appearance-none bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-slate-100 py-3 pl-11 pr-10 rounded-xl font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase tracking-wide">
            {TABS.map(tab => <option key={tab.id} value={tab.id}>{t(tab.label)}</option>)}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-500 pointer-events-none">{TABS.find(t => t.id === activeTab)?.icon}</div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={18} /></div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        
        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold shrink-0">{t('attendance')} <span className="text-slate-400 ml-1">({visibleAttendances.length})</span></h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                  <input type="text" placeholder={t('search_players')} value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button onClick={() => setWalkInModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <UserPlus size={16}/> {t('add_walk_in')}
                  </button>
                  <button onClick={openAttendeeModal} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Plus size={16}/> {t('add_attendee')}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:block bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] text-xs uppercase text-slate-500 font-semibold">
                  <tr><th className="p-4">Player</th><th className="p-4">{t('arrived_at')}</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {visibleAttendances.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">{t('no_players')}</td></tr> : 
                   visibleAttendances.map(({ attendance, member }) => (
                    <tr key={attendance.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/30 group">
                      <td className="p-4">
                        <div className="font-medium text-sm flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer w-max" onClick={() => setPlayerDetailModal(member.id)}>
                          {member.name} {attendance.isWalkIn && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">W-IN</span>}
                          <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-1.5">
                          <select 
                            value={member.skillLevel} 
                            onChange={(e) => handleUpdateGrade(member.id, e.target.value)}
                            className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer outline-none appearance-none text-center hover:opacity-80 transition-opacity ${getGradeColor(member.skillLevel)}`}
                            title="Click to edit grade"
                          >
                            <option value="A1" className="bg-slate-800 text-white">A1</option>
                            <option value="A2" className="bg-slate-800 text-white">A2</option>
                            <option value="B1" className="bg-slate-800 text-white">B1</option>
                            <option value="B2" className="bg-slate-800 text-white">B2</option>
                            <option value="C1" className="bg-slate-800 text-white">C1</option>
                            <option value="C2" className="bg-slate-800 text-white">C2</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                          {attendance.status === 'active' ? t('status_active') : t('resting')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {attendance.status === 'active' ? (
                            <button onClick={() => updateAttendanceStatus(attendance.id, 'resting')} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 rounded-lg transition-colors" title={t('mark_resting')}><Pause size={16}/></button>
                          ) : (
                            <button onClick={() => updateAttendanceStatus(attendance.id, 'active')} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors" title={t('mark_active')}><Check size={16}/></button>
                          )}
                          <button onClick={() => updateAttendanceStatus(attendance.id, 'cancelled')} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-lg transition-colors" title={t('cancel_attendance')}><X size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden flex flex-col gap-3">
              {visibleAttendances.length === 0 ? <div className="p-8 text-center text-slate-500 border border-slate-200 dark:border-[#1E293B] rounded-xl">{t('no_players')}</div> : 
               visibleAttendances.map(({ attendance, member }) => (
                <div key={attendance.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer w-max" onClick={() => setPlayerDetailModal(member.id)}>
                      {member.name} {attendance.isWalkIn && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">W-IN</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <select 
                        value={member.skillLevel} 
                        onChange={(e) => handleUpdateGrade(member.id, e.target.value)}
                        className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer outline-none appearance-none text-center hover:opacity-80 transition-opacity ${getGradeColor(member.skillLevel)}`}
                      >
                        <option value="A1" className="bg-slate-800 text-white">A1</option>
                        <option value="A2" className="bg-slate-800 text-white">A2</option>
                        <option value="B1" className="bg-slate-800 text-white">B1</option>
                        <option value="B2" className="bg-slate-800 text-white">B2</option>
                        <option value="C1" className="bg-slate-800 text-white">C1</option>
                        <option value="C2" className="bg-slate-800 text-white">C2</option>
                      </select>
                      <span className="text-xs text-slate-500 font-medium">• {t('arrived_at')} {new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                      {attendance.status === 'active' ? t('status_active') : t('resting')}
                    </span>
                    <div className="flex gap-1.5">
                      {attendance.status === 'active' ? (
                        <button onClick={() => updateAttendanceStatus(attendance.id, 'resting')} className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md" title={t('mark_resting')}><Pause size={14}/></button>
                      ) : (
                        <button onClick={() => updateAttendanceStatus(attendance.id, 'active')} className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-md" title={t('mark_active')}><Check size={14}/></button>
                      )}
                      <button onClick={() => updateAttendanceStatus(attendance.id, 'cancelled')} className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-md" title={t('cancel_attendance')}><X size={14}/></button>
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
              <button onClick={handleAddCourt} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={16} /> {t('add_court')}
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {courts.map(court => (
                <div key={court.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between transition-all">
                  {editCourtId === court.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input type="text" value={courtName} onChange={e => setCourtName(e.target.value)} className={inputStyles} autoFocus />
                      <button onClick={() => handleUpdateCourt(court.id, court.isActive, courtName)} className="p-2.5 bg-blue-600 text-white rounded-lg"><Check size={18}/></button>
                      <button onClick={() => setEditCourtId(null)} className="p-2.5 bg-slate-200 dark:bg-[#1E293B] rounded-lg"><X size={18}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="text-slate-300 dark:text-slate-600 cursor-grab" />
                      <span className={`font-semibold sm:text-lg ${!court.isActive && 'text-slate-400 line-through'}`}>{court.name}</span>
                    </div>
                  )}
                  
                  {editCourtId !== court.id && (
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={court.isActive} onChange={() => handleUpdateCourt(court.id, !court.isActive, court.name)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#1E293B] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                      </label>
                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-[#1E293B] pl-4">
                        <button onClick={() => { setEditCourtId(court.id); setCourtName(court.name); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteCourt(court.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
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
          <div className="animate-in fade-in duration-200">
            {session?.status !== 'active' && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-500 p-4 rounded-xl mb-6 font-bold flex items-center justify-center shadow-sm">
                <AlertTriangle size={18} className="mr-2" /> {t('session_not_started', 'Start the session to enable matchmaking.')}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">{t('matches')}</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button disabled={session?.status !== 'active'} onClick={handleQueueMatch} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-[#1E293B] hover:bg-slate-300 dark:hover:bg-[#334155] text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <ListOrdered size={16}/> {t('queue_match')}
                </button>
                <button disabled={session?.status !== 'active'} onClick={handleAutoFillAllCourts} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Zap size={16}/> {t('auto_fill')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
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
              <div className="mt-10 animate-in fade-in">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">Waiting List <span className="bg-slate-200 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold">{queuedMatchesList.length}</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {queuedMatchesList.map(match => (
                    <MatchCard key={match.id} match={match} court={null} maxSets={maxSets} sessionStatus={session?.status} getMemberData={getMemberData} openEditMatchModal={openEditMatchModal} handleFinishMatch={handleFinishMatch} setConfirmDeleteMatchId={setConfirmDeleteMatchId} setSwapCourtModal={setSwapCourtModal} handleStartMatch={handleStartMatch} handleAutoGenerateCourt={handleAutoGenerateCourt} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-200 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">{t('history')}</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search history..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {filteredHistory.length === 0 ? (
                <div className="p-10 text-center text-slate-500 border border-slate-200 dark:border-[#1E293B] rounded-xl bg-white dark:bg-[#0F172A]">{t('no_history')}</div>
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
                    <div key={match.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 sm:p-6 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex-1 w-full flex flex-col gap-3">
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isTeamAWonMatch ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' : 'bg-slate-50 border-slate-200 dark:bg-[#0B1120] dark:border-[#1E293B]'}`}>
                           <div className="flex items-center gap-3 truncate pr-4">
                             <span className="font-bold text-sm dark:text-white truncate">{getMemberData(match.teamA_player1)?.name || 'TBD'}</span>
                             <span className="text-slate-300 dark:text-slate-600">&</span>
                             <span className="font-bold text-sm dark:text-white truncate">{getMemberData(match.teamA_player2)?.name || 'TBD'}</span>
                           </div>
                           <div className="flex gap-3 items-center shrink-0">
                             {sets.map((set, i) => (
                               <span key={i} className={`font-mono text-lg ${set.sa > set.sb ? 'font-black text-emerald-600 dark:text-emerald-400' : 'font-medium text-slate-400 dark:text-slate-500'}`}>
                                 {set.sa || 0}
                               </span>
                             ))}
                           </div>
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${isTeamBWonMatch ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' : 'bg-slate-50 border-slate-200 dark:bg-[#0B1120] dark:border-[#1E293B]'}`}>
                           <div className="flex items-center gap-3 truncate pr-4">
                             <span className="font-bold text-sm dark:text-white truncate">{getMemberData(match.teamB_player1)?.name || 'TBD'}</span>
                             <span className="text-slate-300 dark:text-slate-600">&</span>
                             <span className="font-bold text-sm dark:text-white truncate">{getMemberData(match.teamB_player2)?.name || 'TBD'}</span>
                           </div>
                           <div className="flex gap-3 items-center shrink-0">
                             {sets.map((set, i) => (
                               <span key={i} className={`font-mono text-lg ${set.sb > set.sa ? 'font-black text-emerald-600 dark:text-emerald-400' : 'font-medium text-slate-400 dark:text-slate-500'}`}>
                                 {set.sb || 0}
                               </span>
                             ))}
                           </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col sm:flex-row items-center justify-center gap-4 sm:border-l sm:border-slate-200 sm:dark:border-[#1E293B] sm:pl-6 w-full sm:w-auto border-t border-slate-200 dark:border-[#1E293B] pt-4 sm:pt-0">
                         <div className="flex flex-col items-center">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{getInitialCourtName(match.courtId) || 'Deleted Court'}</span>
                           <span className="font-mono font-bold text-lg dark:text-white">{duration} min</span>
                         </div>
                         <div className="flex gap-2">
                           <button onClick={() => openEditHistoryModal(match)} className="p-2.5 bg-slate-100 hover:bg-blue-50 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-600 dark:text-slate-300 rounded-lg transition-colors" title={t('edit_history')}><Edit2 size={16}/></button>
                           <button onClick={() => setConfirmDeleteMatchId(match.id)} className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 rounded-lg transition-colors" title="Delete Match"><Trash2 size={16}/></button>
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PLAYTIME TAB */}
        {activeTab === 'playtime' && (
          <div className="animate-in fade-in duration-200 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">{t('playtime')}</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search players..." value={playtimeSearch} onChange={(e) => setPlaytimeSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
              </div>
            </div>
            
            <div className="hidden sm:block bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-[#1E293B] text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="p-4 w-1/4">Player</th>
                      <th className="p-4 w-1/2">Match History</th>
                      <th className="p-4 text-center w-32">{t('matches_played')}</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    {playtimeData.map(({ member, attendance, playedGames }) => (
                      <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/30">
                        <td className="p-4">
                          <div className="font-bold text-sm dark:text-white truncate cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setPlayerDetailModal(member.id)}>{member.name}</div>
                          <div className="mt-1"><span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(member.skillLevel)}`}>{member.skillLevel}</span></div>
                        </td>
                        <td className="p-4 relative">
                          <div className="flex flex-wrap gap-2">
                            {playedGames.length === 0 ? <span className="text-xs text-slate-400">No matches yet</span> : 
                              playedGames.map((g, i) => (
                                <div key={i} className="group relative inline-block">
                                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-help transition-colors ${getMatchTypeColor(g.type)} whitespace-nowrap`}>{g.type}</span>
                                  {/* Rich Card Tooltip */}
                                  <div className="hidden group-hover:flex absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[340px] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-[#1E293B] ring-1 ring-black/5 pointer-events-none flex-col gap-3">
                                    <div className="flex justify-between items-center w-full">
                                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] whitespace-nowrap">{g.type} MATCH</span>
                                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider whitespace-nowrap ${g.result === 'Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : g.result === 'Lost' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-slate-100 text-slate-700 dark:bg-[#1E293B] dark:text-slate-400'}`}>{t(g.result.toLowerCase())}</span>
                                    </div>
                                    <div className="flex items-center justify-between w-full bg-slate-50 dark:bg-[#0B1120] rounded-lg p-3 border border-slate-100 dark:border-[#1E293B]">
                                      <div className="flex flex-col text-center truncate flex-1 px-2">
                                        <div className="font-bold text-xs dark:text-white truncate" title={member.name}>{member.name}</div>
                                        <div className="text-slate-500 text-[10px] truncate" title={`& ${g.partnerName}`}>& {g.partnerName}</div>
                                      </div>
                                      <div className="font-black text-lg text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center justify-center gap-1 shrink-0">
                                        <span className={g.myScore > g.oppScore ? "text-emerald-500" : ""}>{g.myScore}</span>
                                        <span className="text-slate-300 dark:text-slate-600">-</span>
                                        <span className={g.oppScore > g.myScore ? "text-emerald-500" : ""}>{g.oppScore}</span>
                                      </div>
                                      <div className="flex flex-col text-center truncate flex-1 px-2">
                                        <div className="font-bold text-xs dark:text-white truncate" title={g.opp1Name}>{g.opp1Name}</div>
                                        <div className="text-slate-500 text-[10px] truncate" title={`& ${g.opp2Name}`}>& {g.opp2Name}</div>
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

            {/* Mobile Playtime Cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {playtimeData.map(({ member, attendance, playedGames }) => (
                <div key={member.id} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-4 rounded-xl shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col cursor-pointer" onClick={() => setPlayerDetailModal(member.id)}>
                      <span className="font-bold text-sm dark:text-white">{member.name}</span>
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold mt-1 w-max ${getGradeColor(member.skillLevel)}`}>{member.skillLevel}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-lg text-slate-700 dark:text-slate-300 leading-none">{playedGames.length}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('matches_played')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
                    {playedGames.length === 0 ? <span className="text-xs text-slate-400">No matches yet</span> : 
                      playedGames.map((g, i) => (
                        <span key={i} className={`px-2 py-0.5 text-[10px] font-bold rounded border whitespace-nowrap ${getMatchTypeColor(g.type)}`}>{g.type}</span>
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
            <form onSubmit={handleSaveSettings} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-sm p-6 flex flex-col gap-6 mb-8">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Session Name</label>
                <input type="text" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className={inputStyles} required />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B]">
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Scoring System</label>
                <select value={settingsForm.scoringSystem || ''} onChange={e => setSettingsForm({...settingsForm, scoringSystem: e.target.value})} className={`${inputStyles} font-medium`}>
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
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Custom Sets</label>
                    <input type="number" min={1} value={settingsForm.customSets || ''} onChange={e => setSettingsForm({...settingsForm, customSets: parseInt(e.target.value)})} className={inputStyles} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Points Per Set</label>
                    <input type="number" min={1} value={settingsForm.customPoints || ''} onChange={e => setSettingsForm({...settingsForm, customPoints: parseInt(e.target.value)})} className={inputStyles} />
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B]">
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Pairing Strictness</label>
                <select value={settingsForm.pairingRule || ''} onChange={e => setSettingsForm({...settingsForm, pairingRule: e.target.value})} className={`${inputStyles} font-medium`}>
                  <option value="very_strict">Very Strict (Same Grade Only)</option>
                  <option value="strict">Strict (+/- 1 Grade)</option>
                  <option value="moderate">Moderate (+/- 2 Grades)</option>
                  <option value="randomize">Randomize (Any)</option>
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                  <Save size={16}/> {t('save_settings')}
                </button>
              </div>
            </form>

            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-rose-700 dark:text-rose-500">{t('danger_zone')}</h3>
                <p className="text-sm text-rose-600/70 dark:text-rose-400/70 mt-1">{t('delete_session_warning')}</p>
              </div>
              <button onClick={handleDeleteSession} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-colors shrink-0">
                Delete Session
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Manual Match Edit Modal */}
      {editMatchModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-[#1E293B]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-lg">{editMatchModal.id ? 'Edit Match Players' : 'Create Manual Match'}</h3>
              <button onClick={() => setEditMatchModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 relative items-stretch min-h-[400px]">
              <div className="flex-1 w-full bg-slate-50 dark:bg-[#1E293B]/30 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">A</div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Team A</h4>
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

              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] shadow-md items-center justify-center font-black text-slate-400 z-10">VS</div>
              <div className="md:hidden text-center text-slate-400 font-black text-lg py-2">VS</div>

              <div className="flex-1 w-full bg-slate-50 dark:bg-[#1E293B]/30 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6 justify-end md:justify-start">
                  <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">B</div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Team B</h4>
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

            <div className="p-5 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button onClick={() => setEditMatchModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-lg transition-colors">Cancel</button>
              <button onClick={saveManualMatch} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Save Players</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {editHistoryModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] border border-slate-200 dark:border-[#1E293B]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-lg">{t('edit_history')}</h3>
              <button onClick={() => setEditHistoryModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 overflow-y-auto relative">
              <div className="w-full bg-slate-50 dark:bg-[#1E293B]/30 p-4 rounded-xl border border-slate-200 dark:border-[#1E293B]">
                 <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-400">Court Played On</label>
                 <select value={historyForm.courtId} onChange={e => setHistoryForm({...historyForm, courtId: parseInt(e.target.value)})} className={inputStyles}>
                   <option value={0}>Unknown / Deleted Court</option>
                   {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative items-stretch">
                <div className="flex-1 w-full bg-slate-50 dark:bg-[#1E293B]/30 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">A</div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Team A</h4>
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
                      <button type="button" onClick={() => setHistorySetView(v => v - 1)} disabled={historySetView <= 1} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 text-center uppercase tracking-widest">Score (Set {historySetView})</label>
                      <button type="button" onClick={() => setHistorySetView(v => v + 1)} disabled={historySetView >= maxSets} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                    <input 
                       type="number" 
                       value={historyForm[`sa${historySetView}` as keyof typeof historyForm] || ''} placeholder="0" 
                       onChange={e => setHistoryForm({...historyForm, [`sa${historySetView}`]: parseInt(e.target.value) || 0})} 
                       className={`${inputStyles} text-center font-black text-2xl py-4 ${(historyForm[`sa${historySetView}` as keyof typeof historyForm] as number) > (historyForm[`sb${historySetView}` as keyof typeof historyForm] as number) ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`} 
                    />
                  </div>
                </div>

                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] shadow-md items-center justify-center font-black text-slate-400 z-10">VS</div>
                <div className="md:hidden text-center text-slate-400 font-black text-lg">VS</div>

                <div className="flex-1 w-full bg-slate-50 dark:bg-[#1E293B]/30 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6 justify-end md:justify-start">
                    <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">B</div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Team B</h4>
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
                      <button type="button" onClick={() => setHistorySetView(v => v - 1)} disabled={historySetView <= 1} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 text-center uppercase tracking-widest">Score (Set {historySetView})</label>
                      <button type="button" onClick={() => setHistorySetView(v => v + 1)} disabled={historySetView >= maxSets} className="p-1.5 text-slate-500 hover:text-blue-500 disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                    <input 
                       type="number" 
                       value={historyForm[`sb${historySetView}` as keyof typeof historyForm] || ''} placeholder="0" 
                       onChange={e => setHistoryForm({...historyForm, [`sb${historySetView}`]: parseInt(e.target.value) || 0})} 
                       className={`${inputStyles} text-center font-black text-2xl py-4 ${(historyForm[`sb${historySetView}` as keyof typeof historyForm] as number) > (historyForm[`sa${historySetView}` as keyof typeof historyForm] as number) ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button onClick={() => setEditHistoryModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-lg transition-colors">Cancel</button>
              <button onClick={saveHistoryMatch} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete/Cancel Match */}
      {confirmDeleteMatchId && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] p-6 text-center">
             <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 mx-auto flex items-center justify-center mb-4">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">{t('confirm_cancel_title')}</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('confirm_cancel_desc')}</p>
             <div className="flex gap-3">
               <button onClick={() => setConfirmDeleteMatchId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] rounded-xl font-bold transition-colors">{t('abort')}</button>
               <button onClick={handleConfirmDeleteMatch} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors">{t('confirm')}</button>
             </div>
          </div>
        </div>
      )}

      {/* Swap Court Modal */}
      {swapCourtModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-slate-200 dark:border-[#1E293B]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]">
              <h3 className="font-bold text-lg">Move to Court</h3>
              <button onClick={() => setSwapCourtModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-full transition-colors"><X size={18}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-2">
              {courts.filter(c => c.isActive && c.id !== swapCourtModal.courtId).length === 0 ? (
                <div className="text-center text-slate-500 py-4">No other active courts available.</div>
              ) : (
                courts.filter(c => c.isActive && c.id !== swapCourtModal.courtId).map(c => (
                  <button key={c.id} onClick={() => handleSwapCourt(swapCourtModal.id, c.id)} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-[#1E293B] dark:hover:border-slate-600 transition-colors font-bold flex justify-between items-center">
                    {c.name}
                    <ArrowRightLeft size={16} className="text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-select Attendee Modal */}
      {isAttendeeModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-slate-200 dark:border-[#1E293B]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]">
              <h3 className="font-bold text-lg">{t('add_attendee')}</h3>
              <button onClick={() => setAttendeeModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-4 border-b border-slate-200 dark:border-[#1E293B]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder={t('search_players')} value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B] rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm" autoFocus />
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 bg-white dark:bg-[#0F172A]">
              {availableMembersModal.length === 0 ? <div className="p-8 text-center text-slate-500">{t('no_players')}</div> : 
               availableMembersModal.map(member => (
                <div key={member.id} className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 rounded-xl cursor-pointer transition-colors" onClick={() => toggleSelectAttendee(member.id)}>
                  <div className="flex items-center gap-4 w-full">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAttendees.includes(member.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-[#334155]'}`}>
                      {selectedAttendees.includes(member.id) && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{member.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{member.skillLevel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]">
              <button onClick={handleAddSelectedAttendees} disabled={selectedAttendees.length === 0} className="w-full py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {t('add_selected').replace('{{count}}', selectedAttendees.length.toString())}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#1E293B]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120]">
              <h3 className="font-bold text-lg">{t('add_walk_in')}</h3>
              <button onClick={() => setWalkInModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-full transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleWalkIn} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Name</label>
                <input type="text" required placeholder="Walk-in Player Name" value={walkInForm.name} onChange={e => setWalkInForm({...walkInForm, name: e.target.value})} className={inputStyles} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Gender</label>
                  <select value={walkInForm.gender} onChange={e => setWalkInForm({...walkInForm, gender: e.target.value})} className={`${inputStyles} font-medium`}>
                    <option value="male">♂ Male</option><option value="female">♀ Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-400">Skill Level</label>
                  <select value={walkInForm.skillLevel} onChange={e => setWalkInForm({...walkInForm, skillLevel: e.target.value})} className={`${inputStyles} font-medium`}>
                    <option value="A1">A1</option><option value="A2">A2</option>
                    <option value="B1">B1</option><option value="B2">B2</option>
                    <option value="C1">C1</option><option value="C2">C2</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setWalkInModalOpen(false)} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-[#334155] rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Add Walk-In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {playerDetailModal && selectedDetailPlayer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden border border-slate-200 dark:border-[#1E293B]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1120] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-[#1E293B] flex items-center justify-center text-blue-600 dark:text-slate-300 font-bold">
                  {selectedDetailPlayer?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{selectedDetailPlayer?.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] border px-1.5 py-0.5 rounded font-mono font-bold ${getGradeColor(selectedDetailPlayer?.skillLevel)}`}>{selectedDetailPlayer?.skillLevel}</span>
                    <span className="text-xs text-slate-500 font-medium capitalize">{selectedDetailPlayer?.gender}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportPlayerPDF(selectedDetailPlayer?.id, selectedDetailPlayer?.name, selectedDetailGames)} className="px-4 py-2 bg-blue-50 dark:bg-[#1E293B] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#334155] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-transparent dark:border-[#334155]">
                  <FileDown size={14}/> {t('export_pdf', 'Export PDF')}
                </button>
                <button onClick={() => setPlayerDetailModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-full transition-colors"><X size={18}/></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                 <div className="bg-slate-50 dark:bg-[#1E293B]/30 border border-slate-200 dark:border-[#1E293B] p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-slate-800 dark:text-white">{selectedDetailGames.length}</div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('matches_played', 'MATCHES PLAYED')}</div>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedDetailGames.filter(g => g.result === 'Won').length}</div>
                   <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-1">{t('won', 'WON')}</div>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-rose-600 dark:text-rose-500">{selectedDetailGames.filter(g => g.result === 'Lost').length}</div>
                   <div className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mt-1">{t('lost', 'LOST')}</div>
                 </div>
                 <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedDetailGames.length > 0 ? Math.round((selectedDetailGames.filter(g => g.result === 'Won').length / selectedDetailGames.length) * 100) : 0}%</div>
                   <div className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mt-1">{t('win_rate', 'WIN RATE')}</div>
                 </div>
              </div>

              <h4 className="font-bold mb-4">{t('history', 'History')}</h4>
              <div className="flex flex-col gap-3">
                {selectedDetailGames.length === 0 ? <div className="p-8 text-center text-slate-500 border border-slate-200 dark:border-[#1E293B] rounded-xl">{t('no_history', 'No history found')}</div> : 
                 selectedDetailGames.map((g, i) => (
                   <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
                     <div className="p-4 flex-1 flex items-center justify-between">
                       <div className="flex flex-col gap-1 w-1/3">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('partner', 'PARTNER')}</span>
                         <span className="font-bold text-sm truncate">{g.partnerName}</span>
                       </div>
                       <div className="flex flex-col items-center justify-center px-4 w-1/3 border-x border-slate-100 dark:border-[#1E293B]">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold mb-1 border ${getMatchTypeColor(g.type)} whitespace-nowrap`}>{g.type}</span>
                         <span className="font-black text-lg text-slate-900 dark:text-white text-center whitespace-nowrap">
                            {g.scoreString || `${g.myScore} - ${g.oppScore}`}
                         </span>
                       </div>
                       <div className="flex flex-col gap-1 w-1/3 text-right">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('opponents', 'OPPONENTS')}</span>
                         <span className="font-bold text-sm truncate">{g.opp1Name}</span>
                         <span className="font-bold text-sm truncate">{g.opp2Name}</span>
                       </div>
                     </div>
                     <div className={`p-4 sm:w-24 shrink-0 flex items-center justify-center font-bold text-sm uppercase tracking-widest ${g.result === 'Won' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : g.result === 'Lost' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-slate-50 text-slate-500 dark:bg-[#1E293B]'}`}>
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