import { PrismaClient } from '@prisma/client'
import path from 'node:path'

// Dual-datasource:
//   - Vercel/production: env DATABASE_URL (postgres://... from Neon/Vercel Storage)
//   - Local dev: project-relative sqlite <project root>/db/custom.db.
//     (Ignore the platform-injected workspace-root DATABASE_URL on purpose —
//     it points at the workspace root, not this app's db.)
const envUrl = process.env.DATABASE_URL || ''
const isRemote = envUrl.startsWith('postgres')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    isRemote
      ? { datasourceUrl: envUrl }
      : { datasourceUrl: `file:${path.join(process.cwd(), 'db', 'custom.db')}` }
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
