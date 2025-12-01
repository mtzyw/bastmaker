import { listPublishedPostsAction } from '@/actions/blogs/posts'
import { siteConfig } from '@/config/site'
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/routing'
import { getPosts } from '@/lib/getBlogs'
import { IMAGE_EFFECTS } from '@/lib/image-effects/effects'
import { listActiveImageEffects } from '@/lib/image-effects/templates'
import { MetadataRoute } from 'next'

const siteUrl = siteConfig.url

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    '',
    // '/about',
    '/privacy-policy',
    '/terms-of-service',
  ]

  const pages = LOCALES.flatMap(locale => {
    return staticPages.map(page => ({
      url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as ChangeFrequency,
      priority: page === '' ? 1.0 : 0.8,
    }))
  })

  const allBlogSitemapEntries: MetadataRoute.Sitemap = [];
  const viewerEntries: MetadataRoute.Sitemap = [];
  const imageEffectDetailEntries: MetadataRoute.Sitemap = [];

  // Viewer entries removed per user request
  // try {
  //   const supabase = getServiceRoleClient();
  //   const { data: publicJobs, error: publicJobsError } = await supabase
  //     .from('ai_jobs')
  //     .select('share_slug, created_at')
  //     .eq('is_public', true)
  //     .not('share_slug', 'is', null)
  //     .order('created_at', { ascending: false })
  //     .limit(5000);

  //   if (publicJobsError) {
  //     console.error('[sitemap] failed to fetch viewer jobs', publicJobsError);
  //   } else if (publicJobs) {
  //     for (const job of publicJobs) {
  //       if (!job.share_slug) continue;
  //       for (const locale of LOCALES) {
  //         viewerEntries.push({
  //           url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/v/${job.share_slug}`,
  //           lastModified: job.created_at ? new Date(job.created_at) : new Date(),
  //           changeFrequency: 'weekly' as ChangeFrequency,
  //           priority: 0.6,
  //         });
  //       }
  //     }
  //   }
  // } catch (error) {
  //   console.error('[sitemap] unexpected error fetching viewer entries', error);
  // }

  for (const locale of LOCALES) {
    const { posts: localPosts } = await getPosts(locale);
    localPosts
      .filter((post) => post.slug && post.status !== "draft")
      .forEach((post) => {
        const slugPart = post.slug.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allBlogSitemapEntries.push({
            url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blogs/${slugPart}`,
            lastModified: post.metadata?.updatedAt || post.published_at || new Date(),
            changeFrequency: 'daily' as ChangeFrequency,
            priority: 0.7,
          });
        }
      });
  }

  for (const locale of LOCALES) {
    const serverResult = await listPublishedPostsAction({
      locale: locale,
      pageSize: 1000,
      visibility: "public",
    });
    if (serverResult.success && serverResult.data?.posts) {
      serverResult.data.posts.forEach((post) => {
        const slugPart = post.slug?.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allBlogSitemapEntries.push({
            url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blogs/${slugPart}`,
            lastModified: post.published_at || new Date(),
            changeFrequency: 'daily' as ChangeFrequency,
            priority: 0.7,
          });
        }
      });
    }
  }

  const effectBaseEntries = LOCALES.map((locale) => ({
    url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/image-effects`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.8,
  }));

  let effectSlugs: Array<{ slug: string; updatedAt?: string | null; createdAt?: string | null }> = [];
  try {
    const templates = await listActiveImageEffects();
    if (templates.length > 0) {
      effectSlugs = templates.map((template) => ({
        slug: template.slug,
        updatedAt: template.updatedAt,
        createdAt: template.createdAt,
      }));
    }
  } catch (error) {
    console.error('[sitemap] failed to list active image effects', error);
  }

  if (effectSlugs.length === 0) {
    effectSlugs = IMAGE_EFFECTS.map((effect) => ({
      slug: effect.slug,
      updatedAt: null,
      createdAt: null,
    }));
  }

  effectSlugs.forEach(({ slug, updatedAt, createdAt }) => {
    LOCALES.forEach((locale) => {
      imageEffectDetailEntries.push({
        url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/image-effects/${slug}`,
        lastModified: updatedAt ? new Date(updatedAt) : createdAt ? new Date(createdAt) : new Date(),
        changeFrequency: 'weekly' as ChangeFrequency,
        priority: 0.75,
      });
    });
  });

  const uniqueBlogPostEntries = Array.from(
    new Map(allBlogSitemapEntries.map((entry) => [entry.url, entry])).values()
  );

  return [
    ...pages,
    ...effectBaseEntries,
    ...imageEffectDetailEntries,
    ...uniqueBlogPostEntries,
    ...viewerEntries,
  ]
}
