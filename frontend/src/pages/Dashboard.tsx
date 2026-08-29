import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Zap, LogOut, Settings, X, ShieldAlert, User, Lock, Globe, Image as ImageIcon, 
  Upload, Sun, Moon, Users, CalendarDays, Trophy, ChevronRight, AlertCircle 
} from 'lucide-react';
import api from '../api/axios';

const PRESET_AVATARS = ['🏸', '🏆', '👟', '👕', '🔥', '🌟', '⚡', '💪'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userData, setUserData] = useState<any>(null);
  const [communityData, setCommunityData] = useState<any>(null);
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
      setProfileForm({ communityName: response.data.community.name, logo: response.data.community.logo });
      setAccountForm(prev => ({ ...prev, newEmail: response.data.user.email }));
    } catch (error) {
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

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center text-slate-500">{t('loading')}</div>;

  const isExpired = communityData?.subscriptionStatus !== 'lifetime' && (!communityData?.subscriptionEndsAt || new Date(communityData.subscriptionEndsAt) < new Date());
  const isBlocked = communityData?.subscriptionStatus === 'inactive' || isExpired;
  
  const inputStyles = "w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B1120] border border-slate-300 dark:border-[#1E293B] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelStyles = "block text-xs font-semibold mb-1 text-slate-500 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navigation */}
      <nav className="border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-20">
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

          {/* Quick Toggles */}
          <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B]">
            <Globe size={16} />
            {i18n.language.toUpperCase()}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-lg transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => { setIsSettingsOpen(true); setMessage(null); }} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-lg transition-colors shrink-0">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
            <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </nav>

      <main className="relative p-4 sm:p-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        {isBlocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm rounded-xl p-4">
            <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-200 dark:border-[#1E293B]">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('sub_inactive')}</h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
                {t('sub_desc')}
              </p>
              <button onClick={handleLogout} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                {t('return_login')}
              </button>
            </div>
          </div>
        )}

        <div className={`transition-opacity ${isBlocked ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{t('welcome')}, {communityData?.name}</h1>
          </header>

          {/* Quick Actions Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">{t('quick_actions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/members" className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm">{t('manage_members')}</span>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
              
              <Link to="/sessions" className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <CalendarDays size={24} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm">{t('manage_schedule')}</span>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>

              <Link to="/leaderboard" className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all group flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Trophy size={24} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-sm">{t('leaderboard', 'Leaderboard')}</span>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('recent_activity')}</h2>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">{t('view_all')}</button>
            </div>
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-8 text-center shadow-sm">
              <AlertCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('no_activity')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] w-full h-[90dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-[#1E293B]">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-[#1E293B] md:hidden shrink-0 bg-slate-50 dark:bg-[#0B1120]">
              <h3 className="font-bold text-lg">{t('settings')}</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-[#1E293B] rounded-full"><X size={20} /></button>
            </div>

            <div className="md:w-64 bg-slate-50 dark:bg-[#0B1120] border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#1E293B] p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 scrollbar-hide">
              <h3 className="font-bold text-lg hidden md:block mb-4 px-2">{t('settings')}</h3>
              
              <button onClick={() => { setActiveTab('profile'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0F172A]'}`}>
                <User size={18} /> {t('profile')}
              </button>
              <button onClick={() => { setActiveTab('account'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'account' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0F172A]'}`}>
                <Lock size={18} /> {t('account')}
              </button>
              <button onClick={() => { setActiveTab('general'); setMessage(null); }} className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0F172A]'}`}>
                <Globe size={18} /> {t('general')}
              </button>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
              <button onClick={() => setIsSettingsOpen(false)} className="hidden md:block absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-full transition-colors z-10">
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
                      <p className="text-xs sm:text-sm text-slate-500">{t('public_id_desc')}</p>
                    </div>

                    <div>
                      <label className={labelStyles}>{t('community_name')}</label>
                      <input type="text" required value={profileForm.communityName} onChange={e => setProfileForm({...profileForm, communityName: e.target.value})} className={inputStyles} />
                    </div>

                    <div>
                      <label className={labelStyles}>{t('change_logo')}</label>
                      <div className="flex flex-col xl:flex-row items-center gap-4 sm:gap-6 mt-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 dark:bg-[#1E293B] border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                          {profileForm.logo?.startsWith('data:image') ? <img src={profileForm.logo} alt="logo" className="w-full h-full object-cover"/> : profileForm.logo || <ImageIcon size={32} className="text-slate-400"/>}
                        </div>
                        
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                            {PRESET_AVATARS.map((emoji) => (
                              <button 
                                key={emoji} type="button" onClick={() => setProfileForm({ ...profileForm, logo: emoji })}
                                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1120] dark:hover:bg-[#1E293B] rounded-lg transition-all border ${profileForm.logo === emoji ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600'}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">OR</span>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                          </div>

                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-[#0B1120] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-sm font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            <Upload size={16} /> {t('upload_image')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
                      {isProcessing ? t('saving') : t('save_changes')}
                    </button>
                  </form>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold mb-1">{t('account')}</h2>
                      <p className="text-xs sm:text-sm text-slate-500">{t('account_desc')}</p>
                    </div>

                    <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-[#1E293B]">
                      <div>
                        <label className={labelStyles}>{t('username_cant_change')}</label>
                        <input type="text" disabled value={userData?.username} className={`${inputStyles} opacity-50 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className={labelStyles}>{t('new_email')}</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="email" value={accountForm.newEmail} onChange={e => setAccountForm({...accountForm, newEmail: e.target.value})} className={inputStyles} />
                          <button type="button" onClick={handleRequestEmailChange} disabled={isProcessing || accountForm.newEmail === userData?.email} className="w-full sm:w-auto shrink-0 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50">
                            {t('send_verification')}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{t('email_unbind_warning')}</p>
                        {userData?.pendingEmail && <p className="text-xs text-blue-600 mt-2 font-medium">Link sent to: {userData.pendingEmail}</p>}
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
                      <button type="submit" disabled={isProcessing} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
                        {isProcessing ? t('updating') : t('update_password')}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'general' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold mb-1">{t('general')}</h2>
                      <p className="text-xs sm:text-sm text-slate-500">{t('app_pref_desc')}</p>
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
                          <button onClick={() => setIsDark(false)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium transition-all ${!isDark ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-[#1E293B] dark:border-[#334155]' : 'bg-transparent border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400'}`}>
                            <Sun size={16}/> {t('light_mode')}
                          </button>
                          <button onClick={() => setIsDark(true)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-[#1E293B] dark:border-[#334155] dark:text-blue-400' : 'bg-transparent border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400'}`}>
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