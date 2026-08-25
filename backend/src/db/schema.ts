import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  pendingEmail: text("pending_email"), // Added for email change flow
  passwordHash: text("password_hash").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  role: text("role").default("community").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), 
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subscriptionStatus: text("subscription_status").default("inactive").notNull(), // 'active', 'inactive', 'lifetime'
  subscriptionEndsAt: timestamp("subscription_ends_at"), // NEW COLUMN
  socialMedia: jsonb("social_media").$type<{ platform: string; url: string }[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  grade: text("grade").notNull(), // e.g., 'A2', 'B1', 'B2', 'C1'
  gender: text("gender").notNull(), // 'M' or 'F'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});