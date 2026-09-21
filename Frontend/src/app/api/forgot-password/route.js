import { handleRequestOtp } from '@/lib/forgotPasswordStore';

export async function POST(request) {
  return handleRequestOtp(request, '/api/forgot-password');
}
