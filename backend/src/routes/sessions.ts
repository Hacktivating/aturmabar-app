import { Router } from "express";
import { eq, and, desc, gte } from "drizzle-orm";
import { db } from "../db";
import { sessions, sessionCourts, communities, sessionAttendances, members, sessionExpenses, membershipPayments } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(verifyAuth);

const getCommunity = async (userId: number) => {
  const [community] = await db.select().from(communities).where(eq(communities.ownerId, userId));
  return community;
};

// GET: Fetch all sessions (Filterable by future/past)
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

// POST: Create a new future session and initialize courts
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, date, courtCount, scoringSystem, customSets, customPoints, pairingRule } = req.body;
    
    if (!name || !date || !courtCount) {
      return res.status(400).json({ error: "Name, date, and court count are required." });
    }

    const sessionDate = new Date(date);
    if (sessionDate < new Date()) {
      return res.status(400).json({ error: "Sessions can only be scheduled for future dates." });
    }

    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    // 1. Create the session
    const [newSession] = await db.insert(sessions).values({
      communityId: community.id,
      name,
      date: sessionDate,
      scoringSystem: scoringSystem || "BWF 21 Points x 3 Sets",
      customSets: customSets || null,
      customPoints: customPoints || null,
      pairingRule: pairingRule || "strict",
      status: "scheduled",
    }).returning();

    // 2. Initialize the requested number of courts
    const courtsToInsert = Array.from({ length: courtCount }).map((_, i) => ({
      sessionId: newSession.id,
      name: `Court ${i + 1}`,
      isActive: true,
    }));

    await db.insert(sessionCourts).values(courtsToInsert);

    res.status(201).json({ message: "Session scheduled successfully.", session: newSession });
  } catch (error) {
    console.error("POST /sessions Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET: Fetch a single session with its courts and expenses
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

// DELETE: Remove a scheduled session
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

// PUT: Start the session manually
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

// GET: Fetch all attendances for a session
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

// POST: Add existing member to session
router.post("/:id/attendances", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { memberId } = req.body;
    
    // Check if already attended
    const [existing] = await db.select().from(sessionAttendances)
      .where(and(eq(sessionAttendances.sessionId, sessionId), eq(sessionAttendances.memberId, memberId)));
    
    if (existing) return res.status(400).json({ error: "Member already in session." });

    await db.insert(sessionAttendances).values({
      sessionId,
      memberId,
      status: "active"
    });
    res.status(201).json({ message: "Attendance added." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT: Update attendance status (active, resting, cancelled)
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

// POST: Add walk-in player (Creates member + attendance)
router.post("/:id/walk-in", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { name, gender, skillLevel } = req.body;
    const community = await getCommunity(req.user!.userId);
    
    if (!community) return res.status(404).json({ error: "Community not found." });

    // 1. Create Member
    const [newMember] = await db.insert(members).values({
      communityId: community.id,
      name,
      gender: gender || "male",
      skillLevel: skillLevel || "C1",
      status: "active"
    }).returning();

    // 2. Add Attendance
    await db.insert(sessionAttendances).values({
      sessionId,
      memberId: newMember.id,
      status: "active",
      isWalkIn: true
    });

    res.status(201).json({ message: "Walk-in added." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- COURT MANAGEMENT ---

// PUT: Update court details (name, active status)
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

// POST: Add a new court to a session
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

// DELETE: Remove a court
router.delete("/:id/courts/:courtId", async (req: AuthRequest, res) => {
  try {
    const courtId = parseInt(String(req.params.courtId), 10);
    await db.delete(sessionCourts).where(eq(sessionCourts.id, courtId));
    res.status(200).json({ message: "Court deleted." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT: Update session settings
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { name, scoringSystem, customSets, customPoints, pairingRule, matchLimit } = req.body;
    await db.update(sessions)
      .set({ name, scoringSystem, customSets, customPoints, pairingRule, matchLimit })
      .where(eq(sessions.id, sessionId));
    res.status(200).json({ message: "Session updated." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT: Update member's grade directly from session
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

// PUT: End a session
router.put("/:id/finish", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    await db.update(sessions).set({ status: 'finished', endedAt: new Date() }).where(eq(sessions.id, sessionId));
    res.status(200).json({ message: "Session ended." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// --- BILLING MANAGEMENT ---

// POST: Sync membership period into session billing
router.post("/:id/billing/sync-period", async (req: AuthRequest, res) => {
  try {
    const sessionId = parseInt(String(req.params.id), 10);
    const { periodId } = req.body;
    
    // 1. Get the session to know default member fee
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return res.status(404).json({ error: "Session not found." });

    // 2. Get all payments/members for this specific period
    const periodMembers = await db.select().from(membershipPayments).where(eq(membershipPayments.periodId, periodId));
    
    // 3. Get current session attendances to prevent overwriting active players
    const currentAttendances = await db.select().from(sessionAttendances).where(eq(sessionAttendances.sessionId, sessionId));
    const attendedMap = new Map(currentAttendances.map(a => [a.memberId, a]));

    const promises = periodMembers.map(pm => {
      const isPaid = pm.status === 'paid';
      const paymentStatus = isPaid ? 'member' : 'member_unpaid';
      const paymentAmount = isPaid ? session.memberDefaultFee : 0;

      if (attendedMap.has(pm.memberId)) {
        // Update existing attendee (whether active, resting, or absent)
        const existing = attendedMap.get(pm.memberId)!;
        return db.update(sessionAttendances)
          .set({ paymentStatus, paymentAmount })
          .where(eq(sessionAttendances.id, existing.id));
      } else {
        // Insert missing period member as a ghost 'absent' record
        return db.insert(sessionAttendances).values({
          sessionId,
          memberId: pm.memberId,
          status: "absent",
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

// PUT: Reset All Payments
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

// PUT: Update Session Default Fee
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

// PUT: Update Player Payment Status
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

// POST: Add Expense
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

// DELETE: Delete Expense
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