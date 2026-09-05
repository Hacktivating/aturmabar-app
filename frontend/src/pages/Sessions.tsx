import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search, Calendar, Trash2, ChevronLeft, ChevronRight, SlidersHorizontal, Banknote, Zap, Globe, Sun, Moon, Settings, LogOut, ArrowLeft, PlayCircle, CalendarDays, ShieldAlert } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

// Import your custom picker
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

  const processedSessions = sessions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter ? s.date.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(processedSessions.length / itemsPerPage);
  const paginatedSessions = processedSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openCreateModal = async () => {
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
      setWizardMembers(membersRes.data);
    } catch (err) {
      setWizardMembers([]);
    }
    setIsModalOpen(true);
  };

  // --- NEW UNIFIED ACTION HANDLER ---
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
      fetchInitializationData();
    } catch (err: any) {
      alert(err.response?.data?.error || String(t('op_failed', { defaultValue: 'Operation failed' })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextOrSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Check native HTML5 form validation (required fields)
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
  // ----------------------------------

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
    if (status === 'active') return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1 rounded-md text-[11px] font-bold tracking-widest uppercase">ACTIVE</span>;
    if (status === 'finished' || status === 'ended') return <span className="bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint px-3 py-1 rounded-md text-[11px] font-bold tracking-widest uppercase">FINISHED</span>;
    return <span className="bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink px-3 py-1 rounded-md text-[11px] font-bold tracking-widest uppercase">SCHEDULED</span>;
  };

  const inputStyles = "w-full px-4 py-3 bg-app dark:bg-surface-dark border border-default dark:border-subtle-dark rounded-xl text-sm outline-none focus:ring-2 focus:ring-ink transition-all text-primary dark:text-primary-dark";
  const labelStyles = "block text-xs font-semibold mb-2 text-primary-soft dark:text-faint uppercase tracking-wider";
  const formLimitType = formData.matchLimit === 0 ? 'all' : ([1,2,3,4,5].includes(formData.matchLimit) ? String(formData.matchLimit) : 'custom');

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark text-primary dark:text-primary-dark font-sans flex flex-col">

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

            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-faint hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1.5 rounded-lg">
              <Globe size={16} /> {i18n.language.toUpperCase()}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-muted-ink hover:text-ink dark:text-faint dark:hover:text-ink-dark rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-muted-ink hover:text-ink dark:text-faint dark:hover:text-ink-dark rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{String(t('logout', { defaultValue: 'Logout' }))}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto flex flex-col relative">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 shrink-0">
          <Link to="/dashboard" className="p-2 sm:p-2.5 bg-app dark:bg-elevated-dark border border-subtle dark:border-strong-dark rounded-xl hover:bg-muted dark:hover:bg-strong-dark/80 transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{String(t('session_schedule', { defaultValue: 'Session & Schedule' }))}</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
              <input type="text" placeholder={String(t('search_sessions', { defaultValue: 'Search session name...' }))} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-11 pr-4 py-3 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-medium"/>
            </div>
            <div className="relative w-full sm:w-64">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
              <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className={`w-full pl-11 pr-4 py-3 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-medium text-muted-ink dark:text-faint [&::-webkit-calendar-picker-indicator]:dark:invert`}/>
            </div>
          </div>
          <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm shrink-0">
            <Plus size={18} /> {String(t('create_session', { defaultValue: 'Create Session' }))}
          </button>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-ink p-8">{String(t('loading', { defaultValue: 'Loading...' }))}</div>
          ) : paginatedSessions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-ink p-8 flex-col gap-3">
              <CalendarDays size={48} className="text-muted-ink dark:text-primary-soft" />
              <span>{String(t('no_sessions', { defaultValue: 'No sessions found.' }))}</span>
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark sticky top-0 z-10">
                    <tr className="text-xs uppercase tracking-widest text-muted-ink font-bold">
                      <th className="p-5 w-1/3">Session Name</th>
                      <th className="p-5 w-1/4">Date & Time</th>
                      <th className="p-5 w-1/6">Status</th>
                      <th className="p-5 text-right w-1/4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                    {paginatedSessions.map((session) => (
                      <tr key={session.id} onClick={() => navigate(`/sessions/${session.id}`)} className="hover:bg-app dark:hover:bg-elevated-dark/30 transition-colors cursor-pointer group">
                        <td className="p-5 font-bold text-base dark:text-primary-dark group-hover:text-ink dark:group-hover:text-ink-dark transition-colors flex items-center gap-2">
                          {session.name}
                          {session.sessionType === 'sparring' && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">SPARRING</span>}
                        </td>
                        <td className="p-5 text-sm font-medium text-muted-ink dark:text-faint">
                          {new Date(session.date).toLocaleString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td className="p-5">{getStatusBadge(session.status || 'scheduled')}</td>
                        <td className="p-5">
                          <div className="flex items-center justify-end gap-3">
                            {(!session.status || session.status === 'scheduled') && (
                              <button onClick={(e) => { e.stopPropagation(); handleStartSession(session.id); }} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors">
                                <PlayCircle size={16} /> {String(t('start_session', { defaultValue: 'Start Session' }))}
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} className="p-1.5 text-faint hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden flex flex-col flex-1 divide-y divide-slate-100 dark:divide-[#1E293B] overflow-y-auto">
                {paginatedSessions.map((session) => (
                  <div key={session.id} onClick={() => navigate(`/sessions/${session.id}`)} className="p-4 flex flex-col gap-3 hover:bg-app dark:hover:bg-elevated-dark/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-base mb-1 flex items-center gap-2">
                          {session.name}
                          {session.sessionType === 'sparring' && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">SPARRING</span>}
                        </div>
                        <div className="text-xs font-medium text-muted-ink">
                          {new Date(session.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      {getStatusBadge(session.status || 'scheduled')}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-subtle dark:border-subtle-dark">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} className="p-2 text-faint hover:text-rose-600 bg-app dark:bg-elevated-dark rounded-lg transition-colors"><Trash2 size={16}/></button>
                      {(!session.status || session.status === 'scheduled') && (
                        <button onClick={(e) => { e.stopPropagation(); handleStartSession(session.id); }} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg transition-colors">
                          <PlayCircle size={16} /> {String(t('start_session', { defaultValue: 'Start Session' }))}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-auto p-4 border-t border-subtle dark:border-subtle-dark flex items-center justify-between bg-app dark:bg-app-dark shrink-0">
              <span className="text-xs text-muted-ink font-medium">{String(t('page_of', { defaultValue: 'Page {{current}} of {{total}}' })).replace('{{current}}', currentPage.toString()).replace('{{total}}', totalPages.toString())}</span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-subtle dark:border-subtle-dark rounded-lg bg-surface dark:bg-surface-dark disabled:opacity-50 hover:bg-muted dark:hover:bg-elevated-dark transition-colors"><ChevronLeft size={16}/></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-subtle dark:border-subtle-dark rounded-lg bg-surface dark:bg-surface-dark disabled:opacity-50 hover:bg-muted dark:hover:bg-elevated-dark transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Session Wizard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[94dvh] w-full max-w-2xl flex-col rounded-2xl border border-subtle bg-surface shadow-2xl dark:border-subtle-dark dark:bg-surface-dark relative">
            <div className="border-b border-subtle bg-surface px-5 py-5 dark:border-subtle-dark dark:bg-surface-dark sm:px-7 rounded-t-2xl shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-ink dark:text-muted-dark">{String(t('session_setup', { defaultValue: 'SESSION SETUP' }))}</p>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-primary dark:text-primary-dark">{String(t('create_session', { defaultValue: 'Create Session' }))}</h3>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} aria-label={String(t('cancel', { defaultValue: 'Cancel' }))} className="rounded-lg p-2 text-muted-ink transition-colors hover:bg-muted hover:text-ink dark:text-muted-dark dark:hover:bg-elevated-dark dark:hover:text-primary-dark"><X size={18} /></button>
              </div>

              <div className="mt-6 grid grid-cols-5 gap-2" aria-label={String(t('session_setup_progress', { defaultValue: 'Session Setup Progress' }))}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex min-w-0 flex-col gap-2">
                    <div className={'h-1 rounded-full ' + (step <= wizardStep ? 'bg-ink dark:bg-ink-dark' : 'bg-muted dark:bg-elevated-dark')} />
                    <span className={'truncate text-[10px] font-semibold ' + (step === wizardStep ? 'text-primary dark:text-primary-dark' : 'text-faint dark:text-muted-dark')}>{String(t(['session_setup_basics', 'session_setup_courts', 'session_setup_roster', 'session_setup_rules', 'session_setup_fees'][step - 1], { defaultValue: ['Basics', 'Courts', 'Roster', 'Rules', 'Fees'][step - 1] }))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 no-scrollbar">
              <form id="session-form" onSubmit={handleNextOrSubmit} className="space-y-6">
                
                {wizardStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-lg font-bold text-primary dark:text-primary-dark">{String(t('session_setup_basics', { defaultValue: 'Basics' }))}</h4>
                      <p className="mt-1 text-sm text-muted-ink dark:text-muted-dark">{String(t('session_setup_basics_desc', { defaultValue: 'Give the session a clear name and choose when it will take place.' }))}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, sessionType: 'regular'})} 
                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${formData.sessionType === 'regular' ? 'border-ink bg-app dark:border-ink-dark dark:bg-elevated-dark shadow-sm' : 'border-subtle bg-surface hover:bg-app dark:border-subtle-dark dark:bg-surface-dark dark:hover:bg-elevated-dark'}`}
                      >
                        <span className="block font-bold text-base text-primary dark:text-primary-dark">Regular Session</span>
                        <span className="block text-xs text-muted-ink dark:text-muted-dark mt-1">Internal community play</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, sessionType: 'sparring'})} 
                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${formData.sessionType === 'sparring' ? 'border-ink bg-app dark:border-ink-dark dark:bg-elevated-dark shadow-sm' : 'border-subtle bg-surface hover:bg-app dark:border-subtle-dark dark:bg-surface-dark dark:hover:bg-elevated-dark'}`}
                      >
                        <span className="block font-bold text-base text-primary dark:text-primary-dark">Sparring Match</span>
                        <span className="block text-xs text-muted-ink dark:text-muted-dark mt-1">Play against another club</span>
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
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-lg font-bold text-primary dark:text-primary-dark">{String(t('session_setup_courts', { defaultValue: 'Courts' }))}</h4>
                      <p className="mt-1 text-sm text-muted-ink dark:text-muted-dark">{String(t('session_setup_courts_desc', { defaultValue: 'How many courts will be used?' }))}</p>
                    </div>
                    <div>
                      <label className={labelStyles}>{String(t('court_count', { defaultValue: 'Court Count' }))}</label>
                      <input type="number" required min={1} max={20} value={formData.courtCount} onChange={e => setFormData({...formData, courtCount: parseInt(e.target.value) || 1})} className={inputStyles} />
                    </div>
                    <div className="rounded-xl border border-subtle bg-app p-4 dark:border-subtle-dark dark:bg-elevated-dark">
                      <div className="flex items-start gap-3">
                        <SlidersHorizontal size={18} className="mt-0.5 text-ink dark:text-ink-dark" />
                        <div>
                          <p className="text-sm font-semibold text-primary dark:text-primary-dark">{String(t('session_setup_courts_tip', { defaultValue: 'Court Setup Tip' }))}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-ink dark:text-muted-dark">{String(t('session_setup_courts_tip_desc', { defaultValue: 'You can adjust court names and active status later.' }))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-lg font-bold text-primary dark:text-primary-dark">{String(t('session_setup_roster', { defaultValue: 'Roster' }))}</h4>
                      <p className="mt-1 text-sm text-muted-ink dark:text-muted-dark">{String(t('session_setup_roster_desc', { defaultValue: 'Select initial members.' }))}</p>
                    </div>
                    <div className="rounded-xl border border-subtle dark:border-subtle-dark">
                      {wizardMembers.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-ink dark:text-muted-dark">{String(t('session_setup_no_members', { defaultValue: 'No members available.' }))}</div>
                      ) : (
                        <div className="max-h-64 divide-y divide-subtle overflow-y-auto dark:divide-subtle-dark">
                          {wizardMembers.map((member) => {
                            const selected = wizardMemberIds.includes(member.id);
                            return (
                              <label key={member.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted dark:hover:bg-elevated-dark">
                                <input type="checkbox" checked={selected} onChange={() => setWizardMemberIds(ids => selected ? ids.filter(id => id !== member.id) : [...ids, member.id])} className="h-4 w-4 accent-[var(--color-ink)]" />
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary dark:text-primary-dark">{member.name}</span>
                                {member.skillLevel && <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-primary-soft dark:bg-strong-dark dark:text-primary-dark">{member.skillLevel}</span>}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-ink dark:text-muted-dark">{String(t('session_setup_selected_members', { defaultValue: 'Selected: {{count}}' })).replace('{{count}}', wizardMemberIds.length.toString())}</p>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-lg font-bold text-primary dark:text-primary-dark">{String(t('session_setup_rules', { defaultValue: 'Rules' }))}</h4>
                      <p className="mt-1 text-sm text-muted-ink dark:text-muted-dark">{String(t('session_setup_rules_desc', { defaultValue: 'Configure matchmaking rules.' }))}</p>
                    </div>

                    {formData.sessionType === 'sparring' && (
                      <div className="p-4 border border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark rounded-xl mb-6 animate-in fade-in shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-primary dark:text-primary-dark font-bold">
                          <ShieldAlert size={18} className="text-ink dark:text-ink-dark" /> Match Quotas (Optional)
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className={labelStyles}>MD Count</label><input type="number" min={0} value={formData.matchQuotas.MD} onChange={e => setFormData({...formData, matchQuotas: {...formData.matchQuotas, MD: parseInt(e.target.value) || 0}})} className={inputStyles} /></div>
                          <div><label className={labelStyles}>WD Count</label><input type="number" min={0} value={formData.matchQuotas.WD} onChange={e => setFormData({...formData, matchQuotas: {...formData.matchQuotas, WD: parseInt(e.target.value) || 0}})} className={inputStyles} /></div>
                          <div><label className={labelStyles}>XD Count</label><input type="number" min={0} value={formData.matchQuotas.XD} onChange={e => setFormData({...formData, matchQuotas: {...formData.matchQuotas, XD: parseInt(e.target.value) || 0}})} className={inputStyles} /></div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={labelStyles}>{String(t('scoring_system', { defaultValue: 'Scoring System' }))}</label>
                      <select value={formData.scoringSystem} onChange={e => setFormData({...formData, scoringSystem: e.target.value})} className={inputStyles}>
                        <option value="BWF 21 Points x 3 Sets">{String(t('bwf_21', { defaultValue: 'BWF 21 Points' }))}</option>
                        <option value="BWF 15 Points x 3 Sets">{String(t('bwf_15', { defaultValue: 'BWF 15 Points' }))}</option>
                        <option value="42 Points x 1 Set">{String(t('pts_42', { defaultValue: '42 Points' }))}</option>
                        <option value="30 Points x 1 Set">{String(t('pts_30', { defaultValue: '30 Points' }))}</option>
                        <option value="custom">{String(t('custom', { defaultValue: 'Custom' }))}</option>
                      </select>
                    </div>
                    {formData.scoringSystem === 'custom' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelStyles}>{String(t('custom_sets', { defaultValue: 'Sets' }))}</label><input type="number" required min={1} max={5} value={formData.customSets} onChange={e => setFormData({...formData, customSets: parseInt(e.target.value) || 1})} className={inputStyles} /></div>
                        <div><label className={labelStyles}>{String(t('custom_points', { defaultValue: 'Points' }))}</label><input type="number" required min={1} max={100} value={formData.customPoints} onChange={e => setFormData({...formData, customPoints: parseInt(e.target.value) || 21})} className={inputStyles} /></div>
                      </div>
                    )}
                    <div>
                      <label className={labelStyles}>{String(t('pairing_rule', { defaultValue: 'Pairing Strictness' }))}</label>
                      <select value={formData.pairingRule} onChange={e => setFormData({...formData, pairingRule: e.target.value})} className={inputStyles}>
                        <option value="very_strict">{String(t('very_strict', { defaultValue: 'Very Strict' }))}</option>
                        <option value="strict">{String(t('strict', { defaultValue: 'Strict' }))}</option>
                        <option value="moderate">{String(t('moderate', { defaultValue: 'Moderate' }))}</option>
                        <option value="randomize">{String(t('randomize', { defaultValue: 'Randomize' }))}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyles}>{String(t('match_limit', { defaultValue: 'Match Limit' }))}</label>
                      <select value={formLimitType} onChange={e => { const val = e.target.value; if (val === 'all') setFormData({...formData, matchLimit: 0}); else if (val === 'custom') setFormData({...formData, matchLimit: 6}); else setFormData({...formData, matchLimit: parseInt(val)}); }} className={inputStyles}>
                        <option value="all">{String(t('all_games', { defaultValue: 'All Games' }))}</option>
                        <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="custom">{String(t('custom_amount', { defaultValue: 'Custom Amount' }))}</option>
                      </select>
                    </div>
                    {formLimitType === 'custom' && <input type="number" min={1} value={formData.matchLimit} onChange={e => setFormData({...formData, matchLimit: parseInt(e.target.value) || 0})} className={inputStyles} placeholder={String(t('match_limit_placeholder', { defaultValue: 'Enter limit' }))} />}
                  </div>
                )}

                {wizardStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-lg font-bold text-primary dark:text-primary-dark">{String(t('session_setup_fees', { defaultValue: 'Fees' }))}</h4>
                      <p className="mt-1 text-sm text-muted-ink dark:text-muted-dark">{String(t('session_setup_fees_desc', { defaultValue: 'Set default payment amounts.' }))}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div><label className={labelStyles}>{String(t('walk_in_fee', { defaultValue: 'Walk-in Fee' }))}</label><div className="relative"><Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" /><input type="number" min={0} value={formData.defaultFee} onChange={e => setFormData({...formData, defaultFee: parseInt(e.target.value) || 0})} className={inputStyles + ' pl-9'} placeholder="0" /></div></div>
                      <div><label className={labelStyles}>{String(t('member_fee', { defaultValue: 'Member Fee' }))}</label><div className="relative"><Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" /><input type="number" min={0} value={formData.memberDefaultFee} onChange={e => setFormData({...formData, memberDefaultFee: parseInt(e.target.value) || 0})} className={inputStyles + ' pl-9'} placeholder="0" /></div></div>
                    </div>
                    <div className="rounded-xl border border-subtle bg-app p-4 dark:border-subtle-dark dark:bg-elevated-dark">
                      <p className="text-sm font-semibold text-primary dark:text-primary-dark">{String(t('session_setup_summary', { defaultValue: 'Summary' }))}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm"><dt className="text-muted-ink dark:text-muted-dark">{String(t('session_name', { defaultValue: 'Name' }))}</dt><dd className="truncate text-right font-semibold text-primary dark:text-primary-dark">{formData.name || '—'}</dd><dt className="text-muted-ink dark:text-muted-dark">{String(t('court_count', { defaultValue: 'Courts' }))}</dt><dd className="text-right font-semibold text-primary dark:text-primary-dark">{formData.courtCount}</dd><dt className="text-muted-ink dark:text-muted-dark">{String(t('session_setup_roster', { defaultValue: 'Roster' }))}</dt><dd className="text-right font-semibold text-primary dark:text-primary-dark">{wizardMemberIds.length}</dd></dl>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* UNIFIED BUTTON HANDLER: No "type=submit" ghost click vulnerability */}
            <div className="flex items-center justify-between gap-3 border-t border-subtle bg-surface px-5 py-4 dark:border-subtle-dark dark:bg-surface-dark sm:px-7 rounded-b-2xl shrink-0">
              <button type="button" onClick={() => wizardStep === 1 ? setIsModalOpen(false) : setWizardStep(step => step - 1)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-ink transition-colors hover:bg-muted dark:text-muted-dark dark:hover:bg-elevated-dark">{wizardStep === 1 ? String(t('cancel', { defaultValue: 'Cancel' })) : String(t('back', { defaultValue: 'Back' }))}</button>
              <button 
                type="button" 
                onClick={() => handleNextOrSubmit()} 
                disabled={isProcessing} 
                className="rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-dark dark:text-white dark:hover:bg-primary-dark"
              >
                {isProcessing ? String(t('saving', { defaultValue: 'Saving...' })) : wizardStep < 5 ? String(t('next', { defaultValue: 'Next' })) : String(t('create_session', { defaultValue: 'Create' }))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}