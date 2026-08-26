import { Router } from "express";
import { eq, and, desc, gte } from "drizzle-orm";
import { db } from "../db";
import { sessions, sessionCourts, communities, sessionAttendances, members } from "../db/schema";
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

// GET: Fetch a single session with its courts
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

    res.status(200).json({ ...session, courts });
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
      .set({ status: "active" })
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
    const { name, scoringSystem, customSets, customPoints, pairingRule } = req.body;
    await db.update(sessions)
      .set({ name, scoringSystem, customSets, customPoints, pairingRule })
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

export default router;