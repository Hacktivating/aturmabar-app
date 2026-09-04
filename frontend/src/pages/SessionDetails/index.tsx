import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Users, SquareStack, Play, History, Clock, Settings as SettingsIcon,
  Plus, Check, Pause, X, Edit2, Zap, Globe, Sun, Moon, LogOut, ChevronDown, Search, 
  Trash2, ArrowRightLeft, ListOrdered, AlertCircle, AlertTriangle, FileDown, Square, 
  Trophy, Medal, Wallet, TrendingUp, TrendingDown, DollarSign, RotateCcw, CircleHelp,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SessionGlobalTimer, getGradeColor, getMatchTypeColor, formatCurrency } from './utils';
import { PlayerSlotSelect } from './components/PlayerSlotSelect';

// Import Tabs
import { AttendanceTab } from './tabs/AttendanceTab';
import { CourtsTab } from './tabs/CourtsTab';
import { MatchesTab } from './tabs/MatchesTab';
import { BillingTab } from './tabs/BillingTab';
import { HistoryTab } from './tabs/HistoryTab';
import { LeaderboardTab } from './tabs/LeaderboardTab';
import { PlaytimeTab } from './tabs/PlaytimeTab';
import { SettingsTab } from './tabs/SettingsTab';

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

export default function SessionDetails() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [communityData, setCommunityData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [attendances, setAttendances] = useState<any[]>([]);
  const [allMembers, setMembers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // States
  const [attendanceTeamTab, setAttendanceTeamTab] = useState<'home' | 'away'>('home');
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
  const [walkInForm, setWalkInForm] = useState({ name: '', gender: 'male', skillLevel: 'C1', team: 'home' });
  
  const [editCourtId, setEditCourtId] = useState<number | null>(null);
  const [courtName, setCourtName] = useState('');
  const [playerDetailModal, setPlayerDetailModal] = useState<number | null>(null);
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);
  const [isFairnessModalOpen, setIsFairnessModalOpen] = useState(false);

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
  
  const [confirmDeleteCourtId, setConfirmDeleteCourtId] = useState<number | null>(null);
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState<number | null>(null);
  const [confirmResetMatchId, setConfirmResetMatchId] = useState<number | null>(null);

  const [manualPlayers, setManualPlayers] = useState({ ta1: 0, ta2: 0, tb1: 0, tb2: 0 });
  const [historyForm, setHistoryForm] = useState({ courtId: 0, ta1: 0, ta2: 0, tb1: 0, tb2: 0, sa1: 0, sb1: 0, sa2: 0, sb2: 0, sa3: 0, sb3: 0 });
  const [historySetView, setHistorySetView] = useState(1);

  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success'|'error'}[]>([]);

  const inputStyles = "w-full px-3 py-2.5 bg-app dark:bg-surface-dark border border-default dark:border-subtle-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-ink transition-all text-primary dark:text-primary-dark";

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
        api.get(`/sessions/${id}`), api.get('/members'), api.get(`/sessions/${id}/attendances`),
        api.get(`/matches/${id}`), api.get('/users/me')
      ]);
      setSession(sessionRes.data); setSettingsForm(sessionRes.data);
      setDefaultFee(sessionRes.data.defaultFee || 0); setMemberDefaultFee(sessionRes.data.memberDefaultFee || 0);
      setCourts(sessionRes.data.courts || []); setExpenses(sessionRes.data.expenses || []);
      setMembers(membersRes.data); setAttendances(attendancesRes.data);
      setMatches(matchesRes.data); setCommunityData(userRes.data.community);

      const ml = sessionRes.data.matchLimit;
      if (ml === 0) setLbLimitType('all');
      else if ([1,2,3,4,5].includes(ml)) setLbLimitType(String(ml));
      else { setLbLimitType('custom'); setLbCustomLimit(ml); }
    } catch (err) { navigate('/sessions'); } finally { setLoading(false); }
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

  // CALCULATIONS / USE-MEMOS
  const visibleAttendances = useMemo(() => attendances.filter(a => a.attendance.status !== 'cancelled' && a.attendance.status !== 'absent').filter(a => session?.sessionType !== 'sparring' || a.attendance.team === attendanceTeamTab).filter(a => a.member.name.toLowerCase().includes(attendanceSearch.toLowerCase())), [attendances, attendanceSearch, session?.sessionType, attendanceTeamTab]);
  const availableMembersModal = useMemo(() => allMembers.filter(m => !attendances.some(a => a.member.id === m.id && (a.attendance.status === 'active' || a.attendance.status === 'resting'))).filter(m => m.name.toLowerCase().includes(modalSearch.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)), [allMembers, attendances, modalSearch]);
  const activeMatches = useMemo(() => matches.filter(m => m.status === 'queued' || m.status === 'on_court'), [matches]);
  const finishedMatches = useMemo(() => matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()), [matches]);
  const queuedMatchesList = useMemo(() => matches.filter(m => m.courtId === null && m.status === 'queued').sort((a,b) => a.id - b.id), [matches]);

  const busyPlayerIds = useMemo(() => {
    const ids = new Set<number>();
    activeMatches.forEach(m => {
      if (editMatchModal && m.id === editMatchModal.id) return;
      if (m.teamA_player1) ids.add(m.teamA_player1); if (m.teamA_player2) ids.add(m.teamA_player2);
      if (m.teamB_player1) ids.add(m.teamB_player1); if (m.teamB_player2) ids.add(m.teamB_player2);
    });
    return ids;
  }, [activeMatches, editMatchModal]);

  const availableForManualMatch = useMemo(() => attendances.filter(a => a.attendance.status === 'active').map(a => ({ ...a.member, team: a.attendance.team })).filter(m => !busyPlayerIds.has(m.id) || (editMatchModal && (m.id === editMatchModal.teamA_player1 || m.id === editMatchModal.teamA_player2 || m.id === editMatchModal.teamB_player1 || m.id === editMatchModal.teamB_player2))).sort((a, b) => a.name.localeCompare(b.name)), [attendances, busyPlayerIds, editMatchModal]);
  const historyPlayerOptions = useMemo(() => [...allMembers].sort((a, b) => a.name.localeCompare(b.name)), [allMembers]);

  const filteredHistory = useMemo(() => finishedMatches.filter(match => {
    if (!historySearch) return true;
    const s = historySearch.toLowerCase();
    const pA1 = getMemberData(match.teamA_player1)?.name?.toLowerCase() || ''; const pA2 = getMemberData(match.teamA_player2)?.name?.toLowerCase() || '';
    const pB1 = getMemberData(match.teamB_player1)?.name?.toLowerCase() || ''; const pB2 = getMemberData(match.teamB_player2)?.name?.toLowerCase() || '';
    const court = getInitialCourtName(match.courtId)?.toLowerCase() || '';
    return pA1.includes(s) || pA2.includes(s) || pB1.includes(s) || pB2.includes(s) || court.includes(s);
  }), [finishedMatches, historySearch, allMembers, courts]);

  const playerMatchCounts = useMemo(() => {
    const counts: Record<number, { finished: number, ongoing: number, total: number }> = {};
    allMembers.forEach(m => counts[m.id] = { finished: 0, ongoing: 0, total: 0 });
    finishedMatches.forEach(m => { if(m.teamA_player1) counts[m.teamA_player1].finished++; if(m.teamA_player2) counts[m.teamA_player2].finished++; if(m.teamB_player1) counts[m.teamB_player1].finished++; if(m.teamB_player2) counts[m.teamB_player2].finished++; });
    activeMatches.forEach(m => { if (m.status === 'on_court') { if(m.teamA_player1) counts[m.teamA_player1].ongoing++; if(m.teamA_player2) counts[m.teamA_player2].ongoing++; if(m.teamB_player1) counts[m.teamB_player1].ongoing++; if(m.teamB_player2) counts[m.teamB_player2].ongoing++; } });
    Object.keys(counts).forEach(key => { counts[parseInt(key)].total = counts[parseInt(key)].finished + counts[parseInt(key)].ongoing; });
    return counts;
  }, [finishedMatches, activeMatches, allMembers]);

  const waitingListPlayers = useMemo(() => attendances.filter(a => a.attendance.status === 'active' && !busyPlayerIds.has(a.member.id)).map(a => { const stats = playerMatchCounts[a.member.id] || { total: 0, finished: 0, ongoing: 0 }; return { ...a.member, attendanceId: a.attendance.id, arrivedAt: a.attendance.arrivedAt, gamesPlayed: stats.total, finishedCount: stats.finished, ongoingCount: stats.ongoing }; }).sort((a, b) => { if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed; return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime(); }), [attendances, busyPlayerIds, playerMatchCounts]);

  const fairnessInsights = useMemo(() => {
    const matchHistory = [...finishedMatches, ...activeMatches.filter(m => m.status === 'on_court')];
    const stats = new Map<number, { id: number; name: string; turns: number; lastPlayedAt: number; partners: Map<number, number>; opponents: Map<number, number> }>();
    allMembers.forEach(member => stats.set(member.id, { id: member.id, name: member.name, turns: 0, lastPlayedAt: 0, partners: new Map(), opponents: new Map() }));
    matchHistory.forEach(match => {
      const sides = [ [match.teamA_player1, match.teamA_player2], [match.teamB_player1, match.teamB_player2] ];
      const playedAt = new Date(match.startedAt || match.endedAt || Date.now()).getTime();
      sides.forEach(([first, second], sideIndex) => {
        const playerIds = [first, second].filter(Boolean) as number[];
        playerIds.forEach(playerId => {
          const player = stats.get(playerId); if (!player) return;
          player.turns += 1; player.lastPlayedAt = Math.max(player.lastPlayedAt, playedAt);
          const partnerId = playerIds.find(id => id !== playerId);
          if (partnerId) player.partners.set(partnerId, (player.partners.get(partnerId) || 0) + 1);
          const opponents = sides[sideIndex === 0 ? 1 : 0].filter(Boolean) as number[];
          opponents.forEach(opponentId => player.opponents.set(opponentId, (player.opponents.get(opponentId) || 0) + 1));
        });
      });
    });
    const now = Date.now();
    return Array.from(stats.values()).filter(player => attendances.some(item => item.member.id === player.id && item.attendance.status !== 'cancelled')).map(player => {
      const waitingPosition = waitingListPlayers.findIndex(item => item.id === player.id);
      const restMinutes = player.lastPlayedAt ? Math.max(0, Math.round((now - player.lastPlayedAt) / 60000)) : null;
      const partnerRepeat = Math.max(0, ...Array.from(player.partners.values()).map(value => value - 1));
      const opponentRepeat = Math.max(0, ...Array.from(player.opponents.values()).map(value => value - 1));
      return { ...player, restMinutes, waitingPosition: waitingPosition >= 0 ? waitingPosition + 1 : null, partnerRepeat, opponentRepeat };
    }).sort((a, b) => a.turns - b.turns || (a.lastPlayedAt || 0) - (b.lastPlayedAt || 0) || a.name.localeCompare(b.name));
  }, [allMembers, attendances, activeMatches, finishedMatches, waitingListPlayers]);

  const calculatePlayerGames = (member: any) => {
    if (!member) return [];
    return [...finishedMatches, ...activeMatches.filter(m => m.status === 'on_court')].filter(m => m.teamA_player1 === member.id || m.teamA_player2 === member.id || m.teamB_player1 === member.id || m.teamB_player2 === member.id).sort((a, b) => new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime()).map(m => {
      let isTeamA = (m.teamA_player1 === member.id || m.teamA_player2 === member.id);
      let partnerId = isTeamA ? (m.teamA_player1 === member.id ? m.teamA_player2 : m.teamA_player1) : (m.teamB_player1 === member.id ? m.teamB_player2 : m.teamB_player1);
      let opp1 = isTeamA ? m.teamB_player1 : m.teamA_player1; let opp2 = isTeamA ? m.teamB_player2 : m.teamA_player2;
      let partnerGender = getMemberData(partnerId)?.gender; let myGender = member.gender;
      let type = 'MD';
      if (myGender === 'female' && partnerGender === 'female') type = 'WD';
      else if ((myGender === 'male' && partnerGender === 'female') || (myGender === 'female' && partnerGender === 'male')) type = 'XD';
      if (!partnerGender) type = '??';
      const pName = getMemberData(partnerId)?.name || 'None'; const o1Name = getMemberData(opp1)?.name || 'TBD'; const o2Name = getMemberData(opp2)?.name || 'TBD';
      const courtName = getInitialCourtName(m.courtId) || 'Unknown Court';
      const duration = m.startedAt && m.endedAt ? Math.max(0, Math.floor((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)) + ' min' : '-';
      if (m.status === 'on_court') return { id: m.id, type, courtName, duration, partnerName: pName, opp1Name: o1Name, opp2Name: o2Name, myScore: 0, oppScore: 0, result: 'Ongoing', scoreString: 'Playing...' };
      let myScore = 0, oppScore = 0; let scoreStrings = [];
      for(let i=1; i<=maxSets; i++) {
        let sa = m[`scoreTeamA_set${i}`]; let sb = m[`scoreTeamB_set${i}`];
        if (sa > 0 || sb > 0 || i === 1) { if (isTeamA) { myScore += sa; oppScore += sb; scoreStrings.push(`${sa}-${sb}`); } else { myScore += sb; oppScore += sa; scoreStrings.push(`${sb}-${sa}`); } }
      }
      const result = myScore > oppScore ? 'Won' : myScore < oppScore ? 'Lost' : 'Draw';
      return { id: m.id, type, courtName, duration, partnerName: pName, opp1Name: o1Name, opp2Name: o2Name, myScore, oppScore, result, scoreString: scoreStrings.join(' / ') };
    });
  };

  const playtimeData = useMemo(() => attendances.filter(a => a.attendance.status !== 'cancelled' && a.attendance.status !== 'absent').filter(a => a.member.name.toLowerCase().includes(playtimeSearch.toLowerCase())).map(({ member, attendance }) => ({ member, attendance, playedGames: calculatePlayerGames(member) })).sort((a, b) => { if (a.playedGames.length !== b.playedGames.length) return a.playedGames.length - b.playedGames.length; return a.member.name.localeCompare(b.member.name); }), [attendances, playtimeSearch, finishedMatches, activeMatches, maxSets, allMembers]);

  const sessionLeaderboardData = useMemo(() => {
    if (!session || session.sessionType === 'sparring' || !finishedMatches) return [];
    const activeMatchLimit = lbLimitType === 'all' ? 999 : (lbLimitType === 'custom' ? lbCustomLimit : parseInt(lbLimitType));
    const playerStats: Record<number, any> = {};
    allMembers.forEach(m => { playerStats[m.id] = { id: m.id, name: m.name, grade: m.skillLevel, played: 0, won: 0, lost: 0, netSets: 0, netPoints: 0, totalPoints: 0, lastWinTime: 0 }; });
    const playerMatchCount: Record<number, number> = {};
    const chronologicalMatches = [...finishedMatches].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    chronologicalMatches.forEach(match => {
      const pA1 = match.teamA_player1; const pA2 = match.teamA_player2; const pB1 = match.teamB_player1; const pB2 = match.teamB_player2;
      const isEligible = (pId: number | null) => { if (!pId) return false; if (!playerMatchCount[pId]) playerMatchCount[pId] = 0; if (playerMatchCount[pId] < activeMatchLimit) { playerMatchCount[pId]++; return true; } return false; };
      const eA1 = isEligible(pA1); const eA2 = isEligible(pA2); const eB1 = isEligible(pB1); const eB2 = isEligible(pB2);
      let sa = 0, sb = 0; let setsA = 0, setsB = 0;
      for (let i=1; i<=maxSets; i++) {
        const s1 = match[`scoreTeamA_set${i}`] || 0; const s2 = match[`scoreTeamB_set${i}`] || 0;
        if (s1 > 0 || s2 > 0 || i === 1) { sa += s1; sb += s2; if (s1 > s2) setsA++; else if (s2 > s1) setsB++; }
      }
      const aWon = sa > sb; const bWon = sb > sa; const endTime = new Date(match.endedAt).getTime();
      const applyStats = (pId: number | null, eligible: boolean, isTeamA: boolean) => {
        if (!pId || !eligible || !playerStats[pId]) return; const p = playerStats[pId]; p.played++;
        if ((isTeamA && aWon) || (!isTeamA && bWon)) { p.won++; p.lastWinTime = Math.max(p.lastWinTime, endTime); } else if ((isTeamA && bWon) || (!isTeamA && aWon)) { p.lost++; }
        p.netSets += isTeamA ? (setsA - setsB) : (setsB - setsA); p.netPoints += isTeamA ? (sa - sb) : (sb - sa); p.totalPoints += isTeamA ? sa : sb;
      };
      applyStats(pA1, eA1, true); applyStats(pA2, eA2, true); applyStats(pB1, eB1, false); applyStats(pB2, eB2, false);
    });
    const sortedWithRanks = Object.values(playerStats).filter(p => p.played > 0).map(p => ({ ...p, winRate: p.played > 0 ? (p.won / p.played) : 0 })).sort((a, b) => { if (b.winRate !== a.winRate) return b.winRate - a.winRate; if (b.won !== a.won) return b.won - a.won; if (b.netSets !== a.netSets) return b.netSets - a.netSets; if (b.netPoints !== a.netPoints) return b.netPoints - a.netPoints; if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints; return a.lastWinTime - b.lastWinTime; }).map((p, index) => ({ ...p, rank: index + 1 }));
    if (leaderboardSearch) return sortedWithRanks.filter((p: any) => p.name.toLowerCase().includes(leaderboardSearch.toLowerCase()));
    return sortedWithRanks;
  }, [finishedMatches, allMembers, session, maxSets, leaderboardSearch, lbLimitType, lbCustomLimit]);

  const sparringScore = useMemo(() => {
    let homeMatches = 0, awayMatches = 0; let homeSets = 0, awaySets = 0; let homePoints = 0, awayPoints = 0;
    finishedMatches.forEach(m => {
      let hSets = 0, aSets = 0; let hPts = 0, aPts = 0;
      for (let i = 1; i <= maxSets; i++) {
        const sa = m[`scoreTeamA_set${i}`] || 0; const sb = m[`scoreTeamB_set${i}`] || 0; 
        if (sa > 0 || sb > 0 || i === 1) { hPts += sa; aPts += sb; if (sa > sb) hSets++; else if (sb > sa) aSets++; }
      }
      homeSets += hSets; awaySets += aSets; homePoints += hPts; awayPoints += aPts;
      if (hSets > aSets) homeMatches++; else if (aSets > hSets) awayMatches++;
    });
    return { homeMatches, awayMatches, homeSets, awaySets, homePoints, awayPoints };
  }, [finishedMatches, maxSets]);

  const billingAttendances = useMemo(() => {
    const uniqueMap = new Map();
    attendances.forEach(a => { const existing = uniqueMap.get(a.member.id); if (!existing || (a.attendance.paymentAmount || 0) > (existing.attendance.paymentAmount || 0)) { uniqueMap.set(a.member.id, a); } });
    return Array.from(uniqueMap.values()).filter(a => a.attendance.status !== 'cancelled').filter(a => a.member.name.toLowerCase().includes(billingSearch.toLowerCase())).sort((a, b) => a.member.name.localeCompare(b.member.name));
  }, [attendances, billingSearch]);

  const totalIncome = useMemo(() => attendances.reduce((sum, a) => (a.attendance.paymentStatus === 'paid' || a.attendance.paymentStatus === 'member') ? sum + (a.attendance.paymentAmount || 0) : sum, 0), [attendances]);
  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const netBalance = totalIncome - totalExpense;

  const settingsLimitType = settingsForm.matchLimit === 0 ? 'all' : ([1,2,3,4,5].includes(settingsForm.matchLimit) ? String(settingsForm.matchLimit) : 'custom');

  // Helpers
  function getMemberData(memberId: number) { return allMembers.find(m => m.id === memberId); }
  function getInitialCourtName(cId: number) { return courts.find(c => c.id === cId)?.name; }
  
  const getOptionsFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => {
    const selectedIds = Object.entries(manualPlayers).filter(([k]) => k !== currentKey).map(([, v]) => v);
    let filtered = availableForManualMatch;
    if (session?.sessionType === 'sparring') { const requiredTeam = (currentKey === 'ta1' || currentKey === 'ta2') ? 'home' : 'away'; filtered = filtered.filter(m => m.team === requiredTeam); }
    return filtered.filter(m => !selectedIds.includes(m.id));
  };
  const getSwapListFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => Object.entries(manualPlayers).filter(([k, v]) => k !== currentKey && v !== 0).map(([, v]) => ({ id: v, name: getMemberData(v)?.name || '' }));
  const getHistorySwapListFor = (currentKey: 'ta1'|'ta2'|'tb1'|'tb2') => Object.entries(historyForm).filter(([k]) => k.startsWith('t')).filter(([k, v]) => k !== currentKey && v !== 0).map(([, v]) => ({ id: v, name: getMemberData(v as number)?.name || '' }));

  const selectedDetailPlayer = playerDetailModal ? getMemberData(playerDetailModal) : null;
  const selectedDetailGames = playerDetailModal ? calculatePlayerGames(selectedDetailPlayer) : [];

  // ACTIONS
  const handleStartSession = async () => { if(isProcessing) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/start`); await fetchSessionData(); addToast("Session started successfully"); } catch(err) { addToast("Error starting session", "error"); } finally { setIsProcessing(false); } };
  const handleEndSession = async () => { if(isProcessing || !window.confirm("Are you sure you want to end this session? All ongoing matches will need to be finished manually.")) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/finish`); await fetchSessionData(); addToast("Session ended successfully"); } catch(err) { addToast("Error ending session", "error"); } finally { setIsProcessing(false); } };
  
  const applyPDFHeaderFooter = (doc: any, title: string, subtitle: string) => {
    let yPos = 20; doc.setFillColor(15, 23, 42); doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    if (communityData?.logo?.startsWith('data:image')) { try { doc.addImage(communityData.logo, 14, 10, 16, 16); doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.text(communityData.name || 'Community', 35, 18); doc.setFontSize(10); doc.setTextColor(148, 163, 184); doc.setFont("helvetica", "normal"); doc.text("Generated by AturMabar", 35, 24); } catch(e) {} } else { doc.setFontSize(18); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.text(communityData?.name || 'Community', 14, 20); doc.setFontSize(10); doc.setTextColor(148, 163, 184); doc.setFont("helvetica", "normal"); doc.text("Generated by AturMabar", 14, 26); }
    yPos = 55; doc.setFontSize(18); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.text(title, 14, yPos); yPos += 8; doc.setFontSize(11); doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.text(subtitle, 14, yPos);
    for(let i = 1; i <= doc.internal.getNumberOfPages(); i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text('Generated by AturMabar', 14, doc.internal.pageSize.height - 10); } return yPos + 10; 
  };

  const exportSessionPDF = () => {
    const doc = new jsPDF(); const tableStartY = applyPDFHeaderFooter(doc, `Session Report: ${session?.name}`, `Date: ${new Date(session?.date).toLocaleString(i18n.language)}`);
    const tableData = finishedMatches.map(m => {
      const teamA = `${getMemberData(m.teamA_player1)?.name || 'TBD'} & ${getMemberData(m.teamA_player2)?.name || 'TBD'}`; const teamB = `${getMemberData(m.teamB_player1)?.name || 'TBD'} & ${getMemberData(m.teamB_player2)?.name || 'TBD'}`; const courtName = getInitialCourtName(m.courtId) || 'Unknown Court'; const duration = m.startedAt && m.endedAt ? Math.max(0, Math.floor((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)) + ' min' : '-';
      let saTotal = 0, sbTotal = 0; let scores = [];
      for(let i=1; i<=maxSets; i++) { const sa = m[`scoreTeamA_set${i}`] || 0; const sb = m[`scoreTeamB_set${i}`] || 0; if (sa > 0 || sb > 0 || i === 1) { scores.push(`${sa}-${sb}`); saTotal += sa; sbTotal += sb; } }
      return [m.matchType, `${courtName}\n${duration}`, teamA, scores.join(' / '), teamB, saTotal > sbTotal ? 'A' : (sbTotal > saTotal ? 'B' : 'Draw')];
    });
    autoTable(doc, { startY: tableStartY, head: [['Type', 'Details', 'Team A', 'Score', 'Team B']], body: tableData.map(row => row.slice(0, 5)), theme: 'grid', headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }, styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240] }, alternateRowStyles: { fillColor: [248, 250, 252] }, didParseCell: function (data) { if (data.section === 'body') { const winner = tableData[data.row.index][5]; if (data.column.index === 1) { data.cell.styles.textColor = [100, 116, 139]; data.cell.styles.fontSize = 8; } if (winner === 'A') { if (data.column.index === 2 || data.column.index === 3) { data.cell.styles.textColor = [5, 150, 105]; data.cell.styles.fontStyle = 'bold'; } } else if (winner === 'B') { if (data.column.index === 4 || data.column.index === 3) { data.cell.styles.textColor = [5, 150, 105]; data.cell.styles.fontStyle = 'bold'; } } } } });
    doc.save(`Session_${session?.name}_Report.pdf`); addToast("Session PDF Exported successfully!");
  };

  const exportPlayerPDF = (_memberId: number, memberName: string, playedGames: any[]) => {
    const doc = new jsPDF(); const tableStartY = applyPDFHeaderFooter(doc, `Player Report: ${memberName}`, `Session: ${session?.name} | Date: ${new Date(session?.date).toLocaleString(i18n.language)}`);
    autoTable(doc, { startY: tableStartY, head: [['Type', 'Details', 'Partner', 'Score', 'Opponents', 'Result']], body: playedGames.map(g => [g.type, `${g.courtName}\n${g.duration}`, g.partnerName, g.scoreString, `${g.opp1Name} & ${g.opp2Name}`, g.result]), theme: 'grid', headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }, styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240] }, alternateRowStyles: { fillColor: [248, 250, 252] }, didParseCell: function (data) { if (data.section === 'body') { const result = (data.row.raw as any[])[5]; if (data.column.index === 1) { data.cell.styles.textColor = [100, 116, 139]; data.cell.styles.fontSize = 8; } if (result === 'Won') { if (data.column.index === 2 || data.column.index === 3 || data.column.index === 5) { data.cell.styles.textColor = [5, 150, 105]; data.cell.styles.fontStyle = 'bold'; } } else if (result === 'Lost') { if (data.column.index === 4) { data.cell.styles.textColor = [5, 150, 105]; data.cell.styles.fontStyle = 'bold'; } if (data.column.index === 5) { data.cell.styles.textColor = [225, 29, 72]; data.cell.styles.fontStyle = 'bold'; } } else if (result === 'Ongoing') { if (data.column.index === 5) { data.cell.styles.textColor = [37, 99, 235]; } } } } });
    doc.save(`Player_${memberName}_Report.pdf`); addToast("Player PDF Exported successfully!");
  };

  const openAttendeeModal = () => { setSelectedAttendees([]); setModalSearch(''); setAttendeeModalOpen(true); };
  const toggleSelectAttendee = (memberId: number) => setSelectedAttendees(prev => prev.includes(memberId) ? prev.filter(mid => mid !== memberId) : [...prev, memberId]);
  
  const handleAddSelectedAttendees = async () => {
    if (selectedAttendees.length === 0 || isProcessing) return; setIsProcessing(true);
    try { await Promise.all(selectedAttendees.map(async (memberId) => { const existingRecord = attendances.find(a => a.member.id === memberId); if (existingRecord) return api.put(`/sessions/${id}/attendances/${existingRecord.attendance.id}`, { status: 'active' }); return api.post(`/sessions/${id}/attendances`, { memberId, team: attendanceTeamTab }); })); await fetchSessionData(); setAttendeeModalOpen(false); addToast(String(t('attendance_added', { defaultValue: "Attendees added successfully" }))); } catch (err) { addToast("Error processing attendees.", "error"); } finally { setIsProcessing(false); }
  };

  const handleOpenImportModal = async () => {
    setIsProcessing(true);
    try { const res = await api.get('/members/periods'); setMembershipPeriods(res.data); const sessionDate = new Date(session.date); let defaultId = ''; const matchingPeriod = res.data.find((p: any) => { const start = new Date(p.startDate); const end = new Date(p.endDate); return sessionDate >= start && sessionDate <= end; }); if (matchingPeriod) { defaultId = String(matchingPeriod.id); } else if (res.data.length > 0) { defaultId = String(res.data[0].id); } setSelectedPeriodId(defaultId); setImportModalOpen(true); } catch(err) { addToast("Error loading periods", "error"); } finally { setIsProcessing(false); }
  };

  const confirmImport = async () => { if (!selectedPeriodId || isProcessing) return; setIsProcessing(true); try { await api.post(`/sessions/${id}/billing/sync-period`, { periodId: parseInt(selectedPeriodId) }); await fetchSessionData(); setImportModalOpen(false); addToast(String(t('members_imported', { defaultValue: 'Members imported successfully.' }))); } catch(err: any) { addToast(err.response?.data?.error || "Error importing members", "error"); } finally { setIsProcessing(false); } };

  const openWalkInModal = () => { setWalkInForm({ name: '', gender: 'male', skillLevel: 'C1', team: attendanceTeamTab }); setWalkInModalOpen(true); };
  const handleWalkIn = async (e: React.FormEvent) => { e.preventDefault(); if(isProcessing) return; setIsProcessing(true); try { await api.post(`/sessions/${id}/walk-in`, walkInForm); await fetchSessionData(); setWalkInModalOpen(false); setWalkInForm({ name: '', gender: 'male', skillLevel: 'C1', team: 'home' }); addToast(String(t('walk_in_added', { defaultValue: "Walk-in player added successfully" }))); } catch (err) { addToast("Error adding walk-in", "error"); } finally { setIsProcessing(false); } };
  const updateAttendanceStatus = async (attendanceId: number, status: string) => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/attendances/${attendanceId}`, { status }); await fetchSessionData(); addToast(String(t('status_updated', { defaultValue: "Status updated" }))); } catch (err) { addToast("Error updating status", "error"); } finally { setIsProcessing(false); } };
  const handleUpdateGrade = async (memberId: number, skillLevel: string) => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/members/${memberId}/grade`, { skillLevel }); await fetchSessionData(); addToast("Player grade updated successfully"); } catch (err) { addToast("Error updating grade", "error"); } finally { setIsProcessing(false); } };
  const handleAddCourt = async () => { if (isProcessing) return; setIsProcessing(true); try { await api.post(`/sessions/${id}/courts`, { name: `Court ${courts.length + 1}` }); await fetchSessionData(); addToast(String(t('court_added', { defaultValue: "Court added" }))); } catch (err) { addToast("Error adding court", "error"); } finally { setIsProcessing(false); } };
  const handleUpdateCourt = async (courtId: number, isActive: boolean, name?: string) => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/courts/${courtId}`, { isActive, name: name || courts.find(c => c.id === courtId)?.name }); setEditCourtId(null); await fetchSessionData(); addToast(String(t('court_updated', { defaultValue: "Court updated" }))); } catch (err) { addToast("Error updating court", "error"); } finally { setIsProcessing(false); } };
  
  const handleConfirmDeleteCourt = async () => {
    if (!confirmDeleteCourtId || isProcessing) return; setIsProcessing(true);
    try { await api.delete(`/sessions/${id}/courts/${confirmDeleteCourtId}`); await fetchSessionData(); addToast(String(t('court_deleted', { defaultValue: "Court deleted" }))); } catch (err) { addToast("Error deleting court", "error"); } finally { setConfirmDeleteCourtId(null); setIsProcessing(false); }
  };

  const handleAutoGenerateCourt = async (courtId: number) => { if (isProcessing) return; setIsProcessing(true); try { await api.post(`/matches/${id}/auto-generate`, { courtId }); await fetchSessionData(); addToast("Match generated successfully"); } catch (err: any) { addToast(err.response?.data?.error || "Error generating match", "error"); } finally { setIsProcessing(false); } };
  const handleAutoFillAllCourts = async () => { if (isProcessing) return; setIsProcessing(true); try { const emptyCourts = courts.filter(c => c.isActive && !matches.find(m => m.courtId === c.id && (m.status === 'on_court' || m.status === 'queued'))); let generated = 0; for (const court of emptyCourts) { try { await api.post(`/matches/${id}/auto-generate`, { courtId: court.id }); generated++; } catch (err) { break; } } await fetchSessionData(); if (generated > 0) addToast(`Successfully filled ${generated} court(s)`); else addToast("Not enough available players", "error"); } finally { setIsProcessing(false); } };
  const handleQueueMatch = async () => { if (isProcessing) return; setIsProcessing(true); try { await api.post(`/matches/${id}/auto-generate`, { courtId: null }); await fetchSessionData(); addToast(String(t('match_queued', { defaultValue: "Match added to queue" }))); } catch (err: any) { addToast(err.response?.data?.error || "Error generating match", "error"); } finally { setIsProcessing(false); } };
  const handleStartMatch = async (matchId: number) => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/matches/${matchId}/start`); await fetchSessionData(); addToast(String(t('match_started', { defaultValue: "Match started" }))); } catch (err) { addToast("Error starting match", "error"); } finally { setIsProcessing(false); } };
  
  const handleFinishMatch = async (matchId: number, saveScore: boolean, scores?: any) => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      const payload: any = {};
      if (saveScore && scores) { payload.scoreTeamA_set1 = parseInt(scores.a1) || 0; payload.scoreTeamB_set1 = parseInt(scores.b1) || 0; payload.scoreTeamA_set2 = parseInt(scores.a2) || 0; payload.scoreTeamB_set2 = parseInt(scores.b2) || 0; payload.scoreTeamA_set3 = parseInt(scores.a3) || 0; payload.scoreTeamB_set3 = parseInt(scores.b3) || 0; }
      await api.put(`/matches/${matchId}/finish`, payload); await fetchSessionData(); addToast(String(t('match_finished', { defaultValue: "Match finished" })));
    } catch (err) { addToast("Error finishing match", "error"); } finally { setIsProcessing(false); }
  };

  const handleUpdateSparringMatch = async (matchId: number, updates: any) => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/matches/${matchId}/sparring`, updates); await fetchSessionData(); } catch (err) { addToast("Error updating sparring match", "error"); } finally { setIsProcessing(false); } };
  const handleResetMatch = async () => { if (!confirmResetMatchId || isProcessing) return; setIsProcessing(true); try { await api.put(`/matches/${confirmResetMatchId}/reset`); await fetchSessionData(); addToast("Match reset to queued status."); } catch (err) { addToast("Error resetting match", "error"); } finally { setConfirmResetMatchId(null); setIsProcessing(false); } };
  const handleConfirmDeleteMatch = async () => {
    if (!confirmDeleteMatchId || isProcessing) return; setIsProcessing(true);
    try { 
      if (session?.sessionType === 'sparring') { await api.put(`/matches/${confirmDeleteMatchId}/sparring`, { teamA_player1: null, teamA_player2: null, teamB_player1: null, teamB_player2: null, courtId: null, status: 'queued' }); addToast("Match cleared successfully."); } 
      else { await api.delete(`/matches/${confirmDeleteMatchId}`); addToast(String(t('match_cancelled', { defaultValue: "Match cancelled successfully." }))); }
      await fetchSessionData(); 
    } catch (err) { addToast("Error canceling match", "error"); } finally { setConfirmDeleteMatchId(null); setIsProcessing(false); }
  };
  
  const handleSwapCourt = async (matchId: number, targetCourtId: number | null) => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/matches/${matchId}/swap-court`, { targetCourtId }); setSwapCourtModal(null); await fetchSessionData(); addToast(String(t('court_swapped', { defaultValue: "Court swapped successfully" }))); } catch (err) { addToast("Error swapping courts", "error"); } finally { setIsProcessing(false); } };
  const handleReorderQueue = async (currentIndex: number, direction: 'up'|'down') => {
    if (isProcessing) return; const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1; if (targetIndex < 0 || targetIndex >= queuedMatchesList.length) return; setIsProcessing(true);
    try { const m1 = queuedMatchesList[currentIndex]; const m2 = queuedMatchesList[targetIndex]; await Promise.all([ api.put(`/matches/${m1.id}/players`, { teamA_player1: m2.teamA_player1, teamA_player2: m2.teamA_player2, teamB_player1: m2.teamB_player1, teamB_player2: m2.teamB_player2 }), api.put(`/matches/${m2.id}/players`, { teamA_player1: m1.teamA_player1, teamA_player2: m1.teamA_player2, teamB_player1: m1.teamB_player1, teamB_player2: m1.teamB_player2 }) ]); await fetchSessionData(); } catch(e) { addToast("Failed to reorder queue", "error"); } finally { setIsProcessing(false); }
  };
  
  const openEditMatchModal = (match: any) => { setManualPlayers({ ta1: match.teamA_player1 || 0, ta2: match.teamA_player2 || 0, tb1: match.teamB_player1 || 0, tb2: match.teamB_player2 || 0 }); setEditMatchModal(match); };
  const handleSwapWithinMatch = (sourceKey: 'ta1'|'ta2'|'tb1'|'tb2', targetId: number) => { const targetKey = (Object.keys(manualPlayers) as Array<keyof typeof manualPlayers>).find(k => manualPlayers[k as keyof typeof manualPlayers] === targetId); if (targetKey) { setManualPlayers(prev => ({ ...prev, [sourceKey]: prev[targetKey as keyof typeof manualPlayers], [targetKey]: prev[sourceKey as keyof typeof manualPlayers] })); } };
  const saveManualMatch = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      const payload = { teamA_player1: manualPlayers.ta1 || null, teamA_player2: manualPlayers.ta2 || null, teamB_player1: manualPlayers.tb1 || null, teamB_player2: manualPlayers.tb2 || null };
      if (editMatchModal.id) { if (session?.sessionType === 'sparring') { await api.put(`/matches/${editMatchModal.id}/sparring`, payload); } else { await api.put(`/matches/${editMatchModal.id}/players`, payload); } addToast(String(t('match_updated', { defaultValue: "Players updated successfully" }))); } else { await api.post(`/matches/${id}/manual`, { ...payload, courtId: editMatchModal.courtId }); addToast("Manual match created successfully"); }
      setEditMatchModal(null); await fetchSessionData();
    } catch (err) { addToast("Error saving players", "error"); } finally { setIsProcessing(false); }
  };

  const openEditHistoryModal = (match: any) => { setHistorySetView(1); setHistoryForm({ courtId: match.courtId || 0, ta1: match.teamA_player1 || 0, ta2: match.teamA_player2 || 0, tb1: match.teamB_player1 || 0, tb2: match.teamB_player2 || 0, sa1: match.scoreTeamA_set1 || 0, sb1: match.scoreTeamB_set1 || 0, sa2: match.scoreTeamA_set2 || 0, sb2: match.scoreTeamB_set2 || 0, sa3: match.scoreTeamA_set3 || 0, sb3: match.scoreTeamB_set3 || 0 }); setEditHistoryModal(match); };
  const handleSwapWithinHistory = (sourceKey: 'ta1'|'ta2'|'tb1'|'tb2', targetId: number) => { const targetKey = (Object.keys(historyForm).filter(k=>k.startsWith('t'))).find(k => historyForm[k as keyof typeof historyForm] === targetId); if (targetKey) { setHistoryForm(prev => ({ ...prev, [sourceKey]: prev[targetKey as keyof typeof historyForm], [targetKey]: prev[sourceKey as keyof typeof historyForm] })); } };
  const saveHistoryMatch = async () => {
    if (isProcessing) return; setIsProcessing(true);
    try {
      const payload: any = { courtId: historyForm.courtId || null, teamA_player1: historyForm.ta1 || null, teamA_player2: historyForm.ta2 || null, teamB_player1: historyForm.tb1 || null, teamB_player2: historyForm.tb2 || null, scoreTeamA_set1: historyForm.sa1 || 0, scoreTeamB_set1: historyForm.sb1 || 0, scoreTeamA_set2: historyForm.sa2 || 0, scoreTeamB_set2: historyForm.sb2 || 0, scoreTeamA_set3: historyForm.sa3 || 0, scoreTeamB_set3: historyForm.sb3 || 0 };
      if (session?.sessionType === 'sparring') { if (editHistoryModal.status === 'on_court') payload.status = 'finished'; await api.put(`/matches/${editHistoryModal.id}/sparring`, payload); } else { await api.put(`/matches/${editHistoryModal.id}/history`, payload); }
      setEditHistoryModal(null); await fetchSessionData(); addToast("Scores saved successfully");
    } catch (err) { addToast("Error saving score", "error"); } finally { setIsProcessing(false); }
  };

  const handleResetBilling = async () => { if (isProcessing || !window.confirm(String(t('reset_billing_confirm', { defaultValue: 'Are you sure you want to reset all player payments to Unpaid?' })))) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/billing/reset`); await fetchSessionData(); addToast(String(t('billing_reset', { defaultValue: 'Billing reset successfully.' }))); } catch (err) { addToast("Error resetting billing", "error"); } finally { setIsProcessing(false); } };
  const handleUpdateDefaultFee = async () => { if (isProcessing) return; setIsProcessing(true); try { await api.put(`/sessions/${id}/billing/default-fee`, { defaultFee, memberDefaultFee }); await fetchSessionData(); addToast(String(t('fee_updated', { defaultValue: 'Fees updated successfully' }))); } catch (err) { addToast("Error updating fees", "error"); } finally { setIsProcessing(false); } };
  const handleUpdatePayment = async (attendanceId: number, paymentAmount: number, paymentStatus: string) => { try { await api.put(`/sessions/${id}/attendances/${attendanceId}/payment`, { paymentAmount, paymentStatus }); await fetchSessionData(); } catch (err) { addToast("Error updating payment", "error"); } };
  const savePaymentAmount = (attendanceId: number, status: string) => { handleUpdatePayment(attendanceId, editPaymentValue, status); setEditingPaymentId(null); };
  const handleStatusChange = (attendance: any, newStatus: string) => { let finalAmount = attendance.paymentAmount || 0; if (newStatus === 'paid') finalAmount = defaultFee; if (newStatus === 'member') finalAmount = memberDefaultFee; if (newStatus === 'free' || newStatus === 'unpaid' || newStatus === 'member_unpaid') finalAmount = 0; handleUpdatePayment(attendance.id, finalAmount, newStatus); };
  const handleAddExpense = async (e: React.FormEvent) => { e.preventDefault(); if (isProcessing) return; setIsProcessing(true); try { await api.post(`/sessions/${id}/expenses`, { description: expenseForm.description, amount: parseInt(expenseForm.amount) }); setExpenseForm({ description: '', amount: '' }); await fetchSessionData(); addToast(String(t('expense_added', { defaultValue: 'Expense added' }))); } catch (err) { addToast("Error adding expense", "error"); } finally { setIsProcessing(false); } };
  const handleDeleteExpense = async (expenseId: number) => { if (isProcessing || !window.confirm("Delete this expense?")) return; setIsProcessing(true); try { await api.delete(`/sessions/${id}/expenses/${expenseId}`); await fetchSessionData(); addToast(String(t('expense_deleted', { defaultValue: 'Expense deleted' }))); } catch (err) { addToast("Error deleting expense", "error"); } finally { setIsProcessing(false); } };
  const handleSaveSettings = async (e: React.FormEvent) => { e.preventDefault(); if (isProcessing) return; setIsProcessing(true); try { await api.put(`/sessions/${id}`, settingsForm); await fetchSessionData(); addToast(String(t('save_settings', { defaultValue: "Settings saved successfully" }))); } catch (err) { addToast("Error saving settings", "error"); } finally { setIsProcessing(false); } };
  const handleDeleteSession = async () => { if (isProcessing || !window.confirm(String(t('delete_session_warning', { defaultValue: "Delete session?" })))) return; setIsProcessing(true); try { await api.delete(`/sessions/${id}`); navigate('/sessions'); } catch (err) { addToast("Error deleting session", "error"); setIsProcessing(false); } };

  if (loading) return <div className="min-h-screen bg-app dark:bg-app-dark flex items-center justify-center text-muted-ink">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark text-primary dark:text-primary-dark font-sans flex flex-col relative pb-32">
      
      {/* Notification Toasts */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toastItem => (
          <div key={toastItem.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 fade-in duration-300 border ${toastItem.type === 'success' ? 'bg-ink border-ink text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
            {toastItem.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {toastItem.message}
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toastItem.id))} className="ml-4 hover:opacity-75"><X size={16}/></button>
          </div>
        ))}
      </div>

      {/* Main Top Navigation */}
      <nav className="h-16 border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-ink dark:bg-ink-dark p-1.5 rounded-md flex items-center justify-center text-white dark:text-white shrink-0">
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

      {/* Session Details Header */}
      <div className="bg-surface dark:bg-surface-dark border-b border-subtle dark:border-subtle-dark shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/sessions" className="p-2 sm:p-2.5 bg-app dark:bg-elevated-dark border border-subtle dark:border-strong-dark rounded-xl hover:bg-muted dark:hover:bg-strong-dark/80 transition-colors shrink-0">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{session?.name}</h1>
                {session?.sessionType === 'sparring' && (
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-purple-200 dark:border-purple-800">
                    Sparring: {communityData?.name} vs {session?.opposingCommunityName}
                  </span>
                )}
              </div>
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
            <button type="button" onClick={() => setIsFairnessModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-muted dark:border-subtle-dark dark:bg-surface-dark dark:text-primary-dark dark:hover:bg-elevated-dark">
              <CircleHelp size={17} /> <span className="hidden sm:block">{t('fairness_insights')}</span>
            </button>
          </div>
        </div>
        
        {/* Desktop Tab Selector */}
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
        {activeTab === 'attendance' && (
           <AttendanceTab visibleAttendances={visibleAttendances} session={session} communityData={communityData} attendanceTeamTab={attendanceTeamTab} setAttendanceTeamTab={setAttendanceTeamTab} attendanceSearch={attendanceSearch} setAttendanceSearch={setAttendanceSearch} openWalkInModal={openWalkInModal} openAttendeeModal={openAttendeeModal} setPlayerDetailModal={setPlayerDetailModal} handleUpdateGrade={handleUpdateGrade} updateAttendanceStatus={updateAttendanceStatus} isProcessing={isProcessing} t={t} />
        )}
        {activeTab === 'courts' && (
           <CourtsTab courts={courts} editCourtId={editCourtId} setEditCourtId={setEditCourtId} courtName={courtName} setCourtName={setCourtName} handleAddCourt={handleAddCourt} handleUpdateCourt={handleUpdateCourt} setConfirmDeleteCourtId={setConfirmDeleteCourtId} isProcessing={isProcessing} t={t} inputStyles={inputStyles} />
        )}
        {activeTab === 'matches' && (
           <MatchesTab session={session} communityData={communityData} courts={courts} matches={matches} activeMatches={activeMatches} queuedMatchesList={queuedMatchesList} finishedMatches={finishedMatches} waitingListPlayers={waitingListPlayers} maxSets={maxSets} isProcessing={isProcessing} getMemberData={getMemberData} getInitialCourtName={getInitialCourtName} openEditMatchModal={openEditMatchModal} openEditHistoryModal={openEditHistoryModal} handleAutoGenerateCourt={handleAutoGenerateCourt} setSwapCourtModal={setSwapCourtModal} setConfirmDeleteMatchId={setConfirmDeleteMatchId} setConfirmResetMatchId={setConfirmResetMatchId} handleStartMatch={handleStartMatch} handleFinishMatch={handleFinishMatch} handleReorderQueue={handleReorderQueue} handleQueueMatch={handleQueueMatch} handleAutoFillAllCourts={handleAutoFillAllCourts} handleUpdateSparringMatch={handleUpdateSparringMatch} updateAttendanceStatus={updateAttendanceStatus} isWaitingListOpen={isWaitingListOpen} setIsWaitingListOpen={setIsWaitingListOpen} t={t} />
        )}
        {activeTab === 'billing' && (
           <BillingTab billingAttendances={billingAttendances} totalIncome={totalIncome} totalExpense={totalExpense} netBalance={netBalance} defaultFee={defaultFee} setDefaultFee={setDefaultFee} memberDefaultFee={memberDefaultFee} setMemberDefaultFee={setMemberDefaultFee} billingSearch={billingSearch} setBillingSearch={setBillingSearch} editingPaymentId={editingPaymentId} setEditingPaymentId={setEditingPaymentId} editPaymentValue={editPaymentValue} setEditPaymentValue={setEditPaymentValue} isProcessing={isProcessing} handleOpenImportModal={handleOpenImportModal} handleUpdateDefaultFee={handleUpdateDefaultFee} handleResetBilling={handleResetBilling} savePaymentAmount={savePaymentAmount} handleStatusChange={handleStatusChange} expenses={expenses} expenseForm={expenseForm} setExpenseForm={setExpenseForm} handleAddExpense={handleAddExpense} handleDeleteExpense={handleDeleteExpense} t={t} inputStyles={inputStyles} />
        )}
        {activeTab === 'history' && (
           <HistoryTab historySearch={historySearch} setHistorySearch={setHistorySearch} filteredHistory={filteredHistory} maxSets={maxSets} getMemberData={getMemberData} getInitialCourtName={getInitialCourtName} openEditHistoryModal={openEditHistoryModal} setConfirmDeleteMatchId={setConfirmDeleteMatchId} isProcessing={isProcessing} t={t} />
        )}
        {activeTab === 'leaderboard' && (
           <LeaderboardTab session={session} communityData={communityData} leaderboardSearch={leaderboardSearch} setLeaderboardSearch={setLeaderboardSearch} lbLimitType={lbLimitType} setLbLimitType={setLbLimitType} lbCustomLimit={lbCustomLimit} setLbCustomLimit={setLbCustomLimit} sessionLeaderboardData={sessionLeaderboardData} sparringScore={sparringScore} t={t} inputStyles={inputStyles} />
        )}
        {activeTab === 'playtime' && (
           <PlaytimeTab playtimeSearch={playtimeSearch} setPlaytimeSearch={setPlaytimeSearch} playtimeData={playtimeData} setPlayerDetailModal={setPlayerDetailModal} t={t} inputStyles={inputStyles} />
        )}
        {activeTab === 'settings' && (
           <SettingsTab settingsForm={settingsForm} setSettingsForm={setSettingsForm} settingsLimitType={settingsLimitType} handleSaveSettings={handleSaveSettings} handleDeleteSession={handleDeleteSession} isProcessing={isProcessing} t={t} inputStyles={inputStyles} />
        )}
      </main>

      {/* ALL FIXED MODALS ARE PLACED HERE AT THE ROOT WITH z-[9999] */}
      
      {/* Import Members Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
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
                  <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)} className={inputStyles}>
                    {membershipPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
                  </select>
                  <p className="text-xs text-muted-ink mt-4">Importing will sync all members from the selected period. They will be marked as "Absent" until they physically arrive.</p>
                </>
              )}
            </div>
            <div className="p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-end gap-3 rounded-b-2xl">
              <button disabled={isProcessing} onClick={() => setImportModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors">Cancel</button>
              <button disabled={isProcessing || membershipPeriods.length === 0} onClick={confirmImport} className="px-6 py-2.5 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-lg shadow-sm transition-colors">Import Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Match Edit Modal */}
      {editMatchModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-lg">{editMatchModal.id ? 'Edit Match Players' : 'Create Manual Match'}</h3>
              <button disabled={isProcessing} onClick={() => setEditMatchModal(null)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors"><X size={18}/></button>
            </div>
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 relative items-stretch min-h-[400px]">
              <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark flex items-center justify-center font-black">A</div>
                  <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team A {session?.sessionType === 'sparring' && <span className="text-xs ml-2 text-faint">({communityData?.name})</span>}</h4>
                </div>
                <div className="flex flex-col gap-4">
                  <PlayerSlotSelect options={getOptionsFor('ta1')} value={manualPlayers.ta1} t={t} currentName={getMemberData(manualPlayers.ta1)?.name} currentGrade={getMemberData(manualPlayers.ta1)?.skillLevel} swaps={getSwapListFor('ta1')} onSwap={(id: number) => handleSwapWithinMatch('ta1', id)} onChange={(v: number) => setManualPlayers({...manualPlayers, ta1: v})} placeholder="- Select Player 1 -" />
                  <PlayerSlotSelect options={getOptionsFor('ta2')} value={manualPlayers.ta2} t={t} currentName={getMemberData(manualPlayers.ta2)?.name} currentGrade={getMemberData(manualPlayers.ta2)?.skillLevel} swaps={getSwapListFor('ta2')} onSwap={(id: number) => handleSwapWithinMatch('ta2', id)} onChange={(v: number) => setManualPlayers({...manualPlayers, ta2: v})} placeholder="- Select Player 2 -" />
                </div>
              </div>
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface dark:bg-app-dark border border-subtle dark:border-subtle-dark shadow-md items-center justify-center font-black text-faint z-10">VS</div>
              <div className="md:hidden text-center text-faint font-black text-lg py-2">VS</div>
              <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-6 justify-end md:justify-start">
                  <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">B</div>
                  <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team B {session?.sessionType === 'sparring' && <span className="text-xs ml-2 text-faint">({session?.opposingCommunityName})</span>}</h4>
                  <div className="hidden md:flex w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 items-center justify-center font-black">B</div>
                </div>
                <div className="flex flex-col gap-4">
                  <PlayerSlotSelect options={getOptionsFor('tb1')} value={manualPlayers.tb1} t={t} currentName={getMemberData(manualPlayers.tb1)?.name} currentGrade={getMemberData(manualPlayers.tb1)?.skillLevel} swaps={getSwapListFor('tb1')} onSwap={(id: number) => handleSwapWithinMatch('tb1', id)} onChange={(v: number) => setManualPlayers({...manualPlayers, tb1: v})} placeholder="- Select Player 1 -" />
                  <PlayerSlotSelect options={getOptionsFor('tb2')} value={manualPlayers.tb2} t={t} currentName={getMemberData(manualPlayers.tb2)?.name} currentGrade={getMemberData(manualPlayers.tb2)?.skillLevel} swaps={getSwapListFor('tb2')} onSwap={(id: number) => handleSwapWithinMatch('tb2', id)} onChange={(v: number) => setManualPlayers({...manualPlayers, tb2: v})} placeholder="- Select Player 2 -" />
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
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
                    <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team A {session?.sessionType === 'sparring' && <span className="text-xs ml-2 text-faint">({communityData?.name})</span>}</h4>
                  </div>
                  <div className="flex flex-col gap-4">
                    <PlayerSlotSelect options={historyPlayerOptions.filter(m => m.id !== historyForm.ta2 && m.id !== historyForm.tb1 && m.id !== historyForm.tb2)} value={historyForm.ta1} t={t} currentName={getMemberData(historyForm.ta1)?.name} currentGrade={getMemberData(historyForm.ta1)?.skillLevel} swaps={getHistorySwapListFor('ta1')} onSwap={(id: number) => handleSwapWithinHistory('ta1', id)} onChange={(v: number) => setHistoryForm({...historyForm, ta1: v})} placeholder="- Select Player 1 -" />
                    <PlayerSlotSelect options={historyPlayerOptions.filter(m => m.id !== historyForm.ta1 && m.id !== historyForm.tb1 && m.id !== historyForm.tb2)} value={historyForm.ta2} t={t} currentName={getMemberData(historyForm.ta2)?.name} currentGrade={getMemberData(historyForm.ta2)?.skillLevel} swaps={getHistorySwapListFor('ta2')} onSwap={(id: number) => handleSwapWithinHistory('ta2', id)} onChange={(v: number) => setHistoryForm({...historyForm, ta2: v})} placeholder="- Select Player 2 -" />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <button type="button" onClick={() => setHistorySetView(v => v - 1)} disabled={historySetView <= 1 || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <label className="block text-xs font-semibold text-primary-soft dark:text-faint text-center uppercase tracking-widest">Score (Set {historySetView})</label>
                      <button type="button" onClick={() => setHistorySetView(v => v + 1)} disabled={historySetView >= maxSets || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                    <input disabled={isProcessing} type="number" value={historyForm[`sa${historySetView}` as keyof typeof historyForm] || ''} placeholder="0" onChange={e => setHistoryForm({...historyForm, [`sa${historySetView}`]: parseInt(e.target.value) || 0})} className={`${inputStyles} text-center font-black text-2xl py-4 ${(historyForm[`sa${historySetView}` as keyof typeof historyForm] as number) > (historyForm[`sb${historySetView}` as keyof typeof historyForm] as number) ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`} />
                  </div>
                </div>
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-surface dark:bg-app-dark border border-subtle dark:border-subtle-dark shadow-md items-center justify-center font-black text-faint z-10">VS</div>
                <div className="md:hidden text-center text-faint font-black text-lg py-2">VS</div>
                <div className="flex-1 w-full bg-app dark:bg-elevated-dark/30 p-5 md:p-6 rounded-2xl border border-subtle dark:border-subtle-dark shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-6 justify-end md:justify-start">
                    <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">B</div>
                    <h4 className="font-bold text-lg text-primary dark:text-primary-dark">Team B {session?.sessionType === 'sparring' && <span className="text-xs ml-2 text-faint">({session?.opposingCommunityName})</span>}</h4>
                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 items-center justify-center font-black">B</div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <PlayerSlotSelect options={historyPlayerOptions.filter(m => m.id !== historyForm.ta1 && m.id !== historyForm.ta2 && m.id !== historyForm.tb2)} value={historyForm.tb1} t={t} currentName={getMemberData(historyForm.tb1)?.name} currentGrade={getMemberData(historyForm.tb1)?.skillLevel} swaps={getHistorySwapListFor('tb1')} onSwap={(id: number) => handleSwapWithinHistory('tb1', id)} onChange={(v: number) => setHistoryForm({...historyForm, tb1: v})} placeholder="- Select Player 1 -" />
                    <PlayerSlotSelect options={historyPlayerOptions.filter(m => m.id !== historyForm.ta1 && m.id !== historyForm.ta2 && m.id !== historyForm.tb1)} value={historyForm.tb2} t={t} currentName={getMemberData(historyForm.tb2)?.name} currentGrade={getMemberData(historyForm.tb2)?.skillLevel} swaps={getHistorySwapListFor('tb2')} onSwap={(id: number) => handleSwapWithinHistory('tb2', id)} onChange={(v: number) => setHistoryForm({...historyForm, tb2: v})} placeholder="- Select Player 2 -" />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <button type="button" onClick={() => setHistorySetView(v => v - 1)} disabled={historySetView <= 1 || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <label className="block text-xs font-semibold text-primary-soft dark:text-faint text-center uppercase tracking-widest">Score (Set {historySetView})</label>
                      <button type="button" onClick={() => setHistorySetView(v => v + 1)} disabled={historySetView >= maxSets || isProcessing} className="p-1.5 text-muted-ink hover:text-ink disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                    <input disabled={isProcessing} type="number" value={historyForm[`sb${historySetView}` as keyof typeof historyForm] || ''} placeholder="0" onChange={e => setHistoryForm({...historyForm, [`sb${historySetView}`]: parseInt(e.target.value) || 0})} className={`${inputStyles} text-center font-black text-2xl py-4 ${(historyForm[`sb${historySetView}` as keyof typeof historyForm] as number) > (historyForm[`sa${historySetView}` as keyof typeof historyForm] as number) ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`} />
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

      {/* Confirmation Modal - Delete Court */}
      {confirmDeleteCourtId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl border border-subtle dark:border-subtle-dark p-6 text-center">
             <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 mx-auto flex items-center justify-center mb-4">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">{String(t('delete_court', { defaultValue: 'Delete Court' }))}?</h3>
             <p className="text-muted-ink dark:text-faint text-sm mb-6">Are you sure you want to delete this court? This action cannot be undone.</p>
             <div className="flex gap-3">
               <button disabled={isProcessing} onClick={() => setConfirmDeleteCourtId(null)} className="flex-1 py-3 bg-muted dark:bg-elevated-dark hover:bg-muted dark:hover:bg-strong-dark rounded-xl font-bold transition-colors disabled:opacity-50">{String(t('abort', { defaultValue: 'Cancel' }))}</button>
               <button disabled={isProcessing} onClick={handleConfirmDeleteCourt} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{String(t('confirm', { defaultValue: 'Confirm' }))}</button>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete/Cancel Match */}
      {confirmDeleteMatchId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl border border-subtle dark:border-subtle-dark p-6 text-center">
             <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 mx-auto flex items-center justify-center mb-4">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">{String(t('confirm_cancel_title', { defaultValue: 'Cancel Match' }))}</h3>
             <p className="text-muted-ink dark:text-faint text-sm mb-6">{String(t('confirm_cancel_desc', { defaultValue: 'Are you sure you want to cancel?' }))}</p>
             <div className="flex gap-3">
               <button disabled={isProcessing} onClick={() => setConfirmDeleteMatchId(null)} className="flex-1 py-3 bg-muted dark:bg-elevated-dark hover:bg-muted dark:hover:bg-strong-dark rounded-xl font-bold transition-colors disabled:opacity-50">{String(t('abort', { defaultValue: 'Cancel' }))}</button>
               <button disabled={isProcessing} onClick={handleConfirmDeleteMatch} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{String(t('confirm', { defaultValue: 'Confirm' }))}</button>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Reset Match */}
      {confirmResetMatchId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl border border-subtle dark:border-subtle-dark p-6 text-center">
             <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 mx-auto flex items-center justify-center mb-4">
               <RotateCcw size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">Reset Match?</h3>
             <p className="text-muted-ink dark:text-faint text-sm mb-6">This will reset the match timer and status back to Waiting. Are you sure?</p>
             <div className="flex gap-3">
               <button disabled={isProcessing} onClick={() => setConfirmResetMatchId(null)} className="flex-1 py-3 bg-muted dark:bg-elevated-dark hover:bg-muted dark:hover:bg-strong-dark rounded-xl font-bold transition-colors disabled:opacity-50">{String(t('abort', { defaultValue: 'Cancel' }))}</button>
               <button disabled={isProcessing} onClick={handleResetMatch} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">Reset Match</button>
             </div>
          </div>
        </div>
      )}

      {/* Swap Court Modal */}
      {swapCourtModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
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
                courts.filter(c => c.isActive && c.id !== swapCourtModal.courtId).map(c => {
                  const isOccupied = activeMatches.some(m => m.courtId === c.id && m.status === 'on_court');
                  return (
                    <button 
                      disabled={isProcessing} 
                      key={c.id} 
                      onClick={() => {
                        if (isOccupied) {
                          addToast("Cannot swap to this court. A match is currently ongoing. Please finish or cancel it first.", "error");
                        } else {
                          handleSwapCourt(swapCourtModal.id, c.id);
                        }
                      }} 
                      className={`w-full text-left p-4 rounded-xl border ${isOccupied ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-900/10 cursor-not-allowed opacity-75' : 'border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark hover:bg-accent-soft hover:border-ink dark:hover:bg-elevated-dark dark:hover:dark:border-strong-dark'} transition-colors font-bold flex justify-between items-center`}
                    >
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        {isOccupied && <span className="text-[10px] text-rose-500 uppercase tracking-widest mt-1">Match Ongoing</span>}
                      </div>
                      <ArrowRightLeft size={16} className={isOccupied ? "text-rose-400" : "text-faint"} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-select Attendee Modal */}
      {isAttendeeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">{String(t('add_attendee', { defaultValue: 'Add Attendee' }))}</h3>
              <button disabled={isProcessing} onClick={() => setAttendeeModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
            </div>
            
            <div className="p-4 border-b border-subtle dark:border-subtle-dark">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                <input disabled={isProcessing} type="text" placeholder={String(t('search_players', { defaultValue: 'Search Players...' }))} value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-app dark:bg-app-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm disabled:opacity-50" autoFocus />
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 bg-surface dark:bg-surface-dark">
              {availableMembersModal.length === 0 ? <div className="p-8 text-center text-muted-ink">{String(t('no_players', { defaultValue: 'No players found.' }))}</div> : 
               availableMembersModal.map((member: any) => (
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
                {String(t('add_selected', { defaultValue: 'Add Selected' })).replace('{{count}}', selectedAttendees.length.toString())}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">{String(t('add_walk_in', { defaultValue: 'Add Walk-In' }))}</h3>
              <button disabled={isProcessing} onClick={() => setWalkInModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
            </div>
            <form onSubmit={handleWalkIn} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Name</label>
                <input disabled={isProcessing} type="text" required placeholder="Walk-in Player Name" value={walkInForm.name} onChange={e => setWalkInForm({...walkInForm, name: e.target.value})} className={inputStyles} autoFocus />
              </div>
              
              {session?.sessionType === 'sparring' && (
                <div className="animate-in fade-in">
                  <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Team Assignment</label>
                  <select disabled={isProcessing} value={walkInForm.team} onChange={e => setWalkInForm({...walkInForm, team: e.target.value})} className={`${inputStyles} font-bold`}>
                    <option value="home">Home ({communityData?.name})</option>
                    <option value="away">Away ({session.opposingCommunityName})</option>
                  </select>
                </div>
              )}

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
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
                  <FileDown size={14}/> {String(t('export_pdf', { defaultValue: 'Export PDF' }))}
                </button>
                <button disabled={isProcessing} onClick={() => setPlayerDetailModal(null)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                 <div className="bg-app dark:bg-elevated-dark/30 border border-subtle dark:border-subtle-dark p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-primary dark:text-primary-dark">{selectedDetailGames.length}</div>
                   <div className="text-[10px] font-bold text-muted-ink uppercase tracking-widest mt-1">{String(t('matches_played', { defaultValue: 'MATCHES PLAYED' }))}</div>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedDetailGames.filter((g: any) => g.result === 'Won').length}</div>
                   <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-1">{String(t('won', { defaultValue: 'WON' }))}</div>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-rose-600 dark:text-rose-500">{selectedDetailGames.filter((g: any) => g.result === 'Lost').length}</div>
                   <div className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mt-1">{String(t('lost', { defaultValue: 'LOST' }))}</div>
                 </div>
                 <div className="bg-accent-soft dark:bg-accent-soft-dark border border-accent dark:border-subtle-dark p-4 rounded-xl text-center">
                   <div className="text-2xl font-black text-ink dark:text-ink-dark">
                     {selectedDetailGames.filter((g: any) => g.result !== 'Ongoing').length > 0 
                       ? Math.round((selectedDetailGames.filter((g: any) => g.result === 'Won').length / selectedDetailGames.filter((g: any) => g.result !== 'Ongoing').length) * 100) 
                       : 0}%
                   </div>
                   <div className="text-[10px] font-bold text-ink/70 uppercase tracking-widest mt-1">{String(t('win_rate', { defaultValue: 'WIN RATE' }))}</div>
                 </div>
              </div>

              <h4 className="font-bold mb-4">{String(t('history', { defaultValue: 'History' }))}</h4>
              <div className="flex flex-col gap-3">
                {selectedDetailGames.length === 0 ? <div className="p-8 text-center text-muted-ink border border-subtle dark:border-subtle-dark rounded-xl">{String(t('no_history', { defaultValue: 'No history found' }))}</div> : 
                 selectedDetailGames.map((g: any, i: number) => (
                   <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl overflow-hidden shadow-sm">
                     <div className="p-4 flex-1 flex items-center justify-between">
                       <div className="flex flex-col gap-1 w-1/3">
                         <span className="text-[10px] font-bold text-faint uppercase tracking-widest">{String(t('partner', { defaultValue: 'PARTNER' }))}</span>
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
                         <span className="text-[10px] font-bold text-faint uppercase tracking-widest">{String(t('opponents', { defaultValue: 'OPPONENTS' }))}</span>
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
                       {String(t(g.result.toLowerCase(), { defaultValue: g.result }))}
                     </div>
                   </div>
                 ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fairness Insights Modal */}
      {isFairnessModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="fairness-title">
          <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-subtle bg-surface shadow-2xl dark:border-subtle-dark dark:bg-surface-dark">
            <div className="flex items-start justify-between gap-4 border-b border-subtle px-5 py-5 dark:border-subtle-dark sm:px-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-ink dark:text-muted-dark">{String(t('organizer_view', { defaultValue: 'ORGANIZER VIEW' }))}</p>
                <h2 id="fairness-title" className="mt-1 text-xl font-bold tracking-tight text-primary dark:text-primary-dark">{String(t('fairness_insights', { defaultValue: 'Fairness Insights' }))}</h2>
                <p className="mt-1 max-w-xl text-sm leading-5 text-muted-ink dark:text-muted-dark">{String(t('fairness_insights_desc', { defaultValue: 'Matchmaking statistics.' }))}</p>
              </div>
              <button type="button" onClick={() => setIsFairnessModalOpen(false)} aria-label={String(t('close'))} className="rounded-lg p-2 text-muted-ink transition-colors hover:bg-muted hover:text-ink dark:text-muted-dark dark:hover:bg-elevated-dark dark:hover:text-primary-dark"><X size={18} /></button>
            </div>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
              {fairnessInsights.length === 0 ? (
                <div className="rounded-xl border border-subtle bg-app p-8 text-center text-sm text-muted-ink dark:border-subtle-dark dark:bg-elevated-dark dark:text-muted-dark">{String(t('fairness_insights_empty', { defaultValue: 'Not enough data yet.' }))}</div>
              ) : (
                <div className="space-y-4">
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] gap-3 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-ink dark:text-muted-dark sm:grid">
                    <span>{String(t('player', { defaultValue: 'Player' }))}</span><span>{String(t('court_turns', { defaultValue: 'Court Turns' }))}</span><span>{String(t('rest_time', { defaultValue: 'Rest Time' }))}</span><span>{String(t('partner_repetition', { defaultValue: 'Partner Repetition' }))}</span><span>{String(t('opponent_repetition', { defaultValue: 'Opponent Repetition' }))}</span>
                  </div>
                  {fairnessInsights.map((insight: any) => (
                    <div key={insight.id} className="rounded-xl border border-subtle bg-app p-4 dark:border-subtle-dark dark:bg-elevated-dark">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-bold text-primary dark:text-primary-dark">{insight.name}</span>
                        {insight.waitingPosition && <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-bold text-ink dark:bg-accent-soft-dark dark:text-ink-dark">{String(t('queue_position', { defaultValue: 'Queue #{{position}}' })).replace('{{position}}', insight.waitingPosition.toString())}</span>}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-ink dark:text-muted-dark sm:hidden">{String(t('court_turns', { defaultValue: 'Court Turns' }))}</p><p className="mt-1 font-bold text-primary dark:text-primary-dark sm:mt-0">{insight.turns}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-ink dark:text-muted-dark sm:hidden">{String(t('rest_time', { defaultValue: 'Rest Time' }))}</p><p className="mt-1 font-bold text-primary dark:text-primary-dark sm:mt-0">{insight.restMinutes === null ? String(t('not_played_yet', { defaultValue: 'Not played yet' })) : String(t('minutes_value', { defaultValue: '{{minutes}} mins' })).replace('{{minutes}}', insight.restMinutes.toString())}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-ink dark:text-muted-dark sm:hidden">{String(t('partner_repetition', { defaultValue: 'Partner Rep' }))}</p><p className="mt-1 font-bold text-primary dark:text-primary-dark sm:mt-0">{insight.partnerRepeat}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-ink dark:text-muted-dark sm:hidden">{String(t('opponent_repetition', { defaultValue: 'Opponent Rep' }))}</p><p className="mt-1 font-bold text-primary dark:text-primary-dark sm:mt-0">{insight.opponentRepeat}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-subtle bg-surface px-5 py-4 dark:border-subtle-dark dark:bg-surface-dark sm:px-7">
              <p className="text-xs leading-5 text-muted-ink dark:text-muted-dark">{String(t('fairness_insights_note', { defaultValue: 'This tracks matches generated algorithmically to ensure fairness.' }))}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}