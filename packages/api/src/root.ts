import { authRouter } from "./routers/auth";
import { healthRouter } from "./routers/health";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
