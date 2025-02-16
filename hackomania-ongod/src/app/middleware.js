import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
  const response = NextResponse.next();
  
  // Create a Supabase client using request cookies and attaching cookies to the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set(name, value, options);
        },
        remove: (name, options) => {
          response.cookies.delete(name, options);
        },
      },
    }
  );
  
  // Check session; if expired, attempt to refresh and update cookies
  const { data, error } = await supabase.auth.getSession();
  
  if (error || !data?.session) {
    // Try to refresh the session if not valid
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshData.session) {
      // The supabase client will automatically set updated cookies via our cookie handler.
      // Additional logic can be added here if needed.
    }
  }

  return response;
}

// Limit middleware to protected routes (adjust the matcher as needed)
export const config = {
  matcher: ['/protected/:path*']
};
