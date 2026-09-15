import React, { useState } from 'react';
import { Search, UserPlus, Plus, Info, Pause, Check, X, ChevronDown } from 'lucide-react';
import { getGradeColor } from '../utils';

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
  
  // Track which player's grade is currently being edited
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);

  // Custom Popover for Grade Selection
  const renderGradePicker = (member: any, index: number, total: number) => {
    // Smart positioning: If we are near the bottom of the list, open the menu UPWARDS so it doesn't get cut off
    const isNearBottom = total > 3 && index >= total - 2;

    return (
      <div className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingGradeId(editingGradeId === member.id ? null : member.id);
          }}
          disabled={isProcessing}
          className={`flex items-center gap-1 text-[10px] border px-2 py-1 rounded-md font-mono font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${getGradeColor(member.skillLevel)}`}
          title="Click to edit grade"
        >
          {member.skillLevel}
          <ChevronDown size={12} className="opacity-70" />
        </button>

        {editingGradeId === member.id && (
          <>
            {/* Invisible backdrop to catch outside clicks and close the menu */}
            <div className="fixed inset-0 z-40" onClick={() => setEditingGradeId(null)}></div>
            
            {/* Floating Menu */}
            <div 
              className={`absolute ${isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 sm:left-1/2 sm:-translate-x-1/2 w-36 bg-surface dark:bg-zinc-900 border border-subtle dark:border-zinc-700 rounded-xl shadow-2xl z-50 flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200`}
            >
              <div className="px-2 py-1.5 text-[9px] font-bold text-muted-ink dark:text-zinc-400 uppercase tracking-widest border-b border-subtle dark:border-zinc-800 mb-1.5">
                Update Grade
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => {
                  const isSelected = member.skillLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => {
                        handleUpdateGrade(member.id, lvl);
                        setEditingGradeId(null);
                      }}
                      className={`py-1.5 text-xs font-black rounded-lg transition-colors flex items-center justify-center border ${
                        isSelected 
                          ? 'bg-ink border-ink text-white shadow-sm' 
                          : 'bg-transparent border-transparent hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-white'
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
    <div className="animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-bold shrink-0">{t('attendance')} <span className="text-faint ml-1">({visibleAttendances.length})</span></h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint dark:text-muted-ink" size={16} />
            <input type="text" placeholder={t('search_players')} value={attendanceSearch} onChange={(e) => setAttendanceSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm"/>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button onClick={openWalkInModal} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-muted hover:bg-elevated dark:bg-elevated-dark dark:hover:bg-strong-dark text-primary dark:text-primary-dark px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <UserPlus size={16}/> {t('add_walk_in')}
            </button>
            <button onClick={openAttendeeModal} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-ink hover:bg-ink-soft text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus size={16}/> {t('add_attendee')}
            </button>
          </div>
        </div>
      </div>

      {session?.sessionType === 'sparring' && (
        <div className="flex gap-4 mb-4 border-b border-subtle dark:border-subtle-dark">
          <button onClick={() => setAttendanceTeamTab('home')} className={`pb-3 font-bold text-sm transition-colors border-b-2 ${attendanceTeamTab === 'home' ? 'border-ink text-ink dark:text-ink-dark' : 'border-transparent text-muted-ink hover:text-primary dark:hover:text-faint'}`}>
            {communityData?.name} (Home)
          </button>
          <button onClick={() => setAttendanceTeamTab('away')} className={`pb-3 font-bold text-sm transition-colors border-b-2 ${attendanceTeamTab === 'away' ? 'border-ink text-ink dark:text-ink-dark' : 'border-transparent text-muted-ink hover:text-primary dark:hover:text-faint'}`}>
            {session?.opposingCommunityName || 'Away Team'} (Away)
          </button>
        </div>
      )}
      
      {/* Desktop Table View */}
      <div className="hidden sm:block bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark text-xs uppercase text-muted-ink font-semibold">
            <tr>
              <th className="p-4 rounded-tl-xl">Player</th>
              <th className="p-4">{t('arrived_at')}</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
            {visibleAttendances.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted-ink">{t('no_players')}</td></tr> : 
             visibleAttendances.map(({ attendance, member }: any, index: number) => (
              <tr key={attendance.id} className="hover:bg-app dark:hover:bg-elevated-dark/30 group">
                <td className="p-4">
                  <div className="font-medium text-sm flex items-center gap-2 hover:text-ink dark:hover:text-ink-dark transition-colors cursor-pointer w-max" onClick={() => setPlayerDetailModal(member.id)}>
                    {member.name} {attendance.isWalkIn && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">W-IN</span>}
                    <Info size={14} className="text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-2">
                    {renderGradePicker(member, index, visibleAttendances.length)}
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-ink">{new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                    {attendance.status === 'active' ? t('status_active') : t('resting')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {attendance.status === 'active' ? (
                      <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'resting')} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 rounded-lg transition-colors disabled:opacity-50" title={t('mark_resting')}><Pause size={16}/></button>
                    ) : (
                      <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'active')} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors disabled:opacity-50" title={t('mark_active')}><Check size={16}/></button>
                    )}
                    <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'cancelled')} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-lg transition-colors disabled:opacity-50" title={t('cancel_attendance')}><X size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden flex flex-col gap-3">
        {visibleAttendances.length === 0 ? <div className="p-8 text-center text-muted-ink border border-subtle dark:border-subtle-dark rounded-xl">{t('no_players')}</div> : 
         visibleAttendances.map(({ attendance, member }: any, index: number) => (
          <div key={attendance.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <div className="font-bold text-sm flex items-center gap-2 hover:text-ink transition-colors cursor-pointer w-max" onClick={() => setPlayerDetailModal(member.id)}>
                {member.name} {attendance.isWalkIn && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">W-IN</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {renderGradePicker(member, index, visibleAttendances.length)}
                <span className="text-xs text-muted-ink font-medium">• {t('arrived_at')} {new Date(attendance.arrivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${attendance.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                {attendance.status === 'active' ? t('status_active') : t('resting')}
              </span>
              <div className="flex gap-1.5">
                {attendance.status === 'active' ? (
                  <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'resting')} className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-md disabled:opacity-50" title={t('mark_resting')}><Pause size={14}/></button>
                ) : (
                  <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'active')} className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-md disabled:opacity-50" title={t('mark_active')}><Check size={14}/></button>
                )}
                <button disabled={isProcessing} onClick={() => updateAttendanceStatus(attendance.id, 'cancelled')} className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-md disabled:opacity-50" title={t('cancel_attendance')}><X size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};