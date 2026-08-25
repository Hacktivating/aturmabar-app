import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, ne } from "drizzle-orm";
import { db } from "../db";
import { users, communities } from "../db/schema";
import { verifyAdmin } from "../middleware/adminAuth";

const router = Router();
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
      .where(ne(users.role, "admin"));

    const accountsWithCommunities = await Promise.all(
      accounts.map(async (account) => {
        const userCommunities = await db
          .select()
          .from(communities)
          .where(eq(communities.ownerId, account.id));
        return { ...account, communities: userCommunities };
      })
    );

    res.status(200).json(accountsWithCommunities);
  } catch (error) {
    console.error("GET /accounts Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: Create a new account manually
router.post("/accounts", async (req, res) => {
  try {
    const { username, email, password, communityName, socialMedia, isVerified, subscriptionStatus } = req.body;

    if (!username || !email || !password || !communityName) {
      return res.status(400).json({ error: "Required fields missing." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({ username, email, passwordHash, isVerified: isVerified ?? true })
      .returning();

    const slug = communityName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    await db.insert(communities).values({
      name: communityName,
      slug,
      ownerId: newUser.id,
      subscriptionStatus: subscriptionStatus || "inactive",
      socialMedia: Array.isArray(socialMedia) ? socialMedia : [],
      logo: '🏸' 
    });

    res.status(201).json({ message: "Account created successfully." });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("POST /accounts Error:", error);
    if (error.code === '23505') return res.status(409).json({ error: "Email or username already exists." });
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT: Update an existing account
router.put("/accounts/:id", async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { username, email, communityName } = req.body;

    // 1. Only build update object with explicitly provided strings to prevent NULL constraint violations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userUpdate: any = {};
    if (username) userUpdate.username = username;
    if (email) userUpdate.email = email;

    if (Object.keys(userUpdate).length > 0) {
      await db.update(users)
        .set(userUpdate)
        .where(eq(users.id, targetUserId));
    }

    // 2. Safely update community 
    if (communityName) {
      await db.update(communities)
        .set({ name: communityName })
        .where(eq(communities.ownerId, targetUserId));
    }

    res.status(200).json({ message: "Account updated successfully." });
  } catch (error) {
    console.error("PUT /accounts/:id Error:", error);
    res.status(500).json({ error: "Internal server error updating account" });
  }
});

// PATCH: Update Subscription Status & Dates
router.patch("/accounts/:id/subscription", async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { type, customDate } = req.body; 

    let status = "active";
    let endsAt: Date | null = new Date();

    if (type === 'revoke') {
      status = "inactive";
      endsAt = null;
    } else if (type === 'lifetime') {
      status = "lifetime";
      endsAt = null;
    } else if (type === 'custom' && customDate) {
      endsAt = new Date(customDate);
    } else {
      const daysToAdd = type === '2_weeks' ? 14 : type === '1_month' ? 30 : type === '3_months' ? 90 : 0;
      endsAt.setDate(endsAt.getDate() + daysToAdd);
    }

    await db.update(communities)
      .set({ subscriptionStatus: status, subscriptionEndsAt: endsAt })
      .where(eq(communities.ownerId, targetUserId));

    res.status(200).json({ message: "Subscription updated successfully." });
  } catch (error) {
    console.error("PATCH /accounts/:id/subscription Error:", error);
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

    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, targetUserId));

    res.status(200).json({ message: "Password overridden successfully." });
  } catch (error) {
    console.error("PATCH /accounts/:id/password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE: Remove an account completely
router.delete("/accounts/:id", async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    await db.delete(users).where(eq(users.id, targetUserId));
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("DELETE /accounts/:id Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;