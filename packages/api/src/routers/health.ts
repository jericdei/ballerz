import { pingDatabase } from "@repo/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(async () => {
    await pingDatabase();

    return { ok: true as const };
  }),
});
