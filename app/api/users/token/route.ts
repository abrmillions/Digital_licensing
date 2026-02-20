import { DJANGO_API_URL } from '@/lib/config/django-api'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await fetch(`${DJANGO_API_URL}/api/users/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      redirect: 'manual',
    })
    const txt = await res.text()
    const headers = new Headers(res.headers)
    headers.delete('content-encoding')
    if (!headers.get('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8')
    }
    return new Response(txt, { status: res.status, headers })
  } catch (e: any) {
    const msg = e?.message || 'Proxy error'
    return new Response(JSON.stringify({ detail: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
}





