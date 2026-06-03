'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ClientWithCard } from '@/lib/types/database'

interface Props {
  clients: ClientWithCard[]
  locale: string
  basePath?: string
}

export function ClientsTable({ clients, locale, basePath = '/owner/business/clients' }: Props) {
  const t = useTranslations('owner.clients')
  const router = useRouter()

  if (clients.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">{t('noClients')}</p>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('email')}</TableHead>
            <TableHead className="text-right">{t('stamps')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`${basePath}/${client.id}` as never)}
            >
              <TableCell className="font-medium">
                {client.full_name ?? '—'}
              </TableCell>
              <TableCell className="text-gray-500">{client.email}</TableCell>
              <TableCell className="text-right font-semibold text-brand-600">
                {client.stamps_count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
