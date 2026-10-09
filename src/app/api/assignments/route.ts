import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { runExtract } from '@/lib/pipeline/run'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(req: Request) {
  let uid: string
  try { uid = await requireUser(req) } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }

  let imageBuf: Buffer
  let filename = 'assignment'
  const ct = req.headers.get('content-type') || ''
  const loadSample = async () => {
    const sample = path.join(process.cwd(), 'public', 'demo-assignment.png')
    const { readFile } = await import('node:fs/promises')
    imageBuf = await readFile(sample)
    filename = 'demo-assignment.png'
  }
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('image') as File | null
    if (!file) {
      if (form.get('demo')) { await loadSample() } // demo sent as form field
      else return NextResponse.json({ error: 'image file required' }, { status: 400 })
    } else {
      filename = file.name || filename
      imageBuf = Buffer.from(await file.arrayBuffer())
    }
  } else {
    // demo mode: use the built-in sample assignment
    await loadSample()
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const id = randomBytes(8).toString('hex')
  // normalize + compress for vision call (max edge 1800, jpeg q85)
  const norm = await sharp(imageBuf).rotate().resize(1800, 1800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()
  const stored = `upload-${id}.jpg`
  const dataUri = `data:image/jpeg;base64,${norm.toString('base64')}`
  // serverless-safe: image lives in the DB; file write is a local-dev cache only
  try { await writeFile(path.join(UPLOAD_DIR, stored), norm) } catch { /* read-only fs (Vercel) — DB copy is the source of truth */ }

  const assignment = await db.assignment.create({
    data: { userId: uid, imagePath: `/uploads/${stored}`, filename, status: 'extracting', stage: 'Reading the assignment…', imageData: dataUri },
  })

  // fire-and-forget; progress is tracked in the DB
  void runExtract(assignment.id).catch(async e => {
    console.error('pipeline extract failed:', e)
    await db.assignment.update({ where: { id: assignment.id }, data: { status: 'error', stage: String(e).slice(0, 200) } }).catch(() => {})
  })

  return NextResponse.json({ id: assignment.id, status: assignment.status })
}

export async function GET(req: Request) {
  let uid: string
  try { uid = await requireUser(req) } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const list = await db.assignment.findMany({
    where: { userId: uid },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, filename: true, status: true, score: true, total: true, createdAt: true, twinSummary: true },
  })
  return NextResponse.json({ assignments: list })
}
