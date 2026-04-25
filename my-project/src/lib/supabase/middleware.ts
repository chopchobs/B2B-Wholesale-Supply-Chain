import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect Merchant routes
  if (request.nextUrl.pathname.startsWith('/merchant')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Check Role in public.User table via Edge-compatible Supabase JS client
    const { data: userRecord } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (!userRecord || (userRecord.role !== 'MERCHANT' && userRecord.role !== 'ADMIN')) {
      // Redirect unauthorized users to storefront
      return NextResponse.redirect(new URL('/products', request.url))
    }
  }

  return supabaseResponse
}
