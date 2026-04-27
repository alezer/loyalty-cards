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

  // If the user hasn't gone through role selection yet, send them there.
  // We persist this flag in Supabase user_metadata to survive across sign-ins.
  const roleSelected = user.user_metadata?.role_selected as boolean | undefined
  if (!roleSelected) {
    return NextResponse.redirect(`${origin}/${locale}/role-select`)
  }

  // Route based on the app_role stored in metadata (set during role selection).
  const appRole = user.user_metadata?.app_role as UserRole | undefined
  if (appRole === 'owner' || appRole === 'staff' || appRole === 'admin') {
    return NextResponse.redirect(`${origin}/${locale}/staff/scan`)
  }

  return NextResponse.redirect(`${origin}/${locale}/customer/qr`)
}
