# Nexty-Flux-Kontext - AI Image Generation Website Template Based on Nexty and Flux Kontext

This repository is an AI image generation website template built on the full-stack template [Nexty](https://github.com/WeNextDev/nexty.dev) and [Flux Kontext](https://replicate.com/search?query=flux-kontext).

- 🚀 Get Nexty Template 👉: [nexty](https://github.com/WeNextDev/nexty.dev)  
- 🚀 Get Nexty - Flux Kontext Template 👉: [nexty-flux-kontext](https://github.com/wenextdev/nexty-flux-kontext)  
- 🚀 Nexty Documentation 👉: https://nexty.dev/docs

## Features

- General landing page
- Independent Pricing page
  - Support for monthly, yearly, and one-time payments
  - Provides banners to stimulate payments
  - Provides SEO content sections
- AI image generation functionality (code path: `app/[locale]/(gen-image)/`)
  - Free credits for new users (environment variable `NEXT_PUBLIC_WELCOME_CREDITS`)
  - Monthly credit reset for annual subscription users
  - Since Flux Kontext only supports English prompts, the template provides automatic prompt translation functionality (environment variables `IMAGE_PROMPT_TRANSLATE_PROVIDER`, `IMAGE_PROMPT_TRANSLATE_MODEL`)
  - Based on Replicate Webhook task flow, frontend doesn't need to wait
  - AI functionality page can view recent image generation history
- New Dashboard modules
  - Users can view image generation history
  - Admins can view all image lists

Supported AI models:
- [flux-kontext-pro](https://replicate.com/black-forest-labs/flux-kontext-pro), [flux-kontext-max](https://replicate.com/black-forest-labs/flux-kontext-max)
- [multi-image-kontext-pro](https://replicate.com/flux-kontext-apps/multi-image-kontext-pro), [multi-image-kontext-max](https://replicate.com/flux-kontext-apps/multi-image-kontext-max)

## Development Steps

1. Complete necessary configuration and startup steps according to [Nexty Documentation](https://nexty.dev/docs). Since this is based on Nexty, all necessary steps to start Nexty are required for this project
2. Search globally for `Nexty AI Image` and `flux-kontext.nexty.dev` in Cursor or VSCode, change the brand name to your product name, check `config/site.ts`, and update your website information
3. Create product pricing in Stripe, then update your pricing cards in Dashboard/prices, **must change Stripe Price ID to your own**, then test the payment flow
4. Add new features:
  - Update your AI feature configuration `config/featureList.ts`
  - For new AI feature configurations, if parameters differ from existing features, check if the server-side logic in `app/api/ai/replicate/flux-kontent/submit/route.ts` is compatible (generally it is), this is a universal processing interface
  - Since Flux Kontext only supports English prompts, but we can't require users to input English only, this template provides prompt translation functionality, code in `app/api/ai/replicate/flux-kontent/submit/prompt-optimizer.ts`, this is also a universal processing method, you don't need to modify the code, just confirm if the prompt translation meets your requirements, then choose your preferred AI model and configure environment variables (`IMAGE_PROMPT_TRANSLATE_PROVIDER`, `IMAGE_PROMPT_TRANSLATE_MODEL` and the API_KEY for your chosen platform)
  - This project uses Replicate Webhook to implement the core workflow. You need to set the environment variable `REPLICATE_WEBHOOK_SECRET`, which should be generated at [replicate](https://replicate.com/account/webhook)
  - Replicate Webhook requires a specific address. Since development and production environments have different server addresses, use the environment variable `REPLICATE_WEBHOOK_BASE_URL` to configure the host. For local development, use the Forwarded Address exposed address (as shown in the image), and for production environment, use your production domain address.
   ![forwarded-address.png](/public/readme/forwarded-address.png)
  - Add a new file with the same name in each language folder under `i18n/messages`, then import the new file in `i18n/messages/request.ts`
  - In Cursor, select any feature module from `app/[locale]/(gen-image)`, select `config/featureList.ts`, select the newly created file in the `i18n/messages` language folder, and copy the AI model documentation links you want to use (e.g., [restore-image](https://replicate.com/flux-kontext-apps/restore-image), [restore-image-api](https://replicate.com/flux-kontext-apps/restore-image/api/api-reference)) to the Cursor dialog. Ask AI to develop a new page based on existing functionality, first complete the AI function area, and supplement the multilingual package to the json file.
  - Ask AI to design a page with the same structure based on existing feature modules and complete SEO content
5. Update website materials and meta information
   - Logo: [https://www.logo.surf/](https://www.logo.surf/), [https://ray.so/icon](https://ray.so/icon?q=), [https://icon.kitchen/](https://icon.kitchen/)
   - OG Image: [https://ogimage.click](https://ogimage.click)
   - Website meta information configuration: `lib/metadata.ts`, default is general configuration, supports displaying different meta information for different languages

## Technical Support

If you encounter any issues, please contact me for support:

> - Discord: https://discord.gg/R7bUxWKRqZ
> - Email: hi@nexty.dev
> - Twitter: https://x.com/judewei_dev
