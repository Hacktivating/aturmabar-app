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
    <div className="animate-in fade-in duration-200 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">{t('courts')}</h2>
        <button disabled={isProcessing} onClick={handleAddCourt} className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <Plus size={16} /> {t('add_court')}
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        {courts.map((court: any) => (
          <div key={court.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between transition-all">
            {editCourtId === court.id ? (
              <div className="flex items-center gap-2 flex-1 mr-4">
                <input type="text" value={courtName} onChange={e => setCourtName(e.target.value)} className={inputStyles} autoFocus disabled={isProcessing}/>
                <button disabled={isProcessing} onClick={() => handleUpdateCourt(court.id, court.isActive, courtName)} className="p-2.5 bg-ink text-white rounded-lg disabled:opacity-50"><Check size={18}/></button>
                <button disabled={isProcessing} onClick={() => setEditCourtId(null)} className="p-2.5 bg-muted dark:bg-elevated-dark rounded-lg disabled:opacity-50"><X size={18}/></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <GripVertical size={20} className="text-muted-ink dark:text-muted-ink cursor-grab" />
                <span className={`font-semibold sm:text-lg ${!court.isActive && 'text-faint line-through'}`}>{court.name}</span>
              </div>
            )}
            
            {editCourtId !== court.id && (
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input disabled={isProcessing} type="checkbox" className="sr-only peer" checked={court.isActive} onChange={() => handleUpdateCourt(court.id, !court.isActive, court.name)} />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer dark:bg-elevated-dark peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-strong-dark peer-checked:bg-emerald-500"></div>
                </label>
                <div className="flex items-center gap-1 border-l border-subtle dark:border-subtle-dark pl-4">
                  <button disabled={isProcessing} onClick={() => { setEditCourtId(court.id); setCourtName(court.name); }} className="p-2 text-faint hover:text-ink rounded-lg transition-colors disabled:opacity-50"><Edit2 size={16}/></button>
                  <button disabled={isProcessing} onClick={() => setConfirmDeleteCourtId(court.id)} className="p-2 text-faint hover:text-rose-600 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={16}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};