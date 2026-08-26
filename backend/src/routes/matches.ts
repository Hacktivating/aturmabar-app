import { Router } from "express";
import { eq, and, or, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { matches, sessions, sessionAttendances, members } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(verifyAuth);

const GRADE_WEIGHTS: Record<string, number> = {
  'A1': 6, 'A2': 5, 'B1': 4, 'B2': 3, 'C1': 2, 'C2': 1
};

router.get("/:sessionId", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.sessionId), 10);
    const sessionMatches = await db.select().from(matches).where(eq(matches.sessionId, sessionId));
    res.status(200).json(sessionMatches);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:sessionId/auto-generate", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.sessionId), 10);
    const { courtId } = req.body;

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found." });

    // Fetch active attendances
    const activeAttendances = await db
      .select({ member: members })
      .from(sessionAttendances)
      .innerJoin(members, eq(sessionAttendances.memberId, members.id))
      .where(and(eq(sessionAttendances.sessionId, sessionId), eq(sessionAttendances.status, 'active')));

    // Fetch all active/queued matches to EXCLUDE currently playing members
    const activeMatches = await db.select().from(matches).where(
      and(eq(matches.sessionId, sessionId), or(eq(matches.status, 'queued'), eq(matches.status, 'on_court')))
    );

    const busyPlayerIds = new Set<number>();
    activeMatches.forEach(m => {
      if (m.teamA_player1) busyPlayerIds.add(m.teamA_player1);
      if (m.teamA_player2) busyPlayerIds.add(m.teamA_player2);
      if (m.teamB_player1) busyPlayerIds.add(m.teamB_player1);
      if (m.teamB_player2) busyPlayerIds.add(m.teamB_player2);
    });

    const eligibleAttendances = activeAttendances.filter(a => !busyPlayerIds.has(a.member.id));

    if (eligibleAttendances.length < 4) {
      return res.status(400).json({ error: "Not enough idle players to generate a match. Wait for a match to finish." });
    }

    // Build Play History Ledger
    const sessionMatches = await db.select().from(matches).where(eq(matches.sessionId, sessionId));
    const playerStats = new Map<number, { games: number, pastPartners: Set<number>, pastOpponents: Set<number> }>();
    
    eligibleAttendances.forEach(({ member }) => playerStats.set(member.id, { games: 0, pastPartners: new Set(), pastOpponents: new Set() }));

    sessionMatches.forEach(match => {
      const teamA = [match.teamA_player1, match.teamA_player2].filter(Boolean) as number[];
      const teamB = [match.teamB_player1, match.teamB_player2].filter(Boolean) as number[];
      const all = [...teamA, ...teamB];
      
      all.forEach(id => {
        if (playerStats.has(id)) {
          const stats = playerStats.get(id)!;
          stats.games += 1;
          if (teamA.includes(id)) {
            teamA.forEach(p => { if (p !== id) stats.pastPartners.add(p); });
            teamB.forEach(p => stats.pastOpponents.add(p));
          } else {
            teamB.forEach(p => { if (p !== id) stats.pastPartners.add(p); });
            teamA.forEach(p => stats.pastOpponents.add(p));
          }
        }
      });
    });

    // Sort by Games Played
    const availablePlayers = eligibleAttendances.map(a => ({
      ...a.member,
      games: playerStats.get(a.member.id)?.games || 0,
      weight: GRADE_WEIGHTS[a.member.skillLevel] || 0
    })).sort((a, b) => {
      if (a.games !== b.games) return a.games - b.games;
      return Math.random() - 0.5;
    });

    const p1 = availablePlayers[0];
    const pool = availablePlayers.slice(1);
    let selectedMatch: any[] | null = null;

    const getModes = (rule: string) => {
      const base = [{ t: 0, m: 0 }]; 
      if (rule === 'very_strict') return base;
      const strict = [...base, { t: 1, m: 0 }, { t: 1, m: 1 }]; 
      if (rule === 'strict') return strict;
      const moderate = [...strict, { t: 2, m: 0 }, { t: 2, m: 1 }, { t: 2, m: 2 }]; 
      if (rule === 'moderate') return moderate;
      return [...moderate, { t: 99, m: 99 }];
    };

    const maxModes = getModes(session.pairingRule);

    const checkHistory = (a: any, b: any, type: string, strictness: number) => {
      const statsA = playerStats.get(a.id)!;
      if (strictness === 2) return true; 
      if (type === 'partner') return !statsA.pastPartners.has(b.id);
      if (type === 'opponent') {
        if (strictness === 0) return !statsA.pastOpponents.has(b.id) && !statsA.pastPartners.has(b.id);
        if (strictness === 1) return !statsA.pastPartners.has(b.id); 
      }
      return true;
    };

    const validateMatch = (pa: any, pb: any, pc: any, pd: any, histLevel: number, t: number, m: number) => {
      const diffA = Math.abs(pa.weight - pb.weight);
      const diffB = Math.abs(pc.weight - pd.weight);
      if (diffA > t || diffB > t) return false;
      
      const teamAWeight = pa.weight + pb.weight;
      const teamBWeight = pc.weight + pd.weight;
      if (Math.abs(teamAWeight - teamBWeight) > m) return false;

      const oppCheck = (p1: any, p2: any) => p1.avoidOpponents?.includes(p2.id) || p2.avoidOpponents?.includes(p1.id);
      if (pa.avoidPartners?.includes(pb.id) || pb.avoidPartners?.includes(pa.id)) return false;
      if (pc.avoidPartners?.includes(pd.id) || pd.avoidPartners?.includes(pc.id)) return false;
      if (oppCheck(pa, pc) || oppCheck(pa, pd) || oppCheck(pb, pc) || oppCheck(pb, pd)) return false;

      if (!checkHistory(pa, pb, 'partner', histLevel)) return false;
      if (!checkHistory(pc, pd, 'partner', histLevel)) return false;
      if (!checkHistory(pa, pc, 'opponent', histLevel) || !checkHistory(pa, pd, 'opponent', histLevel)) return false;
      if (!checkHistory(pb, pc, 'opponent', histLevel) || !checkHistory(pb, pd, 'opponent', histLevel)) return false;

      return true;
    };

    for (const histLevel of [0, 1, 2]) {
      for (const mode of maxModes) {
        for (let i = 0; i < pool.length; i++) {
          for (let j = i + 1; j < pool.length; j++) {
            for (let k = j + 1; k < pool.length; k++) {
              const p2 = pool[i], p3 = pool[j], p4 = pool[k];
              const perms = [[p2, p3, p4], [p3, p2, p4], [p4, p2, p3]];
              for (const [part, opp1, opp2] of perms) {
                if (validateMatch(p1, part, opp1, opp2, histLevel, mode.t, mode.m)) {
                  selectedMatch = [p1, part, opp1, opp2];
                  break;
                }
              }
              if (selectedMatch) break;
            }
            if (selectedMatch) break;
          }
          if (selectedMatch) break;
        }
        if (selectedMatch) break;
      }
      if (selectedMatch) break;
    }

    if (!selectedMatch) {
      const fallbackPool = [p1, pool[0], pool[1], pool[2]].sort((a, b) => b.weight - a.weight);
      selectedMatch = [fallbackPool[0], fallbackPool[3], fallbackPool[1], fallbackPool[2]];
    }

    const determineType = (genders: string[]) => {
      if (genders.includes('male') && genders.includes('female')) return 'XD';
      if (genders.every(g => g === 'female')) return 'WD';
      return 'MD';
    };

    const matchType = determineType([selectedMatch[0].gender, selectedMatch[1].gender]);

    const [newMatch] = await db.insert(matches).values({
      sessionId,
      courtId: courtId || null,
      teamA_player1: selectedMatch[0].id,
      teamA_player2: selectedMatch[1].id,
      teamB_player1: selectedMatch[2].id,
      teamB_player2: selectedMatch[3].id,
      matchType,
      status: "queued"
    }).returning();

    res.status(201).json({ message: "Match generated.", match: newMatch });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST: Create a manual match
router.post("/:sessionId/manual", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.sessionId), 10);
    const { courtId, teamA_player1, teamA_player2, teamB_player1, teamB_player2 } = req.body;
    
    const playerIds = [teamA_player1, teamA_player2, teamB_player1, teamB_player2].filter(Boolean) as number[];
    let matchType = 'MD';
    
    if (playerIds.length > 0) {
      const players = await db.select().from(members).where(inArray(members.id, playerIds));
      const genders = players.map(p => p.gender);
      if (genders.includes('male') && genders.includes('female')) matchType = 'XD';
      else if (genders.every(g => g === 'female')) matchType = 'WD';
    }

    const [newMatch] = await db.insert(matches).values({
      sessionId,
      courtId: courtId || null,
      teamA_player1: teamA_player1 || null,
      teamA_player2: teamA_player2 || null,
      teamB_player1: teamB_player1 || null,
      teamB_player2: teamB_player2 || null,
      matchType,
      status: "queued"
    }).returning();

    res.status(201).json({ message: "Manual match created.", match: newMatch });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:matchId/start", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    await db.update(matches).set({ status: "on_court", startedAt: new Date() }).where(eq(matches.id, matchId));
    res.status(200).json({ message: "Match started." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:matchId/score", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { scoreTeamA_set1, scoreTeamB_set1, scoreTeamA_set2, scoreTeamB_set2, scoreTeamA_set3, scoreTeamB_set3 } = req.body;
    await db.update(matches).set({ scoreTeamA_set1, scoreTeamB_set1, scoreTeamA_set2, scoreTeamB_set2, scoreTeamA_set3, scoreTeamB_set3 }).where(eq(matches.id, matchId));
    res.status(200).json({ message: "Score updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT: Finish and clear match from active court tracking
// PUT: Finish and clear match from active court tracking
router.put("/:matchId/finish", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { scoreTeamA_set1, scoreTeamB_set1, scoreTeamA_set2, scoreTeamB_set2, scoreTeamA_set3, scoreTeamB_set3 } = req.body;
    
    // Find the finishing match to get its courtId
    const [finishingMatch] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!finishingMatch) return res.status(404).json({ error: "Match not found." });

    // Update the finished match
    const finishData: any = { status: "finished", endedAt: new Date() };

    if (scoreTeamA_set1 !== undefined) finishData.scoreTeamA_set1 = scoreTeamA_set1;
    if (scoreTeamB_set1 !== undefined) finishData.scoreTeamB_set1 = scoreTeamB_set1;
    if (scoreTeamA_set2 !== undefined) finishData.scoreTeamA_set2 = scoreTeamA_set2;
    if (scoreTeamB_set2 !== undefined) finishData.scoreTeamB_set2 = scoreTeamB_set2;
    if (scoreTeamA_set3 !== undefined) finishData.scoreTeamA_set3 = scoreTeamA_set3;
    if (scoreTeamB_set3 !== undefined) finishData.scoreTeamB_set3 = scoreTeamB_set3;

    await db.update(matches).set(finishData).where(eq(matches.id, matchId));

    // Automatically assign the next queued match to this freed court
    if (finishingMatch.courtId) {
      const [nextQueued] = await db.select().from(matches)
        .where(and(eq(matches.sessionId, finishingMatch.sessionId), eq(matches.status, 'queued'), isNull(matches.courtId)))
        .limit(1);

      if (nextQueued) {
        await db.update(matches).set({ courtId: finishingMatch.courtId }).where(eq(matches.id, nextQueued.id));
      }
    }

    res.status(200).json({ message: "Match finished." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// NEW: Update players in a match
router.put("/:matchId/players", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { teamA_player1, teamA_player2, teamB_player1, teamB_player2 } = req.body;
    await db.update(matches).set({ teamA_player1, teamA_player2, teamB_player1, teamB_player2 }).where(eq(matches.id, matchId));
    res.status(200).json({ message: "Players updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// NEW: Swap courts between matches
router.put("/:matchId/swap-court", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { targetCourtId } = req.body;
    
    const [sourceMatch] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!sourceMatch) return res.status(404).json({error: "Match not found"});
    
    const [targetMatch] = await db.select().from(matches).where(
      and(eq(matches.courtId, targetCourtId), or(eq(matches.status, 'queued'), eq(matches.status, 'on_court')))
    );

    if (targetMatch) {
      await db.update(matches).set({ courtId: targetCourtId }).where(eq(matches.id, sourceMatch.id));
      await db.update(matches).set({ courtId: sourceMatch.courtId }).where(eq(matches.id, targetMatch.id));
    } else {
      await db.update(matches).set({ courtId: targetCourtId }).where(eq(matches.id, sourceMatch.id));
    }
    res.status(200).json({ message: "Courts swapped." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:matchId", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    await db.delete(matches).where(eq(matches.id, matchId));
    res.status(200).json({ message: "Match deleted." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT: Update entire history record for a finished match
router.put("/:matchId/history", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { courtId, teamA_player1, teamA_player2, teamB_player1, teamB_player2, scoreTeamA_set1, scoreTeamB_set1, scoreTeamA_set2, scoreTeamB_set2, scoreTeamA_set3, scoreTeamB_set3 } = req.body;
    
    await db.update(matches).set({ 
      courtId: courtId || null,
      teamA_player1: teamA_player1 || null,
      teamA_player2: teamA_player2 || null,
      teamB_player1: teamB_player1 || null,
      teamB_player2: teamB_player2 || null,
      scoreTeamA_set1: scoreTeamA_set1 || 0,
      scoreTeamB_set1: scoreTeamB_set1 || 0,
      scoreTeamA_set2: scoreTeamA_set2 || 0,
      scoreTeamB_set2: scoreTeamB_set2 || 0,
      scoreTeamA_set3: scoreTeamA_set3 || 0,
      scoreTeamB_set3: scoreTeamB_set3 || 0
    }).where(eq(matches.id, matchId));
    
    res.status(200).json({ message: "History updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;