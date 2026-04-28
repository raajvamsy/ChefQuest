import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
// Use a fast non-reasoning model for extraction — reasoning models (qwen3, deepseek-r1) waste
// tokens on <think> blocks which corrupts short max_tokens completions
const EXTRACTION_MODEL = 'llama-3.1-8b-instant'

// Groq Whisper supports these ISO 639-1 codes natively
const SUPPORTED_LANGUAGES = new Set([
  'en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa',
  'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru',
])

async function transcribeWithWhisper(audioFile: File, language: string): Promise<string> {
  const groqForm = new FormData()
  groqForm.append('file', audioFile, 'recording.webm')
  groqForm.append('model', 'whisper-large-v3')
  groqForm.append('response_format', 'json')
  groqForm.append('temperature', '0')
  // Bias Whisper towards food terminology
  groqForm.append('prompt', 'Recipe, dish, food, ingredient, cuisine, cooking, vegetarian, chicken, biryani, pasta, curry')

  if (SUPPORTED_LANGUAGES.has(language)) {
    groqForm.append('language', language)
  }

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: groqForm,
  })

  if (!res.ok) {
    throw new Error(`Whisper error: ${res.status} ${await res.text()}`)
  }

  const { text } = await res.json()
  return (text || '').trim()
}

async function extractFoodQuery(rawTranscript: string): Promise<string> {
  // Fast chat call to clean up the transcript into a concise food search query
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      temperature: 0,
      max_tokens: 40,
      messages: [
        {
          role: 'system',
          content:
            'You are a food query extractor. The user spoke a voice search command for a recipe app. ' +
            'Extract ONLY the concise food/dish/recipe search term from their speech. ' +
            'Remove filler words like "show me", "I want", "find", "search for", "recipes for", "how to make", etc. ' +
            'Output ONLY the clean search term, nothing else. No punctuation at end. ' +
            'Examples: "show me biryani recipes" → "biryani" | "I want to cook vegetarian pasta" → "vegetarian pasta" | ' +
            '"pachi pulusu andhra style" → "pachi pulusu andhra style" | "chicken curry" → "chicken curry"',
        },
        {
          role: 'user',
          content: rawTranscript,
        },
      ],
    }),
  })

  if (!res.ok) return rawTranscript // fallback to raw if extraction fails

  const data = await res.json()
  const cleaned = data?.choices?.[0]?.message?.content?.trim() || ''
  // If the model returned something reasonable, use it; else keep raw
  return cleaned.length > 0 && cleaned.length < rawTranscript.length + 10 ? cleaned : rawTranscript
}

export async function POST(request: Request) {
  const startTime = Date.now()
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'Voice transcription not configured' }, { status: 503 })
  }

  try {
    const incomingForm = await request.formData()
    const audioFile = incomingForm.get('audio') as File | null
    const language = (incomingForm.get('language') as string | null) || 'en'

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 })
    }

    // Step 1: Whisper transcription
    const rawTranscript = await transcribeWithWhisper(audioFile, language)
    if (!rawTranscript) {
      return NextResponse.json({ transcript: '' })
    }

    // Step 2: Extract clean food query via chat model (runs in parallel-ish — very fast)
    const cleanedQuery = await extractFoodQuery(rawTranscript)

    // Log voice search usage as an interaction (fire-and-forget)
    try {
      const { supabaseAdmin } = await import('@/lib/supabase-server')
      await supabaseAdmin.from('search_queries').insert({
        query_text: cleanedQuery,
        original_query: rawTranscript,
        corrected_query: cleanedQuery !== rawTranscript ? cleanedQuery : null,
        recipes_count: 0,
        session_id: crypto.randomUUID(),
        gemini_model_used: `whisper:voice_search`,
        response_time_ms: Date.now() - startTime,
      })
    } catch { /* non-critical */ }

    return NextResponse.json({ transcript: cleanedQuery, raw: rawTranscript })
  } catch (err) {
    console.error('[voice] transcription error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
