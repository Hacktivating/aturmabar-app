import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  pendingEmail: text("pending_email"),
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
  subscriptionStatus: text("subscription_status").default("inactive").notNull(),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  socialMedia: jsonb("social_media").$type<{ platform: string; url: string }[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  gender: text("gender").default("male").notNull(),
  skillLevel: text("skill_level").default("C1").notNull(),
  avoidPartnerIds: integer("avoid_partner_ids").array().default([]),
  avoidOpponentIds: integer("avoid_opponent_ids").array().default([]),
  status: text("status").default("active").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const membershipPeriods = pgTable("membership_periods", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipPayments = pgTable("membership_payments", {
  id: serial("id").primaryKey(),
  periodId: integer("period_id").references(() => membershipPeriods.id, { onDelete: "cascade" }).notNull(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("unpaid").notNull(), // 'paid', 'unpaid'
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  scoringSystem: text("scoring_system").default("BWF 21 Points x 3 Sets").notNull(),
  customSets: integer("custom_sets"),
  customPoints: integer("custom_points"),
  pairingRule: text("pairing_rule").default("strict").notNull(),
  status: text("status").default("scheduled").notNull(),
  matchLimit: integer("match_limit").default(0),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  defaultFee: integer("default_fee").default(0).notNull(),
  memberDefaultFee: integer("member_default_fee").default(0).notNull(),
});

export const sessionCourts = pgTable("session_courts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const sessionAttendances = pgTable("session_attendances", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  status: text("status").default("active").notNull(),
  arrivedAt: timestamp("arrived_at").defaultNow().notNull(),
  isWalkIn: boolean("is_walk_in").default(false).notNull(),
  paymentAmount: integer("payment_amount").default(0).notNull(),
  paymentStatus: text("payment_status").default("unpaid").notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  courtId: integer("court_id").references(() => sessionCourts.id, { onDelete: "set null" }),
  teamA_player1: integer("team_a_p1").references(() => members.id),
  teamA_player2: integer("team_a_p2").references(() => members.id),
  teamB_player1: integer("team_b_p1").references(() => members.id),
  teamB_player2: integer("team_b_p2").references(() => members.id),
  matchType: text("match_type").notNull(),
  status: text("status").default("queued").notNull(),
  scoreTeamA_set1: integer("score_a_1").default(0),
  scoreTeamB_set1: integer("score_b_1").default(0),
  scoreTeamA_set2: integer("score_a_2").default(0),
  scoreTeamB_set2: integer("score_b_2").default(0),
  scoreTeamA_set3: integer("score_a_3").default(0),
  scoreTeamB_set3: integer("score_b_3").default(0),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
});

export const sessionExpenses = pgTable("session_expenses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const communitiesRelations = relations(communities, ({ many }) => ({
  members: many(members),
  sessions: many(sessions),
  membershipPeriods: many(membershipPeriods),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  community: one(communities, { fields: [members.communityId], references: [communities.id] }),
  attendances: many(sessionAttendances),
  membershipPayments: many(membershipPayments),
}));

export const membershipPeriodsRelations = relations(membershipPeriods, ({ one, many }) => ({
  community: one(communities, { fields: [membershipPeriods.communityId], references: [communities.id] }),
  payments: many(membershipPayments),
}));

export const membershipPaymentsRelations = relations(membershipPayments, ({ one }) => ({
  period: one(membershipPeriods, { fields: [membershipPayments.periodId], references: [membershipPeriods.id] }),
  member: one(members, { fields: [membershipPayments.memberId], references: [members.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  community: one(communities, { fields: [sessions.communityId], references: [communities.id] }),
  courts: many(sessionCourts),
  attendances: many(sessionAttendances),
  matches: many(matches),
  expenses: many(sessionExpenses),
}));

export const sessionCourtsRelations = relations(sessionCourts, ({ one, many }) => ({
  session: one(sessions, { fields: [sessionCourts.sessionId], references: [sessions.id] }),
  matches: many(matches),
}));

export const sessionAttendancesRelations = relations(sessionAttendances, ({ one }) => ({
  session: one(sessions, { fields: [sessionAttendances.sessionId], references: [sessions.id] }),
  member: one(members, { fields: [sessionAttendances.memberId], references: [members.id] }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  session: one(sessions, { fields: [matches.sessionId], references: [sessions.id] }),
  court: one(sessionCourts, { fields: [matches.courtId], references: [sessionCourts.id] }),
  teamA_p1: one(members, { fields: [matches.teamA_player1], references: [members.id] }),
  teamA_p2: one(members, { fields: [matches.teamA_player2], references: [members.id] }),
  teamB_p1: one(members, { fields: [matches.teamB_player1], references: [members.id] }),
  teamB_p2: one(members, { fields: [matches.teamB_player2], references: [members.id] }),
}));