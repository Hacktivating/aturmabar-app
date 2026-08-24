import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { users, verificationTokens, passwordResetTokens } from "../db/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer";

const router = Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username or email is already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        isVerified: false,
      })
      .returning();

    // Create verification token (24-hour expiration)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, token);
    } catch (mailErr) {
      console.error("Email send error:", mailErr);
    }

    return res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
    });
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

export default router;