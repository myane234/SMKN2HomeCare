import { NextResponse } from 'next/server';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'sharklasers.com', 'throwawaymail.com', 'yopmail.com',
  'getairmail.com', 'dispostable.com', 'trashmail.com', 'fakeinbox.com',
  'mohmal.com', 'burnermail.io', 'mytemp.email', 'nada.ltd'
]);

const POPULAR_VALID_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.co.id', 'hotmail.com',
  'outlook.com', 'icloud.com', 'live.com', 'smkn2kra.sch.id', 'kemdikbud.go.id'
]);

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, message: 'Alamat email wajib diisi.' }, { status: 400 });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ valid: false, message: 'Format alamat email tidak valid.' }, { status: 422 });
    }
    const parts = trimmedEmail.split('@');
    const domain = parts[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ valid: false, message: 'Domain email sementara/disposable tidak diizinkan.' }, { status: 422 });
    }
    if (POPULAR_VALID_DOMAINS.has(domain)) {
      return NextResponse.json({ valid: true, message: 'Domain email terverifikasi aktif.', domain });
    }
    let mxRecords = [];
    try {
      mxRecords = await dns.promises.resolveMx(domain);
    } catch (dnsErr) {
      try {
        const dohRes = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=MX', {
          headers: { Accept: 'application/dns-json' }
        });
        if (dohRes.ok) {
          const dohData = await dohRes.json();
          if (dohData.Answer && dohData.Answer.length > 0) {
            mxRecords = dohData.Answer;
          }
        }
      } catch {}
    }
    if (!mxRecords || mxRecords.length === 0) {
      return NextResponse.json({
        valid: false,
        message: 'Domain email "' + domain + '" tidak ditemukan atau tidak memiliki server email aktif (MX  record). Mohon periksa kembali email Anda.'
      }, { status: 422 });
    }
    return NextResponse.json({ valid: true, message: 'Email valid dan server email aktif.', domain });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ valid: true, message: 'Verifikasi selesai.', error: error.message }, { status: 200 });
  }
}
