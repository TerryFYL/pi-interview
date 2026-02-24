interface Env {
  ANTHROPIC_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  OPENROUTER_API_KEY?: string
  LLM_PROVIDER?: string // 'anthropic' | 'deepseek' | 'openrouter' — auto-detected if not set
  MODEL?: string
  ALLOWED_ORIGIN?: string
}

const SYSTEM_PROMPT = `# 角色

你是一位专业但友善的医学实验室管理研究员，正在与一位医学实验室PI（课题组长/实验室主任）进行一对一的深度访谈。

# 目标

通过自然、温暖的对话，深入了解PI在实验室管理中遇到的真实痛点。找到1-2个让PI感到"如果有工具解决这个我愿意付钱"的具体场景。

# 你已经发送的开场白

你已经向用户发送了以下开场白，这是对话的起点：

"您好！感谢您抽出时间参与我们的调研。我是一名关注医学实验室管理的研究员，今天主要想听听您在实验室管理方面的真实体验和感受。没有标准答案，也没有对错之分——您的每一句真实感受对我们都非常有价值。整个对话大约需要 15–20 分钟。我们先聊点轻松的吧——能简单介绍一下您的实验室吗？大概有多少学生，主要做什么方向的研究？"

请从用户的回复开始，自然地继续访谈。

# 访谈阶段（自然过渡，不要机械跳转）

## 暖场（前2-3轮）
- 从用户对开场白的回复开始，了解实验室基本情况
- 对他们的研究方向表达真诚的兴趣
- 建立轻松的对话氛围

## 日常工作（3-4轮）
了解以下方面：
- 典型一天花在管理上的时间
- 怎么了解学生进展（汇报方式、频率）
- 多个项目的信息放在哪里

## 痛点深挖（5-8轮）★ 最重要的部分
围绕以下话题深入探索：
- 最近一次让他们沮丧的管理时刻
- "本应该早知道但没知道"的信息
- 管理研究生最难的部分
- 不在实验室时的信息盲区
- 课题经费和项目节点追踪
- 学生毕业时的知识传承

**深挖技巧——当对方提到一个痛点时，不要急着跳到下一个话题，而是继续追问：**
- "能具体说说当时的情况吗？"
- "这种事大概多久发生一次？"
- "那个时候您是什么感受？"
- "后来您怎么处理的？"
- "如果有办法解决这个问题，您觉得应该是什么样的？"

## 现有工具（2-3轮）
- 用什么工具管理实验室
- 哪些好用，哪些不够
- 试过专业科研管理软件吗

## 价值验证（2-3轮）
- 如果只能解决一个管理问题，选哪个
- 对付费工具的态度和预算感觉
- ⚠️ 不推销，只观察反应

## 收尾（1-2轮）
- 有没有遗漏的重要话题
- 感谢，询问是否愿意后续试用产品原型

# 对话规则（严格遵守）

1. **每次只问一个问题**。绝对不要在一条消息里问两个以上的问题。
2. **回复简短自然**（2-5句话）。像同行交流，不像在做问卷。
3. **先回应再提问**。始终先对用户说的内容做出回应（表达理解、共鸣、好奇），然后再引出下一个话题。
4. **捕捉情绪信号**。当用户表达沮丧、无奈、焦虑时，立刻深挖，不要跳过。
5. **使用具体化追问**。避免抽象问题，引导对方讲具体故事和场景。
6. **不使用技术术语**。不说"数字化""项目管理工具""工作流优化"等词。
7. **不推销不建议**。只倾听和提问，不给解决方案。
8. **自然过渡**。话题之间要有逻辑衔接，不要突兀地跳转。
9. **尊重对方**。用"您"称呼。对方是领域专家，你是谦虚的学习者。

# 判断何时结束

当以下条件都满足时，自然引导到收尾：
- 已经讨论了至少3个不同的痛点
- 了解了现有的工具使用情况
- 进行了基本的价值验证
- 或者对话已经进行了15轮以上

# 语言

全程使用中文。语气温暖、专业、平等。`

type ChatMessage = { role: string; content: string }

// --- Provider abstraction ---

function detectProvider(env: Env): 'anthropic' | 'deepseek' | 'openrouter' {
  const p = env.LLM_PROVIDER
  if (p === 'anthropic' || p === 'deepseek' || p === 'openrouter') return p
  if (env.OPENROUTER_API_KEY) return 'openrouter'
  if (env.ANTHROPIC_API_KEY) return 'anthropic'
  if (env.DEEPSEEK_API_KEY) return 'deepseek'
  return 'deepseek'
}

function getApiKey(env: Env, provider: string): string | undefined {
  if (provider === 'anthropic') return env.ANTHROPIC_API_KEY
  if (provider === 'deepseek') return env.DEEPSEEK_API_KEY
  if (provider === 'openrouter') return env.OPENROUTER_API_KEY
  return undefined
}

function getDefaultModel(provider: string): string {
  if (provider === 'anthropic') return 'claude-sonnet-4-20250514'
  if (provider === 'openrouter') return 'minimax/minimax-m2.5'
  return 'deepseek-chat'
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  })
}

async function callDeepSeek(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<Response> {
  return fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    }),
  })
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<Response> {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    }),
  })
}

// --- SSE stream transformers ---

function transformAnthropicStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const reader = upstream.getReader()
  const decoder = new TextDecoder()

  const pump = async () => {
    let buffer = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ t: parsed.delta.text })}\n\n`))
            }
          } catch { /* skip */ }
        }
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } catch (e) {
      console.error('Anthropic stream error:', e)
    } finally {
      await writer.close()
    }
  }
  pump()
  return readable
}

function transformOpenAIStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const reader = upstream.getReader()
  const decoder = new TextDecoder()

  const pump = async () => {
    let buffer = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ t: delta })}\n\n`))
            }
          } catch { /* skip */ }
        }
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } catch (e) {
      console.error('OpenAI stream error:', e)
    } finally {
      await writer.close()
    }
  }
  pump()
  return readable
}

// --- CORS ---

function buildCorsHeaders(origin: string | null, allowedOrigin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin === '*' ? '*' : (origin || allowedOrigin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// --- Main handler ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const allowed = env.ALLOWED_ORIGIN || '*'
    const cors = buildCorsHeaders(origin, allowed)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    // Health check — also reports active provider
    if (url.pathname === '/health') {
      const provider = detectProvider(env)
      const hasKey = !!getApiKey(env, provider)
      return new Response(
        JSON.stringify({ status: hasKey ? 'ok' : 'no_key', provider }),
        { headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    if (url.pathname !== '/api/chat' || request.method !== 'POST') {
      return new Response('Not found', { status: 404, headers: cors })
    }

    const provider = detectProvider(env)
    const apiKey = getApiKey(env, provider)

    if (!apiKey) {
      const keyNames: Record<string, string> = {
        anthropic: 'ANTHROPIC_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
      }
      return new Response(
        JSON.stringify({
          error: 'API key not configured',
          hint: `Set ${keyNames[provider] || 'API_KEY'} as a Worker secret`,
        }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    try {
      const body = (await request.json()) as { messages: ChatMessage[] }
      const { messages } = body

      if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(
          JSON.stringify({ error: 'messages array is required and must not be empty' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
        )
      }

      const model = env.MODEL || getDefaultModel(provider)

      let llmResponse: Response
      if (provider === 'anthropic') {
        llmResponse = await callAnthropic(apiKey, model, messages)
      } else if (provider === 'openrouter') {
        llmResponse = await callOpenRouter(apiKey, model, messages)
      } else {
        llmResponse = await callDeepSeek(apiKey, model, messages)
      }

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text()
        return new Response(
          JSON.stringify({ error: `LLM API error (${llmResponse.status})`, detail: errorText }),
          { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } },
        )
      }

      const transformed = provider === 'anthropic'
        ? transformAnthropicStream(llmResponse.body!)
        : transformOpenAIStream(llmResponse.body!)

      return new Response(transformed, {
        headers: {
          ...cors,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (e) {
      console.error('Request handling error:', e)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }
  },
}
