import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function BusinessPage() {
  redirect('/owner/business/information')
}
