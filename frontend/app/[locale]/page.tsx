import { setRequestLocale } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { QrCode } from 'lucide-react'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <HomeContent />
}

function HomeContent() {
  const t = useTranslations('home')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="bg-brand-600 text-white rounded-2xl p-4">
            <QrCode size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-3 text-lg text-gray-500">{t('description')}</p>
        <p className="mt-2 text-sm text-gray-400">{t('ready')}</p>
      </div>
    </main>
  )
}
