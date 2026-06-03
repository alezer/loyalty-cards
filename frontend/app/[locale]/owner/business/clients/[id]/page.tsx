import { setRequestLocale } from 'next-intl/server'
import { redirect, notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StampWithStaff } from '@/lib/types/database'

export default async function BusinessClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id: clientId } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  type OwnerRow = { role: string; business_id: string | null }
  const { data: ownerProfile } = (await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .single()) as unknown as { data: OwnerRow | null }

  if (!ownerProfile || ownerProfile.role !== 'owner' || !ownerProfile.business_id) {
    redirect(`/${locale}/login`)
  }

  type ClientRow = { id: string; email: string; full_name: string | null }
  const { data: client } = (await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', clientId)
    .single()) as unknown as { data: ClientRow | null }

  if (!client) notFound()

  type CardRow = { id: string }
  const { data: card } = (await supabase
    .from('loyalty_cards')
    .select('id')
    .eq('customer_id', clientId)
    .eq('business_id', ownerProfile.business_id)
    .single()) as unknown as { data: CardRow | null }

  let stamps: StampWithStaff[] = []

  if (card) {
    type LogRow = { id: string; created_at: string; staff_id: string }
    const { data: logs } = (await supabase
      .from('stamps_log')
      .select('id, created_at, staff_id')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false })) as unknown as { data: LogRow[] | null }

    if (logs && logs.length > 0) {
      const staffIds = [...new Set(logs.map((l) => l.staff_id))]
      type StaffRow = { id: string; full_name: string | null; email: string }
      const { data: staffProfiles } = (await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', staffIds)) as unknown as { data: StaffRow[] | null }

      const staffMap = new Map((staffProfiles ?? []).map((s) => [s.id, s]))
      stamps = logs.map((log) => {
        const s = staffMap.get(log.staff_id)
        return {
          id: log.id,
          created_at: log.created_at,
          staff_id: log.staff_id,
          staff_name: s?.full_name ?? null,
          staff_email: s?.email ?? '',
        }
      })
    }
  }

  const t = await getTranslations('owner.clients')

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))

  return (
    <div>
      <Link
        href="/owner/business/clients"
        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mb-6"
      >
        <ArrowLeft size={14} />
        {t('backToClients')}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {client.full_name ?? client.email}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{client.email}</p>
        <p className="text-sm text-gray-500 mt-1">
          {stamps.length} {stamps.length === 1 ? 'sello' : 'sellos'}
        </p>
      </div>

      {stamps.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">{t('noHistory')}</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('stampDate')}</TableHead>
                <TableHead>{t('stampBy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stamps.map((stamp) => (
                <TableRow key={stamp.id}>
                  <TableCell className="text-sm">{formatDate(stamp.created_at)}</TableCell>
                  <TableCell className="text-sm">
                    {stamp.staff_name ?? stamp.staff_email}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
