import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { members, communities, membershipPeriods, membershipPayments } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(verifyAuth);

const getCommunity = async (userId: number) => {
  const [community] = await db.select().from(communities).where(eq(communities.ownerId, userId));
  return community;
};

// --- ROSTER MANAGEMENT ---

router.get("/", async (req: AuthRequest, res) => {
  try {
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });
    const roster = await db.select().from(members).where(eq(members.communityId, community.id)).orderBy(members.joinedAt);
    res.status(200).json(roster);
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, phone, gender, skillLevel, avoidPartnerIds, avoidOpponentIds, status } = req.body;
    if (!name) return res.status(400).json({ error: "Member name is required." });
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    await db.insert(members).values({
        communityId: community.id, name, phone: phone || null,
        gender: gender || "male", skillLevel: skillLevel || "C1",
        avoidPartnerIds: avoidPartnerIds || [], avoidOpponentIds: avoidOpponentIds || [],
        status: status || "active",
    });
    res.status(201).json({ message: "Member added successfully." });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    const { name, phone, gender, skillLevel, avoidPartnerIds, avoidOpponentIds, status } = req.body;
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    await db.update(members)
        .set({ name, phone, gender, skillLevel, avoidPartnerIds, avoidOpponentIds, status })
        .where(eq(members.id, memberId));
    res.status(200).json({ message: "Member updated successfully." });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    await db.delete(members).where(eq(members.id, memberId));
    res.status(200).json({ message: "Member deleted successfully." });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

// --- MEMBERSHIP PERIODS & PAYMENTS ---

router.get("/periods", async (req: AuthRequest, res) => {
  try {
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });
    const periods = await db.select().from(membershipPeriods)
      .where(eq(membershipPeriods.communityId, community.id))
      .orderBy(desc(membershipPeriods.startDate));
    res.json(periods);
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

router.post("/periods", async (req: AuthRequest, res) => {
  try {
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });
    const { name, startDate, endDate } = req.body;
    const [period] = await db.insert(membershipPeriods).values({
      communityId: community.id, name, startDate: new Date(startDate), endDate: new Date(endDate)
    }).returning();
    res.json(period);
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

router.delete("/periods/:id", async (req: AuthRequest, res) => {
  try {
    await db.delete(membershipPeriods).where(eq(membershipPeriods.id, parseInt(String(req.params.id))));
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

// Get payments for a specific period
router.get("/periods/:id/payments", async (req: AuthRequest, res) => {
  try {
    const payments = await db.select({
      id: membershipPayments.id, memberId: membershipPayments.memberId,
      status: membershipPayments.status, memberName: members.name
    })
    .from(membershipPayments)
    .innerJoin(members, eq(membershipPayments.memberId, members.id))
    .where(eq(membershipPayments.periodId, parseInt(String(req.params.id))))
    .orderBy(members.name);
    res.json(payments);
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

// Add member to period
router.post("/periods/:id/payments", async (req: AuthRequest, res) => {
  try {
    const { memberId } = req.body;
    await db.insert(membershipPayments).values({
      periodId: parseInt(String(req.params.id)), memberId, status: 'unpaid'
    });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

// Toggle payment status
router.put("/periods/:periodId/payments/:id", async (req: AuthRequest, res) => {
  try {
    await db.update(membershipPayments).set({ status: req.body.status }).where(eq(membershipPayments.id, parseInt(String(req.params.id))))  ;
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

// Remove member from period
router.delete("/periods/:periodId/payments/:id", async (req: AuthRequest, res) => {
  try {
    await db.delete(membershipPayments).where(eq(membershipPayments.id, parseInt(String(req.params.id))));
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Internal server error." }); }
});

export default router;