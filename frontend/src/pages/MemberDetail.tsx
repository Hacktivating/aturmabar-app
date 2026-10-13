import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, FileText, Globe, LogOut, Moon, Share2, Sun, Trophy, UserRound, Users, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import api from '../api/axios';
import { useAppPreferences } from '../hooks/useAppPreferences';

const PAGE_SIZE = 5;
type MatchView = {
  id: number;
  sessionName: string;
  date: string;
  status: string;
  result: 'Won' | 'Lost' | 'Draw' | 'Ongoing';
  partnerNames: string[];
  opponentNames: string[];
  setScores: string[];
  totalScore: string;
  matchType: string;
};

const safeDate = (value: string | Date) => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const fileSafe = (value: string) => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'player';
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char] || char));

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme, toggleLanguage, handleLogout } = useAppPreferences();
  const [member, setMember] = useState<any>(null);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [membersRes, sessionsRes] = await Promise.all([api.get('/members'), api.get('/sessions')]);
        const allMembers = membersRes.data;
        const found = allMembers.find((item: any) => Number(item.id) === Number(id));
        if (!found) return;
        const matchResponses = await Promise.all(sessionsRes.data.map((session: any) => api.get(`/matches/${session.id}`).then(response => ({ session, matches: response.data }))));
        const getName = (playerId: number | null) => allMembers.find((player: any) => Number(player.id) === Number(playerId))?.name || 'TBD';
        const history: MatchView[] = matchResponses.flatMap(({ session, matches: sessionMatches }) => sessionMatches
          .filter((match: any) => [match.teamA_player1, match.teamA_player2, match.teamB_player1, match.teamB_player2].some(playerId => Number(playerId) === Number(id)))
          .map((match: any) => {
            const onA = [match.teamA_player1, match.teamA_player2].some((playerId: number | null) => Number(playerId) === Number(id));
            const ownTeam = onA ? [match.teamA_player1, match.teamA_player2] : [match.teamB_player1, match.teamB_player2];
            const otherTeam = onA ? [match.teamB_player1, match.teamB_player2] : [match.teamA_player1, match.teamA_player2];
            let ownSets = 0; let otherSets = 0; const setScores: string[] = [];
            for (let set = 1; set <= 3; set += 1) {
              const a = Number(match[`scoreTeamA_set${set}`] || 0); const b = Number(match[`scoreTeamB_set${set}`] || 0);
              if (a || b || set === 1) { ownSets += onA ? Number(a > b) : Number(b > a); otherSets += onA ? Number(b > a) : Number(a > b); setScores.push(onA ? `${a}-${b}` : `${b}-${a}`); }
            }
            const result: MatchView['result'] = match.status !== 'finished' ? 'Ongoing' : ownSets > otherSets ? 'Won' : ownSets < otherSets ? 'Lost' : 'Draw';
            const ownScore = setScores.reduce((sum, score) => sum + Number(score.split('-')[0]), 0);
            const otherScore = setScores.reduce((sum, score) => sum + Number(score.split('-')[1]), 0);
            return { id: match.id, sessionName: session.name, date: match.startedAt || match.endedAt || session.date, status: match.status, result, partnerNames: ownTeam.filter(playerId => Number(playerId) !== Number(id)).map(getName), opponentNames: otherTeam.filter(Boolean).map(getName), setScores, totalScore: `${ownScore}-${otherScore}`, matchType: match.matchType || 'MD' };
          }));
        if (!cancelled) { setMember(found); setMatches(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); }
      } catch (error) { console.error('Failed to load member details', error); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const filteredMatches = useMemo(() => matches.filter(match => {
    const time = new Date(match.date).getTime();
    const after = fromDate ? time >= new Date(`${fromDate}T00:00:00`).getTime() : true;
    const before = toDate ? time <= new Date(`${toDate}T23:59:59`).getTime() : true;
    return after && before;
  }), [matches, fromDate, toDate]);
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const visibleMatches = filteredMatches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = useMemo(() => {
    const finished = matches.filter(match => match.status === 'finished');
    const wins = finished.filter(match => match.result === 'Won').length;
    return { played: finished.length, wins, losses: finished.filter(match => match.result === 'Lost').length, winRate: finished.length ? Math.round((wins / finished.length) * 100) : 0 };
  }, [matches]);
  const resetPage = () => setPage(1);

  const createShareSvg = () => {
    const name = member?.name || 'Player';
    const rows = filteredMatches.slice(0, 8).map((match, index) => {
      const y = 330 + index * 86;
      const color = match.result === 'Won' ? '#047857' : match.result === 'Lost' ? '#be123c' : '#92400e';
      return `<rect x="54" y="${y - 28}" width="1092" height="70" rx="16" fill="#ffffff" stroke="#e2e8f0"/><text x="78" y="${y}" font-family="Arial" font-size="22" font-weight="700" fill="#0f172a">${escapeXml(match.sessionName)}</text><text x="78" y="${y + 25}" font-family="Arial" font-size="16" fill="#64748b">${escapeXml(safeDate(match.date))} · Partner: ${escapeXml(match.partnerNames.join(' & ') || 'TBD')} · Opponents: ${escapeXml(match.opponentNames.join(' & ') || 'TBD')}</text><text x="1015" y="${y + 3}" text-anchor="middle" font-family="Arial" font-size="24" font-weight="800" fill="${color}">${match.result}</text><text x="1120" y="${y + 3}" text-anchor="end" font-family="Arial" font-size="22" font-weight="800" fill="#0f172a">${match.totalScore}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${Math.max(520, 360 + Math.min(filteredMatches.length, 8) * 86)}"><rect width="1200" height="100%" fill="#f6f3ed"/><rect x="0" y="0" width="1200" height="220" fill="#111113"/><circle cx="90" cy="86" r="42" fill="#f4f1ea"/><text x="90" y="98" text-anchor="middle" font-family="Arial" font-size="38" font-weight="800" fill="#111113">${escapeXml(name.slice(0, 1).toUpperCase())}</text><text x="160" y="82" font-family="Arial" font-size="42" font-weight="800" fill="#ffffff">${escapeXml(name)}</text><text x="160" y="119" font-family="Arial" font-size="20" fill="#cbd5e1">${escapeXml(member?.skillLevel || 'C1')} · AturMabar player profile</text><text x="54" y="275" font-family="Arial" font-size="25" font-weight="800" fill="#111113">Match history</text><text x="1146" y="275" text-anchor="end" font-family="Arial" font-size="18" fill="#64748b">${stats.played} played · ${stats.wins} wins · ${stats.winRate}% win rate</text>${rows || '<text x="54" y="340" font-family="Arial" font-size="18" fill="#64748b">No matches yet</text>'}</svg>`;
  };

  const exportImage = async (share = false) => {
    if (!member || exporting) return;
    setExporting(true);
    try {
      const svg = createShareSvg(); const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = Math.max(520, 360 + Math.min(filteredMatches.length, 8) * 86); const context = canvas.getContext('2d'); if (!context) return;
        context.drawImage(image, 0, 0); URL.revokeObjectURL(url); canvas.toBlob(async png => { if (!png) return; const file = new File([png], `${fileSafe(member.name)}-profile.png`, { type: 'image/png' }); if (share && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: `${member.name} profile`, files: [file] }); else { const link = document.createElement('a'); link.href = URL.createObjectURL(png); link.download = file.name; link.click(); URL.revokeObjectURL(link.href); } }, 'image/png');
      }; image.src = url;
    } finally { setTimeout(() => setExporting(false), 700); }
  };

  const exportPdf = () => {
    if (!member) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' }); const width = doc.internal.pageSize.getWidth();
    doc.setFillColor(17, 17, 19); doc.rect(0, 0, width, 145, 'F'); doc.setFillColor(244, 241, 234); doc.circle(58, 58, 25, 'F'); doc.setTextColor(17, 17, 19); doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.text(member.name.slice(0, 1).toUpperCase(), 51, 66); doc.setTextColor(255, 255, 255); doc.setFontSize(25); doc.text(member.name, 102, 57); doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(203, 213, 225); doc.text(`${member.skillLevel || 'C1'} · AturMabar player profile`, 102, 79);
    doc.setTextColor(15, 23, 42); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('Performance overview', 42, 185); doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.text(`Played ${stats.played}    Wins ${stats.wins}    Losses ${stats.losses}    Win rate ${stats.winRate}%`, 42, 207); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('Match history', 42, 255);
    let y = 280; filteredMatches.forEach((match, index) => { if (y > 750) { doc.addPage(); y = 50; } const color = match.result === 'Won' ? [4, 120, 87] : match.result === 'Lost' ? [190, 18, 60] : [146, 64, 14]; doc.setFillColor(248, 250, 252); doc.roundedRect(42, y, width - 84, 66, 10, 10, 'F'); doc.setTextColor(15, 23, 42); doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(match.sessionName, 56, y + 22); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text(`${safeDate(match.date)} · ${match.matchType}`, 56, y + 39); doc.text(`Partner: ${match.partnerNames.join(' & ') || 'TBD'}`, 230, y + 22); doc.text(`Opponents: ${match.opponentNames.join(' & ') || 'TBD'}`, 230, y + 40); doc.setTextColor(color[0], color[1], color[2]); doc.setFont('helvetica', 'bold'); doc.text(match.result, width - 125, y + 24, { align: 'center' }); doc.setTextColor(15, 23, 42); doc.setFontSize(14); doc.text(match.totalScore, width - 65, y + 25, { align: 'center' }); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(match.setScores.join(' · '), width - 65, y + 44, { align: 'center' }); y += 78; if (index === filteredMatches.length - 1) { doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text('Generated by AturMabar', 42, 805); } });
    doc.save(`${fileSafe(member.name)}-profile.pdf`);
  };

  return <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-white">
    <nav className="h-20 border-b border-subtle dark:border-zinc-800 bg-surface/95 dark:bg-[#0f0f11]/95 backdrop-blur flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20"><button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-muted-ink dark:text-zinc-400 hover:text-primary dark:hover:text-white"><ArrowLeft size={18} /> {t('back', 'Back')}</button><div className="flex items-center gap-2 sm:gap-4"><button type="button" onClick={toggleLanguage} className="flex items-center gap-1.5 text-sm font-bold text-muted-ink dark:text-zinc-400"><Globe size={16} /> {i18n.language.toUpperCase()}</button><button type="button" onClick={toggleTheme} className="p-2 rounded-lg text-muted-ink dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button><button type="button" onClick={handleLogout} className="p-2 text-rose-600 dark:text-rose-400"><LogOut size={18} /></button></div></nav>
    <main ref={profileRef} className="max-w-6xl mx-auto px-4 py-6 sm:px-8 sm:py-10">
      {loading ? <div className="py-20 text-center text-muted-ink dark:text-zinc-500 font-bold">{t('loading', 'Loading…')}</div> : !member ? <div className="py-20 text-center"><p className="font-bold mb-5">{t('no_players', 'Player not found')}</p><button type="button" onClick={() => navigate('/members')} className="px-5 py-3 rounded-xl bg-ink text-white font-bold">{t('back_to_members', 'Back to members')}</button></div> : <>
        <section className="relative overflow-hidden rounded-[28px] bg-ink dark:bg-[#171719] text-white p-6 sm:p-9 shadow-xl"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" /><div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-7"><div className="flex items-center gap-4 sm:gap-6"><div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#f4f1ea] text-ink flex items-center justify-center text-3xl sm:text-4xl font-black"><UserRound size={34} /></div><div><p className="text-xs uppercase tracking-[0.24em] font-bold text-white/50">{t('player_profile', 'Player profile')}</p><h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-1">{member.name}</h1><p className="text-sm text-white/60 mt-2">{member.phone || t('no_phone', 'No phone number')}</p></div></div><div className="flex flex-wrap items-center gap-2"><span className="px-3 py-1.5 rounded-xl bg-white/10 text-sm font-black">{member.skillLevel || 'C1'}</span><span className="px-3 py-1.5 rounded-xl bg-white/10 text-sm font-bold">{stats.played} {t('matches', 'matches')}</span></div></div></section>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">{[['matches_played', stats.played, Trophy], ['wins', stats.wins, CheckCircle2], ['losses', stats.losses, XCircle], ['win_rate', `${stats.winRate}%`, Users]].map(([label, value, Icon]: any) => <div key={String(label)} className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm"><Icon size={18} className="text-muted-ink dark:text-zinc-500 mb-3" /><p className="text-2xl font-black">{value}</p><p className="text-[10px] uppercase tracking-widest font-bold text-muted-ink dark:text-zinc-500 mt-1">{t(String(label), String(label).replace('_', ' '))}</p></div>)}</section>
        <section className="mt-6 bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden"><div className="p-5 sm:p-6 border-b border-subtle dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><h2 className="text-xl sm:text-2xl font-black">{t('match_history', 'Match history')}</h2><p className="text-sm text-muted-ink dark:text-zinc-500 mt-1">{filteredMatches.length} {t('matches_found', 'matches found')}</p></div><div className="flex flex-col sm:flex-row gap-2"><label className="flex items-center gap-2 rounded-xl border border-subtle dark:border-zinc-800 bg-app dark:bg-[#18181b] px-3 py-2 text-xs font-bold text-muted-ink dark:text-zinc-400"><Calendar size={15} />{t('from', 'From')}<input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); resetPage(); }} className="bg-transparent text-primary dark:text-white outline-none" /></label><label className="flex items-center gap-2 rounded-xl border border-subtle dark:border-zinc-800 bg-app dark:bg-[#18181b] px-3 py-2 text-xs font-bold text-muted-ink dark:text-zinc-400"><Calendar size={15} />{t('to', 'To')}<input type="date" value={toDate} onChange={e => { setToDate(e.target.value); resetPage(); }} className="bg-transparent text-primary dark:text-white outline-none" /></label></div></div>
          <div className="px-5 sm:px-6 py-4 bg-app/60 dark:bg-[#101012] border-b border-subtle dark:border-zinc-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-muted-ink dark:text-zinc-500"><Clock3 size={15} /> {fromDate || toDate ? `${fromDate || '…'} → ${toDate || '…'}` : t('all_dates', 'All dates')}</div><div className="flex gap-2"><button type="button" onClick={() => exportImage(false)} disabled={exporting} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-ink dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 text-xs font-black disabled:opacity-50"><Download size={15} /> {exporting ? t('preparing', 'Preparing…') : t('share_image', 'Share image')}</button><button type="button" onClick={() => exportImage(true)} disabled={exporting} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-subtle dark:border-zinc-700 px-4 py-2.5 text-xs font-black"><Share2 size={15} /> {t('share', 'Share')}</button><button type="button" onClick={exportPdf} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-subtle dark:border-zinc-700 px-4 py-2.5 text-xs font-black"><FileText size={15} /> PDF</button></div></div>
          {visibleMatches.length === 0 ? <div className="p-12 text-center text-sm font-medium text-muted-ink dark:text-zinc-500">{t('no_matches', 'No matches for this date range')}</div> : <div className="divide-y divide-subtle dark:divide-zinc-800">{visibleMatches.map(match => <div key={match.id} className="p-4 sm:p-5 hover:bg-app/70 dark:hover:bg-white/[0.03] transition-colors"><div className="flex flex-col xl:flex-row xl:items-center gap-4"><div className="min-w-0 xl:w-48 shrink-0"><div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-widest font-black text-muted-ink dark:text-zinc-500">{match.matchType}</span><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${match.result === 'Won' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : match.result === 'Lost' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>{match.result}</span></div><p className="font-bold truncate mt-2">{match.sessionName}</p><p className="text-xs text-muted-ink dark:text-zinc-500 mt-1">{safeDate(match.date)}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1"><div className="rounded-2xl border border-subtle dark:border-zinc-800 bg-app dark:bg-[#18181b] p-3"><p className="text-[10px] uppercase tracking-widest font-black text-muted-ink dark:text-zinc-500 mb-1">{t('partner', 'Partner')}</p><p className="font-bold truncate">{match.partnerNames.join(' & ') || 'TBD'}</p></div><div className="rounded-2xl border border-subtle dark:border-zinc-800 bg-app dark:bg-[#18181b] p-3"><p className="text-[10px] uppercase tracking-widest font-black text-muted-ink dark:text-zinc-500 mb-1">{t('opponents', 'Opponents')}</p><p className="font-bold truncate">{match.opponentNames.join(' & ') || 'TBD'}</p></div></div><div className="xl:w-40 shrink-0 rounded-2xl bg-ink dark:bg-white text-white dark:text-zinc-900 p-3 text-center"><p className="text-[10px] uppercase tracking-widest font-black opacity-60">{t('score', 'Score')}</p><p className="text-2xl font-black mt-1">{match.totalScore}</p><p className="text-[10px] font-bold opacity-60 mt-1">{match.setScores.join(' · ')}</p></div></div></div>)}</div>}
          {filteredMatches.length > 0 && <div className="p-4 sm:p-5 border-t border-subtle dark:border-zinc-800 flex items-center justify-between gap-3"><p className="text-xs font-bold text-muted-ink dark:text-zinc-500">{t('page_of', 'Page {{current}} of {{total}}').replace('{{current}}', String(page)).replace('{{total}}', String(totalPages))}</p><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="p-2.5 rounded-xl border border-subtle dark:border-zinc-800 disabled:opacity-30"><ChevronLeft size={17} /></button><button type="button" disabled={page === totalPages} onClick={() => setPage(current => current + 1)} className="p-2.5 rounded-xl border border-subtle dark:border-zinc-800 disabled:opacity-30"><ChevronRight size={17} /></button></div></div>}
        </section>
      </>}
    </main>
  </div>;
}
