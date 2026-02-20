import { DJANGO_API_URL } from '@/lib/config/django-api'

export async function POST(request: Request) {
  try {
    const ct = request.headers.get('content-type') || ''
    let init: RequestInit = { method: 'POST', redirect: 'manual', headers: {} }
    if (ct.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      init.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      init.body = JSON.stringify(body)
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      // Pass-through form data
      const buf = await request.arrayBuffer()
      init.headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
      init.body = buf
    } else {
      // Fallback: try to parse JSON first, otherwise forward raw
      try {
        const body = await request.json()
        init.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        init.body = JSON.stringify(body)
      } catch {
        const buf = await request.arrayBuffer()
        init.headers = { 'Accept': 'application/json' }
        init.body = buf
      }
    }

    const upstream = await fetch(`${DJANGO_API_URL}/api/users/token/`, init)
    const txt = await upstream.text()
    const headers = new Headers(upstream.headers)
    headers.delete('content-encoding')
    if (!headers.get('content-type')) headers.set('content-type', 'application/json; charset=utf-8')
    return new Response(txt, { status: upstream.status, headers })
  } catch (e: any) {
    const msg = e?.message || 'Proxy error'
    return new Response(JSON.stringify({ detail: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
}
