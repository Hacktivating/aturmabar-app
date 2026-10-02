import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, ArrowRightLeft } from 'lucide-react';

export const PlayerSlotSelect = ({
  options, value, currentName, currentGrade,
  swaps, onSwap, onChange, placeholder
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Isolate dropdown so clicks outside only close THIS specific dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o: any) => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-app dark:bg-[#121214] hover:bg-muted dark:hover:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl transition-colors outline-none focus:border-ink dark:focus:border-zinc-600 shadow-sm"
      >
        {value ? (
          <span className="font-bold text-sm text-primary dark:text-zinc-100 truncate">{currentName}</span>
        ) : (
          <span className="font-bold text-sm text-muted-ink dark:text-zinc-500 truncate">{placeholder}</span>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {value && currentGrade && (
            <span className="bg-surface dark:bg-[#18181b] text-muted-ink dark:text-zinc-300 border border-subtle dark:border-zinc-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase shadow-sm">
              {currentGrade}
            </span>
          )}
          <ChevronDown size={16} className={`text-muted-ink dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
          
          <div className="p-3 border-b border-subtle dark:border-zinc-800/60 bg-app dark:bg-[#121214]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={14} />
              <input 
                type="text" 
                placeholder="Search players to select..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-surface dark:bg-[#1a1a1c] border border-subtle dark:border-zinc-800 rounded-lg outline-none focus:border-ink dark:focus:border-zinc-600 text-xs font-bold text-primary dark:text-white transition-colors shadow-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            <button 
              type="button" 
              onClick={() => { onChange(0); setIsOpen(false); }}
              className="w-full text-center py-3 text-xs font-black tracking-wide text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-[#1a1a1c] transition-colors rounded-lg mb-1"
            >
              – Remove Player –
            </button>

            {swaps && swaps.length > 0 && (
              <div className="flex flex-col border-b border-subtle dark:border-zinc-800/60 pb-1.5 mb-1.5">
                {swaps.map((s: any) => (
                  <button 
                    key={`swap-${s.id}`} 
                    type="button" 
                    onClick={() => { onSwap(s.id); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-app dark:hover:bg-[#1a1a1c] transition-colors rounded-lg text-left"
                  >
                    <ArrowRightLeft size={14} className="text-muted-ink dark:text-zinc-400 shrink-0" />
                    <span className="text-sm font-bold text-primary dark:text-zinc-200 truncate">Swap with {s.name}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs font-bold text-muted-ink dark:text-zinc-500">No players found</div>
            ) : (
              filteredOptions.map((o: any) => (
                <button 
                  key={`opt-${o.id}`} 
                  type="button" 
                  onClick={() => { onChange(o.id); setIsOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-app dark:hover:bg-[#1a1a1c] transition-colors rounded-lg text-left group"
                >
                  <span className="text-sm font-bold text-primary dark:text-zinc-200 truncate group-hover:text-ink dark:group-hover:text-white transition-colors">{o.name}</span>
                  {o.skillLevel && (
                    <span className="bg-surface dark:bg-[#18181b] text-muted-ink dark:text-zinc-400 border border-subtle dark:border-zinc-700 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase shrink-0 shadow-sm">
                      {o.skillLevel}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};