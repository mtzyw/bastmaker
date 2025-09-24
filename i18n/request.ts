import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const common = (await import(`./messages/${locale}/common.json`)).default;

  return {
    locale,
    messages: {
      Landing: (await import(`./messages/${locale}/Landing.json`)).default,
      Pricing: (await import(`./messages/${locale}/Pricing.json`)).default,

      GenImageShared: (await import(`./messages/${locale}/GenImageShared.json`)).default,
      FluxKontextPro: (await import(`./messages/${locale}/FluxKontextPro.json`)).default,
      MultiImageKontextPro: (await import(`./messages/${locale}/MultiImageKontextPro.json`)).default,
      MyCreations: (await import(`./messages/${locale}/MyCreations.json`)).default,

      // Dashboard - User
      CreditHistory: (await import(`./messages/${locale}/Dashboard/User/CreditHistory.json`)).default,
      Settings: (await import(`./messages/${locale}/Dashboard/User/Settings.json`)).default,
      Subscription: (await import(`./messages/${locale}/Dashboard/User/Subscription.json`)).default,
      ImageHistory: (await import(`./messages/${locale}/Dashboard/User/ImageHistory.json`)).default,

      // Dashboard - Admin
      Overview: (await import(`./messages/${locale}/Dashboard/Admin/Overview.json`)).default,
      DashboardBlogs: (await import(`./messages/${locale}/Dashboard/Admin/Blogs.json`)).default,
      ImageJobs: (await import(`./messages/${locale}/Dashboard/Admin/ImageJobs.json`)).default,
      Users: (await import(`./messages/${locale}/Dashboard/Admin/Users.json`)).default,
      Orders: (await import(`./messages/${locale}/Dashboard/Admin/Orders.json`)).default,
      R2Files: (await import(`./messages/${locale}/Dashboard/Admin/R2Files.json`)).default,
      Prices: (await import(`./messages/${locale}/Dashboard/Admin/Prices.json`)).default,
      // common
      ...common
    }
  };
});
