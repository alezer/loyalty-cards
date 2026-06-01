import { supabaseAdmin } from '@/lib/supabase/admin'
import { MessagesManager } from '@/components/admin/MessagesManager'

export const dynamic = 'force-dynamic'

export type ContactMessage = {
  id: string
  email: string
  message: string
  created_at: string
  user_id: string | null
}

export default async function AdminMessagesPage() {
  const { data } = (await supabaseAdmin
    .from('contact_messages')
    .select('id, email, message, created_at, user_id')
    .order('created_at', { ascending: false })) as unknown as {
    data: ContactMessage[] | null
  }

  return <MessagesManager initialMessages={data ?? []} />
}
