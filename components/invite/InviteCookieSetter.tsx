'use client';

import { useEffect } from 'react';

type Props = {
  ownerId: string;
  shareSlug: string;
  locale: string;
};

export function InviteCookieSetter({ ownerId, shareSlug, locale }: Props) {
  useEffect(() => {
    let cancelled = false;

    async function register() {
      try {
        const res = await fetch('/api/share/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'invite',
            jobId: null,
            ownerId,
            shareSlug,
            locale,
            source: 'invite',
          }),
        });

        if (!res.ok && !cancelled) {
          console.error('[invite-cookie-setter] failed', await res.json());
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[invite-cookie-setter] error', error);
        }
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [ownerId, shareSlug, locale]);

  return null;
}
