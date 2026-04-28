import { NextRequest, NextResponse } from 'next/server'
import { createUserClient, getAuthToken } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request.headers.get('Authorization'))
  if (!token) {
    return NextResponse.json({ error: 'Authorization header missing or invalid' }, { status: 401 })
  }

  const body = await request.json() as { customer_id?: string; business_id?: string }

  if (!body.customer_id || !body.business_id) {
    return NextResponse.json(
      { error: 'customer_id and business_id are required' },
      { status: 400 },
    )
  }

  const userClient = createUserClient(token)

  const { data, error } = await (userClient.rpc('add_stamp', {
    p_customer_id: body.customer_id,
    p_business_id: body.business_id,
  } as never) as unknown as Promise<{ data: unknown; error: { message: string } | null }>)

  if (error) {
    const isDuplicate = error.message.includes('Escaneo duplicado')
    return NextResponse.json({ error: error.message }, { status: isDuplicate ? 429 : 400 })
  }

  return NextResponse.json({ success: true, data })
}
