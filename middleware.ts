import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Interceptar requisições para //riot.txt (com duas barras)
  const url = request.url
  
  // Verificar se a URL contém //riot.txt
  if (url.includes('//riot.txt')) {
    return new NextResponse('7b10184e-f5fd-40d0-a708-bd1c2ffa6ca5', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/:path*/riot.txt',
    '/riot.txt',
  ],
}

