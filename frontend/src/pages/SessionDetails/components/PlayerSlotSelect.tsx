import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, Search, ArrowRightLeft } from 'lucide-react';
import { getGradeColor } from '../utils';

export const PlayerSlotSelect = ({ options, value, onChange, placeholder, currentName, currentGrade, swaps, onSwap, t }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt: any) => opt.name.toLowerCase().includes(search.toLowerCase()));
  const selectedOpt = options.find((o: any) => o.id === value);
  const displayName = selectedOpt?.name || currentName;
  const displayGrade = selectedOpt?.skillLevel || currentGrade;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${value === 0 && !currentName ? 'border-dashed border-default dark:border-strong-dark bg-transparent hover:bg-muted dark:hover:bg-elevated-dark/50' : 'border-solid border-subtle dark:border-subtle-dark bg-surface dark:bg-app-dark shadow-sm hover:border-ink dark:hover:border-ink'}`}>
        {value === 0 && !currentName ? (
          <div className="flex items-center gap-2 text-muted-ink"><Plus size={16} /> <span className="font-medium text-xs">{placeholder}</span></div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0"><div className="font-bold text-xs truncate text-primary dark:text-primary-dark">{displayName}</div></div>
            <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${getGradeColor(displayGrade)}`}>{displayGrade || '-'}</span>
            <ChevronDown size={14} className="text-faint shrink-0 ml-1" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 z-[100] w-full bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-2xl flex flex-col max-h-72 overflow-hidden ring-1 ring-black/5">
          <div className="p-2 border-b border-subtle dark:border-subtle-dark shrink-0 bg-app dark:bg-app-dark">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={14} />
              <input type="text" placeholder={t('search_players_to_select', 'Search players...')} value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface dark:bg-surface-dark pl-9 pr-3 py-2 text-xs rounded-lg outline-none border border-subtle dark:border-subtle-dark text-primary dark:text-primary-dark" autoFocus />
            </div>
          </div>
          <div className="p-1 overflow-y-auto flex-1 bg-surface dark:bg-surface-dark divide-y divide-slate-100 dark:divide-[#1E293B]">
            <div className="py-1">
              <div onClick={() => { onChange(0); setIsOpen(false); setSearch(''); }} className="px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer font-bold text-center transition-colors">
                {t('remove_player', '- Remove Player -')}
              </div>
            </div>
            {swaps && swaps.length > 0 && (
              <div className="py-1">
                {swaps.filter((s: any) => s.id !== 0 && s.id !== value).map((s: any) => (
                  <div key={`swap-${s.id}`} onClick={() => { onSwap(s.id); setIsOpen(false); }} className="px-3 py-2 text-xs text-ink dark:text-ink-dark hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded-lg cursor-pointer flex items-center gap-2 font-bold transition-colors">
                    <ArrowRightLeft size={12} /> {t('swap_with', 'Swap with')} {s.name}
                  </div>
                ))}
              </div>
            )}
            <div className="py-1">
              {filtered.length === 0 ? <div className="p-3 text-xs text-muted-ink text-center font-medium">No players found</div> : 
                filtered.map((opt: any) => (
                  <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }} className="px-3 py-2.5 text-xs hover:bg-app dark:hover:bg-elevated-dark/50 rounded-lg cursor-pointer flex items-center justify-between transition-colors">
                    <span className="truncate mr-2 text-primary dark:text-primary-dark font-bold">{opt.name}</span>
                    <span className={`text-[9px] border px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${getGradeColor(opt.skillLevel)}`}>{opt.skillLevel}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};