export async function GET() {
  return new Response('7b10184e-f5fd-40d0-a708-bd1c2ffa6ca5', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}

