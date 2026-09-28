import React from 'react';
import { Save, AlertTriangle, ChevronDown } from 'lucide-react';

export const SettingsTab = ({ settingsForm, setSettingsForm, settingsLimitType, handleSaveSettings, handleDeleteSession, isProcessing, t, inputStyles }: any) => {
  return (
    <div className="animate-in fade-in duration-200 max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8">
      
      <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 sm:gap-6">
        
        {/* Header & Desktop Save Button */}
        <div className="flex items-center justify-between px-1">
           <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('session_settings', 'Session Settings')}</h2>
           <button disabled={isProcessing} type="submit" className="hidden sm:flex px-6 py-2.5 bg-ink dark:bg-white text-white dark:text-zinc-900 rounded-lg font-bold shadow-sm transition-colors items-center gap-2 hover:bg-ink-soft dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer">
              <Save size={16}/> {t('save_settings', 'Save Changes')}
            </button>
        </div>

        {/* Clean, Unified Settings List */}
        <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col divide-y divide-subtle dark:divide-zinc-800">
          
          {/* Session Name */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-1/3 text-sm font-bold text-primary dark:text-zinc-300">Session Name</label>
            <div className="flex-1">
              <input disabled={isProcessing} type="text" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className={`${inputStyles} font-bold`} required />
            </div>
          </div>

          {/* Match Limit */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <div className="sm:w-1/3 sm:mt-2">
              <label className="text-sm font-bold text-primary dark:text-zinc-300">{t('match_limit', 'Leaderboard Match Limit')}</label>
              <p className="text-xs text-muted-ink dark:text-zinc-500 mt-1">Cap the max matches counted for player rankings.</p>
            </div>
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <select 
                  disabled={isProcessing} 
                  value={settingsLimitType} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'all') setSettingsForm({...settingsForm, matchLimit: 0});
                    else if (val === 'custom') setSettingsForm({...settingsForm, matchLimit: 6});
                    else setSettingsForm({...settingsForm, matchLimit: parseInt(val)});
                  }} 
                  className={`${inputStyles} font-bold appearance-none pr-10 cursor-pointer`}
                >
                  <option value="all">{t('all_games', 'All Games')}</option>
                  <option value="1">1 Game</option>
                  <option value="2">2 Games</option>
                  <option value="3">3 Games</option>
                  <option value="4">4 Games</option>
                  <option value="5">5 Games</option>
                  <option value="custom">{t('custom_amount', 'Custom')}</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
              </div>
              {settingsLimitType === 'custom' && (
                <input 
                  disabled={isProcessing} 
                  type="number" 
                  min="1" 
                  value={settingsForm.matchLimit} 
                  onChange={e => setSettingsForm({...settingsForm, matchLimit: parseInt(e.target.value) || 0})} 
                  className={`${inputStyles} w-20 sm:w-24 text-center font-bold`} 
                />
              )}
            </div>
          </div>

          {/* Pairing Strictness */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <div className="sm:w-1/3 sm:mt-2">
              <label className="text-sm font-bold text-primary dark:text-zinc-300">Pairing Strictness</label>
              <p className="text-xs text-muted-ink dark:text-zinc-500 mt-1">How strict the auto-queue matches grades together.</p>
            </div>
            <div className="flex-1 relative">
              <select disabled={isProcessing} value={settingsForm.pairingRule || ''} onChange={e => setSettingsForm({...settingsForm, pairingRule: e.target.value})} className={`${inputStyles} font-bold appearance-none pr-10 cursor-pointer`}>
                <option value="very_strict">Very Strict (Same Grade)</option>
                <option value="strict">Strict (+/- 1 Grade)</option>
                <option value="moderate">Moderate (+/- 2 Grades)</option>
                <option value="randomize">Randomize (Any)</option>
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Scoring System */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <div className="sm:w-1/3 sm:mt-2">
              <label className="text-sm font-bold text-primary dark:text-zinc-300">Scoring System</label>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative">
                <select disabled={isProcessing} value={settingsForm.scoringSystem || ''} onChange={e => setSettingsForm({...settingsForm, scoringSystem: e.target.value})} className={`${inputStyles} font-bold appearance-none pr-10 cursor-pointer`}>
                  <option value="BWF 21 Points x 3 Sets">BWF 21 Points x 3 Sets</option>
                  <option value="BWF 15 Points x 3 Sets">BWF 15 Points x 3 Sets</option>
                  <option value="42 Points x 1 Set">42 Points x 1 Set</option>
                  <option value="30 Points x 1 Set">30 Points x 1 Set</option>
                  <option value="custom">Custom Sets & Points</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
              </div>
              
              {settingsForm.scoringSystem === 'custom' && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 text-muted-ink dark:text-zinc-500 uppercase tracking-widest">Sets</label>
                    <input disabled={isProcessing} type="number" min={1} value={settingsForm.customSets || ''} onChange={e => setSettingsForm({...settingsForm, customSets: parseInt(e.target.value)})} className={`${inputStyles} font-black`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 text-muted-ink dark:text-zinc-500 uppercase tracking-widest">Points / Set</label>
                    <input disabled={isProcessing} type="number" min={1} value={settingsForm.customPoints || ''} onChange={e => setSettingsForm({...settingsForm, customPoints: parseInt(e.target.value)})} className={`${inputStyles} font-black`} />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Save Button */}
        <div className="sm:hidden flex justify-end">
          <button disabled={isProcessing} type="submit" className="w-full px-6 py-3.5 bg-ink dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black shadow-sm transition-colors flex items-center justify-center gap-2 hover:bg-ink-soft dark:hover:bg-zinc-200 disabled:opacity-50 cursor-pointer">
            <Save size={18}/> {t('save_settings', 'Save Settings')}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="border border-rose-200 dark:border-rose-900/40 bg-transparent rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mt-2">
        <div className="flex gap-4 items-start sm:items-center">
          <div className="text-rose-600 dark:text-rose-500 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-rose-700 dark:text-rose-500 text-base">{t('danger_zone', 'Danger Zone')}</h3>
            <p className="text-xs sm:text-sm text-rose-600/70 dark:text-rose-400/70 mt-1 max-w-md">{t('delete_session_warning', 'Permanently delete this session and all its data. This action cannot be undone.')}</p>
          </div>
        </div>
        <button disabled={isProcessing} onClick={handleDeleteSession} className="w-full sm:w-auto px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-500/10 dark:text-rose-500 dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-500/20 rounded-lg font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50 cursor-pointer text-sm text-center">
          Delete Session
        </button>
      </div>
    </div>
  );
};