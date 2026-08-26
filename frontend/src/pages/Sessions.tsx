import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search, Calendar, Trash2, ChevronLeft, ChevronRight, Zap, Globe, Sun, Moon, Settings, LogOut, ArrowLeft, ArrowRight, PlayCircle, CalendarDays } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

interface Session {
  id: number;
  name: string;
  date: string;
  scoringSystem: string;
  pairingRule: string;
  status: string;
  createdAt: string;
}

export default function Sessions() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [communityData, setCommunityData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', 
    date: '', 
    courtCount: 3, 
    scoringSystem: 'BWF 21 Points x 3 Sets', 
    customSets: 3, 
    customPoints: 21, 
    pairingRule: 'strict'
  });

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

  // Filter & Paginate
  const processedSessions = sessions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter ? s.date.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(processedSessions.length / itemsPerPage);
  const paginatedSessions = processedSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openCreateModal = () => {
    // Generate a default future date string (e.g., tomorrow at 18:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    // Format to YYYY-MM-DDThh:mm for datetime-local input
    const localDateTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData({ ...formData, date: localDateTime, name: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload = {
        ...formData,
        customSets: formData.scoringSystem === 'custom' ? formData.customSets : null,
        customPoints: formData.scoringSystem === 'custom' ? formData.customPoints : null,
      };
      await api.post('/sessions', payload);
      setIsModalOpen(false);
      fetchInitializationData();
    } catch (err: any) { 
      alert(err.response?.data?.error || t('op_failed')); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('delete_confirm') || "Delete this session?")) return;
    try { 
      await api.delete(`/sessions/${id}`); 
      fetchInitializationData();
    } catch (err) { alert(t('delete_failed')); }
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
    switch(status) {
      case 'active': return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase">{t('status_active')}</span>;
      case 'ended': return <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase">{t('status_ended')}</span>;
      default: return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase">{t('status_scheduled')}</span>;
    }
  };

  // Restrict past dates in the datetime-local input
  const currentLocalDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const inputStyles = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelStyles = "block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      
      {/* Top Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center text-white shrink-0">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-slate-200 dark:border-slate-800 max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-semibold truncate hidden sm:block">{communityData?.name}</span>
            </div>

            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Globe size={16} />
              {i18n.language.toUpperCase()}
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto flex flex-col relative">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 shrink-0">
          <Link to="/dashboard" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('session_mgmt')}</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder={t('search_sessions')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
            </div>
            <div className="relative w-full sm:w-64">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm [&::-webkit-calendar-picker-indicator]:dark:invert`}/>
            </div>
          </div>
          <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0">
            <Plus size={16} /> {t('create_session')}
          </button>
        </div>

        {/* Data Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8">{t('loading')}</div>
          ) : paginatedSessions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8 flex-col gap-3">
              <CalendarDays size={48} className="text-slate-300 dark:text-slate-700" />
              <span>{t('no_sessions')}</span>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      <th className="p-4">{t('session_name')}</th>
                      <th className="p-4">{t('date_time')}</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {paginatedSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-medium text-sm">{session.name}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(session.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3">
                            {session.status === 'scheduled' ? (
                              <button onClick={() => handleStartSession(session.id)} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors">
                                <PlayCircle size={16} /> {t('start_session')}
                              </button>
                            ) : (
                              <Link to={`/sessions/${session.id}`} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                                {t('manage_session')} <ArrowRight size={16} />
                              </Link>
                            )}
                            <button onClick={() => handleDelete(session.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col flex-1 divide-y divide-slate-100 dark:divide-slate-800/50 overflow-y-auto">
                {paginatedSessions.map((session) => (
                  <div key={session.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm mb-1">{session.name}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(session.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => handleDelete(session.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                        <Trash2 size={16}/>
                      </button>
                      
                      {session.status === 'scheduled' ? (
                        <button onClick={() => handleStartSession(session.id)} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg transition-colors">
                          <PlayCircle size={16} /> {t('start_session')}
                        </button>
                      ) : (
                        <Link to={`/sessions/${session.id}`} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">
                          {t('manage_session')} <ArrowRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination UI */}
          {!loading && totalPages > 1 && (
            <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {t('page_of').replace('{{current}}', currentPage.toString()).replace('{{total}}', totalPages.toString())}
              </span>
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft size={16}/></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">{t('create_session')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="session-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className={labelStyles}>{t('session_name')}</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Sunday Morning Sparring" className={inputStyles} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>{t('date_time')}</label>
                    <input 
                      type="datetime-local" 
                      required 
                      min={currentLocalDateTime} 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      className={`${inputStyles} [&::-webkit-calendar-picker-indicator]:dark:invert`} 
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>{t('court_count')}</label>
                    <input type="number" required min={1} max={20} value={formData.courtCount} onChange={e => setFormData({...formData, courtCount: parseInt(e.target.value) || 1})} className={inputStyles} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className={labelStyles}>{t('scoring_system')}</label>
                  <div className="relative">
                    <select value={formData.scoringSystem} onChange={e => setFormData({...formData, scoringSystem: e.target.value})} className={`${inputStyles} appearance-none pr-8 font-medium`}>
                      <option value="BWF 21 Points x 3 Sets">{t('bwf_21')}</option>
                      <option value="BWF 15 Points x 3 Sets">{t('bwf_15')}</option>
                      <option value="42 Points x 1 Set">{t('pts_42')}</option>
                      <option value="30 Points x 1 Set">{t('pts_30')}</option>
                      <option value="custom">{t('custom')}</option>
                    </select>
                  </div>
                </div>

                {formData.scoringSystem === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className={labelStyles}>{t('custom_sets')}</label>
                      <input type="number" required min={1} max={5} value={formData.customSets} onChange={e => setFormData({...formData, customSets: parseInt(e.target.value) || 1})} className={inputStyles} />
                    </div>
                    <div>
                      <label className={labelStyles}>{t('custom_points')}</label>
                      <input type="number" required min={1} max={100} value={formData.customPoints} onChange={e => setFormData({...formData, customPoints: parseInt(e.target.value) || 21})} className={inputStyles} />
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelStyles}>{t('pairing_rule')}</label>
                  <div className="relative">
                    <select value={formData.pairingRule} onChange={e => setFormData({...formData, pairingRule: e.target.value})} className={`${inputStyles} appearance-none pr-8 font-medium`}>
                      <option value="very_strict">{t('very_strict')}</option>
                      <option value="strict">{t('strict')}</option>
                      <option value="moderate">{t('moderate')}</option>
                      <option value="randomize">{t('randomize')}</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">{t('cancel')}</button>
              <button type="submit" form="session-form" disabled={isProcessing} className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50">{t('create_session')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}