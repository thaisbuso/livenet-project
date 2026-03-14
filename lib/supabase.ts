import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabaseBrowser = createClient(env.supabaseUrl, env.supabaseAnonKey);

export const supabaseAdmin = env.supabaseServiceRoleKey
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
  : null;