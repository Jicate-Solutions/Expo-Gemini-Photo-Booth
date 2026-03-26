import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export async function authenticateExpo(username: string, password: string) {
  const supabase = createClient();
  const { data: expo } = await supabase
    .from('expos')
    .select('id, name, venue, start_date, end_date, username, password_hash, is_active')
    .eq('username', username.toLowerCase().trim())
    .eq('is_active', true)
    .single();

  if (!expo) return null;
  const valid = await verifyPassword(password, expo.password_hash);
  if (!valid) return null;

  const { password_hash, ...safeExpo } = expo;
  return safeExpo;
}

export async function authenticateAdmin(email: string, password: string) {
  const supabase = createClient();
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, email, display_name, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .single();

  if (!admin) return null;
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) return null;

  const { password_hash, ...safeAdmin } = admin;
  return safeAdmin;
}
