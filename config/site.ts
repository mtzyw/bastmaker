import { SiteConfig } from "@/types/siteConfig";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://flux-kontext.nexty.dev";

const TWITTER_EN = 'https://x.com/judewei_dev'
const TWITTER_ZH = 'https://x.com/weijunext'
const BSKY_URL = 'https://bsky.app/profile/judewei.bsky.social'
const EMAIL_URL = 'mailto:hi@bestmaker.ai'

export const siteConfig: SiteConfig = {
  name: 'BestMaker AI',
  url: BASE_URL,
  authors: [
    {
      name: "nexty.dev",
      url: "https://nexty.dev",
    }
  ],
  creator: '@judewei_dev',
  socialLinks: {
    bluesky: BSKY_URL,
    twitter: TWITTER_EN,
    twitterZh: TWITTER_ZH,
    email: EMAIL_URL,
  },
  themeColors: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  defaultNextTheme: 'dark', // next-theme option: system | dark | light
  icons: {
    icon: "/favicon/favicon.svg",
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
}
