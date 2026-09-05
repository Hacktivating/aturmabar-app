import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select date and time",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(value || new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes externally
  useEffect(() => {
    if (value) setCurrentViewDate(value);
  }, [value]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Generate Calendar Grid
  const days = [];
  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  // Next month padding
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const handleDateClick = (clickedDate: Date) => {
    const newDate = new Date(clickedDate);
    if (value) {
      newDate.setHours(value.getHours(), value.getMinutes());
    } else {
      newDate.setHours(currentViewDate.getHours(), currentViewDate.getMinutes());
    }
    onChange(newDate);
    setCurrentViewDate(newDate);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const newDate = value ? new Date(value) : new Date(currentViewDate);
    if (type === 'hours') newDate.setHours(val);
    else newDate.setMinutes(val);
    onChange(newDate);
  };

  const changeMonth = (increment: number) => {
    setCurrentViewDate(new Date(year, month + increment, 1));
  };

  const formatDisplay = (d: Date | null) => {
    if (!d) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isSelectedDate = (d: Date) => {
    if (!value) return false;
    return d.getDate() === value.getDate() && d.getMonth() === value.getMonth() && d.getFullYear() === value.getFullYear();
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Input Trigger */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-3 bg-[#18181B] border border-zinc-800 rounded-xl cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-700'}`}
      >
        <span className={`text-sm font-medium ${value ? 'text-zinc-100' : 'text-zinc-500'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={18} className="text-zinc-400" />
      </div>

      {/* Popover - Now pops UP and centers on Mobile */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mb-2 z-[99999] flex bg-[#27272A] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-[320px] sm:w-[360px] animate-in fade-in zoom-in-95 duration-200">
          
          {/* LEFT PANE: Calendar */}
          <div className="p-3 sm:p-4 w-[210px] sm:w-[240px] flex flex-col shrink-0">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-zinc-100">
                {MONTHS[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-700 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-700 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-[10px] sm:text-[11px] font-bold text-zinc-500">{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {days.map((item, idx) => {
                const selected = isSelectedDate(item.date);
                const today = isToday(item.date);
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateClick(item.date)}
                    className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto flex items-center justify-center text-xs rounded-md transition-all
                      ${!item.isCurrentMonth ? 'text-zinc-600' : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'}
                      ${today && !selected ? 'border border-blue-500/50 text-blue-400' : ''}
                      ${selected ? 'bg-blue-500 text-white font-bold hover:bg-blue-600' : ''}
                    `}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Calendar Footer Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700">
              <button type="button" onClick={() => { onChange(null); setIsOpen(false); }} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Clear
              </button>
              <button type="button" onClick={() => { handleDateClick(new Date()); }} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Today
              </button>
            </div>
          </div>

          {/* RIGHT PANE: Time Picker */}
          <div className="w-[110px] sm:w-[120px] flex border-l border-zinc-700 bg-[#27272A] shrink-0">
            {/* Hours Column */}
            <div className="flex-1 flex flex-col h-[300px] sm:h-[320px] overflow-y-auto no-scrollbar border-r border-zinc-700/50 snap-y snap-mandatory scroll-smooth">
              {hoursList.map(h => {
                const isSelected = value?.getHours() === h;
                return (
                  <button
                    key={`h-${h}`}
                    type="button"
                    onClick={() => handleTimeChange('hours', h)}
                    className={`h-10 shrink-0 flex items-center justify-center text-sm font-mono transition-colors snap-center
                      ${isSelected ? 'bg-blue-500/20 text-blue-400 font-bold border-y border-blue-500/30' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
                    `}
                  >
                    {h.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
            
            {/* Minutes Column */}
            <div className="flex-1 flex flex-col h-[300px] sm:h-[320px] overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth">
              {minutesList.map(m => {
                const isSelected = value?.getMinutes() === m;
                return (
                  <button
                    key={`m-${m}`}
                    type="button"
                    onClick={() => handleTimeChange('minutes', m)}
                    className={`h-10 shrink-0 flex items-center justify-center text-sm font-mono transition-colors snap-center
                      ${isSelected ? 'bg-blue-500/20 text-blue-400 font-bold border-y border-blue-500/30' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'}
                    `}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS to hide scrollbars for the time picker pane */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};