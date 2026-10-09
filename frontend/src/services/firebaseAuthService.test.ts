import { describe, it, expect, beforeEach } from 'vitest';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  getCurrentUserSync,
  subscribeToAuth,
} from './firebaseAuthService';

describe('firebaseAuthService (demo & sandbox fallback)', () => {
  beforeEach(async () => {
    await logoutUser();
  });

  it('registers a new user successfully with assigned role', async () => {
    const user = await registerWithEmail(
      'priya.patil@oroute.ai',
      'secret123',
      'Priya Patil',
      'passenger'
    );
    expect(user).toBeDefined();
    expect(user.email).toBe('priya.patil@oroute.ai');
    expect(user.displayName).toBe('Priya Patil');
    expect(user.role).toBe('passenger');
    expect(getCurrentUserSync()?.email).toBe('priya.patil@oroute.ai');
  });

  it('rejects short passwords', async () => {
    await expect(
      registerWithEmail('fail@oroute.ai', '123', 'Fail User')
    ).rejects.toThrow('Password must be at least 6 characters');
  });

  it('logs in an existing user with role detection from email', async () => {
    const driverUser = await loginWithEmail('driver.rahul@oroute.ai', 'pass1234');
    expect(driverUser.role).toBe('driver');

    const opsUser = await loginWithEmail('ops.controller@oroute.ai', 'pass1234');
    expect(opsUser.role).toBe('dispatcher');
  });

  it('handles Google sign in fallback smoothly', async () => {
    const googleUser = await loginWithGoogle();
    expect(googleUser.provider).toBe('google');
    expect(googleUser.email).toContain('@oroute.ai');
    expect(googleUser.role).toBe('passenger');
  });

  it('notifies subscribers on login and logout', async () => {
    let observedUserEmail: string | null = null;
    const unsub = subscribeToAuth((u) => {
      observedUserEmail = u?.email ?? null;
    });

    await loginWithEmail('test.commuter@oroute.ai', 'secretpass');
    expect(observedUserEmail).toBe('test.commuter@oroute.ai');

    await logoutUser();
    expect(observedUserEmail).toBeNull();

    unsub();
  });
});
