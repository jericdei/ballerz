import { z } from "zod";

import { assertGameOwner } from "../lib/access";
import { getAuthSecret, signRealtimeToken } from "../lib/realtime-token";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const connectionTokenInput = z.object({
  gameId: z.number().int().positive(),
});

export const realtimeRouter = createTRPCRouter({
  getConnectionToken: protectedProcedure
    .input(connectionTokenInput)
    .query(async ({ ctx, input }) => {
      await assertGameOwner(input.gameId, ctx.session.user.id);

      const token = signRealtimeToken(
        {
          userId: ctx.session.user.id,
          gameId: input.gameId,
        },
        getAuthSecret(),
      );

      return { token };
    }),
});
