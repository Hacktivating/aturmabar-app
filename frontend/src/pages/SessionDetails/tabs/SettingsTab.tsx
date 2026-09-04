import React from 'react';
import { Save } from 'lucide-react';

export const SettingsTab = ({ settingsForm, setSettingsForm, settingsLimitType, handleSaveSettings, handleDeleteSession, isProcessing, t, inputStyles }: any) => {
  return (
    <div className="animate-in fade-in duration-200 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-6">{t('session_settings')}</h2>
      <form onSubmit={handleSaveSettings} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-xl shadow-sm p-6 flex flex-col gap-6 mb-8">
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Session Name</label>
          <input disabled={isProcessing} type="text" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} className={inputStyles} required />
        </div>
        
        <div className="pt-4 border-t border-subtle dark:border-subtle-dark">
          <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">{t('match_limit', 'Leaderboard Match Limit')}</label>
          <div className="flex gap-3">
            <select 
              disabled={isProcessing} 
              value={settingsLimitType} 
              onChange={e => {
                const val = e.target.value;
                if (val === 'all') setSettingsForm({...settingsForm, matchLimit: 0});
                else if (val === 'custom') setSettingsForm({...settingsForm, matchLimit: 6});
                else setSettingsForm({...settingsForm, matchLimit: parseInt(val)});
              }} 
              className={`${inputStyles} font-medium flex-1 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}
            >
              <option value="all">{t('all_games', 'All Games')}</option>
              <option value="1">1 Game</option>
              <option value="2">2 Games</option>
              <option value="3">3 Games</option>
              <option value="4">4 Games</option>
              <option value="5">5 Games</option>
              <option value="custom">{t('custom_amount', 'Custom Amount')}</option>
            </select>
            {settingsLimitType === 'custom' && (
              <input 
                disabled={isProcessing} 
                type="number" 
                min="1" 
                value={settingsForm.matchLimit} 
                onChange={e => setSettingsForm({...settingsForm, matchLimit: parseInt(e.target.value) || 0})} 
                className={`${inputStyles} w-24 text-center font-bold`} 
              />
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-subtle dark:border-subtle-dark">
          <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Scoring System</label>
          <select disabled={isProcessing} value={settingsForm.scoringSystem || ''} onChange={e => setSettingsForm({...settingsForm, scoringSystem: e.target.value})} className={`${inputStyles} font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}>
            <option value="BWF 21 Points x 3 Sets">BWF 21 Points x 3 Sets</option>
            <option value="BWF 15 Points x 3 Sets">BWF 15 Points x 3 Sets</option>
            <option value="42 Points x 1 Set">42 Points x 1 Set</option>
            <option value="30 Points x 1 Set">30 Points x 1 Set</option>
            <option value="custom">Custom Sets & Points</option>
          </select>
        </div>
        {settingsForm.scoringSystem === 'custom' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Custom Sets</label>
              <input disabled={isProcessing} type="number" min={1} value={settingsForm.customSets || ''} onChange={e => setSettingsForm({...settingsForm, customSets: parseInt(e.target.value)})} className={inputStyles} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Points Per Set</label>
              <input disabled={isProcessing} type="number" min={1} value={settingsForm.customPoints || ''} onChange={e => setSettingsForm({...settingsForm, customPoints: parseInt(e.target.value)})} className={inputStyles} />
            </div>
          </div>
        )}
        <div className="pt-4 border-t border-subtle dark:border-subtle-dark">
          <label className="block text-xs font-semibold mb-1.5 text-primary-soft dark:text-faint">Pairing Strictness</label>
          <select disabled={isProcessing} value={settingsForm.pairingRule || ''} onChange={e => setSettingsForm({...settingsForm, pairingRule: e.target.value})} className={`${inputStyles} font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8`}>
            <option value="very_strict">Very Strict (Same Grade Only)</option>
            <option value="strict">Strict (+/- 1 Grade)</option>
            <option value="moderate">Moderate (+/- 2 Grades)</option>
            <option value="randomize">Randomize (Any)</option>
          </select>
        </div>
        <div className="flex justify-end pt-4">
          <button disabled={isProcessing} type="submit" className="px-6 py-3 bg-ink hover:bg-ink-soft text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
            <Save size={16}/> {t('save_settings')}
          </button>
        </div>
      </form>

      <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-rose-700 dark:text-rose-500">{t('danger_zone')}</h3>
          <p className="text-sm text-rose-600/70 dark:text-rose-400/70 mt-1">{t('delete_session_warning')}</p>
        </div>
        <button disabled={isProcessing} onClick={handleDeleteSession} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50">
          Delete Session
        </button>
      </div>
    </div>
  );
};