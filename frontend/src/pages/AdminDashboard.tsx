import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, LogOut, Trash2, Edit2, Plus, X, Search, CheckCircle, XCircle, Clock, Sun, Moon, Globe } from 'lucide-react';
import api from '../api/axios';

interface Account {
  id: number;
  username: string;
  email: string;
  isVerified: boolean;
  communities: any[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    email: '', username: '', password: '', communityName: '', subscriptionType: '', customDate: ''
  });

  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/admin/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredAccounts = accounts.filter(acc => {
    const term = searchQuery.toLowerCase();
    const commName = acc.communities[0]?.name || '';
    return acc.username.toLowerCase().includes(term) ||
           acc.email.toLowerCase().includes(term) ||
           commName.toLowerCase().includes(term);
  });

  const openCreateModal = () => {
    setIsEditMode(false);
    setTargetId(null);
    setFormData({ email: '', username: '', password: '', communityName: '', subscriptionType: '', customDate: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setIsEditMode(true);
    setTargetId(account.id);
    const comm = account.communities[0] || {};
    setFormData({
      email: account.email, username: account.username, password: '',
      communityName: comm.name || '', subscriptionType: '', customDate: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && targetId) {
        await api.put(`/admin/accounts/${targetId}`, {
          username: formData.username, email: formData.email, communityName: formData.communityName
        });
        if (formData.password) await api.patch(`/admin/accounts/${targetId}/password`, { newPassword: formData.password });
        if (formData.subscriptionType) await api.patch(`/admin/accounts/${targetId}/subscription`, { type: formData.subscriptionType, customDate: formData.customDate });
      } else {
        await api.post('/admin/accounts', formData);
        if (formData.subscriptionType) {
          const res = await api.get('/admin/accounts');
          const newUser = res.data.find((a: Account) => a.email === formData.email);
          if (newUser) await api.patch(`/admin/accounts/${newUser.id}/subscription`, { type: formData.subscriptionType, customDate: formData.customDate });
        }
      }
      setIsModalOpen(false);
      fetchAccounts();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.response?.data?.error || t('op_failed'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/admin/accounts/${id}`);
      fetchAccounts();
    } catch (err) {
      alert(t('delete_failed'));
    }
  };

  const renderStatusBadge = (status: string, endsAt: string) => {
    if (status === 'lifetime') return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md text-xs font-semibold"><CheckCircle size={14}/> {t('lifetime')}</span>;
    const isExpired = endsAt ? new Date(endsAt) < new Date() : true;
    if (status === 'active' && !isExpired) return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-semibold"><Clock size={14}/> {t('active')}</span>;
    return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-md text-xs font-semibold"><XCircle size={14}/> {t('inactive')}</span>;
  };

  const inputStyles = "w-full px-3 py-2.5 bg-app dark:bg-app-dark/50 border border-default dark:border-default-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelStyles = "block text-xs font-semibold mb-1 text-muted-ink uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-app dark:bg-surface-dark text-primary dark:text-primary-dark font-sans">
      <nav className="border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg flex items-center justify-center shadow-sm">
            <ShieldAlert className="text-white" size={18} />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight hidden sm:inline">{t('sys_admin')}</span>
          <span className="text-lg font-bold tracking-tight sm:hidden">Admin</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-faint hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-muted dark:hover:bg-elevated">
            <Globe size={16} />
            {i18n.language.toUpperCase()}
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-muted-ink dark:text-faint hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-muted dark:hover:bg-elevated rounded-lg transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-px h-5 bg-muted dark:bg-strong-dark mx-1 hidden sm:block"></div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </nav>

      <main className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('comm_accounts')}</h1>
            <p className="text-muted-ink text-sm mt-1">{t('manage_desc')}</p>
          </div>
          <button onClick={openCreateModal} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} /> {t('new_account')}
          </button>
        </div>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-faint" size={18} />
          </div>
          <input
            type="text" placeholder={t('search_ph')}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
          />
        </div>

        {loading ? <div className="animate-pulse h-32 bg-muted dark:bg-elevated-dark rounded-xl w-full"></div> : (
          <div className="flex flex-col gap-4">
            {filteredAccounts.map((account) => {
              const community = account.communities[0] || {};
              return (
                <div key={account.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted dark:bg-elevated-dark border border-subtle dark:border-default-dark flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {community.logo?.startsWith('data:image') ? <img src={community.logo} alt="logo" className="w-full h-full object-cover"/> : community.logo || '🏸'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{community.name || 'Unnamed Community'}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-ink mt-0.5">
                        <span className="font-medium text-primary-soft dark:text-muted-dark truncate">@{account.username}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{account.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-subtle dark:border-subtle-dark">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-[10px] text-faint uppercase tracking-wider font-semibold mb-1 hidden sm:block">{t('status')}</span>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(community.subscriptionStatus, community.subscriptionEndsAt)}
                        {community.subscriptionStatus === 'active' && community.subscriptionEndsAt && (
                          <span className="text-[10px] text-faint font-medium tracking-wide">
                            EXP: {new Date(community.subscriptionEndsAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <button onClick={() => openEditModal(account)} className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-muted hover:bg-indigo-50 hover:text-indigo-600 dark:bg-elevated-dark dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 rounded-lg text-muted-ink dark:text-faint transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(account.id)} className="flex-1 sm:flex-none flex items-center justify-center p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              )
            })}
            {filteredAccounts.length === 0 && (
              <div className="p-8 text-center text-muted-ink bg-surface dark:bg-surface-dark rounded-xl border border-dashed border-default dark:border-default-dark">
                {t('no_accounts')}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Responsive Full-screen Mobile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-ink/60 backdrop-blur-sm">
          <div className="bg-surface dark:bg-surface-dark w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-subtle dark:border-subtle-dark">
              <h3 className="font-bold text-lg">{isEditMode ? t('edit_account') : t('new_account')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <form id="admin-form" onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
                <div>
                  <h4 className="text-sm font-bold text-primary dark:text-primary-dark mb-3">{t('profile_data')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyles}>{t('username')}</label>
                      <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={inputStyles} />
                    </div>
                    <div>
                      <label className={labelStyles}>{t('email')}</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputStyles} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-primary dark:text-primary-dark mb-3">{t('security')}</h4>
                  <div>
                    <label className={labelStyles}>{isEditMode ? t('override_pass') : t('password')}</label>
                    <input type="password" required={!isEditMode} placeholder={isEditMode ? t('leave_blank_unchanged') : '••••••••'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={inputStyles} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-primary dark:text-primary-dark mb-3">{t('comm_settings')}</h4>
                  <div>
                    <label className={labelStyles}>{t('community_name')}</label>
                    <input type="text" required value={formData.communityName} onChange={(e) => setFormData({...formData, communityName: e.target.value})} className={inputStyles} />
                  </div>
                </div>

                <div className="p-4 bg-app dark:bg-app-dark/50 rounded-xl border border-subtle dark:border-subtle-dark">
                  <h4 className="text-sm font-bold text-primary dark:text-primary-dark mb-3">{t('sys_access')}</h4>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className={labelStyles}>{t('sub_action')}</label>
                      <select value={formData.subscriptionType} onChange={(e) => setFormData({...formData, subscriptionType: e.target.value, customDate: ''})} className={inputStyles}>
                        <option value="">{isEditMode ? t('keep_status') : t('select_initial')}</option>
                        <option value="revoke">{t('revoke')}</option>
                        <option value="2_weeks">Active - 2 Weeks</option>
                        <option value="1_month">Active - 1 Month</option>
                        <option value="3_months">Active - 3 Months</option>
                        <option value="lifetime">{t('lifetime')}</option>
                        <option value="custom">Active - Custom Date</option>
                      </select>
                    </div>

                    {formData.subscriptionType === 'custom' && (
                      <div>
                        <label className={labelStyles}>{t('custom_date')}</label>
                        <input type="date" required value={formData.customDate} onChange={(e) => setFormData({...formData, customDate: e.target.value})} className={`[&::-webkit-calendar-picker-indicator]:dark:invert ${inputStyles}`} />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-surface-dark/50 flex justify-end gap-3 shrink-0 pb-safe">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated rounded-lg transition-colors">
                {t('cancel')}
              </button>
              <button type="submit" form="admin-form" className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors">
                {isEditMode ? t('save') : t('create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}