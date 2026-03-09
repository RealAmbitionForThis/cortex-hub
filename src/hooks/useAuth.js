'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue to login even if request fails
    }
    router.push('/login');
    router.refresh();
  }, [router]);

  return { logout };
}
