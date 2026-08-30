import { COOKIE_NAME } from "@shared/const";
import { z } from 'zod';
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createShareSession, createSyncPackage, getPendingSyncPackagesForContext, getShareSessionByToken, getSyncPackageByToken, hashShareToken, markSyncPackageApplied } from './db';

export const appRouter = router({
  system: systemRouter,
  sync: router({
    createShare: publicProcedure.input(z.object({
      contextType: z.enum(['trip', 'shared_home', 'group_fund']),
      contextId: z.string().min(1).max(128),
      contextName: z.string().min(1).max(255),
      snapshotJson: z.string().min(2).max(60000),
      ownerKey: z.string().min(32).max(256),
      origin: z.string().url(),
    })).mutation(async ({ input }) => {
      const result = await createShareSession({
        contextType: input.contextType,
        contextId: input.contextId,
        contextName: input.contextName,
        snapshotJson: input.snapshotJson,
        ownerKey: input.ownerKey,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      return { ...result, url: `${input.origin}/edit-sync/${result.shareToken}` };
    }),

    getShare: publicProcedure.input(z.object({ token: z.string().min(20).max(256) })).query(async ({ input }) => {
      const session = await getShareSessionByToken(input.token);
      if (!session) return null;
      return {
        contextType: session.contextType,
        contextId: session.contextId,
        contextName: session.contextName,
        snapshotJson: session.snapshotJson,
        snapshotHash: session.snapshotHash,
        expiresAt: session.expiresAt,
      };
    }),

    submit: publicProcedure.input(z.object({
      shareToken: z.string().min(20).max(256),
      baseSnapshotHash: z.string().min(32).max(128),
      editedSnapshotJson: z.string().min(2).max(60000),
      changeSummaryJson: z.string().min(2).max(20000),
      recipientName: z.string().max(255).optional(),
      origin: z.string().url(),
    })).mutation(async ({ input }) => {
      const session = await getShareSessionByToken(input.shareToken);
      if (!session) return null;
      const packageToken = (await import('./db')).createOpaqueToken();
      await createSyncPackage({
        packageToken,
        sessionId: session.id,
        baseSnapshotHash: input.baseSnapshotHash,
        editedSnapshotJson: input.editedSnapshotJson,
        changeSummaryJson: input.changeSummaryJson,
        recipientName: input.recipientName,
      });
      return { url: `${input.origin}/sync-review/${packageToken}`, packageToken };
    }),

    getPendingForContext: publicProcedure.input(z.object({ contextType: z.enum(['trip', 'shared_home', 'group_fund']), contextId: z.string().min(1).max(128), ownerKey: z.string().min(32).max(256) })).query(async ({ input }) => {
      const rows = await getPendingSyncPackagesForContext(input);
      return rows.map(row => ({ packageToken: row.package.packageToken, contextType: row.session.contextType, contextId: row.session.contextId, contextName: row.session.contextName, recipientName: row.package.recipientName, createdAt: row.package.createdAt, changeSummaryJson: row.package.changeSummaryJson }));
    }),

    getPackage: publicProcedure.input(z.object({ token: z.string().min(20).max(256) })).query(async ({ input }) => {
      const row = await getSyncPackageByToken(input.token);
      if (!row) return null;
      return {
        contextType: row.session.contextType,
        contextId: row.session.contextId,
        contextName: row.session.contextName,
        baseSnapshotHash: row.package.baseSnapshotHash,
        baseSnapshotJson: row.session.snapshotJson,
        editedSnapshotJson: row.package.editedSnapshotJson,
        changeSummaryJson: row.package.changeSummaryJson,
        recipientName: row.package.recipientName,
        createdAt: row.package.createdAt,
        packageToken: input.token,
      };
    }),

    markApplied: publicProcedure.input(z.object({ token: z.string().min(20).max(256), ownerKey: z.string().min(32).max(256) })).mutation(async ({ input }) => {
      const row = await getSyncPackageByToken(input.token);
      if (!row || hashShareToken(input.ownerKey) !== row.session.ownerKeyHash) return { success: false } as const;
      await markSyncPackageApplied(row.package.id);
      return { success: true } as const;
    }),
  }),

  auth: router({
    // Retained for compatibility with the template's optional auth utilities;
    // Kharcha itself no longer requires or starts any login flow.
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
