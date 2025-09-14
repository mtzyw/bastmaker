# Nexty-Flux-Kontext - 基于 Nexty 和 Flux Kontext 开发的AI生图网站模板

本仓库是基于全栈模板[Nexty](https://github.com/WeNextDev/nexty.dev) 和 [Flux Kontext](https://replicate.com/search?query=flux-kontext) 搭建的AI生图网站模板。

- 🚀 获取Nexty模板 👉：[nexty](https://github.com/WeNextDev/nexty.dev)  
- 🚀 获取Nexty - Flux Kontext模板 👉：[nexty-flux-kontext](https://github.com/wenextdev/nexty-flux-kontext)  
- 🚀 Nexty文档 👉: https://nexty.dev/zh/docs

## 功能

- 通用落地页
- 独立 Pricing 页面
  - 支持月付、年付、一次性付款
  - 提供刺激付费的banner
  - 提供SEO内容区
- AI生图功能（代码路径：`app/[locale]/(gen-image)/`）
  - 新用户免费积分（环境变量`NEXT_PUBLIC_WELCOME_CREDITS`）
  - 年付用户每个月重置积分
  - 因为Flux Kontext仅支持英文 prompt，所以模板提供自动翻译 prompt 功能（环境变量`IMAGE_PROMPT_TRANSLATE_PROVIDER`, `IMAGE_PROMPT_TRANSLATE_MODEL`） 
  - 基于 Replicate Webhook 任务的流程，前端无需等待
  - AI功能页面可查看近期生图历史
- Dashboard 新模块
  - 用户查看生图历史
  - 管理员查看所有图片列表

已支持的功能对应的AI模型：
- [flux-kontext-pro](https://replicate.com/black-forest-labs/flux-kontext-pro)、[flux-kontext-max](https://replicate.com/black-forest-labs/flux-kontext-max)
- [multi-image-kontext-pro](https://replicate.com/flux-kontext-apps/multi-image-kontext-pro)、[multi-image-kontext-max](https://replicate.com/flux-kontext-apps/multi-image-kontext-max)

## 二开步骤

1. 根据[Nexty文档](https://nexty.dev/zh/docs)完成必要配置和启动步骤，因为基于 Nexty，所以启动 Nexty 必要的步骤在这个项目全都要
2. 在 Cursor 或 VSCode 全局搜索 `Nexty AI Image` 和 `nextyd.dev`，把品牌名改成你的产品名称，检查 `config/site.ts`，更新你的网站信息
3. 在 Stripe 创建产品定价，然后在 Dashboard/prices 更新你的定价卡片，**必须把 Stripe Price ID 改成你自己的**，然后测试支付流程
4. 新增功能：
  - 更新你的AI功能配置 `config/featureList.ts`
  - 新增的AI功能配置，如果参数和已有功能不同，检查 `app/api/ai/replicate/flux-kontent/submit/route.ts` 的服务端逻辑是否兼容（一般情况下是兼容的），这是一个通用的处理接口
  - 由于 Flux Kontext 仅支持英文 prompt，但我们不能要求用户必须输入英文，所以本模板提供了 prompt 翻译的功能，代码在 `app/api/ai/replicate/flux-kontent/submit/prompt-optimizer.ts`，这也是个通用的处理方法，你无需修改代码，只需确认翻译 prompt 是否符合你的要求，然后选择你喜欢的 AI 模型，并进行配置环境变量（`IMAGE_PROMPT_TRANSLATE_PROVIDER`, `IMAGE_PROMPT_TRANSLATE_MODEL` 和你所选平台的 API_KEY）
  - 本项目使用 Replicate Webhook 实现核心流程，你需要填写环境变量 `REPLICATE_WEBHOOK_SECRET`，需要在 [replicate](https://replicate.com/account/webhook) 生成
  - Replicate Webhook 需要指定详细地址，由于开发环境和生产环境的服务器地址不同，所以使用环境变量 `REPLICATE_WEBHOOK_BASE_URL` 配置host，本地填Forwarded Address暴露的地址(如图)，生产环境填写生产环境的地址。
  ![forwarded-address.png](/public/readme/forwarded-address.png)
  - 在 `i18n/messages` 下面，每个语言文件夹里都添加一个新的同名文件，然后在 `i18n/messages/request.ts` 引入新文件
  - 在 Curosr 选中 `app/[locale]/(gen-image)` 任一功能模块、选中 `config/featureList.ts`，选中在 `i18n/messages` 语言文件夹里新建的文件，同时将要使用的AI模型文档链接（如：[restore-image](https://replicate.com/flux-kontext-apps/restore-image)、[restore-image-api](https://replicate.com/flux-kontext-apps/restore-image/api/api-reference)）复制到 Cursor 对话框，要求AI根据已有功能开发新页面，先完成AI功能区，并补充多语言包到 json 文件内。
  - 要求AI根据已有功能模块，设计一个相同的页面结构，并完成SEO文案
5. 更新网站素材和元信息
  - logo：[https://www.logo.surf/](https://www.logo.surf/), [https://ray.so/icon](https://ray.so/icon?q=), [https://icon.kitchen/](https://icon.kitchen/)
  - OG Image: [https://ogimage.click](https://ogimage.click)
  - 网站元信息配置：`lib/metadata.ts`，默认为通用配置，支持不同语言展示不同的元信息

## 技术支持

如遇到任何问题，请联系我支持：

> - Discord: https://discord.gg/R7bUxWKRqZ
> - 邮箱：hi@nexty.dev
> - 推特（中文）：https://x.com/weijunext
> - 微信：bigye_chengpu

