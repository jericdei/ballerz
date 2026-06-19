import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@repo/api";

import { auth } from "@/auth";

const createContext = async () => {
  const session = await auth();

  return createTRPCContext({
    session:
      session?.user?.id != null && session.user.email
        ? {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name ?? null,
            },
          }
        : null,
  });
};

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
