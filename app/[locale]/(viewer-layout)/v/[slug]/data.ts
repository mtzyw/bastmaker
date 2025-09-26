import { cache } from 'react';

import { getViewerJobBySlug } from '@/actions/ai-jobs/public';
import type { ViewerJob } from '@/actions/ai-jobs/public';
import { notFound } from 'next/navigation';

export const getViewerJob = cache(async (slug: string): Promise<ViewerJob> => {
  const result = await getViewerJobBySlug(slug);

  if (!result.success || !result.data) {
    if (result.customCode === 'NOT_FOUND') {
      notFound();
    }

    throw new Error(result.error ?? 'Failed to load job');
  }

  return result.data;
});
