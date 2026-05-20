'use client'

import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Tab {
  href: string
  label: string
}

interface DashboardShellProps {
  tabs: Tab[]
  children: React.ReactNode
}

export function DashboardShell({ tabs, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Tabs */}
            <nav className="flex gap-1" aria-label="Dashboard navigation">
              {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href as never}
                    className={[
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[36px] flex items-center',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 min-h-[44px] px-2"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{t('signOut')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  )
}
