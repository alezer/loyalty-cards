import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import type { UserRole } from '@/lib/types/database'

// Handles both OAuth (Google) and email-link confirmation callbacks.
// Supabase redirects here with ?code=xxx after authentication.
// We exchange the code for a session, then route the user appropriately.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Locale is forwarded as a query param by the sign-in helpers so we can
  // redirect back into the correct locale tree.
  const locale = searchParams.get('locale') ?? 'es'
  // next=reset-password signals that this is a password-recovery callback.
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as never)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_failed`)
  }

  // Fetch the newly established session to determine where to route the user.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=no_session`)
  }

  // Password recovery — skip role logic and go straight to the reset page.
  if (next === 'reset-password') {
    return NextResponse.redirect(`${origin}/${locale}/reset-password`)
  }

  // Auto-assign customer role for new users; owners are created by admin only.
  // Role-select page is preserved but not shown in the current flow.
  const roleSelected = user.user_metadata?.role_selected as boolean | undefined
  if (!roleSelected) {
    await supabase.from('profiles').update({ role: 'customer' } as never).eq('id', user.id)
    await supabase.auth.updateUser({ data: { role_selected: true, app_role: 'customer' } })
    return NextResponse.redirect(`${origin}/${locale}/customer/qr`)
  }

  // Route based on the role stored in the profiles table (source of truth).
  // user_metadata.app_role can be stale if the role was changed via SQL.
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as unknown as { data: { role: UserRole } | null }
  const appRole = profile?.role
  if (appRole === 'admin') return NextResponse.redirect(`${origin}/${locale}/admin/dashboard`)
  if (appRole === 'owner') return NextResponse.redirect(`${origin}/${locale}/owner/team`)
  if (appRole === 'staff') return NextResponse.redirect(`${origin}/${locale}/staff/scan`)

  return NextResponse.redirect(`${origin}/${locale}/customer/qr`)
}
