import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, communities } from "../db/schema";
import { verifyAuth, AuthRequest } from "../middleware/auth";
import crypto from "crypto";
import { verificationTokens } from "../db/schema";
import { sendEmailChangeVerification } from "../utils/mailer";

const router = Router();
router.use(verifyAuth);

router.get("/me", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const community = await db.query.communities.findFirst({ where: eq(communities.ownerId, userId) });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user, community });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Profile (Community Name & Logo)
router.put("/profile", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { communityName, logo } = req.body;
    
    if (communityName || logo) {
      const updateData: any = {};
      if (communityName) updateData.name = communityName;
      if (logo) updateData.logo = logo;
      await db.update(communities).set(updateData).where(eq(communities.ownerId, userId));
    }
    res.status(200).json({ message: "Profile updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Password
router.put("/password", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;
    
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const isValid = await bcrypt.compare(oldPassword, user!.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Incorrect old password." });
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request Email Change
router.post("/request-email", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { newEmail } = req.body;
    
    const exists = await db.query.users.findFirst({ where: eq(users.email, newEmail) });
    if (exists) return res.status(409).json({ error: "Email is already registered." });
    
    await db.update(users).set({ pendingEmail: newEmail }).where(eq(users.id, userId));
    
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(verificationTokens).values({ userId, token, expiresAt });
    
    await sendEmailChangeVerification(newEmail, token);
    res.status(200).json({ message: "Verification link sent to new email." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;