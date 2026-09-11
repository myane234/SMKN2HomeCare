import { NextResponse } from 'next/server';

const REMOTE_API = 'https://citra.faaruq.com';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 1. Coba login ke API Pasien Remote
    try {
      const remoteRes = await fetch(`${REMOTE_API}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      const remoteData = await remoteRes.json();

      if (remoteRes.ok && remoteData?.success) {
        return NextResponse.json(remoteData);
      }

      // Jika remote respon 403 (unverified email)
      if (remoteRes.status === 403 && (remoteData?.is_unverified || remoteData?.message?.includes('verifikasi'))) {
        return NextResponse.json(remoteData, { status: 403 });
      }
    } catch (remoteErr) {
      console.warn('[LoginAPI] Gagal menghubungi remote /api/login:', remoteErr.message);
    }

    // 2. Jika akun yang dimasukkan adalah akun Admin / Super Admin
    if (
      normalizedEmail === 'admin@gmail.com' ||
      normalizedEmail === 'faruq@homecare.com' ||
      normalizedEmail.includes('admin')
    ) {
      try {
        const adminRes = await fetch(`${REMOTE_API}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email: normalizedEmail, password })
        });

        const adminData = await adminRes.json();

        if (adminRes.ok && adminData?.success) {
          const token = adminData?.data?.token;
          const nama = adminData?.data?.nama || (normalizedEmail === 'admin@gmail.com' ? 'Super Admin' : 'Admin');
          
          return NextResponse.json({
            success: true,
            message: 'Berhasil login sebagai Admin',
            data: {
              token: token,
              roles: ['admin', 'pasien'],
              nama: nama,
              email: normalizedEmail,
              is_profile_complete: true
            }
          });
        }
      } catch (adminErr) {
        console.warn('[LoginAPI] Gagal remote admin login:', adminErr.message);
      }
    }

    // 3. Akun Pasien Demo untuk pengujian frontend
    if (
      (normalizedEmail === 'pasien@smarthomecare.com' && password === 'password') ||
      (normalizedEmail === 'pasien@gmail.com' && password === 'password') ||
      (normalizedEmail === 'demo@smarthomecare.com' && password === 'password')
    ) {
      return NextResponse.json({
        success: true,
        message: 'Berhasil login sebagai Pasien Demo',
        data: {
          token: 'demo-patient-token-' + Buffer.from(normalizedEmail).toString('hex').slice(0, 16),
          roles: ['pasien'],
          nama: 'Budi Santoso (Pasien Demo)',
          email: normalizedEmail,
          is_profile_complete: true
        }
      });
    }

    // 4. Default: Tolak dengan data login salah
    return NextResponse.json(
      { success: false, message: 'Data login salah. Periksa kembali email dan password Anda.' },
      { status: 401 }
    );
  } catch (err) {
    console.error('[LoginAPI] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server login.' },
      { status: 500 }
    );
  }
}
