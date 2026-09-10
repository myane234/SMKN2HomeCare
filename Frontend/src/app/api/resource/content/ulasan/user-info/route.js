import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function GET(request) {
  try {
    // 1. Dapatkan token dari header Authorization atau cookie auth
    const authHeader = request.headers.get('authorization') || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      const cookieStore = await cookies();
      token =
        cookieStore.get('auth_token')?.value ||
        cookieStore.get('smarthomecare-session')?.value;
    }

    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json(
        { message: 'Unauthenticated.' },
        { status: 401 }
      );
    }

    // 2. Hubungi backend Sanctum /profile/me
    let userInfo = null;

    try {
      const remoteRes = await fetch(`${API_ORIGIN}/api/profile/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (remoteRes.status === 401) {
        return NextResponse.json(
          { message: 'Unauthenticated.' },
          { status: 401 }
        );
      }

      if (remoteRes.ok) {
        const body = await remoteRes.json();
        const profileData = body?.data || body;
        if (profileData) {
          const user = profileData.user || {};
          const pasien = profileData.pasien || {};
          
          let fotoUrl = null;
          if (pasien.avatar) {
            if (pasien.avatar.startsWith('http://') || pasien.avatar.startsWith('https://')) {
              fotoUrl = pasien.avatar;
            } else {
              const filename = pasien.avatar.replace(/\\/g, '/').replace(/^\/+/, '').split('/').pop();
              fotoUrl = `${API_ORIGIN}/storage/avatars/${filename}`;
            }
          }

          userInfo = {
            id_user: user.id_user || user.id || 1,
            email: user.email || '',
            nama_pengulas: pasien.nama_lengkap || user.nama || user.name || 'Pasien',
            foto: pasien.avatar || null,
            foto_url: fotoUrl,
          };
        }
      }
    } catch (fetchErr) {
      console.warn('Gagal menghubungi backend /api/profile/me:', fetchErr.message);
    }

    // 3. Fallback jika network remote backend gagal tetapi user memiliki cookie session valid
    if (!userInfo) {
      const cookieStore = await cookies();
      const profileCookie = cookieStore.get('user_profile')?.value;
      const emailCookie = cookieStore.get('profile_email')?.value;
      const namaCookie = cookieStore.get('profile_nama')?.value || cookieStore.get('user_nama')?.value;

      if (profileCookie || emailCookie || namaCookie) {
        let parsedProfile = {};
        if (profileCookie) {
          try {
            parsedProfile = JSON.parse(decodeURIComponent(profileCookie));
          } catch {}
        }

        const user = parsedProfile.user || {};
        const pasien = parsedProfile.pasien || {};

        userInfo = {
          id_user: user.id_user || user.id || 1,
          email: user.email || (emailCookie ? decodeURIComponent(emailCookie) : ''),
          nama_pengulas:
            pasien.nama_lengkap ||
            (namaCookie ? decodeURIComponent(namaCookie) : '') ||
            user.nama ||
            'Pasien',
          foto: pasien.avatar || null,
          foto_url: pasien.avatar || null,
        };
      }
    }

    if (!userInfo) {
      return NextResponse.json(
        { message: 'Unauthenticated.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil informasi user untuk ulasan',
      data: userInfo,
    });
  } catch (error) {
    console.error('Error in /api/resource/content/ulasan/user-info:', error);
    return NextResponse.json(
      { message: 'Unauthenticated.' },
      { status: 401 }
    );
  }
}
