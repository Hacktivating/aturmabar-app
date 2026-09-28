import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Zap, LogOut, Settings, X, ShieldAlert, User, Lock, Globe, Image as ImageIcon,
  Upload, Sun, Moon, Users, CalendarDays, Trophy, ChevronRight, AlertCircle,
  Calendar, Clock, Play, CheckCircle, Sparkles, Trash2, ChevronLeft
} from 'lucide-react';
import api from '../api/axios';
import { TourOverlay } from '../components/TourOverlay';

const PRESET_AVATARS = ['🏸', '🏆', '👟', '👕', '🔥', '🌟', '⚡', '💪'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role === 'admin') navigate('/admin', { replace: true });
      } catch (e) {}
    }
  }, [navigate]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<any>(null);
  const [communityData, setCommunityData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'general'>('profile');

  // --- TOUR STATE SYNC ---
  const [tourStep, setTourStep] = useState(() => parseInt(localStorage.getItem('app_tour_step') || '0', 10) || 0);
  
  const advanceTour = (step: number) => {
    setTourStep(step);
    localStorage.setItem('app_tour_step', step.toString());
    window.dispatchEvent(new Event('storage'));
  };

  const endTour = () => { advanceTour(0); setIsSettingsOpen(false); };

  useEffect(() => {
    const handleStorage = () => setTourStep(parseInt(localStorage.getItem('app_tour_step') || '0', 10) || 0);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  // ------------------------

  const [profileForm, setProfileForm] = useState({ communityName: '', logo: '' });
  const [accountForm, setAccountForm] = useState({ newEmail: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const [message, setMessage] = useState<{ type: 'success'|'error', text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success'|'error'}[]>([]);

  const addToast = (msg: string, type: 'success'|'error' = 'success') => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message: msg, type }]);
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

  const setLanguageDirectly = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const fetchData = async () => {
    try {
      const response = await api.get('/users/me');
      setUserData(response.data.user);
      setCommunityData(response.data.community);
      setRecentActivities(response.data.recentActivities || []);
      setProfileForm({ communityName: response.data.community.name, logo: response.data.community.logo });
      setAccountForm(prev => ({ ...prev, newEmail: response.data.user.email }));
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileForm({ ...profileForm, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage(null);
    try {
      await api.put('/users/profile', profileForm);
      setMessage({ type: 'success', text: t('save_changes') + ' Successful' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (accountForm.newEmail === userData.email) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await api.post('/users/request-email', { newEmail: accountForm.newEmail });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Email request failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.newPassword !== accountForm.confirmPassword) return setMessage({ type: 'error', text: 'Passwords do not match' });
    setIsProcessing(true);
    setMessage(null);
    try {
      await api.put('/users/password', { oldPassword: accountForm.oldPassword, newPassword: accountForm.newPassword });
      setMessage({ type: 'success', text: t('save_changes') + ' Successful' });
      setAccountForm({ ...accountForm, oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Password update failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- SANDBOX CLEANUP ---
  const handleDeleteSandbox = async () => {
    setIsProcessing(true);
    try {
      const mIds = JSON.parse(localStorage.getItem('tour_dummy_members') || '[]');
      const sId = localStorage.getItem('tour_dummy_session');
      
      if (sId) { try { await api.delete(`/sessions/${sId}`); } catch(e){} }
      for (const id of mIds) { try { await api.delete(`/members/${id}`); } catch(e){} }
      
      localStorage.removeItem('tour_dummy_members');
      localStorage.removeItem('tour_dummy_session');
      addToast('Sandbox data cleaned up successfully.', 'success');
      endTour();
      fetchData();
    } catch (err) {
      addToast('Error cleaning up data', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  const hasSandboxData = localStorage.getItem('tour_dummy_session') !== null || localStorage.getItem('tour_dummy_members') !== null;
  // ------------------------------------

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-widest"><Play size={12} fill="currentColor"/> {t('status_active', 'Active')}</span>;
      case 'finished': return <span className="flex items-center gap-1.5 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-widest"><CheckCircle size={12}/> {t('status_finished', 'Finished')}</span>;
      default: return <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-widest"><Clock size={12}/> {t('status_scheduled', 'Scheduled')}</span>;
    }
  };

  const totalPages = Math.ceil((recentActivities?.length || 0) / itemsPerPage);
  const paginatedActivities = recentActivities?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  if (loading) return <div className="min-h-screen bg-app dark:bg-zinc-950 flex items-center justify-center text-muted-ink">{t('loading')}</div>;

  const isExpired = communityData?.subscriptionStatus !== 'lifetime' && (!communityData?.subscriptionEndsAt || new Date(communityData.subscriptionEndsAt) < new Date());
  const isBlocked = communityData?.subscriptionStatus === 'inactive' || isExpired;

  const inputStyles = "w-full px-4 py-3 bg-app dark:bg-[#121214] border border-default dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ink transition-all text-primary dark:text-white";
  const labelStyles = "block text-xs font-semibold mb-1.5 text-muted-ink dark:text-zinc-400 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-zinc-100 font-sans transition-colors duration-200">
      
      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-[100001] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toastItem => (
          <div key={toastItem.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-5 fade-in duration-300 border ${toastItem.type === 'success' ? 'bg-ink border-ink text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
            {toastItem.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toastItem.message}
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toastItem.id))} className="ml-4 hover:opacity-75"><X size={16}/></button>
          </div>
        ))}
      </div>

      {/* --- TOUR OVERLAYS (Dashboard Steps) --- */}
      <TourOverlay step={1} currentStep={tourStep} targetId={null} title={String(t('tour_title', 'Interactive App Tour'))} content={String(t('tour_welcome', 'Welcome to AturMabar! We will guide you through the main workflow for managing your community.'))} onNext={() => advanceTour(2)} onCancel={endTour} />
      
      <TourOverlay step={2} currentStep={tourStep} targetId="tour-manage-members" title="1. Your Players" content="Let's start by adding players. Click 'Manage Members' to proceed." allowClick={true} hideNext={true} onCancel={endTour} />
      
      <TourOverlay step={9} currentStep={tourStep} targetId="tour-sessions" title="2. Matchmaking" content="Great! Your roster is set up. Now let's create a session. Click 'Schedule & Sessions' to continue." allowClick={true} hideNext={true} onCancel={endTour} />
      {/* --------------------------------------- */}

      <nav className="border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-[#0f0f11] px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
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
            <Globe size={16} />
            {i18n.language.toUpperCase()}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => { setIsSettingsOpen(true); setMessage(null); }} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors shrink-0">
            <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </nav>

      <main className="relative p-4 sm:p-8 max-w-6xl mx-auto min-h-[calc(100vh-80px)] z-10">
        {isBlocked && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-surface/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-xl p-4">
            <div className="bg-surface dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-subtle dark:border-zinc-800">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-primary dark:text-white">{t('sub_inactive')}</h2>
              <p className="text-sm sm:text-base text-muted-ink dark:text-zinc-400 mb-6">
                {t('sub_desc')}
              </p>
              <button onClick={handleLogout} className="w-full bg-ink dark:bg-white hover:bg-ink-soft dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold py-3 px-4 rounded-xl transition-colors shadow-sm">
                {t('return_login')}
              </button>
            </div>
          </div>
        )}

        <div className={`transition-opacity ${isBlocked ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-primary dark:text-white">
              {t('welcome')}, {communityData?.name}
            </h1>
            <p className="text-muted-ink dark:text-zinc-400 text-sm sm:text-base font-medium">
              Manage your players, sessions, and community settings all in one place.
            </p>
          </header>

          <div className="mb-10">
            <h2 className="text-xl font-bold mb-5 text-primary dark:text-white tracking-tight">{t('quick_actions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              <Link 
                id="tour-manage-members" 
                to="/members" 
                onClick={() => { if(tourStep === 2) advanceTour(3); }} 
                className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-ink dark:hover:border-zinc-600 transition-all group flex flex-col justify-between min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-300 group-hover:scale-110 transition-transform shadow-sm border border-slate-200 dark:border-white/10">
                  <Users size={22} />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="font-bold text-base text-primary dark:text-white">{t('manage_members')}</span>
                  <ChevronRight size={18} className="text-muted-ink dark:text-zinc-500 group-hover:text-ink dark:group-hover:text-white transition-colors" />
                </div>
              </Link>

              <Link 
                id="tour-sessions" 
                to="/sessions" 
                onClick={() => { if(tourStep === 9) advanceTour(10); }} 
                className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500/50 transition-all group flex flex-col justify-between min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                  <CalendarDays size={22} />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="font-bold text-base text-primary dark:text-white">{t('manage_schedule')}</span>
                  <ChevronRight size={18} className="text-muted-ink dark:text-zinc-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>

              <Link 
                to="/leaderboard" 
                className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-500 dark:hover:border-amber-500/50 transition-all group flex flex-col justify-between min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-sm border border-amber-100 dark:border-amber-500/20">
                  <Trophy size={22} />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="font-bold text-base text-primary dark:text-white">{t('leaderboard', 'Leaderboard')}</span>
                  <ChevronRight size={18} className="text-muted-ink dark:text-zinc-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-primary dark:text-white tracking-tight">{t('recent_activity')}</h2>
              <Link to="/sessions" className="text-sm font-bold text-ink dark:text-zinc-300 hover:text-ink-soft dark:hover:text-white hover:underline transition-colors">{t('view_all', 'View All')}</Link>
            </div>

            <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {recentActivities.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-muted dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 text-muted-ink dark:text-zinc-500">
                    <AlertCircle size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-primary dark:text-white mb-1">No Activity Yet</h3>
                  <p className="text-muted-ink dark:text-zinc-400 text-sm">Create a session to see it appear here.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {paginatedActivities.map((activity: any) => (
                      <div
                        key={activity.id}
                        onClick={() => navigate(`/sessions/${activity.id}`)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-app dark:hover:bg-white/5 cursor-pointer transition-colors group gap-4 sm:gap-0"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-12 h-12 rounded-xl bg-app dark:bg-zinc-900 border border-subtle dark:border-zinc-800 flex items-center justify-center text-muted-ink dark:text-zinc-400 shrink-0 shadow-sm group-hover:border-ink dark:group-hover:border-zinc-600 transition-colors">
                            <Calendar size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base truncate text-primary dark:text-zinc-100 group-hover:text-ink dark:group-hover:text-white transition-colors">
                              {activity.name}
                            </h3>
                            <div className="text-sm text-muted-ink dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                              <span>{new Date(activity.date).toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              <span className="text-faint dark:text-zinc-600">•</span>
                              <span>{new Date(activity.date).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-16 sm:pl-0">
                          {getStatusBadge(activity.status)}
                          <ChevronRight size={18} className="text-muted-ink dark:text-zinc-500 group-hover:text-ink dark:group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-subtle dark:border-zinc-800 bg-app dark:bg-zinc-900/30 flex items-center justify-between shrink-0">
                      <span className="text-xs font-bold text-muted-ink dark:text-zinc-400 uppercase tracking-widest">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          disabled={currentPage === 1} 
                          onClick={() => setCurrentPage(p => p - 1)} 
                          className="p-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          disabled={currentPage === totalPages} 
                          onClick={() => setCurrentPage(p => p + 1)} 
                          className="p-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center sm:p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-[#0f0f11] w-full h-[90dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-subtle dark:border-zinc-800">

            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-zinc-800 md:hidden shrink-0 bg-app dark:bg-[#121214]">
              <h3 className="font-bold text-lg text-primary dark:text-white">{t('settings')}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="md:w-64 bg-app dark:bg-[#121214] border-b md:border-b-0 md:border-r border-subtle dark:border-zinc-800 p-3 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 scrollbar-hide">
              <h3 className="font-black text-xl text-primary dark:text-white hidden md:block mb-6 px-2">{t('settings')}</h3>

              <button onClick={() => { setActiveTab('profile'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-surface dark:bg-zinc-800/50 shadow-sm border border-subtle dark:border-zinc-700/50 text-ink dark:text-white' : 'text-muted-ink dark:text-zinc-400 border border-transparent hover:bg-muted dark:hover:bg-zinc-800/30 hover:text-primary dark:hover:text-zinc-200'}`}>
                <User size={18} /> {t('profile')}
              </button>
              <button onClick={() => { setActiveTab('account'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'account' ? 'bg-surface dark:bg-zinc-800/50 shadow-sm border border-subtle dark:border-zinc-700/50 text-ink dark:text-white' : 'text-muted-ink dark:text-zinc-400 border border-transparent hover:bg-muted dark:hover:bg-zinc-800/30 hover:text-primary dark:hover:text-zinc-200'}`}>
                <Lock size={18} /> {t('account')}
              </button>
              <button onClick={() => { setActiveTab('general'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-surface dark:bg-zinc-800/50 shadow-sm border border-subtle dark:border-zinc-700/50 text-ink dark:text-white' : 'text-muted-ink dark:text-zinc-400 border border-transparent hover:bg-muted dark:hover:bg-zinc-800/30 hover:text-primary dark:hover:text-zinc-200'}`}>
                <Globe size={18} /> {t('general')}
              </button>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden bg-surface dark:bg-[#0f0f11]">
              <button onClick={() => setIsSettingsOpen(false)} className="hidden md:flex absolute top-5 right-5 p-2 text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 rounded-full transition-colors z-10 items-center justify-center">
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                {message && (
                  <div className={`mb-8 p-4 rounded-xl text-sm font-bold border flex items-center gap-3 animate-in fade-in ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                    {message.text}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black mb-1 text-primary dark:text-white">{t('profile')}</h2>
                      <p className="text-sm text-muted-ink dark:text-zinc-400">{t('public_id_desc')}</p>
                    </div>

                    <div className="max-w-md">
                      <label className={labelStyles}>{t('community_name')}</label>
                      <input type="text" required value={profileForm.communityName} onChange={e => setProfileForm({...profileForm, communityName: e.target.value})} className={inputStyles} />
                    </div>

                    <div>
                      <label className={labelStyles}>{t('change_logo')}</label>
                      <div className="flex flex-col sm:flex-row items-start gap-6 mt-3">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-app dark:bg-[#121214] border border-subtle dark:border-zinc-800 flex items-center justify-center text-5xl shrink-0 overflow-hidden shadow-sm">
                          {profileForm.logo?.startsWith('data:image') ? <img src={profileForm.logo} alt="logo" className="w-full h-full object-cover"/> : profileForm.logo || <ImageIcon size={36} className="text-muted-ink dark:text-zinc-600"/>}
                        </div>

                        <div className="flex-1 w-full max-w-sm">
                          <div className="flex flex-wrap gap-2 mb-5">
                            {PRESET_AVATARS.map((emoji) => (
                              <button
                                key={emoji} type="button" onClick={() => setProfileForm({ ...profileForm, logo: emoji })}
                                className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-2xl bg-app hover:bg-muted dark:bg-[#121214] dark:hover:bg-zinc-800 rounded-xl transition-all border shadow-sm ${profileForm.logo === emoji ? 'border-ink bg-accent-soft dark:bg-zinc-800 dark:border-zinc-600 scale-105' : 'border-subtle dark:border-zinc-800 hover:border-default dark:hover:border-zinc-700'}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-px bg-subtle dark:bg-zinc-800 flex-1"></div>
                            <span className="text-[10px] sm:text-xs text-muted-ink dark:text-zinc-500 font-bold uppercase tracking-widest">OR</span>
                            <div className="h-px bg-subtle dark:bg-zinc-800 flex-1"></div>
                          </div>

                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-app dark:bg-[#121214] hover:bg-muted dark:hover:bg-zinc-800 text-sm font-bold rounded-xl transition-colors border border-subtle dark:border-zinc-800 text-primary dark:text-zinc-300 shadow-sm">
                            <Upload size={18} /> {t('upload_image')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-ink dark:bg-white hover:bg-ink-soft dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50">
                        {isProcessing ? t('saving') : t('save_changes')}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-8 animate-in fade-in duration-300 max-w-md">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black mb-1 text-primary dark:text-white">{t('account')}</h2>
                      <p className="text-sm text-muted-ink dark:text-zinc-400">{t('account_desc')}</p>
                    </div>

                    <div className="space-y-5 pb-8 border-b border-subtle dark:border-zinc-800">
                      <div>
                        <label className={labelStyles}>{t('username_cant_change')}</label>
                        <input type="text" disabled value={userData?.username} className={`${inputStyles} opacity-50 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className={labelStyles}>{t('new_email')}</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="email" value={accountForm.newEmail} onChange={e => setAccountForm({...accountForm, newEmail: e.target.value})} className={inputStyles} />
                          <button type="button" onClick={handleRequestEmailChange} disabled={isProcessing || accountForm.newEmail === userData?.email} className="w-full sm:w-auto shrink-0 bg-ink dark:bg-white hover:bg-ink-soft dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold py-3 px-5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                            {t('send_verification')}
                          </button>
                        </div>
                        <p className="text-xs text-muted-ink dark:text-zinc-500 mt-2 font-medium">{t('email_unbind_warning')}</p>
                        {userData?.pendingEmail && <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-bold flex items-center gap-1.5"><Clock size={14}/> Pending: {userData.pendingEmail}</p>}
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-5 pt-2">
                      <h3 className="text-base font-bold text-primary dark:text-white">{t('update_password')}</h3>
                      <div>
                        <label className={labelStyles}>{t('old_password')}</label>
                        <input type="password" required value={accountForm.oldPassword} onChange={e => setAccountForm({...accountForm, oldPassword: e.target.value})} className={inputStyles} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className={labelStyles}>{t('new_password')}</label>
                          <input type="password" required minLength={6} value={accountForm.newPassword} onChange={e => setAccountForm({...accountForm, newPassword: e.target.value})} className={inputStyles} placeholder={t('leave_blank_pass')} />
                        </div>
                        <div>
                          <label className={labelStyles}>{t('confirm_password')}</label>
                          <input type="password" required minLength={6} value={accountForm.confirmPassword} onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})} className={inputStyles} />
                        </div>
                      </div>
                      <div className="pt-4">
                        <button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-ink dark:bg-white hover:bg-ink-soft dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50">
                          {isProcessing ? t('updating') : t('update_password')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in duration-300 max-w-lg">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black mb-1 text-primary dark:text-white">{t('general')}</h2>
                      <p className="text-sm text-muted-ink dark:text-zinc-400">{t('app_pref_desc')}</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className={labelStyles}>{t('language')}</label>
                        <select value={i18n.language} onChange={(e) => setLanguageDirectly(e.target.value)} className={`${inputStyles} font-bold`}>
                          <option value="en">🇺🇸 English</option>
                          <option value="id">🇮🇩 Bahasa Indonesia</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelStyles}>{t('appearance')}</label>
                        <div className="flex gap-3">
                          <button onClick={() => setIsDark(false)} className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-bold transition-all shadow-sm ${!isDark ? 'bg-ink border-ink text-white dark:bg-white dark:border-white dark:text-zinc-900' : 'bg-app border-subtle text-primary hover:bg-muted dark:bg-[#121214] dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
                            <Sun size={18}/> {t('light_mode')}
                          </button>
                          <button onClick={() => setIsDark(true)} className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-bold transition-all shadow-sm ${isDark ? 'bg-ink border-ink text-white dark:bg-white dark:border-white dark:text-zinc-900' : 'bg-app border-subtle text-primary hover:bg-muted dark:bg-[#121214] dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
                            <Moon size={18}/> {t('dark_mode')}
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-subtle dark:border-zinc-800 mt-8">
                        <label className={labelStyles}>Interactive Guide & Sandbox</label>
                        <div className="flex flex-col gap-4 mt-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] shadow-sm">
                            <div>
                              <p className="text-base font-bold text-primary dark:text-white">{t('tour_walkthrough_title', 'Start App Walkthrough')}</p>
                              <p className="text-sm text-muted-ink dark:text-zinc-400 mt-1 font-medium">{t('tour_walkthrough_desc', 'Take a guided tour to learn how to manage your community.')}</p>
                            </div>
                            <button 
                              onClick={() => { setIsSettingsOpen(false); advanceTour(1); }}
                              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-ink dark:bg-zinc-800 hover:bg-ink-soft dark:hover:bg-zinc-700 text-white dark:text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                              <Sparkles size={18} /> {t('start_tour', 'Start Tour')}
                            </button>
                          </div>
                          
                          {hasSandboxData && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 shadow-sm">
                              <div>
                                <p className="text-base font-bold text-rose-700 dark:text-rose-400">Sandbox Data Exists</p>
                                <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">Delete the temporary players and session generated by the tour.</p>
                              </div>
                              <button 
                                disabled={isProcessing}
                                onClick={handleDeleteSandbox}
                                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-white dark:bg-rose-900/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 px-5 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
                              >
                                {isProcessing ? 'Deleting...' : <><Trash2 size={18} /> Clean Up Data</>}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}