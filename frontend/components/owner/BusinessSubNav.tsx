'use client'

import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'

interface Tab {
  href: string
  label: string
}

export function BusinessSubNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="flex gap-1" aria-label="Business section navigation">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href as never}
              className={[
                'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
