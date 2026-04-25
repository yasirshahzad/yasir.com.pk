// AI Provider abstraction — supports Ollama (default), OpenAI, Gemini
// Switch provider via AI_PROVIDER env var

export interface AIStreamOptions {
  instruction: string
  systemPrompt?: string
  currentContent?: string
  referenceContent?: string
  model?: string
}

export async function streamAIResponse(options: AIStreamOptions): Promise<ReadableStream> {
  const provider = process.env.AI_PROVIDER || 'ollama'

  switch (provider) {
    case 'ollama':
      return streamOllama(options)
    case 'openai':
      return streamOpenAI(options)
    case 'gemini':
      return streamGemini(options)
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

// Fetch available models from Ollama
export async function getOllamaModels(): Promise<string[]> {
  const baseUrl = process.env.AI_BASE_URL || 'http://localhost:11434'
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.models || []).map((m: { name: string }) => m.name)
  } catch {
    return []
  }
}

// --- Ollama Provider ---
async function streamOllama(options: AIStreamOptions): Promise<ReadableStream> {
  const baseUrl = process.env.AI_BASE_URL || 'http://localhost:11434'
  const model = options.model || process.env.AI_MODEL || 'llama3'

  const prompt = buildPrompt(options)

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: options.systemPrompt || getDefaultSystemPrompt(),
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
  }

  // Transform Ollama's NDJSON stream into a plain text stream
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        const chunk = decoder.decode(value, { stream: true })
        // Ollama sends newline-delimited JSON, each with a "response" field
        const lines = chunk.split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line)
            if (parsed.response) {
              controller.enqueue(new TextEncoder().encode(parsed.response))
            }
            if (parsed.done) {
              controller.close()
              return
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    },
  })
}

// --- OpenAI Provider (stub) ---
async function streamOpenAI(options: AIStreamOptions): Promise<ReadableStream> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const model = options.model || process.env.AI_MODEL || 'gpt-4o-mini'
  const prompt = buildPrompt(options)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: options.systemPrompt || getDefaultSystemPrompt() },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`OpenAI error: ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            controller.close()
            return
          }
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) {
              controller.enqueue(new TextEncoder().encode(token))
            }
          } catch {
            // Skip
          }
        }
      }
    },
  })
}

// --- Gemini Provider (stub) ---
async function streamGemini(options: AIStreamOptions): Promise<ReadableStream> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const model = options.model || process.env.AI_MODEL || 'gemini-2.0-flash'
  const prompt = buildPrompt(options)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: options.systemPrompt || getDefaultSystemPrompt() }] },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!res.ok || !res.body) {
    throw new Error(`Gemini error: ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.slice(6))
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              controller.enqueue(new TextEncoder().encode(text))
            }
          } catch {
            // Skip
          }
        }
      }
    },
  })
}

// --- Shared Helpers ---

function buildPrompt(options: AIStreamOptions): string {
  const parts: string[] = []

  if (options.referenceContent) {
    parts.push('## Reference Material (from our blog)\n\n' + options.referenceContent + '\n\n---\n')
  }

  if (options.currentContent) {
    parts.push('## Current Post Content\n\n' + options.currentContent + '\n\n---\n')
  }

  parts.push('## Your Task\n\n' + options.instruction)

  return parts.join('\n\n')
}

function getDefaultSystemPrompt(): string {
  return `You are an expert technical blog writer. You write in Markdown (MDX-compatible).
Your writing style is:
- Clear, concise, and professional
- Well-structured with proper headings (##, ###)
- Uses code blocks with language specifiers when showing code
- Includes practical examples
- Avoids fluff and filler content

When given reference material from the blog, match the tone and depth of those posts.
- Use markdown for formatting (bold, italics, lists, code blocks).
- For mathematical notations, symbols, or flow diagrams in text (like Frontier $\\rightarrow$ Store), use LaTeX math syntax with single dollar signs (e.g., $...$).
- Example arrows: $\\rightarrow$ for right arrow, $\\leftarrow$ for left arrow, $\\leftrightarrow$ for double arrow.

- Keep the tone professional and technical.
Output ONLY the markdown content. Do not wrap in code fences or add explanations about what you wrote.`
}

export function getDiagramSystemPrompt(): string {
  return `You are an expert at creating system architecture diagrams in Excalidraw JSON format.
Your task is to convert a technical description into a clean, professional-looking Excalidraw diagram.

RULES:
1. Output ONLY valid JSON in the Excalidraw schema format.
2. Use "rectangle" elements for services, databases, caches, and APIs.
3. Use "arrow" elements for data flow and dependencies.
4. Always add "text" labels for components and arrows.
5. Keep the layout clean (left-to-right or top-to-bottom).
6. Use a professional color palette (e.g., subtle grays for background, violet/primary colors for borders).
7. Do not include any extra commentary, markdown formatting, or code fences in your output.
8. Ensure all elements have unique IDs and proper coordinates so they don't overlap.
9. Link arrows to the components they connect using "startBinding" and "endBinding" if possible, or just exact coordinates.

Example elements:
- Services/Components: Rectangle with text inside.
- Databases: Rectangle with a distinct stroke or label.
- Caches: Rectangle with a dashed stroke.

Return the complete JSON object that can be passed to the Excalidraw component.`
}
