import { authRouter } from "./routers/auth";
import { gamesRouter } from "./routers/games";
import { healthRouter } from "./routers/health";
import { leaguesRouter } from "./routers/leagues";
import { playersRouter } from "./routers/players";
import { statsheetRouter } from "./routers/statsheet";
import { teamsRouter } from "./routers/teams";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: healthRouter,
  leagues: leaguesRouter,
  teams: teamsRouter,
  players: playersRouter,
  games: gamesRouter,
  statsheet: statsheetRouter,
});

export type AppRouter = typeof appRouter;
