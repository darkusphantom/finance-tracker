import { cookies } from 'next/headers';
import { verifySessionToken } from './session';

export async function requireAuth(): Promise<string> {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) throw new Error('Unauthorized');
  
  const userId = await verifySessionToken(token);
  if (!userId) throw new Error('Unauthorized');
  
  return userId;
}
