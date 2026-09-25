import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { CheckCircle2, Loader2, CloudAlert } from 'lucide-react';
import api from '../../../api/axios';

export const NotesTab = ({ session, fetchSessionData }: any) => {
  const [content, setContent] = useState(session?.notes || '');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const lastSavedContent = useRef(session?.notes || '');
  const currentContent = useRef(content);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentContent.current = content;
  }, [content]);

  useEffect(() => {
    if (session?.notes && lastSavedContent.current === '') {
      setContent(session.notes);
      lastSavedContent.current = session.notes;
      currentContent.current = session.notes;
    }
  }, [session?.id, session?.notes]);

  const executeSave = useCallback(async (textToSave: string) => {
    if (textToSave === lastSavedContent.current) return;
    setSaveState('saving');
    try {
      await api.put(`/sessions/${session.id}/notes`, { notes: textToSave });
      lastSavedContent.current = textToSave;
      setSaveState('saved');
      fetchSessionData(); 
      setTimeout(() => {
        setSaveState(prev => prev === 'saved' ? 'idle' : prev);
      }, 2000);
    } catch (error) {
      console.error("Failed to save notes", error);
      setSaveState('error');
    }
  }, [session.id, fetchSessionData]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (currentContent.current !== lastSavedContent.current) {
        api.put(`/sessions/${session.id}/notes`, { notes: currentContent.current }).catch(() => {});
      }
    };
  }, [session.id]);

  const handleChange = (newContent: string) => {
    setContent(newContent);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      executeSave(newContent);
    }, 400); 
  };

  const handleBlur = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    executeSave(currentContent.current);
  };

  const modules = {
    toolbar: [
      [{ 'font': [] }, { 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ]
  };

  return (
    <div className="animate-in fade-in duration-200 flex flex-col h-[calc(100vh-160px)] min-h-[600px] bg-app dark:bg-zinc-950 border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden relative font-sans">
      
      <style>{`
        /* Global Editor Container */
        .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 1.125rem !important; /* 18px */
          line-height: 1.8 !important;
        }
        .ql-editor {
          padding: 28px 32px !important;
          color: inherit !important;
        }
        .ql-editor.ql-blank::before {
          left: 32px !important;
          font-style: normal !important;
          color: #71717a !important; 
        }
        
        /* Toolbar */
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid var(--color-subtle) !important;
          padding: 14px 24px !important;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          background-color: transparent !important;
        }
        .ql-toolbar button {
          border-radius: 6px !important;
          transition: all 0.2s ease;
          height: 32px !important;
          width: 32px !important;
        }
        .ql-toolbar button:hover {
          background-color: var(--color-muted) !important;
        }
        
        /* List Zero-Indentation Override */
        .ql-editor ul[data-checked],
        .ql-editor ol,
        .ql-editor ul {
          padding-left: 0px !important;
          margin-left: 0px !important;
        }

        .ql-editor li[data-list="check"],
        .ql-editor li[data-list="check"].ql-checked {
          padding-left: 0px !important;
          margin-left: 0px !important;
          margin-bottom: 10px !important;
          list-style-type: none !important;
          display: flex !important;
          align-items: center !important;
        }

        /* Modern Box Checkbox - Scaled for 18px text */
        .ql-editor li[data-list="check"] > .ql-ui:before {
          content: '' !important;
          display: inline-block !important;
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;
          border: 2px solid #71717a !important; 
          border-radius: 6px !important;
          margin-right: 14px !important;
          background-color: transparent !important;
          transition: all 0.15s ease-in-out !important;
          cursor: pointer !important;
        }

        /* Checked State */
        .ql-editor li[data-list="check"].ql-checked > .ql-ui:before {
          border-color: #0284c7 !important; 
          background-color: transparent !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230284c7' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E") !important;
          background-size: 16px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }

        .ql-editor li[data-list="check"].ql-checked {
          color: inherit !important;
          text-decoration: none !important;
        }

        /* Dark Mode UI */
        .dark .ql-toolbar.ql-snow {
          border-bottom-color: #27272a !important; 
        }
        .dark .ql-stroke { stroke: #a1a1aa !important; } 
        .dark .ql-fill { fill: #a1a1aa !important; }
        .dark .ql-picker { color: #a1a1aa !important; font-weight: 500; }
        
        .dark .ql-toolbar button:hover, .dark .ql-toolbar button.ql-active {
          background-color: #27272a !important; 
        }
        .dark .ql-toolbar button:hover .ql-stroke, .dark .ql-toolbar button.ql-active .ql-stroke {
          stroke: #fafafa !important;
        }
        .dark .ql-toolbar button:hover .ql-fill, .dark .ql-toolbar button.ql-active .ql-fill {
          fill: #fafafa !important;
        }
        
        .dark .ql-picker-options {
          background-color: #18181b !important;
          border: 1px solid #27272a !important;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          padding: 6px !important;
        }
        .dark .ql-picker-item:hover, .dark .ql-picker-item.ql-selected {
          color: #fafafa !important;
          background-color: #27272a !important;
          border-radius: 4px;
        }
        .dark .ql-picker-label:hover, .dark .ql-picker-label.ql-active {
          color: #fafafa !important;
        }

        .dark .ql-editor li[data-list="check"] > .ql-ui:before {
          border-color: #52525b !important;
        }
        .dark .ql-editor li[data-list="check"].ql-checked > .ql-ui:before {
          border-color: #38bdf8 !important; 
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E") !important;
        }

        .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .ql-container {
          flex: 1;
          overflow-y: auto;
        }
      `}</style>
      
      <div className="px-6 py-5 border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-zinc-900 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-primary dark:text-white tracking-tight">Session Notes</h2>
          <p className="text-sm text-muted-ink dark:text-zinc-400 mt-0.5">Content automatically saves when you stop typing.</p>
        </div>
        
        <div className="flex items-center gap-2 h-10 px-4 rounded-lg bg-app dark:bg-zinc-950/50 border border-subtle dark:border-zinc-800/50 font-bold text-sm transition-colors shadow-sm">
          {saveState === 'idle' && <span className="text-muted-ink dark:text-zinc-500">Up to date</span>}
          {saveState === 'saving' && (
            <span className="text-amber-600 dark:text-amber-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Saving...
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-rose-600 dark:text-rose-500 flex items-center gap-2">
              <CloudAlert size={14} /> Sync Failed
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 sm:p-6 bg-app dark:bg-zinc-950 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col relative bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-ink focus-within:border-ink transition-shadow overflow-hidden text-primary dark:text-primary-dark">
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={handleChange}
            onBlur={handleBlur}
            modules={modules}
            placeholder="Start typing your notes here..."
          />
        </div>
      </div>

    </div>
  );
};