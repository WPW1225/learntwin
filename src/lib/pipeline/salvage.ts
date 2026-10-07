// JSON salvage: LLMs occasionally emit near-JSON (missing closing bracket,
// trailing commas, markdown fences). Ported from pipeline/run_pipeline.py.

export function tryInsertBracket(content: string, maxBack = 60): any | null {
  try {
    return JSON.parse(content)
  } catch (e: any) {
    const pos = (e as SyntaxError).message // placeholder; real pos parsed below
  }
  // parse error position out of the message "Unexpected token ... position N" / V8 style
  try {
    JSON.parse(content)
    return JSON.parse(content)
  } catch (e: any) {
    const m = /position (\d+)/.exec(String(e.message))
    const errPos = m ? parseInt(m[1], 10) : content.length - 1
    for (let pos = errPos; pos > Math.max(0, errPos - maxBack); pos--) {
      for (const ins of [']', '}']) {
        try {
          return JSON.parse(content.slice(0, pos) + ins + content.slice(pos))
        } catch {
          continue
        }
      }
    }
  }
  return null
}

export function salvageJson(content: string): any | null {
  let c = content.trim()
  if (c.startsWith('```')) {
    c = c.split('\n').slice(1).join('\n').split('```')[0]
  }
  c = c.trim()
  const attempts: Array<() => any | null> = [
    () => JSON.parse(c),
    () => JSON.parse(c.replace(/,]/g, ']').replace(/,}/g, '}')),
    () => tryInsertBracket(c),
  ]
  for (const attempt of attempts) {
    try {
      const data = attempt()
      if (data !== null) return data
    } catch {
      continue
    }
  }
  const s = c.indexOf('{')
  const e = c.lastIndexOf('}')
  if (s >= 0 && e > s) {
    const body = c.slice(s, e + 1)
    const data = tryInsertBracket(body)
    if (data !== null) return data
  }
  return null
}
