const ALLOWED_HOSTS = new Set(['api.deepseek.com', 'api.openai.com', 'api.groq.com', 'openrouter.ai'])
const MAX_BODY_CHARS = 60_000

function json(response, status, payload) {
  response.status(status)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(payload))
}

function normalizedEndpoint(baseUrl) {
  const url = new URL(baseUrl)
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) throw new Error('Unsupported API host')
  const path = url.pathname.replace(/\/$/, '')
  url.pathname = path.endsWith('/chat/completions') ? path : `${path}/chat/completions`
  url.search = ''
  url.hash = ''
  return url.toString()
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'Method not allowed' })
  }
  if (Number(request.headers['content-length'] || 0) > MAX_BODY_CHARS) return json(response, 413, { error: 'Request is too large' })

  try {
    const { apiKey, baseUrl, model, messages, maxTokens = 900 } = request.body || {}
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length > 500) throw new Error('A valid API key is required')
    if (!baseUrl || typeof baseUrl !== 'string') throw new Error('API base URL is required')
    if (!model || typeof model !== 'string' || model.length > 120) throw new Error('A valid model is required')
    if (!Array.isArray(messages) || !messages.length || messages.length > 24) throw new Error('Valid messages are required')

    const safeMessages = messages.map(({ role, content }) => {
      if (!['system', 'user', 'assistant'].includes(role) || typeof content !== 'string') throw new Error('Invalid message')
      return { role, content: content.slice(0, 12_000) }
    })
    if (safeMessages.reduce((sum, item) => sum + item.content.length, 0) > 45_000) throw new Error('Journal selection is too large')

    const upstream = await fetch(normalizedEndpoint(baseUrl), {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: safeMessages,
        max_tokens: Math.max(64, Math.min(Number(maxTokens) || 900, 1600)),
        temperature: 0.6,
      }),
      signal: AbortSignal.timeout(45_000),
    })
    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) return json(response, upstream.status >= 500 ? 502 : 400, { error: String(data?.error?.message || `The AI provider returned ${upstream.status}`).slice(0, 300) })
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) return json(response, 502, { error: 'The AI provider returned no text' })
    return json(response, 200, { content: content.trim() })
  } catch (error) {
    const message = error?.name === 'TimeoutError' ? 'The AI provider took too long to respond' : error.message
    return json(response, 400, { error: String(message || 'Invalid request').slice(0, 300) })
  }
}
