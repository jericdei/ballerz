import { db } from "@repo/db";

export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
};

export type Context = {
  db: typeof db;
  session: { user: SessionUser } | null;
};

export function createTRPCContext(opts: {
  session: { user: SessionUser } | null;
}): Context {
  return {
    db,
    session: opts.session,
  };
}
