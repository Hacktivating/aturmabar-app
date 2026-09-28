import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Plus, Info, Pause, Check, X, ChevronDown, ArrowUpDown } from 'lucide-react';

const SKILL_LEVELS = [
  { id: 'A1', label: 'A1 - Pro', color: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700' },
  { id: 'A2', label: 'A2 - Advanced', color: 'bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60' },
  { id: 'B1', label: 'B1 - Upper Intermediate', color: 'bg-blue-50 text-blue-700 dark:bg-[#172554]/60 dark:text-[#93c5fd] border border-blue-200 dark:border-blue-800/60' },
  { id: 'B2', label: 'B2 - Lower Intermediate', color: 'bg-teal-50 text-teal-700 dark:bg-[#042f2e]/60 dark:text-[#5eead4] border border-teal-200 dark:border-teal-800/60' },
  { id: 'C1', label: 'C1 - Beginner', color: 'bg-emerald-50 text-emerald-700 dark:bg-[#022c22]/60 dark:text-[#6ee7b7] border border-emerald-200 dark:border-emerald-800/60' },
  { id: 'C2', label: 'C2 - Newbie', color: 'bg-lime-50 text-lime-700 dark:bg-[#3f6212]/40 dark:text-[#d9f99d] border border-lime-200 dark:border-lime-800/60' }
];

const getBadgeStyle = (levelId?: string) => {
  const shortId = levelId ? levelId.split(' ')[0] : 'C1';
  return SKILL_LEVELS.find(s => s.id === shortId)?.color || 'bg-muted text-primary-soft dark:bg-zinc-800 dark:text-zinc-400 border border-transparent dark:border-zinc-700';
};

export const AttendanceTab = ({
  visibleAttendances,
  session,
  communityData,
  attendanceTeamTab,
  setAttendanceTeamTab,
  attendanceSearch,
  setAttendanceSearch,
  openWalkInModal,
  openAttendeeModal,
  setPlayerDetailModal,
  handleUpdateGrade,
  updateAttendanceStatus,
  isProcessing,
  t
}: any) => {
  
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  
  // Sorting State - Defaults to Arrival Time (Oldest First)
  const [sortConfig, setSortConfig] = useState({ key: 'arrivedAt', direction: 'asc' });

  // Compute Sorted List Dynamically
  const sortedAttendances = useMemo(() => {
    let sortable = [...visibleAttendances];
    sortable.sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.member.name.localeCompare(b.member.name)
          : b.member.name.localeCompare(a.member.name);
      }
      if (sortConfig.key === 'grade') {
        const gradeA = a.member.skillLevel || 'C1';
        const gradeB = b.member.skillLevel || 'C1';
        return sortConfig.direction === 'asc'
          ? gradeA.localeCompare(gradeB)
          : gradeB.localeCompare(gradeA);
      }
      if (sortConfig.key === 'arrivedAt') {
        const dateA = new Date(a.attendance.arrivedAt).getTime();
        const dateB = new Date(b.attendance.arrivedAt).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    return sortable;
  }, [visibleAttendances, sortConfig]);

  const renderGradePicker = (member: any, index: number, total: number) => {
    const isNearBottom = total > 4 && index >= total - 3;
    const shortGrade = member.skillLevel ? member.skillLevel.split(' ')[0] : 'C1';

    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditingGradeId(editingGradeId === member.id ? null : member.id);
          }}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-black tracking-widest uppercase cursor-pointer transition-all hover:scale-105 active:scale-95 ${getBadgeStyle(member.skillLevel)}`}
          title="Click to edit grade"
        >
          {shortGrade}
          <ChevronDown size={12} className="opacity-70" />
        </button>

        {editingGradeId === member.id && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setEditingGradeId(null)}></div>
            <div 
              className={`absolute ${isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-32 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col p-2 animate-in fade-in zoom-in-95 duration-200`}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest border-b border-subtle dark:border-zinc-800 mb-1.5 pb-1.5 text-center">
                Select Grade
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => {
                  const isSelected = shortGrade === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateGrade(member.id, lvl);
                        setEditingGradeId(null);
                      }}
                      className={`py-1.5 text-xs font-black rounded-lg transition-colors flex items-center justify-center border shadow-sm ${
                        isSelected 
                          ? 'bg-ink border-ink text-white dark:bg-white dark:border-white dark:text-zinc-900' 
                          : 'bg-app dark:bg-[#121214] border-subtle dark:border-zinc-800 hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-200 flex flex-col h-full bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Tab Header & Controls */}
      <div className="p-4 sm:p-6 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#121214] shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3 shrink-0">
              <h2 className="text-xl sm:text-2xl font-black text-primary dark:text-white tracking-tight">{t('attendance', 'Attendance')}</h2>
              <span className="bg-muted dark:bg-[#18181b] border border-subtle dark:border-zinc-800 text-muted-ink dark:text-zinc-400 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">{visibleAttendances.length}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-48 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={16} />
                <input type="text" placeholder={t('search_players', 'Search...')} value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-medium text-primary dark:text-white transition-all"/>
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative shrink-0">
                <select 
                   value={`${sortConfig.key}-${sortConfig.direction}`}
                   onChange={(e) => {
                     const [key, dir] = e.target.value.split('-');
                     setSortConfig({ key, direction: dir });
                   }}
                   className="appearance-none pl-8 pr-8 py-2.5 sm:py-3 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-bold text-primary dark:text-white transition-all cursor-pointer"
                >
                  <option value="arrivedAt-asc">Time (First)</option>
                  <option value="arrivedAt-desc">Time (Last)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="grade-asc">Grade (High-Low)</option>
                  <option value="grade-desc">Grade (Low-High)</option>
                </select>
                <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto shrink-0">
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); openWalkInModal(); }} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-muted dark:bg-[#18181b] dark:hover:bg-zinc-800 border border-subtle dark:border-zinc-700 text-primary dark:text-white px-4 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <UserPlus size={16}/> <span>{t('add_walk_in', 'Add Walk-In')}</span>
              </button>
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); openAttendeeModal(); }} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-5 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus size={16}/> <span>{t('add_attendee', 'Add Attendee')}</span>
              </button>
            </div>
          </div>
        </div>

        {session?.sessionType === 'sparring' && (
          <div className="flex gap-6 mt-5 pt-5 border-t border-subtle dark:border-zinc-800 px-4 sm:px-6">
            <button type="button" onClick={() => setAttendanceTeamTab('home')} className={`pb-2.5 font-bold text-sm transition-colors border-b-2 cursor-pointer ${attendanceTeamTab === 'home' ? 'border-ink text-primary dark:border-white dark:text-white' : 'border-transparent text-muted-ink hover:text-ink dark:text-zinc-500 dark:hover:text-zinc-300'}`}>
              {communityData?.name} (Home)
            </button>
            <button type="button" onClick={() => setAttendanceTeamTab('away')} className={`pb-2.5 font-bold text-sm transition-colors border-b-2 cursor-pointer ${attendanceTeamTab === 'away' ? 'border-ink text-primary dark:border-white dark:text-white' : 'border-transparent text-muted-ink hover:text-ink dark:text-zinc-500 dark:hover:text-zinc-300'}`}>
              {session?.opposingCommunityName || 'Away Team'} (Away)
            </button>
          </div>
        )}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800 sticky top-0 z-10">
            <tr className="text-xs uppercase tracking-widest text-muted-ink dark:text-zinc-400 font-bold">
              <th className="p-4 pl-6">{t('player', 'PLAYER')}</th>
              <th className="p-4">{t('arrived_at', 'ARRIVED AT')}</th>
              <th className="p-4">{t('status', 'STATUS')}</th>
              <th className="p-4 text-right pr-6">{t('actions', 'ACTIONS')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {sortedAttendances.length === 0 ? <tr><td colSpan={4} className="p-12 text-center text-muted-ink dark:text-zinc-500 font-medium">No players found</td></tr> : 
             sortedAttendances.map(({ attendance, member }: any, index: number) => (
              <tr key={attendance.id} className="hover:bg-app dark:hover:bg-white/5 transition-colors group">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-4">
                    <span 
                      className="font-bold text-base text-primary dark:text-zinc-100 hover:text-ink dark:hover:text-white transition-colors cursor-pointer truncate max-w-[220px]" 
                      onClick={(e) => { e.preventDefault(); setPlayerDetailModal(member.id); }}
                    >
                      {member.name}
                    </span>
                    {attendance.isWalkIn && <span className="bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase shrink-0">W-IN</span>}
                    {renderGradePicker(member, index, sortedAttendances.length)}
                  </div>
                </td>
                <td className="p-4 text-sm font-medium text-muted-ink dark:text-zinc-400">{new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td className="p-4">
                  <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest uppercase border ${attendance.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                    {attendance.status === 'active' ? t('status_active', 'ACTIVE') : t('resting', 'RESTING')}
                  </span>
                </td>
                <td className="p-4 text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setPlayerDetailModal(member.id); }} 
                      className="p-2 text-muted-ink dark:text-zinc-400 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-700 hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white rounded-lg transition-colors cursor-pointer shadow-sm" 
                      title="Player Details"
                    >
                      <Info size={18}/>
                    </button>
                    {attendance.status === 'active' ? (
                      <button type="button" disabled={isProcessing} onClick={(e) => { e.preventDefault(); updateAttendanceStatus(attendance.id, 'resting'); }} className="p-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm" title={t('mark_resting', 'Mark Resting')}><Pause size={18}/></button>
                    ) : (
                      <button type="button" disabled={isProcessing} onClick={(e) => { e.preventDefault(); updateAttendanceStatus(attendance.id, 'active'); }} className="p-2 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm" title={t('mark_active', 'Mark Active')}><Check size={18}/></button>
                    )}
                    <button type="button" disabled={isProcessing} onClick={(e) => { e.preventDefault(); updateAttendanceStatus(attendance.id, 'cancelled'); }} className="p-2 text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm" title={t('cancel_attendance', 'Cancel Attendance')}><X size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile High-Density Card View */}
      <div className="sm:hidden flex flex-col divide-y divide-slate-100 dark:divide-zinc-800/50">
        {sortedAttendances.length === 0 ? <div className="p-10 text-center text-muted-ink dark:text-zinc-500 font-medium">{t('no_players', 'No players found')}</div> : 
         sortedAttendances.map(({ attendance, member }: any, index: number) => (
          <div key={attendance.id} className="p-3 hover:bg-app dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-2">
            
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span 
                  className="font-bold text-sm text-primary dark:text-zinc-100 truncate cursor-pointer hover:underline" 
                  onClick={(e) => { e.preventDefault(); setPlayerDetailModal(member.id); }}
                >
                  {member.name}
                </span>
                {attendance.isWalkIn && <span className="bg-purple-50 text-purple-700 dark:bg-[#3b0764]/60 dark:text-[#d8b4fe] border border-purple-200 dark:border-purple-800/60 px-1 py-0.5 rounded text-[8px] font-bold uppercase shrink-0">W-IN</span>}
              </div>
              <div className="flex items-center gap-2">
                {renderGradePicker(member, index, sortedAttendances.length)}
                <span className="text-[11px] text-muted-ink dark:text-zinc-500 font-medium">
                  • {new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${attendance.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                {attendance.status === 'active' ? t('status_active', 'ACTIVE') : t('resting', 'RESTING')}
              </span>
              <div className="flex gap-1.5">
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); setPlayerDetailModal(member.id); }} 
                  className="p-1.5 text-muted-ink dark:text-zinc-400 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-700 rounded-md transition-colors shadow-sm cursor-pointer"
                >
                  <Info size={14}/>
                </button>
                {attendance.status === 'active' ? (
                  <button type="button" disabled={isProcessing} onClick={(e) => { e.preventDefault(); updateAttendanceStatus(attendance.id, 'resting'); }} className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-md disabled:opacity-50 cursor-pointer shadow-sm"><Pause size={14}/></button>
                ) : (
                  <button type="button" disabled={isProcessing} onClick={(e) => { e.preventDefault(); updateAttendanceStatus(attendance.id, 'active'); }} className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md disabled:opacity-50 cursor-pointer shadow-sm"><Check size={14}/></button>
                )}
                <button type="button" disabled={isProcessing} onClick={(e) => { e.preventDefault(); updateAttendanceStatus(attendance.id, 'cancelled'); }} className="p-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-md disabled:opacity-50 cursor-pointer shadow-sm"><X size={14}/></button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};