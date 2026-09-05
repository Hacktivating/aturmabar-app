import React, { useState, useEffect, useCallback } from 'react';
import { Maximize, Minimize, RotateCcw, ArrowRightLeft, Settings, Minus, ChevronLeft, Save, History, X, Trash2, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Scoreboard() {
  const navigate = useNavigate();
  
  // App UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Match & Rule Settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('scoreboard_settings');
    return saved ? JSON.parse(saved) : {
      pointsPerSet: 21,
      maxSets: 3,
      winByTwo: true,
      maxDeucePoint: 30
    };
  });

  // Game States
  const [teams, setTeams] = useState({ a: 'Team A', b: 'Team B' });
  const [scores, setScores] = useState({ a: 0, b: 0 });
  const [sets, setSets] = useState({ a: 0, b: 0 });
  const [swapped, setSwapped] = useState(false);

  // History State
  const [matchHistory, setMatchHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('scoreboard_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist Settings & History
  useEffect(() => {
    localStorage.setItem('scoreboard_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('scoreboard_history', JSON.stringify(matchHistory));
  }, [matchHistory]);

  // Screen Wake Lock (prevents phone from sleeping)
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        // Force hardware rotation lock on mobile if API is supported
        if (window.screen.orientation && 'lock' in window.screen.orientation) {
          await (window.screen.orientation as any).lock('landscape');
        }
      } catch (err) {
        console.warn('Fullscreen/Orientation lock failed:', err);
      }
    } else {
      try {
        if (window.screen.orientation && 'unlock' in window.screen.orientation) {
          window.screen.orientation.unlock();
        }
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
  };

  const handleScore = useCallback((team: 'a' | 'b', increment: number) => {
    setScores(prev => ({
      ...prev,
      [team]: Math.max(0, prev[team] + increment)
    }));
  }, []);

  const handleSet = (team: 'a' | 'b', increment: number) => {
    setSets(prev => ({
      ...prev,
      [team]: Math.max(0, prev[team] + increment)
    }));
  };

  const resetCurrentSet = () => {
    setScores({ a: 0, b: 0 });
    setIsResetModalOpen(false);
    showToast('Set reset to 0-0');
  };

  const resetEntireMatch = () => {
    setScores({ a: 0, b: 0 });
    setSets({ a: 0, b: 0 });
    setIsResetModalOpen(false);
    showToast('Match fully reset');
  };

  const saveMatchToHistory = () => {
    const newMatch = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      teamA: teams.a,
      teamB: teams.b,
      scoreA: scores.a,
      scoreB: scores.b,
      setsA: sets.a,
      setsB: sets.b,
      rules: { ...settings }
    };
    setMatchHistory([newMatch, ...matchHistory]);
    showToast('Match saved to history!');
  };

  const deleteHistoryItem = (id: number) => {
    setMatchHistory(prev => prev.filter(m => m.id !== id));
  };

  const getGameStatus = () => {
    const { a, b } = scores;
    const { pointsPerSet, winByTwo, maxDeucePoint } = settings;
    
    if (a === 0 && b === 0) return null;

    if (winByTwo && a >= pointsPerSet - 1 && b >= pointsPerSet - 1) {
      if (a === b) return "DEUCE";
      if (a > b && a < maxDeucePoint) return "GAME POINT";
      if (b > a && b < maxDeucePoint) return "GAME POINT";
    }

    if (a >= pointsPerSet || b >= pointsPerSet) {
      if (!winByTwo) return a > b ? `${teams.a} WINS SET` : `${teams.b} WINS SET`;
      if (a === maxDeucePoint) return `${teams.a} WINS SET`;
      if (b === maxDeucePoint) return `${teams.b} WINS SET`;
      if (a - b >= 2) return `${teams.a} WINS SET`;
      if (b - a >= 2) return `${teams.b} WINS SET`;
      return "GAME POINT";
    }

    if (a === pointsPerSet - 1 || b === pointsPerSet - 1) return "GAME POINT";
    
    return null;
  };

  const statusText = getGameStatus();

  const renderSide = (teamKey: 'a' | 'b') => {
    const isTeamA = teamKey === 'a';
    const bgClass = isTeamA ? 'bg-[#059669]' : 'bg-[#E11D48]'; 
    const name = teams[teamKey];
    const score = scores[teamKey];
    const setWins = sets[teamKey];

    return (
      <div className={`flex-1 flex flex-col ${bgClass} text-white relative select-none touch-manipulation transition-colors duration-300`}>
        {/* Top Bar - Team Name & Sets */}
        <div className="flex items-center justify-between p-4 md:p-6 bg-black/10">
          <div className="flex flex-col">
            <span className="text-lg md:text-2xl font-bold uppercase tracking-widest opacity-90">{name}</span>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={(e) => { e.stopPropagation(); handleSet(teamKey, -1); }} className="w-8 h-8 rounded bg-black/20 flex items-center justify-center font-bold active:bg-black/40">-</button>
              <span className="font-mono font-black text-xl w-6 text-center">{setWins}</span>
              <button onClick={(e) => { e.stopPropagation(); handleSet(teamKey, 1); }} className="w-8 h-8 rounded bg-black/20 flex items-center justify-center font-bold active:bg-black/40">+</button>
              <span className="text-[10px] sm:text-xs font-bold uppercase ml-2 opacity-70 tracking-widest">Sets</span>
            </div>
          </div>
        </div>

        {/* Massive Score Tap Zone */}
        <div 
          onClick={() => handleScore(teamKey, 1)}
          className="flex-1 flex items-center justify-center cursor-pointer active:bg-white/10 transition-colors relative"
        >
          <span className="text-[35vw] font-black leading-none tracking-tighter" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {score}
          </span>
        </div>

        {/* Bottom Bar - Decrement Score */}
        <div className="p-4 md:p-6 flex justify-center bg-black/10">
          <button 
            onClick={(e) => { e.stopPropagation(); handleScore(teamKey, -1); }}
            className="px-8 py-3 bg-black/20 rounded-full flex items-center gap-2 active:bg-black/40 transition-colors"
          >
            <Minus size={20} />
            <span className="font-bold text-sm md:text-lg">Minus 1</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* PORTRAIT BLOCKER - Forces users to rotate device */}
      <div className="portrait:flex landscape:hidden fixed inset-0 z-[999999] bg-zinc-900 items-center justify-center text-white flex-col gap-6 p-8 text-center">
        <Smartphone size={64} className="animate-[spin_3s_ease-in-out_infinite]" />
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Rotate Device</h2>
          <p className="text-zinc-400 font-medium">The scoreboard is designed strictly for landscape orientation.</p>
        </div>
      </div>

      {/* MAIN SCOREBOARD (Hidden in Portrait) */}
      <div className="portrait:hidden fixed inset-0 bg-[#18181B] font-sans flex flex-row overflow-hidden z-[99999]">
        
        {/* Dynamic Status Banner (Deuce / Match Point) */}
        {statusText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white text-black px-6 py-2 rounded-full font-black tracking-widest uppercase text-sm md:text-lg shadow-2xl animate-in slide-in-from-top-4">
            {statusText}
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white px-6 py-3 rounded-full font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4">
            {toastMessage}
          </div>
        )}

        {/* Left Score Area */}
        {renderSide(swapped ? 'b' : 'a')}
        
        {/* Center Divider / Controls - Forced Vertical Layout */}
        <div className="w-16 md:w-20 h-full bg-[#18181B] flex flex-col items-center justify-between py-4 md:py-6 shrink-0 border-x border-black z-10 shadow-2xl overflow-y-auto no-scrollbar">
          {/* Back button hidden on mobile to maximize space */}
          <button onClick={() => navigate(-1)} className="hidden md:block p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="block md:hidden h-10 w-10"></div> {/* Spacer for mobile */}
          
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <button onClick={() => setSwapped(!swapped)} className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Swap Sides">
              <ArrowRightLeft size={24} />
            </button>
            <button onClick={() => setIsResetModalOpen(true)} className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Reset Scores">
              <RotateCcw size={24} />
            </button>
            <button onClick={saveMatchToHistory} className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Save Match">
              <Save size={24} />
            </button>
            <button onClick={() => setIsHistoryModalOpen(true)} className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Match History">
              <History size={24} />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Settings">
              <Settings size={24} />
            </button>
          </div>

          <button onClick={toggleFullscreen} className="p-3 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>

        {/* Right Score Area */}
        {renderSide(swapped ? 'a' : 'b')}

        {/* --- MODALS --- */}

        {/* 1. Reset Confirmation Modal */}
        {isResetModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#18181B] w-full max-w-sm rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl p-6 flex flex-col gap-6 text-center">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <RotateCcw size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Reset Scoreboard</h3>
                <p className="text-zinc-400 text-sm">What would you like to reset?</p>
              </div>
              
              <div className="flex flex-col gap-3 mt-2">
                <button onClick={resetCurrentSet} className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors">
                  Reset Current Set Only (0 - 0)
                </button>
                <button onClick={resetEntireMatch} className="w-full py-3.5 bg-rose-600/10 border border-rose-600/30 text-rose-500 hover:bg-rose-600/20 rounded-xl font-bold transition-colors">
                  Reset Entire Match (Scores & Sets)
                </button>
                <button onClick={() => setIsResetModalOpen(false)} className="w-full py-3.5 text-zinc-400 hover:text-white font-bold transition-colors mt-2">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#18181B] w-full max-w-md rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 flex justify-between items-center border-b border-zinc-800">
                <h3 className="text-xl font-bold text-white">Scoreboard Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex flex-col gap-6">
                {/* Team Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Team A Name</label>
                    <input type="text" value={teams.a} onChange={e => setTeams(prev => ({ ...prev, a: e.target.value }))} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Team B Name</label>
                    <input type="text" value={teams.b} onChange={e => setTeams(prev => ({ ...prev, b: e.target.value }))} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-rose-500" />
                  </div>
                </div>

                {/* Match Rules */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">Match Rules</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">Points Per Set</label>
                    <input type="number" value={settings.pointsPerSet} onChange={e => setSettings(prev => ({...prev, pointsPerSet: parseInt(e.target.value) || 21}))} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">Maximum Sets (Best of)</label>
                    <input type="number" value={settings.maxSets} onChange={e => setSettings(prev => ({...prev, maxSets: parseInt(e.target.value) || 3}))} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-xl">
                    <span className="font-bold text-sm text-zinc-300">Require Win by 2 Points (Deuce)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.winByTwo} onChange={() => setSettings(prev => ({...prev, winByTwo: !prev.winByTwo}))} />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {settings.winByTwo && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2">Maximum Deuce Point Cap (e.g. 30)</label>
                      <input type="number" value={settings.maxDeucePoint} onChange={e => setSettings(prev => ({...prev, maxDeucePoint: parseInt(e.target.value) || 30}))} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-amber-500" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-black/50 border-t border-zinc-800 flex justify-end">
                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-white text-black rounded-xl font-bold text-lg">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Match History Modal */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-[#18181B] w-full max-w-2xl rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 flex justify-between items-center border-b border-zinc-800">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><History size={20}/> Saved Matches</h3>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                {matchHistory.length === 0 ? (
                  <div className="text-center text-zinc-500 py-10 font-medium">No matches saved yet.</div>
                ) : (
                  matchHistory.map((match) => (
                    <div key={match.id} className="bg-black border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-6 relative group">
                      <button 
                        onClick={() => deleteHistoryItem(match.id)}
                        className="absolute top-4 right-4 text-zinc-600 hover:text-rose-500 transition-colors"
                        title="Delete saved match"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="flex-1 w-full flex justify-between items-center pr-8 sm:pr-0">
                        <div className="flex flex-col items-center w-1/3">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">{match.teamA}</span>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-emerald-500 leading-none">{match.scoreA}</span>
                            <span className="text-sm font-bold text-zinc-400 pb-1">({match.setsA})</span>
                          </div>
                        </div>
                        <div className="text-zinc-600 font-black text-xl">VS</div>
                        <div className="flex flex-col items-center w-1/3">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">{match.teamB}</span>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-rose-500 leading-none">{match.scoreB}</span>
                            <span className="text-sm font-bold text-zinc-400 pb-1">({match.setsB})</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-left flex flex-col justify-center shrink-0">
                        <span className="text-xs text-zinc-500 font-medium">{match.date}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                          Format: {match.rules.pointsPerSet} Pts | BO{match.rules.maxSets}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}