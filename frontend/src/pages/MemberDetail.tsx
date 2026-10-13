import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Clock3, Globe, LogOut, Moon, Sun, Trophy, UserRound, Users, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAppPreferences } from '../hooks/useAppPreferences';

const gradeTone: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200',
  A2: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  B1: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  B2: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
  C1: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  C2: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300'
};

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme, toggleLanguage, handleLogout } = useAppPreferences();
  const [member, setMember] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [membersRes, sessionsRes] = await Promise.all([api.get('/members'), api.get('/sessions')]);
        const found = membersRes.data.find((item: any) => Number(item.id) === Number(id));
        if (!found) return;
        const matchResponses = await Promise.all(sessionsRes.data.map((session: any) => api.get(`/matches/${session.id}`).then(response => ({ session, matches: response.data }))));
        const history = matchResponses.flatMap(({ session, matches: sessionMatches }) => sessionMatches
          .filter((match: any) => [match.teamA_player1, match.teamA_player2, match.teamB_player1, match.teamB_player2].some((playerId: number | null) => Number(playerId) === Number(id)))
          .map((match: any) => ({ ...match, sessionName: session.name, sessionDate: session.date })));
        if (!cancelled) { setRoster(membersRes.data); setMember(found); setMatches(history.sort((a, b) => new Date(b.startedAt || b.sessionDate).getTime() - new Date(a.startedAt || a.sessionDate).getTime())); }
      } catch (error) {
        console.error('Failed to load member details', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const stats = useMemo(() => {
    const finished = matches.filter(match => match.status === 'finished');
    let wins = 0;
    finished.forEach(match => {
      const onA = [match.teamA_player1, match.teamA_player2].some((playerId: number | null) => Number(playerId) === Number(id));
      let aSets = 0; let bSets = 0;
      for (let set = 1; set <= 3; set += 1) {
        const a = Number(match[`scoreTeamA_set${set}`] || 0); const b = Number(match[`scoreTeamB_set${set}`] || 0);
        if (a || b) { if (a > b) aSets += 1; if (b > a) bSets += 1; }
      }
      if ((onA && aSets > bSets) || (!onA && bSets > aSets)) wins += 1;
    });
    return { played: finished.length, wins, losses: finished.length - wins, winRate: finished.length ? Math.round((wins / finished.length) * 100) : 0 };
  }, [matches, id]);

  const getPlayerName = (playerId: number) => roster.find(player => Number(player.id) === Number(playerId))?.name || 'TBD';

  const getOpponents = (match: any) => {
    const onA = [match.teamA_player1, match.teamA_player2].some((playerId: number | null) => Number(playerId) === Number(id));
    return onA ? [match.teamB_player1, match.teamB_player2] : [match.teamA_player1, match.teamA_player2];
  };

  return (
    <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-white">
      <nav className="h-20 border-b border-subtle dark:border-zinc-800 bg-surface/95 dark:bg-[#0f0f11]/95 backdrop-blur flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-muted-ink dark:text-zinc-400 hover:text-primary dark:hover:text-white"><ArrowLeft size={18} /> {t('back', 'Back')}</button>
        <div className="flex items-center gap-2 sm:gap-4">
          <button type="button" onClick={toggleLanguage} className="flex items-center gap-1.5 text-sm font-bold text-muted-ink dark:text-zinc-400"><Globe size={16} /> {i18n.language.toUpperCase()}</button>
          <button type="button" onClick={toggleTheme} className="p-2 rounded-lg text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button type="button" onClick={handleLogout} className="p-2 text-rose-600 dark:text-rose-400"><LogOut size={18} /></button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-8 sm:py-10">
        {loading ? <div className="py-20 text-center text-muted-ink dark:text-zinc-500 font-bold">{t('loading', 'Loading…')}</div> : !member ? <div className="py-20 text-center"><p className="font-bold mb-5">{t('no_players', 'Player not found')}</p><button type="button" onClick={() => navigate('/members')} className="px-5 py-3 rounded-xl bg-ink text-white font-bold">{t('back_to_members', 'Back to members')}</button></div> : (
          <>
            <section className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-3xl p-5 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-ink dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center"><UserRound size={30} /></div>
                <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-widest font-bold text-muted-ink dark:text-zinc-500">{t('player_profile', 'Player profile')}</p><h1 className="text-2xl sm:text-3xl font-black truncate mt-1">{member.name}</h1><p className="text-sm text-muted-ink dark:text-zinc-400 mt-2">{member.phone || t('no_phone', 'No phone number')}</p></div>
                <span className={`self-start px-3 py-1.5 rounded-lg text-xs font-black ${gradeTone[member.skillLevel] || gradeTone.C1}`}>{member.skillLevel || 'C1'}</span>
              </div>
            </section>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
              {[['matches_played', stats.played, Trophy], ['wins', stats.wins, CheckCircle2], ['losses', stats.losses, XCircle], ['win_rate', `${stats.winRate}%`, Users]].map(([label, value, Icon]: any) => <div key={String(label)} className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl p-4 sm:p-5"><Icon size={18} className="text-muted-ink dark:text-zinc-500 mb-3" /><p className="text-2xl font-black">{value}</p><p className="text-[10px] uppercase tracking-widest font-bold text-muted-ink dark:text-zinc-500 mt-1">{t(String(label), String(label).replace('_', ' '))}</p></div>)}
            </section>
            <section className="mt-6 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-subtle dark:border-zinc-800 flex items-center justify-between"><div><h2 className="text-xl font-black">{t('match_history', 'Match history')}</h2><p className="text-sm text-muted-ink dark:text-zinc-500 mt-1">{t('player_match_history_desc', 'Completed and active matches for this player')}</p></div><Calendar size={20} className="text-muted-ink dark:text-zinc-500" /></div>
              {matches.length === 0 ? <div className="p-10 text-center text-sm font-medium text-muted-ink dark:text-zinc-500">{t('no_matches', 'No matches yet')}</div> : <div className="divide-y divide-subtle dark:divide-zinc-800">{matches.map(match => { const onA = [match.teamA_player1, match.teamA_player2].some((playerId: number | null) => Number(playerId) === Number(id)); const opponents = getOpponents(match).filter(Boolean); const result = match.status === 'finished' ? (() => { let a = 0; let b = 0; for (let set = 1; set <= 3; set += 1) { const sa = Number(match[`scoreTeamA_set${set}`] || 0); const sb = Number(match[`scoreTeamB_set${set}`] || 0); if (sa > sb) a += 1; if (sb > sa) b += 1; } const won = onA ? a > b : b > a; return won ? 'Won' : 'Lost'; })() : 'Ongoing'; return <div key={match.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"><div className="min-w-0 flex-1"><p className="font-bold truncate">{match.sessionName}</p><p className="text-xs text-muted-ink dark:text-zinc-500 mt-1 flex items-center gap-1.5"><Clock3 size={13} /> {new Date(match.startedAt || match.sessionDate).toLocaleDateString()}</p></div><div className="text-sm text-muted-ink dark:text-zinc-400 flex-1"><span className="text-xs uppercase tracking-widest font-bold text-muted-ink dark:text-zinc-500 mr-2">VS</span>{opponents.length ? opponents.map((opponentId: number) => getPlayerName(opponentId)).join(' & ') : 'TBD'}</div><span className={`self-start sm:self-auto px-2.5 py-1 rounded-lg text-xs font-black ${result === 'Won' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : result === 'Lost' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{result}</span></div>; })}</div>}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
