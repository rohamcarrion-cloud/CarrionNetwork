# Carrion Networks

A podcast platform for professional and business networks — React frontend +
PocketBase backend. This document explains how to run the project locally
**from a clean environment**, with no dependency on any encrypted production
database.

## Prerequisites

- **Node.js** 22.x (see `.nvmrc`) and npm 10+
- **PocketBase binary** — already included at `apps/pocketbase/pocketbase`.
  If missing, download the matching version (see `.pocketbase-version`) from
  https://pocketbase.io/docs/ and place it there.

## Installation

```bash
# Clone or export the repository
git clone <repo> && cd carrion-networks

# Install dependencies (installs all workspaces)
npm install

# Copy the environment template
cp .env.example .env
```

## Starting PocketBase (clean database)

The project schema and seed data live entirely in code
(`apps/pocketbase/pb_migrations/`), so a **fresh** `pb_data` directory is all
you need — PocketBase applies every migration on first startup.

> ⚠️ If you exported this project from Horizon, the shipped `pb_data` is
> **encrypted**. Do NOT try to run it without the key. For local development,
> start from a clean database instead:

```bash
cd apps/pocketbase

# Start from a clean database: remove any exported/encrypted pb_data first.
rm -rf pb_data

# On first run, PocketBase creates pb_data and applies all migrations.
./pocketbase serve

# PocketBase admin panel: http://localhost:8090/_/
# PocketBase API:         http://localhost:8090/api/
```

On first boot PocketBase will:

1. Create a fresh, **unencrypted** `pb_data/`.
2. Apply all migrations in order (creating the 17 collections).
3. Seed the `roles` (listener, creator, admin), `categories`, and `plans`.
4. Load the `pb_hooks/*.pb.js` hooks (including onboarding).

## Starting the Frontend

```bash
# In a new terminal, from the repository root
npm run dev

# Frontend: http://localhost:5173 (or the port Vite reports)
```

## Environment Variables

Create a `.env` file (copied from `.env.example`):

```
VITE_POCKETBASE_URL=http://localhost:8090
VITE_APP_NAME=Carrion Networks
VITE_APP_URL=http://localhost:5173
# POCKETBASE_ENCRYPTION_KEY=  # only for existing encrypted pb_data
```

See `.env.example` for all available options.

## First-Time Setup

1. Start PocketBase (see above).
2. Open http://localhost:8090/_/ in your browser.
3. Create the initial PocketBase **superuser** (you will be prompted).
4. Return to the frontend and register a test account via `/signup`.
5. The account automatically receives the **Listener** role and a starter
   **profile** — both created server-side by the onboarding hook.

## First-Admin Bootstrap Procedure

Admin access is **never** granted publicly — role assignment is restricted by
the `user_roles` access rules to existing admins only. The first admin must be
bootstrapped through the PocketBase admin panel.

### Development

1. Start PocketBase and create the initial superuser.
2. Register a test account via the frontend (`/signup`).
3. Log in to the PocketBase admin panel (http://localhost:8090/_/).
4. Go to **Collections → user_roles**.
5. Create a `user_roles` record:
   - `user_id`: the test account's id
   - `role_id`: the **admin** role id (from the `roles` collection)
6. Log out and log back in to the frontend to see Admin access.

### Production

1. Deploy PocketBase and create the initial superuser.
2. Identify the account that should be the first Admin.
3. In the PocketBase admin panel, create a `user_roles` record linking that
   account to the **admin** role.
4. That account now has Admin access; further admin/creator assignments can be
   done through the Admin Dashboard (Phase 2).

> Do **not** hardcode an admin email/password. Do **not** enable public role
> assignment.

## Running Commands

```bash
npm run lint    # Lint the frontend
npm run build   # Build for production
```

## Common Startup Errors

**"invalid settings db data or missing encryption key"**
- Occurs when booting an exported/encrypted `pb_data` from Horizon.
- Fix: `rm -rf apps/pocketbase/pb_data` and let PocketBase create a fresh DB.
- Or (not recommended for dev): supply `POCKETBASE_ENCRYPTION_KEY`.

**"Cannot connect to PocketBase"**
- Ensure PocketBase is running on http://localhost:8090.
- Check `VITE_POCKETBASE_URL` in `.env` matches the running instance.

**"Listener role not found"**
- Migrations may not have run. Check **Collections → roles** in the admin panel.
- If roles are missing, restart PocketBase and inspect the startup logs.

## Architecture

- `apps/web` — React + Vite frontend
- `apps/pocketbase` — PocketBase backend (migrations + hooks)
- `apps/web/src/services/` — abstraction layer for backend calls
- `apps/web/src/components/` — reusable UI components

## Database Schema

See `apps/pocketbase/pb_migrations/` for the complete schema definition.

Key collections:

- `users` — PocketBase auth records
- `profiles` — user profile information
- `roles` — listener, creator, admin
- `user_roles` — user-to-role relationships
- `podcasts` — podcast metadata
- `episodes` — episode metadata
- …and 11 more supporting collections (creator_profiles,
  podcast_team_members, categories, follows, saved_episodes, playlists,
  playlist_items, listening_history, notifications, plans, subscriptions).

## Onboarding Integrity

Registration initialization is handled server-side, not in the browser:

- `apps/pocketbase/pb_hooks/assign_default_role.pb.js` runs after every user
  creation and creates (idempotently) the default **Listener** `user_roles`
  record and a starter **profile**.
- If either step fails, the hook throws and PocketBase rejects the user
  creation — the frontend surfaces an explicit error rather than pretending
  onboarding completed.

## Media Uploads (Phase 1 status)

Avatar / artwork uploads are **architecture-ready but not yet implemented in
the UI**:

- File upload fields exist in the schema (`profiles.avatar_url`,
  `podcasts.artwork_url`, `episodes.artwork_url`).
- The service layer supports uploads (`services/users.uploadAvatar`, etc.).
- The upload UI (Profile Settings, podcast/episode management) is scheduled
  for Phase 2. Uploads are **not** claimed as verified in Phase 1.

## Support

For issues, check:

1. PocketBase startup logs
2. Browser console for frontend errors
3. PocketBase admin panel for data integrity
