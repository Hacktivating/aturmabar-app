import React, { useEffect, useState } from 'react';

export const useSafeTimer = (startedAt: string | null | undefined) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let validStart = startedAt ? new Date(startedAt).getTime() : Date.now();
    if (isNaN(validStart)) validStart = Date.now();
    const now = Date.now();
    if (validStart > now + 60000 && startedAt) {
        const stripped = startedAt.endsWith('Z') ? startedAt.slice(0, -1) : startedAt;
        const strippedTime = new Date(stripped).getTime();
        if (!isNaN(strippedTime) && strippedTime <= now + 60000) validStart = strippedTime;
        else validStart = now;
    }
    if (validStart > now) validStart = now;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - validStart) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return elapsed;
};

export const MatchTimer = ({ startedAt }: { startedAt: string | null | undefined }) => {
  const elapsed = useSafeTimer(startedAt);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="text-ink font-mono font-bold tracking-widest">{h}:{m}:{s}</span>;
};

export const SessionGlobalTimer = ({ startedAt }: { startedAt: string | null | undefined }) => {
  const elapsed = useSafeTimer(startedAt);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="text-ink dark:text-ink-dark font-mono font-black text-xl tracking-widest">{h}:{m}:{s}</span>;
};

export const getGradeColor = (levelId: string | undefined | null) => {
  switch (levelId) {
    case 'A1': return 'bg-elevated text-white dark:bg-muted dark:text-primary border-transparent';
    case 'A2': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'B1': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'B2': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'C1': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    case 'C2': return 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400 border-lime-200 dark:border-lime-800';
    default: return 'bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint border-subtle dark:border-default-dark';
  }
};

export const getMatchTypeColor = (type: string) => {
  switch(type) {
    case 'MD': return 'bg-accent-soft text-ink dark:bg-accent-soft-dark dark:text-ink-dark border-accent dark:border-strong-dark';
    case 'WD': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    case 'XD': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    default: return 'bg-muted text-primary-soft dark:bg-elevated-dark dark:text-faint border-subtle dark:border-default-dark';
  }
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};