import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  mobile: varchar("mobile", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const shareSessions = mysqlTable("share_sessions", {
  id: int("id").autoincrement().primaryKey(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  contextType: mysqlEnum("contextType", ["trip", "shared_home", "group_fund"]).notNull(),
  contextId: varchar("contextId", { length: 128 }).notNull(),
  contextName: text("contextName").notNull(),
  snapshotJson: text("snapshotJson").notNull(),
  snapshotHash: varchar("snapshotHash", { length: 128 }).notNull(),
  ownerKeyHash: varchar("ownerKeyHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type ShareSession = typeof shareSessions.$inferSelect;
export type InsertShareSession = typeof shareSessions.$inferInsert;

export const syncPackages = mysqlTable("sync_packages", {
  id: int("id").autoincrement().primaryKey(),
  packageTokenHash: varchar("packageTokenHash", { length: 128 }).notNull().unique(),
  packageToken: varchar("packageToken", { length: 256 }),
  sessionId: int("sessionId").notNull(),
  baseSnapshotHash: varchar("baseSnapshotHash", { length: 128 }).notNull(),
  editedSnapshotJson: text("editedSnapshotJson").notNull(),
  changeSummaryJson: text("changeSummaryJson").notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "applied", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  appliedAt: timestamp("appliedAt"),
});

export type SyncPackage = typeof syncPackages.$inferSelect;
export type InsertSyncPackage = typeof syncPackages.$inferInsert;
