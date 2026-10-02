import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, ChevronDown, Search } from 'lucide-react';

type PlayerOption = {
  id: number;
  name: string;
  skillLevel?: string | null;
  gamesPlayed?: number;
  gradeDistance?: number | null;
  recommended?: boolean;
};

type PlayerSlotSelectProps = {
  id?: string;
  options: PlayerOption[];
  value: number;
  currentName?: string;
  currentGrade?: string | null;
  swaps?: { id: number; name: string }[];
  onSwap?: (id: number) => void;
  onChange: (id: number) => void;
  placeholder: string;
  t?: (key: string, options?: { defaultValue?: string }) => unknown;
};

type MenuPosition = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

export const PlayerSlotSelect = ({
  id, options, value, currentName, currentGrade, swaps = [], onSwap, onChange, placeholder, t,
}: PlayerSlotSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const translate = (key: string, fallback: string) => String(t?.(key, { defaultValue: fallback }) ?? fallback);

  const positionMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const belowSpace = Math.max(0, window.innerHeight - rect.bottom - gap);
    const aboveSpace = Math.max(0, rect.top - gap);
    const opensAbove = belowSpace < 260 && aboveSpace > belowSpace;
    const availableSpace = opensAbove ? aboveSpace : belowSpace;

    setMenuPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
      ...(opensAbove ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
      maxHeight: Math.max(150, Math.min(320, availableSpace)),
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    positionMenu();
    const handleViewportChange = () => positionMenu();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!dropdownRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return options.filter(option => option.name.toLowerCase().includes(query));
  }, [options, searchTerm]);

  const closeAndClear = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const menu = isOpen && menuPosition ? (
    <div
      ref={menuRef}
      className="fixed bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-2xl z-[10000] overflow-hidden flex flex-col"
      style={{
        left: menuPosition.left,
        width: menuPosition.width,
        ...(menuPosition.top !== undefined ? { top: menuPosition.top } : { bottom: menuPosition.bottom }),
      }}
    >
      <div className="p-3 border-b border-subtle dark:border-zinc-800/60 bg-app dark:bg-[#121214]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={14} />
          <input
            type="search"
            aria-label={translate('search_players_to_select', 'Search players to select')}
            placeholder={translate('search_players_to_select', 'Search players to select...')}
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-surface dark:bg-[#1a1a1c] border border-subtle dark:border-zinc-800 rounded-lg outline-none focus:border-ink dark:focus:border-zinc-600 text-xs font-bold text-primary dark:text-white transition-colors"
            autoFocus
          />
        </div>
      </div>

      <div className="overflow-y-auto p-1.5 flex flex-col gap-0.5" style={{ maxHeight: menuPosition.maxHeight }} role="listbox">
        <button
          type="button"
          onClick={() => { onChange(0); closeAndClear(); }}
          className="w-full text-center py-3 text-xs font-black tracking-wide text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-[#1a1a1c] transition-colors rounded-lg mb-1"
        >
          {translate('remove_player', '– Remove Player –')}
        </button>

        {swaps.length > 0 && (
          <div className="flex flex-col border-b border-subtle dark:border-zinc-800/60 pb-1.5 mb-1.5">
            {swaps.map(swap => (
              <button
                key={`swap-${swap.id}`}
                type="button"
                onClick={() => { onSwap?.(swap.id); closeAndClear(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-app dark:hover:bg-[#1a1a1c] transition-colors rounded-lg text-left"
              >
                <ArrowRightLeft size={14} className="text-muted-ink dark:text-zinc-400 shrink-0" />
                <span className="text-sm font-bold text-primary dark:text-zinc-200 truncate">{translate('swap_with', 'Swap with')} {swap.name}</span>
              </button>
            ))}
          </div>
        )}

        {filteredOptions.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs font-bold text-muted-ink dark:text-zinc-500">{translate('no_players_found', 'No players found')}</div>
        ) : filteredOptions.map(option => (
          <button
            key={`opt-${option.id}`}
            type="button"
            role="option"
            aria-selected={option.id === value}
            onClick={() => { onChange(option.id); closeAndClear(); }}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-app dark:hover:bg-[#1a1a1c] transition-colors rounded-lg text-left group ${option.recommended ? 'bg-accent-soft/50 dark:bg-white/[0.04]' : ''}`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-primary dark:text-zinc-200 truncate group-hover:text-ink dark:group-hover:text-white transition-colors">{option.name}</span>
              {option.recommended && <span className="block text-[10px] font-semibold text-muted-ink dark:text-zinc-500 mt-0.5">{translate('recommended_fair_match', 'Recommended fair match')}</span>}
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 tabular-nums">{option.gamesPlayed ?? 0} {translate('played_short', 'played')}</span>
              {option.skillLevel && <span className="bg-surface dark:bg-[#18181b] text-muted-ink dark:text-zinc-400 border border-subtle dark:border-zinc-700 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase">{option.skillLevel}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative w-full" ref={dropdownRef} data-player-slot={id}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => { setIsOpen(open => !open); setSearchTerm(''); }}
        className="w-full min-h-14 flex items-center justify-between gap-3 px-4 py-3.5 bg-app dark:bg-[#121214] hover:bg-muted dark:hover:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-white shadow-sm"
      >
        <span className={`font-bold text-sm truncate text-left ${value ? 'text-primary dark:text-zinc-100' : 'text-muted-ink dark:text-zinc-500'}`}>
          {value ? currentName : placeholder}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {value && currentGrade && (
            <span className="bg-surface dark:bg-[#18181b] text-muted-ink dark:text-zinc-300 border border-subtle dark:border-zinc-700 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase">
              {currentGrade}
            </span>
          )}
          <ChevronDown size={16} className={`text-muted-ink dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {menu && createPortal(menu, document.body)}
    </div>
  );
};
