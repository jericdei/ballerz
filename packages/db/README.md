# @repo/db

PostgreSQL database package for Ballerz. Schema is defined with [Drizzle ORM](https://orm.drizzle.team/) and exported from `@repo/db` and `@repo/db/schema`.

## Documentation

- **[Database schema](docs/SCHEMA.md)** — entity relationships, statsheet tables, event log, and how stats are recorded

## Commands

Run from the repo root or this package:

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `bun run db:generate` | Sync schema index and generate Drizzle migrations  |
| `bun run db:migrate`  | Apply pending migrations                           |
| `bun run db:push`     | Push schema directly to the database (dev only)    |
| `bun run db:studio`   | Open Drizzle Studio                                |
| `bun run schema:sync` | Regenerate `src/schema/index.ts` from schema files |

Requires `DATABASE_URL` in the root `.env` or `.env.local`.

## Usage

```ts
import { db, recordStatEvent, games, type Game } from "@repo/db";
```
