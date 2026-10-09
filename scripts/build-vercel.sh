#!/usr/bin/env bash
# Vercel build script — flips the Prisma datasource to the provisioned
# postgres (Vercel Storage / Neon), pushes schema, generates client, builds.
#
# Vercel settings:
#   Build Command:    bash scripts/build-vercel.sh
#   Output Directory: .next (default, auto-detected for Next.js)
# Required env vars (set in Vercel project settings):
#   DATABASE_URL   — postgres connection string (Vercel Storage → Neon)
#   ZHIPU_API_KEY  — https://open.bigmodel.cn API key
#   AUTH_SECRET     — random 32-byte hex (openssl rand -hex 32)
set -e

echo "▶ switching prisma datasource to postgres (env DATABASE_URL)"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i 's|url      = "file:../db/custom.db"|url      = env("DATABASE_URL")|' prisma/schema.prisma

echo "▶ prisma db push (creates tables on first deploy, no-op afterwards)"
npx prisma db push --accept-data-loss

echo "▶ prisma generate"
npx prisma generate

echo "▶ next build"
npx next build
