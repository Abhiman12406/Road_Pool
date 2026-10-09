/**
 * Supabase Authentication Service
 * Provides Supabase Auth operations while adhering to AuthUserProfile interface.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { AuthUserProfile } from './firebaseAuthService';

export async function loginWithSupabase(email: string, password: string): Promise<AuthUserProfile> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Failed to sign in with Supabase.');
  }

  const user = data.user;
  const role: 'passenger' | 'driver' | 'dispatcher' =
    email.includes('driver') ? 'driver' : email.includes('ops') ? 'dispatcher' : 'passenger';

  return {
    uid: user.id,
    email: user.email || email,
    displayName: user.user_metadata?.display_name || email.split('@')[0],
    photoURL: user.user_metadata?.avatar_url || null,
    role,
    provider: 'password',
  };
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  displayName: string,
  role: 'passenger' | 'driver' | 'dispatcher' = 'passenger'
): Promise<AuthUserProfile> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
      },
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Failed to sign up with Supabase.');
  }

  const user = data.user;
  return {
    uid: user.id,
    email: user.email || email,
    displayName: displayName || email.split('@')[0],
    photoURL: null,
    role,
    provider: 'password',
  };
}

export async function logoutWithSupabase(): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}
