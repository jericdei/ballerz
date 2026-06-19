import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";
import { leagues, players, teams, users } from "./schema/index";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

config({ path: path.join(rootDir, ".env") });
config({ path: path.join(rootDir, ".env.local") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL ?? "seed@ballerz.local";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? "password";
const SEED_LEAGUE_NAME = process.env.SEED_LEAGUE_NAME ?? "Pickup League";

const TEAM_DEFINITIONS = [
  { name: "Thunder", color: "#2563eb" },
  { name: "Blaze", color: "#ea580c" },
  { name: "Storm", color: "#7c3aed" },
] as const;

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

const ROSTERS: Array<Array<{ firstName: string; lastName: string }>> = [
  [
    { firstName: "Jose", lastName: "Dela Cruz" },
    { firstName: "Mark", lastName: "Santos" },
    { firstName: "Miguel", lastName: "Reyes" },
    { firstName: "Anthony", lastName: "Villanueva" },
    { firstName: "Christian", lastName: "Bautista" },
    { firstName: "John", lastName: "Garcia" },
    { firstName: "Paolo", lastName: "Torres" },
    { firstName: "Jerome", lastName: "Rivera" },
    { firstName: "Carlo", lastName: "Alvarez" },
    { firstName: "Adrian", lastName: "Gutierrez" },
    { firstName: "Patrick", lastName: "Lopez" },
    { firstName: "Eman", lastName: "Ramos" },
  ],
  [
    { firstName: "Arvin", lastName: "Navarro" },
    { firstName: "Emil", lastName: "Gonzales" },
    { firstName: "Kevin", lastName: "Magbanua" },
    { firstName: "Rafael", lastName: "Lazaro" },
    { firstName: "Bryan", lastName: "Salazar" },
    { firstName: "Francis", lastName: "Espino" },
    { firstName: "Joshua", lastName: "Morales" },
    { firstName: "Lawrence", lastName: "Torio" },
    { firstName: "Dennis", lastName: "Padilla" },
    { firstName: "Paul", lastName: "Austria" },
    { firstName: "Jericho", lastName: "Castro" },
    { firstName: "Alvin", lastName: "Mendoza" },
  ],
  [
    { firstName: "Nico", lastName: "Rosales" },
    { firstName: "Enzo", lastName: "Peralta" },
    { firstName: "Ian", lastName: "Buenaventura" },
    { firstName: "Jomar", lastName: "Pascual" },
    { firstName: "Warren", lastName: "Santiago" },
    { firstName: "Daryl", lastName: "Soriano" },
    { firstName: "Marco", lastName: "Diaz" },
    { firstName: "Sam", lastName: "Tiongson" },
    { firstName: "Raymond", lastName: "Aguila" },
    { firstName: "Vince", lastName: "Tan" },
    { firstName: "Oliver", lastName: "Manalo" },
    { firstName: "Edwin", lastName: "Vergara" },
  ],
];

function auditInsert(userId: number) {
  return {
    createdBy: userId,
    updatedBy: userId,
  };
}

async function findOrCreateSeedUser(db: ReturnType<typeof drizzle>) {
  const [existingUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, SEED_USER_EMAIL))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 12);
  const [createdUser] = await db
    .insert(users)
    .values({
      email: SEED_USER_EMAIL,
      name: "Seed User",
      password: passwordHash,
    })
    .returning({ id: users.id, email: users.email });

  if (!createdUser) {
    throw new Error("Failed to create seed user");
  }

  return createdUser;
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

try {
  const seedUser = await findOrCreateSeedUser(db);

  const [existingLeague] = await db
    .select({ id: leagues.id, name: leagues.name })
    .from(leagues)
    .where(
      and(
        eq(leagues.name, SEED_LEAGUE_NAME),
        eq(leagues.createdBy, seedUser.id),
        isNull(leagues.deletedAt),
      ),
    )
    .limit(1);

  if (existingLeague) {
    console.log(
      `Seed league "${existingLeague.name}" already exists (id ${existingLeague.id}). Skipping.`,
    );
    process.exit(0);
  }

  const [league] = await db
    .insert(leagues)
    .values({
      name: SEED_LEAGUE_NAME,
      ...auditInsert(seedUser.id),
    })
    .returning({ id: leagues.id, name: leagues.name });

  if (!league) {
    throw new Error("Failed to create seed league");
  }

  const createdTeams = await db
    .insert(teams)
    .values(
      TEAM_DEFINITIONS.map((team) => ({
        leagueId: league.id,
        name: team.name,
        color: team.color,
        ...auditInsert(seedUser.id),
      })),
    )
    .returning({ id: teams.id, name: teams.name });

  if (createdTeams.length !== TEAM_DEFINITIONS.length) {
    throw new Error("Failed to create seed teams");
  }

  const playerRows = createdTeams.flatMap((team, teamIndex) => {
    const roster = ROSTERS[teamIndex] ?? [];

    return roster.map((player, playerIndex) => ({
      teamId: team.id,
      firstName: player.firstName,
      lastName: player.lastName,
      number: playerIndex,
      position: POSITIONS[playerIndex % POSITIONS.length],
      isCaptain: playerIndex === 0,
      ...auditInsert(seedUser.id),
    }));
  });

  const createdPlayers = await db
    .insert(players)
    .values(playerRows)
    .returning({ id: players.id });

  console.log("Database seeded successfully");
  console.log(`  User:   ${seedUser.email} (password: ${SEED_USER_PASSWORD})`);
  console.log(`  League: ${league.name} (id ${league.id})`);
  for (const team of createdTeams) {
    console.log(`  Team:   ${team.name} (id ${team.id})`);
  }
  console.log(`  Players: ${createdPlayers.length} total`);
} finally {
  await client.end();
}
