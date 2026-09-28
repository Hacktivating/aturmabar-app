import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search, Calendar, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, Banknote, Zap, Globe, Sun, Moon, Settings, LogOut, ArrowLeft, PlayCircle, CalendarDays, ShieldAlert, Sparkles, Check, ArrowUpDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { TourOverlay } from '../components/TourOverlay';
import { CustomDateTimePicker } from '../components/CustomDateTimePicker';

interface Session {
  id: number;
  name: string;
  date: string;
  sessionType: string;
  scoringSystem: string;
  pairingRule: string;
  status: string;
  matchLimit: number;
  createdAt: string;
}

const normalizeGender = (value: unknown): 'male' | 'female' | null => {
  const gender = String(value ?? '').trim().toLowerCase();
  if (['male', 'man', 'm', 'laki-laki', 'laki laki', 'pria'].includes(gender)) return 'male';
  if (['female', 'woman', 'f', 'perempuan', 'wanita'].includes(gender)) return 'female';
  return null;
};

const SKILL_LEVELS = [
  { id: 'A1', label: 'A1 - Pro', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700' },
  { id: 'A2', label: 'A2 - Advanced', color: 'bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60' },
  { id: 'B1', label: 'B1 - Upper Intermediate', color: 'bg-blue-50 text-blue-700 dark:bg-[#172554]/60 dark:text-[#93c5fd] border border-blue-200 dark:border-blue-800/60' },
  { id: 'B2', label: 'B2 - Lower Intermediate', color: 'bg-teal-50 text-teal-700 dark:bg-[#042f2e]/60 dark:text-[#5eead4] border border-teal-200 dark:border-teal-800/60' },
  { id: 'C1', label: 'C1 - Beginner', color: 'bg-emerald-50 text-emerald-700 dark:bg-[#022c22]/60 dark:text-[#6ee7b7] border border-emerald-200 dark:border-emerald-800/60' },
  { id: 'C2', label: 'C2 - Newbie', color: 'bg-lime-50 text-lime-700 dark:bg-[#3f6212]/40 dark:text-[#d9f99d] border border-lime-200 dark:border-lime-800/60' }
];

export default function Sessions() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [communityData, setCommunityData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    courtCount: 3,
    sessionType: 'regular',
    opposingCommunityName: '',
    matchQuotas: { MD: 0, WD: 0, XD: 0 },
    scoringSystem: 'BWF 21 Points x 3 Sets',
    customSets: 3,
    customPoints: 21,
    pairingRule: 'strict',
    matchLimit: 0,
    defaultFee: 0,
    memberDefaultFee: 0
  });
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardMemberIds, setWizardMemberIds] = useState<number[]>([]);
  const [wizardMembers, setWizardMembers] = useState<Array<{ id: number; name: string; gender?: string; skillLevel?: string }>>([]);

  // --- TOUR STATE SYNC ---
  const [tourStep, setTourStep] = useState(() => parseInt(localStorage.getItem('app_tour_step') || '0', 10) || 0);
  
  const advanceTour = (step: number) => {
    setTourStep(step);
    localStorage.setItem('app_tour_step', step.toString());
    window.dispatchEvent(new Event('storage'));
  };

  const endTour = () => { advanceTour(0); setIsModalOpen(false); };

  useEffect(() => {
    const handleStorage = () => setTourStep(parseInt(localStorage.getItem('app_tour_step') || '0', 10) || 0);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  // ------------------------

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

  const fetchInitializationData = async () => {
    try {
      const [sessionsRes, userRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/users/me')
      ]);
      setSessions(sessionsRes.data);
      setCommunityData(userRes.data.community);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitializationData(); }, []);

  const getActiveSessionsList = () => {
    if (tourStep > 0) {
      const dummyId = parseInt(localStorage.getItem('tour_dummy_session') || '0', 10);
      return sessions.filter(s => s.id === dummyId);
    }
    return sessions;
  };

  const activeSessionsList = getActiveSessionsList();

  const processedSessions = activeSessionsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter ? s.date.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(processedSessions.length / itemsPerPage);
  const paginatedSessions = processedSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, 5);
      if (end === totalPages) start = Math.max(1, totalPages - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-10 h-10 hidden sm:flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
            currentPage === i 
              ? 'bg-ink dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105' 
              : 'text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white border border-transparent hover:border-subtle dark:hover:border-zinc-700'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const openCreateModal = async () => {
    if (tourStep === 10) {
      advanceTour(11);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const localDateTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData({ 
      ...formData, 
      date: localDateTime, 
      name: '', 
      sessionType: 'regular',
      opposingCommunityName: '',
      matchQuotas: { MD: 0, WD: 0, XD: 0 },
      defaultFee: 0, 
      memberDefaultFee: 0 
    });
    setWizardStep(1);
    setWizardMemberIds([]);
    try {
      const membersRes = await api.get('/members');
      if (tourStep > 0) {
         const dummyIds = JSON.parse(localStorage.getItem('tour_dummy_members') || '[]');
         setWizardMembers(membersRes.data.filter((m: any) => dummyIds.includes(m.id)));
      } else {
         setWizardMembers(membersRes.data);
      }
    } catch (err) {
      setWizardMembers([]);
    }
    setIsModalOpen(true);
  };

  const executeSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const payload = {
        ...formData,
        customSets: formData.scoringSystem === 'custom' ? formData.customSets : null,
        customPoints: formData.scoringSystem === 'custom' ? formData.customPoints : null,
      };
      const response = await api.post('/sessions', payload);
      const sessionId = response.data.session?.id;
      if (sessionId) {
        await api.put(`/sessions/${sessionId}/billing/default-fee`, {
          defaultFee: formData.defaultFee,
          memberDefaultFee: formData.memberDefaultFee
        });
      }
      if (sessionId && wizardMemberIds.length > 0) {
        await Promise.all(wizardMemberIds.map(memberId => api.post(`/sessions/${sessionId}/attendances`, { memberId, team: 'home' })));
      }
      setIsModalOpen(false);

      if (tourStep === 11 && sessionId) {
         localStorage.setItem('tour_dummy_session', sessionId.toString());
         advanceTour(12);
      }

      fetchInitializationData();
    } catch (err: any) {
      alert(err.response?.data?.error || String(t('op_failed', { defaultValue: 'Operation failed' })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextOrSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const form = document.getElementById('session-form') as HTMLFormElement;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (wizardStep < 5) {
      setWizardStep(step => step + 1);
    } else {
      executeSubmit();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(String(t('delete_confirm', { defaultValue: 'Delete this session?' })))) return;
    try {
      await api.delete(`/sessions/${id}`);
      fetchInitializationData();
    } catch (err) { alert(String(t('delete_failed', { defaultValue: 'Deletion failed' }))); }
  };

  const handleStartSession = async (id: number) => {
    try {
      await api.put(`/sessions/${id}/start`);
      navigate(`/sessions/${id}`);
    } catch (err) {
      alert("Failed to start session.");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase">ACTIVE</span>;
    if (status === 'finished' || status === 'ended') return <span className="bg-muted text-muted-ink border border-subtle dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase">FINISHED</span>;
    return <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase">SCHEDULED</span>;
  };

  const getBadgeStyle = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.color || 'bg-muted text-primary-soft dark:bg-zinc-800 dark:text-zinc-400 border border-transparent dark:border-zinc-700';
  const getBadgeLabel = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.label || levelId;

  const inputStyles = "w-full px-4 py-3 bg-app dark:bg-[#121214] border border-default dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ink transition-all text-primary dark:text-white";
  const labelStyles = "block text-xs font-bold mb-2 text-muted-ink dark:text-zinc-400 uppercase tracking-wider";
  const formLimitType = formData.matchLimit === 0 ? 'all' : ([1,2,3,4,5].includes(formData.matchLimit) ? String(formData.matchLimit) : 'custom');

  return (
    <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">

      {/* --- TOUR OVERLAYS (Sessions Steps 10 to 12) --- */}
      <TourOverlay step={10} currentStep={tourStep} targetId="tour-create-session" title="Create Session" content="Click here to build a new session and configure your matchmaking rules." allowClick={true} hideNext={true} onCancel={endTour} />
      <TourOverlay step={11} currentStep={tourStep} targetId="tour-session-wizard-modal" hideTooltip={true} allowClick={true} />
      <TourOverlay step={12} currentStep={tourStep} targetId="tour-demo-session-card" title="Session Ready!" content="You did it! Click on your new session to enter the admin dashboard and start playing." allowClick={true} hideNext={true} onCancel={endTour} />
      {/* ------------------------------------------- */}

      <nav className="border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-[#0f0f11] sticky top-0 z-20 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-ink dark:bg-white p-1.5 rounded-lg flex items-center justify-center text-white dark:text-zinc-950 shrink-0 shadow-sm">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 pr-3 sm:pr-5 border-r border-subtle dark:border-zinc-800 max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-muted dark:bg-zinc-800 border border-subtle dark:border-zinc-700 flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-sm">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-bold truncate hidden sm:block">{communityData?.name}</span>
            </div>

            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white transition-colors px-2.5 py-2 rounded-lg hover:bg-muted dark:hover:bg-zinc-800">
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{String(t('logout', { defaultValue: 'Logout' }))}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative p-4 sm:p-8 max-w-6xl mx-auto w-full flex flex-col z-10">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-5">
            <Link 
              id="tour-back-btn" 
              to="/dashboard" 
              className="block p-2.5 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300 transition-colors shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-white">{String(t('session_schedule', { defaultValue: 'Session & Schedule' }))}</h1>
            </div>
          </div>
          
          <button id="tour-create-session" onClick={openCreateModal} className="hidden sm:flex items-center justify-center gap-2 bg-ink dark:bg-[#f3f4f6] hover:bg-ink-soft dark:hover:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0">
            <Plus size={18} /> {String(t('create_session', { defaultValue: 'Create Session' }))}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={18} />
              <input type="text" placeholder={String(t('search_sessions', { defaultValue: 'Search session name...' }))} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-11 pr-4 py-3 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-medium text-primary dark:text-white"/>
            </div>
            <div className="relative w-full sm:w-64">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={18} />
              <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="w-full pl-11 pr-4 py-3 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-bold text-primary dark:text-white [&::-webkit-calendar-picker-indicator]:dark:invert opacity-80 hover:opacity-100 transition-opacity"/>
            </div>
          </div>
          
          <button onClick={openCreateModal} className="w-full sm:hidden flex items-center justify-center gap-2 bg-ink dark:bg-[#f3f4f6] hover:bg-ink-soft dark:hover:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0">
            <Plus size={18} /> {String(t('create_session', { defaultValue: 'Create Session' }))}
          </button>
        </div>

        <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-ink dark:text-zinc-500 p-8 font-medium">{String(t('loading', { defaultValue: 'Loading...' }))}</div>
          ) : paginatedSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-ink dark:text-zinc-500 p-12 text-center">
              <CalendarDays size={48} className="mb-4 opacity-50" />
              <p className="font-bold text-lg text-primary dark:text-white mb-1">{String(t('no_sessions', { defaultValue: 'No sessions found.' }))}</p>
              <p className="text-sm">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800 sticky top-0 z-10">
                    <tr className="text-xs uppercase tracking-widest text-muted-ink dark:text-zinc-400 font-bold">
                      <th className="p-5 w-1/3 cursor-pointer hover:bg-muted dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">Session Name <ArrowUpDown size={14} className="opacity-50"/></div>
                      </th>
                      <th className="p-5 w-1/4">Date & Time</th>
                      <th className="p-5 w-1/6">Status</th>
                      <th className="p-5 text-right w-1/4 pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {paginatedSessions.map((session) => {
                      const isTutorialCard = tourStep === 12 && session.id === parseInt(localStorage.getItem('tour_dummy_session') || '0');
                      return (
                        <tr id={isTutorialCard ? "tour-demo-session-card" : undefined} key={session.id} onClick={() => navigate(`/sessions/${session.id}`)} className="hover:bg-app dark:hover:bg-white/5 transition-colors cursor-pointer group">
                          <td className="p-5 font-bold text-base text-primary dark:text-zinc-100 group-hover:text-ink dark:group-hover:text-white transition-colors">
                            <div className="flex items-center gap-2">
                              {session.name}
                              {session.sessionType === 'sparring' && <span className="bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60 px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ml-2">SPARRING</span>}
                            </div>
                          </td>
                          <td className="p-5 text-sm font-medium text-muted-ink dark:text-zinc-400">
                            {new Date(session.date).toLocaleString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </td>
                          <td className="p-5">{getStatusBadge(session.status || 'scheduled')}</td>
                          <td className="p-5">
                            <div className="flex items-center justify-end gap-3 transition-opacity">
                              {(!session.status || session.status === 'scheduled') && (
                                <button onClick={(e) => { e.stopPropagation(); handleStartSession(session.id); }} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2 rounded-lg transition-colors">
                                  <PlayCircle size={16} /> {String(t('start_session', { defaultValue: 'Start Session' }))}
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col flex-1 divide-y divide-slate-100 dark:divide-zinc-800/50 overflow-y-auto">
                {paginatedSessions.map((session) => {
                  const isTutorialCard = tourStep === 12 && session.id === parseInt(localStorage.getItem('tour_dummy_session') || '0');
                  return (
                    <div id={isTutorialCard ? "tour-demo-session-card" : undefined} key={session.id} onClick={() => navigate(`/sessions/${session.id}`)} className="p-5 flex flex-col gap-4 hover:bg-app dark:hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-base mb-1 flex items-center gap-2 text-primary dark:text-zinc-100">
                            {session.name}
                            {session.sessionType === 'sparring' && <span className="bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase">SPARRING</span>}
                          </div>
                          <div className="text-xs font-medium text-muted-ink dark:text-zinc-400">
                            {new Date(session.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                        {getStatusBadge(session.status || 'scheduled')}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-4 border-t border-subtle dark:border-zinc-800">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                        {(!session.status || session.status === 'scheduled') && (
                          <button onClick={(e) => { e.stopPropagation(); handleStartSession(session.id); }} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-lg transition-colors">
                            <PlayCircle size={16} /> {String(t('start_session', { defaultValue: 'Start Session' }))}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Pagination UI */}
          {!loading && totalPages > 1 && (
            <div className="mt-auto p-4 sm:p-6 border-t border-subtle dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-app dark:bg-zinc-900/30 shrink-0">
              <span className="text-sm font-medium text-muted-ink dark:text-zinc-500">
                Showing <strong className="text-primary dark:text-white">{(currentPage - 1) * itemsPerPage + (processedSessions.length > 0 ? 1 : 0)}</strong> to <strong className="text-primary dark:text-white">{Math.min(currentPage * itemsPerPage, processedSessions.length)}</strong> of <strong className="text-primary dark:text-white">{processedSessions.length}</strong> sessions
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:h-10 border border-subtle dark:border-zinc-800 rounded-xl bg-surface dark:bg-[#18181b] disabled:opacity-40 hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white transition-all shadow-sm font-bold text-sm"
                >
                  <ChevronLeft size={16} className="-ml-1"/> <span className="hidden sm:inline">Prev</span>
                </button>
                
                <div className="flex items-center gap-1">
                  {renderPageNumbers()}
                </div>

                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:h-10 border border-subtle dark:border-zinc-800 rounded-xl bg-surface dark:bg-[#18181b] disabled:opacity-40 hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white transition-all shadow-sm font-bold text-sm"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight size={16} className="-mr-1"/>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Session Wizard */}
      {isModalOpen && (
        <div className={`fixed inset-0 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm animate-in fade-in duration-200 ${tourStep === 11 ? 'z-[2147483647]' : 'z-[999]'}`}>
          <div id="tour-session-wizard-modal" className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-3xl border border-subtle bg-surface shadow-2xl dark:border-zinc-800 dark:bg-[#0f0f11] relative overflow-hidden">
            
            {tourStep === 11 && (
               <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 p-5 text-amber-700 dark:text-amber-400 flex items-start gap-3">
                 <Sparkles className="shrink-0 mt-0.5" size={20} />
                 <div className="text-sm leading-relaxed font-medium">
                   <strong className="font-black text-amber-800 dark:text-amber-300 text-base block mb-1">Create a Session</strong>
                   Fill out a Name for the session. Click <strong>Next</strong> on each step to see the rules you can configure. On the final tab, click <strong>Create Session</strong> to finish!
                 </div>
               </div>
            )}

            <div className="border-b border-subtle bg-app px-6 py-6 dark:border-zinc-800 dark:bg-[#121214] sm:px-8 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-ink dark:text-zinc-500">{String(t('session_setup', { defaultValue: 'SESSION SETUP' }))}</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-primary dark:text-white">{String(t('create_session', { defaultValue: 'Create Session' }))}</h3>
                </div>
                {tourStep !== 11 && (
                  <button type="button" onClick={() => setIsModalOpen(false)} aria-label={String(t('cancel', { defaultValue: 'Cancel' }))} className="rounded-full p-2 text-muted-ink transition-colors hover:bg-muted hover:text-ink dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><X size={20} /></button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-5 gap-3" aria-label={String(t('session_setup_progress', { defaultValue: 'Session Setup Progress' }))}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex min-w-0 flex-col gap-2">
                    <div className={'h-1.5 rounded-full ' + (step <= wizardStep ? 'bg-ink dark:bg-white' : 'bg-muted dark:bg-zinc-800')} />
                    <span className={'truncate text-[10px] font-bold tracking-wider uppercase ' + (step === wizardStep ? 'text-primary dark:text-white' : 'text-faint dark:text-zinc-600')}>{String(t(['session_setup_basics', 'session_setup_courts', 'session_setup_roster', 'session_setup_rules', 'session_setup_fees'][step - 1], { defaultValue: ['Basics', 'Courts', 'Roster', 'Rules', 'Fees'][step - 1] }))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-8 no-scrollbar bg-surface dark:bg-[#0f0f11]">
              <form id="session-form" onSubmit={handleNextOrSubmit} className="space-y-8">
                
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-primary dark:text-white">{String(t('session_setup_basics', { defaultValue: 'Basics' }))}</h4>
                      <p className="mt-1 text-sm font-medium text-muted-ink dark:text-zinc-400">{String(t('session_setup_basics_desc', { defaultValue: 'Give the session a clear name and choose when it will take place.' }))}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, sessionType: 'regular'})} 
                        className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all ${formData.sessionType === 'regular' ? 'border-ink bg-app dark:border-white dark:bg-[#121214] shadow-sm' : 'border-subtle bg-surface hover:bg-app dark:border-zinc-800 dark:bg-[#0f0f11] dark:hover:bg-[#121214]'}`}
                      >
                        <span className="block font-bold text-base text-primary dark:text-white">Regular Session</span>
                        <span className="block text-sm font-medium text-muted-ink dark:text-zinc-400 mt-1">Internal community play</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, sessionType: 'sparring'})} 
                        className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all ${formData.sessionType === 'sparring' ? 'border-ink bg-app dark:border-white dark:bg-[#121214] shadow-sm' : 'border-subtle bg-surface hover:bg-app dark:border-zinc-800 dark:bg-[#0f0f11] dark:hover:bg-[#121214]'}`}
                      >
                        <span className="block font-bold text-base text-primary dark:text-white">Sparring Match</span>
                        <span className="block text-sm font-medium text-muted-ink dark:text-zinc-400 mt-1">Play against another club</span>
                      </button>
                    </div>

                    <div>
                      <label className={labelStyles}>{String(t('session_name', { defaultValue: 'Session Name' }))}</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={String(t('session_name_placeholder', { defaultValue: 'e.g. Sunday Morning Social' }))} className={inputStyles} autoFocus />
                    </div>

                    {formData.sessionType === 'sparring' && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className={labelStyles}>Opposing Community Name</label>
                        <input type="text" required={formData.sessionType === 'sparring'} value={formData.opposingCommunityName} onChange={e => setFormData({...formData, opposingCommunityName: e.target.value})} placeholder="e.g., PB Spartan" className={inputStyles} />
                      </div>
                    )}

                    <div className="relative pt-2">
                      <label className={labelStyles}>{String(t('date_time', { defaultValue: 'Date & Time' }))}</label>
                      <CustomDateTimePicker 
                         value={formData.date ? new Date(formData.date) : null} 
                         onChange={(d) => {
                           if (d) {
                             const pad = (n: number) => n.toString().padStart(2, '0');
                             const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                             setFormData({...formData, date: formatted});
                           } else {
                             setFormData({...formData, date: ''});
                           }
                         }} 
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-primary dark:text-white">{String(t('session_setup_courts', { defaultValue: 'Courts' }))}</h4>
                      <p className="mt-1 text-sm font-medium text-muted-ink dark:text-zinc-400">{String(t('session_setup_courts_desc', { defaultValue: 'How many courts will be used?' }))}</p>
                    </div>
                    <div>
                      <label className={labelStyles}>{String(t('court_count', { defaultValue: 'Court Count' }))}</label>
                      <input type="number" required min={1} max={20} value={formData.courtCount} onChange={e => setFormData({...formData, courtCount: parseInt(e.target.value) || 1})} className={inputStyles} />
                    </div>
                    <div className="rounded-xl border border-subtle bg-app p-5 dark:border-zinc-800 dark:bg-[#121214] shadow-sm">
                      <div className="flex items-start gap-4">
                        <SlidersHorizontal size={20} className="mt-0.5 text-ink dark:text-white" />
                        <div>
                          <p className="text-base font-bold text-primary dark:text-white">{String(t('session_setup_courts_tip', { defaultValue: 'Court Setup Tip' }))}</p>
                          <p className="mt-1 text-sm font-medium leading-relaxed text-muted-ink dark:text-zinc-400">{String(t('session_setup_courts_tip_desc', { defaultValue: 'You can adjust court names and active status later.' }))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-primary dark:text-white">{String(t('session_setup_roster', { defaultValue: 'Roster' }))}</h4>
                      <p className="mt-1 text-sm font-medium text-muted-ink dark:text-zinc-400">{String(t('session_setup_roster_desc', { defaultValue: 'Select initial members.' }))}</p>
                    </div>
                    
                    {tourStep === 11 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 p-4 text-sm font-bold text-amber-700 dark:text-amber-400 shadow-sm">
                        <Sparkles size={18} className="inline mr-1.5 -mt-0.5" /> Notice how only our 20 dummy players are here!
                      </div>
                    )}

                    <div className="rounded-2xl border border-subtle dark:border-zinc-800 overflow-hidden shadow-sm">
                      {wizardMembers.length === 0 ? (
                        <div className="p-8 text-center text-sm font-medium text-muted-ink dark:text-zinc-500 bg-app dark:bg-[#121214]">{String(t('session_setup_no_members', { defaultValue: 'No members available.' }))}</div>
                      ) : (
                        <div className="max-h-[320px] divide-y divide-subtle overflow-y-auto dark:divide-zinc-800 bg-app dark:bg-[#121214]">
                          {wizardMembers.map((member) => {
                            const selected = wizardMemberIds.includes(member.id);
                            return (
                              <label key={member.id} className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-muted dark:hover:bg-zinc-800/50">
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${selected ? 'bg-ink border-ink text-white dark:bg-white dark:border-white dark:text-zinc-900' : 'border-default dark:border-zinc-700 bg-transparent'}`}>
                                  {selected && <Check size={16} strokeWidth={3} />}
                                </div>
                                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-3">
                                  <span className="truncate text-base font-bold text-primary dark:text-zinc-100">{member.name}</span>
                                  {normalizeGender(member.gender) === 'male' && <span className="text-sky-600 dark:text-[#0ea5e9] bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase">♂ M</span>}
                                  {normalizeGender(member.gender) === 'female' && <span className="text-pink-600 dark:text-[#f472b6] bg-pink-50 dark:bg-[#f472b6]/10 border border-pink-200 dark:border-[#f472b6]/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase">♀ F</span>}
                                  {member.skillLevel && (
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${getBadgeStyle(member.skillLevel)}`}>
                                      {getBadgeLabel(member.skillLevel)}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <p className="text-sm font-bold text-muted-ink dark:text-zinc-400">{String(t('session_setup_selected_members', { defaultValue: 'Selected: {{count}}' })).replace('{{count}}', wizardMemberIds.length.toString())}</p>
                      <button type="button" onClick={() => setWizardMemberIds(wizardMembers.map(m => m.id))} className="text-sm font-black text-ink dark:text-white hover:underline transition-all">Select All Dummy Players</button>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-primary dark:text-white">{String(t('session_setup_rules', { defaultValue: 'Rules' }))}</h4>
                      <p className="mt-1 text-sm font-medium text-muted-ink dark:text-zinc-400">{String(t('session_setup_rules_desc', { defaultValue: 'Configure matchmaking rules.' }))}</p>
                    </div>

                    {formData.sessionType === 'sparring' && (
                      <div className="p-5 sm:p-6 border border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] rounded-2xl mb-6 animate-in fade-in shadow-sm">
                        <div className="flex items-center gap-2 mb-5 text-primary dark:text-white font-black text-base">
                          <ShieldAlert size={20} className="text-ink dark:text-white" /> Match Quotas <span className="text-muted-ink dark:text-zinc-500 font-medium text-sm">(Optional)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div><label className={labelStyles}>MD Count</label><input type="number" min={0} value={formData.matchQuotas.MD} onChange={e => setFormData({...formData, matchQuotas: {...formData.matchQuotas, MD: parseInt(e.target.value) || 0}})} className={inputStyles} /></div>
                          <div><label className={labelStyles}>WD Count</label><input type="number" min={0} value={formData.matchQuotas.WD} onChange={e => setFormData({...formData, matchQuotas: {...formData.matchQuotas, WD: parseInt(e.target.value) || 0}})} className={inputStyles} /></div>
                          <div><label className={labelStyles}>XD Count</label><input type="number" min={0} value={formData.matchQuotas.XD} onChange={e => setFormData({...formData, matchQuotas: {...formData.matchQuotas, XD: parseInt(e.target.value) || 0}})} className={inputStyles} /></div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <label className={labelStyles}>{String(t('scoring_system', { defaultValue: 'Scoring System' }))}</label>
                        <div className="relative">
                          <select value={formData.scoringSystem} onChange={e => setFormData({...formData, scoringSystem: e.target.value})} className={`${inputStyles} font-bold appearance-none pr-10`}>
                            <option value="BWF 21 Points x 3 Sets">{String(t('bwf_21', { defaultValue: 'BWF 21 Points' }))}</option>
                            <option value="BWF 15 Points x 3 Sets">{String(t('bwf_15', { defaultValue: 'BWF 15 Points' }))}</option>
                            <option value="42 Points x 1 Set">{String(t('pts_42', { defaultValue: '42 Points' }))}</option>
                            <option value="30 Points x 1 Set">{String(t('pts_30', { defaultValue: '30 Points' }))}</option>
                            <option value="custom">{String(t('custom', { defaultValue: 'Custom' }))}</option>
                          </select>
                          <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500 rotate-90" />
                        </div>
                      </div>
                      {formData.scoringSystem === 'custom' && (
                        <div className="grid grid-cols-2 gap-5">
                          <div><label className={labelStyles}>{String(t('custom_sets', { defaultValue: 'Sets' }))}</label><input type="number" required min={1} max={5} value={formData.customSets} onChange={e => setFormData({...formData, customSets: parseInt(e.target.value) || 1})} className={inputStyles} /></div>
                          <div><label className={labelStyles}>{String(t('custom_points', { defaultValue: 'Points' }))}</label><input type="number" required min={1} max={100} value={formData.customPoints} onChange={e => setFormData({...formData, customPoints: parseInt(e.target.value) || 21})} className={inputStyles} /></div>
                        </div>
                      )}
                      <div>
                        <label className={labelStyles}>{String(t('pairing_rule', { defaultValue: 'Pairing Strictness' }))}</label>
                        <div className="relative">
                          <select value={formData.pairingRule} onChange={e => setFormData({...formData, pairingRule: e.target.value})} className={`${inputStyles} font-bold appearance-none pr-10`}>
                            <option value="very_strict">{String(t('very_strict', { defaultValue: 'Very Strict' }))}</option>
                            <option value="strict">{String(t('strict', { defaultValue: 'Strict' }))}</option>
                            <option value="moderate">{String(t('moderate', { defaultValue: 'Moderate' }))}</option>
                            <option value="randomize">{String(t('randomize', { defaultValue: 'Randomize' }))}</option>
                          </select>
                          <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500 rotate-90" />
                        </div>
                      </div>
                      <div>
                        <label className={labelStyles}>{String(t('match_limit', { defaultValue: 'Match Limit' }))}</label>
                        <div className="relative">
                          <select value={formLimitType} onChange={e => { const val = e.target.value; if (val === 'all') setFormData({...formData, matchLimit: 0}); else if (val === 'custom') setFormData({...formData, matchLimit: 6}); else setFormData({...formData, matchLimit: parseInt(val)}); }} className={`${inputStyles} font-bold appearance-none pr-10`}>
                            <option value="all">{String(t('all_games', { defaultValue: 'All Games' }))}</option>
                            <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="custom">{String(t('custom_amount', { defaultValue: 'Custom Amount' }))}</option>
                          </select>
                          <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500 rotate-90" />
                        </div>
                      </div>
                      {formLimitType === 'custom' && <input type="number" min={1} value={formData.matchLimit} onChange={e => setFormData({...formData, matchLimit: parseInt(e.target.value) || 0})} className={inputStyles} placeholder={String(t('match_limit_placeholder', { defaultValue: 'Enter limit' }))} />}
                    </div>
                  </div>
                )}

                {wizardStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-primary dark:text-white">{String(t('session_setup_fees', { defaultValue: 'Fees' }))}</h4>
                      <p className="mt-1 text-sm font-medium text-muted-ink dark:text-zinc-400">{String(t('session_setup_fees_desc', { defaultValue: 'Set default payment amounts.' }))}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div><label className={labelStyles}>{String(t('walk_in_fee', { defaultValue: 'Walk-in Fee' }))}</label><div className="relative"><Banknote size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" /><input type="number" min={0} value={formData.defaultFee} onChange={e => setFormData({...formData, defaultFee: parseInt(e.target.value) || 0})} className={inputStyles + ' pl-11'} placeholder="0" /></div></div>
                      <div><label className={labelStyles}>{String(t('member_fee', { defaultValue: 'Member Fee' }))}</label><div className="relative"><Banknote size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" /><input type="number" min={0} value={formData.memberDefaultFee} onChange={e => setFormData({...formData, memberDefaultFee: parseInt(e.target.value) || 0})} className={inputStyles + ' pl-11'} placeholder="0" /></div></div>
                    </div>
                    <div className="rounded-2xl border border-subtle bg-app p-6 dark:border-zinc-800 dark:bg-[#121214] shadow-sm mt-4">
                      <p className="text-base font-black text-primary dark:text-white uppercase tracking-widest">{String(t('session_setup_summary', { defaultValue: 'Summary' }))}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-base">
                        <dt className="text-muted-ink dark:text-zinc-400 font-bold">{String(t('session_name', { defaultValue: 'Name' }))}</dt>
                        <dd className="truncate text-right font-black text-primary dark:text-white">{formData.name || '—'}</dd>
                        <dt className="text-muted-ink dark:text-zinc-400 font-bold">{String(t('court_count', { defaultValue: 'Courts' }))}</dt>
                        <dd className="text-right font-black text-primary dark:text-white">{formData.courtCount}</dd>
                        <dt className="text-muted-ink dark:text-zinc-400 font-bold">{String(t('session_setup_roster', { defaultValue: 'Roster' }))}</dt>
                        <dd className="text-right font-black text-primary dark:text-white">{wizardMemberIds.length}</dd>
                      </dl>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-subtle bg-app px-6 py-5 dark:border-zinc-800 dark:bg-[#121214] sm:px-8 shrink-0 z-10 relative">
              {tourStep !== 11 && (
                <button type="button" onClick={() => wizardStep === 1 ? setIsModalOpen(false) : setWizardStep(step => step - 1)} className="rounded-xl px-6 py-3 text-sm font-bold text-muted-ink transition-colors hover:bg-muted dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white">{wizardStep === 1 ? String(t('cancel', { defaultValue: 'Cancel' })) : String(t('back', { defaultValue: 'Back' }))}</button>
              )}
              <div className={tourStep === 11 ? 'w-full flex justify-end' : ''}>
                <button 
                  type="button" 
                  onClick={() => handleNextOrSubmit()} 
                  disabled={isProcessing} 
                  className="rounded-xl bg-ink px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isProcessing ? String(t('saving', { defaultValue: 'Saving...' })) : wizardStep < 5 ? String(t('next', { defaultValue: 'Next' })) : String(t('create_session', { defaultValue: 'Create' }))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}