import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { users, verificationTokens, passwordResetTokens, communities } from "../db/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer";
import { Request, Response, NextFunction } from "express";

const router = Router();

export interface AuthRequest extends Request {
  user?: { userId: number; role?: string };
}

export const verifyAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as { userId: number, role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword, communityName, socialMedia, logo } = req.body;

    if (!username || !email || !password || !confirmPassword || !communityName) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const existingUser = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username or email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({ username, email, passwordHash, isVerified: false })
      .returning();

    // Generate URL-friendly slug
    const slug = communityName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    // Insert community
    await db.insert(communities).values({
      name: communityName,
      slug: slug,
      logo: logo || null,
      ownerId: newUser.id,
      socialMedia: Array.isArray(socialMedia) ? socialMedia : [],
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({ userId: newUser.id, token, expiresAt });
    
    try { await sendVerificationEmail(email, token); } catch (mailErr) { console.error(mailErr); }

    return res.status(201).json({ message: "Registration successful. Please verify your email." });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Find valid token
    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        gt(verificationTokens.expiresAt, new Date())
      ),
    });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Mark user as verified
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, record.userId));

    // Delete used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, record.id));

    return res.status(200).json({ message: "Email successfully verified. You can now log in." });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifier and password are required" });
    }

    const user = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, identifier), eq(u.username, identifier)),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // Exposed role for frontend routing logic
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Return 200 even if user doesn't exist to prevent email enumeration
      return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await sendPasswordResetEmail(user.email, token);

    return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password are required" });

    const record = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, record.userId));

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, record.id));

    return res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// VERIFY EMAIL CHANGE
router.post("/verify-email-change", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    // 1. Find the token using direct select (bulletproof)
    const [record] = await db.select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          gt(verificationTokens.expiresAt, new Date())
        )
      );

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired token. Please request a new link." });
    }

    // 2. Find the user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, record.userId));

    if (!user || !user.pendingEmail) {
      return res.status(400).json({ error: "No pending email change found for this account." });
    }

    // 3. Update the user's email and clear the pending state
    await db.update(users)
      .set({ 
        email: user.pendingEmail, 
        pendingEmail: null 
      })
      .where(eq(users.id, user.id));

    // 4. Delete the used token to prevent reuse
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.id, record.id));

    return res.status(200).json({ message: "Email successfully updated." });
  } catch (error) {
    // This will print the exact error to your backend terminal if it fails
    console.error("VERIFY EMAIL ERROR:", error);
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

export default router;