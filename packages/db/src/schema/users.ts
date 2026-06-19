import { pgTable, text } from "drizzle-orm/pg-core";

import { idColumn, timestamps } from "./columns";

/** Root entity — timestamps only, no self-referential audit user FKs. */
export const users = pgTable("users", {
  ...idColumn,
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password").notNull(),
  ...timestamps,
});

export type User = typeof users.$inferSelect;
