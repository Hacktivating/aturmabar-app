import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Wand2 } from 'lucide-react';

interface TourOverlayProps {
  step: number;
  currentStep: number;
  targetId?: string | null;
  title?: string;
  content?: string;
  onNext?: () => void;
  nextText?: string;
  actionButton?: React.ReactNode;
  hideNext?: boolean;
  onCancel?: () => void;
  allowClick?: boolean;
  hideTooltip?: boolean;
}

export function TourOverlay({
  step,
  currentStep,
  targetId,
  title,
  content,
  onNext,
  nextText,
  actionButton,
  hideNext,
  onCancel,
  allowClick,
  hideTooltip,
}: TourOverlayProps) {
  const { t } = useTranslation();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step !== currentStep) return;
    if (!targetId) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.getElementById(targetId);
      if (element) setRect(element.getBoundingClientRect());
    };

    updateRect();
    const firstRefresh = window.setTimeout(updateRect, 100);
    const secondRefresh = window.setTimeout(updateRect, 300);
    const interval = window.setInterval(updateRect, 500);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.clearTimeout(firstRefresh);
      window.clearTimeout(secondRefresh);
      window.clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [step, currentStep, targetId]);

  if (step !== currentStep) return null;
  const hasButtons = !hideNext || Boolean(onCancel) || Boolean(actionButton);

  if (!targetId) {
    return (
      <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in pointer-events-auto">
        <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/50 bg-surface p-6 text-center shadow-2xl animate-in zoom-in-95 fade-in duration-300 dark:bg-surface-dark sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"><Wand2 size={32} /></div>
          <h3 className="mb-4 text-2xl font-black text-primary dark:text-white">{title}</h3>
          <div className="mb-8 text-sm leading-relaxed text-muted-ink dark:text-muted-dark sm:text-base">{content}</div>
          <div className="flex flex-col-reverse justify-center gap-3 sm:flex-row sm:gap-4">
            {onCancel && <button onClick={onCancel} className="px-6 py-3 font-bold text-faint transition-colors hover:text-primary dark:hover:text-white">{t('tour_cancel', 'Cancel Tour')}</button>}
            {actionButton}
            {!hideNext && onNext && <button onClick={onNext} className="rounded-xl bg-amber-500 px-8 py-3 font-black text-white shadow-lg transition-colors hover:bg-amber-600">{nextText || t('next', 'Next')}</button>}
          </div>
        </div>
      </div>
    );
  }

  if (!rect) return null;

  const padding = 12;
  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const bottom = Math.max(0, window.innerHeight - top - height);
  const right = Math.max(0, window.innerWidth - left - width);
  const isAbove = top + height + 216 > window.innerHeight;
  const tooltipTop = isAbove ? Math.max(32, top - 220) : top + height + 16;
  const tooltipLeft = Math.max(16, Math.min(left + width / 2 - 160, window.innerWidth - 336));

  return (
    <div className="pointer-events-none fixed inset-0 z-[2147483647] animate-in fade-in duration-300">
      <div className="pointer-events-auto absolute left-0 right-0 top-0 bg-black/85" style={{ height: top }} />
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-black/85" style={{ height: bottom }} />
      <div className="pointer-events-auto absolute left-0 bg-black/85" style={{ top, height, width: left }} />
      <div className="pointer-events-auto absolute right-0 bg-black/85" style={{ top, height, width: right }} />
      <div className="pointer-events-none absolute rounded-2xl border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]" style={{ top, left, width, height }}>
        {!allowClick && <div className="pointer-events-auto h-full w-full cursor-not-allowed" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} />}
      </div>
      {!hideTooltip && (
        <div className={`${hasButtons ? 'pointer-events-auto' : 'pointer-events-none'} absolute flex flex-col rounded-2xl border border-amber-500/30 bg-surface p-5 shadow-2xl transition-all dark:bg-surface-dark sm:p-6`} style={{ top: tooltipTop, left: tooltipLeft, width: Math.min(320, window.innerWidth - 32) }}>
          <div className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-amber-500/30 bg-surface dark:bg-surface-dark ${isAbove ? 'bottom-[-9px] border-b border-r' : 'top-[-9px] border-l border-t'}`} />
          <h4 className="relative z-10 mb-2 flex items-center gap-2 text-lg font-black text-primary dark:text-white"><Sparkles size={18} className="shrink-0 text-amber-500" />{title}</h4>
          <p className={`relative z-10 text-sm leading-relaxed text-muted-ink dark:text-muted-dark ${hasButtons ? 'mb-6' : 'mb-0'}`}>{content}</p>
          {hasButtons && <div className="relative z-10 mt-auto flex items-center justify-between">
            {onCancel && <button onClick={onCancel} className="text-xs font-bold text-faint transition-colors hover:text-rose-500">{t('tour_end', 'End Tour')}</button>}
            {actionButton}
            {!hideNext && onNext && <button onClick={onNext} className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-black text-white shadow-md transition-colors hover:bg-amber-600">{nextText || t('next', 'Next')}</button>}
          </div>}
        </div>
      )}
    </div>
  );
}
