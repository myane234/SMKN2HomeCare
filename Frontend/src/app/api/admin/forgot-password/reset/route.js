import { handleResetPassword } from '@/lib/forgotPasswordStore';

export async function POST(request) {
  return handleResetPassword(request, '/api/admin/forgot-password/reset');
}
