import { NextResponse } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/booking',
  '/complete-profile',
  '/pembayaran',
  '/nakes/dashboard',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('auth_token')?.value || request.cookies.get('smarthomecare-session')?.value;
  const isAuthenticated = Boolean(token && token.trim() !== '');

  // Check if current route is protected
  const isProtected = PROTECTED_ROUTES.some((route) => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    
    // Clear stale profile cookies if any
    const cookiesToClear = [
      'user_profile', 'profile_avatar', 'profile_email', 'profile_id_user', 
      'profile_roles', 'is_profile_complete', 'profile_nama', 'profile_nik', 
      'profile_golongan_darah', 'profile_jenis_kelamin', 'profile_alamat', 
      'tenaga_medis', 'is_logged_in', 'active_role'
    ];
    cookiesToClear.forEach((cookieName) => {
      response.cookies.delete(cookieName);
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/booking/:path*',
    '/complete-profile/:path*',
    '/pembayaran/:path*',
    '/nakes/dashboard/:path*',
  ],
};
