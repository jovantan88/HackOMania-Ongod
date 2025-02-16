import { supabase } from '@/lib/supabase/supabaseClient'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  console.log('code:', code)
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  })
}

export async function POST(request) {
  return GET(request)
}