# Nexty-Flux-Kontext - NextyとFlux Kontextベースの AI画像生成ウェブサイトテンプレート

このリポジトリは、フルスタックテンプレート[Nexty](https://github.com/WeNextDev/nexty.dev)と[Flux Kontext](https://replicate.com/search?query=flux-kontext)をベースに構築されたAI画像生成ウェブサイトテンプレートです。

- 🚀 Nextyテンプレートを取得 👉: [nexty](https://github.com/WeNextDev/nexty.dev)  
- 🚀 Nexty - Flux Kontextテンプレートを取得 👉: [nexty-flux-kontext](https://github.com/wenextdev/nexty-flux-kontext)  
- 🚀 Nextyドキュメント 👉: https://nexty.dev/ja/docs

## 機能

- 汎用ランディングページ
- 独立した価格設定ページ
  - 月額、年額、一回払いに対応
  - 支払いを促進するバナーを提供
  - SEOコンテンツセクションを提供
- AI画像生成機能（コードパス：`app/[locale]/(gen-image)/`）
  - 新規ユーザー向け無料クレジット（環境変数`NEXT_PUBLIC_WELCOME_CREDITS`）
  - 年間サブスクリプションユーザーの月次クレジットリセット
  - Flux Kontextは英語プロンプトのみをサポートするため、テンプレートは自動プロンプト翻訳機能を提供（環境変数`IMAGE_PROMPT_TRANSLATE_PROVIDER`、`IMAGE_PROMPT_TRANSLATE_MODEL`）
  - Replicate Webhookタスクフローベースで、フロントエンドは待機不要
  - AI機能ページで最近の画像生成履歴を表示可能
- 新しいダッシュボードモジュール
  - ユーザーは画像生成履歴を表示可能
  - 管理者は全画像リストを表示可能

対応AIモデル：
- [flux-kontext-pro](https://replicate.com/black-forest-labs/flux-kontext-pro)、[flux-kontext-max](https://replicate.com/black-forest-labs/flux-kontext-max)
- [multi-image-kontext-pro](https://replicate.com/flux-kontext-apps/multi-image-kontext-pro)、[multi-image-kontext-max](https://replicate.com/flux-kontext-apps/multi-image-kontext-max)

## 開発手順

1. [Nextyドキュメント](https://nexty.dev/ja/docs)に従って必要な設定と起動手順を完了してください。Nextyをベースにしているため、Nextyの起動に必要な手順はすべてこのプロジェクトでも必要です
2. CursorまたはVSCodeで`Nexty AI Image`と`nexty.dev`をグローバル検索し、ブランド名を自分の製品名に変更し、`config/site.ts`を確認して、ウェブサイト情報を更新してください
3. Stripeで製品価格を作成し、Dashboard/pricesで価格カードを更新し、**Stripe Price IDを自分のものに変更する必要があります**、その後支払いフローをテストしてください
4. 新機能の追加：
  - AI機能設定`config/featureList.ts`を更新
  - 新しいAI機能設定で、パラメータが既存機能と異なる場合は、`app/api/ai/replicate/flux-kontent/submit/route.ts`のサーバーサイドロジックが互換性があるかどうか確認（一般的には互換性があります）、これは汎用処理インターフェースです
  - Flux Kontextは英語プロンプトのみをサポートしますが、ユーザーに英語入力を強制することはできないため、このテンプレートはプロンプト翻訳機能を提供します。コードは`app/api/ai/replicate/flux-kontent/submit/prompt-optimizer.ts`にあります。これも汎用処理方法で、コードを変更する必要はありません。プロンプト翻訳が要件に合うかどうかを確認し、お好みのAIモデルを選択して環境変数を設定してください（`IMAGE_PROMPT_TRANSLATE_PROVIDER`、`IMAGE_PROMPT_TRANSLATE_MODEL`、および選択したプラットフォームのAPI_KEY）
  - このプロジェクトはReplicate Webhookを使用してコアワークフローを実装しています。環境変数`REPLICATE_WEBHOOK_SECRET`を設定する必要があり、これは[replicate](https://replicate.com/account/webhook)で生成してください
  - Replicate Webhookは具体的なアドレスの指定が必要です。開発環境と本番環境でサーバーアドレスが異なるため、環境変数`REPLICATE_WEBHOOK_BASE_URL`でホストを設定します。ローカル開発ではForwarded Addressで公開されたアドレス（画像参照）を使用し、本番環境では本番ドメインアドレスを使用してください。
   ![forwarded-address.png](/public/readme/forwarded-address.png)
  - `i18n/messages`の下で、各言語フォルダに同名の新しいファイルを追加し、その後`i18n/messages/request.ts`で新しいファイルをインポートします
  - Cursorで`app/[locale]/(gen-image)`の任意の機能モジュールを選択し、`config/featureList.ts`を選択し、`i18n/messages`言語フォルダ内に新しく作成したファイルを選択します。同時に使用予定のAIモデルドキュメントリンク（例：[restore-image](https://replicate.com/flux-kontext-apps/restore-image)、[restore-image-api](https://replicate.com/flux-kontext-apps/restore-image/api/api-reference)）をCursorダイアログにコピーし、既存の機能に基づいて新しいページを開発するようAIに要求します。まずAI機能エリアを完成させ、多言語パッケージをjsonファイルに補完します。
  - 既存機能モジュールに基づいて同じページ構造を設計し、SEOコンテンツを完成させるようAIに依頼してください
5. ウェブサイト素材とメタ情報の更新
   - ロゴ：[https://www.logo.surf/](https://www.logo.surf/)、[https://ray.so/icon](https://ray.so/icon?q=)、[https://icon.kitchen/](https://icon.kitchen/)
   - OG Image：[https://ogimage.click](https://ogimage.click)
   - ウェブサイトメタ情報設定：`lib/metadata.ts`、デフォルトは汎用設定、異なる言語で異なるメタ情報を表示することをサポート

## 技術サポート

問題が発生した場合は、サポートまでお問い合わせください：

> - Discord: https://discord.gg/R7bUxWKRqZ
> - Email: hi@nexty.dev
> - Twitter: https://x.com/judewei_dev