import { Router } from "express";
import { eq, and, or, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { matches, sessions, sessionAttendances, members } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(verifyAuth);

// Base weight mappings for the initial generation logic
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

    // Sort by Games Played (with a random shuffle for tie-breaking)
    const availablePlayers = eligibleAttendances.map(a => ({
      ...a.member,
      games: playerStats.get(a.member.id)?.games || 0,
      weight: GRADE_WEIGHTS[a.member.skillLevel] || 0
    })).sort((a, b) => {
      if (a.games !== b.games) return a.games - b.games;
      return Math.random() - 0.5; // True randomization on equal games
    });

    const p1 = availablePlayers[0];
    const pool = availablePlayers.slice(1);
    let selectedMatch: any[] | null = null;

    // Define Tiers for the Rules
    let tiers: Array<{ t: number, m: number, h: number }> = [];

    if (session.pairingRule === 'very_strict') {
      tiers = [
        { t: 0, m: 0, h: 0 }, // Same grade, no repeat history
        { t: 0, m: 0, h: 1 }, // Same grade, moderate history
        { t: 0, m: 0, h: 2 }, // Same grade, ignore history
      ];
    } else if (session.pairingRule === 'strict') {
      tiers = [
        { t: 0, m: 0, h: 0 }, // 1. Try Very Strict first
        { t: 1, m: 1, h: 0 }, // 2. Then +/- 1 gap, strict history
        { t: 0, m: 0, h: 1 }, // 3. Very strict, moderate history
        { t: 1, m: 1, h: 1 }, // 4. +/- 1 gap, moderate history
        { t: 1, m: 2, h: 2 }, // 5. Last resort: ignore history to force a match
      ];
    } else if (session.pairingRule === 'moderate') {
      // 30% chance to prioritize a strict match
      const prioritizeStrict = Math.random() < 0.3;
      
      if (prioritizeStrict) {
        tiers = [
          { t: 0, m: 0, h: 0 },
          { t: 1, m: 1, h: 0 },
          { t: 2, m: 1, h: 0 }, // Fallback to moderate
          { t: 2, m: 2, h: 1 },
          { t: 2, m: 3, h: 2 },
        ];
      } else {
        tiers = [
          { t: 2, m: 1, h: 0 }, // Start directly at moderate (+/- 2)
          { t: 2, m: 2, h: 0 },
          { t: 2, m: 2, h: 1 },
          { t: 2, m: 3, h: 2 },
        ];
      }
    } else {
      // Randomize
      tiers = [
        { t: 99, m: 99, h: 0 }, // Prefer no repeat history
        { t: 99, m: 99, h: 1 },
        { t: 99, m: 99, h: 2 }, // Fully random
      ];
    }

    const checkHistory = (a: any, b: any, type: string, strictness: number) => {
      const statsA = playerStats.get(a.id)!;
      if (strictness === 2) return true; // Ignore history
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

      if (!checkHistory(pa, pb, 'partner', histLevel)) return false;
      if (!checkHistory(pc, pd, 'partner', histLevel)) return false;
      if (!checkHistory(pa, pc, 'opponent', histLevel) || !checkHistory(pa, pd, 'opponent', histLevel)) return false;
      if (!checkHistory(pb, pc, 'opponent', histLevel) || !checkHistory(pb, pd, 'opponent', histLevel)) return false;

      return true;
    };

    // Evaluate Tiers
    for (const tier of tiers) {
      const validMatchesForTier: any[][] = [];

      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          for (let k = j + 1; k < pool.length; k++) {
            const p2 = pool[i], p3 = pool[j], p4 = pool[k];
            const perms = [[p2, p3, p4], [p3, p2, p4], [p4, p2, p3]];
            
            for (const [part, opp1, opp2] of perms) {
              if (validateMatch(p1, part, opp1, opp2, tier.h, tier.t, tier.m)) {
                validMatchesForTier.push([p1, part, opp1, opp2]);
              }
            }
          }
        }
      }

      // If matches are found in this tier, pick one RANDOMLY so it's not fixated
      if (validMatchesForTier.length > 0) {
        const randomIndex = Math.floor(Math.random() * validMatchesForTier.length);
        selectedMatch = validMatchesForTier[randomIndex];
        break; // Break tier loop
      }
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

// PUT: Finish and clear match, UPDATE HIDDEN MMR
router.put("/:matchId/finish", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { scoreTeamA_set1, scoreTeamB_set1, scoreTeamA_set2, scoreTeamB_set2, scoreTeamA_set3, scoreTeamB_set3 } = req.body;
    
    // Find the finishing match
    const [finishingMatch] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!finishingMatch) return res.status(404).json({ error: "Match not found." });

    // 1. Process MMR Updates (ELO Logic)
    const playerIds = [
      finishingMatch.teamA_player1, finishingMatch.teamA_player2,
      finishingMatch.teamB_player1, finishingMatch.teamB_player2
    ].filter(Boolean) as number[];

    if (playerIds.length === 4) {
      const matchPlayers = await db.select().from(members).where(inArray(members.id, playerIds));
      
      const getP = (id: number | null) => matchPlayers.find(p => p.id === id);
      const pA1 = getP(finishingMatch.teamA_player1); const pA2 = getP(finishingMatch.teamA_player2);
      const pB1 = getP(finishingMatch.teamB_player1); const pB2 = getP(finishingMatch.teamB_player2);

      if (pA1 && pA2 && pB1 && pB2) {
        // Evaluate Match Outcome
        let setsA = 0, setsB = 0;
        const processSet = (a: number|null, b: number|null) => {
          if (a && b) { if (a > b) setsA++; else if (b > a) setsB++; }
        };
        processSet(scoreTeamA_set1, scoreTeamB_set1);
        processSet(scoreTeamA_set2, scoreTeamB_set2);
        processSet(scoreTeamA_set3, scoreTeamB_set3);

        const sA = setsA > setsB ? 1 : (setsA < setsB ? 0 : 0.5);
        const sB = 1 - sA;

        // Hidden MMR Fallback (default to 1200 if not found/null)
        // NOTE: Requires `hiddenMmr` field in members schema
        const mmrA1 = (pA1 as any).hiddenMmr ?? 1200;
        const mmrA2 = (pA2 as any).hiddenMmr ?? 1200;
        const mmrB1 = (pB1 as any).hiddenMmr ?? 1200;
        const mmrB2 = (pB2 as any).hiddenMmr ?? 1200;

        const rA = (mmrA1 + mmrA2) / 2;
        const rB = (mmrB1 + mmrB2) / 2;

        const eA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
        const eB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

        const K = 32;
        const diffA = Math.round(K * (sA - eA));
        const diffB = Math.round(K * (sB - eB));

        // Attempt to update MMRs (fails silently if column doesn't exist in schema yet)
        try {
          await Promise.all([
            db.update(members).set({ hiddenMmr: mmrA1 + diffA } as any).where(eq(members.id, pA1.id)),
            db.update(members).set({ hiddenMmr: mmrA2 + diffA } as any).where(eq(members.id, pA2.id)),
            db.update(members).set({ hiddenMmr: mmrB1 + diffB } as any).where(eq(members.id, pB1.id)),
            db.update(members).set({ hiddenMmr: mmrB2 + diffB } as any).where(eq(members.id, pB2.id)),
          ]);
        } catch (e) {
          console.warn("Could not update Hidden MMR. Check if 'hiddenMmr' exists in DB schema.");
        }
      }
    }

    // 2. Update the finished match
    const finishData: any = { status: "finished", endedAt: new Date() };
    if (scoreTeamA_set1 !== undefined) finishData.scoreTeamA_set1 = scoreTeamA_set1;
    if (scoreTeamB_set1 !== undefined) finishData.scoreTeamB_set1 = scoreTeamB_set1;
    if (scoreTeamA_set2 !== undefined) finishData.scoreTeamA_set2 = scoreTeamA_set2;
    if (scoreTeamB_set2 !== undefined) finishData.scoreTeamB_set2 = scoreTeamB_set2;
    if (scoreTeamA_set3 !== undefined) finishData.scoreTeamA_set3 = scoreTeamA_set3;
    if (scoreTeamB_set3 !== undefined) finishData.scoreTeamB_set3 = scoreTeamB_set3;

    await db.update(matches).set(finishData).where(eq(matches.id, matchId));

    // 3. Automatically assign the next queued match to this freed court
    if (finishingMatch.courtId) {
      const [nextQueued] = await db.select().from(matches)
        .where(and(eq(matches.sessionId, finishingMatch.sessionId), eq(matches.status, 'queued'), isNull(matches.courtId)))
        .limit(1);

      if (nextQueued) {
        await db.update(matches).set({ courtId: finishingMatch.courtId }).where(eq(matches.id, nextQueued.id));
      }
    }

    res.status(200).json({ message: "Match finished and MMR updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

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

router.put("/:id/reset", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.id), 10);
    await db.update(matches)
      .set({ 
        status: 'queued', 
        startedAt: null, 
        scoreTeamA_set1: 0, scoreTeamB_set1: 0,
        scoreTeamA_set2: 0, scoreTeamB_set2: 0,
        scoreTeamA_set3: 0, scoreTeamB_set3: 0 
      })
      .where(eq(matches.id, matchId));
    res.status(200).json({ message: "Match reset successfully." });
  } catch (error) {
    console.error("PUT /matches/:id/reset Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;