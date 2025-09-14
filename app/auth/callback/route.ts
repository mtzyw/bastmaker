import { isValidRedirectUrl } from '@/app/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  let next = searchParams.get('next') || '/'
  next = next == 'null' ? '/' : next

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (!isValidRedirectUrl(next)) {
    console.error('Invalid redirect URL', next)
    return NextResponse.redirect(new URL(`/redirect-error?code=invalid_redirect`, siteUrl))
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  return NextResponse.redirect(new URL(`/redirect-error?code=server_error`, siteUrl))
}