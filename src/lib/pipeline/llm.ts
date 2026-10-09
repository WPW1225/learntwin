// Unified LLM client — dual-path:
//   PRODUCTION (ZHIPU_API_KEY set): standard Zhipu OpenAI-compatible API
//     POST https://open.bigmodel.cn/api/paas/v4/chat/completions
//   LOCAL DEV (no key): falls back to z-ai-web-dev-sdk (platform-injected)
//
// Models are env-tunable so the deployed instance can trade cost for quality:
//   ZHIPU_VISION_MODEL (default glm-4v-flash, free tier)
//   ZHIPU_TEXT_MODEL   (default glm-4-flash, free tier)

const API_BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

type ChatMsg = { role: 'user'; content: any }

function zhipuKey() { return process.env.ZHIPU_API_KEY || '' }
export function llmMode(): 'zhipu' | 'local' { return zhipuKey() ? 'zhipu' : 'local' }

async function zhipuChat(messages: ChatMsg[], model: string): Promise<string> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${zhipuKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Zhipu API ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/* ---------- local-dev path (platform SDK) ---------- */
let zaiPromise: Promise<any> | null = null
async function zai() {
  if (!zaiPromise) {
    const mod = await import('z-ai-web-dev-sdk')
    const ZAI = (mod as any).default
    zaiPromise = ZAI.create()
  }
  return zaiPromise
}

async function localVision(prompt: string, imageBase64: string): Promise<string> {
  const client = await zai()
  const res = await client.chat.completions.createVision({
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
      ],
    }],
    thinking: { type: 'disabled' },
  })
  return res.choices[0]?.message?.content || ''
}

async function localText(prompt: string): Promise<string> {
  const client = await zai()
  const res = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
  })
  return res.choices[0]?.message?.content || ''
}

/* ---------- public API ---------- */
export async function chatVision(prompt: string, imageBase64: string): Promise<string> {
  if (llmMode() === 'zhipu') {
    const model = process.env.ZHIPU_VISION_MODEL || 'glm-4v-flash'
    return zhipuChat([{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
      ],
    }], model)
  }
  return localVision(prompt, imageBase64)
}

export async function chatText(prompt: string): Promise<string> {
  if (llmMode() === 'zhipu') {
    const model = process.env.ZHIPU_TEXT_MODEL || 'glm-4-flash'
    return zhipuChat([{ role: 'user', content: prompt }], model)
  }
  return localText(prompt)
}
