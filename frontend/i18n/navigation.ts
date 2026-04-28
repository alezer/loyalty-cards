import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation helpers.
// Use these instead of next/navigation in locale-prefixed routes so that
// link hrefs and programmatic navigation stay locale-correct.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
