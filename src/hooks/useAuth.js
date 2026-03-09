'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }, [router]);

  return { logout };
}
