'use client'

import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard tab bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 h-14 items-center" aria-label="Dashboard navigation">
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
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  )
}
