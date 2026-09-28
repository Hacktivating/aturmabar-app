import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, X, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Check, ArrowUpDown, 
  Zap, Globe, Sun, Moon, Settings, LogOut, ArrowLeft, Phone, Calendar, Users,
  Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { TourOverlay } from '../components/TourOverlay';
import { useAppPreferences } from '../hooks/useAppPreferences';

interface Member {
  id: number;
  name: string;
  phone: string;
  gender: string | null;
  skillLevel: string;
  avoidPartnerIds: number[];
  avoidOpponentIds: number[];
  status: string;
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

const inputStyles = "w-full px-4 py-3 bg-app dark:bg-[#121214] border border-default dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-ink transition-all text-primary dark:text-white";
const labelStyles = "block text-xs font-bold mb-1.5 text-muted-ink dark:text-zinc-400 uppercase tracking-wider";

const SearchableMultiSelect = ({ options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt: any) => opt.name.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: number) => onChange(value.includes(id) ? value.filter((v: number) => v !== id) : [...value, id]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`${inputStyles} cursor-text min-h-[46px] flex flex-wrap gap-2 items-center`}>
        {value.length === 0 ? <span className="text-muted-ink dark:text-zinc-500">{placeholder}</span> :
          value.map((id: number) => {
            const opt = options.find((o: any) => o.id === id);
            return opt ? (
              <span key={id} className="bg-surface dark:bg-zinc-800 border border-subtle dark:border-zinc-700 text-ink dark:text-zinc-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                {opt.name} 
                <X size={14} className="cursor-pointer text-muted-ink hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}/>
              </span>
            ) : null;
          })
        }
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
          <div className="sticky top-0 p-3 bg-surface dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={14} />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-app dark:bg-[#121214] text-sm rounded-lg outline-none border border-subtle dark:border-zinc-800 text-primary dark:text-white"/>
            </div>
          </div>
          <div className="py-2">
            {filtered.length === 0 ? <div className="p-4 text-sm text-muted-ink dark:text-zinc-500 text-center">No players found</div> :
              filtered.map((opt: any) => (
                <div key={opt.id} onClick={() => toggleSelect(opt.id)} className="px-4 py-2.5 text-sm hover:bg-app dark:hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors">
                  <span className="font-medium text-primary dark:text-zinc-200">{opt.name}</span>
                  {value.includes(opt.id) && <Check size={16} className="text-ink dark:text-white"/>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default function Members() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isDark, toggleTheme, toggleLanguage, handleLogout } = useAppPreferences();

  const [communityData, setCommunityData] = useState<any>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'roster' | 'memberships'>('roster');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success'|'error'}[]>([]);

  const addToast = (msg: string, type: 'success'|'error' = 'success') => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
  };

  const [tourStep, setTourStep] = useState(() => parseInt(localStorage.getItem('app_tour_step') || '0', 10) || 0);
  
  const advanceTour = (step: number) => {
    setTourStep(step);
    localStorage.setItem('app_tour_step', step.toString());
    window.dispatchEvent(new Event('storage'));
  };

  const endTour = () => { advanceTour(0); };

  useEffect(() => {
    const handleStorage = () => setTourStep(parseInt(localStorage.getItem('app_tour_step') || '0', 10) || 0);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{key: 'name' | 'skillLevel', direction: 'asc' | 'desc'} | null>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);
  const [periodPayments, setPeriodPayments] = useState<any[]>([]);
  const [membershipSearch, setMembershipSearch] = useState('');
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ name: '', startDate: '', endDate: '' });

  const [isAddPeriodMemberModalOpen, setAddPeriodMemberModalOpen] = useState(false);
  const [selectedPeriodMembers, setSelectedPeriodMembers] = useState<number[]>([]);
  const [periodMemberSearch, setPeriodMemberSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', gender: 'male', skillLevel: 'C1', avoidPartnerIds: [] as number[], avoidOpponentIds: [] as number[], status: 'active'
  });

  const fetchInitializationData = async () => {
    try {
      const [membersRes, userRes] = await Promise.all([api.get('/members'), api.get('/users/me')]);
      setMembers(membersRes.data);
      setCommunityData(userRes.data.community);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPeriods = async () => {
    const res = await api.get('/members/periods');
    setPeriods(res.data);
    if (res.data.length > 0 && !selectedPeriod) fetchPeriodPayments(res.data[0]);
  };

  const fetchPeriodPayments = async (period: any) => {
    setSelectedPeriod(period);
    const res = await api.get(`/members/periods/${period.id}/payments`);
    setPeriodPayments(res.data);
  };

  useEffect(() => { fetchInitializationData(); fetchPeriods(); }, []);

  const getActiveMembersList = () => {
    if (tourStep > 0) {
      const dummyIds = JSON.parse(localStorage.getItem('tour_dummy_members') || '[]');
      return members.filter(m => dummyIds.includes(m.id));
    }
    return members;
  };

  const activeMembersList = getActiveMembersList();

  let processedMembers = activeMembersList.filter(m =>
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.phone && m.phone.includes(searchQuery))) &&
    (filterLevel === 'all' || m.skillLevel === filterLevel)
  );

  if (sortConfig !== null) {
    processedMembers.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(processedMembers.length / itemsPerPage);
  const paginatedMembers = processedMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: 'name' | 'skillLevel') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const openCreateModal = () => {
    if (tourStep === 3) {
      advanceTour(4);
    }
    setIsEditMode(false); setTargetId(null);
    setFormData({ name: '', phone: '', gender: 'male', skillLevel: 'C1', avoidPartnerIds: [], avoidOpponentIds: [], status: 'active' });
    setIsModalOpen(true);
    setTimeout(() => { nameInputRef.current?.focus(); }, 100);
  };

  const openEditModal = (member: Member) => {
    setIsEditMode(true); setTargetId(member.id);
    setFormData({
        name: member.name, phone: member.phone || '', gender: member.gender || 'male',
        skillLevel: member.skillLevel, avoidPartnerIds: member.avoidPartnerIds || [],
        avoidOpponentIds: member.avoidOpponentIds || [], status: member.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let createdId = null;
      if (isEditMode && targetId) {
         await api.put(`/members/${targetId}`, formData);
      } else {
         const res = await api.post('/members', formData);
         createdId = res.data.member?.id || res.data.id;
      }
      setIsModalOpen(false);

      if (tourStep === 4 && createdId) {
         setIsProcessing(true);
         addToast('Generating 19 additional test players...', 'success');
         try {
            const dummies = [
              { name: 'Demo Budi', gender: 'male', skillLevel: 'A2' },
              { name: 'Demo Citra', gender: 'female', skillLevel: 'B1' },
              { name: 'Demo Dian', gender: 'female', skillLevel: 'B2' },
              { name: 'Demo Eko', gender: 'male', skillLevel: 'C1' },
              { name: 'Demo Fajar', gender: 'male', skillLevel: 'C2' },
              { name: 'Demo Gita', gender: 'female', skillLevel: 'A1' },
              { name: 'Demo Hadi', gender: 'male', skillLevel: 'B1' },
              { name: 'Demo Indah', gender: 'female', skillLevel: 'B2' },
              { name: 'Demo Joko', gender: 'male', skillLevel: 'C1' },
              { name: 'Demo Kiki', gender: 'female', skillLevel: 'C2' },
              { name: 'Demo Lukman', gender: 'male', skillLevel: 'A2' },
              { name: 'Demo Maya', gender: 'female', skillLevel: 'B1' },
              { name: 'Demo Nina', gender: 'female', skillLevel: 'A1' },
              { name: 'Demo Oscar', gender: 'male', skillLevel: 'C1' },
              { name: 'Demo Putri', gender: 'female', skillLevel: 'B2' },
              { name: 'Demo Qori', gender: 'male', skillLevel: 'A2' },
              { name: 'Demo Rendi', gender: 'male', skillLevel: 'C2' },
              { name: 'Demo Siska', gender: 'female', skillLevel: 'B1' },
              { name: 'Demo Tio', gender: 'male', skillLevel: 'C1' }
            ];
            const createdIds = [createdId];
            for(const m of dummies) {
              const res = await api.post('/members', m);
              createdIds.push(res.data.member?.id || res.data.id);
            }
            localStorage.setItem('tour_dummy_members', JSON.stringify(createdIds));
            setSearchQuery(formData.name);
            addToast('Roster updated with 20 players!', 'success');
            advanceTour(5);
         } catch (err) {
            addToast('Error generating additional members', 'error');
         }
         setIsProcessing(false);
      } else {
         addToast(t('save_changes') + ' Successful', 'success');
      }

      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err: any) { addToast(err.response?.data?.error || t('op_failed'), 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('del_member_confirm'))) return;
    try {
      await api.delete(`/members/${id}`);
      addToast(t('delete_success', 'Player deleted'), 'success');
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) { addToast(t('delete_failed'), 'error'); }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/members/periods', periodForm);
    setIsPeriodModalOpen(false);
    setPeriodForm({ name: '', startDate: '', endDate: '' });
    addToast('Period created successfully', 'success');
    fetchPeriods();
    if (tourStep === 7) advanceTour(8);
  };

  const handleDeletePeriod = async (id: number) => {
    if (!window.confirm("Delete this membership period?")) return;
    await api.delete(`/members/periods/${id}`);
    addToast('Period deleted successfully', 'success');
    if (selectedPeriod?.id === id) {
      setSelectedPeriod(null);
      setPeriodPayments([]);
    }
    fetchPeriods();
  };

  const openAddPeriodMemberModal = () => {
    setSelectedPeriodMembers([]);
    setPeriodMemberSearch('');
    setAddPeriodMemberModalOpen(true);
  };

  const toggleSelectPeriodMember = (memberId: number) => {
    setSelectedPeriodMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const handleAddSelectedPeriodMembers = async () => {
    if (selectedPeriodMembers.length === 0 || !selectedPeriod || isProcessing) return;
    setIsProcessing(true);
    try {
      await Promise.all(selectedPeriodMembers.map(memberId =>
        api.post(`/members/periods/${selectedPeriod.id}/payments`, { memberId })
      ));
      await fetchPeriodPayments(selectedPeriod);
      setAddPeriodMemberModalOpen(false);
      addToast('Members added to period', 'success');
    } catch (err) {
      addToast("Error adding members to period", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePaymentStatus = async (paymentId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    await api.put(`/members/periods/${selectedPeriod.id}/payments/${paymentId}`, { status: newStatus });
    fetchPeriodPayments(selectedPeriod);
  };

  const handleRemoveMemberFromPeriod = async (paymentId: number) => {
    await api.delete(`/members/periods/${selectedPeriod.id}/payments/${paymentId}`);
    fetchPeriodPayments(selectedPeriod);
  };

  const getBadgeStyle = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.color || 'bg-muted text-primary-soft dark:bg-zinc-800 dark:text-zinc-400 border border-transparent dark:border-zinc-700';
  const getBadgeLabel = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.label || levelId;

  const filteredPeriodPayments = periodPayments.filter(p => p.memberName.toLowerCase().includes(membershipSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-zinc-100 font-sans flex flex-col relative transition-colors duration-200">
      
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

      {/* --- TOUR OVERLAYS --- */}
      <TourOverlay step={3} currentStep={tourStep} targetId="tour-add-player" title="Add Players" content="Click here to add yourself or a player to the roster." allowClick={true} hideNext={true} onCancel={endTour} />
      <TourOverlay step={4} currentStep={tourStep} targetId="tour-add-player-modal" hideTooltip={true} allowClick={true} />
      <TourOverlay step={5} currentStep={tourStep} targetId="tour-memberships-tab" title="Billing Cycles" content="Awesome! Now let's track their payments. Click the 'Memberships' tab." allowClick={true} hideNext={true} onCancel={endTour} />
      <TourOverlay step={6} currentStep={tourStep} targetId="tour-create-period" title="Create Periods" content="Click here to establish a new billing cycle (e.g. September 2026)." allowClick={true} hideNext={true} onCancel={endTour} />
      <TourOverlay step={7} currentStep={tourStep} targetId="tour-period-form-modal" hideTooltip={true} allowClick={true} />
      <TourOverlay step={8} currentStep={tourStep} targetId="tour-back-btn" title="Next Up: Matchmaking!" content="Now that we have our dummy members, click here to head back to the dashboard. We'll set up a session next!" allowClick={true} hideNext={true} onCancel={endTour} />

      <nav className="border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-[#0f0f11] px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm shrink-0">
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
          <button onClick={toggleTheme} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors shrink-0">
            <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 relative p-4 sm:p-8 max-w-6xl mx-auto w-full flex flex-col z-10">
        <div className="flex items-center gap-5 mb-8 shrink-0">
          
          <Link 
            id="tour-back-btn" 
            to="/dashboard" 
            onClick={() => { if (tourStep === 8) advanceTour(9); }} 
            className="block p-2.5 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          
          <div className="flex gap-6 border-b border-transparent">
             <button onClick={() => setActiveTab('roster')} className={`text-lg sm:text-xl font-bold tracking-wide pb-3 border-b-2 transition-all ${activeTab === 'roster' ? 'border-ink dark:border-white text-primary dark:text-white' : 'border-transparent text-muted-ink dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-300'}`}>Roster</button>
             
             <button 
               id="tour-memberships-tab" 
               onClick={() => { setActiveTab('memberships'); if (tourStep === 5) advanceTour(6); }} 
               className={`text-lg sm:text-xl font-bold tracking-wide pb-3 border-b-2 transition-all ${activeTab === 'memberships' ? 'border-ink dark:border-white text-primary dark:text-white' : 'border-transparent text-muted-ink dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-300'}`}
             >
               Memberships
             </button>
          </div>
        </div>

        {activeTab === 'roster' && (
          <div className="flex flex-col flex-1 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={18} />
                  <input type="text" placeholder={t('search_members', 'Search members by name or phone...')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-11 pr-4 py-3 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm text-primary dark:text-white"/>
                </div>
                <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-4 py-3 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm appearance-none font-bold text-primary dark:text-white">
                  <option value="all">{t('all_levels', 'All Levels')}</option>
                  {SKILL_LEVELS.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
                </select>
              </div>
              
              <button 
                id="tour-add-player" 
                onClick={openCreateModal} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ink dark:bg-[#f3f4f6] hover:bg-ink-soft dark:hover:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0"
              >
                <Plus size={18} /> {t('add_player', 'Add Player')}
              </button>
            </div>

            {/* Data Container */}
            <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">

              {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-ink dark:text-zinc-500 p-8 font-medium">{t('loading')}</div>
              ) : paginatedMembers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-ink dark:text-zinc-500 p-12 text-center">
                  <Users size={32} className="mb-4 opacity-50" />
                  <p className="font-bold text-lg text-primary dark:text-white mb-1">No players found</p>
                  <p className="text-sm">Try adjusting your search or filter.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800 sticky top-0 z-10">
                        <tr className="text-xs uppercase tracking-widest text-muted-ink dark:text-zinc-400 font-bold">
                          <th className="p-5 cursor-pointer hover:bg-muted dark:hover:bg-white/5 transition-colors" onClick={() => requestSort('name')}>
                            <div className="flex items-center gap-2">{t('full_name', 'FULL NAME')} <ArrowUpDown size={14} className="opacity-50"/></div>
                          </th>
                          <th className="p-5">{t('gender', 'GENDER')}</th>
                          <th className="p-5">{t('phone_number', 'PHONE NUMBER')}</th>
                          <th className="p-5 cursor-pointer hover:bg-muted dark:hover:bg-white/5 transition-colors" onClick={() => requestSort('skillLevel')}>
                            <div className="flex items-center gap-2">{t('skill_level', 'SKILL LEVEL')} <ArrowUpDown size={14} className="opacity-50"/></div>
                          </th>
                          <th className="p-5 text-right pr-6">{t('actions', 'ACTIONS')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {paginatedMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-app dark:hover:bg-white/5 transition-colors group">
                            <td className="p-5 font-bold text-sm text-primary dark:text-zinc-100">{member.name}</td>
                            <td className="p-5 text-sm font-bold">
                              {normalizeGender(member.gender) === 'male' ? (
                                <span className="text-sky-600 dark:text-[#0ea5e9] flex items-center gap-1.5">♂ {t('male', 'Male')}</span>
                              ) : normalizeGender(member.gender) === 'female' ? (
                                <span className="text-pink-600 dark:text-[#f472b6] flex items-center gap-1.5">♀ {t('female', 'Female')}</span>
                              ) : (
                                <span className="text-muted-ink dark:text-zinc-500">—</span>
                              )}
                            </td>
                            <td className="p-5 text-sm text-muted-ink dark:text-zinc-400 font-medium">{member.phone || '-'}</td>
                            <td className="p-5">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide whitespace-nowrap ${getBadgeStyle(member.skillLevel)}`}>
                                {getBadgeLabel(member.skillLevel)}
                              </span>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center justify-end gap-3 transition-opacity">
                                <button onClick={() => openEditModal(member)} className="p-2 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:text-zinc-500 dark:hover:text-sky-400 dark:hover:bg-sky-500/10 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => handleDelete(member.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden flex flex-col flex-1 divide-y divide-slate-100 dark:divide-zinc-800/50 overflow-y-auto">
                    {paginatedMembers.map((member) => (
                      <div key={member.id} className="p-5 flex flex-col gap-4 hover:bg-app dark:hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-base text-primary dark:text-zinc-100">{member.name}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditModal(member)} className="p-2 text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:text-zinc-500 dark:hover:text-sky-400 dark:hover:bg-sky-500/10 rounded-lg transition-colors"><Edit2 size={18}/></button>
                            <button onClick={() => handleDelete(member.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {normalizeGender(member.gender) === 'male' ? (
                            <span className="text-sky-600 dark:text-[#0ea5e9] bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg">♂ {t('male', 'Male')}</span>
                          ) : normalizeGender(member.gender) === 'female' ? (
                            <span className="text-pink-600 dark:text-[#f472b6] bg-pink-50 dark:bg-[#f472b6]/10 border border-pink-200 dark:border-[#f472b6]/20 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg">♀ {t('female', 'Female')}</span>
                          ) : (
                            <span className="text-muted-ink dark:text-zinc-500 bg-muted dark:bg-zinc-800 border border-subtle dark:border-zinc-700 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg">—</span>
                          )}
                          <span className={`px-2.5 py-1.5 rounded-lg font-bold tracking-wide ${getBadgeStyle(member.skillLevel)}`}>
                            {getBadgeLabel(member.skillLevel)}
                          </span>
                        </div>

                        {member.phone && (
                          <div className="text-sm text-muted-ink dark:text-zinc-400 font-medium flex items-center gap-2 mt-1">
                            <Phone size={14} className="opacity-70"/> {member.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination UI */}
              {!loading && totalPages > 1 && (
                <div className="mt-auto p-4 border-t border-subtle dark:border-zinc-800 flex items-center justify-between bg-app dark:bg-zinc-900/30 shrink-0">
                  <span className="text-xs font-bold text-muted-ink dark:text-zinc-400 uppercase tracking-widest">
                    {t('page_of').replace('{{current}}', currentPage.toString()).replace('{{total}}', totalPages.toString())}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-subtle dark:border-zinc-800 rounded-lg bg-surface dark:bg-[#18181b] disabled:opacity-50 hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white transition-colors shadow-sm"><ChevronLeft size={16}/></button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-subtle dark:border-zinc-800 rounded-lg bg-surface dark:bg-[#18181b] disabled:opacity-50 hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white transition-colors shadow-sm"><ChevronRight size={16}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'memberships' && (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start animate-in fade-in">
            {/* Sidebar: Periods */}
            <div className="w-full lg:w-80 flex flex-col gap-5">
              <button 
                id="tour-create-period" 
                onClick={() => { if(tourStep === 6) { advanceTour(7); setIsPeriodModalOpen(true); } else { setIsPeriodModalOpen(true); } }} 
                className="w-full bg-ink dark:bg-[#f3f4f6] hover:bg-ink-soft dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl p-4 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Plus size={18} /> Create Membership Period
              </button>
              
              <div className="flex flex-col gap-3">
                {periods.length === 0 ? <p className="text-muted-ink dark:text-zinc-500 text-sm text-center py-8 font-medium">No periods found.</p> :
                  periods.map(period => (
                    <div key={period.id} onClick={() => fetchPeriodPayments(period)} className={`p-5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group ${selectedPeriod?.id === period.id ? 'bg-surface dark:bg-zinc-800/50 border-ink dark:border-zinc-600 ring-1 ring-ink/20 shadow-md' : 'bg-transparent border-subtle dark:border-zinc-800 hover:bg-app dark:hover:bg-[#121214]'}`}>
                      <div className="flex flex-col">
                        <span className={`font-bold text-base ${selectedPeriod?.id === period.id ? 'text-ink dark:text-white' : 'text-primary dark:text-zinc-300'}`}>{period.name}</span>
                        <span className="text-xs font-medium text-muted-ink dark:text-zinc-500 flex items-center gap-1.5 mt-2"><Calendar size={12}/> {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePeriod(period.id); }} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Main Area: Period Payments */}
            <div className="flex-1 w-full bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              {!selectedPeriod ? (
                <div className="flex-1 flex items-center justify-center text-muted-ink dark:text-zinc-500 font-medium">Select a membership period to view payments.</div>
              ) : (
                <>
                  <div className="p-6 sm:p-8 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary dark:text-white tracking-tight">{selectedPeriod.name} Payments</h2>
                      <p className="text-sm font-medium text-muted-ink dark:text-zinc-400 mt-1">{periodPayments.filter(p => p.status === 'paid').length} of {periodPayments.length} Paid</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={16} />
                        <input type="text" placeholder="Search members..." value={membershipSearch} onChange={(e) => setMembershipSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm text-primary dark:text-white"/>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-[#121214]">
                      <button onClick={openAddPeriodMemberModal} className="flex items-center justify-center gap-2 bg-app hover:bg-muted dark:bg-[#18181b] dark:hover:bg-zinc-800 border border-subtle dark:border-zinc-700 text-primary dark:text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm w-full sm:w-auto">
                        <Users size={18} /> Add Members to Period
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {filteredPeriodPayments.length === 0 && <tr><td className="p-12 text-center text-muted-ink dark:text-zinc-500 font-medium">No members in this period.</td></tr>}
                        {filteredPeriodPayments.map(p => (
                          <tr key={p.id} className="hover:bg-app dark:hover:bg-white/5 group transition-colors">
                            <td className="p-5 sm:p-6 font-bold text-base text-primary dark:text-zinc-100">{p.memberName}</td>
                            <td className="p-5 sm:p-6 text-right">
                              <div className="flex items-center justify-end gap-4">
                                <button onClick={() => handleTogglePaymentStatus(p.id, p.status)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-muted text-muted-ink border border-subtle dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'}`}>
                                  {p.status}
                                </button>
                                <button onClick={() => handleRemoveMemberFromPeriod(p.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-all"><X size={18}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Roster Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div id="tour-add-player-modal" className="bg-surface dark:bg-[#0f0f11] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] relative border border-subtle dark:border-zinc-800">
            
            {tourStep === 4 && (
               <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 p-5 text-amber-700 dark:text-amber-400 flex items-start gap-3">
                 <Sparkles className="shrink-0 mt-0.5" size={20} />
                 <div className="text-sm leading-relaxed font-medium">
                   <strong className="font-black text-amber-800 dark:text-amber-300 text-base block mb-1">Create Your Player</strong>
                   Type any name, select their details, and hit <strong className="font-bold text-amber-800 dark:text-amber-300">Save Player</strong>. The cancel button is disabled so you have to finish this step! We will auto-generate 19 extra players to complete your 20-player roster.
                 </div>
               </div>
            )}

            <div className="flex justify-between items-center p-6 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214]">
              <h3 className="font-black text-xl text-primary dark:text-white tracking-tight">{isEditMode ? t('edit_player') : t('add_player')}</h3>
              {tourStep !== 4 && (
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white rounded-full transition-colors"><X size={20} /></button>
              )}
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              <form id="member-form" onSubmit={handleSubmit} className="flex flex-col gap-6 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelStyles}>{t('name')}</label>
                    <input ref={nameInputRef} type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>{t('phone')} <span className="font-medium text-muted-ink dark:text-zinc-500 normal-case">({t('optional')})</span></label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputStyles} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelStyles}>{t('gender')}</label>
                    <div className="relative">
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={`${inputStyles} appearance-none pr-10 font-bold`}>
                        <option value="male">♂ {t('male')}</option>
                        <option value="female">♀ {t('female')}</option>
                      </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500 rotate-90" />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>{t('skill_level')}</label>
                    <div className="relative">
                      <select value={formData.skillLevel} onChange={e => setFormData({...formData, skillLevel: e.target.value})} className={`${inputStyles} appearance-none pr-10 font-bold`}>
                        {SKILL_LEVELS.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
                      </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-2 border-t border-subtle dark:border-zinc-800">
                  <h4 className="text-sm font-black text-primary dark:text-white tracking-tight mb-5">{t('pairing_restrictions')}</h4>
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className={labelStyles}>{t('avoid_partner')}</label>
                      <SearchableMultiSelect options={activeMembersList.filter(m => m.id !== targetId)} value={formData.avoidPartnerIds} onChange={(val: number[]) => setFormData({...formData, avoidPartnerIds: val})} placeholder={t('search_restrict')} />
                    </div>
                    <div>
                      <label className={labelStyles}>{t('avoid_opponent')}</label>
                      <SearchableMultiSelect options={activeMembersList.filter(m => m.id !== targetId)} value={formData.avoidOpponentIds} onChange={(val: number[]) => setFormData({...formData, avoidOpponentIds: val})} placeholder={t('search_restrict')} />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] flex justify-end gap-3 shrink-0">
              {tourStep !== 4 && (
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white rounded-xl transition-colors">{t('cancel')}</button>
              )}
              <button disabled={isProcessing} type="submit" form="member-form" className="px-8 py-3 text-sm font-bold bg-ink dark:bg-[#f3f4f6] hover:bg-ink-soft dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                 {isProcessing ? 'Generating...' : t('save_player')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period Creation Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div id="tour-period-form-modal" className="bg-surface dark:bg-[#0f0f11] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-subtle dark:border-zinc-800 relative">
            
            {tourStep === 7 && (
               <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 p-5 text-amber-700 dark:text-amber-400 flex items-start gap-3">
                 <Sparkles className="shrink-0 mt-0.5" size={20} />
                 <div className="text-sm leading-relaxed font-medium">
                   <strong className="font-black text-amber-800 dark:text-amber-300 text-base block mb-1">Set Up Details</strong>
                   Enter a Period Name (like "September 2026") and select the start and end dates, then click <strong>Create</strong> to continue.
                 </div>
               </div>
            )}

            <div className="flex justify-between items-center p-6 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214]">
              <h3 className="font-black text-xl text-primary dark:text-white tracking-tight">Create Period</h3>
              {tourStep !== 7 && (
                <button onClick={() => setIsPeriodModalOpen(false)} className="p-2 text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white rounded-full transition-colors"><X size={20} /></button>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <form id="period-form" onSubmit={handleCreatePeriod} className="flex flex-col gap-5">
                <div>
                  <label className={labelStyles}>Period Name</label>
                  <input type="text" required placeholder="e.g. Agustus 2026" value={periodForm.name} onChange={e => setPeriodForm({...periodForm, name: e.target.value})} className={inputStyles} autoFocus />
                </div>
                <div>
                  <label className={labelStyles}>Start Date</label>
                  <input type="date" required value={periodForm.startDate} onChange={e => setPeriodForm({...periodForm, startDate: e.target.value})} className={inputStyles} />
                </div>
                <div>
                  <label className={labelStyles}>End Date</label>
                  <input type="date" required value={periodForm.endDate} onChange={e => setPeriodForm({...periodForm, endDate: e.target.value})} className={inputStyles} />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] flex justify-end gap-3 z-10 relative">
              {tourStep !== 7 && (
                <button type="button" onClick={() => setIsPeriodModalOpen(false)} className="px-6 py-3 text-sm font-bold text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white rounded-xl transition-colors">Cancel</button>
              )}
              <button disabled={isProcessing} type="submit" form="period-form" className="px-8 py-3 text-sm font-bold bg-ink dark:bg-[#f3f4f6] hover:bg-ink-soft dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                {isProcessing ? 'Generating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member to Period Modal */}
      {isAddPeriodMemberModalOpen && selectedPeriod && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-[#0f0f11] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-subtle dark:border-zinc-800">
            <div className="flex justify-between items-center p-6 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214]">
              <h3 className="font-black text-xl text-primary dark:text-white tracking-tight">Add Members to Period</h3>
              <button disabled={isProcessing} onClick={() => setAddPeriodMemberModalOpen(false)} className="p-2 text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white rounded-full transition-colors disabled:opacity-50"><X size={20}/></button>
            </div>

            <div className="p-5 border-b border-subtle dark:border-zinc-800">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={18} />
                <input disabled={isProcessing} type="text" placeholder={t('search_players', 'Search players...')} value={periodMemberSearch} onChange={(e) => setPeriodMemberSearch(e.target.value)} className={`${inputStyles} pl-11`} autoFocus />
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 bg-surface dark:bg-[#0f0f11]">
              {(() => {
                const available = members.filter(m => !periodPayments.some(p => p.memberId === m.id) && m.name.toLowerCase().includes(periodMemberSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
                if (available.length === 0) return <div className="p-12 text-center text-muted-ink dark:text-zinc-500 font-medium">{t('no_players', 'No players available')}</div>;
                return available.map(member => (
                  <div key={member.id} className={`flex items-center p-4 hover:bg-app dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`} onClick={() => toggleSelectPeriodMember(member.id)}>
                    <div className="flex items-center gap-5 w-full">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedPeriodMembers.includes(member.id) ? 'bg-ink border-ink text-white dark:bg-white dark:border-white dark:text-zinc-900' : 'border-default dark:border-zinc-700 bg-transparent'}`}>
                        {selectedPeriodMembers.includes(member.id) && <Check size={16} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="font-bold text-base text-primary dark:text-zinc-100">{member.name}</div>
                        <div className="text-sm font-medium text-muted-ink dark:text-zinc-500 mt-0.5">{member.skillLevel}</div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="p-6 border-t border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214]">
              <button onClick={handleAddSelectedPeriodMembers} disabled={selectedPeriodMembers.length === 0 || isProcessing} className="w-full py-4 text-base font-bold text-white dark:text-zinc-900 bg-ink dark:bg-white hover:bg-ink-soft dark:hover:bg-zinc-200 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {t('add_selected', 'Add Selected').replace('{{count}}', selectedPeriodMembers.length.toString())}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}