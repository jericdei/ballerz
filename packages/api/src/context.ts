import { db } from "@repo/db";

export type Context = {
  db: typeof db;
};

export function createTRPCContext(): Context {
  return { db };
}
