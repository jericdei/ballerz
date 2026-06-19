import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, users } from "@repo/db";

import { hashPassword } from "../auth/password";
import { createTRPCRouter, publicProcedure } from "../trpc";

const registerInput = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  name: z.string().trim().min(1).optional(),
});

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerInput).mutation(async ({ input }) => {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        password: passwordHash,
        name: input.name ?? null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create account",
      });
    }

    return user;
  }),
});
