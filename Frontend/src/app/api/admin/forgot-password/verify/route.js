import { handleVerifyOtp } from '@/lib/forgotPasswordStore';

export async function POST(request) {
  return handleVerifyOtp(request, '/api/admin/forgot-password/verify');
}
