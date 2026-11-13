import { handleRequestOtp } from '@/lib/forgotPasswordStore';

export async function POST(request) {
  return handleRequestOtp(request, '/api/admin/forgot-password');
}
