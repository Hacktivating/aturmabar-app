import React from 'react';
import { Plus, GripVertical, Check, X, Edit2, Trash2 } from 'lucide-react';

export const CourtsTab = ({
  courts,
  editCourtId,
  setEditCourtId,
  courtName,
  setCourtName,
  handleAddCourt,
  handleUpdateCourt,
  setConfirmDeleteCourtId,
  isProcessing,
  t,
  inputStyles
}: any) => {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('courts', 'Courts')}</h2>
        <button 
          type="button" 
          disabled={isProcessing} 
          onClick={handleAddCourt} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ink dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-ink-soft dark:hover:bg-zinc-200 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Plus size={16} /> {t('add_court', 'Add Court')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-ink dark:text-zinc-500 font-medium bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl">
            {t('no_courts', 'No courts added yet.')}
          </div>
        ) : (
          courts.map((court: any) => (
            <div key={court.id} className={`bg-surface dark:bg-[#121214] border ${!court.isActive ? 'border-dashed border-subtle dark:border-zinc-800 opacity-60' : 'border-subtle dark:border-zinc-800'} p-5 rounded-2xl shadow-sm flex flex-col gap-4 transition-all hover:border-ink dark:hover:border-zinc-600`}>
              {editCourtId === court.id ? (
                <div className="flex flex-col gap-3 w-full">
                  <input 
                    type="text" 
                    value={courtName} 
                    onChange={e => setCourtName(e.target.value)} 
                    className={`${inputStyles} py-2 px-3 text-base font-bold w-full`} 
                    autoFocus 
                    disabled={isProcessing}
                  />
                  <div className="flex items-center gap-2 w-full">
                    <button type="button" disabled={isProcessing} onClick={() => handleUpdateCourt(court.id, court.isActive, courtName)} className="flex-1 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-sm"><Check size={16}/></button>
                    <button type="button" disabled={isProcessing} onClick={() => setEditCourtId(null)} className="flex-1 p-2 bg-muted dark:bg-[#18181b] border border-subtle dark:border-zinc-700 text-primary dark:text-white rounded-lg flex items-center justify-center transition-colors hover:bg-subtle dark:hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"><X size={16}/></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <GripVertical size={18} className="text-muted-ink dark:text-zinc-500 cursor-grab shrink-0" />
                    <span className={`font-black text-lg text-primary dark:text-white truncate ${!court.isActive && 'line-through text-muted-ink dark:text-zinc-500'}`}>
                      {court.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-subtle dark:border-zinc-800/50">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input disabled={isProcessing} type="checkbox" className="sr-only peer" checked={court.isActive} onChange={() => handleUpdateCourt(court.id, !court.isActive, court.name)} />
                      <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-[#18181b] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-700 peer-checked:bg-emerald-500 shadow-inner"></div>
                      <span className="ml-3 text-xs font-bold uppercase tracking-widest text-muted-ink dark:text-zinc-500 group-hover:text-primary dark:group-hover:text-zinc-300 transition-colors">
                        {court.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={isProcessing} onClick={() => { setEditCourtId(court.id); setCourtName(court.name); }} className="p-2 text-muted-ink dark:text-zinc-500 hover:text-ink dark:hover:text-white bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"><Edit2 size={14}/></button>
                      <button type="button" disabled={isProcessing} onClick={() => setConfirmDeleteCourtId(court.id)} className="p-2 text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};