import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('7b10184e-f5fd-40d0-a708-bd1c2ffa6ca5', {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

