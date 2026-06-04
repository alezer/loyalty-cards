import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['es', 'en', 'ca'],
  defaultLocale: 'es',
  localePrefix: 'always',
  localeCookie: true,
})
