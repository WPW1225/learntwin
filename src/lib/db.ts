import { PrismaClient } from '@prisma/client'
import path from 'node:path'

// The DB location is a project-relative invariant: <project root>/db/custom.db.
// Ignore the platform-injected DATABASE_URL (workspace root) entirely.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: `file:${path.join(process.cwd(), 'db', 'custom.db')}`,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
