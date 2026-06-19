import { authRouter } from "./routers/auth";
import { healthRouter } from "./routers/health";
import { leaguesRouter } from "./routers/leagues";
import { playersRouter } from "./routers/players";
import { teamsRouter } from "./routers/teams";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: healthRouter,
  leagues: leaguesRouter,
  teams: teamsRouter,
  players: playersRouter,
});

export type AppRouter = typeof appRouter;
