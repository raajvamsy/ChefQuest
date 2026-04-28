import { NextResponse } from 'next/server'

// Groq Whisper supports these ISO 639-1 codes natively — great for Indian languages
const SUPPORTED_LANGUAGES = new Set([
  'en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa',
  'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru',
])

export async function POST(request: Request) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY
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

    // Forward to Groq Whisper
    const groqForm = new FormData()
    groqForm.append('file', audioFile, 'recording.webm')
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('response_format', 'json')
    groqForm.append('temperature', '0')

    // Pass language hint when known — improves accuracy significantly for non-English
    if (SUPPORTED_LANGUAGES.has(language)) {
      groqForm.append('language', language)
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error('[voice] Groq Whisper error:', err)
      return NextResponse.json({ error: 'Transcription failed' }, { status: groqRes.status })
    }

    const { text } = await groqRes.json()
    return NextResponse.json({ transcript: (text || '').trim() })
  } catch (err) {
    console.error('[voice] transcription error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
