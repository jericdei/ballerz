# Web app

Next.js frontend for Ballerz with tRPC, TanStack Query, shadcn/ui, Zustand, and NextAuth.js.

## Environment variables

Add to the repo root `.env` or `.env.local`:

| Variable       | Description                                               |
| -------------- | --------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string                              |
| `AUTH_SECRET`  | NextAuth secret — generate with `openssl rand -base64 32` |
| `AUTH_URL`     | App URL, e.g. `http://localhost:3000`                     |

## Commands

```sh
bun run dev          # from repo root (port 3000)
bun run check-types
bun run lint
```

## Auth

- `/register` — open sign-up via `auth.register` tRPC mutation
- `/login` — email/password sign-in via NextAuth Credentials provider
- Middleware redirects unauthenticated users to `/login`
