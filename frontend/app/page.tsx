// The next-intl middleware redirects / → /es automatically.
// This page is a fallback for any edge case where the middleware doesn't fire.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/es')
}
