import { getTranslations } from 'next-intl/server'
import { BusinessSubNav } from '@/components/owner/BusinessSubNav'

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations('owner')

  const subTabs = [
    { href: '/owner/business/information', label: t('business.information') },
    { href: '/owner/business/team', label: t('team.title') },
    { href: '/owner/business/clients', label: t('clients.title') },
    { href: '/owner/business/news', label: t('news.title') },
  ]

  return (
    <>
      <BusinessSubNav tabs={subTabs} />
      {children}
    </>
  )
}
