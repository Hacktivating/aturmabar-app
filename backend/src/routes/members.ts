import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { members, communities } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(verifyAuth);

// Middleware to fetch the authenticated user's community
const getCommunity = async (userId: number) => {
  const [community] = await db.select().from(communities).where(eq(communities.ownerId, userId));
  return community;
};

// GET: Fetch all members for the community
router.get("/", async (req: AuthRequest, res) => {
  try {
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    const roster = await db
      .select()
      .from(members)
      .where(eq(members.communityId, community.id))
      .orderBy(members.joinedAt);

    res.status(200).json(roster);
  } catch (error) {
    console.error("GET /members Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST: Add a new member
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, phone, gender, skillLevel, avoidPartners, avoidOpponents, status } = req.body;
    if (!name) return res.status(400).json({ error: "Member name is required." });

    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    await db.insert(members).values({
        communityId: community.id,
        name,
        phone: phone || null,
        gender: gender || "male",
        skillLevel: skillLevel || "C1",
        avoidPartners: avoidPartners || [],
        avoidOpponents: avoidOpponents || [],
        status: status || "active",
    });

    res.status(201).json({ message: "Member added successfully." });
  } catch (error) {
    console.error("POST /members Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// PUT: Update an existing member
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    const { name, phone, gender, skillLevel, avoidPartners, avoidOpponents, status } = req.body;

    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    // Ensure the member belongs to the authenticated user's community
    const [existingMember] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.communityId, community.id)));

    if (!existingMember) return res.status(404).json({ error: "Member not found or unauthorized." });

    await db.update(members)
        .set({ name, phone, gender, skillLevel, avoidPartners, avoidOpponents, status })
        .where(eq(members.id, memberId));

    res.status(200).json({ message: "Member updated successfully." });
  } catch (error) {
    console.error("PUT /members/:id Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE: Remove a member
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const memberId = parseInt(String(req.params.id), 10);
    
    const community = await getCommunity(req.user!.userId);
    if (!community) return res.status(404).json({ error: "Community not found." });

    const [deletedMember] = await db.delete(members)
      .where(and(eq(members.id, memberId), eq(members.communityId, community.id)))
      .returning();

    if (!deletedMember) return res.status(404).json({ error: "Member not found or unauthorized." });

    res.status(200).json({ message: "Member deleted successfully." });
  } catch (error) {
    console.error("DELETE /members/:id Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;