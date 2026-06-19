import { eq } from "drizzle-orm";

import { db, users } from "@repo/db";

import { verifyPassword } from "./password";

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
