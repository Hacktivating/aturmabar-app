import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && isOpen) setViewDate(new Date(value));
  }, [value, isOpen]);

  const openDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const formatDisplayDate = (d: Date | null) => {
    if (!d) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, value ? value.getHours() : 18, value ? value.getMinutes() : 0);
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    const newDate = value ? new Date(value) : new Date(viewDate);
    newDate.setHours(h);
    newDate.setMinutes(m);
    onChange(newDate);
  };

  const dropdownLeft = Math.min(coords.left, window.innerWidth - 340);
  const dropdownTop = coords.top + 400 > window.innerHeight ? coords.top - 420 - (buttonRef.current?.getBoundingClientRect().height || 0) : coords.top;

  return (
    <>
      <div 
        ref={buttonRef} 
        onClick={openDropdown}
        className="relative w-full pl-11 pr-4 py-3 bg-app dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl text-sm font-medium text-primary dark:text-primary-dark cursor-pointer flex items-center justify-between hover:border-ink dark:hover:border-ink transition-colors outline-none focus:ring-2 focus:ring-ink"
      >
        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" size={18} />
        <span className={value ? '' : 'text-muted-ink dark:text-faint'}>
          {value ? formatDisplayDate(value) : 'Select Date & Time'}
        </span>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{ top: dropdownTop, left: dropdownLeft }}
          className="fixed z-[999999] w-[320px] bg-surface dark:bg-zinc-900 border border-subtle dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between p-4 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-black/20">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 text-faint hover:text-ink dark:hover:text-white transition-colors bg-surface dark:bg-zinc-800 rounded-md border border-subtle dark:border-zinc-700 shadow-sm"><ChevronLeft size={16} /></button>
            <span className="font-bold text-sm text-primary dark:text-white uppercase tracking-wider">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 text-faint hover:text-ink dark:hover:text-white transition-colors bg-surface dark:bg-zinc-800 rounded-md border border-subtle dark:border-zinc-700 shadow-sm"><ChevronRight size={16} /></button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[10px] font-black text-faint uppercase tracking-wider">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = value?.getDate() === day && value?.getMonth() === viewDate.getMonth() && value?.getFullYear() === viewDate.getFullYear();
                const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`h-9 w-full rounded-lg text-sm font-medium transition-all ${
                      isSelected 
                        ? 'bg-ink text-white shadow-md font-bold scale-105' 
                        : isToday 
                          ? 'bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink border border-ink/20 font-bold' 
                          : 'text-primary dark:text-primary-dark hover:bg-muted dark:hover:bg-zinc-800'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-subtle dark:border-zinc-800 bg-app dark:bg-black/20 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-faint" />
              <div className="flex-1 relative">
                 <input 
                   type="time" 
                   value={value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : '18:00'}
                   onChange={handleTimeChange}
                   className="w-full bg-surface dark:bg-zinc-800 border border-subtle dark:border-zinc-700 text-primary dark:text-white px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-ink dark:focus:border-ink transition-colors [&::-webkit-calendar-picker-indicator]:dark:invert cursor-pointer"
                 />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-subtle dark:border-zinc-800/50">
              <button type="button" onClick={() => { onChange(null); setIsOpen(false); }} className="text-xs font-bold text-faint hover:text-rose-500 transition-colors">Clear Data</button>
              <button type="button" onClick={() => { onChange(new Date()); setIsOpen(false); }} className="text-xs font-bold text-ink dark:text-ink hover:underline">Select Today</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}