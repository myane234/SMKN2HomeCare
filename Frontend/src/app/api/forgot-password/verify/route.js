import { handleVerifyOtp } from '@/lib/forgotPasswordStore';

export async function POST(request) {
  return handleVerifyOtp(request, '/api/forgot-password/verify');
}
