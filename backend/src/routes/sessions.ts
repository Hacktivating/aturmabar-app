import { Router } from "express";
import { eq, and, desc, gte, asc } from "drizzle-orm";
import { db } from "../db";
import { sessions, sessionCourts, communities, sessionAttendances, members, sessionExpenses, membershipPayments, matches } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(verifyAuth);

const getCommunity = async (userId: number) => {
  const [community] = await db.select().from(communities).where(eq(communities.ownerId, userId));
  return community;
};

router.get("/", async (req: AuthRequest, res) => {
  try {
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    const allSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.communityId, community.id))
      .orderBy(desc(sessions.date));

    res.status(200).json(allSessions);
  } catch (error) {
    console.error("GET /sessions Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { 
      name, date, courtCount, scoringSystem, customSets, customPoints, 
      pairingRule, sessionType, opposingCommunityName, matchQuotas 
    } = req.body;
    
    if (!name || !date || !courtCount) {
      return res.status(400).json({ error: "Name, date, and court count are required." });
    }

    const sessionDate = new Date(date);
    if (sessionDate < new Date()) {
      return res.status(400).json({ error: "Sessions can only be scheduled for future dates." });
    }

    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    const [newSession] = await db.insert(sessions).values({
      communityId: community.id,
      name,
      date: sessionDate,
      sessionType: sessionType || "regular",
      opposingCommunityName: opposingCommunityName || null,
      matchQuotas: matchQuotas || null,
      scoringSystem: scoringSystem || "BWF 21 Points x 3 Sets",
      customSets: customSets || null,
      customPoints: customPoints || null,
      pairingRule: pairingRule || "strict",
      status: "scheduled",
    }).returning();

    const courtsToInsert = Array.from({ length: courtCount }).map((_, i) => ({
      sessionId: newSession.id,
      name: `Court ${i + 1}`,
      isActive: true,
    }));

    await db.insert(sessionCourts).values(courtsToInsert);

    // NEW: Auto-generate Sparring matches based on quota
    if (sessionType === 'sparring' && matchQuotas) {
      const sparringMatches = [];
      const types = ['MD', 'WD', 'XD'] as const;
      
      for (const type of types) {
        const count = matchQuotas[type] || 0;
        for (let i = 1; i <= count; i++) {
          sparringMatches.push({
            sessionId: newSession.id,
            name: `${type} ${i}`,
            matchType: type,
            status: 'queued'
          });
        }
      }

      if (sparringMatches.length > 0) {
        await db.insert(matches).values(sparringMatches);
      }
    }

    res.status(201).json({ message: "Session scheduled successfully.", session: newSession });
  } catch (error) {
    console.error("POST /sessions Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const community = await getCommunity(req.user!.userId);
    
    if (!community) return res.status(404).json({ error: "Community not found." });

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.communityId, community.id)));

    if (!session) return res.status(404).json({ error: "Session not found." });

    const courts = await db
      .select()
      .from(sessionCourts)
      .where(eq(sessionCourts.sessionId, session.id))
      .orderBy(sessionCourts.id);

    const expenses = await db
      .select()
      .from(sessionExpenses)
      .where(eq(sessionExpenses.sessionId, session.id))
      .orderBy(desc(sessionExpenses.createdAt));

    res.status(200).json({ ...session, courts, expenses });
  } catch (error) {
    console.error("GET /sessions/:id Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const community = await getCommunity(req.user!.userId);
    
    if (!community) return res.status(404).json({ error: "Community not found." });

    const [deleted] = await db.delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.communityId, community.id)))
      .returning();

    if (!deleted) return res.status(404).json({ error: "Session not found or unauthorized." });

    res.status(200).json({ message: "Session deleted successfully." });
  } catch (error) {
    console.error("DELETE /sessions/:id Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:id/start", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const community = await getCommunity(req.user!.userId);
    
    if (!community) return res.status(404).json({ error: "Community not found." });

    await db.update(sessions)
      .set({ status: "active", startedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.communityId, community.id)));

    res.status(200).json({ message: "Session started." });
  } catch (error) {
    console.error("PUT /sessions/:id/start Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- ATTENDANCE MANAGEMENT ---

router.get("/:id/attendances", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const data = await db
      .select({ attendance: sessionAttendances, member: members })
      .from(sessionAttendances)
      .innerJoin(members, eq(sessionAttendances.memberId, members.id))
      .where(eq(sessionAttendances.sessionId, sessionId));
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:id/attendances", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { memberId, team } = req.body;
    
    const [existing] = await db.select().from(sessionAttendances)
      .where(and(eq(sessionAttendances.sessionId, sessionId), eq(sessionAttendances.memberId, memberId)));
    
    if (existing) return res.status(400).json({ error: "Member already in session." });

    await db.insert(sessionAttendances).values({
      sessionId,
      memberId,
      team: team || "home",
      status: "active"
    });
    res.status(201).json({ message: "Attendance added." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:id/attendances/:attendanceId", async (req: AuthRequest, res) => {
  try {
    const attendanceId = parseInt(String(req.params.attendanceId), 10);
    const { status } = req.body;
    await db.update(sessionAttendances).set({ status }).where(eq(sessionAttendances.id, attendanceId));
    res.status(200).json({ message: "Status updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:id/walk-in", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { name, gender, skillLevel, team } = req.body;
    const community = await getCommunity(req.user!.userId);
    
    if (!community) return res.status(404).json({ error: "Community not found." });

    const [newMember] = await db.insert(members).values({
      communityId: community.id,
      name,
      gender: gender || "male",
      skillLevel: skillLevel || "C1",
      status: "active"
    }).returning();

    await db.insert(sessionAttendances).values({
      sessionId,
      memberId: newMember.id,
      team: team || "home",
      status: "active",
      isWalkIn: true
    });

    res.status(201).json({ message: "Walk-in added." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- COURT MANAGEMENT ---

router.put("/:id/courts/:courtId", async (req: AuthRequest, res) => {
  try {
    const courtId = parseInt(String(req.params.courtId), 10);
    const { name, isActive } = req.body;
    await db.update(sessionCourts).set({ name, isActive }).where(eq(sessionCourts.id, courtId));
    res.status(200).json({ message: "Court updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/:id/courts", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { name } = req.body;
    await db.insert(sessionCourts).values({ sessionId, name, isActive: true });
    res.status(201).json({ message: "Court added." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/:id/courts/:courtId", async (req: AuthRequest, res) => {
  try {
    const courtId = parseInt(String(req.params.courtId), 10);
    await db.delete(sessionCourts).where(eq(sessionCourts.id, courtId));
    res.status(200).json({ message: "Court deleted." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { name, scoringSystem, customSets, customPoints, pairingRule, matchLimit, sessionType, opposingCommunityName, matchQuotas } = req.body;
    await db.update(sessions)
      .set({ name, scoringSystem, customSets, customPoints, pairingRule, matchLimit, sessionType, opposingCommunityName, matchQuotas })
      .where(eq(sessions.id, sessionId));
    res.status(200).json({ message: "Session updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:id/members/:memberId/grade", async (req: AuthRequest, res) => {
  try {
    const memberId = parseInt(String(req.params.memberId), 10);
    const { skillLevel } = req.body;
    await db.update(members).set({ skillLevel }).where(eq(members.id, memberId));
    res.status(200).json({ message: "Grade updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/:id/finish", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    await db.update(sessions).set({ status: 'finished', endedAt: new Date() }).where(eq(sessions.id, sessionId));
    res.status(200).json({ message: "Session ended." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- MATCH MANAGEMENT SPECIFIC TO SPARRING ---
router.put("/matches/:matchId/sparring", async (req: AuthRequest, res) => {
  try {
    const matchId = parseInt(String(req.params.matchId), 10);
    const { 
      teamA_player1, teamA_player2, teamB_player1, teamB_player2, 
      courtId, status, 
      scoreTeamA_set1, scoreTeamB_set1,
      scoreTeamA_set2, scoreTeamB_set2,
      scoreTeamA_set3, scoreTeamB_set3
    } = req.body;

    const payload: any = {
      teamA_player1: teamA_player1 || null,
      teamA_player2: teamA_player2 || null,
      teamB_player1: teamB_player1 || null,
      teamB_player2: teamB_player2 || null,
      courtId: courtId || null,
      status: status || 'queued',
      scoreTeamA_set1: scoreTeamA_set1 || 0,
      scoreTeamB_set1: scoreTeamB_set1 || 0,
      scoreTeamA_set2: scoreTeamA_set2 || 0,
      scoreTeamB_set2: scoreTeamB_set2 || 0,
      scoreTeamA_set3: scoreTeamA_set3 || 0,
      scoreTeamB_set3: scoreTeamB_set3 || 0,
    };

    // Auto-handle timestamps based on status
    if (status === 'on_court') payload.startedAt = new Date();
    if (status === 'finished') payload.endedAt = new Date();

    await db.update(matches).set(payload).where(eq(matches.id, matchId));
    res.status(200).json({ message: "Match updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error updating sparring match." });
  }
});

// --- BILLING MANAGEMENT ---

router.post("/:id/billing/sync-period", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { periodId } = req.body;
    
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found." });

    const periodMembers = await db.select().from(membershipPayments).where(eq(membershipPayments.periodId, periodId));
    
    const currentAttendances = await db.select().from(sessionAttendances).where(eq(sessionAttendances.sessionId, sessionId));
    const attendedMap = new Map(currentAttendances.map(a => [a.memberId, a]));

    const promises = periodMembers.map(pm => {
      const isPaid = pm.status === 'paid';
      const paymentStatus = isPaid ? 'member' : 'member_unpaid';
      const paymentAmount = isPaid ? session.memberDefaultFee : 0;

      if (attendedMap.has(pm.memberId)) {
        const existing = attendedMap.get(pm.memberId)!;
        return db.update(sessionAttendances)
          .set({ paymentStatus, paymentAmount })
          .where(eq(sessionAttendances.id, existing.id));
      } else {
        return db.insert(sessionAttendances).values({
          sessionId,
          memberId: pm.memberId,
          status: "absent",
          team: "home",
          isWalkIn: false,
          paymentStatus,
          paymentAmount
        });
      }
    });

    await Promise.all(promises);
    res.json({ success: true, message: "Synced successfully." });
  } catch (error) {
    console.error("Sync period error:", error);
    res.status(500).json({ error: "Failed to sync period members." });
  }
});

router.put("/:id/billing/reset", async (req: AuthRequest, res) => {
  try {
    await db.update(sessionAttendances)
      .set({ paymentAmount: 0, paymentStatus: 'unpaid' })
      .where(eq(sessionAttendances.sessionId, parseInt(String(req.params.id))));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset billing" });
  }
});

router.put("/:id/billing/default-fee", async (req: AuthRequest, res) => {
  try {
    const { defaultFee, memberDefaultFee } = req.body;
    await db.update(sessions)
      .set({ defaultFee, memberDefaultFee })
      .where(eq(sessions.id, parseInt(String(req.params.id))));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update default fee" });
  }
});

router.put("/:id/attendances/:attendanceId/payment", async (req: AuthRequest, res) => {
  try {
    const { paymentAmount, paymentStatus } = req.body;
    await db.update(sessionAttendances)
      .set({ paymentAmount, paymentStatus })
      .where(eq(sessionAttendances.id, parseInt(String(req.params.attendanceId))));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update player payment" });
  }
});

router.post("/:id/expenses", async (req: AuthRequest, res) => {
  try {
    const { description, amount } = req.body;
    await db.insert(sessionExpenses).values({
      sessionId: parseInt(String(req.params.id)),
      description,
      amount
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to add expense" });
  }
});

router.delete("/:id/expenses/:expenseId", async (req: AuthRequest, res) => {
  try {
    await db.delete(sessionExpenses)
      .where(eq(sessionExpenses.id, parseInt(String(req.params.expenseId))));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;