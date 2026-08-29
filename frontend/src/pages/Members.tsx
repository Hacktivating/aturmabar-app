import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Check, ArrowUpDown, Zap, Globe, Sun, Moon, Settings, LogOut, ArrowLeft, Phone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

interface Member {
  id: number;
  name: string;
  phone: string;
  gender: string;
  skillLevel: string;
  avoidPartnerIds: number[]; // FIXED: Removed extra 's'
  avoidOpponentIds: number[]; // FIXED: Removed extra 's'
  status: string;
}

const SKILL_LEVELS = [
  { id: 'A1', label: 'A1 - Pro', color: 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' },
  { id: 'A2', label: 'A2 - Advanced', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  { id: 'B1', label: 'B1 - Upper Intermediate', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { id: 'B2', label: 'B2 - Lower Intermediate', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' },
  { id: 'C1', label: 'C1 - Beginner', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { id: 'C2', label: 'C2 - Newbie', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400' }
];

const inputStyles = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all";
const labelStyles = "block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300";

const SearchableMultiSelect = ({ options, value, onChange, placeholder }: { options: Member[], value: number[], onChange: (val: number[]) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: number) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`${inputStyles} cursor-text min-h-[42px] flex flex-wrap gap-1 items-center`}>
        {value.length === 0 ? <span className="text-slate-400">{placeholder}</span> : 
          value.map(id => {
            const opt = options.find(o => o.id === id);
            return opt ? <span key={id} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs flex items-center gap-1">{opt.name} <X size={12} className="cursor-pointer hover:text-rose-500" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}/></span> : null;
          })
        }
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          <div className="sticky top-0 p-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-sm rounded outline-none border border-slate-200 dark:border-slate-700"/>
          </div>
          {filtered.length === 0 ? <div className="p-3 text-sm text-slate-500 text-center">No players found</div> : 
            filtered.map(opt => (
              <div key={opt.id} onClick={() => toggleSelect(opt.id)} className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between">
                <span>{opt.name}</span>
                {value.includes(opt.id) && <Check size={16} className="text-blue-500"/>}
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
  
  const [communityData, setCommunityData] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{key: 'name' | 'skillLevel', direction: 'asc' | 'desc'} | null>({ key: 'name', direction: 'asc' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    // FIXED: Matched exact keys from backend
    name: '', phone: '', gender: 'male', skillLevel: 'C1', avoidPartnerIds: [] as number[], avoidOpponentIds: [] as number[], status: 'active'
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
      const [membersRes, userRes] = await Promise.all([
        api.get('/members'),
        api.get('/users/me')
      ]);
      setMembers(membersRes.data);
      setCommunityData(userRes.data.community);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitializationData(); }, []);

  let processedMembers = members.filter(m => 
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.phone && m.phone.includes(searchQuery))) &&
    (filterLevel === 'all' || m.skillLevel === filterLevel)
  );

  if (sortConfig !== null) {
    processedMembers.sort((a, b) => {
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
    setIsEditMode(false); setTargetId(null);
    setFormData({ name: '', phone: '', gender: 'male', skillLevel: 'C1', avoidPartnerIds: [], avoidOpponentIds: [], status: 'active' });
    setIsModalOpen(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const openEditModal = (member: Member) => {
    setIsEditMode(true); setTargetId(member.id);
    // FIXED: Now hydrating form with precise keys
    setFormData({ 
        name: member.name, 
        phone: member.phone || '', 
        gender: member.gender || 'male', 
        skillLevel: member.skillLevel, 
        avoidPartnerIds: member.avoidPartnerIds || [], 
        avoidOpponentIds: member.avoidOpponentIds || [], 
        status: member.status 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && targetId) await api.put(`/members/${targetId}`, formData);
      else await api.post('/members', formData);
      setIsModalOpen(false);
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err: any) { alert(err.response?.data?.error || t('op_failed')); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('del_member_confirm'))) return;
    try { 
      await api.delete(`/members/${id}`); 
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) { alert(t('delete_failed')); }
  };

  const getBadgeStyle = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.color || 'bg-slate-100 text-slate-700';
  const getBadgeLabel = (levelId: string) => SKILL_LEVELS.find(s => s.id === levelId)?.label || levelId;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 sm:px-8  py-4">
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('roster_management')}</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder={t('search_members')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm"/>
            </div>
            <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none font-medium">
              <option value="all">{t('all_levels')}</option>
              {SKILL_LEVELS.map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
            </select>
          </div>
          <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0">
            <Plus size={16} /> {t('add_player')}
          </button>
        </div>

        {/* Data Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8">{t('loading')}</div>
          ) : paginatedMembers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8">{t('no_players')}</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('name')}>
                        <div className="flex items-center gap-2">{t('name')} <ArrowUpDown size={14} className="text-slate-400"/></div>
                      </th>
                      <th className="p-4">{t('gender')}</th>
                      <th className="p-4">{t('phone')}</th>
                      <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('skillLevel')}>
                        <div className="flex items-center gap-2">{t('skill_level')} <ArrowUpDown size={14} className="text-slate-400"/></div>
                      </th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {paginatedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-medium text-sm">{member.name}</td>
                        <td className="p-4 text-sm font-medium">
                          {member.gender === 'male' ? (
                            <span className="text-blue-500 flex items-center gap-1.5">♂ {t('male')}</span>
                          ) : (
                            <span className="text-pink-500 flex items-center gap-1.5">♀ {t('female')}</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-500">{member.phone || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap ${getBadgeStyle(member.skillLevel)}`}>
                            {getBadgeLabel(member.skillLevel)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(member)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(member.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col flex-1 divide-y divide-slate-100 dark:divide-slate-800/50 overflow-y-auto">
                {paginatedMembers.map((member) => (
                  <div key={member.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-sm">{member.name}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(member)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {member.gender === 'male' ? (
                        <span className="text-blue-500 font-medium flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">♂ {t('male')}</span>
                      ) : (
                        <span className="text-pink-500 font-medium flex items-center gap-1.5 bg-pink-50 dark:bg-pink-900/20 px-2 py-1 rounded">♀ {t('female')}</span>
                      )}
                      <span className={`px-2 py-1 rounded font-bold tracking-wide ${getBadgeStyle(member.skillLevel)}`}>
                        {getBadgeLabel(member.skillLevel)}
                      </span>
                    </div>

                    {member.phone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Phone size={12} className="text-slate-400"/> {member.phone}
                      </div>
                    )}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg">{isEditMode ? t('edit_player') : t('add_player')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="member-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>{t('name')}</label>
                    <input 
                        ref={nameInputRef}
                        type="text" 
                        required 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className={inputStyles} 
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>{t('phone')} <span className="font-normal text-slate-400">({t('optional')})</span></label>
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
                        {SKILL_LEVELS.map(lvl => (
                          <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* PAIRING RESTRICTIONS SECTION */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('pairing_restrictions')}</h4>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={labelStyles}>{t('avoid_partner')}</label>
                      <SearchableMultiSelect 
                        options={members.filter(m => m.id !== targetId)} 
                        value={formData.avoidPartnerIds} 
                        onChange={val => setFormData({...formData, avoidPartnerIds: val})} 
                        placeholder={t('search_restrict')} 
                      />
                    </div>
                    <div>
                      <label className={labelStyles}>{t('avoid_opponent')}</label>
                      <SearchableMultiSelect 
                        options={members.filter(m => m.id !== targetId)} 
                        value={formData.avoidOpponentIds} 
                        onChange={val => setFormData({...formData, avoidOpponentIds: val})} 
                        placeholder={t('search_restrict')} 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">{t('cancel')}</button>
              <button type="submit" form="member-form" className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">{t('save_player')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}