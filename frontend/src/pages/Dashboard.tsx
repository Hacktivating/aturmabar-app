import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Zap, LogOut, Settings, X, ShieldAlert, User, Lock, Globe, Image as ImageIcon,
  Upload, Sun, Moon, Users, CalendarDays, Trophy, ChevronRight, AlertCircle,
  Calendar, Clock, Play, CheckCircle
} from 'lucide-react';
import api from '../api/axios';

const PRESET_AVATARS = ['🏸', '🏆', '👟', '👕', '🔥', '🌟', '⚡', '💪'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Admin access interception
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role === 'admin') {
          navigate('/admin', { replace: true });
        }
      } catch (e) {}
    }
  }, [navigate]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<any>(null);
  const [communityData, setCommunityData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'general'>('profile');

  const [profileForm, setProfileForm] = useState({ communityName: '', logo: '' });
  const [accountForm, setAccountForm] = useState({ newEmail: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const [message, setMessage] = useState<{ type: 'success'|'error', text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      // DESTROY the token to break the infinite loop
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider"><Play size={10} fill="currentColor"/> {t('status_active', 'Active')}</span>;
      case 'finished': return <span className="flex items-center gap-1 bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint px-2 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider"><CheckCircle size={10}/> {t('status_finished', 'Finished')}</span>;
      default: return <span className="flex items-center gap-1 bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark px-2 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider"><Clock size={10}/> {t('status_scheduled', 'Scheduled')}</span>;
    }
  };

  if (loading) return <div className="min-h-screen bg-app dark:bg-surface-dark flex items-center justify-center text-muted-ink">{t('loading')}</div>;

  const isExpired = communityData?.subscriptionStatus !== 'lifetime' && (!communityData?.subscriptionEndsAt || new Date(communityData.subscriptionEndsAt) < new Date());
  const isBlocked = communityData?.subscriptionStatus === 'inactive' || isExpired;

  const inputStyles = "w-full px-3 py-2.5 bg-app dark:bg-app-dark border border-default dark:border-subtle-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-ink transition-all";
  const labelStyles = "block text-xs font-semibold mb-1 text-muted-ink uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark text-primary dark:text-primary-dark transition-colors duration-200">

      <nav className="border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-20">
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

          <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-faint hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1.5 rounded-lg hover:bg-muted dark:hover:bg-elevated-dark">
            <Globe size={16} />
            {i18n.language.toUpperCase()}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-muted-ink dark:text-faint hover:text-ink dark:hover:text-ink-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => { setIsSettingsOpen(true); setMessage(null); }} className="p-1.5 text-muted-ink hover:text-ink dark:text-faint dark:hover:text-ink-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors shrink-0">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </nav>

      <main className="relative p-4 sm:p-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        {isBlocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/80 dark:bg-app-dark/80 backdrop-blur-sm rounded-xl p-4">
            <div className="bg-surface dark:bg-surface-dark p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-subtle dark:border-subtle-dark">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('sub_inactive')}</h2>
              <p className="text-sm sm:text-base text-muted-ink dark:text-faint mb-6">
                {t('sub_desc')}
              </p>
              <button onClick={handleLogout} className="w-full bg-ink hover:bg-ink-soft text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                {t('return_login')}
              </button>
            </div>
          </div>
        )}

        <div className={`transition-opacity ${isBlocked ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{t('welcome')}, {communityData?.name}</h1>
          </header>

          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">{t('quick_actions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/members" className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-ink dark:hover:border-ink-dark transition-all group flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm">{t('manage_members')}</span>
                  <ChevronRight size={18} className="text-faint group-hover:text-ink transition-colors" />
                </div>
              </Link>

              <Link to="/sessions" className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <CalendarDays size={24} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm">{t('manage_schedule')}</span>
                  <ChevronRight size={18} className="text-faint group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>

              <Link to="/leaderboard" className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all group flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Trophy size={24} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm">{t('leaderboard', 'Leaderboard')}</span>
                  <ChevronRight size={18} className="text-faint group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('recent_activity')}</h2>
              <Link to="/sessions" className="text-sm font-medium text-ink dark:text-ink-dark hover:underline">{t('view_all', 'View All')}</Link>
            </div>

            <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm overflow-hidden">
              {recentActivities.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto text-muted-ink dark:text-muted-ink mb-3" size={32} />
                  <p className="text-muted-ink dark:text-faint text-sm">{t('no_activity', 'No recent activities found.')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {recentActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      onClick={() => navigate(`/sessions/${activity.id}`)}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-app dark:hover:bg-elevated-dark/30 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted dark:bg-elevated-dark border border-subtle dark:border-strong-dark flex items-center justify-center text-muted-ink shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base group-hover:text-ink dark:group-hover:text-ink-dark transition-colors">{activity.name}</h3>
                          <div className="text-xs sm:text-sm text-muted-ink mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2">
                            <span>{new Date(activity.date).toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{new Date(activity.date).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {getStatusBadge(activity.status)}
                        <ChevronRight size={18} className="text-muted-ink dark:text-muted-ink group-hover:text-ink transition-colors hidden sm:block" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-ink/60 backdrop-blur-sm">
          <div className="bg-surface dark:bg-surface-dark w-full h-[90dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-subtle dark:border-subtle-dark">

            <div className="flex justify-between items-center p-4 border-b border-subtle dark:border-subtle-dark md:hidden shrink-0 bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">{t('settings')}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-muted dark:hover:bg-elevated-dark rounded-full"><X size={20} /></button>
            </div>

            <div className="md:w-64 bg-app dark:bg-app-dark border-b md:border-b-0 md:border-r border-subtle dark:border-subtle-dark p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 scrollbar-hide">
              <h3 className="font-bold text-lg hidden md:block mb-4 px-2">{t('settings')}</h3>

              <button onClick={() => { setActiveTab('profile'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-surface dark:bg-elevated-dark shadow-sm text-ink dark:text-ink-dark' : 'text-muted-ink dark:text-faint hover:bg-muted dark:hover:bg-surface-dark'}`}>
                <User size={18} /> {t('profile')}
              </button>
              <button onClick={() => { setActiveTab('account'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'account' ? 'bg-surface dark:bg-elevated-dark shadow-sm text-ink dark:text-ink-dark' : 'text-muted-ink dark:text-faint hover:bg-muted dark:hover:bg-surface-dark'}`}>
                <Lock size={18} /> {t('account')}
              </button>
              <button onClick={() => { setActiveTab('general'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-surface dark:bg-elevated-dark shadow-sm text-ink dark:text-ink-dark' : 'text-muted-ink dark:text-faint hover:bg-muted dark:hover:bg-surface-dark'}`}>
                <Globe size={18} /> {t('general')}
              </button>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
              <button onClick={() => setIsSettingsOpen(false)} className="hidden md:block absolute top-4 right-4 p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors z-10">
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                {message && (
                  <div className={`mb-6 p-3 sm:p-4 rounded-lg text-sm font-medium border ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:border-rose-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900/50'}`}>
                    {message.text}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold mb-1">{t('profile')}</h2>
                      <p className="text-xs sm:text-sm text-muted-ink">{t('public_id_desc')}</p>
                    </div>

                    <div>
                      <label className={labelStyles}>{t('community_name')}</label>
                      <input type="text" required value={profileForm.communityName} onChange={e => setProfileForm({...profileForm, communityName: e.target.value})} className={inputStyles} />
                    </div>

                    <div>
                      <label className={labelStyles}>{t('change_logo')}</label>
                      <div className="flex flex-col xl:flex-row items-center gap-4 sm:gap-6 mt-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted dark:bg-elevated-dark border-2 border-dashed border-default dark:border-strong-dark flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                          {profileForm.logo?.startsWith('data:image') ? <img src={profileForm.logo} alt="logo" className="w-full h-full object-cover"/> : profileForm.logo || <ImageIcon size={32} className="text-faint"/>}
                        </div>

                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                            {PRESET_AVATARS.map((emoji) => (
                              <button
                                key={emoji} type="button" onClick={() => setProfileForm({ ...profileForm, logo: emoji })}
                                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl bg-app hover:bg-muted dark:bg-app-dark dark:hover:bg-elevated-dark rounded-lg transition-all border ${profileForm.logo === emoji ? 'border-ink bg-accent-soft dark:bg-accent-soft-dark shadow-sm' : 'border-transparent hover:border-subtle dark:hover:dark:border-strong-dark'}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-px bg-muted dark:bg-elevated-dark flex-1"></div>
                            <span className="text-[10px] sm:text-xs text-faint font-medium uppercase tracking-wider">OR</span>
                            <div className="h-px bg-muted dark:bg-elevated-dark flex-1"></div>
                          </div>

                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-muted dark:bg-app-dark hover:bg-muted dark:hover:bg-elevated-dark text-sm font-medium rounded-lg transition-colors border border-subtle dark:border-default-dark text-primary-soft dark:text-muted-dark">
                            <Upload size={16} /> {t('upload_image')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-ink hover:bg-ink-soft text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
                      {isProcessing ? t('saving') : t('save_changes')}
                    </button>
                  </form>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold mb-1">{t('account')}</h2>
                      <p className="text-xs sm:text-sm text-muted-ink">{t('account_desc')}</p>
                    </div>

                    <div className="space-y-4 pb-6 border-b border-subtle dark:border-subtle-dark">
                      <div>
                        <label className={labelStyles}>{t('username_cant_change')}</label>
                        <input type="text" disabled value={userData?.username} className={`${inputStyles} opacity-50 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className={labelStyles}>{t('new_email')}</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="email" value={accountForm.newEmail} onChange={e => setAccountForm({...accountForm, newEmail: e.target.value})} className={inputStyles} />
                          <button type="button" onClick={handleRequestEmailChange} disabled={isProcessing || accountForm.newEmail === userData?.email} className="w-full sm:w-auto shrink-0 bg-ink hover:bg-elevated dark:bg-muted dark:hover:bg-surface text-white dark:text-primary font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
                            {t('send_verification')}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-ink mt-1">{t('email_unbind_warning')}</p>
                        {userData?.pendingEmail && <p className="text-xs text-ink mt-2 font-medium">Link sent to: {userData.pendingEmail}</p>}
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <h3 className="text-sm font-bold">{t('update_password')}</h3>
                      <div>
                        <label className={labelStyles}>{t('old_password')}</label>
                        <input type="password" required value={accountForm.oldPassword} onChange={e => setAccountForm({...accountForm, oldPassword: e.target.value})} className={inputStyles} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelStyles}>{t('new_password')}</label>
                          <input type="password" required minLength={6} value={accountForm.newPassword} onChange={e => setAccountForm({...accountForm, newPassword: e.target.value})} className={inputStyles} placeholder={t('leave_blank_pass')} />
                        </div>
                        <div>
                          <label className={labelStyles}>{t('confirm_password')}</label>
                          <input type="password" required minLength={6} value={accountForm.confirmPassword} onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})} className={inputStyles} />
                        </div>
                      </div>
                      <button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-ink hover:bg-ink-soft text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
                        {isProcessing ? t('updating') : t('update_password')}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'general' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold mb-1">{t('general')}</h2>
                      <p className="text-xs sm:text-sm text-muted-ink">{t('app_pref_desc')}</p>
                    </div>

                    <div className="space-y-4 max-w-sm">
                      <div>
                        <label className={labelStyles}>{t('language')}</label>
                        <select value={i18n.language} onChange={(e) => setLanguageDirectly(e.target.value)} className={inputStyles}>
                          <option value="en">English</option>
                          <option value="id">Bahasa Indonesia</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelStyles}>{t('appearance')}</label>
                        <div className="flex gap-2">
                          <button onClick={() => setIsDark(false)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium transition-all ${!isDark ? 'bg-accent-soft border-accent text-ink dark:bg-elevated-dark dark:border-strong-dark' : 'bg-transparent border-subtle dark:border-subtle-dark text-muted-ink dark:text-faint'}`}>
                            <Sun size={16}/> {t('light_mode')}
                          </button>
                          <button onClick={() => setIsDark(true)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-accent-soft border-accent text-ink dark:bg-elevated-dark dark:border-strong-dark dark:text-ink-dark' : 'bg-transparent border-subtle dark:border-subtle-dark text-muted-ink dark:text-faint'}`}>
                            <Moon size={16}/> {t('dark_mode')}
                          </button>
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