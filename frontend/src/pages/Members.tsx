import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, X, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Check, ArrowUpDown, 
  Zap, Globe, Sun, Moon, Settings, LogOut, ArrowLeft, Phone, Calendar, Users,
  Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAppPreferences } from '../hooks/useAppPreferences';

// --- DYNAMIC TOUR OVERLAY ENGINE ---
const TourOverlay = ({ step, currentStep, targetId, title, content, onNext, nextText, actionButton, hideNext, onCancel, allowClick, hideTooltip }: any) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step !== currentStep) return;
    if (!targetId) { setRect(null); return; }
    
    const updateRect = () => {
      const el = document.getElementById(targetId);
      if (el) setRect(el.getBoundingClientRect());
    };
    
    updateRect();
    const i1 = setTimeout(updateRect, 100);
    const i2 = setTimeout(updateRect, 300);
    const interval = setInterval(updateRect, 500); 
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      clearTimeout(i1); clearTimeout(i2); clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    }
  }, [step, currentStep, targetId]);

  if (step !== currentStep) return null;
  const hasButtons = !hideNext || !!onCancel || !!actionButton;

  if (!targetId) {
    return (
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in pointer-events-auto">
         <div className="bg-surface dark:bg-zinc-900 border border-amber-500/50 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] relative text-center animate-in zoom-in-95 fade-in duration-300">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={32} /></div>
            <h3 className="text-xl font-black text-amber-500 mb-1 uppercase tracking-widest text-xs">Step 1: Members</h3>
            <h3 className="text-2xl font-black text-primary dark:text-white mb-4">{title}</h3>
            <div className="text-muted-ink dark:text-zinc-400 text-sm sm:text-base mb-8 leading-relaxed">{content}</div>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3 sm:gap-4">
              {onCancel && <button onClick={onCancel} className="px-6 py-3 font-bold text-faint hover:text-primary dark:hover:text-white transition-colors">Cancel Tour</button>}
              {actionButton}
              {!hideNext && onNext && <button onClick={onNext} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg transition-colors">{nextText || 'Next'}</button>}
            </div>
         </div>
      </div>
    );
  }

  if (!rect) return null;

  const padding = 12;
  const topH = Math.max(0, rect.top - padding);
  const leftW = Math.max(0, rect.left - padding);
  const targetW = rect.width + padding * 2;
  const targetH = rect.height + padding * 2;
  const bottomH = Math.max(0, window.innerHeight - topH - targetH);
  const rightW = Math.max(0, window.innerWidth - leftW - targetW);

  let tooltipTop = topH + targetH + 16;
  let isAbove = false;
  let hideArrow = false;

  if (tooltipTop + 200 > window.innerHeight) {
     tooltipTop = topH - 220;
     isAbove = true;
  }
  
  if (tooltipTop < 16) {
     tooltipTop = 32; 
     hideArrow = true;
  }

  let tooltipLeft = leftW + (targetW / 2) - 160; 
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - 320 - 16)); 

  return (
    <div className="fixed inset-0 z-[2147483647] pointer-events-none animate-in fade-in duration-300">
      {/* PERFECT BLACKOUT MASKS */}
      <div className="absolute top-0 left-0 right-0 bg-black/85 pointer-events-auto transition-all duration-300 ease-out" style={{ height: topH }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/85 pointer-events-auto transition-all duration-300 ease-out" style={{ height: bottomH }} />
      <div className="absolute left-0 bg-black/85 pointer-events-auto transition-all duration-300 ease-out" style={{ top: topH, height: targetH, width: leftW }} />
      <div className="absolute right-0 bg-black/85 pointer-events-auto transition-all duration-300 ease-out" style={{ top: topH, height: targetH, width: rightW }} />

      {/* Target Outline & Click Blocker */}
      <div className="absolute border-4 border-amber-500 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300 ease-out pointer-events-none" style={{ top: topH, left: leftW, width: targetW, height: targetH }}>
         {!allowClick && <div className="w-full h-full pointer-events-auto cursor-not-allowed" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />}
      </div>

      {/* Floating Tooltip */}
      {!hideTooltip && (
        <div 
          className={`absolute ${hasButtons ? 'pointer-events-auto' : 'pointer-events-none'} bg-surface dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-6 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out`}
          style={{ top: tooltipTop, left: tooltipLeft, width: Math.min(320, window.innerWidth - 32) }}
        >
           {!hideArrow && (
             <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-surface dark:bg-zinc-900 border-amber-500/30 rotate-45 transition-all duration-300 ${isAbove ? 'bottom-[-9px] border-b border-r' : 'top-[-9px] border-t border-l'}`} />
           )}
           <h4 className="text-lg font-black text-primary dark:text-white mb-2 flex items-center gap-2 relative z-10">
             <Sparkles size={18} className="text-amber-500 shrink-0"/> {title}
           </h4>
           <p className={`text-sm text-muted-ink dark:text-zinc-400 leading-relaxed relative z-10 ${hasButtons ? 'mb-6' : 'mb-0'}`}>{content}</p>
           
           {hasButtons && (
             <div className="flex justify-between items-center mt-auto relative z-10">
               {onCancel && <button onClick={onCancel} className="text-xs font-bold text-faint hover:text-rose-500 transition-colors">End Tour</button>}
               {actionButton}
               {!hideNext && onNext && <button onClick={onNext} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-sm shadow-md transition-colors">{nextText || 'Next'}</button>}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
// ----------------------------------------

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
  { id: 'A1', label: 'A1 - Pro', color: 'bg-elevated text-white dark:bg-muted dark:text-primary' },
  { id: 'A2', label: 'A2 - Advanced', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  { id: 'B1', label: 'B1 - Upper Intermediate', color: 'bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark' },
  { id: 'B2', label: 'B2 - Lower Intermediate', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' },
  { id: 'C1', label: 'C1 - Beginner', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { id: 'C2', label: 'C2 - Newbie', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400' }
];

const inputStyles = "w-full px-3 py-2.5 bg-app dark:bg-app-dark/50 border border-default dark:border-default-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-ink transition-all";
const labelStyles = "block text-xs font-semibold mb-1.5 text-primary-soft dark:text-muted-dark";

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
      <div onClick={() => setIsOpen(!isOpen)} className={`${inputStyles} cursor-text min-h-[42px] flex flex-wrap gap-1 items-center`}>
        {value.length === 0 ? <span className="text-faint">{placeholder}</span> :
          value.map((id: number) => {
            const opt = options.find((o: any) => o.id === id);
            return opt ? <span key={id} className="bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark px-2 py-0.5 rounded text-xs flex items-center gap-1">{opt.name} <X size={12} className="cursor-pointer hover:text-rose-500" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}/></span> : null;
          })
        }
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-surface dark:bg-surface-dark border border-subtle dark:border-default-dark rounded-lg shadow-xl max-h-48 overflow-y-auto">
          <div className="sticky top-0 p-2 bg-surface dark:bg-surface-dark border-b border-subtle dark:border-subtle-dark">
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-app dark:bg-app-dark px-2 py-1.5 text-sm rounded outline-none border border-subtle dark:border-default-dark"/>
          </div>
          {filtered.length === 0 ? <div className="p-3 text-sm text-muted-ink text-center">No players found</div> :
            filtered.map((opt: any) => (
              <div key={opt.id} onClick={() => toggleSelect(opt.id)} className="px-3 py-2 text-sm hover:bg-app dark:hover:bg-elevated cursor-pointer flex items-center justify-between">
                <span>{opt.name}</span>
                {value.includes(opt.id) && <Check size={16} className="text-ink"/>}
              </div>
            ))
          }
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

  // --- TOUR STATE SYNC ---
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

  // Roster States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{key: 'name' | 'skillLevel', direction: 'asc' | 'desc'} | null>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Membership States
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);
  const [periodPayments, setPeriodPayments] = useState<any[]>([]);
  const [membershipSearch, setMembershipSearch] = useState('');
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ name: '', startDate: '', endDate: '' });

  // Add Member to Period Modal States
  const [isAddPeriodMemberModalOpen, setAddPeriodMemberModalOpen] = useState(false);
  const [selectedPeriodMembers, setSelectedPeriodMembers] = useState<number[]>([]);
  const [periodMemberSearch, setPeriodMemberSearch] = useState('');

  // Roster Modal States
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

  // --- SANDBOX FILTERING ---
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

  // Forms & Actions
  const openCreateModal = () => {
    if (tourStep === 3) {
      advanceTour(4); // Advance tour to form overlay
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

      // Handle Tutorial Auto-Generation
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
            
            // Set the search bar to the exact name they typed so they ONLY see their player!
            setSearchQuery(formData.name);
            
            addToast('Roster updated with 20 players!', 'success');
            advanceTour(5); // Go to memberships tab step
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

  // Membership Period Actions
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

  // Add Member to Period logic
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

  const getBadgeStyle = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.color || 'bg-muted text-primary-soft';
  const getBadgeLabel = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.label || levelId;

  const filteredPeriodPayments = periodPayments.filter(p => p.memberName.toLowerCase().includes(membershipSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark text-primary dark:text-primary-dark font-sans flex flex-col relative">
      
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

      {/* --- TOUR OVERLAYS (Members Steps 3 to 8) --- */}
      <TourOverlay step={3} currentStep={tourStep} targetId="tour-add-player" title="Add Players" content="Click here to add yourself or a player to the roster." allowClick={true} hideNext={true} onCancel={endTour} />
      
      <TourOverlay step={4} currentStep={tourStep} targetId="tour-add-player-modal" hideTooltip={true} allowClick={true} />

      <TourOverlay step={5} currentStep={tourStep} targetId="tour-memberships-tab" title="Billing Cycles" content="Awesome! Now let's track their payments. Click the 'Memberships' tab." allowClick={true} hideNext={true} onCancel={endTour} />
      
      <TourOverlay step={6} currentStep={tourStep} targetId="tour-create-period" title="Create Periods" content="Click here to establish a new billing cycle (e.g. September 2026)." allowClick={true} hideNext={true} onCancel={endTour} />
      
      <TourOverlay step={7} currentStep={tourStep} targetId="tour-period-form-modal" hideTooltip={true} allowClick={true} />
      
      <TourOverlay step={8} currentStep={tourStep} targetId="tour-back-btn" title="Next Up: Matchmaking!" content="Now that we have our dummy members, click here to head back to the dashboard. We'll set up a session next!" allowClick={true} hideNext={true} onCancel={endTour} />
      {/* ------------------------------------------- */}

      <nav className="border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-8 py-4">
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

            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-faint hover:text-ink dark:hover:text-ink-dark transition-colors px-2 py-1.5 rounded-lg hover:bg-muted dark:hover:bg-elevated">
              <Globe size={16} />
              {i18n.language.toUpperCase()}
            </button>
            <button onClick={toggleTheme} className="p-1.5 text-muted-ink dark:text-faint hover:text-ink dark:hover:text-ink-dark hover:bg-muted dark:hover:bg-elevated rounded-lg transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-muted-ink hover:text-ink dark:text-faint dark:hover:text-ink-dark hover:bg-muted dark:hover:bg-elevated rounded-lg transition-colors shrink-0" title="Settings / Dashboard">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0">
              <LogOut size={16} /> <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto flex flex-col relative z-10">
        <div className="flex items-center gap-4 mb-6 sm:mb-8 shrink-0">
          
          <Link 
            id="tour-back-btn" 
            to="/dashboard" 
            onClick={() => { if (tourStep === 8) advanceTour(9); }} 
            className="block p-2 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg hover:bg-app dark:hover:bg-elevated transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          
          <div className="flex gap-6 border-b border-transparent">
             <button onClick={() => setActiveTab('roster')} className={`text-xl font-bold tracking-tight pb-2 border-b-2 transition-colors ${activeTab === 'roster' ? 'border-ink text-primary dark:text-primary-dark' : 'border-transparent text-faint hover:text-muted-ink dark:hover:text-muted-dark'}`}>Roster</button>
             
             <button 
               id="tour-memberships-tab" 
               onClick={() => { setActiveTab('memberships'); if (tourStep === 5) advanceTour(6); }} 
               className={`text-xl font-bold tracking-tight pb-2 border-b-2 transition-colors ${activeTab === 'memberships' ? 'border-ink text-primary dark:text-primary-dark' : 'border-transparent text-faint hover:text-muted-ink dark:hover:text-muted-dark'}`}
             >
               Memberships
             </button>
          </div>
        </div>

        {activeTab === 'roster' && (
          <div className="flex flex-col flex-1 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={18} />
                  <input type="text" placeholder={t('search_members')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
                </div>
                <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm appearance-none font-medium">
                  <option value="all">{t('all_levels')}</option>
                  {SKILL_LEVELS.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
                </select>
              </div>
              
              <button 
                id="tour-add-player" 
                onClick={openCreateModal} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shrink-0"
              >
                <Plus size={16} /> {t('add_player')}
              </button>
            </div>

            {/* Data Container */}
            <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">

              {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted-ink p-8">{t('loading')}</div>
              ) : paginatedMembers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-ink p-8">{t('no_players')}</div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark sticky top-0 z-10">
                        <tr className="text-xs uppercase tracking-wider text-muted-ink font-semibold">
                          <th className="p-4 cursor-pointer hover:bg-muted dark:hover:bg-elevated-dark/50 transition-colors" onClick={() => requestSort('name')}>
                            <div className="flex items-center gap-2">{t('name')} <ArrowUpDown size={14} className="text-faint"/></div>
                          </th>
                          <th className="p-4">{t('gender')}</th>
                          <th className="p-4">{t('phone')}</th>
                          <th className="p-4 cursor-pointer hover:bg-muted dark:hover:bg-elevated-dark/50 transition-colors" onClick={() => requestSort('skillLevel')}>
                            <div className="flex items-center gap-2">{t('skill_level')} <ArrowUpDown size={14} className="text-faint"/></div>
                          </th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                        {paginatedMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-app dark:hover:bg-elevated-dark/30 transition-colors">
                            <td className="p-4 font-medium text-sm">{member.name}</td>
                            <td className="p-4 text-sm font-medium">
                              {normalizeGender(member.gender) === 'male' ? (
                                <span className="text-ink dark:text-primary-dark flex items-center gap-1.5">♂ {t('male')}</span>
                              ) : normalizeGender(member.gender) === 'female' ? (
                                <span className="text-primary-soft dark:text-primary-dark flex items-center gap-1.5">♀ {t('female')}</span>
                              ) : (
                                <span className="text-muted-ink dark:text-muted-dark">—</span>
                              )}
                            </td>
                            <td className="p-4 text-sm text-muted-ink">{member.phone || '-'}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap ${getBadgeStyle(member.skillLevel)}`}>
                                {getBadgeLabel(member.skillLevel)}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEditModal(member)} className="p-1.5 text-faint hover:text-ink hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => handleDelete(member.id)} className="p-1.5 text-faint hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden flex flex-col flex-1 divide-y divide-slate-100 dark:divide-[#1E293B] overflow-y-auto">
                    {paginatedMembers.map((member) => (
                      <div key={member.id} className="p-4 flex flex-col gap-3 hover:bg-app dark:hover:bg-elevated-dark/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-sm">{member.name}</div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditModal(member)} className="p-2 text-faint hover:text-ink bg-app dark:bg-elevated-dark rounded-lg transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(member.id)} className="p-2 text-faint hover:text-rose-600 bg-app dark:bg-elevated-dark rounded-lg transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {normalizeGender(member.gender) === 'male' ? (
                            <span className="text-ink dark:text-primary-dark font-medium flex items-center gap-1.5 bg-accent-soft dark:bg-accent-soft-dark px-2 py-1 rounded">♂ {t('male')}</span>
                          ) : normalizeGender(member.gender) === 'female' ? (
                            <span className="text-primary-soft dark:text-primary-dark font-medium flex items-center gap-1.5 bg-accent-soft dark:bg-accent-soft-dark px-2 py-1 rounded">♀ {t('female')}</span>
                          ) : (
                            <span className="text-muted-ink dark:text-muted-dark font-medium flex items-center gap-1.5 bg-muted dark:bg-elevated-dark px-2 py-1 rounded">—</span>
                          )}
                          <span className={`px-2 py-1 rounded font-bold tracking-wide ${getBadgeStyle(member.skillLevel)}`}>
                            {getBadgeLabel(member.skillLevel)}
                          </span>
                        </div>

                        {member.phone && (
                          <div className="text-xs text-muted-ink flex items-center gap-1.5 mt-1">
                            <Phone size={12} className="text-faint"/> {member.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination UI */}
              {!loading && totalPages > 1 && (
                <div className="mt-auto p-4 border-t border-subtle dark:border-subtle-dark flex items-center justify-between bg-app dark:bg-app-dark shrink-0">
                  <span className="text-xs text-muted-ink font-medium">
                    {t('page_of').replace('{{current}}', currentPage.toString()).replace('{{total}}', totalPages.toString())}
                  </span>
                  <div className="flex gap-1">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-subtle dark:border-default-dark rounded bg-surface dark:bg-surface-dark disabled:opacity-50 hover:bg-muted dark:hover:bg-elevated transition-colors"><ChevronLeft size={16}/></button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-subtle dark:border-default-dark rounded bg-surface dark:bg-surface-dark disabled:opacity-50 hover:bg-muted dark:hover:bg-elevated transition-colors"><ChevronRight size={16}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'memberships' && (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start animate-in fade-in">
            {/* Sidebar: Periods */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <button 
                id="tour-create-period" 
                onClick={() => { if(tourStep === 6) { advanceTour(7); setIsPeriodModalOpen(true); } else { setIsPeriodModalOpen(true); } }} 
                className="w-full bg-ink hover:bg-ink-soft text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Plus size={18} /> Create Membership Period
              </button>
              
              <div className="flex flex-col gap-3">
                {periods.length === 0 ? <p className="text-muted-ink text-sm text-center py-4">No periods found.</p> :
                  periods.map(period => (
                    <div key={period.id} onClick={() => fetchPeriodPayments(period)} className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedPeriod?.id === period.id ? 'bg-surface dark:bg-surface-dark border-ink ring-1 ring-blue-500 shadow-sm' : 'bg-transparent border-subtle dark:border-subtle-dark hover:bg-app dark:hover:bg-elevated-dark'}`}>
                      <div className="flex flex-col">
                        <span className={`font-bold ${selectedPeriod?.id === period.id ? 'text-ink dark:text-ink-dark' : 'text-primary dark:text-primary-dark'}`}>{period.name}</span>
                        <span className="text-xs text-muted-ink flex items-center gap-1 mt-1.5"><Calendar size={12}/> {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePeriod(period.id); }} className="p-2 text-faint hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={16}/></button>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Main Area: Period Payments */}
            <div className="flex-1 w-full bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              {!selectedPeriod ? (
                <div className="flex-1 flex items-center justify-center text-muted-ink">Select a membership period to view payments.</div>
              ) : (
                <>
                  <div className="p-6 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold dark:text-primary-dark">{selectedPeriod.name} Payments</h2>
                      <p className="text-sm text-muted-ink mt-1">{periodPayments.filter(p => p.status === 'paid').length} of {periodPayments.length} Paid</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                        <input type="text" placeholder="Search members..." value={membershipSearch} onChange={(e) => setMembershipSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark">
                      <button onClick={openAddPeriodMemberModal} className="flex items-center gap-2 bg-muted hover:bg-muted dark:bg-elevated-dark dark:hover:bg-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto justify-center">
                        <Users size={16} /> Add Members to Period
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                        {filteredPeriodPayments.length === 0 && <tr><td className="p-8 text-center text-muted-ink">No members in this period.</td></tr>}
                        {filteredPeriodPayments.map(p => (
                          <tr key={p.id} className="hover:bg-app dark:hover:bg-elevated-dark/30 group transition-colors">
                            <td className="p-4 font-bold text-primary dark:text-primary-dark">{p.memberName}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-4">
                                <button onClick={() => handleTogglePaymentStatus(p.id, p.status)} className={`px-4 py-1.5 rounded font-bold text-xs uppercase tracking-widest transition-colors ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-muted text-muted-ink dark:bg-elevated-dark dark:text-faint'}`}>
                                  {p.status}
                                </button>
                                <button onClick={() => handleRemoveMemberFromPeriod(p.id)} className="text-faint hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={18}/></button>
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
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div id="tour-add-player-modal" className="bg-surface dark:bg-surface-dark w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] relative">
            
            {tourStep === 4 && (
               <div className="bg-amber-500/10 border-b border-amber-500/30 p-4 text-amber-600 dark:text-amber-400 flex items-start gap-3">
                 <Sparkles className="shrink-0 mt-0.5" size={18} />
                 <div className="text-sm leading-relaxed">
                   <strong className="font-bold text-amber-700 dark:text-amber-300">Create Your Player</strong><br/>
                   Type any name, select their details, and hit <strong className="font-bold text-amber-700 dark:text-amber-300">Save Player</strong>. The cancel button is disabled so you have to finish this step! We will auto-generate 19 extra players to complete your 20-player roster.
                 </div>
               </div>
            )}

            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark">
              <h3 className="font-bold text-lg">{isEditMode ? t('edit_player') : t('add_player')}</h3>
              {tourStep !== 4 && (
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated rounded-full transition-colors"><X size={18} /></button>
              )}
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="member-form" onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>{t('name')}</label>
                    <input ref={nameInputRef} type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputStyles} />
                  </div>
                  <div>
                    <label className={labelStyles}>{t('phone')} <span className="font-normal text-faint">({t('optional')})</span></label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputStyles} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>{t('gender')}</label>
                    <div className="relative">
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={`${inputStyles} appearance-none pr-8 font-medium`}>
                        <option value="male">♂ {t('male')}</option>
                        <option value="female">♀ {t('female')}</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>{t('skill_level')}</label>
                    <div className="relative">
                      <select value={formData.skillLevel} onChange={e => setFormData({...formData, skillLevel: e.target.value})} className={`${inputStyles} appearance-none pr-8 font-medium`}>
                        {SKILL_LEVELS.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-subtle dark:border-subtle-dark">
                  <h4 className="text-xs font-bold text-muted-ink uppercase tracking-wider mb-4">{t('pairing_restrictions')}</h4>
                  <div className="flex flex-col gap-4">
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

            <div className="p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-end gap-3 shrink-0">
              {tourStep !== 4 && (
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors">{t('cancel')}</button>
              )}
              <button disabled={isProcessing} type="submit" form="member-form" className="px-6 py-2.5 text-sm font-medium bg-ink hover:bg-ink-soft text-white rounded-lg shadow-sm transition-colors disabled:opacity-50">
                 {isProcessing ? 'Generating...' : t('save_player')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period Creation Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div id="tour-period-form-modal" className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-subtle dark:border-subtle-dark relative">
            
            {tourStep === 7 && (
               <div className="bg-amber-500/10 border-b border-amber-500/30 p-4 text-amber-600 dark:text-amber-400 flex items-start gap-3">
                 <Sparkles className="shrink-0 mt-0.5" size={18} />
                 <div className="text-sm leading-relaxed">
                   <strong className="font-bold text-amber-700 dark:text-amber-300">Set Up Details</strong><br/>
                   Enter a Period Name (like "September 2026") and select the start and end dates, then click <strong>Create</strong> to continue.
                 </div>
               </div>
            )}

            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">Create Period</h3>
              {tourStep !== 7 && (
                <button onClick={() => setIsPeriodModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors"><X size={18} /></button>
              )}
            </div>
            <div className="p-6">
              <form id="period-form" onSubmit={handleCreatePeriod} className="flex flex-col gap-4">
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
            <div className="p-5 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark flex justify-end gap-3 z-10 relative">
              {tourStep !== 7 && (
                <button type="button" onClick={() => setIsPeriodModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-ink dark:text-muted-dark hover:bg-muted dark:hover:bg-elevated-dark rounded-lg transition-colors">Cancel</button>
              )}
              <button disabled={isProcessing} type="submit" form="period-form" className="px-5 py-2 text-sm font-medium bg-ink hover:bg-ink-soft text-white rounded-lg shadow-sm transition-colors disabled:opacity-50">
                {isProcessing ? 'Generating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member to Period Modal */}
      {isAddPeriodMemberModalOpen && selectedPeriod && (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden border border-subtle dark:border-subtle-dark">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold text-lg">Add Members to Period</h3>
              <button disabled={isProcessing} onClick={() => setAddPeriodMemberModalOpen(false)} className="p-1.5 text-faint hover:bg-muted dark:hover:bg-elevated-dark rounded-full transition-colors disabled:opacity-50"><X size={18}/></button>
            </div>

            <div className="p-4 border-b border-subtle dark:border-subtle-dark">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                <input disabled={isProcessing} type="text" placeholder={t('search_players')} value={periodMemberSearch} onChange={(e) => setPeriodMemberSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-app dark:bg-app-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm disabled:opacity-50" autoFocus />
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 bg-surface dark:bg-surface-dark">
              {(() => {
                const available = members.filter(m => !periodPayments.some(p => p.memberId === m.id) && m.name.toLowerCase().includes(periodMemberSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
                if (available.length === 0) return <div className="p-8 text-center text-muted-ink">{t('no_players')}</div>;
                return available.map(member => (
                  <div key={member.id} className={`flex items-center p-3 hover:bg-app dark:hover:bg-elevated-dark/50 rounded-xl cursor-pointer transition-colors ${isProcessing ? 'pointer-events-none opacity-50' : ''}`} onClick={() => toggleSelectPeriodMember(member.id)}>
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPeriodMembers.includes(member.id) ? 'bg-ink border-ink text-white' : 'border-default dark:border-strong-dark'}`}>
                        {selectedPeriodMembers.includes(member.id) && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{member.name}</div>
                        <div className="text-xs text-muted-ink mt-0.5">{member.skillLevel}</div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="p-4 border-t border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <button onClick={handleAddSelectedPeriodMembers} disabled={selectedPeriodMembers.length === 0 || isProcessing} className="w-full py-3 text-sm font-medium text-white bg-ink hover:bg-ink-soft rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {t('add_selected').replace('{{count}}', selectedPeriodMembers.length.toString())}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}