import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, ne } from "drizzle-orm";
import { db } from "../db";
import { users, communities } from "../db/schema";
import { verifyAdmin } from "../middleware/adminAuth";

const router = Router();

// Apply admin verification middleware to all routes in this file
router.use(verifyAdmin);

// GET: Fetch all community accounts
router.get("/accounts", async (req, res) => {
  try {
    const accounts = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(ne(users.role, "admin")); // Exclude super admin accounts

    // For each user, fetch their associated communities (if any)
    const accountsWithCommunities = await Promise.all(
      accounts.map(async (account) => {
        const userCommunities = await db
          .select()
          .from(communities)
          .where(eq(communities.ownerId, account.id));
        
        return {
          ...account,
          communities: userCommunities,
        };
      })
    );

    res.status(200).json(accountsWithCommunities);
  } catch (error) {
    console.error("Fetch Accounts Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH: Force password override
router.patch("/accounts/:id/password", async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, targetUserId));

    res.status(200).json({ message: "Account password successfully overridden." });
  } catch (error) {
    console.error("Override Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH: Update community subscription status
router.patch("/communities/:id/subscription", async (req, res) => {
  try {
    const communityId = parseInt(req.params.id, 10);
    const { status } = req.body; // e.g., 'active', 'inactive', 'lifetime'

    if (!status) {
      return res.status(400).json({ error: "Subscription status is required." });
    }

    await db
      .update(communities)
      .set({ subscriptionStatus: status })
      .where(eq(communities.id, communityId));

    res.status(200).json({ message: "Subscription status updated." });
  } catch (error) {
    console.error("Update Subscription Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;