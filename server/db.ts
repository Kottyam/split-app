import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, shareSessions, syncPackages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}


export type ShareContextType = 'trip' | 'shared_home' | 'group_fund';

export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSnapshot(snapshotJson: string): string {
  return createHash('sha256').update(snapshotJson).digest('hex');
}

export async function createShareSession(input: {
  contextType: ShareContextType;
  contextId: string;
  contextName: string;
  snapshotJson: string;
  ownerKey: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const shareToken = createOpaqueToken();
  await db.insert(shareSessions).values({
    tokenHash: hashShareToken(shareToken),
    contextType: input.contextType,
    contextId: input.contextId,
    contextName: input.contextName,
    snapshotJson: input.snapshotJson,
    snapshotHash: hashSnapshot(input.snapshotJson),
    ownerKeyHash: hashShareToken(input.ownerKey),
    expiresAt: input.expiresAt,
  });
  return { shareToken, snapshotHash: hashSnapshot(input.snapshotJson) };
}

export async function getShareSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(shareSessions).where(eq(shareSessions.tokenHash, hashShareToken(token))).limit(1);
  const session = rows[0];
  if (!session || session.expiresAt.getTime() < Date.now()) return undefined;
  return session;
}

export async function createSyncPackage(input: {
  packageToken: string;
  sessionId: number;
  baseSnapshotHash: string;
  editedSnapshotJson: string;
  changeSummaryJson: string;
  recipientName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  await db.insert(syncPackages).values({
    packageTokenHash: hashShareToken(input.packageToken),
    packageToken: input.packageToken,
    sessionId: input.sessionId,
    baseSnapshotHash: input.baseSnapshotHash,
    editedSnapshotJson: input.editedSnapshotJson,
    changeSummaryJson: input.changeSummaryJson,
    recipientName: input.recipientName,
  });
  return { packageToken: input.packageToken };
}

export async function getSyncPackageByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({
    package: syncPackages,
    session: shareSessions,
  }).from(syncPackages).innerJoin(shareSessions, eq(syncPackages.sessionId, shareSessions.id)).where(eq(syncPackages.packageTokenHash, hashShareToken(token))).limit(1);
  const row = rows[0];
  if (!row || row.package.status !== 'pending' || row.session.expiresAt.getTime() < Date.now()) return undefined;
  return row;
}

export async function getPendingSyncPackagesForContext(input: { contextType: ShareContextType; contextId: string; ownerKey: string }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ package: syncPackages, session: shareSessions })
    .from(syncPackages)
    .innerJoin(shareSessions, eq(syncPackages.sessionId, shareSessions.id))
    .where(and(
      eq(shareSessions.contextType, input.contextType),
      eq(shareSessions.contextId, input.contextId),
      eq(shareSessions.ownerKeyHash, hashShareToken(input.ownerKey)),
      eq(syncPackages.status, 'pending'),
    ))
    .orderBy(desc(syncPackages.createdAt));
  return rows.filter(row => row.session.expiresAt.getTime() >= Date.now());
}

export async function markSyncPackageApplied(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  await db.update(syncPackages).set({ status: 'applied', appliedAt: new Date() }).where(eq(syncPackages.id, packageId));
}
