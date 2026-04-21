import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPostBySlug } from '@/lib/db/posts'
import { streamAIResponse, getOllamaModels, getDiagramSystemPrompt } from '@/lib/ai/provider'

// POST: Stream AI-generated content
export async function POST(request: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { instruction, currentContent, referenceSlugs, model, mode } = body

    if (!instruction) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 })
    }

    // Fetch reference posts
    let referenceContent = ''
    if (referenceSlugs && referenceSlugs.length > 0) {
      const refs: string[] = []
      for (const slug of referenceSlugs.slice(0, 3)) {
        // Max 3 references
        const post = await getPostBySlug(slug)
        if (post) {
          refs.push(`### ${post.title}\n\n${post.content?.slice(0, 3000) || ''}`)
        }
      }
      referenceContent = refs.join('\n\n---\n\n')
    }

    // Build mode-specific instruction prefix
    let fullInstruction = instruction
    if (mode === 'rewrite') {
      fullInstruction = `Rewrite and improve the following content based on these instructions: ${instruction}`
    } else if (mode === 'continue') {
      fullInstruction = `Continue writing from where the current content ends. Instructions: ${instruction}`
    } else if (mode === 'diagram') {
      fullInstruction = `Generate an Excalidraw JSON diagram for this system architecture: ${instruction}`
    }

    const stream = await streamAIResponse({
      instruction: fullInstruction,
      currentContent: mode !== 'generate' && mode !== 'diagram' ? currentContent : undefined,
      referenceContent: referenceContent || undefined,
      model,
      systemPrompt: mode === 'diagram' ? getDiagramSystemPrompt() : undefined,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    console.error('AI generation error:', error)
    const message = error instanceof Error ? error.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET: Fetch available Ollama models
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const models = await getOllamaModels()
  return NextResponse.json({ models })
}
